import {
  NativeToken,
  NeutronContract,
  nativeToken,
  nativeTokenInfo,
} from '../../helpers/types';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
  getEventAttribute,
} from '../../helpers/cosmos';
import { msgMintDenom, msgCreateDenom } from '../../helpers/tokenfactory';

// subdenoms for test dedicated tokens creation.
const TEST_NTRN_SUBDENOM = 'migrationuntrn';
const TEST_ATOM_SUBDENOM = 'migrationuibcatom';
const TEST_USDC_SUBDENOM = 'migrationuibcusdc';

// general contract keys used across the tests
const ASTRO_PAIR_CONTRACT_KEY = 'ASTRO_PAIR';
const ASTRO_FACTORY_CONTRACT_KEY = 'ASTRO_FACTORY';
const ASTRO_PAIR_CONCENTRATED_CONTRACT_KEY = 'ASTRO_PAIR_CONCENTRATED';
const ASTRO_COIN_REGISTRY_CONTRACT_KEY = 'ASTRO_COIN_REGISTRY';
const RESERVE_NEW_CONTRACT_KEY = 'RESERVE';
const RESERVE_CURRENT_CONTRACT_KEY = 'RESERVE_CURRENT';
const CW20_BASE_CONTRACT_KEY = 'CW20_BASE';

// specific contract keys used across the tests
const NTRN_ATOM_XYK_PAIR_CONTRACT_KEY = 'NTRN_ATOM_XYK_PAIR';
const NTRN_USDC_XYK_PAIR_CONTRACT_KEY = 'NTRN_USDC_XYK_PAIR';
const NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY = 'NTRN_ATOM_XYK_LP_TOKEN';
const NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY = 'NTRN_USDC_XYK_LP_TOKEN';
const NTRN_ATOM_CL_PAIR_CONTRACT_KEY = 'NTRN_ATOM_CL_PAIR';
const NTRN_USDC_CL_PAIR_CONTRACT_KEY = 'NTRN_USDC_CL_PAIR';
const NTRN_ATOM_CL_LP_TOKEN_CONTRACT_KEY = 'NTRN_ATOM_CL_LP_TOKEN';
const NTRN_USDC_CL_LP_TOKEN_CONTRACT_KEY = 'NTRN_USDC_CL_LP_TOKEN';

describe('Neutron / Migration from xyk to CL pools', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let contractAddresses: Record<string, string> = {};
  let codeIds: Record<string, number>;
  let cmInstantiator: WalletWrapper;
  let testNtrnDenom: string;
  let testAtomDenom: string;
  let testUsdcDenom: string;

  const atomNtrnPriceRate = 50; // 1 ATOM = 50 NTRN
  const atomUsdcPriceRate = 5; // 1 USDC = 5 NTRN
  // amounts of assets to be provided to pools
  const testNtrnProvideAmount = 50_000_000_000_000;
  const testAtomProvideAmount = testNtrnProvideAmount / atomNtrnPriceRate;
  const testUsdcProvideAmount = testNtrnProvideAmount / atomUsdcPriceRate;

  let ntrnAtomTotalLpTokens: number;
  let ntrnUsdcTotalLpTokens: number;

  // shares of LP tokens to be distributed across contracts to migrate as pre-migration balances
  const reserveLpTokensShare = 1 / 5;

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
      testState.wallets.qaNeutron.genQaWal1,
    );
  });

  describe('prepare env to migration', () => {
    test('deploy contracts, allocate funds', async () => {
      const deployResp = await deployContracts(neutronChain, cmInstantiator);
      contractAddresses = deployResp.contractAddresses;
      codeIds = deployResp.codeIds;

      // create clones of main assets with huge total supply
      testNtrnDenom = await createNativeDenom(
        cmInstantiator,
        TEST_NTRN_SUBDENOM,
        testNtrnProvideAmount * 2,
      );
      testAtomDenom = await createNativeDenom(
        cmInstantiator,
        TEST_ATOM_SUBDENOM,
        testAtomProvideAmount,
      );
      testUsdcDenom = await createNativeDenom(
        cmInstantiator,
        TEST_USDC_SUBDENOM,
        testUsdcProvideAmount,
      );
      await storeTokensPrecision(cmInstantiator, contractAddresses, [
        [testNtrnDenom, 6],
        [testAtomDenom, 6],
        [testUsdcDenom, 6],
      ]);
      console.log(
        'cmInstantiator balances:',
        cmInstantiator.wallet.address.toString(),
        await neutronChain.queryBalances(
          cmInstantiator.wallet.address.toString(),
        ),
      );
    });

    describe('prepare xyk pairs', () => {
      test('create and fill NTRN/ATOM xyk pair', async () => {
        const ntrnAtomXykPairInfo = await deployXykPair(
          neutronChain,
          cmInstantiator,
          contractAddresses,
          [nativeTokenInfo(testNtrnDenom), nativeTokenInfo(testAtomDenom)],
        );
        contractAddresses[NTRN_ATOM_XYK_PAIR_CONTRACT_KEY] =
          ntrnAtomXykPairInfo.contract_addr;
        contractAddresses[NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY] =
          ntrnAtomXykPairInfo.liquidity_token;

        const res = await cmInstantiator.executeContract(
          contractAddresses[NTRN_ATOM_XYK_PAIR_CONTRACT_KEY],
          JSON.stringify({
            provide_liquidity: {
              assets: [
                nativeToken(testAtomDenom, testAtomProvideAmount.toString()),
                nativeToken(testNtrnDenom, testNtrnProvideAmount.toString()),
              ],
              slippage_tolerance: '0.5',
            },
          }),
          [
            {
              denom: testAtomDenom,
              amount: testAtomProvideAmount.toString(),
            },
            {
              denom: testNtrnDenom,
              amount: testNtrnProvideAmount.toString(),
            },
          ],
        );
        expect(res.code).toBe(0);
      });

      test('create and fill NTRN/USDC xyk pair', async () => {
        const ntrnUsdcXykPairInfo = await deployXykPair(
          neutronChain,
          cmInstantiator,
          contractAddresses,
          [nativeTokenInfo(testNtrnDenom), nativeTokenInfo(testUsdcDenom)],
        );
        contractAddresses[NTRN_USDC_XYK_PAIR_CONTRACT_KEY] =
          ntrnUsdcXykPairInfo.contract_addr;
        contractAddresses[NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY] =
          ntrnUsdcXykPairInfo.liquidity_token;

        const res = await cmInstantiator.executeContract(
          contractAddresses[NTRN_USDC_XYK_PAIR_CONTRACT_KEY],
          JSON.stringify({
            provide_liquidity: {
              assets: [
                nativeToken(testUsdcDenom, testUsdcProvideAmount.toString()),
                nativeToken(testNtrnDenom, testNtrnProvideAmount.toString()),
              ],
              slippage_tolerance: '0.5',
            },
          }),
          [
            {
              denom: testUsdcDenom,
              amount: testUsdcProvideAmount.toString(),
            },
            {
              denom: testNtrnDenom,
              amount: testNtrnProvideAmount.toString(),
            },
          ],
        );
        expect(res.code).toBe(0);
      });

      test('query LP token balances', async () => {
        const ntrnAtomLpBalance = await neutronChain.queryContract<{
          balance: string;
        }>(contractAddresses[NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY], {
          balance: {
            address: cmInstantiator.wallet.address.toString(),
          },
        });
        ntrnAtomTotalLpTokens = +ntrnAtomLpBalance.balance;
        expect(ntrnAtomTotalLpTokens).toBeGreaterThan(0);

        const ntrnUsdcLpBalance = await neutronChain.queryContract<{
          balance: string;
        }>(contractAddresses[NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY], {
          balance: {
            address: cmInstantiator.wallet.address.toString(),
          },
        });
        ntrnUsdcTotalLpTokens = +ntrnUsdcLpBalance.balance;
        expect(ntrnUsdcTotalLpTokens).toBeGreaterThan(0);
      });

      describe('distribute funds across contracts', () => {
        test('fund reserve contract', async () => {
          const reserveNtrnAtomLpTokenShare = Math.floor(
            ntrnAtomTotalLpTokens * reserveLpTokensShare,
          );
          let res = await cmInstantiator.executeContract(
            contractAddresses[NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY],
            JSON.stringify({
              transfer: {
                amount: reserveNtrnAtomLpTokenShare.toString(),
                recipient: contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
              },
            }),
          );
          expect(res.code).toBe(0);
          const reserveNtrnAtomLpBalance = await neutronChain.queryContract<{
            balance: string;
          }>(contractAddresses[NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY], {
            balance: {
              address: contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
            },
          });
          expect(+reserveNtrnAtomLpBalance.balance).toEqual(
            reserveNtrnAtomLpTokenShare,
          );

          const reserveNtrnUsdcLpTokenShare = Math.floor(
            ntrnUsdcTotalLpTokens * reserveLpTokensShare,
          );
          res = await cmInstantiator.executeContract(
            contractAddresses[NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY],
            JSON.stringify({
              transfer: {
                amount: reserveNtrnUsdcLpTokenShare.toString(),
                recipient: contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
              },
            }),
          );
          expect(res.code).toBe(0);
          const reserveNtrnUsdcLpBalance = await neutronChain.queryContract<{
            balance: string;
          }>(contractAddresses[NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY], {
            balance: {
              address: contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
            },
          });
          expect(+reserveNtrnUsdcLpBalance.balance).toEqual(
            reserveNtrnUsdcLpTokenShare,
          );
        });
      });
    });

    describe('replace xyk with CL pools', () => {
      test('deregister xyk pairs', async () => {
        await deregisterPair(cmInstantiator, contractAddresses, [
          nativeTokenInfo(testNtrnDenom),
          nativeTokenInfo(testAtomDenom),
        ]);
        await deregisterPair(cmInstantiator, contractAddresses, [
          nativeTokenInfo(testNtrnDenom),
          nativeTokenInfo(testUsdcDenom),
        ]);
      });

      test('create CL pairs', async () => {
        const ntrnAtomClPairInfo = await deployClPair(
          neutronChain,
          cmInstantiator,
          contractAddresses,
          [nativeTokenInfo(testAtomDenom), nativeTokenInfo(testNtrnDenom)],
          atomNtrnPriceRate,
        );
        contractAddresses[NTRN_ATOM_CL_PAIR_CONTRACT_KEY] =
          ntrnAtomClPairInfo.contract_addr;
        contractAddresses[NTRN_ATOM_CL_LP_TOKEN_CONTRACT_KEY] =
          ntrnAtomClPairInfo.liquidity_token;

        const ntrnUsdcClPairInfo = await deployClPair(
          neutronChain,
          cmInstantiator,
          contractAddresses,
          [nativeTokenInfo(testUsdcDenom), nativeTokenInfo(testNtrnDenom)],
          atomUsdcPriceRate,
        );
        contractAddresses[NTRN_USDC_CL_PAIR_CONTRACT_KEY] =
          ntrnUsdcClPairInfo.contract_addr;
        contractAddresses[NTRN_USDC_CL_LP_TOKEN_CONTRACT_KEY] =
          ntrnUsdcClPairInfo.liquidity_token;

        console.log('contracts:', contractAddresses);
      });
    });
  });

  describe('migrate reserve contract', () => {
    test('execute migration', async () => {
      const res = await cmInstantiator.migrateContract(
        contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
        codeIds[RESERVE_NEW_CONTRACT_KEY],
        JSON.stringify({
          ntrn_denom: testNtrnDenom,
          atom_denom: testAtomDenom,
          ntrn_atom_xyk_pair_address:
            contractAddresses[NTRN_ATOM_XYK_PAIR_CONTRACT_KEY],
          ntrn_atom_cl_pair_address:
            contractAddresses[NTRN_ATOM_CL_PAIR_CONTRACT_KEY],
          usdc_denom: testUsdcDenom,
          ntrn_usdc_xyk_pair_address:
            contractAddresses[NTRN_USDC_XYK_PAIR_CONTRACT_KEY],
          ntrn_usdc_cl_pair_address:
            contractAddresses[NTRN_USDC_CL_PAIR_CONTRACT_KEY],
        }),
      );
      expect(res.code).toBe(0);
    });
    test('check reserve contract NTRN/ATOM LP balances', async () => {
      const ntrnAtomXykLpBalance = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses[NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY], {
        balance: {
          address: contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
        },
      });
      expect(+ntrnAtomXykLpBalance.balance).toEqual(0);

      const ntrnAtomClLpBalance = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses[NTRN_ATOM_CL_LP_TOKEN_CONTRACT_KEY], {
        balance: {
          address: contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
        },
      });
      expect(+ntrnAtomClLpBalance.balance).toBeGreaterThan(0);
    });
    test('check reserve contract NTRN/USDC LP balances', async () => {
      const ntrnUsdcXykLpBalance = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses[NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY], {
        balance: {
          address: contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
        },
      });
      expect(+ntrnUsdcXykLpBalance.balance).toEqual(0);

      const ntrnUsdcClLpBalance = await neutronChain.queryContract<{
        balance: string;
      }>(contractAddresses[NTRN_USDC_CL_LP_TOKEN_CONTRACT_KEY], {
        balance: {
          address: contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
        },
      });
      expect(+ntrnUsdcClLpBalance.balance).toBeGreaterThan(0);
    });
  });
});

const deployContracts = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
): Promise<{
  contractAddresses: Record<string, string>;
  codeIds: Record<string, number>;
}> => {
  const codeIds: Record<string, number> = {};
  for (const contract of [
    ASTRO_PAIR_CONTRACT_KEY,
    ASTRO_FACTORY_CONTRACT_KEY,
    ASTRO_PAIR_CONCENTRATED_CONTRACT_KEY,
    ASTRO_COIN_REGISTRY_CONTRACT_KEY,
    RESERVE_NEW_CONTRACT_KEY,
    RESERVE_CURRENT_CONTRACT_KEY,
    CW20_BASE_CONTRACT_KEY,
  ]) {
    const codeId = await instantiator.storeWasm(NeutronContract[contract]);
    expect(codeId).toBeGreaterThan(0);
    codeIds[contract] = codeId;
  }

  const contractAddresses: Record<string, string> = {};

  await deployCoinRegistry(instantiator, codeIds, contractAddresses);
  await deployFactory(instantiator, codeIds, contractAddresses);
  await deployReserve(instantiator, codeIds, contractAddresses);
  return { contractAddresses, codeIds };
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
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
  coinPrecisions: any[][],
) => {
  const execRes = await instantiator.executeContract(
    contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
    JSON.stringify({
      add: {
        native_coins: coinPrecisions,
      },
    }),
  );
  expect(execRes.code).toBe(0);
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
      {
        code_id: codeIds[ASTRO_PAIR_CONCENTRATED_CONTRACT_KEY],
        pair_type: {
          custom: 'concentrated',
        },
        total_fee_bps: 0,
        maker_fee_bps: 0,
        is_disabled: false,
        is_generator_disabled: false,
      },
    ],
    token_code_id: codeIds[CW20_BASE_CONTRACT_KEY],
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

const deployReserve = async (
  cm: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await cm.instantiateContract(
    codeIds[RESERVE_CURRENT_CONTRACT_KEY],
    JSON.stringify({
      main_dao_address: cm.wallet.address.toString(),
      denom: NEUTRON_DENOM,
      distribution_rate: '0.23',
      min_period: 1000,
      distribution_contract: cm.wallet.address.toString(),
      treasury_contract: cm.wallet.address.toString(),
      security_dao_address: cm.wallet.address.toString(),
      vesting_denominator: '100000000000',
    }),
    'reserve',
  );
  expect(res).toBeTruthy();
  contractAddresses[RESERVE_CURRENT_CONTRACT_KEY] = res[0]._contract_address;
};

const deployXykPair = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
  assetInfos: NativeToken[],
): Promise<PairInfo> => {
  const createMsg = {
    create_pair: {
      pair_type: { xyk: {} },
      asset_infos: assetInfos,
    },
  };

  const execRes = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(createMsg),
  );
  expect(execRes.code).toBe(0);

  const pairInfo = await chain.queryContract<PairInfo>(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    {
      pair: {
        asset_infos: assetInfos,
      },
    },
  );
  return pairInfo;
};

const deployClPair = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
  assetInfos: NativeToken[],
  initPriceScale: number,
): Promise<PairInfo> => {
  const poolInitParams: ConcentratedPoolParams = {
    amp: '40',
    gamma: '0.000145',
    mid_fee: '0.0026',
    out_fee: '0.0045',
    fee_gamma: '0.00023',
    repeg_profit_threshold: '0.000002',
    min_price_scale_delta: '0.000146',
    price_scale: initPriceScale.toString(),
    ma_half_time: 600,
    track_asset_balances: false,
  };

  const createMsg = {
    create_pair: {
      pair_type: { custom: 'concentrated' },
      asset_infos: assetInfos,
      init_params: Buffer.from(JSON.stringify(poolInitParams)).toString(
        'base64',
      ),
    },
  };

  const execRes = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(createMsg),
  );
  expect(execRes.code).toBe(0);

  const pairInfo = await chain.queryContract<PairInfo>(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    {
      pair: {
        asset_infos: assetInfos,
      },
    },
  );
  return pairInfo;
};

const deregisterPair = async (
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
  assetInfos: NativeToken[],
) => {
  const createMsg = {
    deregister: {
      asset_infos: assetInfos,
    },
  };

  const execRes = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(createMsg),
  );
  expect(execRes.code).toBe(0);
};

const createNativeDenom = async (
  instantiator: WalletWrapper,
  subdenom: string,
  mintAmount: number,
): Promise<string> => {
  const data = await msgCreateDenom(
    instantiator,
    instantiator.wallet.address.toString(),
    subdenom,
  );
  const denom = getEventAttribute(
    (data as any).events,
    'create_denom',
    'new_token_denom',
  );
  await msgMintDenom(instantiator, instantiator.wallet.address.toString(), {
    denom: denom,
    amount: mintAmount.toString(),
  });
  return denom;
};

type PairInfo = {
  asset_infos: NativeToken[];
  contract_addr: string;
  liquidity_token: string;
  pair_type: Record<string, object>;
};

type ConcentratedPoolParams = {
  amp: string;
  gamma: string;
  mid_fee: string;
  out_fee: string;
  fee_gamma: string;
  repeg_profit_threshold: string;
  min_price_scale_delta: string;
  price_scale: string;
  ma_half_time: number;
  track_asset_balances: boolean;
};
