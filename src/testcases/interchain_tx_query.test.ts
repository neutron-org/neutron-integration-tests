import { proto, rest } from '@cosmos-client/core';
import { CosmosWrapper, COSMOS_DENOM, NEUTRON_DENOM } from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { waitBlocks } from '../helpers/wait';
import Long from 'long';
import {
  getRegisteredQuery,
  queryTransfersAmount,
  waitForTransfersAmount,
} from '../helpers/icq';
import { max } from 'lodash';
import { CosmosSDK } from '@cosmos-client/core/cjs/sdk';

describe('Neutron / Interchain TX Query', () => {
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

  const addr1 = 'cosmos1fj6yqrkpw6fmp7f7jhj57dujfpwal4m2sj5tcp';
  const addr2 = 'cosmos14uxvu22lhrazyxadaqv5d6lswu0p276lmp7pvc';
  const addr3 = 'cosmos1m4n7gt76c4edkcpg698pwy56jkxqsre4v7p2sa';
  let addr1ExpectedBalance = 0;
  let addr2ExpectedBalance = 0;
  let addr3ExpectedBalance = 0;
  let expectedIncomingTransfers = 0;
  const amountToAddr1_1 = 10000;
  const amountToAddr2_1 = 5000;
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

    test('handle callback on a sending', async () => {
      addr1ExpectedBalance += amountToAddr1_1;
      let balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(watchedAddr1, amountToAddr1_1.toString());
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: addr1ExpectedBalance.toString(), denom: cm2.denom },
      ]);

      await waitForTransfersAmount(
        cm,
        contractAddress,
        expectedIncomingTransfers,
        query1UpdatePeriod * 2,
      );
      const deposits = await queryRecipientTxs(
        cm,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });

    test('handle callback on a sending to a different address', async () => {
      const differentAddr = addr2;
      addr2ExpectedBalance += amountToAddr2_1;
      let balances = await cm2.queryBalances(differentAddr);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(differentAddr, amountToAddr2_1.toString());
      expect(res.code).toEqual(0);
      balances = await cm2.queryBalances(differentAddr);
      expect(balances.balances).toEqual([
        { amount: addr2ExpectedBalance.toString(), denom: cm2.denom },
      ]);
      await waitBlocks(cm.sdk, query1UpdatePeriod * 2); // we are waiting for quite a big time just to be sure

      // the different address is not registered by the contract, so its receivings aren't tracked
      let deposits = await queryRecipientTxs(
        cm,
        contractAddress,
        differentAddr,
      );
      expect(deposits.transfers).toEqual([]);
      // the watched address receivings are not changed
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr1);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });

    test('handle failed transfer', async () => {
      const res = await cm2.msgSend(watchedAddr1, '99999999999999'); // the amount is greater than the sender has
      expect(res.txhash?.length).toBeGreaterThan(0); // hash is not empty thus tx went away
      expect(res.code).toEqual(5); // failed to execute message: insufficient funds
      const balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: addr1ExpectedBalance.toString(), denom: cm2.denom }, // balance hasn't changed thus tx failed
      ]);
      await waitBlocks(cm.sdk, query1UpdatePeriod * 2 + 1); // we are waiting for quite a big time just to be sure

      // the watched address receivings are not changed
      const deposits = await queryRecipientTxs(
        cm,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });
  });

  const watchedAddr2 = addr2;
  const query2UpdatePeriod = 3;
  describe('utilise multiple transfers queries', () => {
    test('register the second transfers query', async () => {
      // Top up contract address before running query
      await cm.msgSend(contractAddress, '1000000');
      await registerTransfersQuery(
        cm,
        contractAddress,
        connectionId,
        query2UpdatePeriod,
        watchedAddr2,
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(cm, contractAddress, 2);
      expect(query.registered_query.id).toEqual(2);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual('tx');
      expect(query.registered_query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          watchedAddr2 +
          '"}]',
      );
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query2UpdatePeriod);
    });

    test('handle callback on a past sending', async () => {
      const balances = await cm2.queryBalances(watchedAddr2);
      expectedIncomingTransfers++;
      expect(balances.balances).toEqual([
        { amount: addr2ExpectedBalance.toString(), denom: cm2.denom },
      ]);

      await waitForTransfersAmount(
        cm,
        contractAddress,
        expectedIncomingTransfers,
        query2UpdatePeriod * 2,
      );
      const deposits = await queryRecipientTxs(
        cm,
        contractAddress,
        watchedAddr2,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr2ExpectedBalance.toString(),
        },
      ]);
    });
  });

  const watchedAddr3: string = addr3;
  const query3UpdatePeriod = 4;
  const amountToAddr3_1 = 3000;
  const amountToAddr3_2 = 4000;
  describe('check update period', () => {
    test('register transfers query', async () => {
      // Top up contract address before running query
      await cm.msgSend(contractAddress, '1000000');
      await registerTransfersQuery(
        cm,
        contractAddress,
        connectionId,
        query3UpdatePeriod,
        watchedAddr3,
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(cm, contractAddress, 3);
      expect(query.registered_query.id).toEqual(3);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual('tx');
      expect(query.registered_query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          watchedAddr3 +
          '"}]',
      );
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query3UpdatePeriod);
    });

    test('check first sending handling', async () => {
      addr3ExpectedBalance += amountToAddr3_1;
      let balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(watchedAddr3, amountToAddr3_1.toString());
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: addr3ExpectedBalance.toString(), denom: cm2.denom },
      ]);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      // update time hasn't come yet despite the fact the sent funds are already on the account
      expect(deposits.transfers).toEqual([]);

      await waitForTransfersAmount(
        cm,
        contractAddress,
        expectedIncomingTransfers,
        query3UpdatePeriod * 2,
      );
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr3ExpectedBalance.toString(),
        },
      ]);
    });

    test('check second sending handling', async () => {
      addr3ExpectedBalance += amountToAddr3_2;
      const res = await cm2.msgSend(watchedAddr3, amountToAddr3_2.toString());
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      // initiate query before relayer has any chance to submit query data
      const depositsPromise = queryRecipientTxs(
        cm,
        contractAddress,
        watchedAddr3,
      );
      const balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: addr3ExpectedBalance.toString(), denom: cm2.denom },
      ]);
      let deposits = await depositsPromise;
      // update time hasn't come yet despite the fact the sent funds are already on the account
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: (addr3ExpectedBalance - amountToAddr3_2).toString(),
        },
      ]);

      await waitForTransfersAmount(
        cm,
        contractAddress,
        expectedIncomingTransfers,
        query3UpdatePeriod * 2,
      );
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: amountToAddr3_1.toString(),
        },
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: amountToAddr3_2.toString(),
        },
      ]);
    });
  });

  const amountToAddr1_2 = 2000;
  const amountToAddr2_2 = 3000;
  describe('handle multiple transfers', () => {
    test('exec tx with two transfers', async () => {
      addr1ExpectedBalance += amountToAddr1_2;
      addr2ExpectedBalance += amountToAddr2_2;
      const res = await cm2.execTx(
        {
          gas_limit: Long.fromString('200000'),
          amount: [{ denom: cm2.denom, amount: '1000' }],
        },
        [
          new proto.cosmos.bank.v1beta1.MsgSend({
            from_address: cm2.wallet.address.toString(),
            to_address: watchedAddr1,
            amount: [{ denom: cm2.denom, amount: amountToAddr1_2.toString() }],
          }),
          new proto.cosmos.bank.v1beta1.MsgSend({
            from_address: cm2.wallet.address.toString(),
            to_address: watchedAddr2,
            amount: [{ denom: cm2.denom, amount: amountToAddr2_2.toString() }],
          }),
        ],
      );
      expectedIncomingTransfers += 2;
      expect(res?.tx_response?.txhash?.length).toBeGreaterThan(0);
      let balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: addr1ExpectedBalance.toString(), denom: cm2.denom },
      ]);
      balances = await cm2.queryBalances(watchedAddr2);
      expect(balances.balances).toEqual([
        { amount: addr2ExpectedBalance.toString(), denom: cm2.denom },
      ]);
      balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: addr3ExpectedBalance.toString(), denom: cm2.denom },
      ]);
    });

    test('check transfers handled', async () => {
      await waitForTransfersAmount(
        cm,
        contractAddress,
        expectedIncomingTransfers,
        max([query1UpdatePeriod, query2UpdatePeriod]) * 2,
      );
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr1);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: amountToAddr1_1.toString(),
        },
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: amountToAddr1_2.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr2);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: amountToAddr2_1.toString(),
        },
        {
          recipient: watchedAddr2,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: amountToAddr2_2.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: amountToAddr3_1.toString(),
        },
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: amountToAddr3_2.toString(),
        },
      ]);
    });
  });

  const addr4 = 'cosmos1p0qgeqgardg73apsrc2k5efm5dcwhnvkc0y4tq';
  let addr4ExpectedBalance = 0;
  const amountToAddr4_1 = 4000;
  const watchedAddr4: string = addr4;
  const query4UpdatePeriod = 4;
  // this case tests the following scenario:
  // there is a tx of a remote height 10, and a tx of a remote height 20
  // we submit the second one, and then submit the first one, and want to make sure there is
  // no problem with submitting an older height after a younger one submitted
  describe('submit older height after younger one', () => {
    const addr5 = 'cosmos1szkcj46xg65ux8t8ge9jl79azj4qltdqgz9l39';
    let addr5ExpectedBalance = 0;
    const amountToAddr5_1 = 5000;
    const watchedAddr5: string = addr5;
    const query5UpdatePeriod = 12;

    // by this checks we ensure the transactions will be processed in the desired order
    test('validate update periods', async () => {
      expect(query5UpdatePeriod).toBeGreaterThanOrEqual(9);
      expect(query5UpdatePeriod).toBeGreaterThanOrEqual(query4UpdatePeriod * 3);
    });

    test('register transfers queries', async () => {
      // Top up contract address before running query
      await cm.msgSend(contractAddress, '2000000');
      await registerTransfersQuery(
        cm,
        contractAddress,
        connectionId,
        query4UpdatePeriod,
        watchedAddr4,
      );
      await registerTransfersQuery(
        cm,
        contractAddress,
        connectionId,
        query5UpdatePeriod,
        watchedAddr5,
      );
      await waitBlocks(cm.sdk, 2); // wait for queries handling on init
    });

    test('make older sending', async () => {
      addr5ExpectedBalance += amountToAddr5_1;
      let balances = await cm2.queryBalances(watchedAddr5);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(watchedAddr5, amountToAddr5_1.toString());
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await cm2.queryBalances(watchedAddr5);
      expect(balances.balances).toEqual([
        { amount: addr5ExpectedBalance.toString(), denom: cm2.denom },
      ]);
    });

    test('check registered transfers query', async () => {
      let query = await getRegisteredQuery(cm, contractAddress, 4);
      expect(query.registered_query.id).toEqual(4);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual('tx');
      expect(query.registered_query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          watchedAddr4 +
          '"}]',
      );
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query4UpdatePeriod);

      query = await getRegisteredQuery(cm, contractAddress, 5);
      expect(query.registered_query.id).toEqual(5);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual('tx');
      expect(query.registered_query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          watchedAddr5 +
          '"}]',
      );
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query5UpdatePeriod);
    });

    test('make younger sending and check', async () => {
      addr4ExpectedBalance += amountToAddr4_1;
      let balances = await cm2.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(watchedAddr4, amountToAddr4_1.toString());
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await cm2.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([
        { amount: addr4ExpectedBalance.toString(), denom: cm2.denom },
      ]);

      await waitForTransfersAmount(
        cm,
        contractAddress,
        expectedIncomingTransfers - 1,
        query4UpdatePeriod * 2,
      );
      // make sure the query4 result is submitted before the query5 one
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr4);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr4,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr4ExpectedBalance.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr5);
      expect(deposits.transfers).toEqual([]);

      await waitForTransfersAmount(
        cm,
        contractAddress,
        expectedIncomingTransfers,
        query5UpdatePeriod * 2,
      );
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr5);
      // despite query4 tx result was of a greater remote height and was submitted before,
      // query5 tx should be submitted successfully
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr5,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr5ExpectedBalance.toString(),
        },
      ]);
    });
  });

  describe('check contract state is reverted on failed sudo', () => {
    // contract handles only transfers <= 20000, otherwise it ends callback with an error.
    const amountToAddr4_2 = 21000;
    let transfers_amount_before_sending: number;
    test('send amount that is more than contract allows', async () => {
      // contract tracks total amount of transfers to addresses it watches.
      const transfers = await queryTransfersAmount(cm, contractAddress);
      expect(transfers.amount).toBeGreaterThan(0);
      transfers_amount_before_sending = transfers.amount;

      let balances = await cm2.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([
        { amount: addr4ExpectedBalance.toString(), denom: cm2.denom },
      ]);
      const res = await cm2.msgSend(watchedAddr4, amountToAddr4_2.toString());
      addr4ExpectedBalance += amountToAddr4_2;
      expect(res.code).toEqual(0);
      balances = await cm2.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([
        { amount: addr4ExpectedBalance.toString(), denom: cm2.denom },
      ]);
    });

    test('check that transfer has not been recorded', async () => {
      await waitBlocks(cm.sdk, query4UpdatePeriod * 2 + 1); // we are waiting for quite a big time just to be sure
      const deposits = await queryRecipientTxs(
        cm,
        contractAddress,
        watchedAddr4,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr4,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: (addr4ExpectedBalance - amountToAddr4_2).toString(),
        },
      ]);
      // contract handles only transfers not greater than 20000, otherwise it ends callback with an
      // error. on the error result, the transfers amount previously increased in the sudo func is
      // expected to be reverted.
      const transfers = await queryTransfersAmount(cm, contractAddress);
      expect(transfers.amount).toEqual(transfers_amount_before_sending);
    });
  });
});

/**
 * registerTransfersQuery sends a register_transfers_query execute msg to the contractAddress with
 * the given parameters and checks the tx result to be successful.
 */
const registerTransfersQuery = async (
  cm: CosmosWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  recipient: string,
) => {
  const res = await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_transfers_query: {
        connection_id: connectionId,
        update_period: updatePeriod,
        recipient: recipient,
      },
    }),
  );
  expect(res.code).toEqual(0);
  const tx = await rest.tx.getTx(cm.sdk as CosmosSDK, res.txhash as string);
  expect(tx?.data.tx_response?.code).toEqual(0);
};

/**
 * queryRecipientTxs queries the contract for recorded transfers to the given recipient address.
 */
const queryRecipientTxs = (
  cm: CosmosWrapper,
  contractAddress: string,
  recipient: string,
) =>
  cm.queryContract<{
    transfers: [
      recipient: string,
      sender: string,
      denom: string,
      amount: string,
    ];
  }>(contractAddress, {
    get_recipient_txs: {
      recipient: recipient,
    },
  });
