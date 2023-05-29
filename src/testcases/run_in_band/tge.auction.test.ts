import {
  CosmosWrapper,
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { Asset, TotalPowerAtHeightResponse } from '../../helpers/types';
import { getHeight } from '../../helpers/wait';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import {
  executeAuctionSetTokenInfo,
  executeCreditsVaultUpdateConfig,
  executeLockdropSetTokenInfo,
  executeLockdropVaultUpdateConfig,
  executeVestingLpSetVestingToken,
  executeVestingLpVaultUpdateConfig,
  getTimestamp,
  queryCreditsVaultConfig,
  queryLockdropVaultConfig,
  queryVestingLpVaultConfig,
  Tge,
} from '../../helpers/tge';
import { Dao, DaoMember, getDaoContracts } from '../../helpers/dao';

const MIN_LIQUDITY = 1000;
const ATOM_DEPOSIT_AMOUNT = 10000;
const USDC_DEPOSIT_AMOUNT = 90000;
const NTRN_AMOUNT = 200000;
const ATOM_RATE = 10000000;
const USDC_RATE = 1000000;
const NTRN_INCENTIVIZE_AMOUNT = 10000;
const feeSize = 10_000;

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

type TotalSupplyResponse = {
  total_supply: string;
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

describe('Neutron / TGE / Auction', () => {
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
          amount: '100',
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
    it('should not be able to set token info by stranger', async () => {
      await expect(
        executeVestingLpSetVestingToken(
          cmStranger,
          tge.contracts.vestingAtomLp,
          tge.pairs.usdc_ntrn.liquidity,
        ),
      ).rejects.toThrowError(/Unauthorized/);
    });
    it('should deploy auction', async () => {
      tge.times.auctionInit = getTimestamp(80);
      await tge.deployAuction();
    });
    it('should not be able to set denoms by stranger', async () => {
      await expect(
        executeAuctionSetTokenInfo(
          cmStranger,
          tge.contracts.auction,
          IBC_ATOM_DENOM,
          IBC_USDC_DENOM,
        ),
      ).rejects.toThrowError(/Only owner and denom_manager can update denoms/);
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
    it('should not be able to set token info by stranger', async () => {
      await expect(
        executeLockdropSetTokenInfo(
          cmStranger,
          tge.contracts.lockdrop,
          tge.pairs.atom_ntrn.liquidity,
          tge.pairs.usdc_ntrn.liquidity,
          tge.contracts.astroGenerator,
        ),
      ).rejects.toThrowError(/Unauthorized/);
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
          tge.airdropAccounts.find(({ address }) => {
            if (address == tgeWallets[v].wallet.address.toString()) {
              return true;
            } else {
              return false;
            }
          })?.amount || '0';
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
      it('should not allow deposit before init', async () => {
        await expect(
          cmInstantiator.executeContract(
            tge.contracts.auction,
            JSON.stringify({
              deposit: {},
            }),
            [
              {
                amount: '10000',
                denom: IBC_ATOM_DENOM,
              },
            ],
          ),
        ).rejects.toThrow(/Deposit window closed/);
      });
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
      it('should be able to witdraw', async () => {
        const atomBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tge.contracts.auction,
          JSON.stringify({
            withdraw: {
              amount_usdc: '5000',
              amount_atom: '5000',
            },
          }),
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
        const usdcBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        atomBalance -= 5000;
        usdcBalance -= 5000;
        expect(info.atom_deposited).toEqual('5000');
        expect(info.usdc_deposited).toEqual('85000');
        expect(atomBalanceAfter).toEqual(atomBalanceBefore + 5000);
        expect(usdcBalanceAfter).toEqual(usdcBalanceBefore + 5000);

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
              withdraw: {
                amount_usdc: (USDC_DEPOSIT_AMOUNT / 2).toString(),
                amount_atom: (ATOM_DEPOSIT_AMOUNT / 2).toString(),
              },
            }),
          );
          expect(res2.code).toEqual(0);
          atomBalance -= ATOM_DEPOSIT_AMOUNT / 2;
          usdcBalance -= USDC_DEPOSIT_AMOUNT / 2;
        }
      });
    });
    describe('Phase 2', () => {
      it('should not allow deposit when deposit window is closed', async () => {
        await waitTill(
          tge.times.auctionInit + tge.times.auctionDepositWindow + 5,
        );
        await expect(
          cmInstantiator.executeContract(
            tge.contracts.auction,
            JSON.stringify({
              deposit: {},
            }),
            [
              {
                amount: '10000',
                denom: IBC_ATOM_DENOM,
              },
            ],
          ),
        ).rejects.toThrow(/Deposit window closed/);
      });
      it('should not be able to withdraw mode than 50% of current deposit', async () => {
        await expect(
          cmInstantiator.executeContract(
            tge.contracts.auction,
            JSON.stringify({
              withdraw: {
                amount_usdc: '5000',
                amount_atom: '5000',
              },
            }),
          ),
        ).rejects.toThrow(
          /Amount exceeds maximum allowed withdrawal limit of 0.5/,
        );
      });
      it('should be able to withdraw', async () => {
        const atomBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tge.contracts.auction,
          JSON.stringify({
            withdraw: {
              amount_usdc: '1000',
              amount_atom: '1000',
            },
          }),
        );
        expect(res.code).toEqual(0);
        atomBalance -= 1000;
        usdcBalance -= 1000;
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
        const usdcBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        expect(info.atom_deposited).toEqual('4000');
        expect(info.usdc_deposited).toEqual('84000');
        expect(info.withdrawn).toEqual(true);
        expect(atomBalanceAfter).toEqual(atomBalanceBefore + 1000);
        expect(usdcBalanceAfter).toEqual(usdcBalanceBefore + 1000);
      });
      it('should not allow to withdraw more than once', async () => {
        await expect(
          cmInstantiator.executeContract(
            tge.contracts.auction,
            JSON.stringify({
              withdraw: {
                amount_usdc: '1000',
                amount_atom: '1000',
              },
            }),
          ),
        ).rejects.toThrow(/Max 1 withdrawal allowed/);
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
        it('transfer some ATOM directly to auction contract to try affect pool', async () => {
          await cmInstantiator.msgSend(tge.contracts.auction, {
            amount: '100000000',
            denom: IBC_ATOM_DENOM,
          });
        });
        it('should not be able to set pool size before withdrawal_window is closed', async () => {
          await expect(
            cmInstantiator.executeContract(
              tge.contracts.auction,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Deposit\/withdrawal windows are still open/);
        });
        it('should not be able to set pool size bc of wrong price feed data', async () => {
          await waitTill(
            tge.times.auctionInit +
              tge.times.auctionDepositWindow +
              tge.times.auctionWithdrawalWindow +
              5,
          );
          await expect(
            cmInstantiator.executeContract(
              tge.contracts.auction,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Invalid price feed data/);
        });
        it('should not be able to set pool size (no NTRN)', async () => {
          const time = (Date.now() / 1000) | 0;
          const r1 = await cmInstantiator.executeContract(
            tge.contracts.priceFeed,
            JSON.stringify({
              set_rate: {
                symbol: 'ATOM',
                rate: {
                  rate: '13891850',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r1.code).toEqual(0);
          const r2 = await cmInstantiator.executeContract(
            tge.contracts.priceFeed,
            JSON.stringify({
              set_rate: {
                symbol: 'USDT',
                rate: {
                  rate: '999950',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r2.code).toEqual(0);
          await expect(
            cmInstantiator.executeContract(
              tge.contracts.auction,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Not enough NTRN in the contract/);
        });
        it('should not be able to set pool size when price feed data is set but too old', async () => {
          await cmInstantiator.msgSend(tge.contracts.auction, {
            amount: NTRN_AMOUNT.toString(),
          });
          const time = (Date.now() / 1000 - 10000) | 0;
          const r1 = await cmInstantiator.executeContract(
            tge.contracts.priceFeed,
            JSON.stringify({
              set_rate: {
                symbol: 'ATOM',
                rate: {
                  rate: '10000000',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r1.code).toEqual(0);
          const r2 = await cmInstantiator.executeContract(
            tge.contracts.priceFeed,
            JSON.stringify({
              set_rate: {
                symbol: 'USDT',
                rate: {
                  rate: '1000000',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r2.code).toEqual(0);

          await expect(
            cmInstantiator.executeContract(
              tge.contracts.auction,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Price feed data is too old/);
        });
        it('should be able to set pool size', async () => {
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
                amount: '77',
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
          expect(parseInt(userInfo.atom_lp_locked)).toEqual(77);
          atomLpLocked += 77;
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
                amount: '50',
                asset: 'USDC',
                duration: 1,
              },
            }),
          );
          const res2 = await cmInstantiator.executeContract(
            tge.contracts.auction,
            JSON.stringify({
              lock_lp: {
                amount: '50',
                asset: 'USDC',
                duration: 2,
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
          expect(res2.code).toEqual(0);
          usdcLpLocked += 100;
          expect(parseInt(userInfo.usdc_lp_locked)).toEqual(100);
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tge.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos).toHaveLength(3);
          expect(info.lockup_infos[1]).toMatchObject({
            lp_units_locked: String(usdcLpLocked / 2),
            pool_type: 'USDC',
          });
          expect(info.lockup_infos[2]).toMatchObject({
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
        it('should not be able to lock ATOM LP tokens more than have', async () => {
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tge.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          await expect(
            cmInstantiator.executeContract(
              tge.contracts.auction,
              JSON.stringify({
                lock_lp: {
                  amount: userInfo.atom_lp_amount,
                  asset: 'ATOM',
                  duration: 1,
                },
              }),
            ),
          ).rejects.toThrow(/Not enough ATOM LP/);
        });
        it('should not be able to lock USDC LP tokens more than have', async () => {
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tge.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          await expect(
            cmInstantiator.executeContract(
              tge.contracts.auction,
              JSON.stringify({
                lock_lp: {
                  amount: userInfo.usdc_lp_amount,
                  asset: 'USDC',
                  duration: 1,
                },
              }),
            ),
          ).rejects.toThrow(/Not enough USDC LP/);
        });
        it('should be able to withdraw ATOM LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            tge.contracts.auction,
            JSON.stringify({
              withdraw_lp: {
                asset: 'ATOM',
                amount: '10',
                duration: 1,
              },
            }),
          );
          expect(res.code).toEqual(0);
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tge.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          atomLpLocked -= 10;
          expect(info.lockup_infos[0]).toMatchObject({
            lp_units_locked: '67',
            pool_type: 'ATOM',
          });
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tge.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(parseInt(userInfo.atom_lp_locked)).toEqual(67);

          for (const v of [
            'airdropAuctionLockdropVesting',
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
                withdraw_lp: {
                  amount: Math.round(
                    Number(userInfo.atom_lp_locked) / 2,
                  ).toString(),
                  asset: 'ATOM',
                  duration: 1,
                },
              }),
            );
            expect(res2.code).toEqual(0);
            atomLpLocked -= Math.round(Number(userInfo.atom_lp_locked) / 2);
          }
        });
        it('should be able to withdraw USDC LP tokens', async () => {
          let res = await cmInstantiator.executeContract(
            tge.contracts.auction,
            JSON.stringify({
              withdraw_lp: {
                asset: 'USDC',
                amount: '5',
                duration: 2,
              },
            }),
          );
          expect(res.code).toEqual(0);
          res = await cmInstantiator.executeContract(
            tge.contracts.auction,
            JSON.stringify({
              withdraw_lp: {
                asset: 'USDC',
                amount: '5',
                duration: 1,
              },
            }),
          );
          expect(res.code).toEqual(0);
          usdcLpLocked -= 10;
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tge.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos[1]).toMatchObject({
            lp_units_locked: '45',
            pool_type: 'USDC',
          });
          expect(info.lockup_infos[2]).toMatchObject({
            lp_units_locked: '45',
            pool_type: 'USDC',
          });
          expect(2 * Number(info.lockup_infos[1].ntrn_rewards)).toEqual(
            Number(info.lockup_infos[2].ntrn_rewards),
          );

          for (const v of [
            'airdropAuctionLockdropVesting',
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
                withdraw_lp: {
                  amount: Math.round(
                    Number(userInfo.usdc_lp_locked) / 2,
                  ).toString(),
                  asset: 'USDC',
                  duration: 1,
                },
              }),
            );
            expect(res2.code).toEqual(0);
            usdcLpLocked -= Math.round(Number(userInfo.usdc_lp_locked) / 2);
          }
        });
        it('should not be able to lock tokens when time is up', async () => {
          await waitTill(
            // tge.times.auctionInit +
            // tge.times.auctionDepositWindow +
            // tge.times.auctionWithdrawalWindow +
            tge.times.lockdropInit + tge.times.lockdropDepositDuration + 5,
          );
          await expect(
            cmInstantiator.executeContract(
              tge.contracts.auction,
              JSON.stringify({
                lock_lp: {
                  amount: '100',
                  asset: 'ATOM',
                  duration: 1,
                },
              }),
            ),
          ).rejects.toThrow(/Lock window is closed/);
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
          // tge.times.auctionInit +
          // tge.times.auctionDepositWindow +
          // tge.times.auctionWithdrawalWindow +
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
        // round?
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
        // NOTE: magic number - 3269
        expect(
          parseInt(vestingInfoAtom.info.schedules[0].end_point.amount),
        ).toBeCloseTo(3269, -1);
        claimAtomLP = parseInt(
          vestingInfoAtom.info.schedules[0].end_point.amount,
        );
        // NOTE: magic number - 22337
        expect(
          parseInt(vestingInfoUsdc.info.schedules[0].end_point.amount),
        ).toBeCloseTo(22337, -1);
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
    describe('vaults', () => {
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
    describe('lockdrop', () => {
      let balanceBeforeLockdrop: number;
      let balanceBeforeAirdopLockdrop: number;
      let balanceBeforeAirdropAuctionLockdropVesting: number;
      let AirdropAuctionLockdropVestingUserInfo: LockDropInfoResponse;
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

        AirdropAuctionLockdropVestingUserInfo =
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

      it('should get lockdrop rewards', async () => {
        await waitTill(
          tge.times.lockdropInit +
            tge.times.lockdropDepositDuration +
            tge.times.lockdropWithdrawalDuration +
            1,
        );
        const balanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          NEUTRON_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tge.contracts.lockdrop,
          JSON.stringify({
            claim_rewards_and_optionally_unlock: {
              pool_type: 'USDC',
              duration: 2,
              withdraw_lp_stake: false,
            },
          }),
        );
        expect(res.code).toEqual(0);
        const balanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          NEUTRON_DENOM,
        );
        // we need to compensait paid fees
        expect(balanceAfter + feeSize).toBeGreaterThan(balanceBefore);

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

        for (const v of [
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
        ]) {
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
        }

        for (const v of [
          'airdropAuctionLockdrop',
          'airdropAuctionLockdropVesting',
          'auctionLockdrop',
          'auctionLockdropVesting',
        ]) {
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
        }
      });
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
        const feeCompensation = 3 * feeSize;
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
          AirdropAuctionLockdropVestingUserInfo.total_ntrn_rewards,
        );
        const airdropSize = 100;
        const feeCompensation = 3 * feeSize;
        expect(
          expectedLockdropReward +
            balanceBeforeAirdropAuctionLockdropVesting +
            airdropSize,
        ).toEqual(feeCompensation + balanceAfterAirdropAuctionLockdropVesting);
      });
    });
  });

  describe('Vaults', () => {
    test('Get lockdrop vault config', async () => {
      expect(
        await queryLockdropVaultConfig(
          neutronChain,
          tge.contracts.lockdropVault,
        ),
      ).toMatchObject({
        name: tge.lockdropVaultName,
        description: tge.lockdropVaultDescription,
        lockdrop_contract: tge.contracts.lockdrop,
        oracle_usdc_contract: tge.contracts.oracleUsdc,
        oracle_atom_contract: tge.contracts.oracleAtom,
        owner: cmInstantiator.wallet.address.toString(),
      });
    });

    test('Get vesting LP vault config', async () => {
      expect(
        await queryVestingLpVaultConfig(
          neutronChain,
          tge.contracts.vestingLpVault,
        ),
      ).toMatchObject({
        name: tge.vestingLpVaultName,
        description: tge.vestingLpVaultDescription,
        atom_vesting_lp_contract: tge.contracts.vestingAtomLp,
        atom_oracle_contract: tge.contracts.oracleAtom,
        usdc_vesting_lp_contract: tge.contracts.vestingUsdcLp,
        usdc_oracle_contract: tge.contracts.oracleUsdc,
        owner: tge.instantiator.wallet.address.toString(),
      });
    });

    test('Get credits vault config', async () => {
      expect(
        await queryCreditsVaultConfig(neutronChain, tge.contracts.creditsVault),
      ).toMatchObject({
        name: tge.creditsVaultName,
        description: tge.creditsVaultDescription,
        credits_contract_address: tge.contracts.credits,
        owner: tge.instantiator.wallet.address.toString(),
        airdrop_contract_address: tge.contracts.airdrop,
      });
    });

    test('Update lockdrop vault config: permission denied', async () => {
      await expect(
        executeLockdropVaultUpdateConfig(
          cmStranger,
          tge.contracts.lockdropVault,
          cmStranger.wallet.address.toString(),
          tge.contracts.lockdrop,
          tge.contracts.oracleUsdc,
          tge.contracts.oracleAtom,
          'name',
          'description',
        ),
      ).rejects.toThrow(/Unauthorized/);

      expect(
        await queryLockdropVaultConfig(
          neutronChain,
          tge.contracts.lockdropVault,
        ),
      ).toMatchObject({
        name: tge.lockdropVaultName,
        description: tge.lockdropVaultDescription,
        lockdrop_contract: tge.contracts.lockdrop,
        oracle_usdc_contract: tge.contracts.oracleUsdc,
        oracle_atom_contract: tge.contracts.oracleAtom,
        owner: cmInstantiator.wallet.address.toString(),
      });
    });

    test('Update vesting LP vault config: permission denied', async () => {
      await expect(
        executeVestingLpVaultUpdateConfig(
          cmStranger,
          tge.contracts.vestingLpVault,
          cmStranger.wallet.address.toString(),
          tge.contracts.vestingUsdcLp,
          tge.contracts.oracleUsdc,
          tge.contracts.vestingAtomLp,
          tge.contracts.oracleAtom,
          'name',
          'description',
        ),
      ).rejects.toThrow(/Unauthorized/);

      expect(
        await queryVestingLpVaultConfig(
          neutronChain,
          tge.contracts.vestingLpVault,
        ),
      ).toMatchObject({
        name: tge.vestingLpVaultName,
        description: tge.vestingLpVaultDescription,
        atom_vesting_lp_contract: tge.contracts.vestingAtomLp,
        atom_oracle_contract: tge.contracts.oracleAtom,
        usdc_vesting_lp_contract: tge.contracts.vestingUsdcLp,
        usdc_oracle_contract: tge.contracts.oracleUsdc,
        owner: tge.instantiator.wallet.address.toString(),
      });
    });

    test('Update credits vault config: permission denied', async () => {
      await expect(
        executeCreditsVaultUpdateConfig(
          cmStranger,
          tge.contracts.creditsVault,
          tge.contracts.auction,
          cmStranger.wallet.address.toString(),
          'name',
          'description',
        ),
      ).rejects.toThrow(/Unauthorized/);

      expect(
        await queryCreditsVaultConfig(neutronChain, tge.contracts.creditsVault),
      ).toMatchObject({
        name: tge.creditsVaultName,
        description: tge.creditsVaultDescription,
        credits_contract_address: tge.contracts.credits,
        owner: tge.instantiator.wallet.address.toString(),
        airdrop_contract_address: tge.contracts.airdrop,
      });
    });

    test('Bonding and Unbonding', async () => {
      for (const vault of [
        tge.contracts.creditsVault,
        tge.contracts.vestingLpVault,
        tge.contracts.lockdropVault,
      ]) {
        await expect(
          cmStranger.executeContract(
            vault,
            JSON.stringify({
              bond: {},
            }),
            [{ denom: NEUTRON_DENOM, amount: '1000' }],
          ),
        ).rejects.toThrow(/Bonding is not available for this contract/);
        await expect(
          cmStranger.executeContract(
            vault,
            JSON.stringify({
              unbond: {
                amount: '1000',
              },
            }),
          ),
        ).rejects.toThrow(
          /Direct unbonding is not available for this contract/,
        );
      }
    });

    test('Change lockdrop vault owner to stranger', async () => {
      const res = await executeLockdropVaultUpdateConfig(
        cmInstantiator,
        tge.contracts.lockdropVault,
        cmStranger.wallet.address.toString(),
        tge.contracts.lockdrop,
        tge.contracts.oracleUsdc,
        tge.contracts.oracleAtom,
        tge.lockdropVaultName,
        tge.lockdropVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryLockdropVaultConfig(
          neutronChain,
          tge.contracts.lockdropVault,
        ),
      ).toMatchObject({
        name: tge.lockdropVaultName,
        description: tge.lockdropVaultDescription,
        lockdrop_contract: tge.contracts.lockdrop,
        oracle_usdc_contract: tge.contracts.oracleUsdc,
        oracle_atom_contract: tge.contracts.oracleAtom,
        owner: cmStranger.wallet.address.toString(),
      });
    });

    test('Update lockdrop vault config by new owner', async () => {
      tge.lockdropVaultName = 'New lockdrop name';
      tge.lockdropVaultDescription = 'New lockdrop description';

      const res = await executeLockdropVaultUpdateConfig(
        cmStranger,
        tge.contracts.lockdropVault,
        cmStranger.wallet.address.toString(),
        tge.contracts.lockdrop,
        tge.contracts.oracleUsdc,
        tge.contracts.oracleAtom,
        tge.lockdropVaultName,
        tge.lockdropVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryLockdropVaultConfig(
          neutronChain,
          tge.contracts.lockdropVault,
        ),
      ).toMatchObject({
        name: tge.lockdropVaultName,
        description: tge.lockdropVaultDescription,
        lockdrop_contract: tge.contracts.lockdrop,
        oracle_usdc_contract: tge.contracts.oracleUsdc,
        oracle_atom_contract: tge.contracts.oracleAtom,
        owner: cmStranger.wallet.address.toString(),
      });
    });

    test('Change vesting LP vault owner to stranger', async () => {
      const res = await executeVestingLpVaultUpdateConfig(
        cmInstantiator,
        tge.contracts.vestingLpVault,
        cmStranger.wallet.address.toString(),
        tge.contracts.vestingAtomLp,
        tge.contracts.oracleAtom,
        tge.contracts.vestingUsdcLp,
        tge.contracts.oracleUsdc,
        tge.vestingLpVaultName,
        tge.vestingLpVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryVestingLpVaultConfig(
          neutronChain,
          tge.contracts.vestingLpVault,
        ),
      ).toMatchObject({
        name: tge.vestingLpVaultName,
        description: tge.vestingLpVaultDescription,
        atom_vesting_lp_contract: tge.contracts.vestingAtomLp,
        atom_oracle_contract: tge.contracts.oracleAtom,
        usdc_vesting_lp_contract: tge.contracts.vestingUsdcLp,
        usdc_oracle_contract: tge.contracts.oracleUsdc,
        owner: cmStranger.wallet.address.toString(),
      });
    });

    test('Update vesting LP vault config by new owner', async () => {
      tge.vestingLpVaultName = 'New vesting LP name';
      tge.vestingLpVaultDescription = 'New vesting LP description';
      const res = await executeVestingLpVaultUpdateConfig(
        cmStranger,
        tge.contracts.vestingLpVault,
        cmStranger.wallet.address.toString(),
        tge.contracts.vestingAtomLp,
        tge.contracts.oracleAtom,
        tge.contracts.vestingUsdcLp,
        tge.contracts.oracleUsdc,
        tge.vestingLpVaultName,
        tge.vestingLpVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryVestingLpVaultConfig(
          neutronChain,
          tge.contracts.vestingLpVault,
        ),
      ).toMatchObject({
        name: tge.vestingLpVaultName,
        description: tge.vestingLpVaultDescription,
        atom_vesting_lp_contract: tge.contracts.vestingAtomLp,
        atom_oracle_contract: tge.contracts.oracleAtom,
        usdc_vesting_lp_contract: tge.contracts.vestingUsdcLp,
        usdc_oracle_contract: tge.contracts.oracleUsdc,
        owner: cmStranger.wallet.address.toString(),
      });
    });

    test('Change credits vault owner to stranger', async () => {
      const res = await executeCreditsVaultUpdateConfig(
        cmInstantiator,
        tge.contracts.creditsVault,
        null,
        cmStranger.wallet.address.toString(),
        null,
        null,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryCreditsVaultConfig(neutronChain, tge.contracts.creditsVault),
      ).toMatchObject({
        name: tge.creditsVaultName,
        description: tge.creditsVaultDescription,
        credits_contract_address: tge.contracts.credits,
        owner: cmStranger.wallet.address.toString(),
        airdrop_contract_address: tge.contracts.airdrop,
      });
    });

    test('Update credits vault config by new owner', async () => {
      tge.creditsVaultName = 'New credits name';
      tge.creditsVaultDescription = 'New credits description';
      const res = await executeCreditsVaultUpdateConfig(
        cmStranger,
        tge.contracts.creditsVault,
        null,
        null,
        tge.creditsVaultName,
        tge.creditsVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryCreditsVaultConfig(neutronChain, tge.contracts.creditsVault),
      ).toMatchObject({
        name: tge.creditsVaultName,
        description: tge.creditsVaultDescription,
        credits_contract_address: tge.contracts.credits,
        owner: cmStranger.wallet.address.toString(),
        airdrop_contract_address: tge.contracts.airdrop,
      });
    });
  });
});
