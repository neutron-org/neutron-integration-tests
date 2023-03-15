import MerkleTree from 'merkletreejs';
import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import { NeutronContract } from '../../helpers/types';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import crypto from 'crypto';

const sha256 = (x: string): Buffer => {
  const hash = crypto.createHash('sha256');
  hash.update(x);
  return hash.digest();
};

class Airdrop {
  private tree: MerkleTree;

  constructor(accounts: Array<{ address: string; amount: string }>) {
    const leaves = accounts.map((a) => sha256(a.address + a.amount));
    this.tree = new MerkleTree(leaves, sha256, { sort: true });
  }

  public getMerkleRoot(): string {
    return this.tree.getHexRoot().replace('0x', '');
  }

  public getMerkleProof(account: {
    address: string;
    amount: string;
  }): string[] {
    return this.tree
      .getHexProof(sha256(account.address + account.amount))
      .map((v) => v.replace('0x', ''));
  }
}

const getTimestamp = (secondsFromNow: number): string =>
  (
    BigInt(Date.now()) * BigInt(1000000) +
    BigInt(secondsFromNow * 1000000 * 1000)
  ).toString();

const waitTill = (timestamp: string): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, Number(BigInt(timestamp) / BigInt(1000000)) - Date.now());
  });

describe('Neutron / TGE / Airdrop', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cmSecond: CosmosWrapper;
  const codeIds: Record<string, string> = {};
  const contractAddresses: Record<string, string> = {};
  let airdrop: InstanceType<typeof Airdrop>;
  const times: Record<string, string> = {};
  let reserveAddress: string;

  beforeAll(async () => {
    times.airdropStart = getTimestamp(30);
    times.airdropVestingStart = getTimestamp(40);
    times.creditsWhenWithdrawable = getTimestamp(50);
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    reserveAddress =
      testState.wallets.qaNeutronThree.genQaWal1.address.toString();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutron.genQaWal1,
      NEUTRON_DENOM,
    );
    cmSecond = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutronThree.genQaWal1,
      NEUTRON_DENOM,
    );
    const accounts = [
      {
        address: testState.wallets.neutron.demo1.address.toString(),
        amount: '100000',
      },
      {
        address: testState.wallets.neutron.demo2.address.toString(),
        amount: '200000',
      },
      {
        address: cm.wallet.address.toString(),
        amount: '300000',
      },
      {
        address: cmSecond.wallet.address.toString(),
        amount: '100000',
      },
    ];
    airdrop = new Airdrop(accounts);
  });

  describe('Deploy', () => {
    it('should store contracts', async () => {
      for (const contract of ['TGE_AUCTION', 'TGE_CREDITS', 'TGE_AIRDROP']) {
        const codeId = parseInt(await cm.storeWasm(NeutronContract[contract]));
        expect(codeId).toBeGreaterThan(0);
        codeIds[contract] = codeId.toString();
      }
    });
    it('should instantiate credits contract', async () => {
      const res = await cm.instantiate(
        codeIds['TGE_CREDITS'],
        JSON.stringify({
          dao_address: cm.wallet.address.toString(),
        }),
        'credits',
      );
      expect(res).toBeTruthy();
      contractAddresses['TGE_CREDITS'] = res[0]._contract_address;
    });
    it('should instantiate airdrop contract', async () => {
      const initParams = {
        credits_address: contractAddresses['TGE_CREDITS'],
        reserve_address: reserveAddress,
        merkle_root: airdrop.getMerkleRoot(),
        airdrop_start: times.airdropStart,
        vesting_start: times.airdropVestingStart,
        vesting_duration_seconds: 25,
        total_amount: '100000000',
        hrp: 'neutron',
      };
      const res = await cm.instantiate(
        codeIds['TGE_AIRDROP'],
        JSON.stringify(initParams),
        'airdrop',
      );
      expect(res).toBeTruthy();
      contractAddresses['TGE_AIRDROP'] = res[0]._contract_address;
    });
    it('should set airdrop address for credits contract', async () => {
      const res = await cm.executeContract(
        contractAddresses['TGE_CREDITS'],
        JSON.stringify({
          update_config: {
            config: {
              airdrop_address: contractAddresses['TGE_AIRDROP'],
              when_withdrawable: times.creditsWhenWithdrawable,
            },
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
  });

  describe('Airdrop', () => {
    let proofMain: string[];
    let proofSecond: string[];
    beforeAll(() => {
      proofMain = airdrop.getMerkleProof({
        address: cm.wallet.address.toString(),
        amount: '300000',
      });
      proofSecond = airdrop.getMerkleProof({
        address: cmSecond.wallet.address.toString(),
        amount: '100000',
      });
    });
    it('should not claim before airdrop start', async () => {
      const payload = {
        claim: {
          address: cm.wallet.address.toString(),
          amount: '300000',
          proof: proofMain,
        },
      };
      await expect(
        cm.executeContract(
          contractAddresses['TGE_AIRDROP'],
          JSON.stringify(payload),
        ),
      ).rejects.toThrow(/Airdrop begins at/);
    });
    it('should not pause before airdrop start', async () => {
      const payload = {
        pause: {},
      };
      await expect(
        cm.executeContract(
          contractAddresses['TGE_AIRDROP'],
          JSON.stringify(payload),
        ),
      ).rejects.toThrow(/Airdrop begins at/);
    });
    it('should not claim before airdrop mint', async () => {
      await waitTill(times.airdropStart);
      const payload = {
        claim: {
          address: cm.wallet.address.toString(),
          amount: '300000',
          proof: proofMain,
        },
      };
      await expect(
        cm.executeContract(
          contractAddresses['TGE_AIRDROP'],
          JSON.stringify(payload),
        ),
      ).rejects.toThrow(); //TODO: check error message
    });
    it('should return is claimed false', async () => {
      const res = await cm.queryContract<{ is_claimed: boolean }>(
        contractAddresses['TGE_AIRDROP'],
        {
          is_claimed: {
            address: cm.wallet.address.toString(),
          },
        },
      );
      expect(res).toEqual({ is_claimed: false });
    });
    it('should mint credits CW20 tokens', async () => {
      const res = await cm.executeContract(
        contractAddresses['TGE_CREDITS'],
        JSON.stringify({
          mint: {},
        }),
        [{ amount: '1000000', denom: NEUTRON_DENOM }],
      );
      expect(res.code).toEqual(0);
    });
    it('should not claim airdrop more than needed', async () => {
      const proofs = airdrop.getMerkleProof({
        address: cm.wallet.address.toString(),
        amount: '300000',
      });
      const payload = {
        claim: {
          address: cm.wallet.address.toString(),
          amount: '400000',
          proof: proofs,
        },
      };
      await expect(
        cm.executeContract(
          contractAddresses['TGE_AIRDROP'],
          JSON.stringify(payload),
        ),
      ).rejects.toThrow(/Verification failed/);
    });
    it('should not claim airdrop with wrong proof', async () => {
      const proofs = airdrop.getMerkleProof({
        address: testState.wallets.neutron.demo2.address.toString(),
        amount: '200000',
      });
      const payload = {
        claim: {
          address: cm.wallet.address.toString(),
          amount: '400000',
          proof: proofs,
        },
      };
      await expect(
        cm.executeContract(
          contractAddresses['TGE_AIRDROP'],
          JSON.stringify(payload),
        ),
      ).rejects.toThrow(/Verification failed/);
    });
    it('should claim airdrop', async () => {
      const proofs = airdrop.getMerkleProof({
        address: cm.wallet.address.toString(),
        amount: '300000',
      });
      const payload = {
        claim: {
          address: cm.wallet.address.toString(),
          amount: '300000',
          proof: proofs,
        },
      };
      const res = await cm.executeContract(
        contractAddresses['TGE_AIRDROP'],
        JSON.stringify(payload),
      );
      expect(res.code).toEqual(0);
    });
    it('should return is claimed true', async () => {
      const res = await cm.queryContract<{ is_claimed: boolean }>(
        contractAddresses['TGE_AIRDROP'],
        {
          is_claimed: {
            address: cm.wallet.address.toString(),
          },
        },
      );
      expect(res).toEqual({ is_claimed: true });
    });
    it('should not claim twice', async () => {
      const proofs = airdrop.getMerkleProof({
        address: cm.wallet.address.toString(),
        amount: '300000',
      });
      const payload = {
        claim: {
          address: cm.wallet.address.toString(),
          amount: '300000',
          proof: proofs,
        },
      };
      await expect(
        cm.executeContract(
          contractAddresses['TGE_AIRDROP'],
          JSON.stringify(payload),
        ),
      ).rejects.toThrow(/Already claimed/);
    });
    it('should return correct balance', async () => {
      const res = await cm.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: cm.wallet.address.toString(),
          },
        },
      );
      expect(res).toEqual({ balance: '300000' });
    });
    it('should return is_pause false', async () => {
      const res = await cm.queryContract<{ is_paused: boolean }>(
        contractAddresses['TGE_AIRDROP'],
        {
          is_paused: {},
        },
      );
      expect(res).toEqual({ is_paused: false });
    });
    it('should be able to pause', async () => {
      const payload = {
        pause: {},
      };
      const res = await cm.executeContract(
        contractAddresses['TGE_AIRDROP'],
        JSON.stringify(payload),
      );
      expect(res.code).toEqual(0);
    });
    it('should return is_pause true', async () => {
      const res = await cm.queryContract<{ is_paused: boolean }>(
        contractAddresses['TGE_AIRDROP'],
        {
          is_paused: {},
        },
      );
      expect(res).toEqual({ is_paused: true });
    });
    it('should not claim bc of pause', async () => {
      const proofs = airdrop.getMerkleProof({
        address: cm.wallet.address.toString(),
        amount: '300000',
      });
      const payload = {
        claim: {
          address: cm.wallet.address.toString(),
          amount: '300000',
          proof: proofs,
        },
      };
      await expect(
        cm.executeContract(
          contractAddresses['TGE_AIRDROP'],
          JSON.stringify(payload),
        ),
      ).rejects.toThrow(/Airdrop is paused/);
    });
    it('should be able to resume', async () => {
      const payload = {
        resume: {},
      };
      const res = await cm.executeContract(
        contractAddresses['TGE_AIRDROP'],
        JSON.stringify(payload),
      );
      expect(res.code).toEqual(0);
    });
    it('should be able to claim after resume', async () => {
      const payload = {
        claim: {
          address: cmSecond.wallet.address.toString(),
          amount: '100000',
          proof: proofSecond,
        },
      };
      const res = await cmSecond.executeContract(
        contractAddresses['TGE_AIRDROP'],
        JSON.stringify(payload),
        [],
      );
      expect(res.code).toEqual(0);
    });
    it('should return correct total claimed', async () => {
      const res = await cm.queryContract<{ total_claimed: string }>(
        contractAddresses['TGE_AIRDROP'],
        {
          total_claimed: {},
        },
      );
      expect(res).toEqual({ total_claimed: '400000' });
    });
    it('should not be able to withdraw all before end', async () => {
      await expect(
        cm.executeContract(
          contractAddresses['TGE_AIRDROP'],
          JSON.stringify({
            withdraw_all: {},
          }),
          [],
        ),
      ).rejects.toThrow(
        /withdraw_all is unavailable, it will become available at/,
      );
    });
    it('should be able to withdraw all', async () => {
      await waitTill(
        (
          BigInt(times.airdropVestingStart) + BigInt(30 * 1000000 * 1000)
        ).toString(),
      );
      const availableBalanceCNTRN = await cm.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: contractAddresses['TGE_AIRDROP'],
          },
        },
      );
      const reserveBalanceNTRN = (
        await cm.queryBalances(reserveAddress)
      ).balances.find((b) => b.denom === NEUTRON_DENOM)?.amount;
      const res = await cm.executeContract(
        contractAddresses['TGE_AIRDROP'],
        JSON.stringify({
          withdraw_all: {},
        }),
        [],
      );
      expect(res.code).toEqual(0);

      const availableBalanceCNTRNAfter = await cm.queryContract<{
        balance: string;
      }>(contractAddresses['TGE_CREDITS'], {
        balance: {
          address: contractAddresses['TGE_AIRDROP'],
        },
      });
      const reserveBalanceNTRNAfter = (
        await cm.queryBalances(reserveAddress)
      ).balances.find((b) => b.denom === NEUTRON_DENOM)?.amount;
      expect(availableBalanceCNTRNAfter.balance).toEqual('0');
      expect(
        parseInt(reserveBalanceNTRNAfter || '0') -
          parseInt(reserveBalanceNTRN || '0'),
      ).toEqual(parseInt(availableBalanceCNTRN.balance));
    });
  });
});
