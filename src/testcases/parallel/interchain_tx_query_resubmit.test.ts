import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { COSMOS_DENOM, NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { LocalState, createWalletWrapper } from '../../helpers/localState';
import {NeutronContract, CodeId, Wallet} from '@neutron-org/neutronjsplus/dist/types';
import {
  getRegisteredQuery,
  getUnsuccessfulTxs,
  postResubmitTxs,
  queryRecipientTxs,
  registerTransfersQuery,
  waitForTransfersAmount,
} from '../../helpers/icq';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import { Suite, inject } from 'vitest';
import {QueryClientImpl as FeeburnerQueryClient} from "@neutron-org/neutronjs/neutron/feeburner/query.rpc.Query";
import {CosmWasmClient} from "@cosmjs/cosmwasm-stargate";
import {wasm, WasmWrapper} from "../../helpers/wasmClient";
import {Registry} from "@cosmjs/proto-signing";
import {neutronTypes} from "@neutron-org/neutronjsplus/dist/neutronTypes";

const config = require('../../config.json');

describe('Neutron / Interchain TX Query Resubmit', () => {
  let testState: LocalState;
  let neutronClient: WasmWrapper;
  let gaiaClient: WasmWrapper;
  let neutronAccount: Wallet;
  let gaiaAccount: Wallet;
  let contractAddress: string;
  const connectionId = 'connection-0';

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics, suite);
    await testState.init();
    neutronAccount = await testState.nextWallet('neutron');
    neutronClient = await wasm(
      testState.rpcNeutron,
      neutronAccount,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );
    const neutronRpcClient = await testState.rpcClient('neutron');

    gaiaChain = new CosmosWrapper(
      COSMOS_DENOM,
      testState.restGaia,
      testState.rpcGaia,
    );
    gaiaAccount = await testState.nextWallet('cosmos');
  });

  describe('deploy contract', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronClient.upload(
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

      await waitBlocks(20);

      await waitForTransfersAmount(
        wasm(),
        neutronClient,
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
