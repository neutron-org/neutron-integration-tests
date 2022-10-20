import { rest } from '@cosmos-client/core';
import { CosmosWrapper, COSMOS_DENOM, NEUTRON_DENOM } from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { getRemoteHeight, waitBlocks } from '../helpers/wait';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { CosmosSDK } from '@cosmos-client/core/cjs/sdk';
import { max } from 'lodash';
import {
  getRegisteredQuery,
  waitForICQResultWithRemoteHeight,
} from '../helpers/icq';

const getKvCallbackStatus = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    last_update_height: number;
  }>(contractAddress, {
    kv_callback_stats: {
      query_id: queryId,
    },
  });

const watchForKvCallbackUpdates = async (
  neutronCm: CosmosWrapper,
  targetCm: CosmosWrapper,
  contractAddress: string,
  queryIds: number[],
) => {
  const statusPrev = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(neutronCm, contractAddress, i)),
  );
  const targetHeight = await getRemoteHeight(targetCm.sdk);
  await Promise.all(
    queryIds.map((i) =>
      waitForICQResultWithRemoteHeight(
        neutronCm,
        contractAddress,
        i,
        targetHeight,
      ),
    ),
  );
  const status = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(neutronCm, contractAddress, i)),
  );
  for (const i in status) {
    expect(statusPrev[i].last_update_height).toBeLessThan(
      status[i].last_update_height,
    );
  }
};

const getQueryBalanceResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    balances: {
      coins: {
        denom: string;
        amount: string;
      }[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    balance: {
      query_id: queryId,
    },
  });

const getQueryDelegatorDelegationsResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    delegations: {
      delegator: string;
      validator: string;
      amount: {
        denom: string;
        amount: string;
      };
    }[];
    last_submitted_local_height: number;
  }>(contractAddress, {
    get_delegations: {
      query_id: queryId,
    },
  });

const registerBalanceQuery = async (
  cm: CosmosWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  denom: string,
  addr: AccAddress,
) => {
  await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_balance_query: {
        connection_id: connectionId,
        denom: denom,
        addr: addr.toString(),
        update_period: updatePeriod,
      },
    }),
  );
};

const removeQuery = async (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) => {
  await cm.executeContract(
    contractAddress,
    JSON.stringify({
      remove_interchain_query: {
        query_id: queryId,
      },
    }),
  );
};

const registerDelegatorDelegationsQuery = async (
  cm: CosmosWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  delegator: AccAddress,
  validators: ValAddress[],
) => {
  await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_delegator_delegations_query: {
        delegator: delegator.toString(),
        validators: validators.map((valAddr) => valAddr.toString()),
        connection_id: connectionId,
        update_period: updatePeriod,
      },
    }),
  );
};

const validateBalanceQuery = async (
  neutronCm: CosmosWrapper,
  targetCm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
  address: AccAddress,
) => {
  const interchainQueryResult = await getQueryBalanceResult(
    neutronCm,
    contractAddress,
    queryId,
  );
  const directQueryResult = await rest.bank.allBalances(
    targetCm.sdk as CosmosSDK,
    address,
  );
  expect(interchainQueryResult.balances.coins).toEqual(
    directQueryResult.data.balances,
  );
};

describe('Neutron / Interchain KV Query', () => {
  const connectionId = 'connection-0';
  const updatePeriods: { [key: number]: number } = {
    2: 2,
    3: 4,
    4: 3,
  };
  let testState: TestStateLocalCosmosTestNet;
  let cm: { [key: number]: CosmosWrapper };
  let contractAddress =
    'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq';

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = {
      1: new CosmosWrapper(
        testState.sdk1,
        testState.wallets.neutron.demo1,
        NEUTRON_DENOM,
      ),
      2: new CosmosWrapper(
        testState.sdk2,
        testState.wallets.cosmos.demo2,
        COSMOS_DENOM,
      ),
    };
  });

  describe('Instantiate interchain queries contract', () => {
    let codeId: string;
    test('store contract', async () => {
      codeId = await cm[1].storeWasm('neutron_interchain_queries.wasm');
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test('instantiate contract', async () => {
      contractAddress = await cm[1].instantiate(
        codeId,
        '{}',
        'neutron_interchain_queries',
      );
      expect(contractAddress).toEqual(
        'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq',
      );
    });
  });

  describe('Register interchain queries', () => {
    describe('Deposit escrow for query', () => {
      test('should throw exception because of not enough deposit', async () => {
        try {
          await cm[1].executeContract(
            contractAddress,
            JSON.stringify({
              register_balance_query: {
                connection_id: connectionId,
                denom: cm[2].denom,
                addr: testState.wallets.cosmos.demo2.address.toString(),
                update_period: 10,
              },
            }),
          );
        } catch (err) {
          const error = err as Error;
          expect(error.message).toMatch(/0stake is smaller than 1000000stake/i);
        }
      });

      test('should escrow deposit', async () => {
        // Top up contract address before running query
        await cm[1].msgSend(contractAddress, '1000000');

        let balances = await cm[1].queryBalances(contractAddress);
        expect(balances.balances[0].amount).toEqual('1000000');

        await registerBalanceQuery(
          cm[1],
          contractAddress,
          connectionId,
          10,
          cm[2].denom,
          testState.wallets.cosmos.demo2.address,
        );

        balances = await cm[1].queryBalances(contractAddress);
        expect(balances.balances.length).toEqual(0);
      });
    });

    describe('Succesfully', () => {
      beforeEach(async () => {
        // Top up contract address before running query
        await cm[1].msgSend(contractAddress, '1000000');
      });

      test('register icq #2: balance', async () => {
        await registerBalanceQuery(
          cm[1],
          contractAddress,
          connectionId,
          updatePeriods[2],
          cm[2].denom,
          testState.wallets.cosmos.demo2.address,
        );
      });

      test('register icq #3: balance', async () => {
        await registerBalanceQuery(
          cm[1],
          contractAddress,
          connectionId,
          updatePeriods[3],
          cm[2].denom,
          testState.wallets.cosmos.val1.address,
        );
      });

      test('register icq #4: delegator delegations', async () => {
        await registerDelegatorDelegationsQuery(
          cm[1],
          contractAddress,
          connectionId,
          updatePeriods[4],
          testState.wallets.cosmos.demo2.address,
          [testState.wallets.cosmos.val1.address],
        );
      });
    });
  });

  describe('Get interchain queries', () => {
    test('get registered icq #2: balance', async () => {
      const queryId = 2;
      const queryResult = await getRegisteredQuery(
        cm[1],
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      // XXX: I could actually check that "key" is correctly derived from contractAddress,
      //      but this requires bech32 decoding/encoding shenanigans
      expect(queryResult.registered_query.keys.length).toEqual(1);
      expect(queryResult.registered_query.keys[0].path).toEqual('bank');
      expect(queryResult.registered_query.keys[0].key.length).toBeGreaterThan(
        0,
      );
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
      expect(queryResult.registered_query.update_period).toEqual(
        updatePeriods[queryId],
      );
    });

    test('get registered icq #3: balance', async () => {
      // in this test, we only focus on parts that are different
      const queryId = 3;
      const queryResult = await getRegisteredQuery(
        cm[1],
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.keys.length).toEqual(1);
      expect(queryResult.registered_query.update_period).toEqual(
        updatePeriods[queryId],
      );
    });

    test('get registered icq #4: delegator delegations', async () => {
      const queryId = 4;
      const queryResult = await getRegisteredQuery(
        cm[1],
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      // we expect three keys, 1 always + 2 per validator
      expect(queryResult.registered_query.keys.length).toEqual(3);
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
      expect(queryResult.registered_query.update_period).toEqual(
        updatePeriods[queryId],
      );
    });

    test("registered icq #5 doesn't exist", async () => {
      const queryId = 5;
      await expect(
        getRegisteredQuery(cm[1], contractAddress, queryId),
      ).rejects.toThrow();
    });
  });

  describe('Perform interchain queries', () => {
    test('perform icq #2: balance', async () => {
      // reduce balance of demo2 wallet
      const queryId = 2;
      const res = await cm[2].msgSend(
        testState.wallets.cosmos.rly2.address.toString(),
        '9000',
      );
      expect(res.code).toEqual(0);
      await waitForICQResultWithRemoteHeight(
        cm[1],
        contractAddress,
        queryId,
        await getRemoteHeight(cm[2].sdk),
      );
      await validateBalanceQuery(
        cm[1],
        cm[2],
        contractAddress,
        queryId,
        cm[2].wallet.address,
      );
    });

    test('perform icq #3: balance', async () => {
      // increase balance of val2 wallet
      const queryId = 3;
      const res = await cm[2].msgSend(
        testState.wallets.cosmos.val1.address.toAccAddress().toString(),
        '9000',
      );
      expect(res.code).toEqual(0);
      await waitForICQResultWithRemoteHeight(
        cm[1],
        contractAddress,
        queryId,
        await getRemoteHeight(cm[2].sdk),
      );
      await validateBalanceQuery(
        cm[1],
        cm[2],
        contractAddress,
        queryId,
        testState.wallets.cosmos.val1.address.toAccAddress(),
      );
    });

    // TODO: test this query with multiple validators, this is impossible right now
    //       because we only have one node per network in cosmopark
    test('perform icq #4: delegator delegations', async () => {
      const queryId = 4;
      await cm[2].msgDelegate(
        testState.wallets.cosmos.demo2.address.toString(),
        testState.wallets.cosmos.val1.address.toString(),
        '3000',
      );
      await waitForICQResultWithRemoteHeight(
        cm[1],
        contractAddress,
        queryId,
        await getRemoteHeight(cm[2].sdk),
      );
      const interchainQueryResult = await getQueryDelegatorDelegationsResult(
        cm[1],
        contractAddress,
        queryId,
      );
      expect(interchainQueryResult.delegations[0].amount.amount).toEqual(
        (3000).toString(),
      );
    });
  });

  // In this test suite we aim to ensure contract state gets correctly reverted
  // if tx query callback handler fails. We achieve this through toggleable
  // mock in aforementioned handler. When this mock is enabled, contract will
  // attempt to corrupt its state and then return error. These tests check that
  // state never gets corrupted.
  describe('Test icq rollback', () => {
    test('icq callbacks are being executed', async () => {
      await watchForKvCallbackUpdates(cm[1], cm[2], contractAddress, [2, 3, 4]);
    });

    test('enable mock', async () => {
      await cm[1].executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_set_kv_query_mock: {},
        }),
      );
    });

    test('callbacks are failing, but contract state is not corrupted', async () => {
      const start = await Promise.all(
        [2, 3, 4].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
      );
      for (let i = 0; i <= max(Object.values(updatePeriods)); ++i) {
        const res = await Promise.all(
          [2, 3, 4].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
        );
        for (const j of res) {
          expect(j).not.toEqual(0);
        }
        await waitBlocks(cm[1].sdk, 1);
      }
      const end = await Promise.all(
        [2, 3, 4].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
      );
      expect(start).toEqual(end);
    });

    test('disable mock', async () => {
      await cm[1].executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_unset_kv_query_mock: {},
        }),
      );
    });

    test('now callbacks work again', async () => {
      await watchForKvCallbackUpdates(cm[1], cm[2], contractAddress, [2, 3, 4]);
    });
  });

  describe('Remove interchain query', () => {
    test('remove icq #1', async () => {
      let balances = await cm[1].queryBalances(contractAddress);
      expect(balances.balances.length).toEqual(0);

      await removeQuery(cm[1], contractAddress, 1);

      balances = await cm[1].queryBalances(contractAddress);
      expect(balances.balances[0].amount).toEqual('1000000');
    });
  });
});
