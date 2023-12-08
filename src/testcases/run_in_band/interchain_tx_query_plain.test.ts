import Long from 'long';
import { CodeId } from '../../types';
import { MsgSend } from '@neutron-org/neutronjsplus/dist/proto/cosmos_sdk/cosmos/bank/v1beta1/tx_pb';
import {
  CosmosWrapper,
  packAnyMsg,
  WalletWrapper,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import {
  TestStateLocalCosmosTestNet,
  NEUTRON_DENOM,
  COSMOS_DENOM,
} from '@neutron-org/neutronjsplus';
import { NeutronContract } from '@neutron-org/neutronjsplus/dist/types';
import {
  getRegisteredQuery,
  queryRecipientTxs,
  queryTransfersNumber,
  registerTransfersQuery,
  waitForTransfersAmount,
} from '@neutron-org/neutronjsplus/dist/icq';

const config = require('../../config.json');

describe('Neutron / Interchain TX Query', () => {
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
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
    gaiaChain = new CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      COSMOS_DENOM,
    );
    gaiaAccount = new WalletWrapper(gaiaChain, testState.wallets.cosmos.demo2);
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
      contractAddress = (
        await neutronAccount.instantiateContract(
          codeId,
          '{}',
          'neutron_interchain_queries',
        )
      )[0]._contract_address;
    });
  });

  const addrFirst = 'cosmos1fj6yqrkpw6fmp7f7jhj57dujfpwal4m2sj5tcp';
  const addrSecond = 'cosmos14uxvu22lhrazyxadaqv5d6lswu0p276lmp7pvc';
  const addrThird = 'cosmos1m4n7gt76c4edkcpg698pwy56jkxqsre4v7p2sa';
  let addr1ExpectedBalance = 0;
  let addr2ExpectedBalance = 0;
  let addr3ExpectedBalance = 0;
  let expectedIncomingTransfers = 0;
  const amountToAddrFirst1 = 10000;
  const amountToAddrSecond1 = 5000;
  const watchedAddr1: string = addrFirst;
  const query1UpdatePeriod = 4;
  describe('utilize single transfers query', () => {
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

    test('handle callback on a sending', async () => {
      addr1ExpectedBalance += amountToAddrFirst1;
      let balances = await gaiaChain.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([]);
      const res = await gaiaAccount.msgSend(
        watchedAddr1,
        amountToAddrFirst1.toString(),
      );
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await gaiaChain.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: addr1ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);

      await waitForTransfersAmount(
        neutronChain,
        contractAddress,
        expectedIncomingTransfers,
        query1UpdatePeriod * 2,
      );
      const deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });

    test('handle callback on a sending to a different address', async () => {
      const differentAddr = addrSecond;
      addr2ExpectedBalance += amountToAddrSecond1;
      let balances = await gaiaChain.queryBalances(differentAddr);
      expect(balances.balances).toEqual([]);
      const res = await gaiaAccount.msgSend(
        differentAddr,
        amountToAddrSecond1.toString(),
      );
      expect(res.code).toEqual(0);
      balances = await gaiaChain.queryBalances(differentAddr);
      expect(balances.balances).toEqual([
        { amount: addr2ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);
      await neutronChain.blockWaiter.waitBlocks(query1UpdatePeriod * 2); // we are waiting for quite a big time just to be sure

      // the different address is not registered by the contract, so its receivings aren't tracked
      let deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        differentAddr,
      );
      expect(deposits.transfers).toEqual([]);
      // the watched address receivings are not changed
      deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });

    test('handle failed transfer', async () => {
      const res = await gaiaAccount.msgSend(watchedAddr1, '99999999999999'); // the amount is greater than the sender has
      expect(res.txhash?.length).toBeGreaterThan(0); // hash is not empty thus tx went away
      expect(res.code).toEqual(5); // failed to execute message: insufficient funds
      const balances = await gaiaChain.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: addr1ExpectedBalance.toString(), denom: gaiaChain.denom }, // balance hasn't changed thus tx failed
      ]);
      await neutronChain.blockWaiter.waitBlocks(query1UpdatePeriod * 2 + 1); // we are waiting for quite a big time just to be sure

      // the watched address receivings are not changed
      const deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });
  });

  const watchedAddr2 = addrSecond;
  const query2UpdatePeriod = 3;
  describe('utilize multiple transfers queries', () => {
    test('register the second transfers query', async () => {
      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '1000000');
      await registerTransfersQuery(
        neutronAccount,
        contractAddress,
        connectionId,
        query2UpdatePeriod,
        watchedAddr2,
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(neutronChain, contractAddress, 2);
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
      const balances = await gaiaChain.queryBalances(watchedAddr2);
      expectedIncomingTransfers++;
      expect(balances.balances).toEqual([
        { amount: addr2ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);

      await waitForTransfersAmount(
        neutronChain,
        contractAddress,
        expectedIncomingTransfers,
        query2UpdatePeriod * 2,
      );
      const deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr2,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: addr2ExpectedBalance.toString(),
        },
      ]);
    });
  });

  const watchedAddr3: string = addrThird;
  const query3UpdatePeriod = 4;
  const amountToAddrThird1 = 3000;
  const amountToAddrThird2 = 4000;
  describe('check update period', () => {
    test('register transfers query', async () => {
      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '1000000');
      await registerTransfersQuery(
        neutronAccount,
        contractAddress,
        connectionId,
        query3UpdatePeriod,
        watchedAddr3,
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(neutronChain, contractAddress, 3);
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
      addr3ExpectedBalance += amountToAddrThird1;
      let balances = await gaiaChain.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([]);
      const res = await gaiaAccount.msgSend(
        watchedAddr3,
        amountToAddrThird1.toString(),
      );
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await gaiaChain.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: addr3ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);
      let deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr3,
      );
      // update time hasn't come yet despite the fact the sent funds are already on the account
      expect(deposits.transfers).toEqual([]);

      await waitForTransfersAmount(
        neutronChain,
        contractAddress,
        expectedIncomingTransfers,
        query3UpdatePeriod * 2,
      );
      deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr3,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: addr3ExpectedBalance.toString(),
        },
      ]);
    });

    test('check second sending handling', async () => {
      addr3ExpectedBalance += amountToAddrThird2;
      const res = await gaiaAccount.msgSend(
        watchedAddr3,
        amountToAddrThird2.toString(),
      );
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      // initiate query before relayer has any chance to submit query data
      const depositsPromise = queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr3,
      );
      const balances = await gaiaChain.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: addr3ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);
      let deposits = await depositsPromise;
      // update time hasn't come yet despite the fact the sent funds are already on the account
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: (addr3ExpectedBalance - amountToAddrThird2).toString(),
        },
      ]);

      await waitForTransfersAmount(
        neutronChain,
        contractAddress,
        expectedIncomingTransfers,
        query3UpdatePeriod * 2,
      );
      deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr3,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: amountToAddrThird1.toString(),
        },
        {
          recipient: watchedAddr3,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: amountToAddrThird2.toString(),
        },
      ]);
    });
  });

  const amountToAddrFirst2 = 2000;
  const amountToAddrSecond2 = 3000;
  describe('handle multiple transfers', () => {
    test('exec tx with two transfers', async () => {
      addr1ExpectedBalance += amountToAddrFirst2;
      addr2ExpectedBalance += amountToAddrSecond2;
      const sendMsg1 = new MsgSend({
        fromAddress: gaiaAccount.wallet.address.toString(),
        toAddress: watchedAddr1,
        amount: [
          { denom: gaiaChain.denom, amount: amountToAddrFirst2.toString() },
        ],
      });
      const sendMsg2 = new MsgSend({
        fromAddress: gaiaAccount.wallet.address.toString(),
        toAddress: watchedAddr2,
        amount: [
          {
            denom: gaiaChain.denom,
            amount: amountToAddrSecond2.toString(),
          },
        ],
      });

      const res = await gaiaAccount.execTx(
        {
          gas_limit: Long.fromString('200000'),
          amount: [{ denom: gaiaChain.denom, amount: '1000' }],
        },
        [
          packAnyMsg('/cosmos.bank.v1beta1.MsgSend', sendMsg1),
          packAnyMsg('/cosmos.bank.v1beta1.MsgSend', sendMsg2),
        ],
      );
      expectedIncomingTransfers += 2;
      expect(res?.tx_response?.txhash?.length).toBeGreaterThan(0);
      let balances = await gaiaChain.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: addr1ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);
      balances = await gaiaChain.queryBalances(watchedAddr2);
      expect(balances.balances).toEqual([
        { amount: addr2ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);
      balances = await gaiaChain.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: addr3ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);
    });

    test('check transfers handled', async () => {
      await waitForTransfersAmount(
        neutronChain,
        contractAddress,
        expectedIncomingTransfers,
        Math.max(...[query1UpdatePeriod, query2UpdatePeriod]) * 2,
      );
      let deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: amountToAddrFirst1.toString(),
        },
        {
          recipient: watchedAddr1,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: amountToAddrFirst2.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr2,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: amountToAddrSecond1.toString(),
        },
        {
          recipient: watchedAddr2,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: amountToAddrSecond2.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr3,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: amountToAddrThird1.toString(),
        },
        {
          recipient: watchedAddr3,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: amountToAddrThird2.toString(),
        },
      ]);
    });
  });

  const addrForth = 'cosmos1p0qgeqgardg73apsrc2k5efm5dcwhnvkc0y4tq';
  let addr4ExpectedBalance = 0;
  const amountToAddrForth1 = 4000;
  const watchedAddr4: string = addrForth;
  const query4UpdatePeriod = 4;
  // this case tests the following scenario:
  // there is a tx of a remote height 10, and a tx of a remote height 20
  // we submit the second one, and then submit the first one, and want to make sure there is
  // no problem with submitting an older height after a younger one submitted
  describe('submit older height after younger one', () => {
    const addrFifth = 'cosmos1szkcj46xg65ux8t8ge9jl79azj4qltdqgz9l39';
    let addr5ExpectedBalance = 0;
    const amountToAddrFifth1 = 5000;
    const watchedAddr5: string = addrFifth;
    const query5UpdatePeriod = 12;

    // by these checks we ensure the transactions will be processed in the desired order
    test('validate update periods', async () => {
      expect(query5UpdatePeriod).toBeGreaterThanOrEqual(9);
      expect(query5UpdatePeriod).toBeGreaterThanOrEqual(query4UpdatePeriod * 3);
    });

    test('register transfers queries', async () => {
      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '2000000');
      await registerTransfersQuery(
        neutronAccount,
        contractAddress,
        connectionId,
        query4UpdatePeriod,
        watchedAddr4,
      );
      await registerTransfersQuery(
        neutronAccount,
        contractAddress,
        connectionId,
        query5UpdatePeriod,
        watchedAddr5,
      );
      await neutronChain.blockWaiter.waitBlocks(2); // wait for queries handling on init
    });

    test('make older sending', async () => {
      addr5ExpectedBalance += amountToAddrFifth1;
      let balances = await gaiaChain.queryBalances(watchedAddr5);
      expect(balances.balances).toEqual([]);
      const res = await gaiaAccount.msgSend(
        watchedAddr5,
        amountToAddrFifth1.toString(),
      );
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await gaiaChain.queryBalances(watchedAddr5);
      expect(balances.balances).toEqual([
        { amount: addr5ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);
    });

    test('check registered transfers query', async () => {
      let query = await getRegisteredQuery(neutronChain, contractAddress, 4);
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

      query = await getRegisteredQuery(neutronChain, contractAddress, 5);
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
      addr4ExpectedBalance += amountToAddrForth1;
      let balances = await gaiaChain.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([]);
      const res = await gaiaAccount.msgSend(
        watchedAddr4,
        amountToAddrForth1.toString(),
      );
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await gaiaChain.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([
        { amount: addr4ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);

      await waitForTransfersAmount(
        neutronChain,
        contractAddress,
        expectedIncomingTransfers - 1,
        query4UpdatePeriod * 2,
      );
      // make sure the query4 result is submitted before the query5 one
      let deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr4,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr4,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: addr4ExpectedBalance.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr5,
      );
      expect(deposits.transfers).toEqual([]);

      await waitForTransfersAmount(
        neutronChain,
        contractAddress,
        expectedIncomingTransfers,
        query5UpdatePeriod * 2,
      );
      deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr5,
      );
      // despite query4 tx result was of a greater remote height and was submitted before,
      // query5 tx should be submitted successfully
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr5,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: addr5ExpectedBalance.toString(),
        },
      ]);
    });
  });

  describe('check contract state is reverted on failed sudo', () => {
    // contract handles only transfers <= 20000, otherwise it ends callback with an error.
    const amountToAddrForth2 = 21000;
    let transfersAmountBeforeSending: number;
    test('send amount that is more than contract allows', async () => {
      // contract tracks total amount of transfers to addresses it watches.
      const transfers = await queryTransfersNumber(
        neutronChain,
        contractAddress,
      );
      expect(transfers.transfers_number).toBeGreaterThan(0);
      transfersAmountBeforeSending = transfers.transfers_number;

      let balances = await gaiaChain.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([
        { amount: addr4ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);
      const res = await gaiaAccount.msgSend(
        watchedAddr4,
        amountToAddrForth2.toString(),
      );
      addr4ExpectedBalance += amountToAddrForth2;
      expect(res.code).toEqual(0);
      balances = await gaiaChain.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([
        { amount: addr4ExpectedBalance.toString(), denom: gaiaChain.denom },
      ]);
    });

    test('check that transfer has not been recorded', async () => {
      await neutronChain.blockWaiter.waitBlocks(query4UpdatePeriod * 2 + 1); // we are waiting for quite a big time just to be sure
      const deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        watchedAddr4,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr4,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
          amount: (addr4ExpectedBalance - amountToAddrForth2).toString(),
        },
      ]);
      // contract handles only transfers not greater than 20000, otherwise it ends callback with an
      // error. on the error result, the transfers amount previously increased in the sudo func is
      // expected to be reverted.
      const transfers = await queryTransfersNumber(
        neutronChain,
        contractAddress,
      );
      expect(transfers.transfers_number).toEqual(transfersAmountBeforeSending);
    });
  });

  describe('update recipient and check', () => {
    const newWatchedAddr5 = 'cosmos1jy7lsk5pk38zjfnn6nt6qlaphy9uejn4hu65xa';
    it('should update recipient', async () => {
      const res = await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          update_interchain_query: {
            query_id: 3,
            new_update_period: query3UpdatePeriod,
            new_recipient: newWatchedAddr5,
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
    it('seems registered transfers query is updated', async () => {
      const query = await getRegisteredQuery(neutronChain, contractAddress, 3);
      expect(query.registered_query.id).toEqual(3);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual('tx');
      expect(query.registered_query.update_period).toEqual(query3UpdatePeriod);
      expect(query.registered_query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          newWatchedAddr5 +
          '"}]',
      );
      expect(query.registered_query.connection_id).toEqual(connectionId);
    });

    it('should handle callback on a sending to the new address', async () => {
      const res = await gaiaAccount.msgSend(newWatchedAddr5, '10000');
      expect(res.code).toEqual(0);
      expectedIncomingTransfers++;
      await waitForTransfersAmount(
        neutronChain,
        contractAddress,
        expectedIncomingTransfers,
        query3UpdatePeriod * 2,
      );
      const deposits = await queryRecipientTxs(
        neutronChain,
        contractAddress,
        newWatchedAddr5,
      );
      expect(deposits.transfers).toMatchObject([
        {
          recipient: newWatchedAddr5,
          sender: gaiaAccount.wallet.address.toString(),
          denom: gaiaChain.denom,
        },
      ]);
    });
  });
});
