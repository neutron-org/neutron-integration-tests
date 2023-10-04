import {
  cosmosWrapper,
  dao,
  env,
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
  NEUTRON_DENOM,
  TestStateLocalCosmosTestNet,
  tge,
  types,
  tokenfactory,
} from '@neutron-org/neutronjsplus';
import Long from 'long';
import _ from 'lodash';

const MIN_LIQUDITY = 1000;
const ATOM_DEPOSIT_AMOUNT = 1000000;
const USDC_DEPOSIT_AMOUNT = 900000;
const NTRN_AMOUNT = 2000000;
const ATOM_RATE = 10000000;
const USDC_RATE = 1000000;
const NTRN_INCENTIVIZE_AMOUNT = 1000000;
// fixed fee for every transaction
const FEE_SIZE = 10_000;
// airdrop amount to check we do pay more than airdrop amount during lockdrop reward claiming
const TINY_AIRDROP_AMOUNT = 100;

const getLpSize = (token1: number, token2: number) =>
  (Math.sqrt(token1 * token2) - MIN_LIQUDITY) | 0;

type TwapAtHeight = [types.Asset, string][];

type UserInfoResponse = {
  usdc_deposited: string;
  atom_deposited: string;
  withdrawn: boolean;
  atom_lp_amount: string;
  usdc_lp_amount: string;
  atom_lp_locked: string;
  usdc_lp_locked: string;
};

export type TotalPowerAtHeightResponse = {
  readonly height: string;
  readonly power: number;
};

type TotalSupplyResponse = {
  total_supply: string;
};

type LockDropInfoResponse = {
  claimable_generator_ntrn_debt: string;
  lockup_infos: {
    astroport_lp_token: string;
    astroport_lp_transferred: boolean | null;
    astroport_lp_units: string;
    claimable_generator_astro_debt: string;
    claimable_generator_proxy_debt: unknown[];
    duration: number;
    generator_ntrn_debt: string;
    generator_proxy_debt: unknown[];
    lp_units_locked: string;
    ntrn_rewards: string;
    pool_type: string;
    unlock_timestamp: number;
    withdrawal_flag: boolean;
  }[];
  lockup_positions_index: number;
  ntrn_transferred: boolean;
  total_ntrn_rewards: string;
};

type PoolInfoResponse = {
  assets: { amount: string; info: { native_token: { denom: string } } }[];
  total_share: string;
};

type LockdropPoolInfoResponse = {
  lp_token: string;
  amount_in_lockups: string;
  incentives_share: string;
  /// Weighted LP Token balance used to calculate NTRN rewards a particular user can claim
  weighted_amount: string;
  /// Ratio of Generator NTRN rewards accured to astroport pool share
  generator_ntrn_per_share: string;
  /// Ratio of Generator Proxy rewards accured to astroport pool share
  generator_proxy_per_share: any[];
  /// Boolean value indicating if the LP Tokens are staked with the Generator contract or not
  is_staked: boolean;
};

type AuctionStateResponse = {
  /// Total USDC deposited to the contract
  total_usdc_deposited: string;
  /// Total ATOM deposited to the contract
  total_atom_deposited: string;
  is_rest_lp_vested: boolean;
  /// Total LP shares minted post liquidity addition to the NTRN-USDC Pool
  lp_usdc_shares_minted?: string;
  /// Total LP shares minted post liquidity addition to the NTRN-ATOM Pool
  lp_atom_shares_minted?: string;
  /// Timestamp at which liquidity was added to the NTRN-ATOM and NTRN-USDC LP Pool
  pool_init_timestamp: number;
  /// USDC NTRN amount
  usdc_ntrn_size: string;
  /// ATOM NTRN amount
  atom_ntrn_size: string;
  /// LP count for USDC amount
  usdc_lp_size: string;
  /// LP count for ATOM amount
  atom_lp_size: string;
  /// locked USDC LP shares
  usdc_lp_locked: string;
  /// locked ATOM LP shares
  atom_lp_locked: string;
};

type BalanceResponse = {
  balance: string;
};

type VestingAccountResponse = {
  address: string;
  info: {
    released_amount: string;
    schedules: {
      end_point: { amount: string; time: number };
      start_point: { amount: string; time: number };
    }[];
  };
};

const waitTill = (timestamp: number): Promise<void> => {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    throw new Error('timestamp is not a number');
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timestamp * 1000 - Date.now());
  });
};

const config = require('../../config.json');

describe('Neutron / TGE / Auction / Lockdrop migration', () => {
  let testState: TestStateLocalCosmosTestNet;
  let tgeMain: tge.Tge;
  let neutronChain: cosmosWrapper.CosmosWrapper;
  let cmInstantiator: cosmosWrapper.WalletWrapper;
  let cmTokenManager: cosmosWrapper.WalletWrapper;
  let cmStranger: cosmosWrapper.WalletWrapper;
  const tgeWallets: Record<string, cosmosWrapper.WalletWrapper> = {};
  let reserveAddress: string;
  let atomBalance = 0;
  let usdcBalance = 0;
  let ntrnAtomSize = 0;
  let ntrnUsdcSize = 0;
  let atomLpSize = 0;
  let usdcLpSize = 0;
  let atomLpLocked = 0;
  let usdcLpLocked = 0;
  let tgeEndHeight = 0;
  let daoMember1: dao.DaoMember;
  let daoMain: dao.Dao;
  let astroIncentivesPerBlock = 0;
  let migrationLength;
  const bondSize = 1000;

  beforeAll(async () => {
    cosmosWrapper.registerCodecs();
    tokenfactory.registerCodecs();

    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    reserveAddress =
      testState.wallets.qaNeutronThree.genQaWal1.address.toString();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    cmInstantiator = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    cmTokenManager = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.genQaWal1,
    );
    cmStranger = new cosmosWrapper.WalletWrapper(
      neutronChain,

      testState.wallets.qaNeutronFive.genQaWal1,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await dao.getDaoContracts(
      neutronChain,
      daoCoreAddress,
    );
    daoMain = new dao.Dao(neutronChain, daoContracts);
    daoMember1 = new dao.DaoMember(cmInstantiator, daoMain);
    await daoMember1.bondFunds(bondSize.toString());
    tgeMain = new tge.Tge(
      neutronChain,
      cmInstantiator,
      cmTokenManager,
      reserveAddress,
      IBC_ATOM_DENOM,
      IBC_USDC_DENOM,
      NEUTRON_DENOM,
    );

    for (const v of [
      'airdropOnly',
      'airdropAuctionVesting',
      'airdropAuctionLockdrop',
      'airdropAuctionLockdropVesting',
      'auctionVesting',
      'auctionLockdrop',
      'auctionLockdropVesting',
      'claimVestingBeforeMigration',
    ]) {
      tgeWallets[v] = new cosmosWrapper.WalletWrapper(
        neutronChain,
        (
          await testState.createQaWallet(
            'neutron',
            testState.sdk1,
            testState.blockWaiter1,
            testState.wallets.neutron.demo1,
            NEUTRON_DENOM,
            [
              {
                denom: NEUTRON_DENOM,
                amount: '1000000',
              },
              {
                denom: IBC_ATOM_DENOM,
                amount: '1000000',
              },
              {
                denom: IBC_USDC_DENOM,
                amount: '1000000',
              },
            ],
          )
        ).genQaWal1,
      );
    }
  });

  describe('Deploy', () => {
    it('should deploy contracts for auction', async () => {
      tgeMain.airdropAccounts = [
        {
          address:
            tgeWallets['airdropAuctionLockdrop'].wallet.address.toString(),
          amount: '1000000',
        },
        {
          address: tgeWallets['airdropOnly'].wallet.address.toString(),
          amount: '1000000',
        },
        {
          address:
            tgeWallets[
              'airdropAuctionLockdropVesting'
            ].wallet.address.toString(),
          amount: TINY_AIRDROP_AMOUNT.toString(),
        },
        {
          address:
            tgeWallets['airdropAuctionVesting'].wallet.address.toString(),
          amount: '1000000',
        },
        {
          address:
            tgeWallets['claimVestingBeforeMigration'].wallet.address.toString(),
          amount: '1000000',
        },
      ];
      tgeMain.times.airdropStart = tge.getTimestamp(0);
      tgeMain.times.airdropVestingStart = tge.getTimestamp(300);
      await tgeMain.deployPreAuction();
    });
    it('should deploy auction', async () => {
      tgeMain.times.auctionInit = tge.getTimestamp(80);
      await tgeMain.deployAuction();
    });

    it('should deploy lockdrop and lockdrop vault', async () => {
      tgeMain.times.lockdropInit =
        tgeMain.times.auctionInit +
        tgeMain.times.auctionDepositWindow +
        tgeMain.times.auctionWithdrawalWindow +
        5;
      await tgeMain.deployLockdrop();
      await tgeMain.deployLockdropVault();
    });
  });

  describe('Airdrop', () => {
    it('should claim airdrop', async () => {
      for (const v of [
        'airdropOnly',
        'airdropAuctionVesting',
        'airdropAuctionLockdrop',
        'airdropAuctionLockdropVesting',
        'claimVestingBeforeMigration',
      ]) {
        const address = tgeWallets[v].wallet.address.toString();
        const amount =
          tgeMain.airdropAccounts.find(
            ({ address }) => address == tgeWallets[v].wallet.address.toString(),
          )?.amount || '0';
        const proofs = tgeMain.airdrop.getMerkleProof({
          address: address,
          amount: amount,
        });
        const payload = {
          claim: {
            address: address,
            amount: amount,
            proof: proofs,
          },
        };
        const res = await tgeWallets[v].executeContract(
          tgeMain.contracts.airdrop,
          JSON.stringify(payload),
        );
        expect(res.code).toEqual(0);
      }
    });
  });

  describe('Auction', () => {
    describe('Phase 1', () => {
      it('should allow deposit ATOM', async () => {
        await waitTill(tgeMain.times.auctionInit + 3);
        const atomBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.auction,
          JSON.stringify({
            deposit: {},
          }),
          [
            {
              amount: ATOM_DEPOSIT_AMOUNT.toString(),
              denom: IBC_ATOM_DENOM,
            },
          ],
        );
        const resOther = await cmStranger.executeContract(
          tgeMain.contracts.auction,
          JSON.stringify({
            deposit: {},
          }),
          [
            {
              amount: ATOM_DEPOSIT_AMOUNT.toString(),
              denom: IBC_ATOM_DENOM,
            },
          ],
        );
        expect(res.code).toEqual(0);
        expect(resOther.code).toEqual(0);
        const info = await neutronChain.queryContract<UserInfoResponse>(
          tgeMain.contracts.auction,
          {
            user_info: {
              address: cmInstantiator.wallet.address.toString(),
            },
          },
        );
        const atomBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        expect(info.atom_deposited).toEqual(ATOM_DEPOSIT_AMOUNT.toString());
        expect(atomBalanceAfter).toEqual(
          atomBalanceBefore - ATOM_DEPOSIT_AMOUNT,
        );
        atomBalance += ATOM_DEPOSIT_AMOUNT * 2;

        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
          'claimVestingBeforeMigration',
        ]) {
          const res2 = await tgeWallets[v].executeContract(
            tgeMain.contracts.auction,
            JSON.stringify({
              deposit: {},
            }),
            [
              {
                amount: ATOM_DEPOSIT_AMOUNT.toString(),
                denom: IBC_ATOM_DENOM,
              },
            ],
          );
          expect(res2.code).toEqual(0);
          atomBalance += ATOM_DEPOSIT_AMOUNT;
        }
      });
      it('should allow deposit USDC', async () => {
        const usdcBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.auction,
          JSON.stringify({
            deposit: {},
          }),
          [
            {
              amount: USDC_DEPOSIT_AMOUNT.toString(),
              denom: IBC_USDC_DENOM,
            },
          ],
        );
        const resOther = await cmStranger.executeContract(
          tgeMain.contracts.auction,
          JSON.stringify({
            deposit: {},
          }),
          [
            {
              amount: USDC_DEPOSIT_AMOUNT.toString(),
              denom: IBC_USDC_DENOM,
            },
          ],
        );
        expect(res.code).toEqual(0);
        expect(resOther.code).toEqual(0);
        const info = await neutronChain.queryContract<UserInfoResponse>(
          tgeMain.contracts.auction,
          {
            user_info: {
              address: cmInstantiator.wallet.address.toString(),
            },
          },
        );
        const usdcBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        expect(info.usdc_deposited).toEqual(USDC_DEPOSIT_AMOUNT.toString());
        expect(usdcBalanceAfter).toEqual(
          usdcBalanceBefore - USDC_DEPOSIT_AMOUNT,
        );
        usdcBalance += USDC_DEPOSIT_AMOUNT * 2;

        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
          'claimVestingBeforeMigration',
        ]) {
          const res2 = await tgeWallets[v].executeContract(
            tgeMain.contracts.auction,
            JSON.stringify({
              deposit: {},
            }),
            [
              {
                amount: USDC_DEPOSIT_AMOUNT.toString(),
                denom: IBC_USDC_DENOM,
              },
            ],
          );
          expect(res2.code).toEqual(0);
          usdcBalance += USDC_DEPOSIT_AMOUNT;
        }
      });
    });
    describe('Phase 3', () => {
      describe('intentivizing lockdrop', () => {
        it('should incentivize lockdrop', async () => {
          const res = await cmInstantiator.executeContract(
            tgeMain.contracts.lockdrop,
            JSON.stringify({
              increase_ntrn_incentives: {},
            }),
            [
              {
                amount: String(NTRN_INCENTIVIZE_AMOUNT),
                denom: NEUTRON_DENOM,
              },
            ],
          );
          expect(res.code).toEqual(0);
        });
      });
      describe('set_pool_size', () => {
        it('should be able to set pool size', async () => {
          await cmInstantiator.msgSend(tgeMain.contracts.auction, {
            amount: NTRN_AMOUNT.toString(),
          });
          await waitTill(
            tgeMain.times.auctionInit +
              tgeMain.times.auctionDepositWindow +
              tgeMain.times.auctionWithdrawalWindow +
              5,
          );
          const time = (Date.now() / 1000) | 0;
          const r1 = await cmTokenManager.executeContract(
            tgeMain.contracts.priceFeed,
            JSON.stringify({
              set_rate: {
                symbol: 'ATOM',
                rate: {
                  rate: ATOM_RATE.toString(),
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r1.code).toEqual(0);
          const r2 = await cmTokenManager.executeContract(
            tgeMain.contracts.priceFeed,
            JSON.stringify({
              set_rate: {
                symbol: 'USDT',
                rate: {
                  rate: USDC_RATE.toString(),
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r2.code).toEqual(0);

          const res = await cmTokenManager.executeContract(
            tgeMain.contracts.auction,
            JSON.stringify({
              set_pool_size: {},
            }),
          );
          expect(res.code).toEqual(0);
          const state = await neutronChain.queryContract<AuctionStateResponse>(
            tgeMain.contracts.auction,
            {
              state: {},
            },
          );

          const usdcToAtomRate = ATOM_RATE / USDC_RATE;
          const totalInUSDC = usdcToAtomRate * atomBalance + usdcBalance;
          ntrnAtomSize = Math.floor(
            NTRN_AMOUNT * ((atomBalance * usdcToAtomRate) / totalInUSDC),
          );
          ntrnUsdcSize = NTRN_AMOUNT - ntrnAtomSize;
          atomLpSize = getLpSize(atomBalance, ntrnAtomSize);
          usdcLpSize = getLpSize(usdcBalance, ntrnUsdcSize);

          expect(parseInt(state.atom_ntrn_size)).toBeCloseTo(ntrnAtomSize, -1);
          expect(parseInt(state.usdc_ntrn_size)).toBeCloseTo(ntrnUsdcSize, -1);
          expect(parseInt(state.atom_lp_size)).toBeCloseTo(atomLpSize, -1);
          expect(parseInt(state.usdc_lp_size)).toBeCloseTo(usdcLpSize, -1);

          expect(state).toMatchObject({
            atom_lp_locked: '0',
            is_rest_lp_vested: false,
            lp_atom_shares_minted: null,
            lp_usdc_shares_minted: null,
            pool_init_timestamp: 0,
            total_atom_deposited: atomBalance.toString(),
            total_usdc_deposited: usdcBalance.toString(),
            usdc_lp_locked: '0',
          });
        });
        it('should not be able to set pool size twice', async () => {
          await expect(
            cmInstantiator.executeContract(
              tgeMain.contracts.auction,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Pool size has already been set/);
        });
      });
      describe('lock_lp', () => {
        it('should be able to lock ATOM LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            JSON.stringify({
              lock_lp: {
                amount: '150000',
                asset: 'ATOM',
                duration: 1,
              },
            }),
          );
          const resOther = await cmStranger.executeContract(
            tgeMain.contracts.auction,
            JSON.stringify({
              lock_lp: {
                amount: '150000',
                asset: 'ATOM',
                duration: 1,
              },
            }),
          );
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tgeMain.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(resOther.code).toEqual(0);
          expect(parseInt(userInfo.atom_lp_locked)).toEqual(150000);
          atomLpLocked += 150000 * 2;
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos).toHaveLength(1);
          expect(info.lockup_infos[0]).toMatchObject({
            lp_units_locked: (atomLpLocked / 2).toString(),
            pool_type: 'ATOM',
          });

          for (const v of [
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
          ]) {
            const userInfo = await neutronChain.queryContract<UserInfoResponse>(
              tgeMain.contracts.auction,
              {
                user_info: {
                  address: tgeWallets[v].wallet.address.toString(),
                },
              },
            );
            const res2 = await tgeWallets[v].executeContract(
              tgeMain.contracts.auction,
              JSON.stringify({
                lock_lp: {
                  amount: userInfo.atom_lp_amount,
                  asset: 'ATOM',
                  duration: 1,
                },
              }),
            );
            expect(res2.code).toEqual(0);
            atomLpLocked += Number(userInfo.atom_lp_amount);
          }
        });
        it('should be able to lock USDC LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            JSON.stringify({
              lock_lp: {
                amount: '50000',
                asset: 'USDC',
                duration: 1,
              },
            }),
          );
          const resOther = await cmStranger.executeContract(
            tgeMain.contracts.auction,
            JSON.stringify({
              lock_lp: {
                amount: '50000',
                asset: 'USDC',
                duration: 1,
              },
            }),
          );
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tgeMain.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(resOther.code).toEqual(0);
          usdcLpLocked += 50000 * 2;
          expect(parseInt(userInfo.usdc_lp_locked)).toEqual(50000);
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos).toHaveLength(2);
          expect(info.lockup_infos[1]).toMatchObject({
            lp_units_locked: String(usdcLpLocked / 2),
            pool_type: 'USDC',
          });

          for (const v of [
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
          ]) {
            const userInfo = await neutronChain.queryContract<UserInfoResponse>(
              tgeMain.contracts.auction,
              {
                user_info: {
                  address: tgeWallets[v].wallet.address.toString(),
                },
              },
            );
            const res2 = await tgeWallets[v].executeContract(
              tgeMain.contracts.auction,
              JSON.stringify({
                lock_lp: {
                  amount: userInfo.usdc_lp_amount,
                  asset: 'USDC',
                  duration: 1,
                },
              }),
            );
            expect(res2.code).toEqual(0);
            usdcLpLocked += Number(userInfo.usdc_lp_amount);
          }
        });
      });
      it('should set generator to lockdrop', async () => {
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.lockdrop,
          JSON.stringify({
            update_config: {
              new_config: {
                generator_address: tgeMain.contracts.astroGenerator,
              },
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
    });
    describe('Init pool', () => {
      it('should init pool', async () => {
        await waitTill(
          tgeMain.times.lockdropInit +
            tgeMain.times.lockdropDepositDuration +
            tgeMain.times.lockdropWithdrawalDuration +
            5,
        );
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.auction,
          JSON.stringify({
            init_pool: {},
          }),
        );
        expect(res.code).toEqual(0);
        const [
          auctionState,
          atomPoolInfo,
          usdcPoolInfo,
          reserveLPBalanceAtomNtrn,
          reserveLPBalanceUsdcNtrn,
          auctionLPBalanceAtomNtrn,
          auctionLPBalanceUsdcNtrn,
          lockdropLPBalanceAtomNtrn,
          lockdropLPBalanceUsdcNtrn,
          generatorLPBalanceAtomNtrn,
          generatorLPBalanceUsdcNtrn,
        ] = await Promise.all([
          neutronChain.queryContract<AuctionStateResponse>(
            tgeMain.contracts.auction,
            {
              state: {},
            },
          ),
          neutronChain.queryContract<PoolInfoResponse>(
            tgeMain.pairs.atom_ntrn.contract,
            {
              pool: {},
            },
          ),
          neutronChain.queryContract<PoolInfoResponse>(
            tgeMain.pairs.usdc_ntrn.contract,
            {
              pool: {},
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: reserveAddress,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: reserveAddress,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.auction,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.auction,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.lockdrop,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.lockdrop,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.astroGenerator,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.astroGenerator,
              },
            },
          ),
        ]);
        expect(auctionState.pool_init_timestamp).toBeGreaterThan(0);
        expect(
          Math.abs(
            parseInt(reserveLPBalanceAtomNtrn.balance) -
              parseInt(auctionState.atom_lp_size) / 2,
          ),
        ).toBeLessThan(1);
        expect(
          Math.abs(
            parseInt(reserveLPBalanceUsdcNtrn.balance) -
              parseInt(auctionState.usdc_lp_size) / 2,
          ),
        ).toBeLessThan(1);

        expect(generatorLPBalanceAtomNtrn).toEqual({
          balance: auctionState.atom_lp_locked,
        });
        expect(generatorLPBalanceUsdcNtrn).toEqual({
          balance: auctionState.usdc_lp_locked,
        });
        expect(lockdropLPBalanceAtomNtrn).toEqual({
          balance: '0',
        });
        expect(lockdropLPBalanceUsdcNtrn).toEqual({
          balance: '0',
        });

        expect(
          Math.abs(
            parseInt(auctionLPBalanceAtomNtrn.balance) -
              (parseInt(auctionState.atom_lp_size) / 2 -
                parseInt(auctionState.atom_lp_locked)),
          ),
        ).toBeLessThan(1);
        expect(
          Math.abs(
            parseInt(auctionLPBalanceUsdcNtrn.balance) -
              (parseInt(auctionState.usdc_lp_size) / 2 -
                parseInt(auctionState.usdc_lp_locked)),
          ),
        ).toBeLessThan(1);

        expect(atomPoolInfo.assets[0].amount).toEqual(atomBalance.toString());
        expect(parseInt(atomPoolInfo.assets[1].amount)).toBeCloseTo(
          ntrnAtomSize,
          -1,
        );
        expect(parseInt(atomPoolInfo.total_share)).toEqual(
          parseInt(auctionState.atom_lp_size) + MIN_LIQUDITY,
        );

        expect(usdcPoolInfo.assets[0].amount).toEqual(usdcBalance.toString());
        expect(parseInt(usdcPoolInfo.assets[1].amount)).toBeCloseTo(
          ntrnUsdcSize,
          -1,
        );
        expect(parseInt(usdcPoolInfo.total_share)).toEqual(
          parseInt(auctionState.usdc_lp_size) + MIN_LIQUDITY,
        );
        expect(atomLpSize).toBeCloseTo(
          parseInt(atomPoolInfo.total_share) - MIN_LIQUDITY,
          -1,
        );
        expect(usdcLpSize).toBeCloseTo(
          parseInt(usdcPoolInfo.total_share) - MIN_LIQUDITY,
          -1,
        );
        expect(auctionState.atom_lp_size).toEqual(
          auctionState.lp_atom_shares_minted,
        );
        expect(auctionState.usdc_lp_size).toEqual(
          auctionState.lp_usdc_shares_minted,
        );
      });
      it('update oracles', async () => {
        tgeEndHeight = await env.getHeight(neutronChain.sdk);
        let res = await cmInstantiator.executeContract(
          tgeMain.contracts.oracleAtom,
          JSON.stringify({
            update: {},
          }),
        );
        expect(res.code).toEqual(0);

        res = await cmInstantiator.executeContract(
          tgeMain.contracts.oracleUsdc,
          JSON.stringify({
            update: {},
          }),
        );
        expect(res.code).toEqual(0);

        testState.blockWaiter1.waitBlocks(3);
        res = await cmInstantiator.executeContract(
          tgeMain.contracts.oracleAtom,
          JSON.stringify({
            update: {},
          }),
        );
        expect(res.code).toEqual(0);
        res = await cmInstantiator.executeContract(
          tgeMain.contracts.oracleUsdc,
          JSON.stringify({
            update: {},
          }),
        );
        expect(res.code).toEqual(0);
      });
      it('should not be able to init pool twice', async () => {
        await expect(
          cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            JSON.stringify({
              init_pool: {},
            }),
          ),
        ).rejects.toThrow(/Liquidity already added/);
      });
    });
    describe('Vest LP', () => {
      let claimAtomLP: number;
      let claimUsdcLP: number;
      it('should vest LP (permissionless)', async () => {
        let res = await cmStranger.executeContract(
          tgeMain.contracts.auction,
          JSON.stringify({
            migrate_to_vesting: {},
          }),
        );
        expect(res.code).toEqual(0);
        res = await tgeWallets.airdropOnly.executeContract(
          tgeMain.contracts.auction,
          JSON.stringify({
            migrate_to_vesting: {},
          }),
        );
        expect(res.code).toEqual(0);
        res = await tgeWallets.airdropOnly.executeContract(
          tgeMain.contracts.auction,
          JSON.stringify({
            migrate_to_vesting: {},
          }),
        );
        expect(res.code).toEqual(0);
        tgeMain.times.vestTimestamp = Date.now();
      });
      it('should not vest LP all 8 users have been migrated', async () => {
        await expect(
          cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            JSON.stringify({
              migrate_to_vesting: {},
            }),
          ),
        ).rejects.toThrow(/No users to migrate/);
      });
      it('should validate numbers', async () => {
        const [
          vestingInfoAtom,
          vestingInfoUsdc,
          lpAuctionBalanceAtom,
          lpAuctionBalanceUsdc,
        ] = await Promise.all([
          neutronChain.queryContract<VestingAccountResponse>(
            tgeMain.contracts.vestingAtomLp,
            {
              vesting_account: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<VestingAccountResponse>(
            tgeMain.contracts.vestingUsdcLp,
            {
              vesting_account: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.auction,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.auction,
              },
            },
          ),
        ]);

        expect(parseInt(lpAuctionBalanceUsdc.balance)).toBeLessThanOrEqual(7);
        expect(parseInt(lpAuctionBalanceAtom.balance)).toBeLessThanOrEqual(7);
        expect(vestingInfoAtom.address).toEqual(
          cmInstantiator.wallet.address.toString(),
        );
        expect(vestingInfoUsdc.address).toEqual(
          cmInstantiator.wallet.address.toString(),
        );
        expect(vestingInfoAtom.info.released_amount).toEqual('0');
        expect(vestingInfoUsdc.info.released_amount).toEqual('0');

        expect(
          parseInt(vestingInfoAtom.info.schedules[0].end_point.amount),
        ).toBeCloseTo(75706, -1);
        claimAtomLP = parseInt(
          vestingInfoAtom.info.schedules[0].end_point.amount,
        );

        expect(
          parseInt(vestingInfoUsdc.info.schedules[0].end_point.amount),
        ).toBeCloseTo(14197, -1);
        claimUsdcLP = parseInt(
          vestingInfoUsdc.info.schedules[0].end_point.amount,
        );
      });
      it('should be able to claim lpATOM_NTRN vesting after vesting period', async () => {
        await waitTill(
          tgeMain.times.vestTimestamp / 1000 +
            tgeMain.times.auctionVestingLpDuration +
            10,
        );
        const [avaliableAtomLp, avaliableUsdcLp] = await Promise.all([
          neutronChain.queryContract<string>(tgeMain.contracts.vestingAtomLp, {
            available_amount: {
              address: cmInstantiator.wallet.address.toString(),
            },
          }),
          neutronChain.queryContract<string>(tgeMain.contracts.vestingUsdcLp, {
            available_amount: {
              address: cmInstantiator.wallet.address.toString(),
            },
          }),
        ]);

        expect(avaliableAtomLp).toEqual(claimAtomLP.toString());
        expect(avaliableUsdcLp).toEqual(claimUsdcLP.toString());
      });
    });
    describe('vaults', () => {
      describe('basic checks', () => {
        it('oracle works', async () => {
          const rateNtrnAtom = await neutronChain.queryContract<TwapAtHeight>(
            tgeMain.contracts.oracleAtom,
            {
              t_w_a_p_at_height: {
                token: { native_token: { denom: NEUTRON_DENOM } },
                height: String(tgeEndHeight + 10),
              },
            },
          );
          const rateAtomNtrn = await neutronChain.queryContract<TwapAtHeight>(
            tgeMain.contracts.oracleAtom,
            {
              t_w_a_p_at_height: {
                token: { native_token: { denom: IBC_ATOM_DENOM } },
                height: String(tgeEndHeight + 10),
              },
            },
          );
          // rate a->b should be ~ 1/(rate b-> a)
          expect(
            Math.abs(
              Number(rateAtomNtrn[0][1]) * Number(rateNtrnAtom[0][1]) - 1,
            ),
          ).toBeLessThan(0.03);
          const rateNtrnUsdc = await neutronChain.queryContract<TwapAtHeight>(
            tgeMain.contracts.oracleUsdc,
            {
              t_w_a_p_at_height: {
                token: { native_token: { denom: NEUTRON_DENOM } },
                height: String(tgeEndHeight + 10),
              },
            },
          );
          const rateUsdcNtrn = await neutronChain.queryContract<TwapAtHeight>(
            tgeMain.contracts.oracleUsdc,
            {
              t_w_a_p_at_height: {
                token: { native_token: { denom: IBC_USDC_DENOM } },
                height: String(tgeEndHeight + 10),
              },
            },
          );
          expect(
            Math.abs(
              Number(rateNtrnUsdc[0][1]) * Number(rateUsdcNtrn[0][1]) - 1,
            ),
          ).toBeLessThan(0.03);
        });
      });
      describe('governance checks', () => {
        // vaults have not connected yet
        it('no voting power', async () => {
          for (const v of [
            'airdropOnly',
            'airdropAuctionVesting',
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
            'claimVestingBeforeMigration',
          ]) {
            const member = new dao.DaoMember(tgeWallets[v], daoMain);
            expect((await member.queryVotingPower()).power | 0).toBe(0);
          }
        });

        it('add lockdrop vault to the registry', async () => {
          let tvp = await daoMain.queryTotalVotingPower();
          expect(tvp.power | 0).toBe(bondSize + 1000); // the bonded amount + 1000 from investors vault (see neutron/network/init-neutrond.sh)
          const propID = await daoMember1.submitSingleChoiceProposal(
            'Proposal #1',
            'add LOCKDROP_VAULT',
            [
              {
                wasm: {
                  execute: {
                    contract_addr: daoMain.contracts.voting.address,
                    msg: Buffer.from(
                      `{"add_voting_vault": {"new_voting_vault_contract":"${tgeMain.contracts.lockdropVault}"}}`,
                    ).toString('base64'),
                    funds: [],
                  },
                },
              },
            ],
            '1000',
          );

          await daoMember1.voteYes(propID);
          await daoMember1.executeProposal(propID);
          await neutronChain.blockWaiter.waitBlocks(2); // wait for a couple of blocks so the vault becomes active
          tvp = await daoMain.queryTotalVotingPower();
          expect(tvp.power | 0).toBeGreaterThan(bondSize + 1000);
          // lockdrop participants get voting power
          for (const v of [
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
          ]) {
            const member = new dao.DaoMember(tgeWallets[v], daoMain);
            expect((await member.queryVotingPower()).power | 0).toBeGreaterThan(
              0,
            );
          }
          for (const v of [
            'airdropOnly',
            'airdropAuctionVesting',
            'auctionVesting',
            'claimVestingBeforeMigration',
          ]) {
            const member = new dao.DaoMember(tgeWallets[v], daoMain);
            expect((await member.queryVotingPower()).power | 0).toBe(0);
          }
        });

        it('add vesting vault to the registry', async () => {
          const tvp = await daoMain.queryTotalVotingPower();
          const propID = await daoMember1.submitSingleChoiceProposal(
            'Proposal #2',
            'add VESTING_LP_VAULT',
            [
              {
                wasm: {
                  execute: {
                    contract_addr: daoMain.contracts.voting.address,
                    msg: Buffer.from(
                      `{"add_voting_vault": {"new_voting_vault_contract":"${tgeMain.contracts.vestingLpVault}"}}`,
                    ).toString('base64'),
                    funds: [],
                  },
                },
              },
            ],
            '1000',
          );
          await daoMember1.voteYes(propID);
          const prop = await daoMain.queryProposal(propID);
          // we contected new voting vault(vesting voting vault), now its not enough
          // daoMember1 voting power to pass proposal
          // lockdrop participant should vote
          expect(prop.proposal).toMatchObject({ status: 'open' });
          const vp: Record<string, number> = {};
          for (const v of [
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
            'claimVestingBeforeMigration',
          ]) {
            const member = new dao.DaoMember(tgeWallets[v], daoMain);
            vp[v] = (await member.queryVotingPower()).power | 0;
            if (
              (await daoMain.queryProposal(propID)).proposal.status == 'open'
            ) {
              await member.voteYes(propID);
            }
          }
          await daoMember1.executeProposal(propID);
          await neutronChain.blockWaiter.waitBlocks(2); // wait for a couple of blocks so the vault becomes active
          const tvpNew = await daoMain.queryTotalVotingPower();
          expect(tvpNew.power | 0).toBeGreaterThan(tvp.power | 0);
          // vesting participants get(increase) the voting power
          for (const v of [
            'airdropAuctionVesting',
            'auctionVesting',
            'claimVestingBeforeMigration',
          ]) {
            const member = new dao.DaoMember(tgeWallets[v], daoMain);
            expect((await member.queryVotingPower()).power | 0).toBeGreaterThan(
              vp[v] | 0,
            );
          }
        });

        it('add credits vault to the registry', async () => {
          const tvp = await daoMain.queryTotalVotingPower();
          const propID = await daoMember1.submitSingleChoiceProposal(
            'Proposal #3',
            'add CREDITS_VAULT',
            [
              {
                wasm: {
                  execute: {
                    contract_addr: daoMain.contracts.voting.address,
                    msg: Buffer.from(
                      `{"add_voting_vault": {"new_voting_vault_contract":"${tgeMain.contracts.creditsVault}"}}`,
                    ).toString('base64'),
                    funds: [],
                  },
                },
              },
            ],
            '1000',
          );
          await daoMember1.voteYes(propID);
          const prop = await daoMain.queryProposal(propID);
          // lockdrop and vesting participants should vote
          expect(prop.proposal).toMatchObject({ status: 'open' });
          const vp: Record<string, number> = {};
          for (const v of [
            'airdropAuctionVesting',
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
            'auctionVesting',
            'claimVestingBeforeMigration',
          ]) {
            const member = new dao.DaoMember(tgeWallets[v], daoMain);
            vp[v] = (await member.queryVotingPower()).power | 0;
            if (
              (await daoMain.queryProposal(propID)).proposal.status == 'open'
            ) {
              await member.voteYes(propID);
            }
          }
          await daoMember1.executeProposal(propID);
          await neutronChain.blockWaiter.waitBlocks(2); // wait for a couple of blocks so the vault becomes active
          const tvpNew = await daoMain.queryTotalVotingPower();
          expect(tvpNew.power | 0).toBeGreaterThan(tvp.power | 0);
          // airdrop participants get(increase) the voting power
          for (const v of [
            'airdropOnly',
            'airdropAuctionVesting',
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
          ]) {
            const member = new dao.DaoMember(tgeWallets[v], daoMain);
            expect((await member.queryVotingPower()).power | 0).toBeGreaterThan(
              vp[v] | 0,
            );
          }
        });
        it('airdrop contract should not have credits vault voting power', async () => {
          const ctvp =
            await neutronChain.queryContract<TotalPowerAtHeightResponse>(
              tgeMain.contracts.creditsVault,
              {
                total_power_at_height: {},
              },
            );
          const airdropCNTRN =
            await neutronChain.queryContract<BalanceResponse>(
              tgeMain.contracts.credits,
              {
                balance: {
                  address: tgeMain.contracts.airdrop,
                },
              },
            );
          const totalCNTRNSupply =
            await neutronChain.queryContract<TotalSupplyResponse>(
              tgeMain.contracts.credits,
              {
                total_supply_at_height: {},
              },
            );
          expect(Number(ctvp.power)).toEqual(
            Number(totalCNTRNSupply.total_supply) -
              Number(airdropCNTRN.balance),
          );
        });
      });
    });
  });

  describe('lockdrop before migration rewards', () => {
    describe('lockdrop rewards', () => {
      beforeAll(async () => {
        await waitTill(
          tgeMain.times.lockdropInit +
            tgeMain.times.lockdropDepositDuration +
            tgeMain.times.lockdropWithdrawalDuration +
            1,
        );
      });

      it('for cmInstantiator without withdraw', async () => {
        const rewardsStateBeforeClaim = await tgeMain.generatorRewardsState(
          cmStranger.wallet.address.toString(),
        );

        const res = await cmStranger.executeContract(
          tgeMain.contracts.lockdrop,
          JSON.stringify({
            claim_rewards_and_optionally_unlock: {
              pool_type: 'USDC',
              duration: 1,
              withdraw_lp_stake: false,
            },
          }),
        );

        expect(res.code).toEqual(0);
        const claimHeight = +(res.height || 0);
        const rewardsStateAfterClaim = await tgeMain.generatorRewardsState(
          cmStranger.wallet.address.toString(),
        );
        expect(
          rewardsStateAfterClaim.balanceNtrn +
            FEE_SIZE -
            rewardsStateBeforeClaim.balanceNtrn,
        ).toEqual(125980); // lockdrop rewards share for the user
        const expectedGeneratorRewards = +(
          (
            rewardsStateBeforeClaim.userInfo.lockup_infos.find(
              (i) => i.pool_type == 'USDC' && i.duration == 1,
            ) || {}
          ).claimable_generator_astro_debt || '0'
        );
        expect(expectedGeneratorRewards).toBeGreaterThan(0);

        // we expect the astro balance to increase by somewhere between user rewards amount and user
        // rewards amount plus rewards per block amount because rewards drip each block.
        const astroBalanceDiff =
          rewardsStateAfterClaim.balanceAstro -
          rewardsStateBeforeClaim.balanceAstro;
        expect(astroBalanceDiff).toBeGreaterThan(0);
        expect(astroBalanceDiff).toBeGreaterThanOrEqual(
          expectedGeneratorRewards,
        );
        expect(astroBalanceDiff).toBeLessThan(
          expectedGeneratorRewards + tgeMain.generatorRewardsPerBlock,
        );
        await neutronChain.blockWaiter.waitBlocks(20);
        const pending = await neutronChain.queryContract<any>(
          tgeMain.contracts.astroGenerator,
          {
            pending_token: {
              lp_token: tgeMain.pairs.usdc_ntrn.liquidity,
              user: tgeMain.contracts.lockdrop,
            },
          },
        );
        expect(+pending.pending).toBeGreaterThan(0);
        const resTwo = await cmStranger.executeContract(
          tgeMain.contracts.lockdrop,
          JSON.stringify({
            claim_rewards_and_optionally_unlock: {
              pool_type: 'USDC',
              duration: 1,
              withdraw_lp_stake: false,
            },
          }),
        );
        expect(resTwo.code).toEqual(0);
        const secondClaimHeight = +(resTwo.height || 0);
        expect(secondClaimHeight).toBeGreaterThan(claimHeight);
        const { balanceAstro: newBalanceAstro } =
          await tgeMain.generatorRewardsState(
            cmStranger.wallet.address.toString(),
          );
        expect(newBalanceAstro).not.toEqual(
          rewardsStateAfterClaim.balanceAstro,
        );
        astroIncentivesPerBlock =
          (newBalanceAstro - rewardsStateAfterClaim.balanceAstro) /
          (secondClaimHeight - claimHeight);
        // withdraw_lp_stake is false => no lp tokens returned
        expect(rewardsStateBeforeClaim.atomNtrnLpTokenBalance).toEqual(
          rewardsStateAfterClaim.atomNtrnLpTokenBalance,
        );
        expect(rewardsStateBeforeClaim.usdcNtrnLpTokenBalance).toEqual(
          rewardsStateAfterClaim.usdcNtrnLpTokenBalance,
        );
      });
    });
  });

  describe('Migration to V2', () => {
    let heightDiff: number;
    const votingPowerBeforeLockdrop: Record<string, number> = {};
    let lockdropVaultForClAddr: string;
    let vestingLpVaultForClAddr: string;

    describe('Migration of pairs', () => {
      it('should claim from last wallet in map', async () => {
        const resAtom = await tgeWallets[
          'claimVestingBeforeMigration'
        ].executeContract(
          tgeMain.contracts.vestingAtomLp,
          JSON.stringify({
            claim: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        const resUsdc = await tgeWallets[
          'claimVestingBeforeMigration'
        ].executeContract(
          tgeMain.contracts.vestingUsdcLp,
          JSON.stringify({
            claim: {},
          }),
        );
        expect(resUsdc.code).toEqual(0);
      });
      it('should unregister old pairs', async () => {
        {
          const res = await tge.executeDeregisterPair(
            tgeMain.instantiator,
            tgeMain.contracts.astroFactory,
            IBC_ATOM_DENOM,
            NEUTRON_DENOM,
          );
          expect(res.code).toEqual(0);
        }
        {
          const res = await tge.executeDeregisterPair(
            tgeMain.instantiator,
            tgeMain.contracts.astroFactory,
            IBC_USDC_DENOM,
            NEUTRON_DENOM,
          );
          expect(res.code).toEqual(0);
        }
      });
      it('should register CL pairs', async () => {
        {
          const res = await tge.executeFactoryCreatePair(
            tgeMain.instantiator,
            tgeMain.contracts.astroFactory,
            IBC_ATOM_DENOM,
            NEUTRON_DENOM,
            'concentrated',
            Buffer.from(
              JSON.stringify({
                amp: '40',
                gamma: '0.000145',
                mid_fee: '0.0026',
                out_fee: '0.0045',
                fee_gamma: '0.00023',
                repeg_profit_threshold: '0.000002',
                min_price_scale_delta: '0.000146',
                price_scale: (atomBalance / ntrnAtomSize)
                  .toPrecision(5)
                  .toString(),
                ma_half_time: 600,
                track_asset_balances: true,
              }),
            ).toString('base64'),
          );
          expect(res.code).toEqual(0);
        }
        {
          const res = await tge.executeFactoryCreatePair(
            tgeMain.instantiator,
            tgeMain.contracts.astroFactory,
            IBC_USDC_DENOM,
            NEUTRON_DENOM,
            'concentrated',
            Buffer.from(
              JSON.stringify({
                amp: '40',
                gamma: '0.000145',
                mid_fee: '0.0026',
                out_fee: '0.0045',
                fee_gamma: '0.00023',
                repeg_profit_threshold: '0.000002',
                min_price_scale_delta: '0.000146',
                price_scale: (usdcBalance / ntrnUsdcSize)
                  .toPrecision(5)
                  .toString(),
                ma_half_time: 600,
                track_asset_balances: true,
              }),
            ).toString('base64'),
          );
          expect(res.code).toEqual(0);
        }
      });
      it('should unsetup CL pairs for generator', async () => {
        const res = await tge.executeGeneratorSetupPools(
          tgeMain.instantiator,
          tgeMain.contracts.astroGenerator,
          [
            tgeMain.pairs.atom_ntrn.liquidity,
            tgeMain.pairs.usdc_ntrn.liquidity,
          ],
          '0',
        );
        expect(res.code).toEqual(0);
        migrationLength = +(res.height || 0);
      });
      it('should set pairs data', async () => {
        const pairs = (
          await tge.queryFactoryPairs(
            tgeMain.chain,
            tgeMain.contracts.astroFactory,
          )
        ).pairs;
        expect(pairs).toHaveLength(2);
        tgeMain.old_pairs = _.cloneDeep(tgeMain.pairs);
        tgeMain.pairs = {
          atom_ntrn: {
            contract: pairs[0].contract_addr,
            liquidity: pairs[0].liquidity_token,
          },
          usdc_ntrn: {
            contract: pairs[1].contract_addr,
            liquidity: pairs[1].liquidity_token,
          },
        };
      });

      it('should update vesting token infos', async () => {
        await tge.executeVestingLpSetVestingToken(
          cmInstantiator,
          tgeMain.contracts.vestingAtomLp,
          tgeMain.pairs.atom_ntrn.liquidity,
        );
        await tge.executeVestingLpSetVestingToken(
          cmInstantiator,
          tgeMain.contracts.vestingUsdcLp,
          tgeMain.pairs.usdc_ntrn.liquidity,
        );
      });

      it('deploy lockdrop voting vault for CL', async () => {
        const codeId = await cmInstantiator.storeWasm(
          types.NeutronContract.LOCKDROP_VAULT_CL,
        );
        expect(codeId).toBeGreaterThan(0);

        const res = await cmInstantiator.instantiateContract(
          codeId,
          JSON.stringify({
            name: 'Lockdrop CL voting vault',
            description: 'Lockdrop vault for CL pairs',
            lockdrop_contract: tgeMain.contracts.lockdrop,
            usdc_cl_pool_contract: tgeMain.pairs.usdc_ntrn.contract,
            atom_cl_pool_contract: tgeMain.pairs.atom_ntrn.contract,
            owner: daoMain.contracts.core.address,
          }),
          'neutron.voting.vaults.lockdrop_cl',
        );
        lockdropVaultForClAddr = res[0]._contract_address;
      });

      it('deploy vesting lp voting vault for CL', async () => {
        const codeId = await cmInstantiator.storeWasm(
          types.NeutronContract.VESTING_LP_VAULT_CL,
        );
        expect(codeId).toBeGreaterThan(0);

        const res = await cmInstantiator.instantiateContract(
          codeId,
          JSON.stringify({
            name: 'Vesting LP CL voting vault',
            description: 'Vesting LP voting vault for CL pairs',
            atom_vesting_lp_contract: tgeMain.contracts.vestingAtomLp,
            atom_cl_pool_contract: tgeMain.pairs.atom_ntrn.contract,
            usdc_vesting_lp_contract: tgeMain.contracts.vestingUsdcLp,
            usdc_cl_pool_contract: tgeMain.pairs.usdc_ntrn.contract,
            owner: daoMain.contracts.core.address,
          }),
          'neutron.voting.vaults.lockdrop_cl',
        );
        vestingLpVaultForClAddr = res[0]._contract_address;
      });

      it('should setup CL pairs for generator', async () => {
        const res = await tge.executeGeneratorSetupPools(
          tgeMain.instantiator,
          tgeMain.contracts.astroGenerator,
          [
            tgeMain.pairs.atom_ntrn.liquidity,
            tgeMain.pairs.usdc_ntrn.liquidity,
          ],
          '1',
        );
        expect(res.code).toEqual(0);
        migrationLength = +(res.height || 0) - migrationLength;
      });
      it('should have zero liquidity on CL pools', async () => {
        const usdcBalance = await neutronChain.queryContract<BalanceResponse>(
          tgeMain.pairs.usdc_ntrn.liquidity,
          {
            balance: {
              address: tgeMain.contracts.astroGenerator,
            },
          },
        );
        expect(usdcBalance.balance).toEqual('0');
        const atomBalance = await neutronChain.queryContract<BalanceResponse>(
          tgeMain.pairs.atom_ntrn.liquidity,
          {
            balance: {
              address: tgeMain.contracts.astroGenerator,
            },
          },
        );
        expect(atomBalance.balance).toEqual('0');
      });
    });

    describe('Migration of lp vesting', () => {
      let claimAtomLP: number;
      let claimUsdcLP: number;
      const votingPowerBeforeLp: Record<string, number> = {};
      let totalUnclaimedAtHeightBeforeMigration: number;
      let unclaimedAtHeightBeforeMigration: number;
      let unclaimedHeightBeforeMigration: number;

      it('should save voting power before migration: lp', async () => {
        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
          'auctionVesting',
        ]) {
          const vp = await tgeMain.lpVotingPower(
            tgeWallets[v].wallet.address.toString(),
          );
          votingPowerBeforeLp[v] = +vp.power;
        }
      });

      it('should save voting power before migration: lockdrop', async () => {
        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
          'auctionVesting',
        ]) {
          const vp = await tgeMain.lockdropVotingPower(
            tgeWallets[v].wallet.address.toString(),
          );
          votingPowerBeforeLockdrop[v] = +vp.power;
        }
      });

      it('should validate numbers & save claim amount before migration', async () => {
        unclaimedHeightBeforeMigration = await env.getHeight(neutronChain.sdk);
        totalUnclaimedAtHeightBeforeMigration =
          +(await tge.queryTotalUnclaimedAmountAtHeight(
            cmInstantiator.chain,
            tgeMain.contracts.vestingAtomLp,
            unclaimedHeightBeforeMigration,
          ));
        unclaimedAtHeightBeforeMigration =
          +(await tge.queryUnclaimmedAmountAtHeight(
            cmInstantiator.chain,
            tgeMain.contracts.vestingAtomLp,
            unclaimedHeightBeforeMigration,
            cmInstantiator.wallet.address.toString(),
          ));

        const [
          vestingInfoAtom,
          vestingInfoUsdc,
          lpAuctionBalanceAtom,
          lpAuctionBalanceUsdc,
        ] = await Promise.all([
          neutronChain.queryContract<VestingAccountResponse>(
            tgeMain.contracts.vestingAtomLp,
            {
              vesting_account: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<VestingAccountResponse>(
            tgeMain.contracts.vestingUsdcLp,
            {
              vesting_account: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.auction,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: tgeMain.contracts.auction,
              },
            },
          ),
        ]);

        expect(parseInt(lpAuctionBalanceUsdc.balance)).toBeLessThanOrEqual(7);
        expect(parseInt(lpAuctionBalanceAtom.balance)).toBeLessThanOrEqual(7);
        expect(vestingInfoAtom.address).toEqual(
          cmInstantiator.wallet.address.toString(),
        );
        expect(vestingInfoUsdc.address).toEqual(
          cmInstantiator.wallet.address.toString(),
        );
        expect(vestingInfoAtom.info.released_amount).toEqual('0');
        expect(vestingInfoUsdc.info.released_amount).toEqual('0');

        expect(
          parseInt(vestingInfoAtom.info.schedules[0].end_point.amount),
        ).toBeCloseTo(75706, -1);
        claimAtomLP = parseInt(
          vestingInfoAtom.info.schedules[0].end_point.amount,
        );

        expect(
          parseInt(vestingInfoUsdc.info.schedules[0].end_point.amount),
        ).toBeCloseTo(14197, -1);
        claimUsdcLP = parseInt(
          vestingInfoUsdc.info.schedules[0].end_point.amount,
        );
      });
      it('should migrate ATOM LP vesing to V2', async () => {
        const res = await cmInstantiator.migrateContract(
          tgeMain.contracts.vestingAtomLp,
          tgeMain.codeIds.VESTING_LP_NEW,
          {
            max_slippage: '0.1',
            ntrn_denom: NEUTRON_DENOM,
            paired_denom: IBC_ATOM_DENOM,
            xyk_pair: tgeMain.old_pairs.atom_ntrn.contract.toString(),
            cl_pair: tgeMain.pairs.atom_ntrn.contract.toString(),
            new_lp_token: tgeMain.pairs.atom_ntrn.liquidity.toString(),
            batch_size: 1,
          },
        );
        expect(res.code).toEqual(0);
      });

      it('should migrate USDC LP vesing to V2', async () => {
        const res = await cmInstantiator.migrateContract(
          tgeMain.contracts.vestingUsdcLp,
          tgeMain.codeIds.VESTING_LP_NEW,
          {
            max_slippage: '0.1',
            ntrn_denom: NEUTRON_DENOM,
            paired_denom: IBC_USDC_DENOM,
            xyk_pair: tgeMain.old_pairs.usdc_ntrn.contract,
            cl_pair: tgeMain.pairs.usdc_ntrn.contract,
            new_lp_token: tgeMain.pairs.usdc_ntrn.liquidity,
            batch_size: 50,
          },
        );
        expect(res.code).toEqual(0);
      });

      it('should migrate atom', async () => {
        let resAtom = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingAtomLp,
          JSON.stringify({
            migrate_liquidity: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        resAtom = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingAtomLp,
          JSON.stringify({
            migrate_liquidity: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        resAtom = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingAtomLp,
          JSON.stringify({
            migrate_liquidity: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        resAtom = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingAtomLp,
          JSON.stringify({
            migrate_liquidity: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        resAtom = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingAtomLp,
          JSON.stringify({
            migrate_liquidity: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        resAtom = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingAtomLp,
          JSON.stringify({
            migrate_liquidity: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        await expect(
          cmInstantiator.executeContract(
            tgeMain.contracts.vestingAtomLp,
            JSON.stringify({
              migrate_liquidity: {},
            }),
          ),
        ).rejects.toThrow(/Migration is complete/);
      });

      it('should migrate usdc', async () => {
        let resUsdc = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingUsdcLp,
          JSON.stringify({
            migrate_liquidity: {},
          }),
          [],
          {
            gas_limit: Long.fromString('6000000'),
            amount: [{ denom: tgeMain.chain.denom, amount: '20000' }],
          },
        );
        expect(resUsdc.code).toEqual(0);
        resUsdc = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingUsdcLp,
          JSON.stringify({
            migrate_liquidity: {},
          }),
        );
        expect(resUsdc.code).toEqual(0);
        await expect(
          cmInstantiator.executeContract(
            tgeMain.contracts.vestingUsdcLp,
            JSON.stringify({
              migrate_liquidity: {},
            }),
          ),
        ).rejects.toThrow(/Migration is complete/);
      });

      it('should compare voting power after migrtaion: lp', async () => {
        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
          'auctionVesting',
        ]) {
          const vp = await tgeMain.lpVotingPower(
            tgeWallets[v].wallet.address.toString(),
          );
          expect(+vp.power).toBeCloseTo(votingPowerBeforeLp[v], -4);
        }
      });

      it('should compare voting power after migration: lockdrop', async () => {
        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
          'auctionVesting',
        ]) {
          const vp = await tgeMain.lockdropVotingPower(
            tgeWallets[v].wallet.address.toString(),
          );
          expect(+vp.power).toBeCloseTo(votingPowerBeforeLockdrop[v], -3);
        }
      });

      it('check queries', async () => {
        const totalUnclaimedAmountAfterMigration =
          await tge.queryTotalUnclaimedAmountAtHeight(
            cmInstantiator.chain,
            tgeMain.contracts.vestingAtomLp,
            unclaimedHeightBeforeMigration,
          );
        const unclaimedAmountAfterMigration =
          await tge.queryUnclaimmedAmountAtHeight(
            cmInstantiator.chain,
            tgeMain.contracts.vestingAtomLp,
            unclaimedHeightBeforeMigration,
            cmInstantiator.wallet.address.toString(),
          );
        expect(+totalUnclaimedAmountAfterMigration).toEqual(
          totalUnclaimedAtHeightBeforeMigration,
        );
        expect(+unclaimedAmountAfterMigration).toEqual(
          unclaimedAtHeightBeforeMigration,
        );

        const currentHeight = await env.getHeight(neutronChain.sdk);
        const total = await tge.queryTotalUnclaimedAmountAtHeight(
          cmInstantiator.chain,
          tgeMain.contracts.vestingAtomLp,
          currentHeight,
        );
        const lpBalance = await tgeMain.chain.queryContract<BalanceResponse>(
          tgeMain.pairs.atom_ntrn.liquidity,
          {
            balance: {
              address: tgeMain.contracts.vestingAtomLp,
            },
          },
        );
        expect(total).toBe(lpBalance.balance);

        const ntrnAmount = await tge.queryNtrnCLBalanceAtHeight(
          cmInstantiator.chain,
          tgeMain.pairs.atom_ntrn.contract,
          currentHeight.toString(),
        );
        expect(+ntrnAmount).toBeGreaterThan(0);

        const claimableAmount = await tge.queryUnclaimmedAmountAtHeight(
          cmInstantiator.chain,
          tgeMain.contracts.vestingAtomLp,
          currentHeight,
          cmInstantiator.wallet.address.toString(),
        );
        const available = await tge.queryAvialableAmount(
          cmInstantiator.chain,
          tgeMain.contracts.vestingAtomLp,
          cmInstantiator.wallet.address.toString(),
        );
        expect(claimableAmount).toBe(available);
      });

      it('should claim', async () => {
        const resAtom = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingAtomLp,
          JSON.stringify({
            claim: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        const resUsdc = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingUsdcLp,
          JSON.stringify({
            claim: {},
          }),
        );
        expect(resUsdc.code).toEqual(0);

        const [lpBalanceAtom, lpBalanceUsdc] = await Promise.all([
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
        ]);

        // actual diff is smth about 0.2% (converting old lp to new)
        expect(parseInt(lpBalanceAtom.balance)).toBeCloseTo(claimAtomLP, -4);
        expect(parseInt(lpBalanceUsdc.balance)).toBeCloseTo(claimUsdcLP, -4);
      });
    });

    describe('Migration lockdrop to V2', () => {
      let userLockUpAtHeightBeforeMigration: number;
      let height: number;
      it('should save user lock up at height before migration', async () => {
        height = await env.getHeight(neutronChain.sdk);
        userLockUpAtHeightBeforeMigration =
          await cmInstantiator.chain.queryContract<number>(
            tgeMain.contracts.lockdrop,
            {
              query_user_lockup_total_at_height: {
                pool_type: 'ATOM',
                user_address: cmInstantiator.wallet.address,
                height: height,
              },
            },
          );
      });

      let totalVotingPowerBeforeMigration: number;
      let memberVotingPowerBeforeMigration: number;
      let heightBeforeMigration: number;
      let vpComparisonMember: string;
      it('query voting power before migration', async () => {
        vpComparisonMember =
          tgeWallets['airdropAuctionLockdropVesting'].wallet.address.toString();
        heightBeforeMigration = await env.getHeight(neutronChain.sdk);

        const totalVp = await daoMain.queryTotalVotingPower(
          heightBeforeMigration,
        );
        totalVotingPowerBeforeMigration = +totalVp.power;
        expect(totalVotingPowerBeforeMigration).toBeGreaterThan(0);

        const vp = await daoMain.queryVotingPower(
          vpComparisonMember,
          heightBeforeMigration,
        );
        memberVotingPowerBeforeMigration = +vp.power;
        expect(memberVotingPowerBeforeMigration).toBeGreaterThan(0);
      });

      it('should migrate voting registry to V2', async () => {
        const codeId = await cmInstantiator.storeWasm(
          types.NeutronContract.VOTING_REGISTRY_NEW,
        );
        expect(codeId).toBeGreaterThan(0);

        const messages = [
          // migrate voting registry to v2
          {
            wasm: {
              migrate: {
                contract_addr: daoMain.contracts.voting.address,
                msg: Buffer.from(JSON.stringify({})).toString('base64'),
                new_code_id: codeId,
              },
            },
          },
          // add lockdrop voting vault for CL
          {
            wasm: {
              execute: {
                contract_addr: daoMain.contracts.voting.address,
                msg: Buffer.from(
                  JSON.stringify({
                    add_voting_vault: {
                      new_voting_vault_contract: lockdropVaultForClAddr,
                    },
                  }),
                ).toString('base64'),
                funds: [],
              },
            },
          },
          // add vesting lp voting vault for CL
          {
            wasm: {
              execute: {
                contract_addr: daoMain.contracts.voting.address,
                msg: Buffer.from(
                  JSON.stringify({
                    add_voting_vault: {
                      new_voting_vault_contract: vestingLpVaultForClAddr,
                    },
                  }),
                ).toString('base64'),
                funds: [],
              },
            },
          },
          // disable lockdrop voting vault for xyk
          {
            wasm: {
              execute: {
                contract_addr: daoMain.contracts.voting.address,
                msg: Buffer.from(
                  JSON.stringify({
                    deactivate_voting_vault: {
                      voting_vault_contract: tgeMain.contracts.lockdropVault,
                    },
                  }),
                ).toString('base64'),
                funds: [],
              },
            },
          },
          // disable vesting lp voting vault for xyk
          {
            wasm: {
              execute: {
                contract_addr: daoMain.contracts.voting.address,
                msg: Buffer.from(
                  JSON.stringify({
                    deactivate_voting_vault: {
                      voting_vault_contract: tgeMain.contracts.vestingLpVault,
                    },
                  }),
                ).toString('base64'),
                funds: [],
              },
            },
          },
        ];
        const proposalId = await daoMember1.submitSingleChoiceProposal(
          'migrate voting vault registry to v2 and replace voting vaults',
          'migrate voting vault registry to a new version, add voting vaults for CL pairs and disable voting vaults for xyk pairs',
          messages,
          '1000',
        );
        await daoMember1.voteYes(proposalId);
        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
          'auctionVesting',
        ]) {
          const member = new dao.DaoMember(tgeWallets[v], daoMain);
          if (
            (await daoMain.queryProposal(proposalId)).proposal.status == 'open'
          ) {
            await member.voteYes(proposalId);
          }
        }
        await daoMain.checkPassedProposal(proposalId);

        // make sure premigration config is as expected
        const configBefore =
          await neutronChain.queryContract<OldVotingRegistryConfig>(
            daoMain.contracts.voting.address,
            {
              config: {},
            },
          );
        expect(configBefore.voting_vaults.length).toEqual(5); // neutron, investors, lockdrop, vesting lp, credits

        // execute migration
        await daoMember1.executeProposalWithAttempts(proposalId);
        await neutronChain.blockWaiter.waitBlocks(1);

        // make sure vaults are in the right state
        const votingVaultsAfter = await neutronChain.queryContract<
          VotingVault[]
        >(daoMain.contracts.voting.address, {
          voting_vaults: {},
        });
        expect(votingVaultsAfter.length).toEqual(7); // two more vaults
        expect(
          votingVaultsAfter.filter(
            (v) => v.address === tgeMain.contracts.lockdropVault,
          )[0].state,
        ).toEqual('Inactive'); // xyk lockdrop vault must become inactive
        expect(
          votingVaultsAfter.filter(
            (v) => v.address === tgeMain.contracts.vestingLpVault,
          )[0].state,
        ).toEqual('Inactive'); // xyk vesting lp vault must become inactive
        expect(
          votingVaultsAfter.filter(
            (v) => v.address === lockdropVaultForClAddr,
          )[0].state,
        ).toEqual('Active'); // CL lockdrop vault must be active
        expect(
          votingVaultsAfter.filter(
            (v) => v.address === vestingLpVaultForClAddr,
          )[0].state,
        ).toEqual('Active'); // CL vesting lp vault must be active
        expect(
          votingVaultsAfter.filter(
            (v) =>
              v.address ===
              (daoMain.contracts.voting as dao.VotingVaultsModule).vaults
                .neutron.address,
          )[0].state,
        ).toEqual('Active'); // neutron vault must stay active
        expect(
          votingVaultsAfter.filter(
            (v) => v.address === tgeMain.contracts.creditsVault,
          )[0].state,
        ).toEqual('Active'); // credits vault must stay active
      });

      it('should migrate lockdrop to V2', async () => {
        const res = await cmInstantiator.migrateContract(
          tgeMain.contracts.lockdrop,
          tgeMain.codeIds.TGE_LOCKDROP_NEW,
          {
            new_atom_token: tgeMain.pairs.atom_ntrn.liquidity,
            new_usdc_token: tgeMain.pairs.usdc_ntrn.liquidity,
            max_slippage: '0.1',
          },
        );
        expect(res.code).toEqual(0);
        heightDiff = +(res.height || 0);
      });
      it('should not allow to query voting power', async () => {
        await expect(daoMain.queryTotalVotingPower()).rejects.toThrowError(
          /Querier contract error/,
        );
        await expect(
          daoMain.queryVotingPower(vpComparisonMember),
        ).rejects.toThrowError(/Querier contract error/);

        await expect(
          daoMain.queryTotalVotingPower(heightBeforeMigration),
        ).rejects.toThrowError(/Querier contract error/);
        await expect(
          daoMain.queryVotingPower(vpComparisonMember, heightBeforeMigration),
        ).rejects.toThrowError(/Querier contract error/);
      });
      it('should not allow to create a proposal', async () => {
        await expect(
          daoMember1.submitSingleChoiceProposal(
            'a proposal during migration',
            'an empty proposal created during lockdrop migration to make sure proposals creation is not possible',
            [],
            '1000',
          ),
        ).rejects.toThrowError(/Querier contract error/);
      });
      it('should not allow to query user lockup at height', async () => {
        await expect(
          cmInstantiator.chain.queryContract(tgeMain.contracts.lockdrop, {
            query_user_lockup_total_at_height: {
              pool_type: 'ATOM',
              user_address: cmInstantiator.wallet.address,
              height: 1,
            },
          }),
        ).rejects.toThrowError(/Contract is in migration state/);
      });
      it('should not allow to query total lockup at height', async () => {
        await expect(
          cmInstantiator.chain.queryContract(tgeMain.contracts.lockdrop, {
            query_lockup_total_at_height: {
              pool_type: 'ATOM',
              height: 1,
            },
          }),
        ).rejects.toThrowError(/Contract is in migration state/);
      });
      it('should not allow to execute claim', async () => {
        await expect(
          cmInstantiator.executeContract(
            tgeMain.contracts.lockdrop,
            JSON.stringify({
              claim_rewards_and_optionally_unlock: {
                pool_type: 'USDC',
                duration: 1,
                withdraw_lp_stake: false,
              },
            }),
          ),
        ).rejects.toThrowError(/Contract is in migration state/);
      });
      it('should not allow to migrate users', async () => {
        await expect(
          cmInstantiator.executeContract(
            tgeMain.contracts.lockdrop,
            JSON.stringify({
              migrate_from_xyk_to_cl: {
                migrate_users: {},
              },
            }),
          ),
        ).rejects.toThrowError(/Migration is not in MigrateUsers state/);
      });
      it('should not migrate liquidity with over-limit slippage', async () => {
        await expect(
          cmInstantiator.executeContract(
            tgeMain.contracts.lockdrop,
            JSON.stringify({
              migrate_from_xyk_to_cl: {
                migrate_liquidity: {
                  slippage_tolerance: '0.2',
                },
              },
            }),
            [],
            {
              gas_limit: Long.fromString('8000000'),
              amount: [{ denom: tgeMain.chain.denom, amount: '20000' }],
            },
          ),
        ).rejects.toThrowError(/Slippage tolerance is too high/);
      });
      it('should migrate liquidity', async () => {
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.lockdrop,
          JSON.stringify({
            migrate_from_xyk_to_cl: {
              migrate_liquidity: {
                slippage_tolerance: '0.05',
              },
            },
          }),
          [],
          {
            gas_limit: Long.fromString('8000000'),
            amount: [{ denom: tgeMain.chain.denom, amount: '20000' }],
          },
        );
        expect(res.code).toEqual(0);
      });
      it('should not migrate users with limit 0', async () => {
        await expect(
          cmInstantiator.executeContract(
            tgeMain.contracts.lockdrop,
            JSON.stringify({
              migrate_from_xyk_to_cl: {
                migrate_users: {
                  limit: 0,
                },
              },
            }),
            [],
            {
              gas_limit: Long.fromString('8000000'),
              amount: [{ denom: tgeMain.chain.denom, amount: '20000' }],
            },
          ),
        ).rejects.toThrowError(/Limit cannot be zero/);
      });
      it('should migrate users', async () => {
        await cmInstantiator.executeContract(
          tgeMain.contracts.lockdrop,
          JSON.stringify({
            migrate_from_xyk_to_cl: {
              migrate_users: {
                limit: 1,
              },
            },
          }),
          [],
          {
            gas_limit: Long.fromString('8000000'),
            amount: [{ denom: tgeMain.chain.denom, amount: '20000' }],
          },
        );
      });
      it('should migrate users', async () => {
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.lockdrop,
          JSON.stringify({
            migrate_from_xyk_to_cl: {
              migrate_users: {
                limit: 10,
              },
            },
          }),
          [],
          {
            gas_limit: Long.fromString('8000000'),
            amount: [{ denom: tgeMain.chain.denom, amount: '20000' }],
          },
        );
        expect(res.code).toEqual(0);
      });

      it('should finish migrate users', async () => {
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.lockdrop,
          JSON.stringify({
            migrate_from_xyk_to_cl: {
              migrate_users: {},
            },
          }),
        );
        expect(res.code).toEqual(0);
        const height = +(res.height || 0);
        heightDiff = height - heightDiff;
      });
      it('should allow to query total lockup at height', async () => {
        const res = await cmInstantiator.chain.queryContract(
          tgeMain.contracts.lockdrop,
          {
            query_lockup_total_at_height: {
              pool_type: 'ATOM',
              height: 1,
            },
          },
        );
        expect(res).toEqual('0');
      });

      it('historical voting power should remain intact', async () => {
        const totalVp = await daoMain.queryTotalVotingPower(
          heightBeforeMigration,
        );
        expect(totalVotingPowerBeforeMigration).toEqual(+totalVp.power);

        const vp = await daoMain.queryVotingPower(
          vpComparisonMember,
          heightBeforeMigration,
        );
        expect(memberVotingPowerBeforeMigration).toEqual(+vp.power);
      });
      it('voting power before migration is similar to the one after migration', async () => {
        const histTotalVp = await daoMain.queryTotalVotingPower(
          heightBeforeMigration,
        );
        const histVp = await daoMain.queryVotingPower(
          vpComparisonMember,
          heightBeforeMigration,
        );

        const totalVp = await daoMain.queryTotalVotingPower();
        const vp = await daoMain.queryVotingPower(vpComparisonMember);

        expect(+histTotalVp.power).toBeCloseTo(+totalVp.power, -4);
        expect(+histVp.power).toBeCloseTo(+vp.power, -4);
      });

      it('should check user lock up at height before migration and after at the same height', async () => {
        const userLockUpAtHeightAfterMigration =
          await cmInstantiator.chain.queryContract<number>(
            tgeMain.contracts.lockdrop,
            {
              query_user_lockup_total_at_height: {
                pool_type: 'ATOM',
                user_address: cmInstantiator.wallet.address,
                height: height,
              },
            },
          );
        expect(userLockUpAtHeightAfterMigration).toEqual(
          userLockUpAtHeightBeforeMigration,
        );
      });
      it('should compare voting power after migration: lockdrop', async () => {
        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
          'auctionVesting',
        ]) {
          const vp = await tgeMain.lockdropVotingPower(
            tgeWallets[v].wallet.address.toString(),
          );
          expect(+vp.power).toBeCloseTo(votingPowerBeforeLockdrop[v], -3);
        }
      });
      it('should have non-zero liquidity on CL pools', async () => {
        const usdcBalance = await neutronChain.queryContract<BalanceResponse>(
          tgeMain.pairs.usdc_ntrn.liquidity,
          {
            balance: {
              address: tgeMain.contracts.astroGenerator,
            },
          },
        );
        expect(usdcBalance.balance).not.toEqual('0');
        const atomBalance = await neutronChain.queryContract<BalanceResponse>(
          tgeMain.pairs.atom_ntrn.liquidity,
          {
            balance: {
              address: tgeMain.contracts.astroGenerator,
            },
          },
        );
        expect(atomBalance.balance).not.toEqual('0');
      });
      it('should have zero liquidity on XYK pools', async () => {
        const usdcBalance = await neutronChain.queryContract<BalanceResponse>(
          tgeMain.old_pairs.usdc_ntrn.liquidity,
          {
            balance: {
              address: tgeMain.contracts.astroGenerator,
            },
          },
        );
        expect(usdcBalance.balance).toEqual('0');
        const atomBalance = await neutronChain.queryContract<BalanceResponse>(
          tgeMain.old_pairs.atom_ntrn.liquidity,
          {
            balance: {
              address: tgeMain.contracts.astroGenerator,
            },
          },
        );
        expect(atomBalance.balance).toEqual('0');
      });
      it('query pool info', async () => {
        const atomPool =
          await neutronChain.queryContract<LockdropPoolInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              pool: {
                pool_type: 'ATOM',
              },
            },
          );
        expect(+atomPool.amount_in_lockups).not.toEqual(0);
        expect(+atomPool.generator_ntrn_per_share).not.toEqual(0);
        const usdcPool =
          await neutronChain.queryContract<LockdropPoolInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              pool: {
                pool_type: 'USDC',
              },
            },
          );
        expect(+usdcPool.amount_in_lockups).not.toEqual(0);
        expect(+usdcPool.generator_ntrn_per_share).not.toEqual(0);
      });
    });
  });

  describe('lockdrop rewards', () => {
    let balanceBeforeLockdrop: number;
    let balanceBeforeAirdopLockdrop: number;
    let balanceBeforeAirdropAuctionLockdropVesting: number;
    let airdropAuctionLockdropVestingUserInfo: LockDropInfoResponse;
    describe('before claim', () => {
      it('query balance before claim rewards', async () => {
        balanceBeforeLockdrop = await neutronChain.queryDenomBalance(
          tgeWallets['auctionLockdrop'].wallet.address.toString(),
          NEUTRON_DENOM,
        );
        balanceBeforeAirdopLockdrop = await neutronChain.queryDenomBalance(
          tgeWallets['airdropAuctionLockdrop'].wallet.address.toString(),
          NEUTRON_DENOM,
        );
        balanceBeforeAirdropAuctionLockdropVesting =
          await neutronChain.queryDenomBalance(
            tgeWallets[
              'airdropAuctionLockdropVesting'
            ].wallet.address.toString(),
            NEUTRON_DENOM,
          );

        airdropAuctionLockdropVestingUserInfo =
          await neutronChain.queryContract<LockDropInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              user_info: {
                address:
                  tgeWallets[
                    'airdropAuctionLockdropVesting'
                  ].wallet.address.toString(),
              },
            },
          );
      });
    });
    describe('lockdrop rewards', () => {
      beforeAll(async () => {
        await waitTill(
          tgeMain.times.lockdropInit +
            tgeMain.times.lockdropDepositDuration +
            tgeMain.times.lockdropWithdrawalDuration +
            1,
        );
      });

      it('for cmInstantiator without withdraw', async () => {
        const rewardsStateBeforeClaim = await tgeMain.generatorRewardsState(
          cmInstantiator.wallet.address.toString(),
        );

        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.lockdrop,
          JSON.stringify({
            claim_rewards_and_optionally_unlock: {
              pool_type: 'USDC',
              duration: 1,
              withdraw_lp_stake: false,
            },
          }),
        );
        expect(res.code).toEqual(0);
        const claimHeight = +(res.height || 0);

        const rewardsStateAfterClaim = await tgeMain.generatorRewardsState(
          cmInstantiator.wallet.address.toString(),
        );

        expect(
          rewardsStateAfterClaim.balanceNtrn +
            FEE_SIZE -
            rewardsStateBeforeClaim.balanceNtrn,
        ).toBeCloseTo(125978, -3); // lockdrop rewards share for the user

        const expectedGeneratorRewards = +(
          (
            rewardsStateBeforeClaim.userInfo.lockup_infos.find(
              (i) => i.pool_type == 'USDC' && i.duration == 1,
            ) || {}
          ).claimable_generator_astro_debt || '0'
        );
        expect(expectedGeneratorRewards).toBeGreaterThan(0);

        // we expect the astro balance to increase by somewhere between user rewards amount and user
        // rewards amount plus rewards per block amount because rewards drip each block.
        const astroBalanceDiff =
          rewardsStateAfterClaim.balanceAstro -
          rewardsStateBeforeClaim.balanceAstro;
        expect(astroBalanceDiff).toBeGreaterThan(0);
        expect(astroBalanceDiff).toBeGreaterThanOrEqual(
          expectedGeneratorRewards,
        );
        expect(astroBalanceDiff).toBeLessThan(
          expectedGeneratorRewards + tgeMain.generatorRewardsPerBlock,
        );

        await neutronChain.blockWaiter.waitBlocks(20);
        const pending = await neutronChain.queryContract<any>(
          tgeMain.contracts.astroGenerator,
          {
            pending_token: {
              lp_token: tgeMain.pairs.usdc_ntrn.liquidity,
              user: tgeMain.contracts.lockdrop,
            },
          },
        );
        expect(+pending.pending).toBeGreaterThan(0);
        const resSecond = await cmInstantiator.executeContract(
          tgeMain.contracts.lockdrop,
          JSON.stringify({
            claim_rewards_and_optionally_unlock: {
              pool_type: 'USDC',
              duration: 1,
              withdraw_lp_stake: false,
            },
          }),
        );
        const secondClaimHeight = +(resSecond.height || 0);
        const { balanceAstro: newBalanceAstro } =
          await tgeMain.generatorRewardsState(
            cmInstantiator.wallet.address.toString(),
          );
        const newAstroIncentivesPerBlock =
          (newBalanceAstro - rewardsStateAfterClaim.balanceAstro) /
          (secondClaimHeight - claimHeight);
        expect(newAstroIncentivesPerBlock).toBeCloseTo(
          astroIncentivesPerBlock,
          1,
        );
        // withdraw_lp_stake is false => no lp tokens returned
        expect(rewardsStateBeforeClaim.atomNtrnLpTokenBalance).toEqual(
          rewardsStateAfterClaim.atomNtrnLpTokenBalance,
        );
        expect(rewardsStateBeforeClaim.usdcNtrnLpTokenBalance).toEqual(
          rewardsStateAfterClaim.usdcNtrnLpTokenBalance,
        );
      });

      it("unavailable for those who didn't participate", async () => {
        for (const v of [
          'airdropOnly',
          'airdropAuctionVesting',
          'auctionVesting',
        ]) {
          await expect(
            tgeWallets[v].executeContract(
              tgeMain.contracts.lockdrop,
              JSON.stringify({
                claim_rewards_and_optionally_unlock: {
                  pool_type: 'USDC',
                  duration: 1,
                  withdraw_lp_stake: false,
                },
              }),
            ),
          ).rejects.toThrowError(/LockupInfoV1 not found/);
          await expect(
            tgeWallets[v].executeContract(
              tgeMain.contracts.lockdrop,
              JSON.stringify({
                claim_rewards_and_optionally_unlock: {
                  pool_type: 'ATOM',
                  duration: 1,
                  withdraw_lp_stake: false,
                },
              }),
            ),
          ).rejects.toThrowError(/LockupInfoV1 not found/);
        }
      });

      for (const v of [
        'airdropAuctionLockdrop',
        'airdropAuctionLockdropVesting',
        'auctionLockdrop',
        'auctionLockdropVesting',
      ]) {
        it('for ' + v + ' without withdraw', async () => {
          const rewardsStateBeforeClaim = await tgeMain.generatorRewardsState(
            tgeWallets[v].wallet.address.toString(),
          );

          const res = await tgeWallets[v].executeContract(
            tgeMain.contracts.lockdrop,
            JSON.stringify({
              claim_rewards_and_optionally_unlock: {
                pool_type: 'USDC',
                duration: 1,
                withdraw_lp_stake: false,
              },
            }),
          );
          expect(res.code).toEqual(0);

          const rewardsStateAfterClaim = await tgeMain.generatorRewardsState(
            tgeWallets[v].wallet.address.toString(),
          );

          // a more precise check is done later in 'should get extra untrn from unclaimed airdrop'
          // testcase, here we simply check that the balance has increased
          expect(rewardsStateAfterClaim.balanceNtrn + FEE_SIZE).toBeGreaterThan(
            rewardsStateBeforeClaim.balanceNtrn,
          );

          const expectedGeneratorRewards = +(
            (
              rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                (i) => i.pool_type == 'USDC' && i.duration == 1,
              ) || {}
            ).claimable_generator_astro_debt || '0'
          );
          expect(expectedGeneratorRewards).toBeGreaterThan(0);

          // we expect the astro balance to increase by somewhere between user rewards amount and user
          // rewards amount plus rewards per block amount because rewards amount increases each block.
          const astroBalanceDiff =
            rewardsStateAfterClaim.balanceAstro -
            rewardsStateBeforeClaim.balanceAstro;
          expect(astroBalanceDiff).toBeGreaterThanOrEqual(
            expectedGeneratorRewards,
          );
          expect(astroBalanceDiff).toBeLessThan(
            expectedGeneratorRewards + tgeMain.generatorRewardsPerBlock,
          );

          // withdraw_lp_stake is false => no lp tokens returned
          expect(rewardsStateBeforeClaim.atomNtrnLpTokenBalance).toEqual(
            rewardsStateAfterClaim.atomNtrnLpTokenBalance,
          );
          expect(rewardsStateBeforeClaim.usdcNtrnLpTokenBalance).toEqual(
            rewardsStateAfterClaim.usdcNtrnLpTokenBalance,
          );
        });
      }

      for (const v of [
        'airdropAuctionLockdrop',
        'airdropAuctionLockdropVesting',
        'auctionLockdrop',
        'auctionLockdropVesting',
      ]) {
        it('for ' + v + ' with withdraw', async () => {
          const rewardsStateBeforeClaim = await tgeMain.generatorRewardsState(
            tgeWallets[v].wallet.address.toString(),
          );

          let res = await tgeWallets[v].executeContract(
            tgeMain.contracts.lockdrop,
            JSON.stringify({
              claim_rewards_and_optionally_unlock: {
                pool_type: 'USDC',
                duration: 1,
                withdraw_lp_stake: true,
              },
            }),
          );
          expect(res.code).toEqual(0);
          res = await tgeWallets[v].executeContract(
            tgeMain.contracts.lockdrop,
            JSON.stringify({
              claim_rewards_and_optionally_unlock: {
                pool_type: 'ATOM',
                duration: 1,
                withdraw_lp_stake: true,
              },
            }),
          );
          expect(res.code).toEqual(0);

          const rewardsStateAfterClaim = await tgeMain.generatorRewardsState(
            tgeWallets[v].wallet.address.toString(),
          );

          expect(rewardsStateAfterClaim.balanceNtrn + 2 * FEE_SIZE).toEqual(
            rewardsStateBeforeClaim.balanceNtrn,
          ); // ntrn rewards were sent at the previous claim, so no ntrn income is expected

          // withdraw_lp_stake is true => expect lp tokens to be unlocked and returned to the user
          const usdcNtrnLockedLp = +(
            (
              rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                (i) => i.pool_type == 'USDC' && i.duration == 1,
              ) || {}
            ).lp_units_locked || '0'
          );
          expect(usdcNtrnLockedLp).toBeGreaterThan(0);
          expect(rewardsStateAfterClaim.usdcNtrnLpTokenBalance).toEqual(
            rewardsStateBeforeClaim.usdcNtrnLpTokenBalance + usdcNtrnLockedLp,
          );
          const atomNtrnLockedLp = +(
            (
              rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                (i) => i.pool_type == 'ATOM' && i.duration == 1,
              ) || {}
            ).lp_units_locked || '0'
          );
          expect(atomNtrnLockedLp).toBeGreaterThan(0);
          expect(rewardsStateAfterClaim.atomNtrnLpTokenBalance).toEqual(
            rewardsStateBeforeClaim.atomNtrnLpTokenBalance + atomNtrnLockedLp,
          );

          // claimed from both pools above, so expected rewards amount is a sum of both
          const expectedGeneratorRewards =
            +(
              (
                rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                  (i) => i.pool_type == 'USDC' && i.duration == 1,
                ) || {}
              ).claimable_generator_astro_debt || '0'
            ) +
            +(
              (
                rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                  (i) => i.pool_type == 'ATOM' && i.duration == 1,
                ) || {}
              ).claimable_generator_astro_debt || '0'
            );
          expect(expectedGeneratorRewards).toBeGreaterThan(0);

          // we expect the astro balance to increase by somewhere between user rewards amount and user
          // rewards amount plus 2*rewards per block amount because rewards amount increases each block.
          const astroBalanceDiff =
            rewardsStateAfterClaim.balanceAstro -
            rewardsStateBeforeClaim.balanceAstro;
          expect(astroBalanceDiff).toBeGreaterThanOrEqual(
            expectedGeneratorRewards,
          );
          expect(astroBalanceDiff).toBeLessThan(
            expectedGeneratorRewards + 2 * tgeMain.generatorRewardsPerBlock,
          );
        });
      }
    });
    describe('airdrop checks', () => {
      it('should get extra untrn from unclaimed airdrop', async () => {
        const balanceAfterLockdrop = await neutronChain.queryDenomBalance(
          tgeWallets['auctionLockdrop'].wallet.address.toString(),
          NEUTRON_DENOM,
        );
        const balanceAfterAirdopLockdrop = await neutronChain.queryDenomBalance(
          tgeWallets['airdropAuctionLockdrop'].wallet.address.toString(),
          NEUTRON_DENOM,
        );
        // we have to take into account
        // every wallet has executed 3 tx during `should get lockdrop rewards` stage
        // every tx costs 10000untrn.
        const feeCompensation = 3 * FEE_SIZE;
        const claimedRewardWithAirdrop =
          balanceAfterAirdopLockdrop -
          balanceBeforeAirdopLockdrop +
          feeCompensation;
        const claimedRewardNoAirdrop =
          balanceAfterLockdrop - balanceBeforeLockdrop + feeCompensation;
        // claimed rewards + airdrop should be ~2 times bigger than clear reward.
        // 3317(reward) + 3371(3317 extra airdrop + 54 vested airdrop) vs 3317
        expect(
          claimedRewardWithAirdrop - 2 * claimedRewardNoAirdrop,
        ).toBeLessThan(100);
      });
      it('Correct instant airdrop amount', async () => {
        const balanceAfterAirdropAuctionLockdropVesting =
          await neutronChain.queryDenomBalance(
            tgeWallets[
              'airdropAuctionLockdropVesting'
            ].wallet.address.toString(),
            NEUTRON_DENOM,
          );
        const expectedLockdropReward = Number(
          airdropAuctionLockdropVestingUserInfo.total_ntrn_rewards,
        );
        const feeCompensation = 3 * FEE_SIZE;
        expect(
          expectedLockdropReward +
            balanceBeforeAirdropAuctionLockdropVesting +
            TINY_AIRDROP_AMOUNT,
        ).toEqual(feeCompensation + balanceAfterAirdropAuctionLockdropVesting);
      });
    });
  });
});

type OldVotingRegistryConfig = {
  owner: string;
  voting_vaults: string[];
};

type VotingVault = {
  address: string;
  name: string;
  description: string;
  state: string;
};
