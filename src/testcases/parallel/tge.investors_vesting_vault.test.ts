import {
  cosmosWrapper,
  IBC_ATOM_DENOM,
  NEUTRON_DENOM,
  TestStateLocalCosmosTestNet,
  types,
} from '@neutron-org/neutronjsplus';

const INVESTORS_VESTING_CONTRACT_KEY = 'VESTING_INVESTORS';
const INVESTORS_VESTING_VAULT_CONTRACT_KEY = 'INVESTORS_VESTING_VAULT';
const CW20_BASE_CONTRACT_KEY = 'CW20_BASE';

const config = require('../../config.json');

describe('Neutron / TGE / Investors vesting vault', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: cosmosWrapper.CosmosWrapper;
  let cmInstantiator: cosmosWrapper.WalletWrapper;
  let cmManager: cosmosWrapper.WalletWrapper;
  let cmUser1: cosmosWrapper.WalletWrapper;
  let cmUser2: cosmosWrapper.WalletWrapper;
  let contractAddresses: Record<string, string> = {};

  beforeAll(async () => {
    cosmosWrapper.registerCodecs();

    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    cmInstantiator = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronThree.genQaWal1,
    );
    cmManager = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    cmUser1 = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.genQaWal1,
    );
    cmUser2 = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFive.genQaWal1,
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
        owner: cmInstantiator.wallet.address.toString(),
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
        cmInstantiator.executeContract(
          vaultAddress,
          JSON.stringify({ bond: {} }),
        ),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        cmInstantiator.executeContract(
          vaultAddress,
          JSON.stringify({ unbond: { amount: '1000' } }),
        ),
      ).rejects.toThrow(/Direct unbonding is not available for this contract/);
    });

    const totalVestingAmount = 500_000_000; // 500 NTRN in total
    const user1VestingAmount = Math.round(totalVestingAmount * (1 / 3));
    const user2VestingAmount = totalVestingAmount - user1VestingAmount;

    describe('prepare investors vesting vault', () => {
      test('create vesting accounts', async () => {
        const execRes = await cmInstantiator.executeContract(
          contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
          JSON.stringify({
            register_vesting_accounts: {
              vesting_accounts: [
                types.vestingAccount(cmUser1.wallet.address.toString(), [
                  types.vestingSchedule(
                    types.vestingSchedulePoint(
                      0,
                      user1VestingAmount.toString(),
                    ),
                  ),
                ]),
                types.vestingAccount(cmUser2.wallet.address.toString(), [
                  types.vestingSchedule(
                    types.vestingSchedulePoint(
                      0,
                      user2VestingAmount.toString(),
                    ),
                  ),
                ]),
              ],
            },
          }),
          [{ denom: NEUTRON_DENOM, amount: totalVestingAmount.toString() }],
        );
        expect(execRes.code).toBe(0);
      });
      test('check unclaimed amounts', async () => {
        await neutronChain.blockWaiter.waitBlocks(1);
        const currentHeight = await env.getHeight(neutronChain.sdk);
        expect(
          await neutronChain.queryContract<UnclaimedAmountResponse>(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              historical_extension: {
                msg: {
                  unclaimed_amount_at_height: {
                    address: cmUser1.wallet.address.toString(),
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
                    address: cmUser2.wallet.address.toString(),
                    height: currentHeight,
                  },
                },
              },
            },
          ),
        ).toBe(user2VestingAmount.toString());
      });
    });

    describe('voting power', () => {
      describe('check initial voting power', () => {
        test('total power at height', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(totalVestingAmount);
        });
        test('user1 power at height', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(user1VestingAmount);
        });
        test('user2 power at height', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser2.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(user2VestingAmount);
        });
      });

      let heightBeforeClaim: number;
      describe('check voting power on claim', () => {
        const user1PartialClaim = Math.round(user1VestingAmount / 2);
        beforeAll(async () => {
          heightBeforeClaim = await env.getHeight(neutronChain.sdk);
          await neutronChain.blockWaiter.waitBlocks(1); // so it's before claim for sure
        });
        test('user1 partial claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            JSON.stringify({
              claim: {
                amount: user1PartialClaim.toString(),
              },
            }),
          );
          expect(execRes.code).toBe(0);
          await neutronChain.blockWaiter.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(user1VestingAmount - user1PartialClaim);
        });
        test('total voting power check after user1 partial claim', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(totalVestingAmount - user1PartialClaim);
        });

        test('user2 full claim', async () => {
          const execRes = await cmUser2.executeContract(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            JSON.stringify({
              claim: {},
            }),
          );
          expect(execRes.code).toBe(0);
          await neutronChain.blockWaiter.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser2.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(0);
        });
        test('total voting power check after user2 full claim', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(
            totalVestingAmount - user1PartialClaim - user2VestingAmount,
          );
        });

        test('user1 full claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            JSON.stringify({
              claim: {},
            }),
          );
          expect(execRes.code).toBe(0);
          await neutronChain.blockWaiter.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(0);
        });
        test('total voting power check after full claim', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(0);
        });
      });

      describe('historical voting power', () => {
        // voting power at height = heightBeforeClaim should be the same as it was
        // at that point regardless of the following claim calls and TWAP changes.
        describe('check voting power before claim', () => {
          test('total power', async () => {
            const res = await neutronChain.queryContract<VotingPowerResponse>(
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              { total_power_at_height: { height: heightBeforeClaim } },
            );
            expect(+res.power).toBe(totalVestingAmount);
          });
          test('user1 power', async () => {
            const res = await neutronChain.queryContract<VotingPowerResponse>(
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              {
                voting_power_at_height: {
                  address: cmUser1.wallet.address.toString(),
                  height: heightBeforeClaim,
                },
              },
            );
            expect(+res.power).toBe(user1VestingAmount);
          });
          test('user2 power', async () => {
            const res = await neutronChain.queryContract<VotingPowerResponse>(
              contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
              {
                voting_power_at_height: {
                  address: cmUser2.wallet.address.toString(),
                  height: heightBeforeClaim,
                },
              },
            );
            expect(+res.power).toBe(user2VestingAmount);
          });
        });
      });
    });

    describe('manage vesting accounts', () => {
      const vestingAmount = 500_000_000;
      test('create a new vesting account', async () => {
        const execRes = await cmInstantiator.executeContract(
          contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
          JSON.stringify({
            register_vesting_accounts: {
              vesting_accounts: [
                types.vestingAccount(cmUser1.wallet.address.toString(), [
                  types.vestingSchedule(
                    types.vestingSchedulePoint(0, vestingAmount.toString()),
                  ),
                ]),
              ],
            },
          }),
          [{ denom: NEUTRON_DENOM, amount: vestingAmount.toString() }],
        );
        expect(execRes.code).toBe(0);
        await neutronChain.blockWaiter.waitBlocks(1);
        const currentHeight = await env.getHeight(neutronChain.sdk);
        expect(
          await neutronChain.queryContract<UnclaimedAmountResponse>(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            {
              historical_extension: {
                msg: {
                  unclaimed_amount_at_height: {
                    address: cmUser1.wallet.address.toString(),
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
        ).toBe(vestingAmount.toString());
      });

      describe('remove vesting account', () => {
        let clawbackAccount: string;
        let clawbackAccountBalance: number;
        test('not allowed to a stranger', async () => {
          clawbackAccount = cmManager.wallet.address.toString();
          clawbackAccountBalance = await neutronChain.queryDenomBalance(
            clawbackAccount,
            NEUTRON_DENOM,
          );
          await expect(
            cmUser2.executeContract(
              contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
              JSON.stringify({
                managed_extension: {
                  msg: {
                    remove_vesting_accounts: {
                      vesting_accounts: [cmUser1.wallet.address.toString()],
                      clawback_account: clawbackAccount,
                    },
                  },
                },
              }),
              [{ denom: NEUTRON_DENOM, amount: vestingAmount.toString() }],
            ),
          ).rejects.toThrow(/Unauthorized/);
        });
        test('successful as the owner', async () => {
          const execRes = await cmInstantiator.executeContract(
            contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
            JSON.stringify({
              managed_extension: {
                msg: {
                  remove_vesting_accounts: {
                    vesting_accounts: [cmUser1.wallet.address.toString()],
                    clawback_account: clawbackAccount,
                  },
                },
              },
            }),
            [{ denom: NEUTRON_DENOM, amount: vestingAmount.toString() }],
          );
          expect(execRes.code).toBe(0);
        });
        test('unclaimed amount after removal', async () => {
          await neutronChain.blockWaiter.waitBlocks(1);
          const currentHeight = await env.getHeight(neutronChain.sdk);
          expect(
            await neutronChain.queryContract<UnclaimedAmountResponse>(
              contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
              {
                historical_extension: {
                  msg: {
                    unclaimed_amount_at_height: {
                      address: cmUser1.wallet.address.toString(),
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
          ).toBe('0');
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
            JSON.stringify({
              set_vesting_token: {
                vesting_token: {
                  native_token: {
                    denom: IBC_ATOM_DENOM,
                  },
                },
              },
            }),
          ),
        ).rejects.toThrow(/Unauthorized/);
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
            JSON.stringify({
              name: 'a cw20 token',
              symbol: 'TKN',
              decimals: 6,
              initial_balances: [
                { address: cmUser1.wallet.address.toString(), amount: '1000' },
              ],
            }),
            'a_cw20_token',
          );
          expect(initRes).toBeTruthy();

          await expect(
            cmUser1.executeContract(
              initRes[0]._contract_address,
              JSON.stringify({
                send: {
                  contract: contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
                  amount: '1000',
                  msg: Buffer.from(
                    JSON.stringify({
                      register_vesting_accounts: {
                        vesting_accounts: [
                          types.vestingAccount(
                            cmUser1.wallet.address.toString(),
                            [
                              types.vestingSchedule(
                                types.vestingSchedulePoint(0, '1000'),
                              ),
                            ],
                          ),
                        ],
                      },
                    }),
                  ).toString('base64'),
                },
              }),
            ),
          ).rejects.toThrow(/Unauthorized/);
        });
        test('via direct exec msg by the token manager', async () => {
          await expect(
            cmManager.executeContract(
              contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
              JSON.stringify({
                register_vesting_accounts: {
                  vesting_accounts: [
                    types.vestingAccount(cmUser2.wallet.address.toString(), [
                      types.vestingSchedule(
                        types.vestingSchedulePoint(0, '1000'),
                      ),
                    ]),
                  ],
                },
              }),
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
  instantiator: cosmosWrapper.WalletWrapper,
  cmManager: cosmosWrapper.WalletWrapper,
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
  instantiator: cosmosWrapper.WalletWrapper,
  cmManager: cosmosWrapper.WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const msg = {
    owner: instantiator.wallet.address.toString(),
    token_info_manager: cmManager.wallet.address.toString(),
  };
  const res = await instantiator.instantiateContract(
    codeIds[INVESTORS_VESTING_CONTRACT_KEY],
    JSON.stringify(msg),
    'investors_vesting',
  );
  expect(res).toBeTruthy();
  contractAddresses[INVESTORS_VESTING_CONTRACT_KEY] = res[0]._contract_address;
};

const setInvestorsVestingAsset = async (
  instantiator: cosmosWrapper.WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  const execRes = await instantiator.executeContract(
    contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
    JSON.stringify({
      set_vesting_token: {
        vesting_token: {
          native_token: {
            denom: NEUTRON_DENOM,
          },
        },
      },
    }),
  );
  expect(execRes.code).toBe(0);
};

const deployInvestorsVestingVaultContract = async (
  instantiator: cosmosWrapper.WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.instantiateContract(
    codeIds[INVESTORS_VESTING_VAULT_CONTRACT_KEY],
    JSON.stringify({
      vesting_contract_address:
        contractAddresses[INVESTORS_VESTING_CONTRACT_KEY],
      description: 'An investors vesting vault',
      owner: instantiator.wallet.address.toString(),
      name: 'Investors vesting vault',
    }),
    'investors_vesting_vault',
  );
  expect(res).toBeTruthy();
  contractAddresses[INVESTORS_VESTING_VAULT_CONTRACT_KEY] =
    res[0]._contract_address;
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
