import {
  CosmosWrapper,
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
} from '@neutron-org/neutronjsplus/dist/dex';

const config = require('../../config.json');

describe('Neutron / dex module (stargate contract)', () => {
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

  describe('Instantiate dex stargate contract', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(NeutronContract.DEX_STARGATE);
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
                    disable_autoswap: true,
                  },
                ],
              },
            }),
          ),
        ).rejects.toThrowError(
          /tokenA cannot equal tokenB: Invalid token denom/,
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
                  disable_autoswap: true,
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
              limit_sell_price: '1.22',
              amount_in: '1000000',
              order_type: LimitOrderType.GoodTilCanceled,
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
              tick_index_in_to_out: 0,
              limit_sell_price: '0.74',
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
              limit_sell_price: '0.998',
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
              limit_sell_price: '1.22',
              amount_in: '1000000',
              order_type: LimitOrderType.JustInTime,
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('GOOD_TIL_TIME', async () => {
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 0,
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
                order_type: 10,
              },
            }),
          ),
        ).rejects.toThrowError(/invalid numeric value for LimitOrderType/); // checked on contract's level
      });
    });
    describe('Withdraw filled LO', () => {
      test('Withdraw', async () => {
        const res1 = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 0,
              limit_sell_price: '0.8188125757',
              amount_in: '1000000',
              order_type: LimitOrderType.GoodTilCanceled,
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
              tick_index_in_to_out: 0,
              limit_sell_price: '1.1',
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

    describe('MultiHopSwap', () => {
      // TBD
      // console.log(trancheKey);
      // test('MultiHopSwap', async () => {
      //   await expect(
      //     neutronAccount.executeContract(
      //       contractAddress,
      //       JSON.stringify({
      //         cancel_limit_order: {
      //           tranche_key: trancheKey,
      //         },
      //       }),
      //     ),
      //   ).rejects.toThrowError(
      //     /No active limit found. It does not exist or has already been filled/,
      //   );
      // });
    });
  });
  describe('DEX queries', () => {
    // SETUP FOR ALL QUERIES
    beforeAll(async () => {
      // create a new active tranche
      const res1 = await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '0.8188125757',
            amount_in: '1000000',
            order_type: LimitOrderType.GoodTilCanceled,
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
            tick_index_in_to_out: 0,
            limit_sell_price: '7.3816756536',
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
            get_limit_order_tranche_user: {
              address: contractAddress,
              tranche_key: activeTrancheKey,
              calc_withdrawable_shares: true,
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
            all_limit_order_tranche_user: {},
          },
        );
      expect(res.limit_order_tranche_user.length).toBeGreaterThan(0);
    });
    test('LimitOrderTrancheUserAllByAddressQuery', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllUserLimitOrdersResponse>(
          contractAddress,
          {
            all_limit_order_tranche_user_by_address: {
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
            get_limit_order_tranche: {
              pair_id: 'uibcusdc<>untrn',
              tick_index: -1999,
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
            get_limit_order_tranche: {
              pair_id: 'untrn<>notadenom',
              tick_index: -1999,
              token_in: 'untrn',
              tranche_key: activeTrancheKey,
            },
          },
        ),
      ).rejects.toThrowError();
    });
    test('AllLimitOrderTranche', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllLimitOrderTrancheResponse>(
          contractAddress,
          {
            all_limit_order_tranche: {
              pair_id: 'uibcusdc<>untrn',
              token_in: 'untrn',
            },
          },
        );
      expect(res.limit_order_tranche.length).toBeGreaterThan(0);
    });
    test('AllUserDeposits', async () => {
      const resp =
        await neutronAccount.chain.queryContract<AllUserDepositsResponse>(
          contractAddress,
          {
            all_user_deposits: {
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
            all_user_deposits: {
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
            all_tick_liquidity: {
              pair_id: 'uibcusdc<>untrn',
              token_in: 'untrn',
            },
          },
        );
      expect(res.tick_liquidity.length).toBeGreaterThan(0);
    });
    test('InactiveLimitOrderTranche', async () => {
      await neutronAccount.chain.queryContract<InactiveLimitOrderTrancheResponse>(
        contractAddress,
        {
          get_inactive_limit_order_tranche: {
            pair_id: 'uibcusdc<>untrn',
            tick_index: 19991,
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
            all_inactive_limit_order_tranche: {},
          },
        );
      expect(res.inactive_limit_order_tranche.length).toBeGreaterThan(0);
    });
    test('AllPoolReserves', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllPoolReservesResponse>(
          contractAddress,
          {
            all_pool_reserves: {
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
          get_pool_reserves: {
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
            amount_in: '1000000',
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
          get_pool_metadata: { id: 0 },
        },
      );
    });
    test('AllPoolMetadata', async () => {
      const res =
        await neutronAccount.chain.queryContract<AllPoolMetadataResponse>(
          contractAddress,
          {
            all_pool_metadata: {},
          },
        );
      expect(res.pool_metadata.length).toBeGreaterThan(0);
    });
  });
});
