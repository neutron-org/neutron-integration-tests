import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import {
  cosmosWrapper,
  IBC_ATOM_DENOM,
  NEUTRON_DENOM,
  types,
  walletWrapper,
} from '@neutron-org/neutronjsplus';
import { createWalletWrapper } from '@neutron-org/neutronjsplus/dist/wallet_wrapper';
import { LocalState } from '../../helpers/localState';
import { inject } from 'vitest';

const INVESTORS_VESTING_CONTRACT_KEY = 'VESTING_INVESTORS';
const INVESTORS_VESTING_VAULT_CONTRACT_KEY = 'INVESTORS_VESTING_VAULT';
const CW20_BASE_CONTRACT_KEY = 'CW20_BASE';

const config = require('../../config.json');

describe('Neutron / TGE / Investors vesting vault', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let cmInstantiator: walletWrapper.WalletWrapper;
  let cmManager: walletWrapper.WalletWrapper;
  let cmUser1: walletWrapper.WalletWrapper;
  let cmUser2: walletWrapper.WalletWrapper;
  let contractAddresses: Record<string, string> = {};

  beforeAll(async () => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    cmInstantiator = await createWalletWrapper(
      neutronChain,
      await testState.randomWallet('neutron'),
    );
    cmManager = await createWalletWrapper(
      neutronChain,
      await testState.randomWallet('neutron'),
    );
    cmUser1 = await createWalletWrapper(
      neutronChain,
      await testState.randomWallet('neutron'),
    );
    cmUser2 = await createWalletWrapper(
      neutronChain,
      await testState.randomWallet('neutron'),
    );
    contractAddresses = await deployContracts(
      neutronChain,
      cmInstantiator,
      cmManager,
    );
  });

  describe('investors vesting vault', () => {
    test('check initial config', async () => {
      const vaultAddress =
        contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY];
      const config =
        await neutronChain.queryContract<InvestorsVestingVaultConfig>(
          vaultAddress,
          { config: {} },
        );
      expect(config).toMatchObject({
        vesting_contract_address:
          contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
        description: 'An investors vesting vault',
        owner: cmInstantiator.wallet.address,
        name: 'Investors vesting vault',
      });
    });

    test('make sure bonding is disabled', async () => {
      const vaultAddress =
        contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY];
      await expect(
        neutronChain.queryContract(vaultAddress, { list_bonders: {} }),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        neutronChain.queryContract(vaultAddress, {
          bonding_status: { address: 'addr' },
        }),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        cmInstantiator.executeContract(vaultAddress, { bond: {} }),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        cmInstantiator.executeContract(vaultAddress, {
          unbond: { amount: '1000' },
        }),
      ).rejects.toThrow(/Direct unbonding is not available for this contract/);
    });

    const totalVestingAmount = 500_000_000; // 500 NTRN in total
    const user1VestingAmount = Math.round(totalVestingAmount * (1 / 3));
    const user2VestingAmount = totalVestingAmount - user1VestingAmount;

    describe('prepare investors vesting vault', () => {
      test('create vesting accounts', async () => {
        await cmInstantiator.executeContract(
          contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
          {
            register_vesting_accounts: {
              vesting_accounts: [
                types.vestingAccount(cmUser1.wallet.address, [
                  types.vestingSchedule(
                    types.vestingSchedulePoint(
                      0,
                      user1VestingAmount.toString(),
                    ),
                  ),
                ]),
                types.vestingAccount(cmUser2.wallet.address, [
                  types.vestingSchedule(
                    types.vestingSchedulePoint(
                      0,
                      user2VestingAmount.toString(),
                    ),
                  ),
                ]),
              ],
            },
          },
          [{ denom: NEUTRON_DENOM, amount: totalVestingAmount.toString() }],
        );
      });
      test('check unclaimed amounts', async () => {
        await neutronChain.waitBlocks(1);
        const currentHeight = await neutronChain.getHeight();
        expect(
          await neutronChain.queryContract<UnclaimedAmountResponse>(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              historical_extension: {
                msg: {
                  unclaimed_amount_at_height: {
                    address: cmUser1.wallet.address,
                    height: currentHeight,
                  },
                },
              },
            },
          ),
        ).toBe(user1VestingAmount.toString());
        expect(
          await neutronChain.queryContract<UnclaimedAmountResponse>(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              historical_extension: {
                msg: {
                  unclaimed_amount_at_height: {
                    address: cmUser2.wallet.address,
                    height: currentHeight,
                  },
                },
              },
            },
          ),
        ).toBe(user2VestingAmount.toString());
      });
    });

    // vars for init state
    let user1VpInit: VotingPowerResponse;
    let user2VpInit: VotingPowerResponse;
    let totalVpInit: VotingPowerResponse;
    let heightInit: number;
    describe('voting power', () => {
      describe('check initial voting power', () => {
        test('total power at height', async () => {
          heightInit = await neutronChain.getHeight();
          totalVpInit = await totalPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            heightInit,
          );
          expect(+totalVpInit.power).toBe(totalVestingAmount);
        });
        test('user1 power at height', async () => {
          user1VpInit = await votingPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            cmUser1.wallet.address,
            heightInit,
          );
          expect(+user1VpInit.power).toBe(user1VestingAmount);
        });
        test('user2 power at height', async () => {
          user2VpInit = await votingPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            cmUser2.wallet.address,
            heightInit,
          );
          expect(+user2VpInit.power).toBe(user2VestingAmount);
        });
      });

      let heightBeforeClaim: number;
      describe('check voting power on claim', () => {
        const user1PartialClaim = Math.round(user1VestingAmount / 2);
        beforeAll(async () => {
          heightBeforeClaim = await neutronChain.getHeight();
          await neutronChain.waitBlocks(1); // so it's before claim for sure
        });
        test('user1 partial claim', async () => {
          await cmUser1.executeContract(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              claim: {
                amount: user1PartialClaim.toString(),
              },
            },
          );
          await neutronChain.waitBlocks(1);

          const res = await votingPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            cmUser1.wallet.address,
          );
          expect(+res.power).toBe(user1VestingAmount - user1PartialClaim);
        });
        test('total voting power check after user1 partial claim', async () => {
          const res = await totalPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
          );
          expect(+res.power).toBe(totalVestingAmount - user1PartialClaim);
        });

        test('user2 full claim', async () => {
          await cmUser2.executeContract(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              claim: {},
            },
          );
          await neutronChain.waitBlocks(1);

          const res = await votingPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            cmUser2.wallet.address,
          );
          expect(+res.power).toBe(0);
        });
        test('total voting power check after user2 full claim', async () => {
          const res = await totalPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
          );
          expect(+res.power).toBe(
            totalVestingAmount - user1PartialClaim - user2VestingAmount,
          );
        });

        test('user1 full claim', async () => {
          await cmUser1.executeContract(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              claim: {},
            },
          );
          await neutronChain.waitBlocks(1);

          const res = await votingPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            cmUser1.wallet.address,
          );
          expect(+res.power).toBe(0);
        });
        test('total voting power check after full claim', async () => {
          const res = await totalPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
          );
          expect(+res.power).toBe(0);
        });
      });

      describe('historical voting power', () => {
        // voting power at height = heightBeforeClaim should be the same as it was
        // at that point regardless of the following claim calls and TWAP changes.
        describe('check voting power before claim', () => {
          test('total power', async () => {
            const res = await totalPowerAtHeight(
              neutronChain,
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              heightBeforeClaim,
            );
            expect(+res.power).toBe(totalVestingAmount);
          });
          test('user1 power', async () => {
            const res = await votingPowerAtHeight(
              neutronChain,
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              cmUser1.wallet.address,
              heightBeforeClaim,
            );
            expect(+res.power).toBe(user1VestingAmount);
          });
          test('user2 power', async () => {
            const res = await votingPowerAtHeight(
              neutronChain,
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              cmUser2.wallet.address,
              heightBeforeClaim,
            );
            expect(+res.power).toBe(user2VestingAmount);
          });
        });
      });
    });

    /*
        Here we test how vesting account addition/removal affect current and historical voting power
        The flow is as follows:
        1. record voting power before vesting account additions/removals;
        2. add a vesting account for both user1 and user2 (endPoint=vestingAmount);
        3. record voting power and make sure it's changed properly;
        4. make sure historical voting power (cmp to init and p.1) hasn't changed;
        5. remove a vesting account for user2 (vestingAmount);
        6. make sure voting power has changed properly;
        7. make sure historical voting power (cmp to init, p.1 and p.3) hasn't changed;
      */
    describe('manage vesting accounts', () => {
      const vestingAmount = 500_000_000;
      // vars for state before voting accounts added
      let user1VpBeforeAdd: VotingPowerResponse;
      let user2VpBeforeAdd: VotingPowerResponse;
      let totalVpBeforeAdd: VotingPowerResponse;
      let heightBeforeAdd: number;
      // vars for state after voting accounts added
      let user1VpAfterAdd: VotingPowerResponse;
      let user2VpAfterAdd: VotingPowerResponse;
      let totalVpAfterAdd: VotingPowerResponse;
      let heightAfterAdd: number;
      describe('add vesting accounts', () => {
        test('record current voting power', async () => {
          heightBeforeAdd = await neutronChain.getHeight();
          user1VpBeforeAdd = await votingPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            cmUser1.wallet.address,
            heightBeforeAdd,
          );
          user2VpBeforeAdd = await votingPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            cmUser2.wallet.address,
            heightBeforeAdd,
          );
          totalVpBeforeAdd = await totalPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            heightBeforeAdd,
          );
        });

        describe('register vesting accounts', () => {
          test('execute register_vesting_accounts', async () => {
            await cmInstantiator.executeContract(
              contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
              {
                register_vesting_accounts: {
                  vesting_accounts: [
                    types.vestingAccount(cmUser1.wallet.address, [
                      types.vestingSchedule(
                        types.vestingSchedulePoint(0, vestingAmount.toString()),
                      ),
                    ]),
                    types.vestingAccount(cmUser2.wallet.address, [
                      types.vestingSchedule(
                        types.vestingSchedulePoint(0, vestingAmount.toString()),
                      ),
                    ]),
                  ],
                },
              },
              [
                {
                  denom: NEUTRON_DENOM,
                  amount: (2 * vestingAmount).toString(),
                },
              ],
            );
            await neutronChain.waitBlocks(1);
          });

          test('check available amounts', async () => {
            const currentHeight = await neutronChain.getHeight();
            expect(
              await neutronChain.queryContract<UnclaimedAmountResponse>(
                contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
                {
                  historical_extension: {
                    msg: {
                      unclaimed_amount_at_height: {
                        address: cmUser1.wallet.address,
                        height: currentHeight,
                      },
                    },
                  },
                },
              ),
            ).toBe(vestingAmount.toString());
            expect(
              await neutronChain.queryContract<UnclaimedAmountResponse>(
                contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
                {
                  historical_extension: {
                    msg: {
                      unclaimed_amount_at_height: {
                        address: cmUser2.wallet.address,
                        height: currentHeight,
                      },
                    },
                  },
                },
              ),
            ).toBe(vestingAmount.toString());
            expect(
              await neutronChain.queryContract<UnclaimedAmountResponse>(
                contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
                {
                  historical_extension: {
                    msg: {
                      unclaimed_total_amount_at_height: {
                        height: currentHeight,
                      },
                    },
                  },
                },
              ),
            ).toBe((2 * vestingAmount).toString());
          });

          test('record voting power after vesting account addition', async () => {
            heightAfterAdd = await neutronChain.getHeight();
            user1VpAfterAdd = await votingPowerAtHeight(
              neutronChain,
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              cmUser1.wallet.address,
              heightAfterAdd,
            );
            user2VpAfterAdd = await votingPowerAtHeight(
              neutronChain,
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              cmUser2.wallet.address,
              heightAfterAdd,
            );
            totalVpAfterAdd = await totalPowerAtHeight(
              neutronChain,
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              heightAfterAdd,
            );
          });
          test('check voting power change', async () => {
            expect(+user1VpAfterAdd.power).toEqual(
              +user1VpBeforeAdd.power + vestingAmount,
            );
            expect(+user2VpAfterAdd.power).toEqual(
              +user2VpBeforeAdd.power + vestingAmount,
            );
            expect(+totalVpAfterAdd.power).toEqual(
              +totalVpBeforeAdd.power + 2 * vestingAmount,
            );
          });
        });

        describe('check historical voting power', () => {
          test('compare to initial voting power', async () => {
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser1.wallet.address,
                heightInit,
              ),
            ).toEqual(user1VpInit);
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser2.wallet.address,
                heightInit,
              ),
            ).toEqual(user2VpInit);
            expect(
              await totalPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                heightInit,
              ),
            ).toEqual(totalVpInit);
          });

          test('compare to voting power before vesting account addition', async () => {
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser1.wallet.address,
                heightBeforeAdd,
              ),
            ).toEqual(user1VpBeforeAdd);
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser2.wallet.address,
                heightBeforeAdd,
              ),
            ).toEqual(user2VpBeforeAdd);
            expect(
              await totalPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                heightBeforeAdd,
              ),
            ).toEqual(totalVpBeforeAdd);
          });
        });
      });

      describe('remove vesting accounts', () => {
        let clawbackAccount: string;
        let clawbackAccountBalance: number;
        // vars for state before voting accounts removed
        let user1VpBeforeRm: VotingPowerResponse;
        let user2VpBeforeRm: VotingPowerResponse;
        let totalVpBeforeRm: VotingPowerResponse;
        let heightBeforeRm: number;
        // vars for state after voting accounts removed
        let user1VpAfterRm: VotingPowerResponse;
        let user2VpAfterRm: VotingPowerResponse;
        let totalVpAfterRm: VotingPowerResponse;
        let heightAfterRm: number;
        test('record current voting power', async () => {
          heightBeforeRm = await neutronChain.getHeight();
          user1VpBeforeRm = await votingPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            cmUser1.wallet.address,
            heightBeforeRm,
          );
          user2VpBeforeRm = await votingPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            cmUser2.wallet.address,
            heightBeforeRm,
          );
          totalVpBeforeRm = await totalPowerAtHeight(
            neutronChain,
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            heightBeforeRm,
          );
        });

        describe('remove vesting accounts', () => {
          test('execute remove_vesting_accounts', async () => {
            clawbackAccount = cmManager.wallet.address;
            clawbackAccountBalance = await neutronChain.queryDenomBalance(
              clawbackAccount,
              NEUTRON_DENOM,
            );
            await cmInstantiator.executeContract(
              contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
              {
                managed_extension: {
                  msg: {
                    remove_vesting_accounts: {
                      vesting_accounts: [cmUser1.wallet.address],
                      clawback_account: clawbackAccount,
                    },
                  },
                },
              },
            );
          });

          test('unclaimed amount after removal', async () => {
            await neutronChain.waitBlocks(1);
            const currentHeight = await neutronChain.getHeight();
            expect(
              await neutronChain.queryContract<UnclaimedAmountResponse>(
                contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
                {
                  historical_extension: {
                    msg: {
                      unclaimed_amount_at_height: {
                        address: cmUser1.wallet.address,
                        height: currentHeight,
                      },
                    },
                  },
                },
              ),
            ).toBe('0');
            expect(
              await neutronChain.queryContract<UnclaimedAmountResponse>(
                contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
                {
                  historical_extension: {
                    msg: {
                      unclaimed_total_amount_at_height: {
                        height: currentHeight,
                      },
                    },
                  },
                },
              ),
            ).toBe(vestingAmount.toString()); // only user2's part left
          });

          test('record voting power after vesting account removal', async () => {
            heightAfterRm = await neutronChain.getHeight();
            user1VpAfterRm = await votingPowerAtHeight(
              neutronChain,
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              cmUser1.wallet.address,
              heightAfterRm,
            );
            user2VpAfterRm = await votingPowerAtHeight(
              neutronChain,
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              cmUser2.wallet.address,
              heightAfterRm,
            );
            totalVpAfterRm = await totalPowerAtHeight(
              neutronChain,
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              heightAfterRm,
            );
          });

          test('check voting power change', async () => {
            expect(+user1VpAfterRm.power).toEqual(0);
            expect(+user2VpAfterRm.power).toEqual(
              +user2VpBeforeRm.power, // wasn't changed
            );
            expect(+totalVpAfterRm.power).toEqual(
              +user2VpBeforeRm.power, // only user2's part left
            );
          });

          test('clawback account topped up', async () => {
            const clawbackAccountBalanceAfterRemoval =
              await neutronChain.queryDenomBalance(
                clawbackAccount,
                NEUTRON_DENOM,
              );
            expect(clawbackAccountBalanceAfterRemoval).toBe(
              clawbackAccountBalance + vestingAmount,
            );
          });
        });

        describe('check historical voting power', () => {
          test('compare to initial voting power', async () => {
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser1.wallet.address,
                heightInit,
              ),
            ).toEqual(user1VpInit);
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser2.wallet.address,
                heightInit,
              ),
            ).toEqual(user2VpInit);
            expect(
              await totalPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                heightInit,
              ),
            ).toEqual(totalVpInit);
          });
          test('compare to voting power before vesting account addition', async () => {
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser1.wallet.address,
                heightBeforeAdd,
              ),
            ).toEqual(user1VpBeforeAdd);
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser2.wallet.address,
                heightBeforeAdd,
              ),
            ).toEqual(user2VpBeforeAdd);
            expect(
              await totalPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                heightBeforeAdd,
              ),
            ).toEqual(totalVpBeforeAdd);
          });
          test('compare to voting power before vesting account removal', async () => {
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser1.wallet.address,
                heightBeforeRm,
              ),
            ).toEqual(user1VpBeforeRm);
            expect(
              await votingPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                cmUser2.wallet.address,
                heightBeforeRm,
              ),
            ).toEqual(user2VpBeforeRm);
            expect(
              await totalPowerAtHeight(
                neutronChain,
                contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
                heightBeforeRm,
              ),
            ).toEqual(totalVpBeforeRm);
          });
        });
      });
    });

    describe('misc', () => {
      test('with_managers extension is disabled', async () => {
        await expect(
          neutronChain.queryContract<Record<string, unknown>>(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              with_managers_extension: {
                msg: {
                  vesting_managers: {},
                },
              },
            },
          ),
        ).rejects.toThrow(
          /Extension is not enabled for the contract: with_managers/,
        );
      });

      test('set vesting token not allowed to a stranger', async () => {
        await expect(
          cmUser1.executeContract(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              set_vesting_token: {
                vesting_token: {
                  native_token: {
                    denom: IBC_ATOM_DENOM,
                  },
                },
              },
            },
          ),
        ).rejects.toThrow(/Unauthorized/);
      });

      test('set vesting token not allowed more than once', async () => {
        await expect(
          cmManager.executeContract(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              set_vesting_token: {
                vesting_token: {
                  native_token: {
                    denom: IBC_ATOM_DENOM,
                  },
                },
              },
            },
          ),
        ).rejects.toThrow(/Vesting token is already set!/);
      });

      describe('remove vesting accounts is permissioned', () => {
        test('removal not allowed to a stranger', async () => {
          await expect(
            cmUser2.executeContract(
              contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
              {
                managed_extension: {
                  msg: {
                    remove_vesting_accounts: {
                      vesting_accounts: [cmUser1.wallet.address],
                      clawback_account: cmUser2.wallet.address,
                    },
                  },
                },
              },
            ),
          ).rejects.toThrow(/Unauthorized/);
        });
      });

      describe('register vesting accounts is permissioned', () => {
        test('via send cw20 by a stranger', async () => {
          // create a random cw20 token with allocation to user1
          const codeId = await cmInstantiator.storeWasm(
            types.NeutronContract[CW20_BASE_CONTRACT_KEY],
          );
          expect(codeId).toBeGreaterThan(0);
          const initRes = await cmInstantiator.instantiateContract(
            codeId,
            {
              name: 'a cw20 token',
              symbol: 'TKN',
              decimals: 6,
              initial_balances: [
                { address: cmUser1.wallet.address, amount: '1000' },
              ],
            },
            'a_cw20_token',
          );
          expect(initRes).toBeTruthy();

          await expect(
            cmUser1.executeContract(initRes, {
              send: {
                contract: contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
                amount: '1000',
                msg: Buffer.from(
                  JSON.stringify({
                    register_vesting_accounts: {
                      vesting_accounts: [
                        types.vestingAccount(cmUser1.wallet.address, [
                          types.vestingSchedule(
                            types.vestingSchedulePoint(0, '1000'),
                          ),
                        ]),
                      ],
                    },
                  }),
                ).toString('base64'),
              },
            }),
          ).rejects.toThrow(/Unauthorized/);
        });
        test('via direct exec msg by the token manager', async () => {
          await expect(
            cmManager.executeContract(
              contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
              {
                register_vesting_accounts: {
                  vesting_accounts: [
                    types.vestingAccount(cmUser2.wallet.address, [
                      types.vestingSchedule(
                        types.vestingSchedulePoint(0, '1000'),
                      ),
                    ]),
                  ],
                },
              },
              [{ denom: NEUTRON_DENOM, amount: '1000' }],
            ),
          ).rejects.toThrow(/Unauthorized/);
        });
      });
    });
  });
});

const deployContracts = async (
  chain: cosmosWrapper.CosmosWrapper,
  instantiator: walletWrapper.WalletWrapper,
  cmManager: walletWrapper.WalletWrapper,
): Promise<Record<string, string>> => {
  const codeIds: Record<string, number> = {};
  for (const contract of [
    INVESTORS_VESTING_CONTRACT_KEY,
    INVESTORS_VESTING_VAULT_CONTRACT_KEY,
  ]) {
    const codeId = await instantiator.storeWasm(
      types.NeutronContract[contract],
    );
    expect(codeId).toBeGreaterThan(0);
    codeIds[contract] = codeId;
  }

  const contractAddresses: Record<string, string> = {};
  await deployInvestorsVestingContract(
    instantiator,
    cmManager,
    codeIds,
    contractAddresses,
  );
  await setInvestorsVestingAsset(instantiator, contractAddresses);
  await deployInvestorsVestingVaultContract(
    instantiator,
    codeIds,
    contractAddresses,
  );
  return contractAddresses;
};

const deployInvestorsVestingContract = async (
  instantiator: walletWrapper.WalletWrapper,
  cmManager: walletWrapper.WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const msg = {
    owner: instantiator.wallet.address,
    token_info_manager: cmManager.wallet.address,
  };
  const res = await instantiator.instantiateContract(
    codeIds[INVESTORS_VESTING_CONTRACT_KEY],
    msg,
    'investors_vesting',
  );
  expect(res).toBeTruthy();
  contractAddresses[INVESTORS_VESTING_CONTRACT_KEY] = res;
};

const setInvestorsVestingAsset = async (
  instantiator: walletWrapper.WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  await instantiator.executeContract(
    contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
    {
      set_vesting_token: {
        vesting_token: {
          native_token: {
            denom: NEUTRON_DENOM,
          },
        },
      },
    },
  );
};

const deployInvestorsVestingVaultContract = async (
  instantiator: walletWrapper.WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.instantiateContract(
    codeIds[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
    {
      vesting_contract_address:
        contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
      description: 'An investors vesting vault',
      owner: instantiator.wallet.address,
      name: 'Investors vesting vault',
    },
    'investors_vesting_vault',
  );
  expect(res).toBeTruthy();
  contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY] = res;
};

type InvestorsVestingVaultConfig = {
  vesting_contract_address: string;
  description: string;
  owner: string;
  name: string;
};

type UnclaimedAmountResponse = {
  data: string;
};

type VotingPowerResponse = {
  power: string;
  height: number;
};

const totalPowerAtHeight = async (
  chain: cosmosWrapper.CosmosWrapper,
  contract: string,
  height?: number,
): Promise<VotingPowerResponse> =>
  chain.queryContract<VotingPowerResponse>(contract, {
    total_power_at_height:
      typeof height === 'undefined' ? {} : { height: height },
  });

const votingPowerAtHeight = async (
  chain: cosmosWrapper.CosmosWrapper,
  contract: string,
  address: string,
  height?: number,
): Promise<VotingPowerResponse> =>
  chain.queryContract<VotingPowerResponse>(contract, {
    voting_power_at_height:
      typeof height === 'undefined'
        ? {
            address: address,
          }
        : {
            address: address,
            height: height,
          },
  });
