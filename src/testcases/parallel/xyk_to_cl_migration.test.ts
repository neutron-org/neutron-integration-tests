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
const MAIN_DAO_KEY = 'DAO';
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
  let cmStranger: WalletWrapper;
  let ntrnDenom: string;
  let atomDenom: string;
  let usdcDenom: string;

  // initial prices
  const atomNtrnPriceRate = 50; // 1 ATOM = 50 NTRN
  const usdcNtrnPriceRate = 5; // 1 USDC = 5 NTRN
  // amounts of assets to be minted
  const ntrnMintAmount = 50_000_000_000_000;
  const atomMintAmount = ntrnMintAmount / atomNtrnPriceRate;
  const usdcMintAmount = ntrnMintAmount / usdcNtrnPriceRate;
  const keepToProvideRatio = 0.005; // keep 0.5% of provided assets for future swap (price change)
  // amounts of assets to be kept out of the pools
  const ntrnKeptAmount = Math.floor(ntrnMintAmount * keepToProvideRatio);
  const atomKeptAmount = Math.floor(atomMintAmount * keepToProvideRatio);
  const usdcKeptAmount = Math.floor(usdcMintAmount * keepToProvideRatio);
  // amounts of assets to be provided to pools
  const ntrnProvideAmount = ntrnMintAmount - ntrnKeptAmount;
  const atomProvideAmount = atomMintAmount - atomKeptAmount;
  const usdcProvideAmount = usdcMintAmount - usdcKeptAmount;

  console.log('ntrn provide to keep:', ntrnProvideAmount, ntrnKeptAmount);
  console.log('atom provide to keep:', atomProvideAmount, atomKeptAmount);
  console.log('usdc provide to keep:', usdcProvideAmount, usdcKeptAmount);

  let ntrnAtomTotalLpTokens: number;
  let ntrnUsdcTotalLpTokens: number;

  // shares of LP tokens to be distributed across contracts to migrate as pre-migration balances
  const reserveLpTokensFraction = 1 / 5;
  let reserveNtrnAtomShare: number;
  let reserveNtrnUsdcShare: number;

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
    cmStranger = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.genQaWal1,
    );
  });

  describe('prepare env to migration', () => {
    test('deploy contracts, allocate funds', async () => {
      const deployResp = await deployContracts(cmInstantiator);
      contractAddresses = deployResp.contractAddresses;
      contractAddresses[MAIN_DAO_KEY] =
        cmInstantiator.wallet.address.toString();
      codeIds = deployResp.codeIds;

      // create clones of main assets with huge total supply
      ntrnDenom = await createNativeDenom(
        cmInstantiator,
        TEST_NTRN_SUBDENOM,
        ntrnMintAmount * 2,
      );
      atomDenom = await createNativeDenom(
        cmInstantiator,
        TEST_ATOM_SUBDENOM,
        atomMintAmount,
      );
      usdcDenom = await createNativeDenom(
        cmInstantiator,
        TEST_USDC_SUBDENOM,
        usdcMintAmount,
      );
      await storeTokensPrecision(cmInstantiator, contractAddresses, [
        [ntrnDenom, 6],
        [atomDenom, 6],
        [usdcDenom, 6],
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
          [nativeTokenInfo(ntrnDenom), nativeTokenInfo(atomDenom)],
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
                nativeToken(atomDenom, atomProvideAmount.toString()),
                nativeToken(ntrnDenom, ntrnProvideAmount.toString()),
              ],
              slippage_tolerance: '0.5',
            },
          }),
          [
            {
              denom: atomDenom,
              amount: atomProvideAmount.toString(),
            },
            {
              denom: ntrnDenom,
              amount: ntrnProvideAmount.toString(),
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
          [nativeTokenInfo(ntrnDenom), nativeTokenInfo(usdcDenom)],
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
                nativeToken(usdcDenom, usdcProvideAmount.toString()),
                nativeToken(ntrnDenom, ntrnProvideAmount.toString()),
              ],
              slippage_tolerance: '0.5',
            },
          }),
          [
            {
              denom: usdcDenom,
              amount: usdcProvideAmount.toString(),
            },
            {
              denom: ntrnDenom,
              amount: ntrnProvideAmount.toString(),
            },
          ],
        );
        expect(res.code).toBe(0);
      });

      test('query LP token balances', async () => {
        const ntrnAtomLpBalance = await neutronChain.queryCw20Balance(
          contractAddresses[NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY],
          cmInstantiator.wallet.address.toString(),
        );
        ntrnAtomTotalLpTokens = ntrnAtomLpBalance;
        expect(ntrnAtomTotalLpTokens).toBeGreaterThan(0);

        const ntrnUsdcLpBalance = await neutronChain.queryCw20Balance(
          contractAddresses[NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY],
          cmInstantiator.wallet.address.toString(),
        );
        ntrnUsdcTotalLpTokens = ntrnUsdcLpBalance;
        expect(ntrnUsdcTotalLpTokens).toBeGreaterThan(0);

        reserveNtrnAtomShare = Math.floor(
          ntrnAtomTotalLpTokens * reserveLpTokensFraction,
        );
        reserveNtrnUsdcShare = Math.floor(
          ntrnUsdcTotalLpTokens * reserveLpTokensFraction,
        );
      });

      describe('distribute funds across contracts', () => {
        test('fund reserve contract', async () => {
          const reserveNtrnAtomLpTokenShare = Math.floor(
            ntrnAtomTotalLpTokens * reserveLpTokensFraction,
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
          const reserveNtrnAtomLpBalance = await neutronChain.queryCw20Balance(
            contractAddresses[NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY],
            contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
          );
          expect(reserveNtrnAtomLpBalance).toEqual(reserveNtrnAtomLpTokenShare);

          const reserveNtrnUsdcLpTokenShare = Math.floor(
            ntrnUsdcTotalLpTokens * reserveLpTokensFraction,
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
          const reserveNtrnUsdcLpBalance = await neutronChain.queryCw20Balance(
            contractAddresses[NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY],
            contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
          );
          expect(reserveNtrnUsdcLpBalance).toEqual(reserveNtrnUsdcLpTokenShare);
        });
      });
    });

    describe('replace xyk with CL pools', () => {
      test('deregister xyk pairs', async () => {
        await deregisterPair(cmInstantiator, contractAddresses, [
          nativeTokenInfo(ntrnDenom),
          nativeTokenInfo(atomDenom),
        ]);
        await deregisterPair(cmInstantiator, contractAddresses, [
          nativeTokenInfo(ntrnDenom),
          nativeTokenInfo(usdcDenom),
        ]);
      });

      test('create CL pairs', async () => {
        const ntrnAtomClPairInfo = await deployClPair(
          neutronChain,
          cmInstantiator,
          contractAddresses,
          [nativeTokenInfo(atomDenom), nativeTokenInfo(ntrnDenom)],
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
          [nativeTokenInfo(usdcDenom), nativeTokenInfo(ntrnDenom)],
          usdcNtrnPriceRate,
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
          max_slippage: '0.05', // 5%
          ntrn_denom: ntrnDenom,
          atom_denom: atomDenom,
          ntrn_atom_xyk_pair:
            contractAddresses[NTRN_ATOM_XYK_PAIR_CONTRACT_KEY],
          ntrn_atom_cl_pair: contractAddresses[NTRN_ATOM_CL_PAIR_CONTRACT_KEY],
          usdc_denom: usdcDenom,
          ntrn_usdc_xyk_pair:
            contractAddresses[NTRN_USDC_XYK_PAIR_CONTRACT_KEY],
          ntrn_usdc_cl_pair: contractAddresses[NTRN_USDC_CL_PAIR_CONTRACT_KEY],
        }),
      );
      expect(res.code).toBe(0);
    });

    test('unable to migrate with a greater slippage than allowed', async () => {
      await expect(
        cmInstantiator.executeContract(
          contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
          JSON.stringify({
            migrate_from_xyk_to_cl: {
              slippage_tolerance: '0.06', // 6% > 5%
            },
          }),
        ),
      ).rejects.toThrow(
        /Provided slippage tolerance 0.06 is more than the max allowed/,
      );
    });

    test('partial precise migration', async () => {
      const balancesBefore = await queryReserveLpTokenBalances(
        neutronChain,
        contractAddresses,
      );
      const migrationAmount = Math.floor(
        Math.min(reserveNtrnAtomShare, reserveNtrnUsdcShare) / 4,
      );

      const res = await cmInstantiator.executeContract(
        contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
        JSON.stringify({
          migrate_from_xyk_to_cl: {
            slippage_tolerance: '0.001', // 0.1%
            ntrn_atom_amount: migrationAmount.toString(),
            ntrn_usdc_amount: migrationAmount.toString(),
          },
        }),
      );
      expect(res.code).toBe(0);

      const balancesAfter = await queryReserveLpTokenBalances(
        neutronChain,
        contractAddresses,
      );
      expect(balancesAfter.ntrn_atom_xyk).toEqual(
        balancesBefore.ntrn_atom_xyk - migrationAmount,
      );
      expect(balancesAfter.ntrn_usdc_xyk).toEqual(
        balancesBefore.ntrn_usdc_xyk - migrationAmount,
      );
      expect(balancesAfter.ntrn_atom_cl).toEqual(0);
      expect(balancesAfter.ntrn_usdc_cl).toEqual(0);
      expect(balancesAfter.dao_ntrn_atom_cl).toBeGreaterThan(
        balancesBefore.dao_ntrn_atom_cl,
      );
      expect(balancesAfter.dao_ntrn_usdc_cl).toBeGreaterThan(
        balancesBefore.dao_ntrn_usdc_cl,
      );
    });

    describe('migration on price change', () => {
      test('move ntrn price up in both XYK pools', async () => {
        let res = await cmInstantiator.executeContract(
          contractAddresses[NTRN_ATOM_XYK_PAIR_CONTRACT_KEY],
          JSON.stringify({
            swap: {
              offer_asset: nativeToken(atomDenom, atomKeptAmount.toString()),
              max_spread: '0.5', // 50% — we don't care about swap slippage
            },
          }),
          [
            {
              denom: atomDenom,
              amount: atomKeptAmount.toString(),
            },
          ],
        );
        expect(res.code).toBe(0);

        res = await cmInstantiator.executeContract(
          contractAddresses[NTRN_USDC_XYK_PAIR_CONTRACT_KEY],
          JSON.stringify({
            swap: {
              offer_asset: nativeToken(usdcDenom, usdcKeptAmount.toString()),
              max_spread: '0.5', // 50% — we don't care about swap slippage
            },
          }),
          [
            {
              denom: usdcDenom,
              amount: usdcKeptAmount.toString(),
            },
          ],
        );
        expect(res.code).toBe(0);
      });
      test('unable to migrate with a too low slippage tolerance', async () => {
        const migrationAmount = Math.floor(
          Math.min(reserveNtrnAtomShare, reserveNtrnUsdcShare) / 10,
        );
        await expect(
          cmInstantiator.executeContract(
            contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
            JSON.stringify({
              migrate_from_xyk_to_cl: {
                slippage_tolerance: '0.001', // 0.1% shouldn't be enough now
                ntrn_atom_amount: migrationAmount.toString(),
                ntrn_usdc_amount: migrationAmount.toString(),
              },
            }),
          ),
        ).rejects.toThrow(/Operation exceeds max spread limit/);
      });
      test('migrate with a bigger slippage tolerance', async () => {
        const migrationAmount = Math.floor(
          Math.min(reserveNtrnAtomShare, reserveNtrnUsdcShare) / 10,
        );
        const res = await cmInstantiator.executeContract(
          contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
          JSON.stringify({
            migrate_from_xyk_to_cl: {
              slippage_tolerance: '0.05', // 5%
              ntrn_atom_amount: migrationAmount.toString(),
              ntrn_usdc_amount: migrationAmount.toString(),
            },
          }),
        );
        expect(res.code).toBe(0);
      });
    });

    test('partial migration called by a stranger', async () => {
      const balancesBefore = await queryReserveLpTokenBalances(
        neutronChain,
        contractAddresses,
      );
      const migrationAmount = Math.floor(
        Math.min(reserveNtrnAtomShare, reserveNtrnUsdcShare) / 4,
      );

      const res = await cmStranger.executeContract(
        contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
        JSON.stringify({
          migrate_from_xyk_to_cl: {
            slippage_tolerance: '0.05',
            ntrn_atom_amount: migrationAmount.toString(),
            ntrn_usdc_amount: migrationAmount.toString(),
          },
        }),
      );
      expect(res.code).toBe(0);

      const balancesAfter = await queryReserveLpTokenBalances(
        neutronChain,
        contractAddresses,
      );
      expect(balancesAfter.ntrn_atom_xyk).toEqual(
        balancesBefore.ntrn_atom_xyk - migrationAmount,
      );
      expect(balancesAfter.ntrn_usdc_xyk).toEqual(
        balancesBefore.ntrn_usdc_xyk - migrationAmount,
      );
      expect(balancesAfter.ntrn_atom_cl).toEqual(0);
      expect(balancesAfter.ntrn_usdc_cl).toEqual(0);
      expect(balancesAfter.dao_ntrn_atom_cl).toBeGreaterThan(
        balancesBefore.dao_ntrn_atom_cl,
      );
      expect(balancesAfter.dao_ntrn_usdc_cl).toBeGreaterThan(
        balancesBefore.dao_ntrn_usdc_cl,
      );
    });

    test('unable to migrate more tokens than available', async () => {
      await expect(
        cmInstantiator.executeContract(
          contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
          JSON.stringify({
            migrate_from_xyk_to_cl: {
              ntrn_atom_amount: reserveNtrnAtomShare.toString(),
              ntrn_usdc_amount: reserveNtrnUsdcShare.toString(),
            },
          }),
        ),
      ).rejects.toThrow(
        /Amount to be migrated is greater that the max available amount/,
      );
    });

    test('full migration for one of the pairs', async () => {
      const balancesBefore = await queryReserveLpTokenBalances(
        neutronChain,
        contractAddresses,
      );
      const migrationAmount = Math.floor(
        Math.min(reserveNtrnAtomShare, reserveNtrnUsdcShare) / 4,
      );

      const res = await cmInstantiator.executeContract(
        contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
        JSON.stringify({
          migrate_from_xyk_to_cl: {
            slippage_tolerance: '0.05',
            // ntrn_atom_amount is undefined => all liquidity is expected to be migrated
            ntrn_usdc_amount: migrationAmount.toString(),
          },
        }),
      );
      expect(res.code).toBe(0);

      const balancesAfter = await queryReserveLpTokenBalances(
        neutronChain,
        contractAddresses,
      );
      expect(balancesAfter.ntrn_atom_xyk).toEqual(0);
      expect(balancesAfter.ntrn_usdc_xyk).toEqual(
        balancesBefore.ntrn_usdc_xyk - migrationAmount,
      );
      expect(balancesAfter.ntrn_atom_cl).toEqual(0);
      expect(balancesAfter.ntrn_usdc_cl).toEqual(0);
      expect(balancesAfter.dao_ntrn_atom_cl).toBeGreaterThan(
        balancesBefore.dao_ntrn_atom_cl,
      );
      expect(balancesAfter.dao_ntrn_usdc_cl).toBeGreaterThan(
        balancesBefore.dao_ntrn_usdc_cl,
      );
    });

    test('full migration of another pair', async () => {
      const balancesBefore = await queryReserveLpTokenBalances(
        neutronChain,
        contractAddresses,
      );

      const res = await cmInstantiator.executeContract(
        contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
        JSON.stringify({
          migrate_from_xyk_to_cl: {
            slippage_tolerance: '0.05',
            // amounts are not defined => all liquidity is expected to be migrated
          },
        }),
      );
      expect(res.code).toBe(0);

      const balancesAfter = await queryReserveLpTokenBalances(
        neutronChain,
        contractAddresses,
      );
      expect(balancesAfter.ntrn_atom_xyk).toEqual(0);
      expect(balancesAfter.ntrn_usdc_xyk).toEqual(0);
      expect(balancesAfter.ntrn_atom_cl).toEqual(0);
      expect(balancesAfter.ntrn_usdc_cl).toEqual(0);
      expect(balancesAfter.dao_ntrn_atom_cl).toEqual(
        balancesBefore.dao_ntrn_atom_cl,
      ); // was fully migrated on prev step
      expect(balancesAfter.dao_ntrn_usdc_cl).toBeGreaterThan(
        balancesBefore.dao_ntrn_usdc_cl,
      );
    });

    test('check reserve contract NTRN/ATOM LP balances', async () => {
      const ntrnAtomXykLpBalance = await neutronChain.queryCw20Balance(
        contractAddresses[NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY],
        contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
      );
      expect(ntrnAtomXykLpBalance).toEqual(0);

      const ntrnAtomClLpBalance = await neutronChain.queryCw20Balance(
        contractAddresses[NTRN_ATOM_CL_LP_TOKEN_CONTRACT_KEY],
        contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
      );
      expect(ntrnAtomClLpBalance).toEqual(0);
    });

    test('check reserve contract NTRN/USDC LP balances', async () => {
      const ntrnUsdcXykLpBalance = await neutronChain.queryCw20Balance(
        contractAddresses[NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY],
        contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
      );
      expect(ntrnUsdcXykLpBalance).toEqual(0);

      const ntrnUsdcClLpBalance = await neutronChain.queryCw20Balance(
        contractAddresses[NTRN_USDC_CL_LP_TOKEN_CONTRACT_KEY],
        contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
      );
      expect(ntrnUsdcClLpBalance).toEqual(0);
    });
  });
});

const deployContracts = async (
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

const queryReserveLpTokenBalances = async (
  chain: CosmosWrapper,
  contractAddresses: Record<string, string>,
): Promise<LpTokenBalances> => {
  const ntrnAtomXykLpBalance = await chain.queryCw20Balance(
    contractAddresses[NTRN_ATOM_XYK_LP_TOKEN_CONTRACT_KEY],
    contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
  );
  const ntrnUsdcXykLpBalance = await chain.queryCw20Balance(
    contractAddresses[NTRN_USDC_XYK_LP_TOKEN_CONTRACT_KEY],
    contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
  );
  const ntrnAtomClLpBalance = await chain.queryCw20Balance(
    contractAddresses[NTRN_ATOM_CL_LP_TOKEN_CONTRACT_KEY],
    contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
  );
  const ntrnUsdcClLpBalance = await chain.queryCw20Balance(
    contractAddresses[NTRN_USDC_CL_LP_TOKEN_CONTRACT_KEY],
    contractAddresses[RESERVE_CURRENT_CONTRACT_KEY],
  );
  const ntrnAtomClLpDAOBalance = await chain.queryCw20Balance(
    contractAddresses[NTRN_ATOM_CL_LP_TOKEN_CONTRACT_KEY],
    contractAddresses[MAIN_DAO_KEY],
  );
  const ntrnUsdcClLpDAOBalance = await chain.queryCw20Balance(
    contractAddresses[NTRN_USDC_CL_LP_TOKEN_CONTRACT_KEY],
    contractAddresses[MAIN_DAO_KEY],
  );
  return {
    ntrn_atom_xyk: ntrnAtomXykLpBalance,
    ntrn_usdc_xyk: ntrnUsdcXykLpBalance,
    ntrn_atom_cl: ntrnAtomClLpBalance,
    ntrn_usdc_cl: ntrnUsdcClLpBalance,
    dao_ntrn_atom_cl: ntrnAtomClLpDAOBalance,
    dao_ntrn_usdc_cl: ntrnUsdcClLpDAOBalance,
  };
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

type LpTokenBalances = {
  ntrn_atom_xyk: number;
  ntrn_usdc_xyk: number;
  ntrn_atom_cl: number;
  ntrn_usdc_cl: number;
  dao_ntrn_atom_cl: number;
  dao_ntrn_usdc_cl: number;
};
