// vesting lp:
// 1. prerequisites: vesting-lp contract, atom oracle contract and usdc oracle contract
// 1.1. init vesting-lp, set asset_infos by manager, add vesting accounts
// 1.2. init pools, provide liquidity
// 1.3. init oracles aimed to pools

import { proto } from '@cosmos-client/core';
import _ from 'lodash';
import {
  CosmosWrapper,
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import {
  NeutronContract,
  nativeToken,
  PoolStatus,
  Asset,
  nativeTokenInfo,
  vestingAccount,
  vestingSchedule,
  vestingSchedulePount,
  NativeToken,
  Token,
} from '../../helpers/types';
import { BlockWaiter, getHeight, wait } from '../../helpers/wait';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';

// general contract keys used across the tests
const ASTRO_PAIR_CONTRACT_KEY = 'ASTRO_PAIR';
const ASTRO_FACTORY_CONTRACT_KEY = 'ASTRO_FACTORY';
const ASTRO_TOKEN_CONTRACT_KEY = 'ASTRO_TOKEN';
const ASTRO_COIN_REGISTRY_CONTRACT_KEY = 'ASTRO_COIN_REGISTRY';
const VESTING_LP_CONTRACT_KEY = 'VESTING_LP';
const VESTING_LP_VAULT_CONTRACT_KEY = 'VESTING_LP_VAULT';
const ORACLE_HISTORY_CONTRACT_KEY = 'ORACLE_HISTORY';
// specific contract keys used across the tests
const VESTING_LP_USDC_CONTRACT_KEY = 'VESTING_LP_USDC';
const VESTING_LP_ATOM_CONTRACT_KEY = 'VESTING_LP_ATOM';
const ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY = 'ORACLE_HISTORY_NTRN_USDC';
const ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY = 'ORACLE_HISTORY_NTRN_ATOM';
const NTRN_ATOM_PAIR_CONTRACT_KEY = 'NTRN_ATOM_PAIR';
const NTRN_ATOM_LP_TOKEN_CONTRACT_KEY = 'NTRN_ATOM_LP_TOKEN';
const NTRN_USDC_PAIR_CONTRACT_KEY = 'NTRN_USDC_PAIR';
const NTRN_USDC_LP_TOKEN_CONTRACT_KEY = 'NTRN_USDC_LP_TOKEN';

describe('Neutron / TGE / Vesting vault', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let cmInstantiator: WalletWrapper;
  let cmManager: WalletWrapper;
  let cmUser1: WalletWrapper;
  let cmUser2: WalletWrapper;
  let contractAddresses: Record<string, string> = {};

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    cmInstantiator = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronThree.genQaWal1,
    );
    cmManager = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    cmUser1 = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.genQaWal1,
    );
    cmUser2 = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFive.genQaWal1,
    );
    contractAddresses = await deployContracts(
      neutronChain,
      cmInstantiator,
      cmManager,
    );
    console.log('contract addresses:');
    console.log(contractAddresses);
    console.log('user1:', cmUser1.wallet.address.toString());
    console.log('user2:', cmUser2.wallet.address.toString());
  });

  describe('vesting LP vault', () => {
    test('check initial config', async () => {
      const vault_address = contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY];
      const config = await neutronChain.queryContract<VestingLpVaultConfig>(
        vault_address,
        { get_config: {} },
      );
      expect(config.name).toEqual('Vesting lp vault');
      expect(config.description).toEqual('A vesting lp vault');
      expect(config.atom_vesting_lp_contract).toEqual(
        contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
      );
      expect(config.atom_oracle_contract).toEqual(
        contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
      );
      expect(config.usdc_vesting_lp_contract).toEqual(
        contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
      );
      expect(config.usdc_oracle_contract).toEqual(
        contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
      );
      expect(config.owner).toEqual(cmInstantiator.wallet.address.toString());
      expect(config.manager).toEqual(cmManager.wallet.address.toString());
    });

    test('make sure bonding is disabled', async () => {
      const vault_address = contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY];
      await expect(
        neutronChain.queryContract(vault_address, { list_bonders: {} }),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        neutronChain.queryContract(vault_address, {
          bonding_status: { address: 'addr' },
        }),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        cmInstantiator.executeContract(
          vault_address,
          JSON.stringify({ bond: {} }),
        ),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        cmInstantiator.executeContract(
          vault_address,
          JSON.stringify({ unbond: { amount: '1000' } }),
        ),
      ).rejects.toThrow(/Direct unbonding is not available for this contract/);
    });

    const ntrn_provide_amount = 500_000_000; // 500 NTRN per each pool (ATOM, USDC)
    const atom_ntrn_provide_ratio = 1 / 5; // i.e. 1 ATOM = 5 NTRN
    const atom_provide_amount = ntrn_provide_amount * atom_ntrn_provide_ratio; // i.e. 100 ATOM
    const usdc_ntrn_provide_ratio = 4; // i.e. 1 NTRN = 4 USDC
    const usdc_provide_amount = ntrn_provide_amount * usdc_ntrn_provide_ratio; // i.e. 2_000 USDC

    const atom_ntrn_total_share = Math.floor(
      Math.sqrt(atom_provide_amount * ntrn_provide_amount),
    );
    const usdc_ntrn_total_share = Math.floor(
      Math.sqrt(usdc_provide_amount * ntrn_provide_amount),
    );
    // astroport allocates 1000 of the total share to the pool itself as a dust attack protection
    const atom_ntrn_provider_share = atom_ntrn_total_share - 1000;
    const usdc_ntrn_provider_share = usdc_ntrn_total_share - 1000;

    const user1_atom_vesting_amount = Math.round(
      atom_ntrn_provider_share * (1 / 3),
    );
    const user2_atom_vesting_amount =
      atom_ntrn_provider_share - user1_atom_vesting_amount;

    const user1_usdc_vesting_amount = Math.round(
      usdc_ntrn_provider_share * (1 / 3),
    );
    const user2_usdc_vesting_amount =
      usdc_ntrn_provider_share - user1_usdc_vesting_amount;
    describe('prepare oracles', () => {
      test('provide liquidity to NTRN_ATOM pool', async () => {
        const provided_assets = [
          nativeToken(IBC_ATOM_DENOM, atom_provide_amount.toString()),
          nativeToken(NEUTRON_DENOM, ntrn_provide_amount.toString()),
        ];
        // as manager so it gets lp tokens necessary for future register_vesting_accounts call
        const res = await cmManager.executeContract(
          contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY],
          JSON.stringify({ provide_liquidity: { assets: provided_assets } }),
          [
            { amount: atom_provide_amount.toString(), denom: IBC_ATOM_DENOM },
            { amount: ntrn_provide_amount.toString(), denom: NEUTRON_DENOM },
          ],
        );
        expect(res.code).toBe(0);

        expect(
          await neutronChain.queryContract<PoolStatus>(
            contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY],
            { pool: {} },
          ),
        ).toEqual({
          assets: provided_assets,
          total_share: atom_ntrn_total_share.toString(),
        });
      });

      test('provide liquidity to NTRN_USDC pool', async () => {
        const provided_assets = [
          nativeToken(IBC_USDC_DENOM, usdc_provide_amount.toString()),
          nativeToken(NEUTRON_DENOM, ntrn_provide_amount.toString()),
        ];
        // as manager so it gets lp tokens necessary for future register_vesting_accounts call
        const res = await cmManager.executeContract(
          contractAddresses[NTRN_USDC_PAIR_CONTRACT_KEY],
          JSON.stringify({ provide_liquidity: { assets: provided_assets } }),
          [
            { amount: usdc_provide_amount.toString(), denom: IBC_USDC_DENOM },
            { amount: ntrn_provide_amount.toString(), denom: NEUTRON_DENOM },
          ],
        );
        expect(res.code).toBe(0);

        expect(
          await neutronChain.queryContract<PoolStatus>(
            contractAddresses[NTRN_USDC_PAIR_CONTRACT_KEY],
            { pool: {} },
          ),
        ).toEqual({
          assets: provided_assets,
          total_share: usdc_ntrn_total_share.toString(),
        });
      });

      test('set asset infos for oracles', async () => {
        let res = await cmManager.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          JSON.stringify({
            set_asset_infos: [
              nativeTokenInfo(IBC_ATOM_DENOM),
              nativeTokenInfo(NEUTRON_DENOM),
            ],
          }),
        );
        expect(res.code).toBe(0);

        res = await cmManager.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          JSON.stringify({
            set_asset_infos: [
              nativeTokenInfo(IBC_USDC_DENOM),
              nativeTokenInfo(NEUTRON_DENOM),
            ],
          }),
        );
        expect(res.code).toBe(0);
      });

      test('call NTRN_ATOM oracle update', async () => {
        let res = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          JSON.stringify({ update: {} }),
        );
        expect(res.code).toBe(0);
        neutronChain.blockWaiter.waitBlocks(1); // update twice for precise twap
        res = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          JSON.stringify({ update: {} }),
        );
        expect(res.code).toBe(0);
        neutronChain.blockWaiter.waitBlocks(1); // wait until the new TWAP is available

        const consultAmount = 1_000; // a low value compared to pool depth to avoid slippage
        expect(
          await neutronChain.queryContract<{}>(
            contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
            {
              consult: {
                token: nativeTokenInfo(NEUTRON_DENOM),
                amount: consultAmount.toString(),
              },
            },
          ),
        ).toStrictEqual([
          [
            nativeTokenInfo(IBC_ATOM_DENOM),
            (consultAmount * atom_ntrn_provide_ratio).toString(), // expect to receive 1_000 NTRN * 1/5 = 20 ATOM
          ],
        ]);

        expect(
          await neutronChain.queryContract<{}>(
            contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
            {
              consult: {
                token: nativeTokenInfo(IBC_ATOM_DENOM),
                amount: consultAmount.toString(),
              },
            },
          ),
        ).toStrictEqual([
          [
            nativeTokenInfo(NEUTRON_DENOM),
            (consultAmount / atom_ntrn_provide_ratio).toString(), // expect to receive 1_000 ATOM / 1/5 = 500 NTRN
          ],
        ]);
      });

      test('call NTRN_USDC oracle update', async () => {
        let res = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          JSON.stringify({ update: {} }),
        );
        expect(res.code).toBe(0);
        neutronChain.blockWaiter.waitBlocks(1); // update twice for precise twap
        res = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          JSON.stringify({ update: {} }),
        );
        expect(res.code).toBe(0);
        neutronChain.blockWaiter.waitBlocks(1); // wait until the new TWAP is available

        const consultAmount = 1_000; // a low value compared to pool depth to avoid slippage
        expect(
          await neutronChain.queryContract<{}>(
            contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
            {
              consult: {
                token: nativeTokenInfo(NEUTRON_DENOM),
                amount: consultAmount.toString(),
              },
            },
          ),
        ).toStrictEqual([
          [
            nativeTokenInfo(IBC_USDC_DENOM),
            (consultAmount * usdc_ntrn_provide_ratio).toString(), // expect to receive 1_000 NTRN * 4 = 400 USDC
          ],
        ]);

        expect(
          await neutronChain.queryContract<{}>(
            contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
            {
              consult: {
                token: nativeTokenInfo(IBC_USDC_DENOM),
                amount: consultAmount.toString(),
              },
            },
          ),
        ).toStrictEqual([
          [
            nativeTokenInfo(NEUTRON_DENOM),
            (consultAmount / usdc_ntrn_provide_ratio).toString(), // expect to receive 1_000 USDC / 4 = 25 NTRN
          ],
        ]);
      });
    });

    describe('prepare vesting lp vault', () => {
      test('create ATOM vesting accounts', async () => {
        const res = await cmManager.executeContract(
          contractAddresses[NTRN_ATOM_LP_TOKEN_CONTRACT_KEY],
          JSON.stringify({
            send: {
              contract: contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
              amount: atom_ntrn_provider_share.toString(),
              msg: Buffer.from(
                JSON.stringify({
                  register_vesting_accounts: {
                    vesting_accounts: [
                      vestingAccount(cmUser1.wallet.address.toString(), [
                        vestingSchedule(
                          vestingSchedulePount(
                            0,
                            user1_atom_vesting_amount.toString(),
                          ),
                        ),
                      ]),
                      vestingAccount(cmUser2.wallet.address.toString(), [
                        vestingSchedule(
                          vestingSchedulePount(
                            0,
                            user2_atom_vesting_amount.toString(),
                          ),
                        ),
                      ]),
                    ],
                  },
                }),
              ).toString('base64'),
            },
          }),
        );
        expect(res.code).toBe(0);
      });
      test('create USDC vesting accounts', async () => {
        const res = await cmManager.executeContract(
          contractAddresses[NTRN_USDC_LP_TOKEN_CONTRACT_KEY],
          JSON.stringify({
            send: {
              contract: contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
              amount: usdc_ntrn_provider_share.toString(),
              msg: Buffer.from(
                JSON.stringify({
                  register_vesting_accounts: {
                    vesting_accounts: [
                      vestingAccount(cmUser1.wallet.address.toString(), [
                        vestingSchedule(
                          vestingSchedulePount(
                            0,
                            user1_usdc_vesting_amount.toString(),
                          ),
                        ),
                      ]),
                      vestingAccount(cmUser2.wallet.address.toString(), [
                        vestingSchedule(
                          vestingSchedulePount(
                            0,
                            user2_usdc_vesting_amount.toString(),
                          ),
                        ),
                      ]),
                    ],
                  },
                }),
              ).toString('base64'),
            },
          }),
        );
        expect(res.code).toBe(0);
      });
      describe('check unclaimed amounts', () => {
        let currentHeight: number;
        beforeAll(async () => {
          await wait(5);
          currentHeight = await getHeight(neutronChain.sdk);
        });
        test('user1 ATOM lp contract', async () => {
          expect(
            await neutronChain.queryContract<UnclaimedAmountResponse>(
              contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
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
          ).toBe(user1_atom_vesting_amount.toString());
        });
        test('user2 ATOM lp contract', async () => {
          expect(
            await neutronChain.queryContract<UnclaimedAmountResponse>(
              contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
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
          ).toBe(user2_atom_vesting_amount.toString());
        });
        test('user1 USDC lp contract', async () => {
          expect(
            await neutronChain.queryContract<UnclaimedAmountResponse>(
              contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
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
          ).toBe(user1_usdc_vesting_amount.toString());
        });
        test('user2 USDC lp contract', async () => {
          expect(
            await neutronChain.queryContract<UnclaimedAmountResponse>(
              contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
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
          ).toBe(user2_usdc_vesting_amount.toString());
        });
      });
    });

    describe('voting power', () => {
      let ntrn_twap_in_atom: number;
      let ntrn_twap_in_usdc: number;
      describe('check initial voting power', () => {
        test('get TWAPs', async () => {
          const ntrn_twap_in_atom_resp = await getTwapAtHeight(
            neutronChain,
            contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
            nativeTokenInfo(NEUTRON_DENOM),
            111111,
          );
          ntrn_twap_in_atom = ntrn_twap_in_atom_resp[0].twap;
          expect(ntrn_twap_in_atom).toBe(0.2);

          const ntrn_twap_in_usdc_resp = await getTwapAtHeight(
            neutronChain,
            contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
            nativeTokenInfo(NEUTRON_DENOM),
            111111,
          );
          ntrn_twap_in_usdc = ntrn_twap_in_usdc_resp[0].twap;
          expect(ntrn_twap_in_usdc).toBe(4);
        });
        test('total power at height', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(
            Math.round(
              atom_ntrn_provider_share * Math.sqrt(ntrn_twap_in_atom),
            ) +
              Math.round(
                usdc_ntrn_provider_share * Math.sqrt(ntrn_twap_in_usdc),
              ),
          );
        });
        test('user1 power at height', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(
            Math.round(
              user1_atom_vesting_amount * Math.sqrt(ntrn_twap_in_atom),
            ) +
              Math.round(
                user1_usdc_vesting_amount * Math.sqrt(ntrn_twap_in_usdc),
              ),
          );
        });
        test('user2 power at height', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser2.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(
            Math.round(
              user2_atom_vesting_amount * Math.sqrt(ntrn_twap_in_atom),
            ) +
              Math.round(
                user2_usdc_vesting_amount * Math.sqrt(ntrn_twap_in_usdc),
              ),
          );
        });
      });
      test('add another member', async () => {});
      test('check several members voting power', async () => {});
    });
  });
});

const deployContracts = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
): Promise<Record<string, string>> => {
  const codeIds: Record<string, number> = {};
  for (const contract of [
    ASTRO_PAIR_CONTRACT_KEY,
    ASTRO_FACTORY_CONTRACT_KEY,
    ASTRO_TOKEN_CONTRACT_KEY,
    ASTRO_COIN_REGISTRY_CONTRACT_KEY,
    VESTING_LP_CONTRACT_KEY,
    VESTING_LP_VAULT_CONTRACT_KEY,
    ORACLE_HISTORY_CONTRACT_KEY,
  ]) {
    const codeId = await instantiator.storeWasm(NeutronContract[contract]);
    expect(codeId).toBeGreaterThan(0);
    codeIds[contract] = codeId;
  }

  const contractAddresses: Record<string, string> = {};

  await deployCoinRegistry(instantiator, codeIds, contractAddresses);
  await storeTokensPrecision(chain, instantiator, contractAddresses);
  await deployFactory(instantiator, codeIds, contractAddresses);
  await deployOracles(instantiator, cmManager, codeIds, contractAddresses);
  await deployPairs(chain, instantiator, contractAddresses);
  await deployVestingLpContracts(
    instantiator,
    cmManager,
    codeIds,
    contractAddresses,
  );
  await setVestingLpAssets(instantiator, contractAddresses);
  await deployVestingLpVaultContract(
    instantiator,
    cmManager,
    codeIds,
    contractAddresses,
  );
  return contractAddresses;
};

const deployCoinRegistry = async (
  instantiator: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.instantiateContract(
    codeIds[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
    JSON.stringify({
      owner: instantiator.wallet.address.toString(),
    }),
    'coin_registry',
  );
  expect(res).toBeTruthy();
  contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY] =
    res[0]._contract_address;
};

const storeTokensPrecision = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.executeContract(
    contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
    JSON.stringify({
      add: {
        native_coins: [
          [IBC_ATOM_DENOM, 6],
          [IBC_USDC_DENOM, 6],
          [NEUTRON_DENOM, 6],
        ],
      },
    }),
  );
  expect(res.code).toBe(0);

  expect(
    await chain.queryContract<PrecisionResponse[]>(
      contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
      { native_tokens: {} },
    ),
  ).toEqual([
    { denom: IBC_ATOM_DENOM, decimals: 6 },
    { denom: IBC_USDC_DENOM, decimals: 6 },
    { denom: NEUTRON_DENOM, decimals: 6 },
  ]);
};

const deployFactory = async (
  instantiator: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const instantiateMsg = {
    pair_configs: [
      {
        code_id: codeIds[ASTRO_PAIR_CONTRACT_KEY],
        pair_type: {
          xyk: {},
        },
        total_fee_bps: 0,
        maker_fee_bps: 0,
        is_disabled: false,
        is_generator_disabled: false,
      },
    ],
    token_code_id: codeIds[ASTRO_TOKEN_CONTRACT_KEY],
    owner: instantiator.wallet.address.toString(),
    whitelist_code_id: 0,
    coin_registry_address: contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
  };
  const res = await instantiator.instantiateContract(
    codeIds[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(instantiateMsg),
    'astro_factory',
  );
  expect(res).toBeTruthy();
  contractAddresses[ASTRO_FACTORY_CONTRACT_KEY] = res[0]._contract_address;
};

const deployOracles = async (
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  let res = await instantiator.instantiateContract(
    codeIds[ORACLE_HISTORY_CONTRACT_KEY],
    JSON.stringify({
      factory_contract: contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
      period: 1,
      manager: cmManager.wallet.address.toString(),
    }),
    'oracle usdc',
  );
  expect(res).toBeTruthy();
  contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY] =
    res[0]._contract_address;

  res = await instantiator.instantiateContract(
    codeIds[ORACLE_HISTORY_CONTRACT_KEY],
    JSON.stringify({
      factory_contract: contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
      period: 1,
      manager: cmManager.wallet.address.toString(),
    }),
    'oracle atom',
  );
  expect(res).toBeTruthy();
  contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY] =
    res[0]._contract_address;
};

const deployPairs = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  let createMsg = {
    create_pair: {
      pair_type: {
        xyk: {},
      },
      asset_infos: [
        {
          native_token: {
            denom: IBC_ATOM_DENOM,
          },
        },
        {
          native_token: {
            denom: NEUTRON_DENOM,
          },
        },
      ],
    },
  };

  let res = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(createMsg),
  );
  expect(res.code).toBe(0);

  createMsg = {
    create_pair: {
      pair_type: {
        xyk: {},
      },
      asset_infos: [
        {
          native_token: {
            denom: IBC_USDC_DENOM,
          },
        },
        {
          native_token: {
            denom: NEUTRON_DENOM,
          },
        },
      ],
    },
  };

  res = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(createMsg),
  );
  expect(res.code).toBe(0);

  const pairs = await chain.queryContract<{ pairs: PairInfo[] }>(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    {
      pairs: {},
    },
  );
  expect(pairs.pairs).toHaveLength(2);
  contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY] = pairs.pairs[0].contract_addr;
  contractAddresses[NTRN_ATOM_LP_TOKEN_CONTRACT_KEY] =
    pairs.pairs[0].liquidity_token;
  contractAddresses[NTRN_USDC_PAIR_CONTRACT_KEY] = pairs.pairs[1].contract_addr;
  contractAddresses[NTRN_USDC_LP_TOKEN_CONTRACT_KEY] =
    pairs.pairs[1].liquidity_token;
};

const deployVestingLpContracts = async (
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  let msg = {
    owner: instantiator.wallet.address.toString(),
    token_info_manager: cmManager.wallet.address.toString(),
    vesting_managers: [cmManager.wallet.address.toString()],
  };
  let res = await instantiator.instantiateContract(
    codeIds[VESTING_LP_CONTRACT_KEY],
    JSON.stringify(msg),
    'vesting_atom_lp',
  );
  expect(res).toBeTruthy();
  contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY] = res[0]._contract_address;

  msg = {
    owner: instantiator.wallet.address.toString(),
    token_info_manager: cmManager.wallet.address.toString(),
    vesting_managers: [cmManager.wallet.address.toString()],
  };
  res = await instantiator.instantiateContract(
    codeIds[VESTING_LP_CONTRACT_KEY],
    JSON.stringify(msg),
    'vesting_usdc_lp',
  );
  expect(res).toBeTruthy();
  contractAddresses[VESTING_LP_USDC_CONTRACT_KEY] = res[0]._contract_address;
};

const setVestingLpAssets = async (
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  let res = await instantiator.executeContract(
    contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
    JSON.stringify({
      set_vesting_token: {
        vesting_token: {
          token: {
            contract_addr: contractAddresses[NTRN_ATOM_LP_TOKEN_CONTRACT_KEY],
          },
        },
      },
    }),
  );
  expect(res.code).toBe(0);

  res = await instantiator.executeContract(
    contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
    JSON.stringify({
      set_vesting_token: {
        vesting_token: {
          token: {
            contract_addr: contractAddresses[NTRN_USDC_LP_TOKEN_CONTRACT_KEY],
          },
        },
      },
    }),
  );
  expect(res.code).toBe(0);
};

const deployVestingLpVaultContract = async (
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  let res = await instantiator.instantiateContract(
    codeIds[VESTING_LP_VAULT_CONTRACT_KEY],
    JSON.stringify({
      name: 'Vesting lp vault',
      description: 'A vesting lp vault',
      atom_vesting_lp_contract: contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
      atom_oracle_contract:
        contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
      usdc_vesting_lp_contract: contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
      usdc_oracle_contract:
        contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
      owner: {
        address: {
          addr: instantiator.wallet.address.toString(),
        },
      },
      manager: cmManager.wallet.address.toString(),
    }),
    'vesting_lp_vault',
  );
  expect(res).toBeTruthy();
  contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY] = res[0]._contract_address;
};

const getTwapAtHeight = async (
  chain: CosmosWrapper,
  oracleContract: string,
  token: Token | NativeToken,
  height: number,
): Promise<TwapAtHeight[]> => {
  const res = await chain.queryContract<[]>(oracleContract, {
    t_w_a_p_at_height: {
      token: token,
      height: height.toString(),
    },
  });
  const twaps: TwapAtHeight[] = [];
  for (let asset of res) {
    twaps.push({ info: asset[0], twap: +asset[1] });
  }
  return twaps;
};

type PrecisionResponse = {
  denom: string;
  decimals: number;
};

type PairInfo = {
  asset_infos: Record<'native_token' | 'token', { denom: string }>[];
  contract_addr: string;
  liquidity_token: string;
  pair_type: Record<string, object>;
};

type VestingLpVaultConfig = {
  name: string;
  description: string;
  atom_vesting_lp_contract: string;
  atom_oracle_contract: string;
  usdc_vesting_lp_contract: string;
  usdc_oracle_contract: string;
  owner: string;
  manager: string | undefined;
};

type UnclaimedAmountResponse = {
  data: string;
};

type VotingPowerResponse = {
  power: string;
  height: number;
};

type TwapAtHeight = {
  info: Token | NativeToken;
  twap: number;
};
