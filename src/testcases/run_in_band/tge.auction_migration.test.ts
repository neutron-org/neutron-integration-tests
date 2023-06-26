import {
  CosmosWrapper,
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { Asset } from '../../helpers/types';
import { getHeight } from '../../helpers/wait';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import {
  executeDeregisterPair,
  executeFactoryCreatePair,
  getTimestamp,
  queryFactoryPairs,
  Tge,
} from '../../helpers/tge';
import { Dao, DaoMember, getDaoContracts } from '../../helpers/dao';
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

type TwapAtHeight = [Asset, string][];

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

describe('Neutron / TGE / Auction / Lockdrop migration', () => {
  let testState: TestStateLocalCosmosTestNet;
  let tge: Tge;
  let neutronChain: CosmosWrapper;
  let cmInstantiator: WalletWrapper;
  let cmTokenManager: WalletWrapper;
  let cmStranger: WalletWrapper;
  const tgeWallets: Record<string, WalletWrapper> = {};
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
  let daoMember1: DaoMember;
  let dao: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    reserveAddress =
      testState.wallets.qaNeutronThree.genQaWal1.address.toString();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    cmInstantiator = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    cmTokenManager = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.genQaWal1,
    );
    cmStranger = new WalletWrapper(
      neutronChain,

      testState.wallets.qaNeutronFive.genQaWal1,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    dao = new Dao(neutronChain, daoContracts);
    daoMember1 = new DaoMember(cmInstantiator, dao);
    await daoMember1.bondFunds('1000');
    tge = new Tge(
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
    ]) {
      tgeWallets[v] = new WalletWrapper(
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
      tge.airdropAccounts = [
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
      ];
      tge.times.airdropStart = getTimestamp(0);
      tge.times.airdropVestingStart = getTimestamp(300);
      await tge.deployPreAuction();
    });
    it('should deploy auction', async () => {
      tge.times.auctionInit = getTimestamp(80);
      await tge.deployAuction();
    });

    it('should deploy lockdrop and lockdrop vault', async () => {
      tge.times.lockdropInit =
        tge.times.auctionInit +
        tge.times.auctionDepositWindow +
        tge.times.auctionWithdrawalWindow +
        5;
      await tge.deployLockdrop();
      await tge.deployLockdropVault();
    });
  });

  describe('Airdrop', () => {
    it('should claim airdrop', async () => {
      for (const v of [
        'airdropOnly',
        'airdropAuctionVesting',
        'airdropAuctionLockdrop',
        'airdropAuctionLockdropVesting',
      ]) {
        const address = tgeWallets[v].wallet.address.toString();
        const amount =
          tge.airdropAccounts.find(
            ({ address }) => address == tgeWallets[v].wallet.address.toString(),
          )?.amount || '0';
        const proofs = tge.airdrop.getMerkleProof({
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
          tge.contracts.airdrop,
          JSON.stringify(payload),
        );
        expect(res.code).toEqual(0);
      }
    });
  });

  describe('Auction', () => {
    describe('Phase 1', () => {
      it('should allow deposit ATOM', async () => {
        await waitTill(tge.times.auctionInit + 3);
        const atomBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tge.contracts.auction,
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
        const info = await neutronChain.queryContract<UserInfoResponse>(
          tge.contracts.auction,
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
        atomBalance += ATOM_DEPOSIT_AMOUNT;

        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
        ]) {
          const res2 = await tgeWallets[v].executeContract(
            tge.contracts.auction,
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
          tge.contracts.auction,
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
        const info = await neutronChain.queryContract<UserInfoResponse>(
          tge.contracts.auction,
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
        usdcBalance += USDC_DEPOSIT_AMOUNT;

        for (const v of [
          'airdropAuctionVesting',
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
        ]) {
          const res2 = await tgeWallets[v].executeContract(
            tge.contracts.auction,
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
            tge.contracts.lockdrop,
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
          await cmInstantiator.msgSend(tge.contracts.auction, {
            amount: NTRN_AMOUNT.toString(),
          });
          await waitTill(
            tge.times.auctionInit +
              tge.times.auctionDepositWindow +
              tge.times.auctionWithdrawalWindow +
              5,
          );
          const time = (Date.now() / 1000) | 0;
          const r1 = await cmTokenManager.executeContract(
            tge.contracts.priceFeed,
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
            tge.contracts.priceFeed,
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
            tge.contracts.auction,
            JSON.stringify({
              set_pool_size: {},
            }),
          );
          expect(res.code).toEqual(0);
          const state = await neutronChain.queryContract<AuctionStateResponse>(
            tge.contracts.auction,
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
              tge.contracts.auction,
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
            tge.contracts.auction,
            JSON.stringify({
              lock_lp: {
                amount: '250000',
                asset: 'ATOM',
                duration: 1,
              },
            }),
          );
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tge.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(parseInt(userInfo.atom_lp_locked)).toEqual(250000);
          atomLpLocked += 250000;
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tge.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos).toHaveLength(1);
          expect(info.lockup_infos[0]).toMatchObject({
            lp_units_locked: atomLpLocked.toString(),
            pool_type: 'ATOM',
          });

          for (const v of [
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
          ]) {
            const userInfo = await neutronChain.queryContract<UserInfoResponse>(
              tge.contracts.auction,
              {
                user_info: {
                  address: tgeWallets[v].wallet.address.toString(),
                },
              },
            );
            const res2 = await tgeWallets[v].executeContract(
              tge.contracts.auction,
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
            tge.contracts.auction,
            JSON.stringify({
              lock_lp: {
                amount: '70000',
                asset: 'USDC',
                duration: 1,
              },
            }),
          );
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tge.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          usdcLpLocked += 70000;
          expect(parseInt(userInfo.usdc_lp_locked)).toEqual(70000);
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tge.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos).toHaveLength(2);
          expect(info.lockup_infos[1]).toMatchObject({
            lp_units_locked: String(usdcLpLocked),
            pool_type: 'USDC',
          });

          for (const v of [
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
          ]) {
            const userInfo = await neutronChain.queryContract<UserInfoResponse>(
              tge.contracts.auction,
              {
                user_info: {
                  address: tgeWallets[v].wallet.address.toString(),
                },
              },
            );
            const res2 = await tgeWallets[v].executeContract(
              tge.contracts.auction,
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
          tge.contracts.lockdrop,
          JSON.stringify({
            update_config: {
              new_config: {
                generator_address: tge.contracts.astroGenerator,
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
          tge.times.lockdropInit +
            tge.times.lockdropDepositDuration +
            tge.times.lockdropWithdrawalDuration +
            5,
        );
        const res = await cmInstantiator.executeContract(
          tge.contracts.auction,
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
            tge.contracts.auction,
            {
              state: {},
            },
          ),
          neutronChain.queryContract<PoolInfoResponse>(
            tge.pairs.atom_ntrn.contract,
            {
              pool: {},
            },
          ),
          neutronChain.queryContract<PoolInfoResponse>(
            tge.pairs.usdc_ntrn.contract,
            {
              pool: {},
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: reserveAddress,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: reserveAddress,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: tge.contracts.auction,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: tge.contracts.auction,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: tge.contracts.lockdrop,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: tge.contracts.lockdrop,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: tge.contracts.astroGenerator,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: tge.contracts.astroGenerator,
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
        tgeEndHeight = await getHeight(neutronChain.sdk);
        let res = await cmInstantiator.executeContract(
          tge.contracts.oracleAtom,
          JSON.stringify({
            update: {},
          }),
        );
        expect(res.code).toEqual(0);

        res = await cmInstantiator.executeContract(
          tge.contracts.oracleUsdc,
          JSON.stringify({
            update: {},
          }),
        );
        expect(res.code).toEqual(0);

        testState.blockWaiter1.waitBlocks(3);
        res = await cmInstantiator.executeContract(
          tge.contracts.oracleAtom,
          JSON.stringify({
            update: {},
          }),
        );
        expect(res.code).toEqual(0);
        res = await cmInstantiator.executeContract(
          tge.contracts.oracleUsdc,
          JSON.stringify({
            update: {},
          }),
        );
        expect(res.code).toEqual(0);
      });
      it('should not be able to init pool twice', async () => {
        await expect(
          cmInstantiator.executeContract(
            tge.contracts.auction,
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
          tge.contracts.auction,
          JSON.stringify({
            migrate_to_vesting: {},
          }),
        );
        expect(res.code).toEqual(0);
        res = await tgeWallets.airdropOnly.executeContract(
          tge.contracts.auction,
          JSON.stringify({
            migrate_to_vesting: {},
          }),
        );
        expect(res.code).toEqual(0);
        tge.times.vestTimestamp = Date.now();
      });
      it('should not vest LP all 7 users have been migrated', async () => {
        await expect(
          cmInstantiator.executeContract(
            tge.contracts.auction,
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
            tge.contracts.vestingAtomLp,
            {
              vesting_account: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<VestingAccountResponse>(
            tge.contracts.vestingUsdcLp,
            {
              vesting_account: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: tge.contracts.auction,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: tge.contracts.auction,
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
        ).toBeCloseTo(5918, -1);
        claimAtomLP = parseInt(
          vestingInfoAtom.info.schedules[0].end_point.amount,
        );

        expect(
          parseInt(vestingInfoUsdc.info.schedules[0].end_point.amount),
        ).toBeCloseTo(2784, -1);
        claimUsdcLP = parseInt(
          vestingInfoUsdc.info.schedules[0].end_point.amount,
        );
      });
      it('should be able to claim lpATOM_NTRN vesting after vesting period', async () => {
        await waitTill(
          tge.times.vestTimestamp / 1000 +
            tge.times.auctionVestingLpDuration +
            10,
        );
        const [avaliableAtomLp, avaliableUsdcLp] = await Promise.all([
          neutronChain.queryContract<string>(tge.contracts.vestingAtomLp, {
            available_amount: {
              address: cmInstantiator.wallet.address.toString(),
            },
          }),
          neutronChain.queryContract<string>(tge.contracts.vestingUsdcLp, {
            available_amount: {
              address: cmInstantiator.wallet.address.toString(),
            },
          }),
        ]);
        expect(avaliableAtomLp).toEqual(claimAtomLP.toString());
        expect(avaliableUsdcLp).toEqual(claimUsdcLP.toString());
        const resAtom = await cmInstantiator.executeContract(
          tge.contracts.vestingAtomLp,
          JSON.stringify({
            claim: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        const resUsdc = await cmInstantiator.executeContract(
          tge.contracts.vestingUsdcLp,
          JSON.stringify({
            claim: {},
          }),
        );
        expect(resUsdc.code).toEqual(0);

        const [lpBalanceAtom, lpBalanceUsdc] = await Promise.all([
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tge.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
        ]);
        expect(parseInt(lpBalanceAtom.balance)).toBeCloseTo(claimAtomLP, -1);
        expect(parseInt(lpBalanceUsdc.balance)).toBeCloseTo(claimUsdcLP, -1);
      });
    });
    describe.skip('vaults', () => {
      describe('basic checks', () => {
        it('oracle works', async () => {
          const rateNtrnAtom = await neutronChain.queryContract<TwapAtHeight>(
            tge.contracts.oracleAtom,
            {
              t_w_a_p_at_height: {
                token: { native_token: { denom: NEUTRON_DENOM } },
                height: String(tgeEndHeight + 10),
              },
            },
          );
          const rateAtomNtrn = await neutronChain.queryContract<TwapAtHeight>(
            tge.contracts.oracleAtom,
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
            tge.contracts.oracleUsdc,
            {
              t_w_a_p_at_height: {
                token: { native_token: { denom: NEUTRON_DENOM } },
                height: String(tgeEndHeight + 10),
              },
            },
          );
          const rateUsdcNtrn = await neutronChain.queryContract<TwapAtHeight>(
            tge.contracts.oracleUsdc,
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
          ]) {
            const member = new DaoMember(tgeWallets[v], dao);
            expect((await member.queryVotingPower()).power | 0).toBe(0);
          }
        });

        it('add lockdrop vault to the registry', async () => {
          let tvp = await dao.queryTotalVotingPower();
          expect(tvp.power | 0).toBe(1000);
          const propID = await daoMember1.submitSingleChoiceProposal(
            'Proposal #1',
            'add LOCKDROP_VAULT',
            [
              {
                wasm: {
                  execute: {
                    contract_addr: dao.contracts.voting.address,
                    msg: Buffer.from(
                      `{"add_voting_vault": {"new_voting_vault_contract":"${tge.contracts.lockdropVault}"}}`,
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
          tvp = await dao.queryTotalVotingPower();
          expect(tvp.power | 0).toBeGreaterThan(1000);
          // lockdrop participants get voting power
          for (const v of [
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
          ]) {
            const member = new DaoMember(tgeWallets[v], dao);
            expect((await member.queryVotingPower()).power | 0).toBeGreaterThan(
              0,
            );
          }
          for (const v of [
            'airdropOnly',
            'airdropAuctionVesting',
            'auctionVesting',
          ]) {
            const member = new DaoMember(tgeWallets[v], dao);
            expect((await member.queryVotingPower()).power | 0).toBe(0);
          }
        });

        it('add vesting vault to the registry', async () => {
          const tvp = await dao.queryTotalVotingPower();
          const propID = await daoMember1.submitSingleChoiceProposal(
            'Proposal #2',
            'add VESTING_LP_VAULT',
            [
              {
                wasm: {
                  execute: {
                    contract_addr: dao.contracts.voting.address,
                    msg: Buffer.from(
                      `{"add_voting_vault": {"new_voting_vault_contract":"${tge.contracts.vestingLpVault}"}}`,
                    ).toString('base64'),
                    funds: [],
                  },
                },
              },
            ],
            '1000',
          );
          await daoMember1.voteYes(propID);
          const prop = await dao.queryProposal(propID);
          // we connected new voting vault(vesting voting vault), now its not enough
          // daoMember1 voting power to pass proposal
          // lockdrop participant should vote
          expect(prop.proposal).toMatchObject({ status: 'open' });
          const vp: Record<string, number> = {};
          for (const v of [
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
          ]) {
            const member = new DaoMember(tgeWallets[v], dao);
            vp[v] = (await member.queryVotingPower()).power | 0;
            if ((await dao.queryProposal(propID)).proposal.status == 'open') {
              await member.voteYes(propID);
            }
          }
          await daoMember1.executeProposal(propID);
          const tvpNew = await dao.queryTotalVotingPower();
          expect(tvpNew.power | 0).toBeGreaterThan(tvp.power | 0);
          // vesting participants get(increase) the voting power
          for (const v of [
            'airdropAuctionVesting',
            'airdropAuctionLockdropVesting',
            'auctionVesting',
            'auctionLockdropVesting',
          ]) {
            const member = new DaoMember(tgeWallets[v], dao);
            expect((await member.queryVotingPower()).power | 0).toBeGreaterThan(
              vp[v] | 0,
            );
          }
        });

        it('add credits vault to the registry', async () => {
          const tvp = await dao.queryTotalVotingPower();
          const propID = await daoMember1.submitSingleChoiceProposal(
            'Proposal #3',
            'add CREDITS_VAULT',
            [
              {
                wasm: {
                  execute: {
                    contract_addr: dao.contracts.voting.address,
                    msg: Buffer.from(
                      `{"add_voting_vault": {"new_voting_vault_contract":"${tge.contracts.creditsVault}"}}`,
                    ).toString('base64'),
                    funds: [],
                  },
                },
              },
            ],
            '1000',
          );
          await daoMember1.voteYes(propID);
          const prop = await dao.queryProposal(propID);
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
          ]) {
            const member = new DaoMember(tgeWallets[v], dao);
            vp[v] = (await member.queryVotingPower()).power | 0;
            if ((await dao.queryProposal(propID)).proposal.status == 'open') {
              await member.voteYes(propID);
            }
          }
          await daoMember1.executeProposal(propID);
          const tvpNew = await dao.queryTotalVotingPower();
          expect(tvpNew.power | 0).toBeGreaterThan(tvp.power | 0);
          // airdrop participants get(increase) the voting power
          for (const v of [
            'airdropOnly',
            'airdropAuctionVesting',
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
          ]) {
            const member = new DaoMember(tgeWallets[v], dao);
            expect((await member.queryVotingPower()).power | 0).toBeGreaterThan(
              vp[v] | 0,
            );
          }
        });
        it('airdrop contract should not have credits vault voting power', async () => {
          const ctvp =
            await neutronChain.queryContract<TotalPowerAtHeightResponse>(
              tge.contracts.creditsVault,
              {
                total_power_at_height: {},
              },
            );
          const airdropCNTRN =
            await neutronChain.queryContract<BalanceResponse>(
              tge.contracts.credits,
              {
                balance: {
                  address: tge.contracts.airdrop,
                },
              },
            );
          const totalCNTRNSupply =
            await neutronChain.queryContract<TotalSupplyResponse>(
              tge.contracts.credits,
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
  describe('Migration lockdrop to V2', () => {
    let oldPairs;
    it('should unregister old pairs', async () => {
      {
        const res = await executeDeregisterPair(
          tge.instantiator,
          tge.contracts.astroFactory,
          IBC_ATOM_DENOM,
          NEUTRON_DENOM,
        );
        expect(res.code).toEqual(0);
      }
      {
        const res = await executeDeregisterPair(
          tge.instantiator,
          tge.contracts.astroFactory,
          IBC_USDC_DENOM,
          NEUTRON_DENOM,
        );
        expect(res.code).toEqual(0);
      }
    });
    it('should register CL pairs', async () => {
      {
        const res = await executeFactoryCreatePair(
          tge.instantiator,
          tge.contracts.astroFactory,
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
              price_scale: '1',
              ma_half_time: 600,
              track_asset_balances: null,
            }),
          ).toString('base64'),
        );
        expect(res.code).toEqual(0);
      }
      {
        const res = await executeFactoryCreatePair(
          tge.instantiator,
          tge.contracts.astroFactory,
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
              price_scale: '1',
              ma_half_time: 600,
              track_asset_balances: null,
            }),
          ).toString('base64'),
        );
        expect(res.code).toEqual(0);
      }
    });
    it('should set pairs data', async () => {
      const pairs = (
        await queryFactoryPairs(tge.chain, tge.contracts.astroFactory)
      ).pairs;
      expect(pairs).toHaveLength(2);
      oldPairs = _.cloneDeep(tge.pairs);
      tge.pairs = {
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
    it('should have zero liquidity on CL pools', async () => {
      const usdcBalance = await neutronChain.queryContract<BalanceResponse>(
        tge.pairs.usdc_ntrn.liquidity,
        {
          balance: {
            address: tge.contracts.astroGenerator,
          },
        },
      );
      expect(usdcBalance.balance).toEqual('0');
      const atomBalance = await neutronChain.queryContract<BalanceResponse>(
        tge.pairs.atom_ntrn.liquidity,
        {
          balance: {
            address: tge.contracts.astroGenerator,
          },
        },
      );
      expect(atomBalance.balance).toEqual('0');
    });
    it('should migrate to V2', async () => {
      const res = await cmInstantiator.migrateContract(
        tge.contracts.lockdrop,
        tge.codeIds.TGE_LOCKDROP_V2,
        {
          new_atom_token: tge.pairs.atom_ntrn.liquidity,
          new_usdc_token: tge.pairs.usdc_ntrn.liquidity,
          max_slippage: '0.1',
        },
      );
      expect(res.code).toEqual(0);
    });
    it('should not allow to query user lockup at height', async () => {
      await expect(
        cmInstantiator.chain.queryContract(tge.contracts.lockdrop, {
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
        cmInstantiator.chain.queryContract(tge.contracts.lockdrop, {
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
          tge.contracts.lockdrop,
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
          tge.contracts.lockdrop,
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
          tge.contracts.lockdrop,
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
            amount: [{ denom: tge.chain.denom, amount: '20000' }],
          },
        ),
      ).rejects.toThrowError(/Slippage tolerance is too high/);
    });
    it('should migrate liquidity', async () => {
      await cmInstantiator.executeContract(
        tge.contracts.lockdrop,
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
          amount: [{ denom: tge.chain.denom, amount: '20000' }],
        },
      );
    });
    it('should not migrate users with limit 0', async () => {
      await expect(
        cmInstantiator.executeContract(
          tge.contracts.lockdrop,
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
            amount: [{ denom: tge.chain.denom, amount: '20000' }],
          },
        ),
      ).rejects.toThrowError(/Limit cannot be zero/);
    });
    it('should migrate users', async () => {
      await cmInstantiator.executeContract(
        tge.contracts.lockdrop,
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
          amount: [{ denom: tge.chain.denom, amount: '20000' }],
        },
      );
    });
    it('should migrate users', async () => {
      await cmInstantiator.executeContract(
        tge.contracts.lockdrop,
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
          amount: [{ denom: tge.chain.denom, amount: '20000' }],
        },
      );
    });
    it('should finish migrate users', async () => {
      await cmInstantiator.executeContract(
        tge.contracts.lockdrop,
        JSON.stringify({
          migrate_from_xyk_to_cl: {
            migrate_users: {},
          },
        }),
      );
    });
    it('should allow to query total lockup at height', async () => {
      const res = await cmInstantiator.chain.queryContract(
        tge.contracts.lockdrop,
        {
          query_lockup_total_at_height: {
            pool_type: 'ATOM',
            height: 1,
          },
        },
      );
      expect(res).toEqual('0');
    });
    it('should have non-zero liquidity on CL pools', async () => {
      const usdcBalance = await neutronChain.queryContract<BalanceResponse>(
        tge.pairs.usdc_ntrn.liquidity,
        {
          balance: {
            address: tge.contracts.astroGenerator,
          },
        },
      );
      expect(usdcBalance.balance).not.toEqual('0');
      const atomBalance = await neutronChain.queryContract<BalanceResponse>(
        tge.pairs.atom_ntrn.liquidity,
        {
          balance: {
            address: tge.contracts.astroGenerator,
          },
        },
      );
      expect(atomBalance.balance).not.toEqual('0');
    });
    it('should have zero liquidity on XYK pools', async () => {
      const usdcBalance = await neutronChain.queryContract<BalanceResponse>(
        oldPairs.usdc_ntrn.liquidity,
        {
          balance: {
            address: tge.contracts.astroGenerator,
          },
        },
      );
      expect(usdcBalance.balance).toEqual('0');
      const atomBalance = await neutronChain.queryContract<BalanceResponse>(
        oldPairs.atom_ntrn.liquidity,
        {
          balance: {
            address: tge.contracts.astroGenerator,
          },
        },
      );
      expect(atomBalance.balance).toEqual('0');
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
            tge.contracts.lockdrop,
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
          tge.times.lockdropInit +
            tge.times.lockdropDepositDuration +
            tge.times.lockdropWithdrawalDuration +
            1,
        );
      });

      it('for cmInstantiator without withdraw', async () => {
        const rewardsStateBeforeClaim = await tge.generatorRewardsState(
          cmInstantiator.wallet.address.toString(),
        );

        const res = await cmInstantiator.executeContract(
          tge.contracts.lockdrop,
          JSON.stringify({
            claim_rewards_and_optionally_unlock: {
              pool_type: 'USDC',
              duration: 1,
              withdraw_lp_stake: false,
            },
          }),
        );
        expect(res.code).toEqual(0);

        const rewardsStateAfterClaim = await tge.generatorRewardsState(
          cmInstantiator.wallet.address.toString(),
        );

        expect(
          rewardsStateAfterClaim.balanceNtrn +
            FEE_SIZE -
            rewardsStateBeforeClaim.balanceNtrn,
        ).toEqual(195900); // lockdrop rewards share for the user

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
        expect(astroBalanceDiff).toBeGreaterThanOrEqual(
          expectedGeneratorRewards,
        );
        expect(astroBalanceDiff).toBeLessThan(
          expectedGeneratorRewards + tge.generatorRewardsPerBlock,
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
              tge.contracts.lockdrop,
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
              tge.contracts.lockdrop,
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
          const rewardsStateBeforeClaim = await tge.generatorRewardsState(
            tgeWallets[v].wallet.address.toString(),
          );

          const res = await tgeWallets[v].executeContract(
            tge.contracts.lockdrop,
            JSON.stringify({
              claim_rewards_and_optionally_unlock: {
                pool_type: 'USDC',
                duration: 1,
                withdraw_lp_stake: false,
              },
            }),
          );
          expect(res.code).toEqual(0);

          const rewardsStateAfterClaim = await tge.generatorRewardsState(
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
            expectedGeneratorRewards + tge.generatorRewardsPerBlock,
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
          const rewardsStateBeforeClaim = await tge.generatorRewardsState(
            tgeWallets[v].wallet.address.toString(),
          );

          let res = await tgeWallets[v].executeContract(
            tge.contracts.lockdrop,
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
            tge.contracts.lockdrop,
            JSON.stringify({
              claim_rewards_and_optionally_unlock: {
                pool_type: 'ATOM',
                duration: 1,
                withdraw_lp_stake: true,
              },
            }),
          );
          expect(res.code).toEqual(0);

          const rewardsStateAfterClaim = await tge.generatorRewardsState(
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
            expectedGeneratorRewards + 2 * tge.generatorRewardsPerBlock,
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
