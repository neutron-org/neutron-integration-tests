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

describe('Neutron / TGE', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  const codeIds: Record<string, string> = {};
  const contractAddresses: Record<string, string> = {};
  let airdrop: InstanceType<typeof Airdrop>;
  const times: Record<string, string> = {};

  beforeAll(async () => {
    times.airdropStart = getTimestamp(30);
    times.airdropVestingStart = getTimestamp(40);
    times.creditsWhenWithdrawable = getTimestamp(50);
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutron.genQaWal1,
      NEUTRON_DENOM,
    );

    airdrop = new Airdrop([
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
    ]);
  });

  describe('Deploy', () => {
    it('should store contracts', async () => {
      for (const contract of [
        'TGE_LOCKDROP',
        'TGE_AUCTION',
        'TGE_CREDITS',
        'TGE_AIRDROP',
      ]) {
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
        reserve_address: cm.wallet.address.toString(),
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
    let proofs: string[];
    beforeAll(() => {
      proofs = airdrop.getMerkleProof({
        address: cm.wallet.address.toString(),
        amount: '300000',
      });
    });
    it('should not claim before airdrop start', async () => {
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
      ).rejects.toThrow(/Airdrop begins at/);
    });
    it('should not claim before airdrop mint', async () => {
      await waitTill(times.airdropStart);
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
      ).rejects.toThrow(); //TODO: check error message
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
      ).rejects.toThrow(/1/);
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
      ).rejects.toThrow(/1/);
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
  });
});
