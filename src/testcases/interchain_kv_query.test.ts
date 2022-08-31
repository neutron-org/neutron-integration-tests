import { rest } from '@cosmos-client/core';
import {
  BLOCK_TIME,
  CosmosWrapper,
  getEventAttributesFromTx,
} from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { wait } from '../helpers/sleep';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { CosmosSDK } from '@cosmos-client/core/cjs/sdk';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { max } from 'lodash';

const getRegisteredQueryResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    registered_query: {
      id: number;
      owner: string;
      keys: {
        path: string;
        key: string;
      }[];
      query_type: string;
      transactions_filter: string;
      zone_id: string;
      connection_id: string;
      update_period: number;
      last_emitted_height: number;
      last_submitted_result_local_height: number;
      last_submitted_result_remote_height: number;
    };
  }>(contractAddress, {
    get_registered_query: {
      query_id: queryId,
    },
  });

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
  cm: CosmosWrapper,
  contractAddress: string,
  queries: { [key: number]: Query },
  queryIds: number[],
) => {
  const statusPrev = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(cm, contractAddress, i)),
  );
  // XXX: for some reason, I have to wait for a really long time here
  await wait(
    max(queryIds.map((i) => queries[i].updatePeriod)) * 3 * BLOCK_TIME,
  );
  const status = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(cm, contractAddress, i)),
  );
  for (const i in status) {
    expect(statusPrev[i].last_update_height).toBeLessThan(
      status[i].last_update_height,
    );
  }
};

const waitUntilQueryResultArrives = async (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
  numAttempts = 20,
) => {
  while (numAttempts > 0) {
    const res = await getRegisteredQueryResult(cm, contractAddress, queryId);
    numAttempts--;
    if (
      res.registered_query.last_submitted_result_local_height > 0 &&
      res.registered_query.last_submitted_result_remote_height > 0
    ) {
      return;
    }
    await wait(BLOCK_TIME);
  }
  expect(numAttempts).toBeGreaterThan(0);
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

const validateQueryRegistration = (
  res: InlineResponse20075TxResponse,
  connectionId: string,
  zoneId: string,
  updatePeriod: number,
) => {
  const attributes = getEventAttributesFromTx({ tx_response: res }, 'wasm', [
    // TODO: What about checking "kv_keys", too?
    'action',
    'connection_id',
    'zone_id',
    'query_type',
    'update_period',
  ]);
  expect(attributes.action).toEqual('register_interchain_query');
  expect(attributes.connection_id).toEqual(connectionId);
  expect(attributes.zone_id).toEqual(zoneId);
  expect(attributes.query_type).toEqual('kv');
  expect(attributes.update_period).toEqual(updatePeriod.toString());
};

const registerBalanceQuery = async (
  cm: CosmosWrapper,
  contractAddress: string,
  zoneId: string,
  connectionId: string,
  updatePeriod: number,
  denom: string,
  addr: AccAddress,
) => {
  const res = await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_balance_query: {
        connection_id: connectionId,
        denom: denom,
        addr: addr.toString(),
        update_period: updatePeriod,
        zone_id: zoneId,
      },
    }),
  );
  validateQueryRegistration(res, connectionId, zoneId, updatePeriod);
};

const registerDelegatorDelegationsQuery = async (
  cm: CosmosWrapper,
  contractAddress: string,
  zoneId: string,
  connectionId: string,
  updatePeriod: number,
  delegator: AccAddress,
  validators: ValAddress[],
) => {
  const res = await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_delegator_delegations_query: {
        delegator: delegator.toString(),
        validators: validators.map((valAddr) => valAddr.toString()),
        zone_id: zoneId,
        connection_id: connectionId,
        update_period: updatePeriod,
      },
    }),
  );
  validateQueryRegistration(res, connectionId, zoneId, updatePeriod);
};

const validateBalanceQuery = async (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
  sdk: CosmosSDK,
  address: AccAddress,
) => {
  const interchainQueryResult = await getQueryBalanceResult(
    cm,
    contractAddress,
    queryId,
  );
  const directQueryResult = await rest.bank.allBalances(sdk, address);
  expect(interchainQueryResult.balances.coins).toEqual(
    directQueryResult.data.balances,
  );
};

type Query = {
  updatePeriod: number;
  key: string;
};

describe('Neutron / Interchain KV Query', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: { [key: number]: CosmosWrapper };
  let contractAddress: string;
  let connectionId: string;
  let query: { [key: number]: Query };

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = {
      1: new CosmosWrapper(testState.sdk1, testState.wallets.demo1),
      2: new CosmosWrapper(testState.sdk2, testState.wallets.demo2),
    };
    connectionId = 'connection-0';
    query = {
      1: { updatePeriod: 2, key: '' },
      2: { updatePeriod: 3, key: '' },
      3: { updatePeriod: 4, key: '' },
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
    test('register icq #1: balance', async () => {
      await registerBalanceQuery(
        cm[1],
        contractAddress,
        testState.sdk2.chainID,
        connectionId,
        query[1].updatePeriod,
        cm[2].denom,
        testState.wallets.demo2.address,
      );
    });

    test('register icq #2: balance', async () => {
      await registerBalanceQuery(
        cm[1],
        contractAddress,
        testState.sdk2.chainID,
        connectionId,
        query[2].updatePeriod,
        cm[2].denom,
        testState.wallets.val2.address,
      );
    });

    test('register icq #3: delegator delegations', async () => {
      await registerDelegatorDelegationsQuery(
        cm[1],
        contractAddress,
        testState.sdk2.chainID,
        connectionId,
        query[3].updatePeriod,
        testState.wallets.demo2.address,
        [testState.wallets.val2.address],
      );
    });
  });

  describe('Get interchain queries', () => {
    test('get registered icq #1: balance', async () => {
      await waitUntilQueryResultArrives(cm[1], contractAddress, 1);
      const queryResult = await getRegisteredQueryResult(
        cm[1],
        contractAddress,
        1,
      );
      expect(queryResult.registered_query.id).toEqual(1);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      // XXX: I could actually check that "key" is correctly derived from contractAddress,
      //      but this requires bech32 decoding/encoding shenanigans
      expect(queryResult.registered_query.keys.length).toEqual(1);
      expect(queryResult.registered_query.keys[0].path).toEqual('bank');
      expect(queryResult.registered_query.keys[0].key.length).toBeGreaterThan(
        0,
      );
      query[1].key = queryResult.registered_query.keys[0].key;
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.zone_id).toEqual(
        testState.sdk2.chainID,
      );
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
      expect(queryResult.registered_query.update_period).toEqual(
        query[1].updatePeriod,
      );
      expect(queryResult.registered_query.last_emitted_height).toBeGreaterThan(
        0,
      );
      expect(
        queryResult.registered_query.last_submitted_result_remote_height,
      ).toBeGreaterThan(0);
      expect(
        queryResult.registered_query.last_submitted_result_local_height,
      ).toBeGreaterThan(0);
    });

    test('get registered icq #2: balance', async () => {
      // in this test, we only focus on parts that are different
      await waitUntilQueryResultArrives(cm[1], contractAddress, 2);
      const queryResult = await getRegisteredQueryResult(
        cm[1],
        contractAddress,
        2,
      );
      expect(queryResult.registered_query.id).toEqual(2);
      expect(queryResult.registered_query.keys.length).toEqual(1);
      expect(query[1].key).not.toEqual(
        queryResult.registered_query.keys[0].key,
      );
      expect(queryResult.registered_query.update_period).toEqual(
        query[2].updatePeriod,
      );
      expect(queryResult.registered_query.last_emitted_height).toBeGreaterThan(
        0,
      );
    });

    test('get registered icq #3: delegator delegations', async () => {
      await waitUntilQueryResultArrives(cm[1], contractAddress, 3);
      const queryResult = await getRegisteredQueryResult(
        cm[1],
        contractAddress,
        3,
      );
      expect(queryResult.registered_query.id).toEqual(3);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      // we expect three keys, 1 always + 2 per validator
      expect(queryResult.registered_query.keys.length).toEqual(3);
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.zone_id).toEqual(
        testState.sdk2.chainID,
      );
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
      expect(queryResult.registered_query.update_period).toEqual(
        query[3].updatePeriod,
      );
      expect(queryResult.registered_query.last_emitted_height).toBeGreaterThan(
        0,
      );
    });

    test("registered icq #4 doesn't exist", async () => {
      await expect(
        getRegisteredQueryResult(cm[1], contractAddress, 4),
      ).rejects.toThrow();
    });
  });

  describe('Perform interchain queries', () => {
    test('perform icq #1: balance', async () => {
      await validateBalanceQuery(
        cm[1],
        contractAddress,
        1,
        testState.sdk2 as CosmosSDK,
        testState.wallets.demo2.address.toAccAddress(),
      );
    });

    test('icq #1 updates results correctly: balance', async () => {
      // reduce balance of demo2 wallet
      const res = await cm[2].msgSend(
        testState.wallets.rly2.address.toString(),
        '9000',
      );
      expect(res.code).toEqual(0);
      await wait((query[1].updatePeriod + 1) * BLOCK_TIME);

      await validateBalanceQuery(
        cm[1],
        contractAddress,
        1,
        testState.sdk2 as CosmosSDK,
        cm[2].wallet.address,
      );
    });

    test('perform icq #2: balance', async () => {
      await validateBalanceQuery(
        cm[1],
        contractAddress,
        2,
        testState.sdk2 as CosmosSDK,
        testState.wallets.val2.address.toAccAddress(),
      );
    });

    test('icq #2 updates results correctly: balance', async () => {
      const res = await cm[2].msgSend(
        testState.wallets.val2.address.toAccAddress().toString(),
        '9000',
      );
      expect(res.code).toEqual(0);
      await wait((query[2].updatePeriod + 1) * BLOCK_TIME);

      await validateBalanceQuery(
        cm[1],
        contractAddress,
        2,
        testState.sdk2 as CosmosSDK,
        testState.wallets.val2.address.toAccAddress(),
      );
    });

    // TODO: test this query with multiple validators, this is impossible right now
    //       because we only have one node per network in cosmopark
    test('perform icq #3: delegator delegations', async () => {
      const delegations = (
        await getQueryDelegatorDelegationsResult(cm[1], contractAddress, 3)
      ).delegations;
      expect(delegations.length).toEqual(0);
    });

    test('icq #3 updates results correctly: delegator delegations', async () => {
      await cm[2].msgDelegate(
        testState.wallets.demo2.address.toString(),
        testState.wallets.val2.address.toString(),
        '3000',
      );
      await wait((query[3].updatePeriod + 1) * BLOCK_TIME);
      const interchainQueryResult = await getQueryDelegatorDelegationsResult(
        cm[1],
        contractAddress,
        3,
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
      await watchForKvCallbackUpdates(cm[1], contractAddress, query, [1, 2, 3]);
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
        [1, 2, 3].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
      );
      for (
        let i = 0;
        i < max([1, 2, 3].map((i) => query[i].updatePeriod)) * 3;
        ++i
      ) {
        const res = await Promise.all(
          [1, 2, 3].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
        );
        for (const j of res) {
          expect(j).not.toEqual(0);
        }
        await wait(BLOCK_TIME);
      }
      const end = await Promise.all(
        [1, 2, 3].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
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
      await watchForKvCallbackUpdates(cm[1], contractAddress, query, [1, 2, 3]);
    });
  });
});
