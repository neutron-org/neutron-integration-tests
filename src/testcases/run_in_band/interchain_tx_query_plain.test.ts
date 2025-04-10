import { RunnerTestSuite, inject } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import {
  defaultRegistryTypes,
  MsgSendEncodeObject,
  ProtobufRpcClient,
  SigningStargateClient,
} from '@cosmjs/stargate';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { Registry } from '@cosmjs/proto-signing';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { QueryClientImpl as InterchainqQuerier } from '@neutron-org/neutronjs/neutron/interchainqueries/query.rpc.Query';
import {
  executeUpdateInterchainQueriesParams,
  getRegisteredQuery,
  queryRecipientTxs,
  queryTransfersNumber,
  registerTransfersQuery,
  waitForTransfersAmount,
} from '../../helpers/interchainqueries';
import {
  CONTRACTS,
  COSMOS_DENOM,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { QueryClientImpl as BankQuerier } from 'cosmjs-types/cosmos/bank/v1beta1/query';

import config from '../../config.json';
import { Wallet } from '../../helpers/wallet';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';

describe('Neutron / Interchain TX Query', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let neutronRpcClient: ProtobufRpcClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: Wallet;
  let contractAddress: string;
  let bankQuerierGaia: BankQuerier;
  let interchainqQuerier: InterchainqQuerier;
  let daoMember: DaoMember;
  let mainDao: Dao;
  let chainManagerAddress: string;
  const connectionId = 'connection-0';

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.signer,
      neutronWallet.address,
    );

    gaiaWallet = await testState.nextWallet('cosmos');
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.signer,
      { registry: new Registry(defaultRegistryTypes) },
    );
    bankQuerierGaia = new BankQuerier(await testState.gaiaRpcClient());

    neutronRpcClient = await testState.neutronRpcClient();
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);
    mainDao = new Dao(neutronClient, daoContracts);
    daoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );
    await daoMember.bondFunds('1000000000');
    interchainqQuerier = new InterchainqQuerier(neutronRpcClient);

    const adminQuery = new AdminQueryClient(neutronRpcClient);
    const admins = await adminQuery.admins();
    chainManagerAddress = admins.admins[0];
  });

  describe('deploy contract', () => {
    let codeId: number;
    test('store contract', async () => {
      codeId = await neutronClient.upload(CONTRACTS.INTERCHAIN_QUERIES);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate contract', async () => {
      contractAddress = await neutronClient.instantiate(
        codeId,
        {},
        'neutron_interchain_queries',
      );
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

    test('handle callback on a sending', async () => {
      addr1ExpectedBalance += amountToAddrFirst1;
      let balances = await bankQuerierGaia.AllBalances({
        address: watchedAddr1,
      });
      expect(balances.balances).toEqual([]);
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        watchedAddr1,
        [{ denom: COSMOS_DENOM, amount: amountToAddrFirst1.toString() }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );

      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await bankQuerierGaia.AllBalances({ address: watchedAddr1 });
      expect(balances.balances).toEqual([
        {
          amount: addr1ExpectedBalance.toString(),
          denom: COSMOS_DENOM,
        },
      ]);

      await waitForTransfersAmount(
        neutronClient,
        contractAddress,
        expectedIncomingTransfers,
        query1UpdatePeriod * 2,
      );
      const deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });

    test('handle callback on a sending to a different address', async () => {
      const differentAddr = addrSecond;
      addr2ExpectedBalance += amountToAddrSecond1;
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        differentAddr,
        [{ denom: COSMOS_DENOM, amount: amountToAddrSecond1.toString() }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      expect(res.code).toEqual(0);
      const balance = await gaiaClient.getBalance(differentAddr, COSMOS_DENOM);
      expect(balance).toEqual({
        amount: addr2ExpectedBalance.toString(),
        denom: COSMOS_DENOM,
      });
      await neutronClient.waitBlocks(query1UpdatePeriod * 2); // we are waiting for quite a big time just to be sure

      // the different address is not registered by the contract, so its receivings aren't tracked
      let deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        differentAddr,
      );
      expect(deposits.transfers).toEqual([]);
      // the watched address receivings are not changed
      deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });

    test('handle failed transfer', async () => {
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        watchedAddr1,
        [{ denom: COSMOS_DENOM, amount: '99999999999999' }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      // the amount is greater than the sender has
      expect(res.transactionHash?.length).toBeGreaterThan(0); // hash is not empty thus tx went away
      expect(res.code).toEqual(5); // failed to execute message: insufficient funds
      const balance = await gaiaClient.getBalance(watchedAddr1, COSMOS_DENOM);
      expect(balance).toEqual(
        { amount: addr1ExpectedBalance.toString(), denom: COSMOS_DENOM }, // balance hasn't changed thus tx failed
      );
      await neutronClient.waitBlocks(query1UpdatePeriod * 2 + 1); // we are waiting for quite a big time just to be sure

      // the watched address receivings are not changed
      const deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
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
        query2UpdatePeriod,
        [watchedAddr2],
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(neutronClient, contractAddress, 2);
      expect(query.id).toEqual('2');
      expect(query.owner).toEqual(contractAddress);
      expect(query.keys.length).toEqual(0);
      expect(query.query_type).toEqual('tx');
      expect(query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          watchedAddr2 +
          '"}]',
      );
      expect(query.connection_id).toEqual(connectionId);
      expect(query.update_period).toEqual(query2UpdatePeriod.toString());
    });

    test('handle callback on a past sending', async () => {
      const balances = await gaiaClient.getBalance(watchedAddr2, COSMOS_DENOM);
      expectedIncomingTransfers++;
      expect(balances).toEqual({
        amount: addr2ExpectedBalance.toString(),
        denom: COSMOS_DENOM,
      });

      await waitForTransfersAmount(
        neutronClient,
        contractAddress,
        expectedIncomingTransfers,
        query2UpdatePeriod * 2,
      );
      const deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr2,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: addr2ExpectedBalance.toString(),
        },
      ]);
    });
  });

  const watchedAddr3: string = addrThird;
  const query3UpdatePeriod = 8;
  const amountToAddrThird1 = 3000;
  const amountToAddrThird2 = 4000;
  describe('check update period', () => {
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
        query3UpdatePeriod,
        [watchedAddr3],
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(neutronClient, contractAddress, 3);
      expect(query.id).toEqual('3');
      expect(query.owner).toEqual(contractAddress);
      expect(query.keys.length).toEqual(0);
      expect(query.query_type).toEqual('tx');
      expect(query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          watchedAddr3 +
          '"}]',
      );
      expect(query.connection_id).toEqual(connectionId);
      expect(query.update_period).toEqual(query3UpdatePeriod.toString());
    });

    test('check first sending handling', async () => {
      addr3ExpectedBalance += amountToAddrThird1;
      let balances = await bankQuerierGaia.AllBalances({
        address: watchedAddr3,
      });
      expect(balances.balances).toEqual([]);
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        watchedAddr3,
        [{ denom: COSMOS_DENOM, amount: amountToAddrThird1.toString() }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await bankQuerierGaia.AllBalances({ address: watchedAddr3 });
      expect(balances.balances).toEqual([
        {
          amount: addr3ExpectedBalance.toString(),
          denom: COSMOS_DENOM,
        },
      ]);
      let deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr3,
      );
      // update time hasn't come yet despite the fact that sent funds are already on the account
      expect(deposits.transfers).toEqual([]);

      await waitForTransfersAmount(
        neutronClient,
        contractAddress,
        expectedIncomingTransfers,
        query3UpdatePeriod * 2,
      );
      deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr3,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: addr3ExpectedBalance.toString(),
        },
      ]);
    });

    test('check second sending handling', async () => {
      addr3ExpectedBalance += amountToAddrThird2;
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        watchedAddr3,
        [{ denom: COSMOS_DENOM, amount: amountToAddrThird2.toString() }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      // initiate query before relayer has any chance to submit query data
      const depositsPromise = queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr3,
      );
      const balances = await gaiaClient.getBalance(watchedAddr3, COSMOS_DENOM);
      expect(balances).toEqual({
        amount: addr3ExpectedBalance.toString(),
        denom: COSMOS_DENOM,
      });
      let deposits = await depositsPromise;
      // update time hasn't come yet despite the fact that sent funds are already on the account
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: (addr3ExpectedBalance - amountToAddrThird2).toString(),
        },
      ]);

      await waitForTransfersAmount(
        neutronClient,
        contractAddress,
        expectedIncomingTransfers,
        query3UpdatePeriod * 2,
      );
      deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr3,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: amountToAddrThird1.toString(),
        },
        {
          recipient: watchedAddr3,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
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

      const msgSendObject1: MsgSendEncodeObject = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: gaiaWallet.address,
          toAddress: watchedAddr1,
          amount: [
            { denom: COSMOS_DENOM, amount: amountToAddrFirst2.toString() },
          ],
        },
      };

      const msgSendObject2: MsgSendEncodeObject = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: gaiaWallet.address,
          toAddress: watchedAddr2,
          amount: [
            { denom: COSMOS_DENOM, amount: amountToAddrSecond2.toString() },
          ],
        },
      };

      const res = await gaiaClient.signAndBroadcast(
        gaiaWallet.address,
        [msgSendObject1, msgSendObject2],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );

      expectedIncomingTransfers += 2;
      expect(res?.transactionHash.length).toBeGreaterThan(0);
      let balances = await gaiaClient.getBalance(watchedAddr1, COSMOS_DENOM);
      expect(balances).toEqual({
        amount: addr1ExpectedBalance.toString(),
        denom: COSMOS_DENOM,
      });
      balances = await gaiaClient.getBalance(watchedAddr2, COSMOS_DENOM);
      expect(balances).toEqual({
        amount: addr2ExpectedBalance.toString(),
        denom: COSMOS_DENOM,
      });
      balances = await gaiaClient.getBalance(watchedAddr3, COSMOS_DENOM);
      expect(balances).toEqual({
        amount: addr3ExpectedBalance.toString(),
        denom: COSMOS_DENOM,
      });
    });

    test('check transfers handled', async () => {
      await waitForTransfersAmount(
        neutronClient,
        contractAddress,
        expectedIncomingTransfers,
        Math.max(...[query1UpdatePeriod, query2UpdatePeriod]) * 2,
      );
      let deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr1,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: amountToAddrFirst1.toString(),
        },
        {
          recipient: watchedAddr1,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: amountToAddrFirst2.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr2,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: amountToAddrSecond1.toString(),
        },
        {
          recipient: watchedAddr2,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: amountToAddrSecond2.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr3,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: amountToAddrThird1.toString(),
        },
        {
          recipient: watchedAddr3,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
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
      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '2000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );
      await registerTransfersQuery(
        neutronClient,
        contractAddress,
        connectionId,
        query4UpdatePeriod,
        [watchedAddr4],
      );
      await registerTransfersQuery(
        neutronClient,
        contractAddress,
        connectionId,
        query5UpdatePeriod,
        [watchedAddr5],
      );
      await neutronClient.waitBlocks(2); // wait for queries handling on init
    });

    test('make older sending', async () => {
      addr5ExpectedBalance += amountToAddrFifth1;
      let balances = await bankQuerierGaia.AllBalances({
        address: watchedAddr5,
      });
      expect(balances.balances).toEqual([]);
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        watchedAddr5,
        [{ denom: COSMOS_DENOM, amount: amountToAddrFifth1.toString() }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await bankQuerierGaia.AllBalances({ address: watchedAddr5 });
      expect(balances.balances).toEqual([
        {
          amount: addr5ExpectedBalance.toString(),
          denom: COSMOS_DENOM,
        },
      ]);
    });

    test('check registered transfers query', async () => {
      let query = await getRegisteredQuery(neutronClient, contractAddress, 4);
      expect(query.id).toEqual('4');
      expect(query.owner).toEqual(contractAddress);
      expect(query.keys.length).toEqual(0);
      expect(query.query_type).toEqual('tx');
      expect(query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          watchedAddr4 +
          '"}]',
      );
      expect(query.connection_id).toEqual(connectionId);
      expect(query.update_period).toEqual(query4UpdatePeriod.toString());

      query = await getRegisteredQuery(neutronClient, contractAddress, 5);
      expect(query.id).toEqual('5');
      expect(query.owner).toEqual(contractAddress);
      expect(query.keys.length).toEqual(0);
      expect(query.query_type).toEqual('tx');
      expect(query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          watchedAddr5 +
          '"}]',
      );
      expect(query.connection_id).toEqual(connectionId);
      expect(query.update_period).toEqual(query5UpdatePeriod.toString());
    });

    test('make younger sending and check', async () => {
      addr4ExpectedBalance += amountToAddrForth1;
      let balances = await bankQuerierGaia.AllBalances({
        address: watchedAddr4,
      });
      expect(balances.balances).toEqual([]);
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        watchedAddr4,
        [{ denom: COSMOS_DENOM, amount: amountToAddrForth1.toString() }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      expectedIncomingTransfers++;
      expect(res.code).toEqual(0);
      balances = await bankQuerierGaia.AllBalances({ address: watchedAddr4 });
      expect(balances.balances).toEqual([
        {
          amount: addr4ExpectedBalance.toString(),
          denom: COSMOS_DENOM,
        },
      ]);

      await waitForTransfersAmount(
        neutronClient,
        contractAddress,
        expectedIncomingTransfers - 1,
        query4UpdatePeriod * 2,
      );
      // make sure the query4 result is submitted before the query5 one
      let deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr4,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr4,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: addr4ExpectedBalance.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr5,
      );
      expect(deposits.transfers).toEqual([]);

      await waitForTransfersAmount(
        neutronClient,
        contractAddress,
        expectedIncomingTransfers,
        query5UpdatePeriod * 2,
      );
      deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr5,
      );
      // despite query4 tx result was of a greater remote height and was submitted before,
      // query5 tx should be submitted successfully
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr5,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: addr5ExpectedBalance.toString(),
        },
      ]);
    });
  });

  describe('Multiple keys', () => {
    test('Should fail. register filter with 50 keys', async () => {
      // Top up contract address before running query
      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );
      await expect(
        registerTransfersQuery(
          neutronClient,
          contractAddress,
          connectionId,
          query2UpdatePeriod,
          Array(50).fill(watchedAddr2),
        ),
      ).rejects.toThrowError(
        /failed to validate MsgRegisterInterchainQuery: too many transactions filters, provided=50, max=32/,
      );
    });

    test('Should pass. register filter with 50 keys after a proposal', async () => {
      await executeUpdateInterchainQueriesParams(
        chainManagerAddress,
        interchainqQuerier,
        mainDao,
        daoMember,
        undefined,
        50,
      );

      await registerTransfersQuery(
        neutronClient,
        contractAddress,
        connectionId,
        query2UpdatePeriod,
        Array(50).fill(watchedAddr2),
      );
    });

    test('check registered transfers query', async () => {
      const query = await getRegisteredQuery(neutronClient, contractAddress, 6);
      expect(query.id).toEqual('6');
      expect(query.owner).toEqual(contractAddress);
      expect(query.keys.length).toEqual(0);
      expect(query.query_type).toEqual('tx');
      expect(JSON.parse(query.transactions_filter)).toEqual(
        Array(50)
          .fill(watchedAddr2)
          .map((v) => ({ field: 'transfer.recipient', op: 'Eq', value: v })),
      );
      expect(query.connection_id).toEqual(connectionId);
      expect(query.update_period).toEqual(query2UpdatePeriod.toString());
    });
  });

  describe('check contract state is reverted on failed sudo', () => {
    // contract handles only transfers <= 20000, otherwise it ends callback with an error.
    const amountToAddrForth2 = 21000;
    let transfersAmountBeforeSending: number;
    test('send amount that is more than contract allows', async () => {
      // contract tracks total amount of transfers to addresses it watches.
      const transfers = await queryTransfersNumber(
        neutronClient,
        contractAddress,
      );
      expect(transfers.transfers_number).toBeGreaterThan(0);
      transfersAmountBeforeSending = transfers.transfers_number;

      let balances = await gaiaClient.getBalance(watchedAddr4, COSMOS_DENOM);
      expect(balances).toEqual({
        amount: addr4ExpectedBalance.toString(),
        denom: COSMOS_DENOM,
      });
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        watchedAddr4,
        [{ denom: COSMOS_DENOM, amount: amountToAddrForth2.toString() }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      addr4ExpectedBalance += amountToAddrForth2;
      expect(res.code).toEqual(0);
      balances = await gaiaClient.getBalance(watchedAddr4, COSMOS_DENOM);
      expect(balances).toEqual({
        amount: addr4ExpectedBalance.toString(),
        denom: COSMOS_DENOM,
      });
    });

    test('check that transfer has not been recorded', async () => {
      await neutronClient.waitBlocks(query4UpdatePeriod * 2 + 1); // we are waiting for quite a big time just to be sure
      const deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        watchedAddr4,
      );
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr4,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
          amount: (addr4ExpectedBalance - amountToAddrForth2).toString(),
        },
      ]);
      // contract handles only transfers not greater than 20000, otherwise it ends callback with an
      // error. on the error result, the transfers amount previously increased in the sudo func is
      // expected to be reverted.
      const transfers = await queryTransfersNumber(
        neutronClient,
        contractAddress,
      );
      expect(transfers.transfers_number).toEqual(transfersAmountBeforeSending);
    });
  });

  describe('update recipient and check', () => {
    const newWatchedAddr5 = 'cosmos1jy7lsk5pk38zjfnn6nt6qlaphy9uejn4hu65xa';
    it('should update recipient', async () => {
      const query = await getRegisteredQuery(neutronClient, contractAddress, 3);
      const res = await neutronClient.execute(contractAddress, {
        update_interchain_query: {
          query_id: 3,
          new_update_period: query3UpdatePeriod,
          new_recipient: newWatchedAddr5,
          new_keys: query.keys,
        },
      });
      expect(res.code).toEqual(0);
    });
    it('seems registered transfers query is updated', async () => {
      const query = await getRegisteredQuery(neutronClient, contractAddress, 3);
      expect(query.id).toEqual('3');
      expect(query.owner).toEqual(contractAddress);
      expect(query.keys.length).toEqual(0);
      expect(query.query_type).toEqual('tx');
      expect(query.update_period).toEqual(query3UpdatePeriod.toString());
      expect(query.transactions_filter).toEqual(
        '[{"field":"transfer.recipient","op":"Eq","value":"' +
          newWatchedAddr5 +
          '"}]',
      );
      expect(query.connection_id).toEqual(connectionId);
    });

    it('should handle callback on a sending to the new address', async () => {
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        newWatchedAddr5,
        [{ denom: COSMOS_DENOM, amount: '10000' }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      expect(res.code).toEqual(0);
      expectedIncomingTransfers++;
      await waitForTransfersAmount(
        neutronClient,
        contractAddress,
        expectedIncomingTransfers,
        query3UpdatePeriod * 2,
      );
      const deposits = await queryRecipientTxs(
        neutronClient,
        contractAddress,
        newWatchedAddr5,
      );
      expect(deposits.transfers).toMatchObject([
        {
          recipient: newWatchedAddr5,
          sender: gaiaWallet.address,
          denom: COSMOS_DENOM,
        },
      ]);
    });
  });
});
