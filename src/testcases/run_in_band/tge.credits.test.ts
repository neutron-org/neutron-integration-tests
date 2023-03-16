import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import { NeutronContract } from '../../helpers/types';
import { wait } from '../../helpers/wait';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';

const getTimestamp = (secondsFromNow: number): string =>
  (
    BigInt(Date.now()) * BigInt(1000000) +
    BigInt(secondsFromNow * 1000000 * 1000)
  ).toString();

describe('Neutron / TGE / Credits', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cmAirdrop: CosmosWrapper;
  let cmLockdrop: CosmosWrapper;
  let cmOneMore: CosmosWrapper;
  const contractAddresses: Record<string, string> = {};
  let airdropAddress: string;
  let lockdropAddress: string;
  let oneMoreAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    airdropAddress =
      testState.wallets.qaNeutronThree.genQaWal1.address.toString();
    lockdropAddress =
      testState.wallets.qaNeutronFour.genQaWal1.address.toString();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutron.genQaWal1,
      NEUTRON_DENOM,
    );
    cmAirdrop = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutronThree.genQaWal1,
      NEUTRON_DENOM,
    );
    cmLockdrop = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutronFour.genQaWal1,
      NEUTRON_DENOM,
    );
    oneMoreAddress =
      testState.wallets.qaNeutronFive.genQaWal1.address.toString();
    cmOneMore = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutronFive.genQaWal1,
      NEUTRON_DENOM,
    );
  });

  describe('Deploy', () => {
    let codeId: number;
    it('should store contract', async () => {
      codeId = parseInt(await cm.storeWasm(NeutronContract['TGE_CREDITS']));
      expect(codeId).toBeGreaterThan(0);
    });
    it('should instantiate credits contract', async () => {
      const res = await cm.instantiate(
        codeId.toString(),
        JSON.stringify({
          dao_address: cm.wallet.address.toString(),
        }),
        'credits',
      );
      expect(res).toBeTruthy();
      contractAddresses['TGE_CREDITS'] = res[0]._contract_address;
    });
    it('should set configuration', async () => {
      const res = await cm.executeContract(
        contractAddresses['TGE_CREDITS'],
        JSON.stringify({
          update_config: {
            config: {
              airdrop_address: airdropAddress,
              lockdrop_address: lockdropAddress,
              when_withdrawable: getTimestamp(30),
            },
          },
        }),
      );
      expect(res.code).toBe(0);
    });
  });
  describe('Mint', () => {
    it('should not be able to mint without funds', async () => {
      await expect(
        cm.executeContract(
          contractAddresses['TGE_CREDITS'],
          JSON.stringify({
            mint: {},
          }),
        ),
      ).rejects.toThrow(/No funds supplied/);
    });
    it('should be able to mint with funds', async () => {
      const startBalance = await cm.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: airdropAddress,
          },
        },
      );
      const res = await cm.executeContract(
        contractAddresses['TGE_CREDITS'],
        JSON.stringify({
          mint: {},
        }),
        [
          {
            amount: '100000000',
            denom: NEUTRON_DENOM,
          },
        ],
      );
      expect(res.code).toBe(0);
      const endBalance = await cm.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: airdropAddress,
          },
        },
      );
      expect(endBalance.balance).toBe(
        (parseInt(startBalance.balance) + 100000000).toString(),
      );
    });
  });
  describe('Burn', () => {
    it('should not be able to burn by non airdrop address ', async () => {
      await expect(
        cm.executeContract(
          contractAddresses['TGE_CREDITS'],
          JSON.stringify({
            burn: {
              amount: '1000000',
            },
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });
    it('should allow airdrop address to burn', async () => {
      const balanceBefore = await cm.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: airdropAddress,
          },
        },
      );
      const balanceNtrnBefore = await cm.queryDenomBalance(
        airdropAddress,
        NEUTRON_DENOM,
      );
      const res = await cmAirdrop.executeContract(
        contractAddresses['TGE_CREDITS'],
        JSON.stringify({
          burn: {
            amount: '1000000',
          },
        }),
      );
      expect(res.code).toBe(0);
      const balanceAfter = await cmAirdrop.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: airdropAddress,
          },
        },
      );
      const balanceNtrnAfter = await cm.queryDenomBalance(
        airdropAddress,
        NEUTRON_DENOM,
      );
      expect(balanceAfter.balance).toBe(
        (parseInt(balanceBefore.balance) - 1000000).toString(),
      );
      expect(balanceNtrnAfter).toBe(balanceNtrnBefore + 1000000 - 10000); //fees you know
    });
  });
  describe('Burn from', () => {
    it('should not be able to burn from by non lockdrop address ', async () => {
      await expect(
        cm.executeContract(
          contractAddresses['TGE_CREDITS'],
          JSON.stringify({
            burn_from: {
              amount: '1000000',
              owner: airdropAddress,
            },
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });
    it('should allow lockdrop address to burn from', async () => {
      const balanceBefore = await cm.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: airdropAddress,
          },
        },
      );
      const balanceNtrnBefore = await cm.queryDenomBalance(
        airdropAddress,
        NEUTRON_DENOM,
      );
      const res = await cmLockdrop.executeContract(
        contractAddresses['TGE_CREDITS'],
        JSON.stringify({
          burn_from: {
            amount: '1000000',
            owner: airdropAddress,
          },
        }),
      );
      expect(res.code).toBe(0);
      const balanceAfter = await cm.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: airdropAddress,
          },
        },
      );
      const balanceNtrnAfter = await cm.queryDenomBalance(
        airdropAddress,
        NEUTRON_DENOM,
      );
      expect(balanceAfter.balance).toBe(
        (parseInt(balanceBefore.balance) - 1000000).toString(),
      );
      expect(balanceNtrnAfter - balanceNtrnBefore).toBe(1000000); //fees you know
    });
  });
  describe('Vest', () => {
    const startTime = (Date.now() / 1000 + 10) | 0;
    it('should be able to vest', async () => {
      const res = await cmAirdrop.executeContract(
        contractAddresses['TGE_CREDITS'],
        JSON.stringify({
          add_vesting: {
            address: oneMoreAddress,
            amount: '1000000',
            start_time: startTime,
            duration: 10,
          },
        }),
      );
      expect(res.code).toBe(0);
    });
    it('should return vesting info', async () => {
      const res = await cm.queryContract<{
        allocated_amount: string;
        schedule: {
          cliff: number;
          duration: number;
          start_time: number;
        };
      }>(contractAddresses['TGE_CREDITS'], {
        allocation: {
          address: oneMoreAddress,
        },
      });
      expect(res).toEqual({
        allocated_amount: '1000000',
        schedule: {
          cliff: 0,
          duration: 10,
          start_time: startTime,
        },
        withdrawn_amount: '0',
      });
    });
    it('should not be able to withdraw before vesting', async () => {
      await expect(
        cmOneMore.executeContract(
          contractAddresses['TGE_CREDITS'],
          JSON.stringify({
            withdraw: {},
          }),
        ),
      ).rejects.toThrow(/Too early to claim/);
    });
    it('should transfer some to another address', async () => {
      const res = await cmAirdrop.executeContract(
        contractAddresses['TGE_CREDITS'],
        JSON.stringify({
          transfer: {
            amount: '500000',
            recipient: oneMoreAddress,
          },
        }),
      );
      expect(res.code).toBe(0);
    });
    it('should return withdrawable amount', async () => {
      await wait(15);
      const res = await cmOneMore.queryContract<{ amount: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          withdrawable_amount: {
            address: oneMoreAddress,
          },
        },
      );
      expect(res).toEqual({ amount: '500000' });
    });

    it('should be able to withdraw after vesting', async () => {
      await wait(10);
      const balanceNtrnBefore = await cm.queryDenomBalance(
        oneMoreAddress,
        NEUTRON_DENOM,
      );
      const res = await cmOneMore.executeContract(
        contractAddresses['TGE_CREDITS'],
        JSON.stringify({
          withdraw: {},
        }),
      );
      expect(res.code).toBe(0);
      const balance = await cm.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: oneMoreAddress,
          },
        },
      );
      expect(balance.balance).toBe('0');
      const balanceNtrnAfter = await cm.queryDenomBalance(
        oneMoreAddress,
        NEUTRON_DENOM,
      );
      expect(balanceNtrnAfter - balanceNtrnBefore).toBe(490000); //fees you know
    });
  });
});
