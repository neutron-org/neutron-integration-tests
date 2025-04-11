import '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import {
  getRegisteredQuery,
  getUnsuccessfulTxs,
  postResubmitTxs,
  queryRecipientTxs,
  registerTransfersQuery,
  waitForTransfersAmount,
} from '../../helpers/interchainqueries';
import { RunnerTestSuite, inject } from 'vitest';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import {
  CONTRACTS,
  COSMOS_DENOM,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import config from '../../config.json';
import { GaiaWallet, Wallet } from '../../helpers/wallet';

describe('Neutron / Interchain TX Query Resubmit', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: GaiaWallet;
  let contractAddress: string;
  const connectionId = 'connection-0';

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.signer,
      neutronWallet.address,
    );

    gaiaWallet = await testState.nextGaiaWallet();
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.signer,
      { registry: new Registry(defaultRegistryTypes) },
    );
  });

  describe('deploy contract', () => {
    test('instantiate contract', async () => {
      contractAddress = await neutronClient.create(
        CONTRACTS.INTERCHAIN_QUERIES,
        {},
        'neutron_interchain_queries',
      );
    });
  });

  describe('prepare ICQ for failing', () => {
    test('enable mock', async () => {
      await neutronClient.execute(contractAddress, {
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
      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );
      await registerTransfersQuery(
        neutronClient,
        contractAddress,
        connectionId,
        query1UpdatePeriod,
        [watchedAddr1],
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(neutronClient, contractAddress, 1);
      expect(query.id).toEqual('1');
      expect(query.owner).toEqual(contractAddress);
      expect(query.keys.length).toEqual(0);
      expect(query.query_type).toEqual('tx');
      expect(query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          watchedAddr1 +
          '"}]',
      );
      expect(query.connection_id).toEqual(connectionId);
      expect(query.update_period).toEqual(query1UpdatePeriod.toString());
    });

    test('check failed txs', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await gaiaClient.sendTokens(
          gaiaWallet.address,
          watchedAddr1,
          [{ denom: COSMOS_DENOM, amount: amountToAddrFirst1.toString() }],
          {
            gas: '200000',
            amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
          },
        );
        expect(res.code).toEqual(0);
      }

      await neutronClient.waitBlocks(5);

      const txs = await getUnsuccessfulTxs(testState.icqWebHost);
      expect(txs.length).toEqual(5);
    });

    test('resubmit failed tx', async () => {
      await neutronClient.execute(contractAddress, {
        integration_tests_unset_query_mock: {},
      });

      const resubmitTxs = (await getUnsuccessfulTxs(testState.icqWebHost)).map(
        (tx) => ({ query_id: tx.query_id, hash: tx.submitted_tx_hash }),
      );
      const resp = await postResubmitTxs(testState.icqWebHost, resubmitTxs);
      expect(resp.status).toEqual(200);

      await neutronClient.waitBlocks(20);

      await waitForTransfersAmount(
        neutronClient,
        contractAddress,
        expectedIncomingTransfers,
        query1UpdatePeriod * 2,
      );

      const txs = await getUnsuccessfulTxs(testState.icqWebHost);
      expect(txs.length).toEqual(0);

      const deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers.length).toEqual(5);
    });

    test('resubmit nonexistent failed tx', async () => {
      await expect(
        postResubmitTxs(testState.icqWebHost, [
          { query_id: 1, hash: 'nonexistent' },
        ]).catch((e) => {
          throw new Error(e.response.data);
        }),
      ).rejects.toThrow('no tx found with queryID=1 and hash=nonexistent');
    });
  });
});
