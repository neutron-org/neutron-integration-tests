import {
  CosmosWrapper,
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
  NEUTRON_DENOM,
} from '../../helpers/cosmos';
import { NeutronContract } from '../../helpers/types';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';

type PairInfo = {
  asset_infos: Record<'native_token' | 'token', { denom: string }>[];
  contract_addr: string;
  liquidity_token: string;
  pair_type: Record<string, object>;
};

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
  let cm: CosmosWrapper;
  const codeIds: Record<string, string> = {};
  const contractAddresses: Record<string, string> = {};
  let pairs: {
    atom_ntrn: { contract: string; liqiudity: string };
    usdc_ntrn: { contract: string; liqiudity: string };
  };
  const times: Record<string, number> = {};
  let reserveAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    reserveAddress =
      testState.wallets.qaNeutronThree.genQaWal1.address.toString();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutron.genQaWal1,
      NEUTRON_DENOM,
    );
  });

  describe('Deploy', () => {
    it('should be able to send fake ibc tokens', async () => {
      await cm.msgSend(
        testState.wallets.qaNeutronFour.genQaWal1.address.toString(),
        '1000',
        IBC_ATOM_DENOM,
      );
      await cm.msgSend(
        testState.wallets.qaNeutronFour.genQaWal1.address.toString(),
        '1000',
        IBC_USDC_DENOM,
      );
    });
    it('should store contracts', async () => {
      for (const contract of [
        'TGE_CREDITS',
        'TGE_AIRDROP',
        'TGE_AUCTION',
        'TGE_LOCKDROP',
        'TGE_PRICE_FEED_MOCK',
        'ASTRO_PAIR',
        'ASTRO_FACTORY',
        'ASTRO_TOKEN',
        'VESTING_LP',
      ]) {
        const codeId = parseInt(await cm.storeWasm(NeutronContract[contract]));
        expect(codeId).toBeGreaterThan(0);
        codeIds[contract] = codeId.toString();
      }
    });
    it('should instantiate credits contract', async () => {
      const res = await cm.instantiate(
        codeIds['TGE_CREDITS'],
        JSON.stringify({
          dao_address: cm.wallet.address.toString(),
        }),
        'credits',
      );
      expect(res).toBeTruthy();
      contractAddresses.TGE_CREDITS = res[0]._contract_address;
    });
    it('should instantiate price feed contract', async () => {
      const res = await cm.instantiate(
        codeIds['TGE_PRICE_FEED_MOCK'],
        '{}',
        'price_feed',
      );
      expect(res).toBeTruthy();
      contractAddresses['TGE_PRICE_FEED_MOCK'] = res[0]._contract_address;
    });
    it('should instantiate astro pair astro factory', async () => {
      const instantiateMsg = {
        pair_configs: [
          {
            code_id: parseInt(codeIds.ASTRO_PAIR),
            pair_type: {
              xyk: {},
            },
            total_fee_bps: 0,
            maker_fee_bps: 0,
            is_disabled: false,
            is_generator_disabled: true,
          },
        ],
        token_code_id: parseInt(codeIds.ASTRO_TOKEN),
        owner: cm.wallet.address.toString(),
        whitelist_code_id: 0,
      };
      const res = await cm.instantiate(
        codeIds.ASTRO_FACTORY,
        JSON.stringify(instantiateMsg),
        'astro_factory',
      );
      expect(res).toBeTruthy();
      contractAddresses['ASTRO_FACTORY'] = res[0]._contract_address;
    });
    it('should create pair ATOM/NTRN', async () => {
      const createMsg = {
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

      const res = await cm.executeContract(
        contractAddresses.ASTRO_FACTORY,
        JSON.stringify(createMsg),
      );
      expect(res.code).toBe(0);
    });
    it('should create pair USDC/NTRN', async () => {
      const createMsg = {
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

      const res = await cm.executeContract(
        contractAddresses.ASTRO_FACTORY,
        JSON.stringify(createMsg),
      );
      expect(res.code).toBe(0);
    });
    it('retrieve pair addresses', async () => {
      const res = await cm.queryContract<{ pairs: PairInfo[] }>(
        contractAddresses.ASTRO_FACTORY,
        {
          pairs: {},
        },
      );
      expect(res.pairs).toHaveLength(2);
      pairs = {
        atom_ntrn: {
          contract: res.pairs[0].contract_addr,
          liqiudity: res.pairs[0].liquidity_token,
        },
        usdc_ntrn: {
          contract: res.pairs[1].contract_addr,
          liqiudity: res.pairs[1].liquidity_token,
        },
      };
    });
    it('should instantiate auction contract', async () => {
      times.auctionInitTs = (Date.now() / 1000 + 10) | 0;
      times.auctionDepositWindow = 30;
      times.auctionWithdrawalWindow = 30;
      times.auctionLpLockWindow = 30;
      const res = await cm.instantiate(
        codeIds.TGE_AUCTION,
        JSON.stringify({
          price_feed_contract: contractAddresses.TGE_PRICE_FEED_MOCK,
          reserve_contract_address: reserveAddress,
          vesting_usdc_contract_address: reserveAddress, //TODO: FIX
          vesting_atom_contract_address: reserveAddress, //TODO: FIX
          lp_tokens_lock_window: times.auctionLpLockWindow,
          init_timestamp: times.auctionInitTs,
          deposit_window: times.auctionDepositWindow,
          withdrawal_window: times.auctionWithdrawalWindow,
          atom_denom: IBC_ATOM_DENOM,
          usdc_denom: IBC_USDC_DENOM,
          max_exchange_rate_age: 1000,
          min_ntrn_amount: '100000',
          vesting_migration_pack_size: 1,
        }),
        'auction',
      );
      contractAddresses.TGE_AUCTION = res[0]._contract_address;
    });
    it('should instantiate lockdrop contract', async () => {
      times.lockdropInitTs = (Date.now() / 1000 + 10) | 0;
      const msg = {
        atom_token: pairs.atom_ntrn.contract,
        usdc_token: pairs.usdc_ntrn.contract,
        credits_contract: contractAddresses.TGE_CREDITS,
        auction_contract: contractAddresses.TGE_AUCTION,
        init_timestamp: times.lockdropInitTs,
        deposit_window: 20,
        withdrawal_window: 40,
        min_lock_duration: 1,
        max_lock_duration: 2,
        max_positions_per_user: 2,
        lock_window: 1000,
        lockup_rewards_info: [{ duration: 1, coefficient: '0' }],
      };
      const res = await cm.instantiate(
        codeIds['TGE_LOCKDROP'],
        JSON.stringify(msg),
        'lockdrop',
      );
      expect(res).toBeTruthy();
      contractAddresses.TGE_LOCKDROP = res[0]._contract_address;
    });
    it('sets lockdrop address', async () => {
      const res = await cm.executeContract(
        contractAddresses.TGE_AUCTION,
        JSON.stringify({
          update_config: {
            new_config: {
              lockdrop_contract_address: contractAddresses.TGE_LOCKDROP,
              pool_info: {
                ntrn_usdc_pool_address: pairs.usdc_ntrn.contract,
                ntrn_atom_pool_address: pairs.atom_ntrn.contract,
                ntrn_usdc_lp_token_address: pairs.usdc_ntrn.liqiudity,
                ntrn_atom_lp_token_address: pairs.atom_ntrn.liqiudity,
              },
            },
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
  });

  describe('Auction', () => {
    describe('Phase 1', () => {
      it('should not allow deposit before init', async () => {
        await expect(
          cm.executeContract(
            contractAddresses.TGE_AUCTION,
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
        await waitTill(times.auctionInitTs + 10);
        const atomBalanceBefore = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const res = await cm.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            deposit: {},
          }),
          [
            {
              amount: '10000',
              denom: IBC_ATOM_DENOM,
            },
          ],
        );
        expect(res.code).toEqual(0);
        const info = await cm.queryContract<UserInfoResponse>(
          contractAddresses.TGE_AUCTION,
          {
            user_info: {
              address: cm.wallet.address.toString(),
            },
          },
        );
        const atomBalanceAfter = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        expect(info.atom_deposited).toEqual('10000');
        expect(atomBalanceAfter).toEqual(atomBalanceBefore - 10000);
      });
      it('should allow deposit USDC', async () => {
        const usdcBalanceBefore = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        const res = await cm.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            deposit: {},
          }),
          [
            {
              amount: '90000',
              denom: IBC_USDC_DENOM,
            },
          ],
        );
        expect(res.code).toEqual(0);
        const info = await cm.queryContract<UserInfoResponse>(
          contractAddresses.TGE_AUCTION,
          {
            user_info: {
              address: cm.wallet.address.toString(),
            },
          },
        );
        const usdcBalanceAfter = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        expect(info.usdc_deposited).toEqual('90000');
        expect(usdcBalanceAfter).toEqual(usdcBalanceBefore - 90000);
      });
      it('should be able to witdraw', async () => {
        const atomBalanceBefore = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceBefore = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        const res = await cm.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            withdraw: {
              amount_usdc: '5000',
              amount_atom: '5000',
            },
          }),
        );
        expect(res.code).toEqual(0);
        const info = await cm.queryContract<UserInfoResponse>(
          contractAddresses.TGE_AUCTION,
          {
            user_info: {
              address: cm.wallet.address.toString(),
            },
          },
        );
        const atomBalanceAfter = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceAfter = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        expect(info.atom_deposited).toEqual('5000');
        expect(info.usdc_deposited).toEqual('85000');
        expect(atomBalanceAfter).toEqual(atomBalanceBefore + 5000);
        expect(usdcBalanceAfter).toEqual(usdcBalanceBefore + 5000);
      });
    });
    describe('Phase 2', () => {
      it('should not allow deposit when deposit window is closed', async () => {
        await waitTill(times.auctionInitTs + times.auctionDepositWindow + 5);
        await expect(
          cm.executeContract(
            contractAddresses.TGE_AUCTION,
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
          cm.executeContract(
            contractAddresses.TGE_AUCTION,
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
        const atomBalanceBefore = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceBefore = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        const res = await cm.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            withdraw: {
              amount_usdc: '1000',
              amount_atom: '1000',
            },
          }),
        );
        expect(res.code).toEqual(0);
        const info = await cm.queryContract<UserInfoResponse>(
          contractAddresses.TGE_AUCTION,
          {
            user_info: {
              address: cm.wallet.address.toString(),
            },
          },
        );
        const atomBalanceAfter = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceAfter = await cm.queryDenomBalance(
          cm.wallet.address.toString(),
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
          cm.executeContract(
            contractAddresses.TGE_AUCTION,
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
      describe('set_pool_size', () => {
        it('should not be able to set pool size before withdrawal_window is closed', async () => {
          await expect(
            cm.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Deposit\/withdrawal windows are still open/);
        });
        it('should not be able to set pool size bc of wrong price feed data', async () => {
          await waitTill(
            times.auctionInitTs +
              times.auctionDepositWindow +
              times.auctionWithdrawalWindow +
              5,
          );
          await expect(
            cm.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Invalid price feed data/);
        });
        it('should not be able to set pool size (no NTRN)', async () => {
          const time = (Date.now() / 1000 - 1000) | 0;
          const r1 = await cm.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
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
          const r2 = await cm.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
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
            cm.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Not enough NTRN in the contract/);
        });
        it('should not be able to set pool size when price feed data is set but too old', async () => {
          await cm.msgSend(contractAddresses.TGE_AUCTION, '200000');
          const time = (Date.now() / 1000 - 10000) | 0;
          const r1 = await cm.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
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
          const r2 = await cm.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
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
            cm.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Price feed data is too old/);
        });
        it('should be able to set pool size', async () => {
          const time = (Date.now() / 1000) | 0;
          const r1 = await cm.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
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
          const r2 = await cm.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
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

          const res = await cm.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              set_pool_size: {},
            }),
          );
          expect(res.code).toEqual(0);
          const state = await cm.queryContract<AuctionStateResponse>(
            contractAddresses.TGE_AUCTION,
            {
              state: {},
            },
          );
          expect(state).toEqual({
            atom_lp_locked: '0',
            atom_lp_size: '15064',
            atom_ntrn_size: '64517',
            is_rest_lp_vested: false,
            lp_atom_shares_minted: null,
            lp_usdc_shares_minted: null,
            pool_init_timestamp: 0,
            total_atom_deposited: '4000',
            total_usdc_deposited: '84000',
            usdc_lp_locked: '0',
            usdc_lp_size: '105679',
            usdc_ntrn_size: '135483',
          });
        });
        it('should not be able to set pool size twice', async () => {
          await expect(
            cm.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Pool size has already been set/);
        });
      });
      describe('lock_lp', () => {
        it('should be able to lock ATOM LP tokens', async () => {
          const res = await cm.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              lock_lp: {
                amount: '100',
                asset: 'ATOM',
                duration: 1,
              },
            }),
          );
          const userInfo = await cm.queryContract<UserInfoResponse>(
            contractAddresses.TGE_AUCTION,
            {
              user_info: {
                address: cm.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(parseInt(userInfo.atom_lp_locked)).toEqual(100);
          const info = await cm.queryContract<LockDropInfoResponse>(
            contractAddresses.TGE_LOCKDROP,
            {
              user_info: {
                address: cm.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos).toHaveLength(1);
          expect(info.lockup_infos[0]).toMatchObject({
            lp_units_locked: '100',
            pool_type: 'ATOM',
          });
        });
        it('should be able to lock USDC LP tokens', async () => {
          const res = await cm.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              lock_lp: {
                amount: '100',
                asset: 'USDC',
                duration: 1,
              },
            }),
          );
          const userInfo = await cm.queryContract<UserInfoResponse>(
            contractAddresses.TGE_AUCTION,
            {
              user_info: {
                address: cm.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(parseInt(userInfo.usdc_lp_locked)).toEqual(100);
          const info = await cm.queryContract<LockDropInfoResponse>(
            contractAddresses.TGE_LOCKDROP,
            {
              user_info: {
                address: cm.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos).toHaveLength(2);
          expect(info.lockup_infos[1]).toMatchObject({
            lp_units_locked: '100',
            pool_type: 'USDC',
          });
        });
        it('should not be able to lock ATOM LP tokens more than have', async () => {
          const userInfo = await cm.queryContract<UserInfoResponse>(
            contractAddresses.TGE_AUCTION,
            {
              user_info: {
                address: cm.wallet.address.toString(),
              },
            },
          );
          await expect(
            cm.executeContract(
              contractAddresses.TGE_AUCTION,
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
          const userInfo = await cm.queryContract<UserInfoResponse>(
            contractAddresses.TGE_AUCTION,
            {
              user_info: {
                address: cm.wallet.address.toString(),
              },
            },
          );
          await expect(
            cm.executeContract(
              contractAddresses.TGE_AUCTION,
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
          const res = await cm.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              withdraw_lp: {
                asset: 'ATOM',
                amount: '10',
                duration: 1,
              },
            }),
          );
          expect(res.code).toEqual(0);
          const info = await cm.queryContract<LockDropInfoResponse>(
            contractAddresses.TGE_LOCKDROP,
            {
              user_info: {
                address: cm.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos[0]).toMatchObject({
            lp_units_locked: '90',
            pool_type: 'ATOM',
          });
        });
        it('should be able to withdraw USDC LP tokens', async () => {
          const res = await cm.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              withdraw_lp: {
                asset: 'USDC',
                amount: '10',
                duration: 1,
              },
            }),
          );
          expect(res.code).toEqual(0);
          const info = await cm.queryContract<LockDropInfoResponse>(
            contractAddresses.TGE_LOCKDROP,
            {
              user_info: {
                address: cm.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos[1]).toMatchObject({
            lp_units_locked: '90',
            pool_type: 'USDC',
          });
        });
        it('should not be able to lock tokens when time is up', async () => {
          await waitTill(
            times.auctionInitTs +
              times.auctionDepositWindow +
              times.auctionWithdrawalWindow +
              times.auctionLpLockWindow +
              5,
          );
          await expect(
            cm.executeContract(
              contractAddresses.TGE_AUCTION,
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
    });
    describe('Init pool', () => {
      it('should init pool', async () => {
        const res = await cm.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            init_pool: {},
          }),
        );
        expect(res.code).toEqual(0);
        const atomPoolInfo = await cm.queryContract<boolean>(
          pairs.atom_ntrn.contract,
          {
            pool: {},
          },
        );
        const usdcPoolInfo = await cm.queryContract<boolean>(
          pairs.usdc_ntrn.contract,
          {
            pool: {},
          },
        );
        const reserveLPBalanceAtomNtrn =
          await cm.queryContract<PoolInfoResponse>(pairs.atom_ntrn.liqiudity, {
            balance: {
              address: reserveAddress,
            },
          });
        const reserveLPBalanceUsdcNtrn =
          await cm.queryContract<PoolInfoResponse>(pairs.usdc_ntrn.liqiudity, {
            balance: {
              address: reserveAddress,
            },
          });
        expect(reserveLPBalanceAtomNtrn).toEqual({ balance: '7532' });
        expect(reserveLPBalanceUsdcNtrn).toEqual({ balance: '52839' });
        expect(atomPoolInfo).toEqual({
          assets: [
            { amount: '4000', info: { native_token: { denom: 'uibcatom' } } },
            { amount: '64517', info: { native_token: { denom: 'untrn' } } },
          ],
          total_share: '16064',
        });
        expect(usdcPoolInfo).toEqual({
          assets: [
            { amount: '84000', info: { native_token: { denom: 'uibcusdc' } } },
            { amount: '135483', info: { native_token: { denom: 'untrn' } } },
          ],
          total_share: '106679',
        });
      });
      it('should not be able to init pool twice', async () => {
        await expect(
          cm.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              init_pool: {},
            }),
          ),
        ).rejects.toThrow(/Liquidity already added/);
      });
    });
  });
});
