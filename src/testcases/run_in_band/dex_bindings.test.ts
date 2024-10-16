import { inject } from 'vitest';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import { LocalState } from '../../helpers/local_state';
import {
  MsgCreateDenom,
  MsgMint,
} from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/tx';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { Wallet } from '../../helpers/wallet';
import { CONTRACTS } from '../../helpers/constants';
import {
  getEventAttribute,
  getEventAttributesFromTx,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import config from '../../config.json';

describe('Neutron / dex module bindings', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let neutronWallet: Wallet;
  let contractAddress: string;
  let activeTrancheKey: string;
  let inactiveTrancheKey: string;
  const multiHopSwapDenoms: any[] = [];

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronWallet = testState.wallets.neutron.demo1;
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
  });

  describe('Instantiate dex binding contract', () => {
    test('instantiate contract', async () => {
      contractAddress = await neutronClient.create(CONTRACTS.DEX_DEV, {});
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
          /failed to execute \*types.MsgDeposit: failed to validate MsgDeposit: tokenA cannot equal tokenB: Invalid token denom/,
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
        // Place order deep in orderbook. Doesn't change existing liquidity
        const res = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '1.221390545',
            amount_in: '1000000',
            order_type: 'GOOD_TIL_CANCELLED',
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
            limit_sell_price: '0.74',
            tick_index_in_to_out: 0,
            amount_in: '100',
            order_type: 'FILL_OR_KILL',
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
            limit_sell_price: '0.98',
            amount_in: '1000000',
            order_type: 'IMMEDIATE_OR_CANCEL',
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
            limit_sell_price: '7.38',
            amount_in: '1000000',
            order_type: 'JUST_IN_TIME',
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
            limit_sell_price: '1.002',
            amount_in: '10000000',
            expiration_time: Math.ceil(Date.now() / 1000) + 1000,
            order_type: 'GOOD_TIL_TIME',
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
              limit_sell_price: '0.998',
              amount_in: '10000000',
              expiration_time: 1,
              order_type: 'GOOD_TIL_TIME',
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
              limit_sell_price: '1.0001',
              amount_in: '10',
              expiration_time: 1,
              order_type: 'unknown',
            },
          }),
        ).rejects.toThrowError(
          /unknown variant `unknown`, expected one of `GOOD_TIL_CANCELLED`, `FILL_OR_KILL`, `IMMEDIATE_OR_CANCEL`, `JUST_IN_TIME`, `GOOD_TIL_TIME`/,
        );
      });
      test('limit_sell_price scientific notation', async () => {
        const res = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '1.4564654E-4',
            amount_in: '100000',
            order_type: 'GOOD_TIL_CANCELLED',
          },
        });
        expect(res.code).toEqual(0);
      });
    });
    describe('Withdraw filled LO', () => {
      test('Withdraw', async () => {
        // place GTC LO at top of orderbook
        const res1 = await neutronClient.execute(contractAddress, {
          place_limit_order: {
            receiver: contractAddress,
            token_in: 'untrn',
            token_out: 'uibcusdc',
            tick_index_in_to_out: 0,
            limit_sell_price: '0.8188125757',
            amount_in: '1000000',
            order_type: 'GOOD_TIL_CANCELLED',
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
            limit_sell_price: '1.1',
            amount_in: '1000',
            order_type: 'IMMEDIATE_OR_CANCEL',
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
            exit_limit_price: '0.1',
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
              exit_limit_price: '0.1',
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
    beforeAll(async () => {
      // create a new active tranche
      const res1 = await neutronClient.execute(contractAddress, {
        place_limit_order: {
          receiver: contractAddress,
          token_in: 'untrn',
          token_out: 'uibcusdc',
          tick_index_in_to_out: 0,
          limit_sell_price: '0.8188125757',
          amount_in: '1000000',
          order_type: 'GOOD_TIL_CANCELLED',
        },
      });
      activeTrancheKey = getEventAttributesFromTx(
        { tx_response: res1 },
        'TickUpdate',
        ['TrancheKey'],
      )[0]['TrancheKey'];

      // create an expired tranche
      const res2 = await neutronClient.execute(contractAddress, {
        place_limit_order: {
          receiver: contractAddress,
          token_in: 'untrn',
          token_out: 'uibcusdc',
          tick_index_in_to_out: 0,
          limit_sell_price: '7.3816756536',
          amount_in: '1000000',
          order_type: 'JUST_IN_TIME',
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
        limit_order_tranche_user: {
          address: contractAddress,
          tranche_key: activeTrancheKey,
        },
      });
      expect(res.limit_order_tranche_user).toBeDefined();
    });
    test('LimitOrderTrancheUserAllQuery', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        limit_order_tranche_user_all: {},
      });
      expect(res.limit_order_tranche_user.length).toBeGreaterThan(0);
    });
    test('LimitOrderTrancheUserAllByAddressQuery', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        limit_order_tranche_user_all_by_address: {
          address: contractAddress,
        },
      });
      expect(res.limit_orders.length).toBeGreaterThan(0);
    });
    test('LimitOrderTrancheQuery', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        limit_order_tranche: {
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
          limit_order_tranche: {
            pair_id: 'untrn<>notadenom',
            tick_index: -1999,
            token_in: 'untrn',
            tranche_key: activeTrancheKey,
          },
        }),
      ).rejects.toThrowError();
    });
    test('AllLimitOrderTranche', async () => {
      // const res =
      await neutronClient.queryContractSmart(contractAddress, {
        limit_order_tranche_all: {
          pair_id: 'uibcusdc<>untrn',
          token_in: 'untrn',
        },
      });
      // TODO: add tranche for tests
      // expect(res.limit_order_tranche.length).toBeGreaterThan(0);
    });
    test('AllUserDeposits', async () => {
      const resp = await neutronClient.queryContractSmart(contractAddress, {
        user_deposit_all: {
          address: contractAddress,
          include_pool_data: true,
        },
      });
      expect(Number(resp.deposits[0].total_shares)).toBeGreaterThan(0);
      expect(Number(resp.deposits[0].pool.id)).toEqual(0);

      const respNoPoolData = await neutronClient.queryContractSmart(
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
      const res = await neutronClient.queryContractSmart(contractAddress, {
        tick_liquidity_all: {
          pair_id: 'uibcusdc<>untrn',
          token_in: 'untrn',
        },
      });
      expect(res.tick_liquidity.length).toBeGreaterThan(0);
    });
    test('InactiveLimitOrderTranche', async () => {
      await neutronClient.queryContractSmart(contractAddress, {
        inactive_limit_order_tranche: {
          pair_id: 'uibcusdc<>untrn',
          tick_index: 19991,
          token_in: 'untrn',
          tranche_key: inactiveTrancheKey,
        },
      });
    });
    test('AllInactiveLimitOrderTranche', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        inactive_limit_order_tranche_all: {},
      });
      expect(res.inactive_limit_order_tranche.length).toBeGreaterThan(0);
    });
    test('AllPoolReserves', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        pool_reserves_all: {
          pair_id: 'uibcusdc<>untrn',
          token_in: 'untrn',
        },
      });
      expect(res.pool_reserves.length).toBeGreaterThan(0);
    });
    test('PoolReserves', async () => {
      await neutronClient.queryContractSmart(contractAddress, {
        pool_reserves: {
          pair_id: 'uibcusdc<>untrn',
          tick_index: -1,
          token_in: 'untrn',
          fee: 0,
        },
      });
    });
    test.skip('EstimateMultiHopSwap', async () => {
      // TODO
      // await neutronWallet.queryContract(
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
          amount_in: '100000',
          expiration_time: Math.ceil(Date.now() / 1000) + 1000,
          order_type: 'GOOD_TIL_TIME',
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
        pool_metadata: { id: 0 },
      });
    });
    test('AllPoolMetadata', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        pool_metadata_all: {},
      });
      expect(res.pool_metadata.length).toBeGreaterThan(0);
    });
  });
});
