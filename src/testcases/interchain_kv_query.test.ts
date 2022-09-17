import { rest } from '@cosmos-client/core';
import { CosmosWrapper } from '../helpers/cosmos';
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
  queries: { [key: number]: Query },
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

// TODO: throw away this type alltogether
type Query = {
  updatePeriod: number;
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
      1: { updatePeriod: 2 },
      2: { updatePeriod: 3 },
      3: { updatePeriod: 4 },
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
        connectionId,
        query[3].updatePeriod,
        testState.wallets.demo2.address,
        [testState.wallets.val2.address],
      );
    });
  });

  describe('Get interchain queries', () => {
    test('get registered icq #1: balance', async () => {
      const queryResult = await getRegisteredQuery(cm[1], contractAddress, 1);
      expect(queryResult.registered_query.id).toEqual(1);
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
        query[1].updatePeriod,
      );
    });

    test('get registered icq #2: balance', async () => {
      // in this test, we only focus on parts that are different
      const queryResult = await getRegisteredQuery(cm[1], contractAddress, 2);
      expect(queryResult.registered_query.id).toEqual(2);
      expect(queryResult.registered_query.keys.length).toEqual(1);
      expect(queryResult.registered_query.update_period).toEqual(
        query[2].updatePeriod,
      );
    });

    test('get registered icq #3: delegator delegations', async () => {
      const queryResult = await getRegisteredQuery(cm[1], contractAddress, 3);
      expect(queryResult.registered_query.id).toEqual(3);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      // we expect three keys, 1 always + 2 per validator
      expect(queryResult.registered_query.keys.length).toEqual(3);
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
      expect(queryResult.registered_query.update_period).toEqual(
        query[3].updatePeriod,
      );
    });

    test("registered icq #4 doesn't exist", async () => {
      await expect(
        getRegisteredQuery(cm[1], contractAddress, 4),
      ).rejects.toThrow();
    });
  });

  describe('Perform interchain queries', () => {
    test('perform icq #1: balance', async () => {
      // reduce balance of demo2 wallet
      const res = await cm[2].msgSend(
        testState.wallets.rly2.address.toString(),
        '9000',
      );
      expect(res.code).toEqual(0);
      await waitForICQResultWithRemoteHeight(
        cm[1],
        contractAddress,
        1,
        await getRemoteHeight(cm[2].sdk),
      );
      await validateBalanceQuery(
        cm[1],
        cm[2],
        contractAddress,
        1,
        cm[2].wallet.address,
      );
    });

    test('perform icq #2: balance', async () => {
      // increase balance of val2 wallet
      const res = await cm[2].msgSend(
        testState.wallets.val2.address.toAccAddress().toString(),
        '9000',
      );
      expect(res.code).toEqual(0);
      await waitForICQResultWithRemoteHeight(
        cm[1],
        contractAddress,
        2,
        await getRemoteHeight(cm[2].sdk),
      );
      await validateBalanceQuery(
        cm[1],
        cm[2],
        contractAddress,
        2,
        testState.wallets.val2.address.toAccAddress(),
      );
    });

    // TODO: test this query with multiple validators, this is impossible right now
    //       because we only have one node per network in cosmopark
    test('perform icq #3: delegator delegations', async () => {
      await cm[2].msgDelegate(
        testState.wallets.demo2.address.toString(),
        testState.wallets.val2.address.toString(),
        '3000',
      );
      await waitForICQResultWithRemoteHeight(
        cm[1],
        contractAddress,
        3,
        await getRemoteHeight(cm[2].sdk),
      );
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
      await watchForKvCallbackUpdates(
        cm[1],
        cm[2],
        contractAddress,
        query,
        [1, 2, 3],
      );
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
        i < max([1, 2, 3].map((i) => query[i].updatePeriod)) + 1;
        ++i
      ) {
        const res = await Promise.all(
          [1, 2, 3].map((i) => getKvCallbackStatus(cm[1], contractAddress, i)),
        );
        for (const j of res) {
          expect(j).not.toEqual(0);
        }
        await waitBlocks(cm[1].sdk, 1);
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
      await watchForKvCallbackUpdates(
        cm[1],
        cm[2],
        contractAddress,
        query,
        [1, 2, 3],
      );
    });
  });
});
