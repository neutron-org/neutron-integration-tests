import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { inject } from 'vitest';
import { LocalState, createWalletWrapper } from '../../helpers/localState';
import { NeutronContract, CodeId } from '@neutron-org/neutronjsplus/dist/types';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';

const config = require('../../config.json');

const getTimestamp = (secondsFromNow: number): number =>
  (Date.now() / 1000 + secondsFromNow) | 0;

describe('Neutron / TGE / Credits', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: WalletWrapper;
  let airdropMock: WalletWrapper;
  let lockdropMock: WalletWrapper;
  let neutronAccount2: WalletWrapper;
  const contractAddresses: Record<string, string> = {};
  let airdropAddress: string;
  let lockdropAddress: string;
  let neutronAccount2Address: string;

  beforeAll(async () => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics);
    await testState.init();
    airdropAddress = testState.wallets.qaNeutronThree.qa.address;
    lockdropAddress = testState.wallets.qaNeutronFour.qa.address;

    neutronAccount2Address = testState.wallets.qaNeutronFive.qa.address;

    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronAccount1 = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.qa,
    );
    neutronAccount2 = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFive.qa,
    );
    airdropMock = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronThree.qa,
    );
    lockdropMock = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.qa,
    );
  });

  describe('Deploy', () => {
    let codeId: CodeId;
    it('should store contract', async () => {
      codeId = await neutronAccount1.storeWasm(NeutronContract['TGE_CREDITS']);
      expect(codeId).toBeGreaterThan(0);
    });
    it('should instantiate credits contract', async () => {
      const res = await neutronAccount1.instantiateContract(
        codeId,
        {
          dao_address: neutronAccount1.wallet.address,
        },
        'credits',
      );
      expect(res).toBeTruthy();
      contractAddresses['TGE_CREDITS'] = res;
    });
    it('should set configuration', async () => {
      const res = await neutronAccount1.executeContract(
        contractAddresses['TGE_CREDITS'],
        {
          update_config: {
            config: {
              airdrop_address: airdropAddress,
              lockdrop_address: lockdropAddress,
              when_withdrawable: getTimestamp(50),
            },
          },
        },
      );
      expect(res.code).toBe(0);
    });
  });
  describe('Mint', () => {
    it('should not be able to mint without funds', async () => {
      await expect(
        neutronAccount1.executeContract(contractAddresses['TGE_CREDITS'], {
          mint: {},
        }),
      ).rejects.toThrow(/No funds supplied/);
    });
    it('should be able to mint with funds', async () => {
      const startBalance = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses['TGE_CREDITS'], {
        balance: {
          address: airdropAddress,
        },
      });
      const res = await neutronAccount1.executeContract(
        contractAddresses['TGE_CREDITS'],
        {
          mint: {},
        },
        [
          {
            amount: '100000000',
            denom: NEUTRON_DENOM,
          },
        ],
      );
      expect(res.code).toBe(0);
      const endBalance = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses['TGE_CREDITS'], {
        balance: {
          address: airdropAddress,
        },
      });
      expect(endBalance.balance).toBe(
        (parseInt(startBalance.balance) + 100000000).toString(),
      );
    });
  });
  describe('Burn', () => {
    it('should not be able to burn by non airdrop address ', async () => {
      await expect(
        neutronAccount1.executeContract(contractAddresses['TGE_CREDITS'], {
          burn: {
            amount: '1000000',
          },
        }),
      ).rejects.toThrow(/Unauthorized/);
    });
    it('should allow airdrop address to burn', async () => {
      const balanceBefore = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses['TGE_CREDITS'], {
        balance: {
          address: airdropAddress,
        },
      });
      const balanceNtrnBefore = await neutronChain.queryDenomBalance(
        airdropAddress,
        NEUTRON_DENOM,
      );
      const res = await airdropMock.executeContract(
        contractAddresses['TGE_CREDITS'],
        {
          burn: {
            amount: '1000000',
          },
        },
      );
      expect(res.code).toBe(0);
      const balanceAfter = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses['TGE_CREDITS'], {
        balance: {
          address: airdropAddress,
        },
      });
      const balanceNtrnAfter = await neutronChain.queryDenomBalance(
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
        neutronAccount1.executeContract(contractAddresses['TGE_CREDITS'], {
          burn_from: {
            amount: '1000000',
            owner: airdropAddress,
          },
        }),
      ).rejects.toThrow(/Unauthorized/);
    });
    it('should allow lockdrop address to burn from', async () => {
      const balanceBefore = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses['TGE_CREDITS'], {
        balance: {
          address: airdropAddress,
        },
      });
      const balanceNtrnBefore = await neutronChain.queryDenomBalance(
        airdropAddress,
        NEUTRON_DENOM,
      );
      const res = await lockdropMock.executeContract(
        contractAddresses['TGE_CREDITS'],
        {
          burn_from: {
            amount: '1000000',
            owner: airdropAddress,
          },
        },
      );
      expect(res.code).toBe(0);
      const balanceAfter = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses['TGE_CREDITS'], {
        balance: {
          address: airdropAddress,
        },
      });
      const balanceNtrnAfter = await neutronChain.queryDenomBalance(
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
    it('should not be able to vest without funds', async () => {
      await expect(
        airdropMock.executeContract(contractAddresses['TGE_CREDITS'], {
          add_vesting: {
            address: neutronAccount2Address,
            amount: '1000000',
            start_time: startTime,
            duration: 10,
          },
        }),
      ).rejects.toThrow(/No funds supplied/);
    });
    it('should transfer some to another address', async () => {
      const res = await airdropMock.executeContract(
        contractAddresses['TGE_CREDITS'],
        {
          transfer: {
            amount: '1000000',
            recipient: neutronAccount2Address,
          },
        },
      );
      expect(res.code).toBe(0);
    });
    it('should be able to vest', async () => {
      const res = await airdropMock.executeContract(
        contractAddresses['TGE_CREDITS'],
        {
          add_vesting: {
            address: neutronAccount2Address,
            amount: '1000000',
            start_time: startTime,
            duration: 10,
          },
        },
      );
      expect(res.code).toBe(0);
    });
    it('should return vesting info', async () => {
      const res = await neutronChain.queryContract<{
        allocated_amount: string;
        schedule: {
          cliff: number;
          duration: number;
          start_time: number;
        };
      }>(contractAddresses['TGE_CREDITS'], {
        allocation: {
          address: neutronAccount2Address,
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
        neutronAccount2.executeContract(contractAddresses['TGE_CREDITS'], {
          withdraw: {},
        }),
      ).rejects.toThrow(/Too early to claim/);
    });
    it('should return withdrawable amount', async () => {
      await waitSeconds(15);
      const res = await neutronChain.queryContract<{ amount: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          withdrawable_amount: {
            address: neutronAccount2Address,
          },
        },
      );
      expect(res).toEqual({ amount: '1000000' });
    });

    it('should be able to withdraw after vesting', async () => {
      await waitSeconds(10);
      const balanceNtrnBefore = await neutronChain.queryDenomBalance(
        neutronAccount2Address,
        NEUTRON_DENOM,
      );
      const res = await neutronAccount2.executeContract(
        contractAddresses['TGE_CREDITS'],
        {
          withdraw: {},
        },
      );
      expect(res.code).toBe(0);
      const balance = await neutronChain.queryContract<{ balance: string }>(
        contractAddresses['TGE_CREDITS'],
        {
          balance: {
            address: neutronAccount2Address,
          },
        },
      );
      expect(balance.balance).toBe('0');
      const balanceNtrnAfter = await neutronChain.queryDenomBalance(
        neutronAccount2Address,
        NEUTRON_DENOM,
      );
      expect(balanceNtrnAfter - balanceNtrnBefore).toBe(990000); //fees you know
    });
  });
});
