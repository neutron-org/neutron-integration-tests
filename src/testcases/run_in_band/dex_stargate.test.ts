import {
  CosmosWrapper,
  getEventAttributesFromTx,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { NeutronContract } from '../../helpers/types';
import { CodeId } from '../../types';
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
} from '../../helpers/dex';

describe('Neutron / IBC hooks', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let contractAddress: string;
  let trancheKeyToWithdraw: string;
  let trancheKeyToQuery: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
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

  describe('Instantiate hooks ibc transfer contract', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(NeutronContract.DEX_STARGATE);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate contract', async () => {
      contractAddress = (
        await neutronAccount.instantiateContract(codeId, '{}', 'dex_dev')
      )[0]._contract_address;
      console.log(contractAddress);

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
        ).rejects.toThrowError(/untrn<>untrn: Invalid token pair/);
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
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 1,
              amount_in: '10',
              order_type: LimitOrderType.GoodTilCanceled,
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('FILL_OR_KILL', async () => {
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 1,
              amount_in: '10',
              order_type: LimitOrderType.FillOrKill,
              max_amount_out: '100',
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('IMMEDIATE_OR_CANCEL', async () => {
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 1,
              amount_in: '10',
              order_type: LimitOrderType.ImmediateOrCancel,
              max_amount_out: '100',
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('JUST_IN_TIME', async () => {
        let res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 1,
              amount_in: '10',
              order_type: LimitOrderType.JustInTime,
            },
          }),
        );
        expect(res.code).toEqual(0);
        trancheKeyToWithdraw = getEventAttributesFromTx(
          { tx_response: res },
          'TickUpdate',
          ['TrancheKey'],
        )[0]['TrancheKey'];
        res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 2,
              amount_in: '10',
              order_type: LimitOrderType.JustInTime,
            },
          }),
        );
        expect(res.code).toEqual(0);
        trancheKeyToQuery = getEventAttributesFromTx(
          { tx_response: res },
          'TickUpdate',
          ['TrancheKey'],
        )[0]['TrancheKey'];
      });
      test('GOOD_TIL_TIME', async () => {
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            place_limit_order: {
              receiver: contractAddress,
              token_in: 'untrn',
              token_out: 'uibcusdc',
              tick_index_in_to_out: 1,
              amount_in: '10',
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
                tick_index_in_to_out: 1,
                amount_in: '10',
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
                tick_index_in_to_out: 1,
                amount_in: '10',
                expiration_time: 1,
                order_type: 10,
              },
            }),
          ),
        ).rejects.toThrowError(/invalid numeric value for LimitOrderType/); // checked on contract's level
      });
    });
    describe('Withdraw filled lo', () => {
      console.log(trancheKeyToWithdraw);
      test('Withdraw', async () => {
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            withdraw_filled_limit_order: {
              tranche_key: trancheKeyToWithdraw,
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
    });
    describe('cancel lo', () => {
      console.log(trancheKeyToWithdraw);
      test('cancel failed', async () => {
        await expect(
          neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              cancel_limit_order: {
                tranche_key: trancheKeyToWithdraw,
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
              tranche_key: trancheKeyToWithdraw,
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
              tick_index: -2,
              token_in: 'untrn',
              tranche_key: trancheKeyToQuery,
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
              tick_index: 1,
              token_in: 'untrn',
              tranche_key: trancheKeyToWithdraw,
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
          all_limit_order_tranche: {
            pair_id: 'uibcusdc<>untrn',
            token_in: 'untrn',
          },
        },
      );
      // TODO: add tranche for tests
      // expect(res.limit_order_tranche.length).toBeGreaterThan(0);
    });
    test('AllUserDeposits', async () => {
      await neutronAccount.chain.queryContract<AllUserDepositsResponse>(
        contractAddress,
        {
          all_user_deposits: { address: contractAddress },
        },
      );
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
            tick_index: -2,
            token_in: 'untrn',
            tranche_key: trancheKeyToQuery,
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
            amount_in: '10',
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
