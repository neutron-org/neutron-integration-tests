import { CosmosWrapper, COSMOS_DENOM, NEUTRON_DENOM } from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { waitBlocks } from '../helpers/wait';
import {
  getRegisteredQuery,
  getUnsuccessfulTxs,
  postResubmitTxs,
  queryRecipientTxs,
  registerTransfersQuery,
  waitForTransfersAmount,
} from '../helpers/icq';

describe('Neutron / Interchain TX Query Resubmit', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let contractAddress: string;
  const connectionId = 'connection-0';

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cm2 = new CosmosWrapper(
      testState.sdk2,
      testState.wallets.cosmos.demo2,
      COSMOS_DENOM,
    );
  });

  describe('deploy contract', () => {
    let codeId: string;
    test('store contract', async () => {
      codeId = await cm.storeWasm('neutron_interchain_queries.wasm');
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test('instantiate contract', async () => {
      contractAddress = await cm.instantiate(
        codeId,
        '{}',
        'neutron_interchain_queries',
      );
      expect(contractAddress).toEqual(
        'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq',
      );
    });
  });

  describe('prepare ICQ for failing', () => {
    test('enable mock', async () => {
      await cm.executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_set_query_mock: {},
        }),
      );
    });
  });

  const addr1 = 'cosmos1fj6yqrkpw6fmp7f7jhj57dujfpwal4m2sj5tcp';
  const expectedIncomingTransfers = 5;
  const amountToAddr1_1 = 10000;
  const watchedAddr1: string = addr1;
  const query1UpdatePeriod = 4;

  describe('utilise single transfers query', () => {
    test('register transfers query', async () => {
      // Top up contract address before running query
      await cm.msgSend(contractAddress, '1000000');
      await registerTransfersQuery(
        cm,
        contractAddress,
        connectionId,
        query1UpdatePeriod,
        watchedAddr1,
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(cm, contractAddress, 1);
      expect(query.registered_query.id).toEqual(1);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual('tx');
      expect(query.registered_query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
        watchedAddr1 +
        '"}]',
      );
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query1UpdatePeriod);
    });

    test('check failed txs', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await cm2.msgSend(watchedAddr1, amountToAddr1_1.toString());
        expect(res.code).toEqual(0);
      }

      await waitBlocks(cm.sdk, 5);

      const txs = await getUnsuccessfulTxs(testState.icq_web_host);
      expect(txs.length).toEqual(5);
    });

    test('resubmit failed tx', async () => {
      await cm.executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_unset_query_mock: {},
        }),
      );

      const resubmit_txs = (
        await getUnsuccessfulTxs(testState.icq_web_host)
      ).map((tx) => ({ query_id: tx.query_id, hash: tx.submitted_tx_hash }));
      const resp = await postResubmitTxs(testState.icq_web_host, resubmit_txs);
      expect(resp.status).toEqual(200);

      await waitBlocks(cm.sdk, 20);

      await waitForTransfersAmount(
        cm,
        contractAddress,
        expectedIncomingTransfers,
        query1UpdatePeriod * 2,
      );

      const txs = await getUnsuccessfulTxs(testState.icq_web_host);
      expect(txs.length).toEqual(0);

      const deposits = await queryRecipientTxs(
        cm,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers.length).toEqual(5);
    });

    test('resubmit nonexistent failed tx', async () => {
      await expect(
        postResubmitTxs(testState.icq_web_host, [
          { query_id: 1, hash: 'nonexistent' },
        ]).catch((e) => {
          throw new Error(e.response.data);
        }),
      ).rejects.toThrow('no tx found with queryID=1 and hash=nonexistent');
    });
  });
});
