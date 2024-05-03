import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  COSMOS_DENOM,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { NeutronContract, CodeId } from '@neutron-org/neutronjsplus/dist/types';
import {
  getRegisteredQuery,
  getUnsuccessfulTxs,
  postResubmitTxs,
  queryRecipientTxs,
  registerTransfersQuery,
  waitForTransfersAmount,
} from '@neutron-org/neutronjsplus/dist/icq';
import {
  WalletWrapper,
  createWalletWrapper,
} from '@neutron-org/neutronjsplus/dist/wallet_wrapper';

const config = require('../../config.json');

describe('Neutron / Interchain TX Query Resubmit', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let gaiaChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let gaiaAccount: WalletWrapper;
  let contractAddress: string;
  const connectionId = 'connection-0';

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronAccount = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    gaiaChain = new CosmosWrapper(
      COSMOS_DENOM,
      testState.rest2,
      testState.rpc2,
    );
    gaiaAccount = await createWalletWrapper(
      gaiaChain,
      testState.wallets.qaCosmos.genQaWal1,
    );
  });

  describe('deploy contract', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(
        NeutronContract.INTERCHAIN_QUERIES,
      );
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate contract', async () => {
      contractAddress = await neutronAccount.instantiateContract(
        codeId,
        {},
        'neutron_interchain_queries',
      );
    });
  });

  describe('prepare ICQ for failing', () => {
    test('enable mock', async () => {
      await neutronAccount.executeContract(contractAddress, {
        integration_tests_set_query_mock: {},
      });
    });
  });

  const addrFirst = 'cosmos1fj6yqrkpw6fmp7f7jhj57dujfpwal4m2sj5tcp';
  const expectedIncomingTransfers = 5;
  const amountToAddrFirst1 = 10000;
  const watchedAddr1: string = addrFirst;
  const query1UpdatePeriod = 4;

  describe('utilise single transfers query', () => {
    test('register transfers query', async () => {
      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '1000000');
      await registerTransfersQuery(
        neutronAccount,
        contractAddress,
        connectionId,
        query1UpdatePeriod,
        watchedAddr1,
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(neutronChain, contractAddress, 1);
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
        const res = await gaiaAccount.msgSend(
          watchedAddr1,
          amountToAddrFirst1.toString(),
        );
        expect(res.code).toEqual(0);
      }

      await neutronChain.waitBlocks(5);

      const txs = await getUnsuccessfulTxs(testState.icq_web_host);
      expect(txs.length).toEqual(5);
    });

    test('resubmit failed tx', async () => {
      await neutronAccount.executeContract(contractAddress, {
        integration_tests_unset_query_mock: {},
      });

      const resubmitTxs = (
        await getUnsuccessfulTxs(testState.icq_web_host)
      ).map((tx) => ({ query_id: tx.query_id, hash: tx.submitted_tx_hash }));
      const resp = await postResubmitTxs(testState.icq_web_host, resubmitTxs);
      expect(resp.status).toEqual(200);

      await neutronChain.waitBlocks(20);

      await waitForTransfersAmount(
        neutronChain,
        contractAddress,
        expectedIncomingTransfers,
        query1UpdatePeriod * 2,
      );

      const txs = await getUnsuccessfulTxs(testState.icq_web_host);
      expect(txs.length).toEqual(0);

      const deposits = await queryRecipientTxs(
        neutronChain,
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
