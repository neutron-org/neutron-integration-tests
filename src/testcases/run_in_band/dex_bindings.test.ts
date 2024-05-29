import {
  CosmosWrapper,
  getEventAttribute,
  getEventAttributesFromTx,
  NEUTRON_DENOM,
  WalletWrapper,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { NeutronContract, CodeId } from '@neutron-org/neutronjsplus/dist/types';
import {
  AllInactiveLimitOrderTrancheResponse,
  AllLimitOrderTrancheResponse,
  AllLimitOrderTrancheUserResponse,
  AllPoolMetadataResponse,
  AllPoolReservesResponse,
  AllTickLiquidityResponse,
  AllUserDepositsResponse,
  AllUserLimitOrdersResponse,
  EstimatePlaceLimitOrderResponse,
  InactiveLimitOrderTrancheResponse,
  LimitOrderTrancheResponse,
  LimitOrderTrancheUserResponse,
  LimitOrderType,
  ParamsResponse,
  PoolMetadataResponse,
  PoolReservesResponse,
  PoolResponse,
} from '@neutron-org/neutronjsplus/dist/dex_bindings';
import {
  msgCreateDenom,
  msgMintDenom,
} from '@neutron-org/neutronjsplus/dist/tokenfactory';

const config = require('../../config.json');

describe('Neutron / dex module bindings', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let contractAddress: string;
  let activeTrancheKey: string;
  let inactiveTrancheKey: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
  });

  describe('Instantiate dex binding contract', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(NeutronContract.DEX_DEV);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate contract', async () => {
      contractAddress = (
        await neutronAccount.instantiateContract(codeId, '{}', 'dex_dev')
      )[0]._contract_address;
      await neutronAccount.msgSend(contractAddress, {
        amount: '100000000',
        denom: 'untrn',
      });
      await neutronAccount.msgSend(contractAddress, {
        amount: '100000000',
        denom: 'uibcusdc',
      });
    });
  });

  describe('DEX messages', () => {
    describe('Deposit', () => {
      test('Invalid pair', async () => {
        await expect(
          neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
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
                    disable_swap: true,
                  },
                ],
              },
            }),
          ),
        ).rejects.toThrowError(
          /failed to execute \*types.MsgDeposit: untrn<>untrn: Invalid token pair/,
        );
      });
      test('Valid pair', async () => {
        // pool denom - 'neutron/pool/0'
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
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
                  disable_swap: true,
                },
              ],
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
    });
    describe('Withdrawal', () => {
      test('valid', async () => {
        // pool denom - 'neutron/pool/0'
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            withdrawal: {
              receiver: contractAddress,
              token_a: 'untrn',
              token_b: 'uibcusdc',
              shares_to_remove: ['10'], // uint128
              tick_indexes_a_to_b: [1], // i64
              fees: [0], // u64
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
    });
    describe('LimitOrder', () => {
      // enum LimitOrderType{
      //   GOOD_TIL_CANCELLED = 0;
      //   FILL_OR_KILL = 1;
      //   IMMEDIATE_OR_CANCEL = 2;
      //   JUST_IN_TIME = 3;
      //   GOOD_TIL_TIME = 4;
      // }
      test('GOOD_TIL_CANCELLED', async () => {
        // Place order deep in orderbook. Doesn't change exisitng liquidity
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 0,
              limit_sell_price: '1.221390545',
              amount_in: '1000000',
              order_type: LimitOrderType.GoodTilCancelled,
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('FILL_OR_KILL', async () => {
        // Trades through some of LP position at tick 1
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              limit_sell_price: '0.74',
              tick_index_in_to_out: 0,
              amount_in: '100',
              order_type: LimitOrderType.FillOrKill,
              max_amount_out: '100',
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('IMMEDIATE_OR_CANCEL', async () => {
        // Trades through remainder of LP position at tick 1
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 0,
              limit_sell_price: '1.002',
              amount_in: '1000000',
              order_type: LimitOrderType.ImmediateOrCancel,
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('JUST_IN_TIME', async () => {
        // Place JIT deep in orderbook
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 0,
              limit_sell_price: '7.38',
              amount_in: '1000000',
              order_type: LimitOrderType.JustInTime,
            },
          }),
        );
        expect(res.code).toEqual(0);
        test('GOOD_TIL_TIME', async () => {
          const res = await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              place_limit_order: {
                receiver: contractAddress,
                token_in: 'untrn',
                token_out: 'uibcusdc',
                limit_sell_price: '1.002',
                amount_in: '10000000',
                expiration_time: Math.ceil(Date.now() / 1000) + 1000,
                order_type: LimitOrderType.GoodTilTime,
              },
            }),
          );
          expect(res.code).toEqual(0);
        });
        test('GOOD_TIL_TIME expired', async () => {
          await expect(
            neutronAccount.executeContract(
              contractAddress,
              JSON.stringify({
                place_limit_order: {
                  receiver: contractAddress,
                  token_in: 'untrn',
                  token_out: 'uibcusdc',
                  tick_index_in_to_out: 0,
                  limit_sell_price: '0.998',
                  amount_in: '10000000',
                  expiration_time: 1,
                  order_type: LimitOrderType.GoodTilTime,
                },
              }),
            ),
          ).rejects.toThrowError(
            /Limit order expiration time must be greater than current block time/,
          );
        });
        test('unknown order type', async () => {
          await expect(
            neutronAccount.executeContract(
              contractAddress,
              JSON.stringify({
                place_limit_order: {
                  receiver: contractAddress,
                  token_in: 'untrn',
                  token_out: 'uibcusdc',
                  tick_index_in_to_out: 0,
                  limit_sell_price: '1.0001',
                  amount_in: '10',
                  expiration_time: 1,
                  order_type: 'unknown',
                },
              }),
            ),
          ).rejects.toThrowError(
            /unknown variant `unknown`, expected one of `GOOD_TIL_CANCELLED`, `FILL_OR_KILL`, `IMMEDIATE_OR_CANCEL`, `JUST_IN_TIME`, `GOOD_TIL_TIME`/,
          );
        });
        test('limit_sell_price scientific notation', async () => {
          const res = await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              place_limit_order: {
                receiver: contractAddress,
                token_in: 'untrn',
                token_out: 'uibcusdc',
                tick_index_in_to_out: 0,
                limit_sell_price: '1.4564654E-5',
                amount_in: '10',
                order_type: LimitOrderType.GoodTilCancelled,
              },
            }),
          );
          expect(res.code).toEqual(0);
        });
      });
      describe('Withdraw filled LO', () => {
        test('Withdraw', async () => {
          // place GTC LO at top of orderbook
          const res1 = await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              place_limit_order: {
                receiver: contractAddress,
                token_in: 'untrn',
                token_out: 'uibcusdc',
                tick_index_in_to_out: 200,
                amount_in: '1000000',
                order_type: LimitOrderType.GoodTilCancelled,
              },
            }),
          );
          expect(res1.code).toEqual(0);
          activeTrancheKey = getEventAttributesFromTx(
            { tx_response: res1 },
            'TickUpdate',
            ['TrancheKey'],
          )[0]['TrancheKey'];
          // Trade through some of the GTC order
          const res2 = await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              place_limit_order: {
                receiver: contractAddress,
                token_in: 'uibcusdc',
                token_out: 'untrn',
                tick_index_in_to_out: -10,
                amount_in: '1000',
                order_type: LimitOrderType.ImmediateOrCancel,
              },
            }),
          );
          expect(res2.code).toEqual(0);

          const res3 = await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              withdraw_filled_limit_order: {
                tranche_key: activeTrancheKey,
              },
            }),
          );
          expect(res3.code).toEqual(0);
        });
      });
      describe('cancel LO', () => {
        test('success', async () => {
          // Cancel the limit order created above
          const res = await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              cancel_limit_order: {
                tranche_key: activeTrancheKey,
              },
            }),
          );
          expect(res.code).toEqual(0);
        });

        test('cancel failed', async () => {
          // Attempt to cancel again fails
          await expect(
            neutronAccount.executeContract(
              contractAddress,
              JSON.stringify({
                cancel_limit_order: {
                  tranche_key: activeTrancheKey,
                },
              }),
            ),
          ).rejects.toThrowError(
            /No active limit found. It does not exist or has already been filled/,
          );
        });
      });
    });
    describe('MultiHopSwap', () => {
      const denoms: any[] = [];
      test('successfull multihops', async () => {
        const numberDenoms = 10;
        for (let i = 0; i < numberDenoms; i++) {
          const data = await msgCreateDenom(
            neutronAccount,
            neutronAccount.wallet.address.toString(),
            String(i),
          );

          const newTokenDenom = getEventAttribute(
            (data as any).events,
            'create_denom',
            'new_token_denom',
          );

          await msgMintDenom(
            neutronAccount,
            neutronAccount.wallet.address.toString(),
            {
              denom: newTokenDenom,
              amount: '1000000',
            },
          );
          await neutronAccount.msgSend(contractAddress, {
            amount: '1000000',
            denom: newTokenDenom,
          });
          denoms.push({
            denom: newTokenDenom,
            balance: 1000000,
          });
        }
        for (let i = 0; i < numberDenoms - 1; i++) {
          const res = await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              deposit: {
                receiver: contractAddress,
                token_a: denoms[i].denom,
                token_b: denoms[i + 1].denom,
                amounts_a: ['1000'], // uint128
                amounts_b: ['1000'], // uint128
                tick_indexes_a_to_b: [5], // i64
                fees: [0], // u64
                options: [
                  {
                    disable_swap: true,
                  },
                ],
              },
            }),
          );
          expect(res.code).toEqual(0);
        }
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            multi_hop_swap: {
              receiver: contractAddress,
              routes: [
                {
                  hops: [
                    denoms[0].denom,
                    denoms[1].denom,
                    denoms[2].denom,
                    denoms[3].denom,
                    denoms[4].denom,
                    denoms[5].denom,
                    denoms[6].denom,
                    denoms[7].denom,
                    denoms[8].denom,
                    denoms[9].denom,
                  ],
                },
              ],
              amount_in: '100',
              exit_limit_price: '0.1',
              pick_best_route: true,
            },
          }),
        );
        expect(res.code).toEqual(0);
      });

      test('no route found', async () => {
        await expect(
          neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              multi_hop_swap: {
                receiver: contractAddress,
                routes: [
                  {
                    hops: [denoms[0].denom, denoms[9].denom],
                  },
                ],
                amount_in: '100',
                exit_limit_price: '0.1',
                pick_best_route: true,
              },
            }),
          ),
        ).rejects.toThrowError(
          /All multihop routes failed limitPrice check or had insufficient liquidity/,
        );
      });
    });
  });
  describe('DEX queries', () => {
    beforeAll(async () => {
      // create a new active tranche
      const res1 = await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 200,
            amount_in: '1000000',
            order_type: LimitOrderType.GoodTilCancelled,
          },
        }),
      );
      activeTrancheKey = getEventAttributesFromTx(
        { tx_response: res1 },
        'TickUpdate',
        ['TrancheKey'],
      )[0]['TrancheKey'];

      // create an expired tranche
      const res2 = await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: -2000,
            amount_in: '1000000',
            order_type: LimitOrderType.JustInTime,
          },
        }),
      );
      inactiveTrancheKey = getEventAttributesFromTx(
        { tx_response: res2 },
        'TickUpdate',
        ['TrancheKey'],
      )[0]['TrancheKey'];
      // wait a few blocks to make sure JIT order expires
      await neutronChain.blockWaiter.waitBlocks(2);
    });
    test('ParamsQuery', async () => {
      await neutronAccount.chain.queryContract<ParamsResponse>(
        contractAddress,
        {
          params: {},
        },
      );
    });
    test('LimitOrderTrancheUserQuery', async () => {
      const res =
        await neutronAccount.chain.queryContract<LimitOrderTrancheUserResponse>(
          contractAddress,
          {
            limit_order_tranche_user: {
              address: contractAddress,
              tranche_key: activeTrancheKey,
            },
          },
        );
      expect(res.limit_order_tranche_user).toBeDefined();
    });
    test('LimitOrderTrancheUserAllQuery', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllLimitOrderTrancheUserResponse>(
          contractAddress,
          {
            limit_order_tranche_user_all: {},
          },
        );
      expect(res.limit_order_tranche_user.length).toBeGreaterThan(0);
    });
    test('LimitOrderTrancheUserAllByAddressQuery', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllUserLimitOrdersResponse>(
          contractAddress,
          {
            limit_order_tranche_user_all_by_address: {
              address: contractAddress,
            },
          },
        );
      expect(res.limit_orders.length).toBeGreaterThan(0);
    });
    test('LimitOrderTrancheQuery', async () => {
      const res =
        await neutronAccount.chain.queryContract<LimitOrderTrancheResponse>(
          contractAddress,
          {
            limit_order_tranche: {
              pair_id: 'uibcusdc<>untrn',
              tick_index: -200,
              token_in: 'untrn',
              tranche_key: activeTrancheKey,
            },
          },
        );
      expect(res.limit_order_tranche).toBeDefined();
    });
    test('invalid LimitOrderTrancheQuery', async () => {
      await expect(
        neutronAccount.chain.queryContract<LimitOrderTrancheResponse>(
          contractAddress,
          {
            limit_order_tranche: {
              pair_id: 'untrn<>notadenom',
              tick_index: 1,
              token_in: 'untrn',
              tranche_key: activeTrancheKey,
            },
          },
        ),
      ).rejects.toThrowError();
    });
    test('AllLimitOrderTranche', async () => {
      // const res =
      await neutronAccount.chain.queryContract<AllLimitOrderTrancheResponse>(
        contractAddress,
        {
          limit_order_tranche_all: {
            pair_id: 'uibcusdc<>untrn',
            token_in: 'untrn',
          },
        },
      );
      // TODO: add tranche for tests
      // expect(res.limit_order_tranche.length).toBeGreaterThan(0);
    });
    test('AllUserDeposits', async () => {
      const resp =
        await neutronAccount.chain.queryContract<AllUserDepositsResponse>(
          contractAddress,
          {
            user_deposit_all: {
              address: contractAddress,
              include_pool_data: true,
            },
          },
        );
      expect(Number(resp.deposits[0].total_shares)).toBeGreaterThan(0);
      expect(Number(resp.deposits[0].pool.id)).toEqual(0);

      const respNoPoolData =
        await neutronAccount.chain.queryContract<AllUserDepositsResponse>(
          contractAddress,
          {
            user_deposit_all: {
              address: contractAddress,
              include_pool_data: false,
            },
          },
        );
      expect(respNoPoolData.deposits[0].total_shares).toBeNull();
      expect(respNoPoolData.deposits[0].pool).toBeNull();
    });
    test('AllTickLiquidity', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllTickLiquidityResponse>(
          contractAddress,
          {
            tick_liquidity_all: {
              pair_id: 'uibcusdc<>untrn',
              token_in: 'untrn',
            },
          },
        );
      expect(res.tick_liquidity.length).toBeGreaterThan(0);
    });
    test('InactiveLimitOrderTranche', async () => {
      const res = await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '1.0001',
            amount_in: '1000000',
            order_type: LimitOrderType.JustInTime,
          },
        }),
      );
      let inactiveTrancheKey = getEventAttributesFromTx(
        { tx_response: res },
        'TickUpdate',
        ['TrancheKey'],
      )[0]['TrancheKey'];
      // wait a few blocks to make sure JIT order expires
      await neutronChain.blockWaiter.waitBlocks(2);
      await neutronAccount.chain.queryContract<InactiveLimitOrderTrancheResponse>(
        contractAddress,
        {
          inactive_limit_order_tranche: {
            pair_id: 'uibcusdc<>untrn',
            tick_index: 2000,
            token_in: 'untrn',
            tranche_key: inactiveTrancheKey,
          },
        },
      );
    });
    test('AllInactiveLimitOrderTranche', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllInactiveLimitOrderTrancheResponse>(
          contractAddress,
          {
            inactive_limit_order_tranche_all: {},
          },
        );
      expect(res.inactive_limit_order_tranche.length).toBeGreaterThan(0);
    });
    test('AllPoolReserves', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllPoolReservesResponse>(
          contractAddress,
          {
            pool_reserves_all: {
              pair_id: 'uibcusdc<>untrn',
              token_in: 'untrn',
            },
          },
        );
      expect(res.pool_reserves.length).toBeGreaterThan(0);
    });
    test('PoolReserves', async () => {
      await neutronAccount.chain.queryContract<PoolReservesResponse>(
        contractAddress,
        {
          pool_reserves: {
            pair_id: 'uibcusdc<>untrn',
            tick_index: -1,
            token_in: 'untrn',
            fee: 0,
          },
        },
      );
    });
    test.skip('EstimateMultiHopSwap', async () => {
      // TODO
      // await neutronAccount.chain.queryContract<EstimateMultiHopSwapResponse>(
      //   contractAddress,
      //   {
      //     params: {},
      //   },
      // );
    });
    test('EstimatePlaceLimitOrder', async () => {
      await neutronAccount.chain.queryContract<EstimatePlaceLimitOrderResponse>(
        contractAddress,
        {
          estimate_place_limit_order: {
            creator: contractAddress,
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 1,
            amount_in: '100000',
            expiration_time: Math.ceil(Date.now() / 1000) + 1000,
            order_type: LimitOrderType.GoodTilTime,
          },
        },
      );
    });
    test('Pool', async () => {
      await neutronAccount.chain.queryContract<PoolResponse>(contractAddress, {
        pool: { pair_id: 'uibcusdc<>untrn', tick_index: -1, fee: 0 },
      });
    });
    test('PoolByID', async () => {
      await neutronAccount.chain.queryContract<PoolResponse>(contractAddress, {
        pool_by_id: { pool_id: 0 },
      });
    });
    test('PoolMetadata', async () => {
      await neutronAccount.chain.queryContract<PoolMetadataResponse>(
        contractAddress,
        {
          pool_metadata: { id: 0 },
        },
      );
    });
    test('AllPoolMetadata', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllPoolMetadataResponse>(
          contractAddress,
          {
            pool_metadata_all: {},
          },
        );
      expect(res.pool_metadata.length).toBeGreaterThan(0);
    });
  });
});
