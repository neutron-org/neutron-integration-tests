// vesting lp:
// 1. prerequisites: vesting-lp contract, atom oracle contract and usdc oracle contract
// 1.1. init vesting-lp, set asset_infos by manager, add vesting accounts
// 1.2. init pools, provide liquidity
// 1.3. init oracles aimed to pools

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
  nativeTokenInfo,
  vestingAccount,
  vestingSchedule,
  vestingSchedulePount,
  NativeToken,
  Token,
} from '../../helpers/types';
import { getHeight, wait } from '../../helpers/wait';
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
      const vaultAddress = contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY];
      const config = await neutronChain.queryContract<VestingLpVaultConfig>(
        vaultAddress,
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
        const providedAssets = [
          nativeToken(IBC_ATOM_DENOM, atomProvideAmount.toString()),
          nativeToken(NEUTRON_DENOM, ntrnProvideAmount.toString()),
        ];
        // as manager so it gets lp tokens necessary for future register_vesting_accounts call
        const execRes = await cmManager.executeContract(
          contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY],
          JSON.stringify({ provide_liquidity: { assets: providedAssets } }),
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
          JSON.stringify({ provide_liquidity: { assets: providedAssets } }),
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
          JSON.stringify({
            set_asset_infos: [
              nativeTokenInfo(IBC_ATOM_DENOM),
              nativeTokenInfo(NEUTRON_DENOM),
            ],
          }),
        );
        expect(execRes.code).toBe(0);

        execRes = await cmManager.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          JSON.stringify({
            set_asset_infos: [
              nativeTokenInfo(IBC_USDC_DENOM),
              nativeTokenInfo(NEUTRON_DENOM),
            ],
          }),
        );
        expect(execRes.code).toBe(0);
      });

      test('call NTRN_ATOM oracle update', async () => {
        let execRes = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          JSON.stringify({ update: {} }),
        );
        expect(execRes.code).toBe(0);
        neutronChain.blockWaiter.waitBlocks(1); // update twice for precise twap
        execRes = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          JSON.stringify({ update: {} }),
        );
        expect(execRes.code).toBe(0);
        neutronChain.blockWaiter.waitBlocks(1); // wait until the new TWAP is available

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
          JSON.stringify({ update: {} }),
        );
        expect(execRes.code).toBe(0);
        neutronChain.blockWaiter.waitBlocks(1); // update twice for precise twap
        execRes = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          JSON.stringify({ update: {} }),
        );
        expect(execRes.code).toBe(0);
        neutronChain.blockWaiter.waitBlocks(1); // wait until the new TWAP is available

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
          JSON.stringify({
            send: {
              contract: contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
              amount: atomNtrnProviderShare.toString(),
              msg: Buffer.from(
                JSON.stringify({
                  register_vesting_accounts: {
                    vesting_accounts: [
                      vestingAccount(cmUser1.wallet.address.toString(), [
                        vestingSchedule(
                          vestingSchedulePount(
                            0,
                            user1AtomVestingAmount.toString(),
                          ),
                        ),
                      ]),
                      vestingAccount(cmUser2.wallet.address.toString(), [
                        vestingSchedule(
                          vestingSchedulePount(
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
          }),
        );
        expect(execRes.code).toBe(0);
      });
      test('create USDC vesting accounts', async () => {
        const execRes = await cmManager.executeContract(
          contractAddresses[NTRN_USDC_LP_TOKEN_CONTRACT_KEY],
          JSON.stringify({
            send: {
              contract: contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
              amount: usdcNtrnProviderShare.toString(),
              msg: Buffer.from(
                JSON.stringify({
                  register_vesting_accounts: {
                    vesting_accounts: [
                      vestingAccount(cmUser1.wallet.address.toString(), [
                        vestingSchedule(
                          vestingSchedulePount(
                            0,
                            user1UsdcVestingAmount.toString(),
                          ),
                        ),
                      ]),
                      vestingAccount(cmUser2.wallet.address.toString(), [
                        vestingSchedule(
                          vestingSchedulePount(
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
          }),
        );
        expect(execRes.code).toBe(0);
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
                      address: cmUser2.wallet.address.toString(),
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
                      address: cmUser1.wallet.address.toString(),
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
                      address: cmUser2.wallet.address.toString(),
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

    describe('voting power', () => {
      let ntrnTwapInAtom: number;
      let ntrnTwapInUsdc: number;
      describe('check initial voting power', () => {
        test('get TWAPs', async () => {
          const ntrnTwapInAtomResp = await getTwapAtHeight(
            neutronChain,
            contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
            nativeTokenInfo(NEUTRON_DENOM),
            111111,
          );
          ntrnTwapInAtom = ntrnTwapInAtomResp[0].twap;
          expect(ntrnTwapInAtom).toBe(0.2);

          const ntrnTwapInUsdcResp = await getTwapAtHeight(
            neutronChain,
            contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
            nativeTokenInfo(NEUTRON_DENOM),
            111111,
          );
          ntrnTwapInUsdc = ntrnTwapInUsdcResp[0].twap;
          expect(ntrnTwapInUsdc).toBe(4);
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
              ntrnTwapInAtom,
              ntrnTwapInUsdc,
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
            calcVotingPower(
              user1AtomVestingAmount,
              user1UsdcVestingAmount,
              ntrnTwapInAtom,
              ntrnTwapInUsdc,
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
            calcVotingPower(
              user2AtomVestingAmount,
              user2UsdcVestingAmount,
              ntrnTwapInAtom,
              ntrnTwapInUsdc,
            ),
          );
        });
      });

      describe('check voting power on claim', () => {
        const user1PartialClaimAtom = Math.round(user1AtomVestingAmount / 2);
        test('user1 partial ATOM claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
            JSON.stringify({
              claim: {
                amount: user1PartialClaimAtom.toString(),
              },
            }),
          );
          expect(execRes.code).toBe(0);
          await neutronChain.blockWaiter.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              user1AtomVestingAmount - user1PartialClaimAtom,
              user1UsdcVestingAmount,
              ntrnTwapInAtom,
              ntrnTwapInUsdc,
            ),
          );
        });
        const user1PartialClaimUsdc = Math.round(user1UsdcVestingAmount / 3);
        test('user1 partial USDC claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
            JSON.stringify({
              claim: {
                amount: user1PartialClaimUsdc.toString(),
              },
            }),
          );
          expect(execRes.code).toBe(0);
          await neutronChain.blockWaiter.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              user1AtomVestingAmount - user1PartialClaimAtom,
              user1UsdcVestingAmount - user1PartialClaimUsdc,
              ntrnTwapInAtom,
              ntrnTwapInUsdc,
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
              ntrnTwapInAtom,
              ntrnTwapInUsdc,
            ),
          );
        });

        test('user2 full ATOM claim', async () => {
          const execRes = await cmUser2.executeContract(
            contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
            JSON.stringify({
              claim: {},
            }),
          );
          expect(execRes.code).toBe(0);
          await neutronChain.blockWaiter.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser2.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              0,
              user2UsdcVestingAmount,
              ntrnTwapInAtom,
              ntrnTwapInUsdc,
            ),
          );
        });
        test('user2 full USDC claim', async () => {
          const execRes = await cmUser2.executeContract(
            contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
            JSON.stringify({
              claim: {},
            }),
          );
          expect(execRes.code).toBe(0);
          await neutronChain.blockWaiter.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
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
              ntrnTwapInAtom,
              ntrnTwapInUsdc,
            ),
          );
        });

        test('user1 full ATOM claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
            JSON.stringify({
              claim: {},
            }),
          );
          expect(execRes.code).toBe(0);
          await neutronChain.blockWaiter.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            {
              voting_power_at_height: {
                address: cmUser1.wallet.address.toString(),
              },
            },
          );
          expect(+res.power).toBe(
            calcVotingPower(
              0,
              user1UsdcVestingAmount - user1PartialClaimUsdc,
              ntrnTwapInAtom,
              ntrnTwapInUsdc,
            ),
          );
        });
        test('user1 full USDC claim', async () => {
          const execRes = await cmUser1.executeContract(
            contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
            JSON.stringify({
              claim: {},
            }),
          );
          expect(execRes.code).toBe(0);
          await neutronChain.blockWaiter.waitBlocks(1);

          const res = await neutronChain.queryContract<VotingPowerResponse>(
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
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
            contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY],
            { total_power_at_height: {} },
          );
          expect(+res.power).toBe(0);
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
  const execRes = await instantiator.executeContract(
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

  let execRes = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(createMsg),
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
    JSON.stringify(createMsg),
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
  let execRes = await instantiator.executeContract(
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
  expect(execRes.code).toBe(0);

  execRes = await instantiator.executeContract(
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
  Math.round(atomLpTokens * Math.sqrt(ntrnTwapInAtom)) +
  Math.round(usdcLpTokens * Math.sqrt(ntrnTwapInUsdc));

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
