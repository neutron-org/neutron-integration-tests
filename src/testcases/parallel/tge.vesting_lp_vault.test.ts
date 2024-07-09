import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { LocalState, createWalletWrapper } from '../../helpers/local_state';
import {
  NativeToken,
  nativeToken,
  nativeTokenInfo,
  NeutronContract,
  PoolStatus,
  Token,
  vestingAccount,
  vestingSchedule,
  vestingSchedulePoint,
} from '@neutron-org/neutronjsplus/dist/types';
import { IBC_ATOM_DENOM, IBC_USDC_DENOM } from '@neutron-org/neutronjsplus';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import { Suite, inject } from 'vitest';

const config = require('../../config.json');

// general contract keys used across the tests
const ASTRO_PAIR_CONTRACT_KEY = 'ASTRO_PAIR_XYK';
const ASTRO_FACTORY_CONTRACT_KEY = 'ASTRO_FACTORY';
const ASTRO_TOKEN_CONTRACT_KEY = 'ASTRO_TOKEN';
const ASTRO_COIN_REGISTRY_CONTRACT_KEY = 'ASTRO_COIN_REGISTRY';
const VESTING_LP_CONTRACT_KEY = 'VESTING_LP';
const VESTING_LP_VAULT_CONTRACT_KEY = 'VESTING_LP_VAULT';
const ORACLE_HISTORY_CONTRACT_KEY = 'ORACLE_HISTORY';
const CW20_BASE_CONTRACT_KEY = 'CW20_BASE';
// specific contract keys used across the tests
const VESTING_LP_USDC_CONTRACT_KEY = 'VESTING_LP_USDC';
const VESTING_LP_ATOM_CONTRACT_KEY = 'VESTING_LP_ATOM';
const ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY = 'ORACLE_HISTORY_NTRN_USDC';
const ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY = 'ORACLE_HISTORY_NTRN_ATOM';
const NTRN_ATOM_PAIR_CONTRACT_KEY = 'NTRN_ATOM_PAIR';
const NTRN_ATOM_LP_TOKEN_CONTRACT_KEY = 'NTRN_ATOM_LP_TOKEN';
const NTRN_USDC_PAIR_CONTRACT_KEY = 'NTRN_USDC_PAIR';
const NTRN_USDC_LP_TOKEN_CONTRACT_KEY = 'NTRN_USDC_LP_TOKEN';

describe('Neutron / TGE / Vesting LP vault', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let cmInstantiator: WalletWrapper;
  let cmManager: WalletWrapper;
  let cmUser1: WalletWrapper;
  let cmUser2: WalletWrapper;
  let contractAddresses: Record<string, string> = {};

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics, suite);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.restNeutron,
      testState.rpcNeutron,
    );
    cmInstantiator = await createWalletWrapper(
      neutronChain,
      await testState.nextWallet('neutron'),
    );
    cmManager = await createWalletWrapper(
      neutronChain,
      await testState.nextWallet('neutron'),
    );
    cmUser1 = await createWalletWrapper(
      neutronChain,
      await testState.nextWallet('neutron'),
    );
    cmUser2 = await createWalletWrapper(
      neutronChain,
      await testState.nextWallet('neutron'),
    );
    contractAddresses = await deployContracts(
      neutronChain,
      cmInstantiator,
      cmManager,
    );
  });

  describe('vesting LP vault', () => {
    test('check initial config', async () => {
      const vaultAddress = contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY];
      const config = await neutronChain.queryContract<VestingLpVaultConfig>(
        vaultAddress,
        { config: {} },
      );
      expect(config).toMatchObject({
        name: 'Vesting lp vault',
        description: 'A vesting lp vault',
        atom_vesting_lp_contract:
          contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
        atom_oracle_contract:
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
        usdc_vesting_lp_contract:
          contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
        usdc_oracle_contract:
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
        owner: cmInstantiator.wallet.address,
      });
    });

    test('make sure bonding is disabled', async () => {
      const vaultAddress = contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY];
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

    const ntrnProvideAmount = 500_000_000; // 500 NTRN per each pool (ATOM, USDC)
    const atomNtrnProvideRatio = 1 / 5; // i.e. 1 ATOM = 5 NTRN
    const atomProvideAmount = ntrnProvideAmount * atomNtrnProvideRatio; // i.e. 100 ATOM
    const usdcNtrnProvideRatio = 4; // i.e. 1 NTRN = 4 USDC
    const usdcProvideAmount = ntrnProvideAmount * usdcNtrnProvideRatio; // i.e. 2_000 USDC

    const atomNtrnTotalShare = Math.floor(
      Math.sqrt(atomProvideAmount * ntrnProvideAmount),
    );
    const usdcNtrnTotalShare = Math.floor(
      Math.sqrt(usdcProvideAmount * ntrnProvideAmount),
    );
    // astroport allocates 1000 of the total share to the pool itself as a dust attack protection
    const atomNtrnProviderShare = atomNtrnTotalShare - 1000;
    const usdcNtrnProviderShare = usdcNtrnTotalShare - 1000;

    const user1AtomVestingAmount = Math.round(atomNtrnProviderShare * (1 / 3));
    const user2AtomVestingAmount =
      atomNtrnProviderShare - user1AtomVestingAmount;

    const user1UsdcVestingAmount = Math.round(usdcNtrnProviderShare * (1 / 3));
    const user2UsdcVestingAmount =
      usdcNtrnProviderShare - user1UsdcVestingAmount;
    describe('prepare oracles', () => {
      test('provide liquidity to NTRN_ATOM pool', async () => {
        const testCoins = [
          {
            denom: IBC_ATOM_DENOM,
            amount: '11500000000',
          },
          {
            denom: IBC_USDC_DENOM,
            amount: '11500000000',
          },
        ];
        const rich = await createWalletWrapper(
          neutronChain,
          testState.wallets.neutron.demo1,
        );
        await rich.wasmClient.sendTokens(
          rich.wallet.address,
          cmManager.wallet.address,
          testCoins,
          {
            gas: '300000',
            amount: [{ denom: neutronChain.denom, amount: '1500' }],
          },
        );
        const providedAssets = [
          nativeToken(IBC_ATOM_DENOM, atomProvideAmount.toString()),
          nativeToken(NEUTRON_DENOM, ntrnProvideAmount.toString()),
        ];
        // as manager so it gets lp tokens necessary for future register_vesting_accounts call
        const execRes = await cmManager.executeContract(
          contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY],
          { provide_liquidity: { assets: providedAssets } },
          [
            { amount: atomProvideAmount.toString(), denom: IBC_ATOM_DENOM },
            { amount: ntrnProvideAmount.toString(), denom: NEUTRON_DENOM },
          ],
        );
        expect(execRes.code).toBe(0);

        expect(
          await neutronChain.queryContract<PoolStatus>(
            contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY],
            { pool: {} },
          ),
        ).toEqual({
          assets: providedAssets,
          total_share: atomNtrnTotalShare.toString(),
        });
      });

      test('provide liquidity to NTRN_USDC pool', async () => {
        const providedAssets = [
          nativeToken(IBC_USDC_DENOM, usdcProvideAmount.toString()),
          nativeToken(NEUTRON_DENOM, ntrnProvideAmount.toString()),
        ];
        // as manager so it gets lp tokens necessary for future register_vesting_accounts call
        const execRes = await cmManager.executeContract(
          contractAddresses[NTRN_USDC_PAIR_CONTRACT_KEY],
          { provide_liquidity: { assets: providedAssets } },
          [
            { amount: usdcProvideAmount.toString(), denom: IBC_USDC_DENOM },
            { amount: ntrnProvideAmount.toString(), denom: NEUTRON_DENOM },
          ],
        );
        expect(execRes.code).toBe(0);

        expect(
          await neutronChain.queryContract<PoolStatus>(
            contractAddresses[NTRN_USDC_PAIR_CONTRACT_KEY],
            { pool: {} },
          ),
        ).toEqual({
          assets: providedAssets,
          total_share: usdcNtrnTotalShare.toString(),
        });
      });

      test('set asset infos for oracles', async () => {
        let execRes = await cmManager.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          {
            set_asset_infos: [
              nativeTokenInfo(IBC_ATOM_DENOM),
              nativeTokenInfo(NEUTRON_DENOM),
            ],
          },
        );
        expect(execRes.code).toBe(0);

        execRes = await cmManager.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          {
            set_asset_infos: [
              nativeTokenInfo(IBC_USDC_DENOM),
              nativeTokenInfo(NEUTRON_DENOM),
            ],
          },
        );
        expect(execRes.code).toBe(0);
      });

      test('call NTRN_ATOM oracle update', async () => {
        let execRes = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          { update: {} },
        );
        expect(execRes.code).toBe(0);
        await neutronChain.waitBlocks(1); // update twice for precise twap
        execRes = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          { update: {} },
        );
        expect(execRes.code).toBe(0);
        await neutronChain.waitBlocks(1); // wait until the new TWAP is available

        const consultAmount = 1_000; // a low value compared to pool depth to avoid slippage
        expect(
          await neutronChain.queryContract<Record<string, unknown>>(
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
            (consultAmount * atomNtrnProvideRatio).toString(), // expect to receive 1_000 NTRN * 1/5 = 20 ATOM
          ],
        ]);

        expect(
          await neutronChain.queryContract<Record<string, unknown>>(
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
            (consultAmount / atomNtrnProvideRatio).toString(), // expect to receive 1_000 ATOM / 1/5 = 500 NTRN
          ],
        ]);
      });

      test('call NTRN_USDC oracle update', async () => {
        let execRes = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          { update: {} },
        );
        expect(execRes.code).toBe(0);
        await neutronChain.waitBlocks(1); // update twice for precise twap
        execRes = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          { update: {} },
        );
        expect(execRes.code).toBe(0);
        await neutronChain.waitBlocks(1); // wait until the new TWAP is available

        const consultAmount = 1_000; // a low value compared to pool depth to avoid slippage
        expect(
          await neutronChain.queryContract<Record<string, unknown>>(
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
            (consultAmount * usdcNtrnProvideRatio).toString(), // expect to receive 1_000 NTRN * 4 = 400 USDC
          ],
        ]);

        expect(
          await neutronChain.queryContract<Record<string, unknown>>(
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
            (consultAmount / usdcNtrnProvideRatio).toString(), // expect to receive 1_000 USDC / 4 = 25 NTRN
          ],
        ]);
      });
    });

    describe('prepare vesting lp vault', () => {
      test('create ATOM vesting accounts', async () => {
        const execRes = await cmManager.executeContract(
          contractAddresses[NTRN_ATOM_LP_TOKEN_CONTRACT_KEY],
          {
            send: {
              contract: contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
              amount: atomNtrnProviderShare.toString(),
              msg: Buffer.from(
                JSON.stringify({
                  register_vesting_accounts: {
                    vesting_accounts: [
                      vestingAccount(cmUser1.wallet.address, [
                        vestingSchedule(
                          vestingSchedulePoint(
                            0,
                            user1AtomVestingAmount.toString(),
                          ),
                        ),
                      ]),
                      vestingAccount(cmUser2.wallet.address, [
                        vestingSchedule(
                          vestingSchedulePoint(
                            0,
                            user2AtomVestingAmount.toString(),
                          ),
                        ),
                      ]),
                    ],
                  },
                }),
              ).toString('base64'),
            },
          },
        );
        expect(execRes.code).toBe(0);
      });
      test('create USDC vesting accounts', async () => {
        const execRes = await cmManager.executeContract(
          contractAddresses[NTRN_USDC_LP_TOKEN_CONTRACT_KEY],
          {
            send: {
              contract: contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
              amount: usdcNtrnProviderShare.toString(),
              msg: Buffer.from(
                JSON.stringify({
                  register_vesting_accounts: {
                    vesting_accounts: [
                      vestingAccount(cmUser1.wallet.address, [
                        vestingSchedule(
                          vestingSchedulePoint(
                            0,
                            user1UsdcVestingAmount.toString(),
                          ),
                        ),
                      ]),
                      vestingAccount(cmUser2.wallet.address, [
                        vestingSchedule(
                          vestingSchedulePoint(
                            0,
                            user2UsdcVestingAmount.toString(),
                          ),
                        ),
                      ]),
                    ],
                  },
                }),
              ).toString('base64'),
            },
          },
        );
        expect(execRes.code).toBe(0);
      });
      describe('check unclaimed amounts', () => {
        let currentHeight: number;
        beforeAll(async () => {
          await waitSeconds(5);
          currentHeight = await neutronChain.getHeight();
        });
        test('user1 ATOM lp contract', async () => {
          expect(
            await neutronChain.queryContract<UnclaimedAmountResponse>(
              contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
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
          ).toBe(user1AtomVestingAmount.toString());
        });
        test('user2 ATOM lp contract', async () => {
          expect(
            await neutronChain.queryContract<UnclaimedAmountResponse>(
              contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
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
          ).toBe(user2AtomVestingAmount.toString());
        });
        test('user1 USDC lp contract', async () => {
          expect(
            await neutronChain.queryContract<UnclaimedAmountResponse>(
              contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
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
          ).toBe(user1UsdcVestingAmount.toString());
        });
        test('user2 USDC lp contract', async () => {
          expect(
            await neutronChain.queryContract<UnclaimedAmountResponse>(
              contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
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
          ).toBe(user2UsdcVestingAmount.toString());
        });
      });
    });

    let initNtrnTwapInAtom: number;
    let initNtrnTwapInUsdc: number;
    describe('voting power', () => {
      describe('check initial voting power', () => {
        test('get TWAPs', async () => {
          const ntrnTwapInAtomResp = await getTwapAtHeight(
            neutronChain,
            contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
            nativeTokenInfo(NEUTRON_DENOM),
            Number.MAX_SAFE_INTEGER,
          );
          initNtrnTwapInAtom = ntrnTwapInAtomResp[0].twap;
          expect(initNtrnTwapInAtom).toBe(0.2);

          const ntrnTwapInUsdcResp = await getTwapAtHeight(
            neutronChain,
            contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
            nativeTokenInfo(NEUTRON_DENOM),
            Number.MAX_SAFE_INTEGER,
          );
          initNtrnTwapInUsdc = ntrnTwapInUsdcResp[0].twap;
          expect(initNtrnTwapInUsdc).toBe(4);
        });
        test('total power at height', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              atomNtrnProviderShare,
              usdcNtrnProviderShare,
              initNtrnTwapInAtom,
              initNtrnTwapInUsdc,
            ),
          );
        });
        test('user1 power at height', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address,
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              user1AtomVestingAmount,
              user1UsdcVestingAmount,
              initNtrnTwapInAtom,
              initNtrnTwapInUsdc,
            ),
          );
        });
        test('user2 power at height', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser2.wallet.address,
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              user2AtomVestingAmount,
              user2UsdcVestingAmount,
              initNtrnTwapInAtom,
              initNtrnTwapInUsdc,
            ),
          );
        });
      });

      let heightBeforeClaim: number;
      describe('check voting power on claim', () => {
        const user1PartialClaimAtom = Math.round(user1AtomVestingAmount / 2);
        beforeAll(async () => {
          heightBeforeClaim = await neutronChain.getHeight();
          await neutronChain.waitBlocks(1); // so it's before claim for sure
        });
        test('user1 partial ATOM claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
            {
              claim: {
                amount: user1PartialClaimAtom.toString(),
              },
            },
          );
          expect(execRes.code).toBe(0);
          await neutronChain.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address,
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              user1AtomVestingAmount - user1PartialClaimAtom,
              user1UsdcVestingAmount,
              initNtrnTwapInAtom,
              initNtrnTwapInUsdc,
            ),
          );
        });
        const user1PartialClaimUsdc = Math.round(user1UsdcVestingAmount / 3);
        test('user1 partial USDC claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
            {
              claim: {
                amount: user1PartialClaimUsdc.toString(),
              },
            },
          );
          expect(execRes.code).toBe(0);
          await neutronChain.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address,
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              user1AtomVestingAmount - user1PartialClaimAtom,
              user1UsdcVestingAmount - user1PartialClaimUsdc,
              initNtrnTwapInAtom,
              initNtrnTwapInUsdc,
            ),
          );
        });
        test('total voting power check after user1 partial claim', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              atomNtrnProviderShare - user1PartialClaimAtom,
              usdcNtrnProviderShare - user1PartialClaimUsdc,
              initNtrnTwapInAtom,
              initNtrnTwapInUsdc,
            ),
          );
        });

        test('user2 full ATOM claim', async () => {
          const execRes = await cmUser2.executeContract(
            contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
            {
              claim: {},
            },
          );
          expect(execRes.code).toBe(0);
          await neutronChain.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser2.wallet.address,
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              0,
              user2UsdcVestingAmount,
              initNtrnTwapInAtom,
              initNtrnTwapInUsdc,
            ),
          );
        });
        test('user2 full USDC claim', async () => {
          const execRes = await cmUser2.executeContract(
            contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
            {
              claim: {},
            },
          );
          expect(execRes.code).toBe(0);
          await neutronChain.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser2.wallet.address,
              },
            },
          );
          expect(+res.power).toBe(0);
        });
        test('total voting power check after user2 full claim', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              atomNtrnProviderShare -
                user1PartialClaimAtom -
                user2AtomVestingAmount,
              usdcNtrnProviderShare -
                user1PartialClaimUsdc -
                user2UsdcVestingAmount,
              initNtrnTwapInAtom,
              initNtrnTwapInUsdc,
            ),
          );
        });

        test('user1 full ATOM claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
            {
              claim: {},
            },
          );
          expect(execRes.code).toBe(0);
          await neutronChain.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address,
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              0,
              user1UsdcVestingAmount - user1PartialClaimUsdc,
              initNtrnTwapInAtom,
              initNtrnTwapInUsdc,
            ),
          );
        });
        test('user1 full USDC claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
            {
              claim: {},
            },
          );
          expect(execRes.code).toBe(0);
          await neutronChain.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address,
              },
            },
          );
          expect(+res.power).toBe(0);
        });
        test('total voting power check after full claim', async () => {
          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(0);
        });
      });

      describe('historical voting power', () => {
        describe('mutate current TWAPs', () => {
          // we user here different ratios to change asset proportions in the pools and therefore change TWAPs
          const newNtrnProvideAmount = 500_000_000; // 500 NTRN per each pool (ATOM, USDC)
          const newAtomProvideAmount =
            newNtrnProvideAmount * (atomNtrnProvideRatio * 1.2);
          const newUsdcProvideAmount =
            newNtrnProvideAmount * (usdcNtrnProvideRatio * 1.2);
          test('provide liquidity to NTRN_ATOM pool', async () => {
            const providedAssets = [
              nativeToken(IBC_ATOM_DENOM, newAtomProvideAmount.toString()),
              nativeToken(NEUTRON_DENOM, newNtrnProvideAmount.toString()),
            ];
            const execRes = await cmManager.executeContract(
              contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY],
              {
                provide_liquidity: {
                  assets: providedAssets,
                  slippage_tolerance: '0.5',
                },
              },
              [
                {
                  amount: newAtomProvideAmount.toString(),
                  denom: IBC_ATOM_DENOM,
                },
                {
                  amount: newNtrnProvideAmount.toString(),
                  denom: NEUTRON_DENOM,
                },
              ],
            );
            expect(execRes.code).toBe(0);
          });
          test('provide liquidity to NTRN_USDC pool', async () => {
            const providedAssets = [
              nativeToken(IBC_USDC_DENOM, newUsdcProvideAmount.toString()),
              nativeToken(NEUTRON_DENOM, newNtrnProvideAmount.toString()),
            ];
            const execRes = await cmManager.executeContract(
              contractAddresses[NTRN_USDC_PAIR_CONTRACT_KEY],
              {
                provide_liquidity: {
                  assets: providedAssets,
                  slippage_tolerance: '0.5',
                },
              },
              [
                {
                  amount: newUsdcProvideAmount.toString(),
                  denom: IBC_USDC_DENOM,
                },
                {
                  amount: newNtrnProvideAmount.toString(),
                  denom: NEUTRON_DENOM,
                },
              ],
            );
            expect(execRes.code).toBe(0);
          });
          test('make sure TWAPs changed', async () => {
            let execRes = await cmInstantiator.executeContract(
              contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
              { update: {} },
            );
            expect(execRes.code).toBe(0);
            execRes = await cmInstantiator.executeContract(
              contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
              { update: {} },
            );
            expect(execRes.code).toBe(0);
            await neutronChain.waitBlocks(1); // wait until the new TWAPs are available

            const ntrnTwapInAtomResp = await getTwapAtHeight(
              neutronChain,
              contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
              nativeTokenInfo(NEUTRON_DENOM),
              Number.MAX_SAFE_INTEGER,
            );
            const newNtrnTwapInAtom = ntrnTwapInAtomResp[0].twap;
            expect(newNtrnTwapInAtom).not.toBe(initNtrnTwapInAtom);

            const ntrnTwapInUsdcResp = await getTwapAtHeight(
              neutronChain,
              contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
              nativeTokenInfo(NEUTRON_DENOM),
              Number.MAX_SAFE_INTEGER,
            );
            const newNtrnTwapInUsdc = ntrnTwapInUsdcResp[0].twap;
            expect(newNtrnTwapInUsdc).not.toBe(initNtrnTwapInUsdc);
          });
        });

        // voting power at height = heightBeforeClaim should be the same as it was
        // at that point regardless of the following claim calls and TWAP changes.
        describe('check voting power before claim', () => {
          test('total power', async () => {
            const res = await neutronChain.queryContract<VotingPowerResponse>(
              contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
              { total_power_at_height: { height: heightBeforeClaim } },
            );
            expect(+res.power).toBe(
              calcVotingPower(
                atomNtrnProviderShare,
                usdcNtrnProviderShare,
                initNtrnTwapInAtom,
                initNtrnTwapInUsdc,
              ),
            );
          });
          test('user1 power', async () => {
            const res = await neutronChain.queryContract<VotingPowerResponse>(
              contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
              {
                voting_power_at_height: {
                  address: cmUser1.wallet.address,
                  height: heightBeforeClaim,
                },
              },
            );
            expect(+res.power).toBe(
              calcVotingPower(
                user1AtomVestingAmount,
                user1UsdcVestingAmount,
                initNtrnTwapInAtom,
                initNtrnTwapInUsdc,
              ),
            );
          });
          test('user2 power', async () => {
            const res = await neutronChain.queryContract<VotingPowerResponse>(
              contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
              {
                voting_power_at_height: {
                  address: cmUser2.wallet.address,
                  height: heightBeforeClaim,
                },
              },
            );
            expect(+res.power).toBe(
              calcVotingPower(
                user2AtomVestingAmount,
                user2UsdcVestingAmount,
                initNtrnTwapInAtom,
                initNtrnTwapInUsdc,
              ),
            );
          });
        });
      });
    });

    describe('misc', () => {
      test('managed extension is disabled', async () => {
        await expect(
          cmInstantiator.executeContract(
            contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
            {
              managed_extension: {
                msg: {
                  remove_vesting_accounts: {
                    vesting_accounts: [],
                    clawback_account: cmUser1.wallet.address,
                  },
                },
              },
            },
          ),
        ).rejects.toThrow(/Extension is not enabled for the contract: managed/);
        await expect(
          cmInstantiator.executeContract(
            contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
            {
              managed_extension: {
                msg: {
                  remove_vesting_accounts: {
                    vesting_accounts: [],
                    clawback_account: cmUser1.wallet.address,
                  },
                },
              },
            },
          ),
        ).rejects.toThrow(/Extension is not enabled for the contract: managed/);
      });

      test('set vesting token not allowed to a stranger', async () => {
        await expect(
          cmUser1.executeContract(
            contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
            {
              set_vesting_token: {
                vesting_token: {
                  token: {
                    contract_addr:
                      contractAddresses[NTRN_USDC_LP_TOKEN_CONTRACT_KEY],
                  },
                },
              },
            },
          ),
        ).rejects.toThrow(/Unauthorized/);

        await expect(
          cmUser2.executeContract(
            contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
            {
              set_vesting_token: {
                vesting_token: {
                  token: {
                    contract_addr:
                      contractAddresses[NTRN_ATOM_LP_TOKEN_CONTRACT_KEY],
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
            contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
            {
              set_vesting_token: {
                vesting_token: {
                  native_token: {
                    denom: NEUTRON_DENOM,
                  },
                },
              },
            },
          ),
        ).rejects.toThrow(/Vesting token is already set!/);

        await expect(
          cmManager.executeContract(
            contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
            {
              set_vesting_token: {
                vesting_token: {
                  native_token: {
                    denom: NEUTRON_DENOM,
                  },
                },
              },
            },
          ),
        ).rejects.toThrow(/Vesting token is already set!/);
      });

      describe('register vesting accounts not allowed to a stranger', () => {
        test('via send cw20', async () => {
          // create a random cw20 token with allocation to user1
          const codeId = await cmInstantiator.storeWasm(
            NeutronContract[CW20_BASE_CONTRACT_KEY],
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
                contract: contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
                amount: '1000',
                msg: Buffer.from(
                  JSON.stringify({
                    register_vesting_accounts: {
                      vesting_accounts: [
                        vestingAccount(cmUser1.wallet.address, [
                          vestingSchedule(vestingSchedulePoint(0, '1000')),
                        ]),
                      ],
                    },
                  }),
                ).toString('base64'),
              },
            }),
          ).rejects.toThrow(/Unauthorized/);
        });
        test('via direct exec msg', async () => {
          await expect(
            cmUser2.executeContract(
              contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
              {
                register_vesting_accounts: {
                  vesting_accounts: [
                    vestingAccount(cmUser2.wallet.address, [
                      vestingSchedule(vestingSchedulePoint(0, '1000')),
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
    {
      owner: instantiator.wallet.address,
    },
    'coin_registry',
  );
  expect(res).toBeTruthy();
  contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY] = res;
};

const storeTokensPrecision = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  const execRes = await instantiator.executeContract(
    contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
    {
      add: {
        native_coins: [
          [IBC_ATOM_DENOM, 6],
          [IBC_USDC_DENOM, 6],
          [NEUTRON_DENOM, 6],
        ],
      },
    },
  );
  expect(execRes.code).toBe(0);

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
    owner: instantiator.wallet.address,
    whitelist_code_id: 0,
    coin_registry_address: contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
  };
  const res = await instantiator.instantiateContract(
    codeIds[ASTRO_FACTORY_CONTRACT_KEY],
    instantiateMsg,
    'astro_factory',
  );
  expect(res).toBeTruthy();
  contractAddresses[ASTRO_FACTORY_CONTRACT_KEY] = res;
};

const deployOracles = async (
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  let res = await instantiator.instantiateContract(
    codeIds[ORACLE_HISTORY_CONTRACT_KEY],
    {
      factory_contract: contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
      period: 1,
      manager: cmManager.wallet.address,
    },
    'oracle usdc',
  );
  expect(res).toBeTruthy();
  contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY] = res;

  res = await instantiator.instantiateContract(
    codeIds[ORACLE_HISTORY_CONTRACT_KEY],
    {
      factory_contract: contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
      period: 1,
      manager: cmManager.wallet.address,
    },
    'oracle atom',
  );
  expect(res).toBeTruthy();
  contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY] = res;
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

  let execRes = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    createMsg,
  );
  expect(execRes.code).toBe(0);

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

  execRes = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    createMsg,
  );
  expect(execRes.code).toBe(0);

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
    owner: instantiator.wallet.address,
    token_info_manager: cmManager.wallet.address,
    vesting_managers: [cmManager.wallet.address],
  };
  let res = await instantiator.instantiateContract(
    codeIds[VESTING_LP_CONTRACT_KEY],
    msg,
    'vesting_atom_lp',
  );
  expect(res).toBeTruthy();
  contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY] = res;

  msg = {
    owner: instantiator.wallet.address,
    token_info_manager: cmManager.wallet.address,
    vesting_managers: [cmManager.wallet.address],
  };
  res = await instantiator.instantiateContract(
    codeIds[VESTING_LP_CONTRACT_KEY],
    msg,
    'vesting_usdc_lp',
  );
  expect(res).toBeTruthy();
  contractAddresses[VESTING_LP_USDC_CONTRACT_KEY] = res;
};

const setVestingLpAssets = async (
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  let execRes = await instantiator.executeContract(
    contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
    {
      set_vesting_token: {
        vesting_token: {
          token: {
            contract_addr: contractAddresses[NTRN_ATOM_LP_TOKEN_CONTRACT_KEY],
          },
        },
      },
    },
  );
  expect(execRes.code).toBe(0);

  execRes = await instantiator.executeContract(
    contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
    {
      set_vesting_token: {
        vesting_token: {
          token: {
            contract_addr: contractAddresses[NTRN_USDC_LP_TOKEN_CONTRACT_KEY],
          },
        },
      },
    },
  );
  expect(execRes.code).toBe(0);
};

const deployVestingLpVaultContract = async (
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.instantiateContract(
    codeIds[VESTING_LP_VAULT_CONTRACT_KEY],
    {
      name: 'Vesting lp vault',
      description: 'A vesting lp vault',
      atom_vesting_lp_contract: contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
      atom_oracle_contract:
        contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
      usdc_vesting_lp_contract: contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
      usdc_oracle_contract:
        contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
      owner: instantiator.wallet.address,
    },
    'vesting_lp_vault',
  );
  expect(res).toBeTruthy();
  contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY] = res;
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
  for (const asset of res) {
    twaps.push({ info: asset[0], twap: +asset[1] });
  }
  return twaps;
};

const calcVotingPower = (
  atomLpTokens: number,
  usdcLpTokens: number,
  ntrnTwapInAtom: number,
  ntrnTwapInUsdc: number,
): number =>
  Math.floor(atomLpTokens / Math.sqrt(ntrnTwapInAtom)) +
  Math.floor(usdcLpTokens / Math.sqrt(ntrnTwapInUsdc));

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
