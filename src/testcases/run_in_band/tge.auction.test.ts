import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from './../../helpers/cosmos_testnet';
import {
  executeAuctionSetTokenInfo,
  executeCreditsVaultUpdateConfig,
  executeLockdropSetTokenInfo,
  executeLockdropVaultUpdateConfig,
  executeVestingLpSetVestingToken,
  executeVestingLpVaultUpdateConfig,
  getTimestamp,
  LockdropLockUpInfoResponse,
  queryCreditsVaultConfig,
  queryLockdropVaultConfig,
  queryVestingLpVaultConfig,
  Tge,
  VestingAccountResponse,
} from '@neutron-org/neutronjsplus/dist/tge';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import {
  Asset,
  TotalPowerAtHeightResponse,
} from '@neutron-org/neutronjsplus/dist/types';
import { IBC_ATOM_DENOM, IBC_USDC_DENOM } from '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  createWalletWrapper,
} from '@neutron-org/neutronjsplus/dist/wallet_wrapper';

const config = require('../../config.json');

const MIN_LIQUDITY = 1000;
const ATOM_DEPOSIT_AMOUNT = 10000;
const USDC_DEPOSIT_AMOUNT = 90000;
const NTRN_AMOUNT = 200000;
const ATOM_RATE = 10000000;
const USDC_RATE = 1000000;
const NTRN_INCENTIVIZE_AMOUNT = 10000;
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
  let tgeMain: Tge;
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
  let daoMain: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    reserveAddress = testState.wallets.qaNeutronThree.qa.address;
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    cmInstantiator = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.qa,
    );
    cmTokenManager = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.qa,
    );
    cmStranger = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFive.qa,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    daoMain = new Dao(neutronChain, daoContracts);
    daoMember1 = new DaoMember(cmInstantiator, daoMain);
    await daoMember1.bondFunds('10000');
    tgeMain = new Tge(
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
      tgeWallets[v] = await createWalletWrapper(
        neutronChain,
        (
          await testState.createQaWallet(
            'neutron',
            testState.wallets.neutron.demo1,
            NEUTRON_DENOM,
            testState.rpc1,
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
        ).qa,
      );
    }
  });

  describe('Deploy', () => {
    it('should deploy contracts for auction', async () => {
      tgeMain.airdropAccounts = [
        {
          address: tgeWallets['airdropAuctionLockdrop'].wallet.address,
          amount: '1000000',
        },
        {
          address: tgeWallets['airdropOnly'].wallet.address,
          amount: '1000000',
        },
        {
          address: tgeWallets['airdropAuctionLockdropVesting'].wallet.address,
          amount: TINY_AIRDROP_AMOUNT.toString(),
        },
        {
          address: tgeWallets['airdropAuctionVesting'].wallet.address,
          amount: '1000000',
        },
      ];
      tgeMain.times.airdropStart = getTimestamp(0);
      tgeMain.times.airdropVestingStart = getTimestamp(300);
      await tgeMain.deployPreAuction();
    });
    it('should not be able to set token info by stranger', async () => {
      await expect(
        executeVestingLpSetVestingToken(
          cmStranger,
          tgeMain.contracts.vestingAtomLp,
          tgeMain.pairs.usdc_ntrn.liquidity,
        ),
      ).rejects.toThrowError(/Unauthorized/);
    });
    it('should deploy auction', async () => {
      tgeMain.times.auctionInit = getTimestamp(80);
      await tgeMain.deployAuction();
    });
    it('should not be able to set denoms by stranger', async () => {
      await expect(
        executeAuctionSetTokenInfo(
          cmStranger,
          tgeMain.contracts.auction,
          IBC_ATOM_DENOM,
          IBC_USDC_DENOM,
        ),
      ).rejects.toThrowError(/Only owner and denom_manager can update denoms/);
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
    it('should not be able to set token info by stranger', async () => {
      await expect(
        executeLockdropSetTokenInfo(
          cmStranger,
          tgeMain.contracts.lockdrop,
          tgeMain.pairs.atom_ntrn.liquidity,
          tgeMain.pairs.usdc_ntrn.liquidity,
          tgeMain.contracts.astroGenerator,
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
        const address = tgeWallets[v].wallet.address;
        const amount =
          tgeMain.airdropAccounts.find(
            ({ address }) => address == tgeWallets[v].wallet.address,
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
          payload,
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
            tgeMain.contracts.auction,
            {
              deposit: {},
            },
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
        await waitTill(tgeMain.times.auctionInit + 3);
        const atomBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
          IBC_ATOM_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.auction,
          {
            deposit: {},
          },
          [
            {
              amount: ATOM_DEPOSIT_AMOUNT.toString(),
              denom: IBC_ATOM_DENOM,
            },
          ],
        );
        expect(res.code).toEqual(0);
        const info = await neutronChain.queryContract<UserInfoResponse>(
          tgeMain.contracts.auction,
          {
            user_info: {
              address: cmInstantiator.wallet.address,
            },
          },
        );
        const atomBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
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
            tgeMain.contracts.auction,
            {
              deposit: {},
            },
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
          cmInstantiator.wallet.address,
          IBC_USDC_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.auction,
          {
            deposit: {},
          },
          [
            {
              amount: USDC_DEPOSIT_AMOUNT.toString(),
              denom: IBC_USDC_DENOM,
            },
          ],
        );
        expect(res.code).toEqual(0);
        const info = await neutronChain.queryContract<UserInfoResponse>(
          tgeMain.contracts.auction,
          {
            user_info: {
              address: cmInstantiator.wallet.address,
            },
          },
        );
        const usdcBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
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
            tgeMain.contracts.auction,
            {
              deposit: {},
            },
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
          cmInstantiator.wallet.address,
          IBC_ATOM_DENOM,
        );
        const usdcBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
          IBC_USDC_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.auction,
          {
            withdraw: {
              amount_usdc: '5000',
              amount_atom: '5000',
            },
          },
        );
        expect(res.code).toEqual(0);
        const info = await neutronChain.queryContract<UserInfoResponse>(
          tgeMain.contracts.auction,
          {
            user_info: {
              address: cmInstantiator.wallet.address,
            },
          },
        );
        const atomBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
          IBC_ATOM_DENOM,
        );
        const usdcBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
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
            tgeMain.contracts.auction,
            {
              withdraw: {
                amount_usdc: (USDC_DEPOSIT_AMOUNT / 2).toString(),
                amount_atom: (ATOM_DEPOSIT_AMOUNT / 2).toString(),
              },
            },
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
          tgeMain.times.auctionInit + tgeMain.times.auctionDepositWindow + 5,
        );
        await expect(
          cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            {
              deposit: {},
            },
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
          cmInstantiator.executeContract(tgeMain.contracts.auction, {
            withdraw: {
              amount_usdc: '5000',
              amount_atom: '5000',
            },
          }),
        ).rejects.toThrow(
          /Amount exceeds maximum allowed withdrawal limit of 0.5/,
        );
      });
      it('should be able to withdraw', async () => {
        const atomBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
          IBC_ATOM_DENOM,
        );
        const usdcBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
          IBC_USDC_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.auction,
          {
            withdraw: {
              amount_usdc: '1000',
              amount_atom: '1000',
            },
          },
        );
        expect(res.code).toEqual(0);
        atomBalance -= 1000;
        usdcBalance -= 1000;
        const info = await neutronChain.queryContract<UserInfoResponse>(
          tgeMain.contracts.auction,
          {
            user_info: {
              address: cmInstantiator.wallet.address,
            },
          },
        );
        const atomBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
          IBC_ATOM_DENOM,
        );
        const usdcBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address,
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
          cmInstantiator.executeContract(tgeMain.contracts.auction, {
            withdraw: {
              amount_usdc: '1000',
              amount_atom: '1000',
            },
          }),
        ).rejects.toThrow(/Max 1 withdrawal allowed/);
      });
    });
    describe('Phase 3', () => {
      describe('intentivizing lockdrop', () => {
        it('should incentivize lockdrop', async () => {
          const res = await cmInstantiator.executeContract(
            tgeMain.contracts.lockdrop,
            {
              increase_ntrn_incentives: {},
            },
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
          await cmInstantiator.msgSend(tgeMain.contracts.auction, {
            amount: '100000000',
            denom: IBC_ATOM_DENOM,
          });
        });
        it('should not be able to set pool size before withdrawal_window is closed', async () => {
          await expect(
            cmInstantiator.executeContract(tgeMain.contracts.auction, {
              set_pool_size: {},
            }),
          ).rejects.toThrow(/Deposit\/withdrawal windows are still open/);
        });
        it('should not be able to set pool size bc of wrong price feed data', async () => {
          await waitTill(
            tgeMain.times.auctionInit +
              tgeMain.times.auctionDepositWindow +
              tgeMain.times.auctionWithdrawalWindow +
              5,
          );
          await expect(
            cmInstantiator.executeContract(tgeMain.contracts.auction, {
              set_pool_size: {},
            }),
          ).rejects.toThrow(/Invalid price feed data/);
        });
        it('should not be able to set pool size (no NTRN)', async () => {
          const time = (Date.now() / 1000) | 0;
          const r1 = await cmInstantiator.executeContract(
            tgeMain.contracts.priceFeed,
            {
              set_rate: {
                symbol: 'ATOM',
                rate: {
                  rate: '13891850',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            },
          );
          expect(r1.code).toEqual(0);
          const r2 = await cmInstantiator.executeContract(
            tgeMain.contracts.priceFeed,
            {
              set_rate: {
                symbol: 'USDT',
                rate: {
                  rate: '999950',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            },
          );
          expect(r2.code).toEqual(0);
          await expect(
            cmInstantiator.executeContract(tgeMain.contracts.auction, {
              set_pool_size: {},
            }),
          ).rejects.toThrow(/Not enough NTRN in the contract/);
        });
        it('should not be able to set pool size when price feed data is set but too old', async () => {
          await cmInstantiator.msgSend(tgeMain.contracts.auction, {
            amount: NTRN_AMOUNT.toString(),
          });
          const time = (Date.now() / 1000 - 10000) | 0;
          const r1 = await cmInstantiator.executeContract(
            tgeMain.contracts.priceFeed,
            {
              set_rate: {
                symbol: 'ATOM',
                rate: {
                  rate: '10000000',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            },
          );
          expect(r1.code).toEqual(0);
          const r2 = await cmInstantiator.executeContract(
            tgeMain.contracts.priceFeed,
            {
              set_rate: {
                symbol: 'USDT',
                rate: {
                  rate: '1000000',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            },
          );
          expect(r2.code).toEqual(0);

          await expect(
            cmInstantiator.executeContract(tgeMain.contracts.auction, {
              set_pool_size: {},
            }),
          ).rejects.toThrow(/Price feed data is too old/);
        });
        it('should be able to set pool size', async () => {
          const time = (Date.now() / 1000) | 0;
          const r1 = await cmTokenManager.executeContract(
            tgeMain.contracts.priceFeed,
            {
              set_rate: {
                symbol: 'ATOM',
                rate: {
                  rate: ATOM_RATE.toString(),
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            },
          );
          expect(r1.code).toEqual(0);
          const r2 = await cmTokenManager.executeContract(
            tgeMain.contracts.priceFeed,
            {
              set_rate: {
                symbol: 'USDT',
                rate: {
                  rate: USDC_RATE.toString(),
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            },
          );
          expect(r2.code).toEqual(0);

          const res = await cmTokenManager.executeContract(
            tgeMain.contracts.auction,
            {
              set_pool_size: {},
            },
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
            cmInstantiator.executeContract(tgeMain.contracts.auction, {
              set_pool_size: {},
            }),
          ).rejects.toThrow(/Pool size has already been set/);
        });
      });
      describe('lock_lp', () => {
        it('should be able to lock ATOM LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            {
              lock_lp: {
                amount: '77',
                asset: 'ATOM',
                duration: 1,
              },
            },
          );
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tgeMain.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address,
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(parseInt(userInfo.atom_lp_locked)).toEqual(77);
          atomLpLocked += 77;
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address,
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
              tgeMain.contracts.auction,
              {
                user_info: {
                  address: tgeWallets[v].wallet.address,
                },
              },
            );
            const res2 = await tgeWallets[v].executeContract(
              tgeMain.contracts.auction,
              {
                lock_lp: {
                  amount: userInfo.atom_lp_amount,
                  asset: 'ATOM',
                  duration: 1,
                },
              },
            );
            expect(res2.code).toEqual(0);
            atomLpLocked += Number(userInfo.atom_lp_amount);
          }
        });
        it('should be able to lock USDC LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            {
              lock_lp: {
                amount: '50',
                asset: 'USDC',
                duration: 1,
              },
            },
          );
          const res2 = await cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            {
              lock_lp: {
                amount: '50',
                asset: 'USDC',
                duration: 2,
              },
            },
          );
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tgeMain.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address,
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(res2.code).toEqual(0);
          usdcLpLocked += 100;
          expect(parseInt(userInfo.usdc_lp_locked)).toEqual(100);
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address,
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
              tgeMain.contracts.auction,
              {
                user_info: {
                  address: tgeWallets[v].wallet.address,
                },
              },
            );
            const res2 = await tgeWallets[v].executeContract(
              tgeMain.contracts.auction,
              {
                lock_lp: {
                  amount: userInfo.usdc_lp_amount,
                  asset: 'USDC',
                  duration: 1,
                },
              },
            );
            expect(res2.code).toEqual(0);
            usdcLpLocked += Number(userInfo.usdc_lp_amount);
          }
        });
        it('should not be able to lock ATOM LP tokens more than have', async () => {
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tgeMain.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address,
              },
            },
          );
          await expect(
            cmInstantiator.executeContract(tgeMain.contracts.auction, {
              lock_lp: {
                amount: userInfo.atom_lp_amount,
                asset: 'ATOM',
                duration: 1,
              },
            }),
          ).rejects.toThrow(/Not enough ATOM LP/);
        });
        it('should not be able to lock USDC LP tokens more than have', async () => {
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tgeMain.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address,
              },
            },
          );
          await expect(
            cmInstantiator.executeContract(tgeMain.contracts.auction, {
              lock_lp: {
                amount: userInfo.usdc_lp_amount,
                asset: 'USDC',
                duration: 1,
              },
            }),
          ).rejects.toThrow(/Not enough USDC LP/);
        });
        it('should be able to withdraw ATOM LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            {
              withdraw_lp: {
                asset: 'ATOM',
                amount: '10',
                duration: 1,
              },
            },
          );
          expect(res.code).toEqual(0);
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address,
              },
            },
          );
          atomLpLocked -= 10;
          expect(info.lockup_infos[0]).toMatchObject({
            lp_units_locked: '67',
            pool_type: 'ATOM',
          });
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            tgeMain.contracts.auction,
            {
              user_info: {
                address: cmInstantiator.wallet.address,
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
              tgeMain.contracts.auction,
              {
                user_info: {
                  address: tgeWallets[v].wallet.address,
                },
              },
            );
            const res2 = await tgeWallets[v].executeContract(
              tgeMain.contracts.auction,
              {
                withdraw_lp: {
                  amount: Math.round(
                    Number(userInfo.atom_lp_locked) / 2,
                  ).toString(),
                  asset: 'ATOM',
                  duration: 1,
                },
              },
            );
            expect(res2.code).toEqual(0);
            atomLpLocked -= Math.round(Number(userInfo.atom_lp_locked) / 2);
          }
        });
        it('should be able to withdraw USDC LP tokens', async () => {
          let res = await cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            {
              withdraw_lp: {
                asset: 'USDC',
                amount: '5',
                duration: 2,
              },
            },
          );
          expect(res.code).toEqual(0);
          res = await cmInstantiator.executeContract(
            tgeMain.contracts.auction,
            {
              withdraw_lp: {
                asset: 'USDC',
                amount: '5',
                duration: 1,
              },
            },
          );
          expect(res.code).toEqual(0);
          usdcLpLocked -= 10;
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              user_info: {
                address: cmInstantiator.wallet.address,
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
              tgeMain.contracts.auction,
              {
                user_info: {
                  address: tgeWallets[v].wallet.address,
                },
              },
            );
            const res2 = await tgeWallets[v].executeContract(
              tgeMain.contracts.auction,
              {
                withdraw_lp: {
                  amount: Math.round(
                    Number(userInfo.usdc_lp_locked) / 2,
                  ).toString(),
                  asset: 'USDC',
                  duration: 1,
                },
              },
            );
            expect(res2.code).toEqual(0);
            usdcLpLocked -= Math.round(Number(userInfo.usdc_lp_locked) / 2);
          }
        });
        it('should not be able to lock tokens when time is up', async () => {
          await waitTill(
            tgeMain.times.lockdropInit +
              tgeMain.times.lockdropDepositDuration +
              5,
          );
          await expect(
            cmInstantiator.executeContract(tgeMain.contracts.auction, {
              lock_lp: {
                amount: '100',
                asset: 'ATOM',
                duration: 1,
              },
            }),
          ).rejects.toThrow(/Lock window is closed/);
        });
      });
      it('should set generator to lockdrop', async () => {
        const res = await cmInstantiator.executeContract(
          tgeMain.contracts.lockdrop,
          {
            update_config: {
              new_config: {
                generator_address: tgeMain.contracts.astroGenerator,
              },
            },
          },
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
          {
            init_pool: {},
          },
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
        tgeEndHeight = await neutronChain.getHeight();
        let res = await cmInstantiator.executeContract(
          tgeMain.contracts.oracleAtom,
          {
            update: {},
          },
        );
        expect(res.code).toEqual(0);

        res = await cmInstantiator.executeContract(
          tgeMain.contracts.oracleUsdc,
          {
            update: {},
          },
        );
        expect(res.code).toEqual(0);

        neutronChain.waitBlocks(3);
        res = await cmInstantiator.executeContract(
          tgeMain.contracts.oracleAtom,
          {
            update: {},
          },
        );
        expect(res.code).toEqual(0);
        res = await cmInstantiator.executeContract(
          tgeMain.contracts.oracleUsdc,
          {
            update: {},
          },
        );
        expect(res.code).toEqual(0);
      });
      it('should not be able to init pool twice', async () => {
        await expect(
          cmInstantiator.executeContract(tgeMain.contracts.auction, {
            init_pool: {},
          }),
        ).rejects.toThrow(/Liquidity already added/);
      });
    });
    describe('Vest LP', () => {
      let claimAtomLP: number;
      let claimUsdcLP: number;
      it('should vest LP (permissionless)', async () => {
        let res = await cmStranger.executeContract(tgeMain.contracts.auction, {
          migrate_to_vesting: {},
        });
        expect(res.code).toEqual(0);
        res = await tgeWallets.airdropOnly.executeContract(
          tgeMain.contracts.auction,
          {
            migrate_to_vesting: {},
          },
        );
        expect(res.code).toEqual(0);
        tgeMain.times.vestTimestamp = Date.now();
      });
      it('should not vest LP all 7 users have been migrated', async () => {
        await expect(
          cmInstantiator.executeContract(tgeMain.contracts.auction, {
            migrate_to_vesting: {},
          }),
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
                address: cmInstantiator.wallet.address,
              },
            },
          ),
          neutronChain.queryContract<VestingAccountResponse>(
            tgeMain.contracts.vestingUsdcLp,
            {
              vesting_account: {
                address: cmInstantiator.wallet.address,
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
        // round?
        expect(parseInt(lpAuctionBalanceUsdc.balance)).toBeLessThanOrEqual(7);
        expect(parseInt(lpAuctionBalanceAtom.balance)).toBeLessThanOrEqual(7);
        expect(vestingInfoAtom.address).toEqual(cmInstantiator.wallet.address);
        expect(vestingInfoUsdc.address).toEqual(cmInstantiator.wallet.address);
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
          tgeMain.times.vestTimestamp / 1000 +
            tgeMain.times.auctionVestingLpDuration +
            10,
        );
        const [avaliableAtomLp, avaliableUsdcLp] = await Promise.all([
          neutronChain.queryContract<string>(tgeMain.contracts.vestingAtomLp, {
            available_amount: {
              address: cmInstantiator.wallet.address,
            },
          }),
          neutronChain.queryContract<string>(tgeMain.contracts.vestingUsdcLp, {
            available_amount: {
              address: cmInstantiator.wallet.address,
            },
          }),
        ]);
        expect(avaliableAtomLp).toEqual(claimAtomLP.toString());
        expect(avaliableUsdcLp).toEqual(claimUsdcLP.toString());
        const resAtom = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingAtomLp,
          {
            claim: {},
          },
        );
        expect(resAtom.code).toEqual(0);
        const resUsdc = await cmInstantiator.executeContract(
          tgeMain.contracts.vestingUsdcLp,
          {
            claim: {},
          },
        );
        expect(resUsdc.code).toEqual(0);

        const [lpBalanceAtom, lpBalanceUsdc] = await Promise.all([
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.atom_ntrn.liquidity,
            {
              balance: {
                address: cmInstantiator.wallet.address,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            tgeMain.pairs.usdc_ntrn.liquidity,
            {
              balance: {
                address: cmInstantiator.wallet.address,
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
          ]) {
            const member = new DaoMember(tgeWallets[v], daoMain);
            expect((await member.queryVotingPower()).power | 0).toBe(0);
          }
        });

        it('add lockdrop vault to the registry', async () => {
          let tvp = await daoMain.queryTotalVotingPower();
          expect(tvp.power | 0).toBe(11000); // the bonded 10000 + 1000 from investors vault (see neutron/network/init-neutrond.sh)
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
          await neutronChain.waitBlocks(2); // wait for a couple of blocks so the vault becomes active
          tvp = await daoMain.queryTotalVotingPower();
          expect(tvp.power | 0).toBeGreaterThan(11000);
          // lockdrop participants get voting power
          for (const v of [
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
            'auctionLockdrop',
            'auctionLockdropVesting',
          ]) {
            const member = new DaoMember(tgeWallets[v], daoMain);
            expect((await member.queryVotingPower()).power | 0).toBeGreaterThan(
              0,
            );
          }
          for (const v of [
            'airdropOnly',
            'airdropAuctionVesting',
            'auctionVesting',
          ]) {
            const member = new DaoMember(tgeWallets[v], daoMain);
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
            const member = new DaoMember(tgeWallets[v], daoMain);
            vp[v] = (await member.queryVotingPower()).power | 0;
            if (
              (await daoMain.queryProposal(propID)).proposal.status == 'open'
            ) {
              await member.voteYes(propID);
            }
          }
          await daoMember1.executeProposal(propID);
          await neutronChain.waitBlocks(2); // wait for a couple of blocks so the vault becomes active
          const tvpNew = await daoMain.queryTotalVotingPower();
          expect(tvpNew.power | 0).toBeGreaterThan(tvp.power | 0);
          // vesting participants get(increase) the voting power
          for (const v of [
            'airdropAuctionVesting',
            'airdropAuctionLockdropVesting',
            'auctionVesting',
            'auctionLockdropVesting',
          ]) {
            const member = new DaoMember(tgeWallets[v], daoMain);
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
          ]) {
            const member = new DaoMember(tgeWallets[v], daoMain);
            vp[v] = (await member.queryVotingPower()).power | 0;
            if (
              (await daoMain.queryProposal(propID)).proposal.status == 'open'
            ) {
              await member.voteYes(propID);
            }
          }
          await daoMember1.executeProposal(propID);
          await neutronChain.waitBlocks(2); // wait for a couple of blocks so the vault becomes active
          const tvpNew = await daoMain.queryTotalVotingPower();
          expect(tvpNew.power | 0).toBeGreaterThan(tvp.power | 0);
          // airdrop participants get(increase) the voting power
          for (const v of [
            'airdropOnly',
            'airdropAuctionVesting',
            'airdropAuctionLockdrop',
            'airdropAuctionLockdropVesting',
          ]) {
            const member = new DaoMember(tgeWallets[v], daoMain);
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
    describe('lockdrop', () => {
      let balanceBeforeLockdrop: number;
      let balanceBeforeAirdopLockdrop: number;
      let balanceBeforeAirdropAuctionLockdropVesting: number;
      let airdropAuctionLockdropVestingUserInfo: LockDropInfoResponse;
      it('query balance before claim rewards', async () => {
        balanceBeforeLockdrop = await neutronChain.queryDenomBalance(
          tgeWallets['auctionLockdrop'].wallet.address,
          NEUTRON_DENOM,
        );
        balanceBeforeAirdopLockdrop = await neutronChain.queryDenomBalance(
          tgeWallets['airdropAuctionLockdrop'].wallet.address,
          NEUTRON_DENOM,
        );
        balanceBeforeAirdropAuctionLockdropVesting =
          await neutronChain.queryDenomBalance(
            tgeWallets['airdropAuctionLockdropVesting'].wallet.address,
            NEUTRON_DENOM,
          );

        airdropAuctionLockdropVestingUserInfo =
          await neutronChain.queryContract<LockDropInfoResponse>(
            tgeMain.contracts.lockdrop,
            {
              user_info: {
                address:
                  tgeWallets['airdropAuctionLockdropVesting'].wallet.address,
              },
            },
          );
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
          // const rewardsStateBeforeClaim = await tgeMain.generatorRewardsState(
          //   cmInstantiator.wallet.address,
          // );
          //
          // const res = await cmInstantiator.executeContract(
          //   tgeMain.contracts.lockdrop,
          //   {
          //     claim_rewards_and_optionally_unlock: {
          //       pool_type: 'USDC',
          //       duration: 2,
          //       withdraw_lp_stake: false,
          //     },
          //   },
          // );
          // expect(res.code).toEqual(0);
          //
          // const rewardsStateAfterClaim = await tgeMain.generatorRewardsState(
          //   cmInstantiator.wallet.address,
          // );
          //
          // expect(
          //   rewardsStateAfterClaim.balanceNtrn +
          //     FEE_SIZE -
          //     rewardsStateBeforeClaim.balanceNtrn,
          // ).toEqual(44); // lockdrop rewards share for the user
          //
          // const rewardStateBeforeClaimUsdc: LockdropLockUpInfoResponse =
          //   rewardsStateBeforeClaim.userInfo.lockup_infos.find(
          //     (i) => i.pool_type == 'USDC' && i.duration == 2,
          //   ) as LockdropLockUpInfoResponse;
          // expect(rewardStateBeforeClaimUsdc).not.toBeNull();
          // const expectedGeneratorRewards =
          //   +rewardStateBeforeClaimUsdc.claimable_generator_astro_debt;
          // expect(expectedGeneratorRewards).toBeGreaterThan(0);
          //
          // // we expect the astro balance to increase by somewhere between user rewards amount and user
          // // rewards amount plus rewards per block amount because rewards drip each block.
          // const astroBalanceDiff =
          //   rewardsStateAfterClaim.balanceAstro -
          //   rewardsStateBeforeClaim.balanceAstro;
          // expect(astroBalanceDiff).toBeGreaterThanOrEqual(
          //   expectedGeneratorRewards,
          // );
          // expect(astroBalanceDiff).toBeLessThan(
          //   expectedGeneratorRewards + tgeMain.generatorRewardsPerBlock,
          // );
          //
          // // withdraw_lp_stake is false => no lp tokens returned
          // expect(rewardsStateBeforeClaim.atomNtrnLpTokenBalance).toEqual(
          //   rewardsStateAfterClaim.atomNtrnLpTokenBalance,
          // );
          // expect(rewardsStateBeforeClaim.usdcNtrnLpTokenBalance).toEqual(
          //   rewardsStateAfterClaim.usdcNtrnLpTokenBalance,
          // );
        });

        it("unavailable for those who didn't participate", async () => {
          for (const v of [
            'airdropOnly',
            'airdropAuctionVesting',
            'auctionVesting',
          ]) {
            await expect(
              tgeWallets[v].executeContract(tgeMain.contracts.lockdrop, {
                claim_rewards_and_optionally_unlock: {
                  pool_type: 'USDC',
                  duration: 1,
                  withdraw_lp_stake: false,
                },
              }),
            ).rejects.toThrowError(/LockupInfoV1 not found/);
            await expect(
              tgeWallets[v].executeContract(tgeMain.contracts.lockdrop, {
                claim_rewards_and_optionally_unlock: {
                  pool_type: 'ATOM',
                  duration: 1,
                  withdraw_lp_stake: false,
                },
              }),
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
              tgeWallets[v].wallet.address,
            );

            const res = await tgeWallets[v].executeContract(
              tgeMain.contracts.lockdrop,
              {
                claim_rewards_and_optionally_unlock: {
                  pool_type: 'USDC',
                  duration: 1,
                  withdraw_lp_stake: false,
                },
              },
            );
            expect(res.code).toEqual(0);

            const rewardsStateAfterClaim = await tgeMain.generatorRewardsState(
              tgeWallets[v].wallet.address,
            );

            // a more precise check is done later in 'should get extra untrn from unclaimed airdrop'
            // testcase, here we simply check that the balance has increased
            expect(
              rewardsStateAfterClaim.balanceNtrn + FEE_SIZE,
            ).toBeGreaterThan(rewardsStateBeforeClaim.balanceNtrn);

            const rewardsBeforeClaimUsdc =
              rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                (i) => i.pool_type == 'USDC' && i.duration == 1,
              ) as LockdropLockUpInfoResponse;
            expect(rewardsBeforeClaimUsdc).not.toBeNull();
            const expectedGeneratorRewards =
              +rewardsBeforeClaimUsdc.claimable_generator_astro_debt;
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
              tgeWallets[v].wallet.address,
            );

            let res = await tgeWallets[v].executeContract(
              tgeMain.contracts.lockdrop,
              {
                claim_rewards_and_optionally_unlock: {
                  pool_type: 'USDC',
                  duration: 1,
                  withdraw_lp_stake: true,
                },
              },
            );
            expect(res.code).toEqual(0);
            res = await tgeWallets[v].executeContract(
              tgeMain.contracts.lockdrop,
              {
                claim_rewards_and_optionally_unlock: {
                  pool_type: 'ATOM',
                  duration: 1,
                  withdraw_lp_stake: true,
                },
              },
            );
            expect(res.code).toEqual(0);

            const rewardsStateAfterClaim = await tgeMain.generatorRewardsState(
              tgeWallets[v].wallet.address,
            );

            expect(rewardsStateAfterClaim.balanceNtrn + 2 * FEE_SIZE).toEqual(
              rewardsStateBeforeClaim.balanceNtrn,
            ); // ntrn rewards were sent at the previous claim, so no ntrn income is expected

            // withdraw_lp_stake is true => expect lp tokens to be unlocked and returned to the user
            const rewardsUscBeforeClaim =
              rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                (i) => i.pool_type == 'USDC' && i.duration == 1,
              ) as LockdropLockUpInfoResponse;
            expect(rewardsUscBeforeClaim).not.toBeNull();
            const usdcNtrnLockedLp = +rewardsUscBeforeClaim.lp_units_locked;
            expect(usdcNtrnLockedLp).toBeGreaterThan(0);
            expect(rewardsStateAfterClaim.usdcNtrnLpTokenBalance).toEqual(
              rewardsStateBeforeClaim.usdcNtrnLpTokenBalance + usdcNtrnLockedLp,
            );
            const rewardsAtomBeforeClaim =
              rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                (i) => i.pool_type == 'ATOM' && i.duration == 1,
              ) as LockdropLockUpInfoResponse;
            expect(rewardsAtomBeforeClaim).not.toBeNull();
            const atomNtrnLockedLp = +rewardsAtomBeforeClaim.lp_units_locked;
            expect(atomNtrnLockedLp).toBeGreaterThan(0);
            expect(rewardsStateAfterClaim.atomNtrnLpTokenBalance).toEqual(
              rewardsStateBeforeClaim.atomNtrnLpTokenBalance + atomNtrnLockedLp,
            );

            // claimed from both pools above, so expected rewards amount is a sum of both
            const rewardsBeforeClaimUsdc =
              rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                (i) => i.pool_type == 'USDC' && i.duration == 1,
              ) as LockdropLockUpInfoResponse;
            expect(rewardsBeforeClaimUsdc).not.toBeNull();
            const rewardsBeforeClaimAtom =
              rewardsStateBeforeClaim.userInfo.lockup_infos.find(
                (i) => i.pool_type == 'ATOM' && i.duration == 1,
              ) as LockdropLockUpInfoResponse;
            expect(rewardsBeforeClaimAtom).not.toBeNull();

            const expectedGeneratorRewards =
              +rewardsBeforeClaimUsdc.claimable_generator_astro_debt +
              +rewardsBeforeClaimAtom.claimable_generator_astro_debt;
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
      it('should get extra untrn from unclaimed airdrop', async () => {
        const balanceAfterLockdrop = await neutronChain.queryDenomBalance(
          tgeWallets['auctionLockdrop'].wallet.address,
          NEUTRON_DENOM,
        );
        const balanceAfterAirdopLockdrop = await neutronChain.queryDenomBalance(
          tgeWallets['airdropAuctionLockdrop'].wallet.address,
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
            tgeWallets['airdropAuctionLockdropVesting'].wallet.address,
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

  describe('Vaults', () => {
    test('Get lockdrop vault config', async () => {
      expect(
        await queryLockdropVaultConfig(
          neutronChain,
          tgeMain.contracts.lockdropVault,
        ),
      ).toMatchObject({
        name: tgeMain.lockdropVaultName,
        description: tgeMain.lockdropVaultDescription,
        lockdrop_contract: tgeMain.contracts.lockdrop,
        oracle_usdc_contract: tgeMain.contracts.oracleUsdc,
        oracle_atom_contract: tgeMain.contracts.oracleAtom,
        owner: cmInstantiator.wallet.address,
      });
    });

    test('Get vesting LP vault config', async () => {
      expect(
        await queryVestingLpVaultConfig(
          neutronChain,
          tgeMain.contracts.vestingLpVault,
        ),
      ).toMatchObject({
        name: tgeMain.vestingLpVaultName,
        description: tgeMain.vestingLpVaultDescription,
        atom_vesting_lp_contract: tgeMain.contracts.vestingAtomLp,
        atom_oracle_contract: tgeMain.contracts.oracleAtom,
        usdc_vesting_lp_contract: tgeMain.contracts.vestingUsdcLp,
        usdc_oracle_contract: tgeMain.contracts.oracleUsdc,
        owner: tgeMain.instantiator.wallet.address,
      });
    });

    test('Get credits vault config', async () => {
      expect(
        await queryCreditsVaultConfig(
          neutronChain,
          tgeMain.contracts.creditsVault,
        ),
      ).toMatchObject({
        name: tgeMain.creditsVaultName,
        description: tgeMain.creditsVaultDescription,
        credits_contract_address: tgeMain.contracts.credits,
        owner: tgeMain.instantiator.wallet.address,
        airdrop_contract_address: tgeMain.contracts.airdrop,
      });
    });

    test('Update lockdrop vault config: permission denied', async () => {
      await expect(
        executeLockdropVaultUpdateConfig(
          cmStranger,
          tgeMain.contracts.lockdropVault,
          cmStranger.wallet.address,
          tgeMain.contracts.lockdrop,
          tgeMain.contracts.oracleUsdc,
          tgeMain.contracts.oracleAtom,
          'name',
          'description',
        ),
      ).rejects.toThrow(/Unauthorized/);

      expect(
        await queryLockdropVaultConfig(
          neutronChain,
          tgeMain.contracts.lockdropVault,
        ),
      ).toMatchObject({
        name: tgeMain.lockdropVaultName,
        description: tgeMain.lockdropVaultDescription,
        lockdrop_contract: tgeMain.contracts.lockdrop,
        oracle_usdc_contract: tgeMain.contracts.oracleUsdc,
        oracle_atom_contract: tgeMain.contracts.oracleAtom,
        owner: cmInstantiator.wallet.address,
      });
    });

    test('Update vesting LP vault config: permission denied', async () => {
      await expect(
        executeVestingLpVaultUpdateConfig(
          cmStranger,
          tgeMain.contracts.vestingLpVault,
          cmStranger.wallet.address,
          tgeMain.contracts.vestingUsdcLp,
          tgeMain.contracts.oracleUsdc,
          tgeMain.contracts.vestingAtomLp,
          tgeMain.contracts.oracleAtom,
          'name',
          'description',
        ),
      ).rejects.toThrow(/Unauthorized/);

      expect(
        await queryVestingLpVaultConfig(
          neutronChain,
          tgeMain.contracts.vestingLpVault,
        ),
      ).toMatchObject({
        name: tgeMain.vestingLpVaultName,
        description: tgeMain.vestingLpVaultDescription,
        atom_vesting_lp_contract: tgeMain.contracts.vestingAtomLp,
        atom_oracle_contract: tgeMain.contracts.oracleAtom,
        usdc_vesting_lp_contract: tgeMain.contracts.vestingUsdcLp,
        usdc_oracle_contract: tgeMain.contracts.oracleUsdc,
        owner: tgeMain.instantiator.wallet.address,
      });
    });

    test('Update credits vault config: permission denied', async () => {
      await expect(
        executeCreditsVaultUpdateConfig(
          cmStranger,
          tgeMain.contracts.creditsVault,
          tgeMain.contracts.auction,
          cmStranger.wallet.address,
          'name',
          'description',
        ),
      ).rejects.toThrow(/Unauthorized/);

      expect(
        await queryCreditsVaultConfig(
          neutronChain,
          tgeMain.contracts.creditsVault,
        ),
      ).toMatchObject({
        name: tgeMain.creditsVaultName,
        description: tgeMain.creditsVaultDescription,
        credits_contract_address: tgeMain.contracts.credits,
        owner: tgeMain.instantiator.wallet.address,
        airdrop_contract_address: tgeMain.contracts.airdrop,
      });
    });

    test('Bonding and Unbonding', async () => {
      for (const vault of [
        tgeMain.contracts.creditsVault,
        tgeMain.contracts.vestingLpVault,
        tgeMain.contracts.lockdropVault,
      ]) {
        await expect(
          cmStranger.executeContract(
            vault,
            {
              bond: {},
            },
            [{ denom: NEUTRON_DENOM, amount: '1000' }],
          ),
        ).rejects.toThrow(/Bonding is not available for this contract/);
        await expect(
          cmStranger.executeContract(vault, {
            unbond: {
              amount: '1000',
            },
          }),
        ).rejects.toThrow(
          /Direct unbonding is not available for this contract/,
        );
      }
    });

    test('Change lockdrop vault owner to stranger', async () => {
      const res = await executeLockdropVaultUpdateConfig(
        cmInstantiator,
        tgeMain.contracts.lockdropVault,
        cmStranger.wallet.address,
        tgeMain.contracts.lockdrop,
        tgeMain.contracts.oracleUsdc,
        tgeMain.contracts.oracleAtom,
        tgeMain.lockdropVaultName,
        tgeMain.lockdropVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryLockdropVaultConfig(
          neutronChain,
          tgeMain.contracts.lockdropVault,
        ),
      ).toMatchObject({
        name: tgeMain.lockdropVaultName,
        description: tgeMain.lockdropVaultDescription,
        lockdrop_contract: tgeMain.contracts.lockdrop,
        oracle_usdc_contract: tgeMain.contracts.oracleUsdc,
        oracle_atom_contract: tgeMain.contracts.oracleAtom,
        owner: cmStranger.wallet.address,
      });
    });

    test('Update lockdrop vault config by new owner', async () => {
      tgeMain.lockdropVaultName = 'New lockdrop name';
      tgeMain.lockdropVaultDescription = 'New lockdrop description';

      const res = await executeLockdropVaultUpdateConfig(
        cmStranger,
        tgeMain.contracts.lockdropVault,
        cmStranger.wallet.address,
        tgeMain.contracts.lockdrop,
        tgeMain.contracts.oracleUsdc,
        tgeMain.contracts.oracleAtom,
        tgeMain.lockdropVaultName,
        tgeMain.lockdropVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryLockdropVaultConfig(
          neutronChain,
          tgeMain.contracts.lockdropVault,
        ),
      ).toMatchObject({
        name: tgeMain.lockdropVaultName,
        description: tgeMain.lockdropVaultDescription,
        lockdrop_contract: tgeMain.contracts.lockdrop,
        oracle_usdc_contract: tgeMain.contracts.oracleUsdc,
        oracle_atom_contract: tgeMain.contracts.oracleAtom,
        owner: cmStranger.wallet.address,
      });
    });

    test('Change vesting LP vault owner to stranger', async () => {
      const res = await executeVestingLpVaultUpdateConfig(
        cmInstantiator,
        tgeMain.contracts.vestingLpVault,
        cmStranger.wallet.address,
        tgeMain.contracts.vestingAtomLp,
        tgeMain.contracts.oracleAtom,
        tgeMain.contracts.vestingUsdcLp,
        tgeMain.contracts.oracleUsdc,
        tgeMain.vestingLpVaultName,
        tgeMain.vestingLpVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryVestingLpVaultConfig(
          neutronChain,
          tgeMain.contracts.vestingLpVault,
        ),
      ).toMatchObject({
        name: tgeMain.vestingLpVaultName,
        description: tgeMain.vestingLpVaultDescription,
        atom_vesting_lp_contract: tgeMain.contracts.vestingAtomLp,
        atom_oracle_contract: tgeMain.contracts.oracleAtom,
        usdc_vesting_lp_contract: tgeMain.contracts.vestingUsdcLp,
        usdc_oracle_contract: tgeMain.contracts.oracleUsdc,
        owner: cmStranger.wallet.address,
      });
    });

    test('Update vesting LP vault config by new owner', async () => {
      tgeMain.vestingLpVaultName = 'New vesting LP name';
      tgeMain.vestingLpVaultDescription = 'New vesting LP description';
      const res = await executeVestingLpVaultUpdateConfig(
        cmStranger,
        tgeMain.contracts.vestingLpVault,
        cmStranger.wallet.address,
        tgeMain.contracts.vestingAtomLp,
        tgeMain.contracts.oracleAtom,
        tgeMain.contracts.vestingUsdcLp,
        tgeMain.contracts.oracleUsdc,
        tgeMain.vestingLpVaultName,
        tgeMain.vestingLpVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryVestingLpVaultConfig(
          neutronChain,
          tgeMain.contracts.vestingLpVault,
        ),
      ).toMatchObject({
        name: tgeMain.vestingLpVaultName,
        description: tgeMain.vestingLpVaultDescription,
        atom_vesting_lp_contract: tgeMain.contracts.vestingAtomLp,
        atom_oracle_contract: tgeMain.contracts.oracleAtom,
        usdc_vesting_lp_contract: tgeMain.contracts.vestingUsdcLp,
        usdc_oracle_contract: tgeMain.contracts.oracleUsdc,
        owner: cmStranger.wallet.address,
      });
    });

    test('Change credits vault owner to stranger', async () => {
      const res = await executeCreditsVaultUpdateConfig(
        cmInstantiator,
        tgeMain.contracts.creditsVault,
        null,
        cmStranger.wallet.address,
        null,
        null,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryCreditsVaultConfig(
          neutronChain,
          tgeMain.contracts.creditsVault,
        ),
      ).toMatchObject({
        name: tgeMain.creditsVaultName,
        description: tgeMain.creditsVaultDescription,
        credits_contract_address: tgeMain.contracts.credits,
        owner: cmStranger.wallet.address,
        airdrop_contract_address: tgeMain.contracts.airdrop,
      });
    });

    test('Update credits vault config by new owner', async () => {
      tgeMain.creditsVaultName = 'New credits name';
      tgeMain.creditsVaultDescription = 'New credits description';
      const res = await executeCreditsVaultUpdateConfig(
        cmStranger,
        tgeMain.contracts.creditsVault,
        null,
        null,
        tgeMain.creditsVaultName,
        tgeMain.creditsVaultDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await queryCreditsVaultConfig(
          neutronChain,
          tgeMain.contracts.creditsVault,
        ),
      ).toMatchObject({
        name: tgeMain.creditsVaultName,
        description: tgeMain.creditsVaultDescription,
        credits_contract_address: tgeMain.contracts.credits,
        owner: cmStranger.wallet.address,
        airdrop_contract_address: tgeMain.contracts.airdrop,
      });
    });
  });
});
