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

const getQueryTransfersResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  recipient: AccAddress,
) =>
  cm.queryContract<{
    transfers: {
      recipient: string;
      sender: string;
      denom: string;
      amount: string;
    }[];
  }>(contractAddress, {
    get_recipient_txs: {
      recipient: recipient.toString(),
    },
  });

const validateQueryRegistration = (
  res: InlineResponse20075TxResponse,
  connectionId: string,
  zoneId: string,
  updatePeriod: number,
  queryType: string,
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
  expect(attributes.query_type).toEqual(queryType);
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
  validateQueryRegistration(res, connectionId, zoneId, updatePeriod, 'kv');
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
  validateQueryRegistration(res, connectionId, zoneId, updatePeriod, 'kv');
};

const registerTransfersQuery = async (
  cm: CosmosWrapper,
  contractAddress: string,
  zoneId: string,
  connectionId: string,
  updatePeriod: number,
  recipient: AccAddress,
  minHeight: number,
) => {
  const res = await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_transfers_query: {
        zone_id: zoneId,
        connection_id: connectionId,
        update_period: updatePeriod,
        recipient: recipient.toString(),
        min_height: minHeight.toString(),
      },
    }),
  );
  validateQueryRegistration(res, connectionId, zoneId, updatePeriod, 'tx');
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
  let transferRecipient: AccAddress;

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
      4: { updatePeriod: 3, key: '' },
    };
    transferRecipient = AccAddress.fromString(
      'neutron1fj6yqrkpw6fmp7f7jhj57dujfpwal4m25dafzx',
    );
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

    test('register icq #4: transfers', async () => {
      await registerTransfersQuery(
        cm[1],
        contractAddress,
        testState.sdk2.chainID,
        connectionId,
        query[4].updatePeriod,
        transferRecipient,
        1,
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

    test('get registered icq #4: transfers', async () => {
      // since this is a tx query, waiting for `last_submitted_result_local_height` and
      // `last_submitted_result_remote_height` to update makes zero sense
      const queryResult = await getRegisteredQueryResult(
        cm[1],
        contractAddress,
        4,
      );
      expect(queryResult.registered_query.id).toEqual(4);
      expect(queryResult.registered_query.keys.length).toEqual(0);
      expect(queryResult.registered_query.query_type).toEqual('tx');
      expect(
        JSON.parse(queryResult.registered_query.transactions_filter),
      ).toEqual([
        {
          field: 'transfer.recipient',
          op: 'Eq',
          value: transferRecipient.toString(),
        },
        {
          field: 'tx.height',
          op: 'Gte',
          value: 1,
        },
      ]);
      expect(queryResult.registered_query.zone_id).toEqual(
        testState.sdk2.chainID,
      );
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
      expect(queryResult.registered_query.update_period).toEqual(
        query[4].updatePeriod,
      );
      expect(
        queryResult.registered_query.last_submitted_result_local_height,
      ).toEqual(0);
      expect(
        queryResult.registered_query.last_submitted_result_remote_height,
      ).toEqual(0);
    });

    test("registered icq #5 doesn't exist", async () => {
      await expect(
        getRegisteredQueryResult(cm[1], contractAddress, 5),
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

    test('perform icq #4: transfers', async () => {
      const queryResult = await getQueryTransfersResult(
        cm[1],
        contractAddress,
        transferRecipient,
      );
      expect(queryResult.transfers.length).toEqual(0);
    });

    test('icq #4 updates results correctly: transfers', async () => {
      await cm[2].msgSend(transferRecipient.toString(), '4000');
      await cm[2].msgSend(transferRecipient.toString(), '5000');
      await wait((query[4].updatePeriod + 1) * BLOCK_TIME);
      const queryResult = await getQueryTransfersResult(
        cm[1],
        contractAddress,
        transferRecipient,
      );
      // order is not guaranteed, sorting just for ease of further comparison
      queryResult.transfers.sort((a, b) => +a.amount - +b.amount);
      expect(queryResult.transfers.length).toEqual(2);
      expect(queryResult.transfers[0]).toEqual({
        recipient: transferRecipient.toString(),
        sender: cm[2].wallet.address.toString(),
        denom: cm[2].denom,
        amount: '4000',
      });
      expect(queryResult.transfers[1]).toEqual({
        recipient: transferRecipient.toString(),
        sender: cm[2].wallet.address.toString(),
        denom: cm[2].denom,
        amount: '5000',
      });
    });
  });

  // In this test suite we aim to ensure contract state gets correctly reverted
  // if tx query callback handler fails. We achieve this through toggleable
  // mock in aforementioned handler. When this mock is enabled, contract will
  // attempt to corrupt its state and then return error. These tests check that
  // state never gets corrupted.
  describe("Test 'tx' interchain query rollback", () => {
    test('enable mock', async () => {
      await cm[1].executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_set_transfers_query_mock: {
            recipient: transferRecipient.toString(),
            amount: '6000',
          },
        }),
      );
    });

    test("mock doesn't add new transfers by itself", async () => {
      await wait((query[4].updatePeriod + 1) * BLOCK_TIME);
      const queryResult = await getQueryTransfersResult(
        cm[1],
        contractAddress,
        transferRecipient,
      );
      expect(queryResult.transfers.length).toEqual(2);
    });

    test("mock doesn't let new transfers in", async () => {
      await cm[2].msgSend(transferRecipient.toString(), '7000');
      await wait((query[4].updatePeriod + 1) * BLOCK_TIME);
      const queryResult = await getQueryTransfersResult(
        cm[1],
        contractAddress,
        transferRecipient,
      );
      expect(queryResult.transfers.length).toEqual(2);
    });

    test('disable mock', async () => {
      await cm[1].executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_unset_transfers_query_mock: {},
        }),
      );
    });

    test('now new transfer finally arrives', async () => {
      await wait((query[4].updatePeriod + 1) * BLOCK_TIME);
      const queryResult = await getQueryTransfersResult(
        cm[1],
        contractAddress,
        transferRecipient,
      );
      expect(queryResult.transfers.length).toEqual(3);
      expect(queryResult.transfers[2]).toEqual({
        recipient: transferRecipient.toString(),
        sender: cm[2].wallet.address.toString(),
        denom: cm[2].denom,
        amount: '7000',
      });
    });
  });

  describe("Test 'kv' interchain query rollback", () => {
    test("'kv' callbacks are not being executed on 'tx' queries", async () => {
      const res = await getKvCallbackStatus(cm[1], contractAddress, 4);
      expect(res.last_update_height).toEqual(0);
    });

    test("'kv' callbacks are being executed in 'kv' queries", async () => {
      const resPrev = await Promise.all(
        [1, 2, 3].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
      );
      // XXX: for some reason, I have to wait for a really long time here
      await wait(
        max([1, 2, 3].map((i) => query[i].updatePeriod)) * 3 * BLOCK_TIME,
      );
      const res = await Promise.all(
        [1, 2, 3].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
      );
      for (const i in res) {
        expect(resPrev[i].last_update_height).toBeLessThan(
          res[i].last_update_height,
        );
      }
    });

    test('enable mock', async () => {
      await cm[1].executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_set_kv_query_mock: {},
        }),
      );
    });

    test("'kv' callbacks have stopped updating, contract state is not corrupted", async () => {
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

    test("now 'kv' callbacks work again", async () => {
      const resPrev = await Promise.all(
        [1, 2, 3].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
      );
      // XXX: for some reason, I have to wait for a really long time here
      await wait(
        max([1, 2, 3].map((i) => query[i].updatePeriod)) * 3 * BLOCK_TIME,
      );
      const res = await Promise.all(
        [1, 2, 3].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
      );
      for (const i in res) {
        expect(resPrev[i].last_update_height).toBeLessThan(
          res[i].last_update_height,
        );
      }
    });
  });
});
