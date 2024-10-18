import { RunnerTestSuite, inject } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import config from '../../config.json';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { Wallet } from '../../helpers/wallet';
import { CONTRACTS } from '../../helpers/constants';
import { LimitOrderType } from '../../helpers/dex';
import {
  getEventAttributesFromTx,
  getEventAttribute,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import {
  MsgCreateDenom,
  MsgMint,
} from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/tx';

describe('Neutron / dex module (grpc contract)', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let neutronWallet: Wallet;
  let contractAddress: string;
  let activeTrancheKey: string;
  let inactiveTrancheKey: string;
  const multiHopSwapDenoms: any[] = [];

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    neutronWallet = testState.wallets.neutron.demo1;
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
  });

  describe('Instantiate dex grpc contract', () => {
    test('instantiate contract', async () => {
      contractAddress = await neutronClient.create(
        CONTRACTS.DEX_GRPC,
        {},
        'dex_grpc',
      );
    });
    test('send funds', async () => {
      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '100000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );

      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: 'uibcusdc', amount: '100000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );
    });
  });

  describe('DEX messages', () => {
    describe('Deposit', () => {
      test('Invalid pair', async () => {
        await expect(
          neutronClient.execute(contractAddress, {
            deposit: {
              receiver: contractAddress,
              token_a: 'untrn',
              token_b: 'untrn',
              amounts_a: ['100'], // uint128
              amounts_b: ['100'], // uint128
              tick_indexes_a_to_b: [1], // i64
              fees: [0], // u64
              options: [
                {
                  disable_autoswap: true,
                  fail_tx_on_bel: false,
                },
              ],
            },
          }),
        ).rejects.toThrowError(
          /tokenA cannot equal tokenB: Invalid token denom/,
        );
      });
      test('Valid pair', async () => {
        // pool denom - 'neutron/pool/0'
        const res = await neutronClient.execute(contractAddress, {
          deposit: {
            receiver: contractAddress,
            token_a: 'untrn',
            token_b: 'uibcusdc',
            amounts_a: ['1000'], // uint128
            amounts_b: ['1000'], // uint128
            tick_indexes_a_to_b: [1], // i64
            fees: [0], // u64
            options: [
              {
                disable_autoswap: true,
                fail_tx_on_bel: false,
              },
            ],
          },
        });
        expect(res.code).toEqual(0);
      });
    });
    describe('Withdrawal', () => {
      test('valid', async () => {
        // pool denom - 'neutron/pool/0'
        const res = await neutronClient.execute(contractAddress, {
          withdrawal: {
            receiver: contractAddress,
            token_a: 'untrn',
            token_b: 'uibcusdc',
            shares_to_remove: ['10'], // uint128
            tick_indexes_a_to_b: [1], // i64
            fees: [0], // u64
          },
        });
        expect(res.code).toEqual(0);
      });
    });
    describe('LimitOrder', () => {
      test('GOOD_TIL_CANCELLED', async () => {
        // Place order deep in orderbook. Doesn't change exisitng liquidity
        const res = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '1220000000000000000000000000',
            amount_in: '1000000',
            order_type: LimitOrderType.GoodTilCanceled,
            max_amount_out: '',
          },
        });
        expect(res.code).toEqual(0);
      });
      test('FILL_OR_KILL', async () => {
        // Trades through some of LP position at tick 1
        const res = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '740000000000000000000000000',
            amount_in: '100',
            order_type: LimitOrderType.FillOrKill,
            max_amount_out: '100',
          },
        });
        expect(res.code).toEqual(0);
      });
      test('IMMEDIATE_OR_CANCEL', async () => {
        // Trades through remainder of LP position at tick 1
        const res = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '998000000000000000000000000',
            amount_in: '1000000',
            order_type: LimitOrderType.ImmediateOrCancel,
            max_amount_out: '',
          },
        });
        expect(res.code).toEqual(0);
      });
      test('JUST_IN_TIME', async () => {
        // Place JIT deep in orderbook
        const res = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '1220000000000000000000000000',
            amount_in: '1000000',
            order_type: LimitOrderType.JustInTime,
            max_amount_out: '',
          },
        });
        expect(res.code).toEqual(0);
      });
      test('GOOD_TIL_TIME', async () => {
        const res = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '1002000000000000000000000000',
            amount_in: '10000000',
            expiration_time: secondsToRFC3339(
              Math.ceil(Date.now() / 1000) + 1000,
            ),
            order_type: LimitOrderType.GoodTilTime,
            max_amount_out: '',
          },
        });
        expect(res.code).toEqual(0);
      });
      test('GOOD_TIL_TIME expired', async () => {
        await expect(
          neutronClient.execute(contractAddress, {
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 0,
              limit_sell_price: '998000000000000000000000000',
              amount_in: '10000000',
              expiration_time: secondsToRFC3339(1),
              order_type: LimitOrderType.GoodTilTime,
              max_amount_out: '',
            },
          }),
        ).rejects.toThrowError(
          /Limit order expiration time must be greater than current block time/,
        );
      });
      test('unknown order type', async () => {
        await expect(
          neutronClient.execute(contractAddress, {
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 0,
              limit_sell_price: '1000100000000000000000000000',
              amount_in: '10',
              expiration_time: secondsToRFC3339(1),
              order_type: 10,
              max_amount_out: '',
            },
          }),
        ).rejects.toThrowError(
          /Only Limit orders of type GOOD_TIL_TIME can supply an ExpirationTime/,
        ); // checked on contract's level
      });
    });
    describe('Withdraw filled LO', () => {
      test('Withdraw', async () => {
        const res1 = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '818812575700000000000000000',
            amount_in: '1000000',
            order_type: LimitOrderType.GoodTilCanceled,
            max_amount_out: '',
          },
        });
        expect(res1.code).toEqual(0);
        activeTrancheKey = getEventAttributesFromTx(
          { tx_response: res1 },
          'TickUpdate',
          ['TrancheKey'],
        )[0]['TrancheKey'];
        // Trade through some of the GTC order
        const res2 = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'uibcusdc',
            token_out: 'untrn',
            tick_index_in_to_out: 0,
            limit_sell_price: '1100000000000000000000000000',
            amount_in: '1000',
            order_type: LimitOrderType.ImmediateOrCancel,
            max_amount_out: '',
          },
        });
        expect(res2.code).toEqual(0);

        const res3 = await neutronClient.execute(contractAddress, {
          withdraw_filled_limit_order: {
            tranche_key: activeTrancheKey,
          },
        });
        expect(res3.code).toEqual(0);
      });
    });
    describe('cancel LO', () => {
      test('success', async () => {
        // Cancel the limit order created above
        const res = await neutronClient.execute(contractAddress, {
          cancel_limit_order: {
            tranche_key: activeTrancheKey,
          },
        });
        expect(res.code).toEqual(0);
      });

      test('cancel failed', async () => {
        // Attempt to cancel again fails
        await expect(
          neutronClient.execute(contractAddress, {
            cancel_limit_order: {
              tranche_key: activeTrancheKey,
            },
          }),
        ).rejects.toThrowError(/Limit order tranche not found:/);
      });
    });
    describe('MultiHopSwap', () => {
      test('successful multihops', async () => {
        const numberDenoms = 10;
        const fee = {
          gas: '500000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1250' }],
        };
        for (let i = 0; i < numberDenoms; i++) {
          const data = await neutronClient.signAndBroadcast(
            [
              {
                typeUrl: MsgCreateDenom.typeUrl,
                value: MsgCreateDenom.fromPartial({
                  sender: neutronWallet.address,
                  subdenom: String(i),
                }),
              },
            ],
            fee,
          );
          const newTokenDenom = getEventAttribute(
            data.events,
            'create_denom',
            'new_token_denom',
          );

          await neutronClient.signAndBroadcast(
            [
              {
                typeUrl: MsgMint.typeUrl,
                value: MsgMint.fromPartial({
                  sender: neutronWallet.address,
                  amount: {
                    denom: newTokenDenom,
                    amount: '1000000',
                  },
                  mintToAddress: neutronWallet.address,
                }),
              },
            ],
            fee,
          );

          await neutronClient.sendTokens(
            contractAddress,
            [{ denom: newTokenDenom, amount: '1000000' }],
            {
              gas: '200000',
              amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
            },
          );
          multiHopSwapDenoms.push({
            denom: newTokenDenom,
            balance: 1000000,
          });
        }
        for (let i = 0; i < numberDenoms - 1; i++) {
          const res = await neutronClient.execute(contractAddress, {
            deposit: {
              receiver: contractAddress,
              token_a: multiHopSwapDenoms[i].denom,
              token_b: multiHopSwapDenoms[i + 1].denom,
              amounts_a: ['1000'], // uint128
              amounts_b: ['1000'], // uint128
              tick_indexes_a_to_b: [5], // i64
              fees: [0], // u64
              options: [
                {
                  disable_autoswap: true,
                  fail_tx_on_bel: false,
                },
              ],
            },
          });
          expect(res.code).toEqual(0);
        }
        const res = await neutronClient.execute(contractAddress, {
          multi_hop_swap: {
            receiver: contractAddress,
            routes: [
              {
                hops: [
                  multiHopSwapDenoms[0].denom,
                  multiHopSwapDenoms[1].denom,
                  multiHopSwapDenoms[2].denom,
                  multiHopSwapDenoms[3].denom,
                  multiHopSwapDenoms[4].denom,
                  multiHopSwapDenoms[5].denom,
                  multiHopSwapDenoms[6].denom,
                  multiHopSwapDenoms[7].denom,
                  multiHopSwapDenoms[8].denom,
                  multiHopSwapDenoms[9].denom,
                ],
              },
            ],
            amount_in: '100',
            exit_limit_price: '100000000000000000000000000',
            pick_best_route: true,
          },
        });
        expect(res.code).toEqual(0);
      });

      test('no route found', async () => {
        await expect(
          neutronClient.execute(contractAddress, {
            multi_hop_swap: {
              receiver: contractAddress,
              routes: [
                {
                  hops: [
                    multiHopSwapDenoms[0].denom,
                    multiHopSwapDenoms[9].denom,
                  ],
                },
              ],
              amount_in: '100',
              exit_limit_price: '100000000000000000000000000',
              pick_best_route: true,
            },
          }),
        ).rejects.toThrowError(
          /All multihop routes failed limitPrice check or had insufficient liquidity/,
        );
      });
    });
  });
  describe('DEX queries', () => {
    // SETUP FOR ALL QUERIES
    beforeAll(async () => {
      // create a new active tranche
      const res1 = await neutronClient.execute(contractAddress, {
        place_limit_order: {
          receiver: contractAddress,
          token_in: 'untrn',
          token_out: 'uibcusdc',
          tick_index_in_to_out: 0,
          limit_sell_price: '818812575700000000000000000',
          amount_in: '1000000',
          order_type: LimitOrderType.GoodTilCanceled,
          max_amount_out: '',
        },
      });
      activeTrancheKey = getEventAttributesFromTx(
        { tx_response: res1 },
        'TickUpdate',
        ['TrancheKey'],
      )[0]['TrancheKey'];

      // swap through a bit of it
      await neutronClient.execute(contractAddress, {
        place_limit_order: {
          receiver: contractAddress,
          token_in: 'uibcusdc',
          token_out: 'untrn',
          tick_index_in_to_out: 0,
          limit_sell_price: '1000000000000000000000000000',
          amount_in: '1000',
          order_type: LimitOrderType.ImmediateOrCancel,
          max_amount_out: '',
        },
      });

      // create an expired tranche
      const res2 = await neutronClient.execute(contractAddress, {
        place_limit_order: {
          receiver: contractAddress,
          token_in: 'untrn',
          token_out: 'uibcusdc',
          tick_index_in_to_out: 0,
          limit_sell_price: '7381675653600000000000000000',
          amount_in: '1000000',
          order_type: LimitOrderType.JustInTime,
          max_amount_out: '',
        },
      });
      inactiveTrancheKey = getEventAttributesFromTx(
        { tx_response: res2 },
        'TickUpdate',
        ['TrancheKey'],
      )[0]['TrancheKey'];
      // wait a few blocks to make sure JIT order expires
      await neutronClient.waitBlocks(2);
    });

    test('ParamsQuery', async () => {
      await neutronClient.queryContractSmart(contractAddress, {
        params: {},
      });
    });
    test('LimitOrderTrancheUserQuery', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        get_limit_order_tranche_user: {
          address: contractAddress,
          tranche_key: activeTrancheKey,
          calc_withdrawable_shares: true,
        },
      });
      expect(res.limit_order_tranche_user).toBeDefined();
    });
    test('LimitOrderTrancheUserAllQuery', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        all_limit_order_tranche_user: {},
      });
      expect(res.limit_order_tranche_user.length).toBeGreaterThan(0);
    });
    test('LimitOrderTrancheUserAllByAddressQuery', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        all_limit_order_tranche_user_by_address: {
          address: contractAddress,
        },
      });
      expect(res.limit_orders.length).toBeGreaterThan(0);
    });
    test('LimitOrderTrancheQuery', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        get_limit_order_tranche: {
          pair_id: 'uibcusdc<>untrn',
          tick_index: -1999,
          token_in: 'untrn',
          tranche_key: activeTrancheKey,
        },
      });
      expect(res.limit_order_tranche).toBeDefined();
    });
    test('invalid LimitOrderTrancheQuery', async () => {
      await expect(
        neutronClient.queryContractSmart(contractAddress, {
          get_limit_order_tranche: {
            pair_id: 'untrn<>notadenom',
            tick_index: -1999,
            token_in: 'untrn',
            tranche_key: activeTrancheKey,
          },
        }),
      ).rejects.toThrowError();
    });
    test('AllLimitOrderTranche', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        all_limit_order_tranche: {
          pair_id: 'uibcusdc<>untrn',
          token_in: 'untrn',
        },
      });
      expect(res.limit_order_tranche.length).toBeGreaterThan(0);
    });
    test('AllUserDeposits', async () => {
      const resp = await neutronClient.queryContractSmart(contractAddress, {
        all_user_deposits: {
          address: contractAddress,
          include_pool_data: true,
        },
      });
      expect(Number(resp.deposits[0].total_shares)).toBeGreaterThan(0);
      expect(Number(resp.deposits[0].pool.id)).toEqual(0);

      const respNoPoolData = await neutronClient.queryContractSmart(
        contractAddress,
        {
          all_user_deposits: {
            address: contractAddress,
            include_pool_data: false,
          },
        },
      );
      expect(respNoPoolData.deposits[0].total_shares).toEqual('');
      expect(respNoPoolData.deposits[0].pool).toBeNull();
    });
    test('AllTickLiquidity', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        all_tick_liquidity: {
          pair_id: 'uibcusdc<>untrn',
          token_in: 'untrn',
        },
      });
      expect(res.tick_liquidity.length).toBeGreaterThan(0);
    });
    test('InactiveLimitOrderTranche', async () => {
      await neutronClient.queryContractSmart(contractAddress, {
        get_inactive_limit_order_tranche: {
          pair_id: 'uibcusdc<>untrn',
          tick_index: 19991,
          token_in: 'untrn',
          tranche_key: inactiveTrancheKey,
        },
      });
    });
    test('AllInactiveLimitOrderTranche', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        all_inactive_limit_order_tranche: {},
      });
      expect(res.inactive_limit_order_tranche.length).toBeGreaterThan(0);
    });
    test('AllPoolReserves', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        all_pool_reserves: {
          pair_id: 'uibcusdc<>untrn',
          token_in: 'untrn',
        },
      });
      expect(res.pool_reserves.length).toBeGreaterThan(0);
    });
    test('PoolReserves', async () => {
      await neutronClient.queryContractSmart(contractAddress, {
        get_pool_reserves: {
          pair_id: 'uibcusdc<>untrn',
          tick_index: -1,
          token_in: 'untrn',
          fee: 0,
        },
      });
    });
    test.skip('EstimateMultiHopSwap', async () => {
      // TODO
      // await neutronClient.queryContractSmart(
      //   contractAddress,
      //   {
      //     params: {},
      //   },
      // );
    });
    test('EstimatePlaceLimitOrder', async () => {
      await neutronClient.queryContractSmart(contractAddress, {
        estimate_place_limit_order: {
          creator: contractAddress,
          receiver: contractAddress,
          token_in: 'untrn',
          token_out: 'uibcusdc',
          tick_index_in_to_out: 1,
          amount_in: '1000000',
          expiration_time: secondsToRFC3339(
            Math.ceil(Date.now() / 1000) + 1000,
          ),
          order_type: LimitOrderType.GoodTilTime,
          max_amount_out: '',
        },
      });
    });
    test('Pool', async () => {
      await neutronClient.queryContractSmart(contractAddress, {
        pool: { pair_id: 'uibcusdc<>untrn', tick_index: -1, fee: 0 },
      });
    });
    test('PoolByID', async () => {
      await neutronClient.queryContractSmart(contractAddress, {
        pool_by_id: { pool_id: 0 },
      });
    });
    test('PoolMetadata', async () => {
      await neutronClient.queryContractSmart(contractAddress, {
        get_pool_metadata: { id: 0 },
      });
    });
    test('AllPoolMetadata', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        all_pool_metadata: {},
      });
      expect(res.pool_metadata.length).toBeGreaterThan(0);
    });
    test('SimulateDeposit', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        simulate_deposit: {
          msg: {
            creator: contractAddress,
            receiver: contractAddress,
            token_a: 'untrn',
            token_b: 'uibcusdc',
            amounts_a: ['100'],
            amounts_b: ['0'],
            tick_indexes_a_to_b: ['0'],
            fees: ['1'],
            options: [{ disable_autoswap: true, fail_tx_on_bel: false }],
          },
        },
      });
      expect(res.resp.reserve0_deposited[0]).toBe('0');
      expect(res.resp.reserve1_deposited[0]).toBe('100');
      expect(res.resp.shares_issued[0].amount).toBe('100');
    });
    test('SimulateDeposit failed deposit', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        simulate_deposit: {
          msg: {
            creator: contractAddress,
            receiver: contractAddress,
            token_a: 'untrn',
            token_b: 'uibcusdc',
            amounts_a: ['0'],
            amounts_b: ['100'],
            tick_indexes_a_to_b: ['0'],
            fees: ['1'],
            options: [{ disable_autoswap: true, fail_tx_on_bel: false }],
          },
        },
      });
      expect(res.resp.failed_deposits[0].error).contains('deposit failed');
    });
    test('SimulateWithdrawal', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        simulate_withdrawal: {
          msg: {
            creator: contractAddress,
            receiver: contractAddress,
            token_a: 'untrn',
            token_b: 'uibcusdc',
            shares_to_remove: ['10'],
            tick_indexes_a_to_b: ['1'],
            fees: ['0'],
          },
        },
      });
      expect(res.resp.reserve1_withdrawn).toBe('10');
      expect(res.resp.shares_burned[0].amount).toBe('10');
    });
    test('SimulatePlaceLimitOrder', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        simulate_place_limit_order: {
          msg: {
            creator: contractAddress,
            receiver: contractAddress,
            token_in: 'uibcusdc',
            token_out: 'untrn',
            tick_index_in_to_out: '0',
            limit_sell_price: '1200000000000000000000000000',
            amount_in: '10000',
            order_type: LimitOrderType.FillOrKill.toString(),
            max_amount_out: '',
            min_average_sell_price: '',
          },
        },
      });
      expect(res.resp.taker_coin_out.amount).toBe('12212');
      expect(res.resp.taker_coin_in.amount).toBe('10000');
      expect(res.resp.coin_in.amount).toBe('10000');
    }),
      test('SimulateWithdrawFilledLimitOrder', async () => {
        const res = await neutronClient.queryContractSmart(contractAddress, {
          simulate_withdraw_filled_limit_order: {
            msg: {
              creator: contractAddress,
              tranche_key: activeTrancheKey,
            },
          },
        });
        expect(res.resp.taker_coin_out.amount).toBe('998');
        expect(res.resp.maker_coin_out.amount).toBe('0');
      });
    test('SimulateCancelLimitOrder', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        simulate_cancel_limit_order: {
          msg: {
            creator: contractAddress,
            tranche_key: activeTrancheKey,
          },
        },
      });
      expect(res.resp.taker_coin_out.amount).toBe('998');
      expect(res.resp.maker_coin_out.amount).toBe('998779');
    });
    test('SimulateMultiHopSwap', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        simulate_multi_hop_swap: {
          msg: {
            creator: contractAddress,
            receiver: contractAddress,
            routes: [
              {
                hops: [
                  multiHopSwapDenoms[0].denom,
                  multiHopSwapDenoms[1].denom,
                  multiHopSwapDenoms[2].denom,
                  multiHopSwapDenoms[3].denom,
                  multiHopSwapDenoms[4].denom,
                  multiHopSwapDenoms[5].denom,
                  multiHopSwapDenoms[6].denom,
                  multiHopSwapDenoms[7].denom,
                  multiHopSwapDenoms[8].denom,
                  multiHopSwapDenoms[9].denom,
                ],
              },
            ],
            amount_in: '100',
            exit_limit_price: '100000000000000000000000000',
            pick_best_route: true,
          },
        },
      });
      expect(res.resp.coin_out.amount).toBe('91');
      expect(res.resp.route.hops.length).toBe(10);
    });
  });
});

function secondsToRFC3339(seconds: number): string {
  // Convert seconds to milliseconds and create a Date object
  const date = new Date(seconds * 1000);

  // Get individual components of the date
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const secondsString = String(date.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

  // Construct the RFC3339 string
  const rfc3339 = `${year}-${month}-${day}T${hours}:${minutes}:${secondsString}.${milliseconds}Z`;

  return rfc3339;
}
