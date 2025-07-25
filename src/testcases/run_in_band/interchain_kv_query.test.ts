import {
  acceptInterchainqueriesParamsChangeProposal,
  executeUpdateInterchainQueriesParams,
  filterIBCDenoms,
} from '../../helpers/interchainqueries';
import '@neutron-org/neutronjsplus';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { getEventAttribute } from '@neutron-org/neutronjsplus/dist/cosmos';
import { inject } from 'vitest';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import {
  getRegisteredQuery,
  waitForICQResultWithRemoteHeight,
} from '../../helpers/interchainqueries';
import { LocalState } from '../../helpers/local_state';
import { Coin, Registry } from '@cosmjs/proto-signing';
import {
  executeMsgSubmitProposal,
  executeMsgVote,
  executeMsgDelegate,
  executeMsgUndelegate,
} from '../../helpers/gaia';
import {
  getDelegatorUnbondingDelegationsResult,
  getKvCallbackStatus,
  getProposalsResult,
  getProposalVotesResult,
  getQueryBalanceResult,
  getQueryDelegatorDelegationsResult,
  getValidatorsSigningInfosResult,
  registerBalancesQuery,
  registerDelegatorDelegationsQuery,
  registerGovProposalsQuery,
  registerProposalVotesQuery,
  registerSigningInfoQuery,
  registerUnbondingDelegationsQuery,
  removeQuery,
  removeQueryViaTx,
  validateBalanceQuery,
  watchForKvCallbackUpdates,
} from '../../helpers/interchainqueries';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import {
  defaultRegistryTypes,
  ProtobufRpcClient,
  SigningStargateClient,
} from '@cosmjs/stargate';
import {
  CONTRACTS,
  COSMOS_DENOM,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { QueryClientImpl as InterchainqQuerier } from '@neutron-org/neutronjs/neutron/interchainqueries/query.rpc.Query';
import { QueryClientImpl as BankQuerier } from 'cosmjs-types/cosmos/bank/v1beta1/query';
import { QueryClientImpl as SlashingQuerier } from 'cosmjs-types/cosmos/slashing/v1beta1/query';
import config from '../../config.json';
import { GaiaWallet, Wallet } from '../../helpers/wallet';

describe('Neutron / Interchain KV Query', () => {
  const connectionId = 'connection-0';
  const updatePeriods: { [key: number]: number } = {
    2: 3,
    3: 4,
    4: 3,
    5: 4,
    6: 11,
  };
  let testState: LocalState;
  let neutronClient: NeutronTestClient;
  let neutronRpcClient: ProtobufRpcClient;
  let gaiaClient: SigningStargateClient;
  let gaiaClient2: SigningStargateClient;
  let gaiaWallet: GaiaWallet;
  let gaiaWallet2: GaiaWallet;
  let neutronWallet: Wallet;
  let otherNeutronClient: NeutronTestClient;
  let interchainqQuerier: InterchainqQuerier;
  let bankQuerier: BankQuerier;
  let bankQuerierGaia: BankQuerier;
  let slashingQuerier: SlashingQuerier;
  let contractAddress: string;
  let daoMember: DaoMember;
  let mainDao: Dao;
  let chainManagerAddress: string;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);
    const otherNeutronWallet = await testState.nextNeutronWallet();
    otherNeutronClient = await NeutronTestClient.connectWithSigner(
      otherNeutronWallet,
    );
    gaiaWallet = await testState.nextGaiaWallet();
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.signer,
      { registry: new Registry(defaultRegistryTypes) },
    );

    gaiaWallet2 = await testState.nextGaiaWallet();
    gaiaClient2 = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet2.signer,
      { registry: new Registry(defaultRegistryTypes) },
    );

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
    bankQuerier = new BankQuerier(neutronRpcClient);
    bankQuerierGaia = new BankQuerier(await testState.gaiaRpcClient());
    slashingQuerier = new SlashingQuerier(await testState.gaiaRpcClient());

    const adminQuery = new AdminQueryClient(neutronRpcClient);
    const admins = await adminQuery.admins();
    chainManagerAddress = admins.admins[0];
  });

  describe('Instantiate interchain queries contract', () => {
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

  describe('Register interchain queries', () => {
    describe('Deposit escrow for query', () => {
      test('should throw exception because of not enough deposit', async () => {
        expect.assertions(1);

        try {
          await neutronClient.execute(contractAddress, {
            register_balances_query: {
              connection_id: connectionId,
              denoms: [COSMOS_DENOM],
              addr: gaiaWallet.address,
              update_period: 10,
            },
          });
        } catch (err) {
          const error = err as Error;
          expect(error.message).toMatch(
            /spendable balance 0untrn is smaller than 1000000untrn/i,
          );
        }
      });

      test('should throw exception because of empty keys', async () => {
        await expect(
          neutronClient.execute(contractAddress, {
            integration_tests_register_query_empty_keys: {
              connection_id: connectionId,
            },
          }),
        ).rejects.toThrowError(/keys cannot be empty/);
      });

      test('should throw exception because of empty key id', async () => {
        await expect(
          neutronClient.execute(contractAddress, {
            integration_tests_register_query_empty_id: {
              connection_id: connectionId,
            },
          }),
        ).rejects.toThrowError(/keys id cannot be empty/);
      });

      test('should throw exception because of empty key path', async () => {
        await expect(
          neutronClient.execute(contractAddress, {
            integration_tests_register_query_empty_path: {
              connection_id: connectionId,
            },
          }),
        ).rejects.toThrowError(/keys path cannot be empty/);
      });

      test('should escrow deposit', async () => {
        // Top up contract address before running query
        await neutronClient.sendTokens(
          contractAddress,
          [{ denom: NEUTRON_DENOM, amount: '1000000' }],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
        let balances = await bankQuerier.AllBalances({
          address: contractAddress,
        });
        expect(balances.balances[0].amount).toEqual('1000000');

        await registerBalancesQuery(
          neutronClient,
          contractAddress,
          connectionId,
          10,
          [COSMOS_DENOM],
          gaiaWallet.address,
        );

        balances = await bankQuerier.AllBalances({
          address: contractAddress,
        });

        expect(balances.balances.length).toEqual(0);
      });

      test('should throw exception because of too many keys', async () => {
        await neutronClient.sendTokens(
          contractAddress,
          [{ denom: NEUTRON_DENOM, amount: '1000000' }],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
        await expect(
          neutronClient.execute(contractAddress, {
            register_balances_query: {
              connection_id: connectionId,
              denoms: Array.from(Array(33).keys()).map((v) => 'denom' + v),
              addr: gaiaWallet.address,
              update_period: 10,
            },
          }),
        ).rejects.toThrowError(/keys count cannot be more than 32/);
        await executeUpdateInterchainQueriesParams(
          chainManagerAddress,
          interchainqQuerier,
          mainDao,
          daoMember,
          10,
          undefined,
        );
        await expect(
          neutronClient.execute(contractAddress, {
            register_balances_query: {
              connection_id: connectionId,
              denoms: Array.from(Array(11).keys()).map((v) => 'denom' + v),
              addr: gaiaWallet.address,
              update_period: 10,
            },
          }),
        ).rejects.toThrowError(/keys count cannot be more than 10/);
      });
    });

    describe('Successfully', () => {
      beforeEach(async () => {
        // Top up contract address before running query
        await neutronClient.sendTokens(
          contractAddress,
          [{ denom: NEUTRON_DENOM, amount: '1000000' }],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
      });

      test('register icq #2: balance', async () => {
        await registerBalancesQuery(
          neutronClient,
          contractAddress,
          connectionId,
          updatePeriods[2],
          [COSMOS_DENOM],
          gaiaWallet.address,
        );
      });

      test('register icq #3: balance', async () => {
        await registerBalancesQuery(
          neutronClient,
          contractAddress,
          connectionId,
          updatePeriods[3],
          [COSMOS_DENOM],
          testState.wallets.cosmos.val1.address,
        );
      });

      test('register icq #4: delegator delegations', async () => {
        await registerDelegatorDelegationsQuery(
          neutronClient,
          contractAddress,
          connectionId,
          updatePeriods[4],
          gaiaWallet.address,
          [testState.wallets.cosmos.val1.valAddress],
        );
      });

      test('register icq #5: multiple balances', async () => {
        await registerBalancesQuery(
          neutronClient,
          contractAddress,
          connectionId,
          updatePeriods[5],
          [COSMOS_DENOM, 'nonexistentdenom'],
          testState.wallets.cosmos.val1.address,
        );
      });

      test('register icq #6: 100 keys', async () => {
        await executeUpdateInterchainQueriesParams(
          chainManagerAddress,
          interchainqQuerier,
          mainDao,
          daoMember,
          100,
          undefined,
        );
        await registerBalancesQuery(
          neutronClient,
          contractAddress,
          connectionId,
          updatePeriods[6],
          Array.from(Array(100).keys()).map((v) => 'denom' + v),
          testState.wallets.cosmos.val1.address,
        );
      });

      test('register icq #7: balance', async () => {
        await registerBalancesQuery(
          neutronClient,
          contractAddress,
          connectionId,
          1_000_000,
          [COSMOS_DENOM],
          testState.wallets.cosmos.val1.address,
        );
      });
    });
  });

  describe('Get interchain queries', () => {
    test('get registered icq #2: balance', async () => {
      const queryId = 2;
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(queryResult.id).toEqual(queryId.toString());
      expect(queryResult.owner).toEqual(contractAddress);
      expect(queryResult.keys.length).toEqual(1);
      expect(queryResult.keys[0].path).toEqual('bank');
      expect(queryResult.keys[0].key.length).toBeGreaterThan(0);
      expect(queryResult.query_type).toEqual('kv');
      expect(queryResult.transactions_filter).toEqual('');
      expect(queryResult.connection_id).toEqual(connectionId);
      expect(queryResult.update_period).toEqual(
        updatePeriods[queryId].toString(),
      );
    });

    test('get registered icq #3: balance', async () => {
      // in this test, we only focus on parts that are different
      const queryId = 3;
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(queryResult.id).toEqual(queryId.toString());
      expect(queryResult.keys.length).toEqual(1);
      expect(queryResult.update_period).toEqual(
        updatePeriods[queryId].toString(),
      );
    });

    test('get registered icq #4: delegator delegations', async () => {
      const queryId = 4;
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(queryResult.id).toEqual(queryId.toString());
      expect(queryResult.owner).toEqual(contractAddress);
      // we expect three keys, 1 always + 2 per validator
      expect(queryResult.keys.length).toEqual(3);
      expect(queryResult.query_type).toEqual('kv');
      expect(queryResult.transactions_filter).toEqual('');
      expect(queryResult.connection_id).toEqual(connectionId);
      expect(queryResult.update_period).toEqual(
        updatePeriods[queryId].toString(),
      );
    });

    test('get registered icq #5: multiple balances', async () => {
      const queryId = 5;
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(queryResult.id).toEqual(queryId.toString());
      expect(queryResult.owner).toEqual(contractAddress);
      expect(queryResult.keys.length).toEqual(2);
      expect(queryResult.keys[0].path).toEqual('bank');
      expect(queryResult.keys[0].key.length).toBeGreaterThan(0);
      expect(queryResult.keys[1].path).toEqual('bank');
      expect(queryResult.keys[1].key.length).toBeGreaterThan(0);
      expect(queryResult.query_type).toEqual('kv');
      expect(queryResult.transactions_filter).toEqual('');
      expect(queryResult.connection_id).toEqual(connectionId);
      expect(queryResult.update_period).toEqual(
        updatePeriods[queryId].toString(),
      );
    });

    test('get registered icq #6: 100 keys', async () => {
      const queryId = 6;
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(queryResult.id).toEqual(queryId.toString());
      expect(queryResult.owner).toEqual(contractAddress);
      expect(queryResult.keys.length).toEqual(100);
      for (let i = 0; i < queryResult.keys.length; i++) {
        expect(queryResult.keys[i].path).toEqual('bank');
        expect(queryResult.keys[i].key.length).toBeGreaterThan(0);
      }

      expect(queryResult.query_type).toEqual('kv');
      expect(queryResult.transactions_filter).toEqual('');
      expect(queryResult.connection_id).toEqual(connectionId);
      expect(queryResult.update_period).toEqual(
        updatePeriods[queryId].toString(),
      );
    });

    test('get registered icq #7: balance', async () => {
      const queryId = 7;
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );

      expect(+queryResult.last_submitted_result_local_height).greaterThan(0);
      expect(+queryResult.last_submitted_result_local_height).lessThan(
        +queryResult.update_period,
      );
    });

    test("registered icq #8 doesn't exist", async () => {
      const queryId = 8;
      await expect(
        getRegisteredQuery(neutronClient, contractAddress, queryId),
      ).rejects.toThrow();
    });
  });

  describe('Perform interchain queries', () => {
    test('perform icq #2: balance', async () => {
      // reduce balance of 2nd wallet
      const queryId = 2;
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        gaiaWallet2.address,
        [{ denom: COSMOS_DENOM, amount: '9000' }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      expect(res.code).toEqual(0);
      await waitForICQResultWithRemoteHeight(
        neutronClient,
        contractAddress,
        queryId,
        await gaiaClient.getHeight(),
      );
      await validateBalanceQuery(
        neutronClient,
        bankQuerierGaia,
        contractAddress,
        queryId,
        gaiaWallet.address,
      );
    });

    test('perform icq #3: balance', async () => {
      // increase balance of val2 wallet
      const queryId = 3;
      const res = await gaiaClient.sendTokens(
        gaiaWallet.address,
        testState.wallets.cosmos.val1.address,
        [{ denom: COSMOS_DENOM, amount: '9000' }],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      expect(res.code).toEqual(0);
      await waitForICQResultWithRemoteHeight(
        neutronClient,
        contractAddress,
        queryId,
        await gaiaClient.getHeight(),
      );
      await validateBalanceQuery(
        neutronClient,
        bankQuerierGaia,
        contractAddress,
        queryId,
        testState.wallets.cosmos.val1.address,
      );
    });

    // TODO: test this query with multiple validators, this is impossible right now
    //       because we only have one node per network in cosmopark
    test('perform icq #4: delegator delegations', async () => {
      const queryId = 4;
      await executeMsgDelegate(
        gaiaClient,
        gaiaWallet,
        testState.wallets.cosmos.val1.valAddress,
        '1500000',
      );
      await waitForICQResultWithRemoteHeight(
        neutronClient,
        contractAddress,
        queryId,
        await gaiaClient.getHeight(),
      );
      const interchainQueryResult = await getQueryDelegatorDelegationsResult(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(interchainQueryResult.delegations[0].amount.amount).toEqual(
        (1500000).toString(),
      );
    });

    test('perform icq #5: multiple balances', async () => {
      const queryId = 5;
      await waitForICQResultWithRemoteHeight(
        neutronClient,
        contractAddress,
        queryId,
        await gaiaClient.getHeight(),
      );

      const interchainQueryResult = await getQueryBalanceResult(
        neutronClient,
        contractAddress,
        queryId,
      );
      const directQueryResult = await bankQuerierGaia.AllBalances({
        address: testState.wallets.cosmos.val1.address,
      });
      expect(interchainQueryResult.balances.coins.length).toEqual(2);
      expect(
        interchainQueryResult.balances.coins.find(
          (c) => c.denom == COSMOS_DENOM,
        ),
      ).toBeDefined();
      expect(
        interchainQueryResult.balances.coins.find(
          (c) => c.denom == COSMOS_DENOM,
        )?.amount,
      ).toEqual(
        directQueryResult?.balances.find((c) => c.denom == COSMOS_DENOM)
          ?.amount,
      );
      expect(
        directQueryResult?.balances.find((c) => c.denom == 'nonexistentdenom'),
      ).toEqual(undefined);
      expect(
        interchainQueryResult.balances.coins.find(
          (c) => c.denom == 'nonexistentdenom',
        ),
      ).toBeDefined();
      expect(
        interchainQueryResult.balances.coins.find(
          (c) => c.denom == 'nonexistentdenom',
        )?.amount,
      ).toEqual('0');
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
        neutronClient,
        gaiaClient,
        contractAddress,
        [2, 3, 4],
      );
    });

    test('enable mock', async () => {
      await neutronClient.execute(contractAddress, {
        integration_tests_set_query_mock: {},
      });
    });

    test('callbacks are failing, but contract state is not corrupted', async () => {
      const start = await Promise.all(
        [2, 3, 4].map((i) =>
          getKvCallbackStatus(neutronClient, contractAddress, i),
        ),
      );
      for (let i = 0; i <= Math.max(...Object.values(updatePeriods)); ++i) {
        const res = await Promise.all(
          [2, 3, 4].map((i) =>
            getKvCallbackStatus(neutronClient, contractAddress, i),
          ),
        );
        for (const j of res) {
          expect(j).not.toEqual(0);
        }
        await neutronClient.waitBlocks(1);
      }
      const end = await Promise.all(
        [2, 3, 4].map((i) =>
          getKvCallbackStatus(neutronClient, contractAddress, i),
        ),
      );
      expect(start).toEqual(end);
    });

    test('disable mock', async () => {
      await neutronClient.execute(contractAddress, {
        integration_tests_unset_query_mock: {},
      });
    });

    test('now callbacks work again', async () => {
      await watchForKvCallbackUpdates(
        neutronClient,
        gaiaClient,
        contractAddress,
        [2, 3, 4],
      );
    });
  });

  describe('Remove interchain query', () => {
    test('remove icq #1 using query owner address', async () => {
      await removeQuery(neutronClient, contractAddress, 1);

      const balances = await bankQuerier.AllBalances({
        address: contractAddress,
      });

      expect(balances.balances[0].amount).toEqual('2000000');
    });

    test('should fail to remove icq #2 from non owner address before timeout expiration', async () => {
      const queryId = 2n;
      const result = await removeQueryViaTx(otherNeutronClient, queryId);
      expect(JSON.stringify(result.rawLog)).toMatch(
        /only owner can remove a query within its service period: unauthorized/i,
      );
    });

    describe('Remove interchain query', () => {
      beforeEach(async () => {
        // Top up contract address before running query
        await neutronClient.sendTokens(
          contractAddress,
          [{ denom: NEUTRON_DENOM, amount: '1000000' }],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
      });

      test('should check query creation with governance parameters', async () => {
        const params = await interchainqQuerier.params();

        const queryId = await registerBalancesQuery(
          neutronClient,
          contractAddress,
          connectionId,
          2,
          [COSMOS_DENOM],
          gaiaWallet2.address,
        );

        await neutronClient.waitBlocks(1);

        const queryResult = await getRegisteredQuery(
          neutronClient,
          contractAddress,
          queryId,
        );

        expect(queryResult.deposit).toEqual(params.params.queryDeposit);
        expect(queryResult.submit_timeout.toString()).toEqual(
          params.params.querySubmitTimeout.toString(),
        );
      });

      // FIXME: fix update params
      test.skip('should change new query params based on governance proposal', async () => {
        // Get old query params
        const registeredQueryBeforeParamChange = await getRegisteredQuery(
          neutronClient,
          contractAddress,
          2,
        );

        const querySubmitTimeoutParam = 1;

        await acceptInterchainqueriesParamsChangeProposal(
          neutronWallet.address,
          neutronClient.client,
          neutronRpcClient,
          'Change query_submit_timeout parameter of the interchainqueries module',
          'Change query_submit_timeout parameter of the interchainqueries module',
          'QuerySubmitTimeout',
          `"${querySubmitTimeoutParam.toString()}"`,
        );

        const queryDepositParam: Coin[] = [
          {
            amount: '10000',
            denom: NEUTRON_DENOM,
          },
        ];

        await acceptInterchainqueriesParamsChangeProposal(
          neutronWallet.address,
          neutronClient.client,
          neutronRpcClient,
          'Change query_deposit parameter of the interchainqueries module',
          'Change query_deposit parameter of the interchainqueries module',
          'QueryDeposit',
          JSON.stringify(queryDepositParam),
        );

        const queryId = await registerBalancesQuery(
          neutronClient,
          contractAddress,
          connectionId,
          10,
          [COSMOS_DENOM],
          gaiaWallet.address,
        );

        await neutronClient.waitBlocks(1);

        const queryResult = await getRegisteredQuery(
          neutronClient,
          contractAddress,
          queryId,
        );

        expect(queryResult.deposit).toEqual(queryDepositParam);
        expect(queryResult.submit_timeout.toString()).toEqual('1');

        const interchainQueriesParams = await interchainqQuerier.params();

        expect(interchainQueriesParams.params.queryDeposit).toEqual(
          queryDepositParam,
        );
        expect(interchainQueriesParams.params.querySubmitTimeout).toEqual(
          querySubmitTimeoutParam.toString(),
        );

        // Get old query params after param change proposal
        const registeredQueryAfterParamChange = await getRegisteredQuery(
          neutronClient,
          contractAddress,
          2,
        );

        expect(registeredQueryBeforeParamChange.deposit).toEqual(
          registeredQueryAfterParamChange.deposit,
        );
        expect(registeredQueryBeforeParamChange.deposit).toEqual(
          registeredQueryAfterParamChange.deposit,
        );
      });

      // FIXME: enable after fix change params via proposal
      test.skip('should remove icq and check balances updates', async () => {
        let balancesBeforeRegistration = (
          await bankQuerier.AllBalances({
            address: testState.wallets.neutron.demo1.address,
          })
        ).balances;
        balancesBeforeRegistration = filterIBCDenoms(
          balancesBeforeRegistration,
        );

        const queryId = await registerBalancesQuery(
          neutronClient,
          contractAddress,
          connectionId,
          15,
          [COSMOS_DENOM],
          gaiaWallet.address,
        );

        await neutronClient.getWithAttempts(
          () => getRegisteredQuery(neutronClient, contractAddress, queryId),
          async (response) =>
            +response.last_submitted_result_local_height > 0 &&
            +response.last_submitted_result_local_height + 5 <
              (await neutronClient.getHeight()),
          20,
        );

        let balancesAfterRegistration = (
          await bankQuerier.AllBalances({
            address: testState.wallets.neutron.demo1.address,
          })
        ).balances;

        balancesAfterRegistration = filterIBCDenoms(balancesAfterRegistration);

        await removeQueryViaTx(neutronClient, BigInt(queryId));

        await neutronClient.getWithAttempts(
          async () =>
            (
              await bankQuerier.AllBalances({
                address: testState.wallets.neutron.demo1.address,
              })
            ).balances,
          async (response) => {
            const balances = filterIBCDenoms(response);
            const beforeBalances = filterIBCDenoms(balancesAfterRegistration);
            return (
              balances[0].denom === beforeBalances[0].denom &&
              parseInt(balances[0].amount || '0') >
                parseInt(beforeBalances[0].amount || '0')
            );
          },

          100,
        );

        let balancesAfterRemoval = (
          await bankQuerier.AllBalances({
            address: testState.wallets.neutron.demo1.address,
          })
        ).balances;

        balancesAfterRemoval = filterIBCDenoms(balancesAfterRemoval);
        // Add fees (100) that was deducted during removeQueryViaTx call
        const balancesAfterRemovalWithFee = {
          ...balancesAfterRemoval,
          balances: [
            {
              denom: balancesAfterRemoval[0].denom,
              amount: (
                parseInt(balancesAfterRemoval[0].amount || '') + 1000
              ).toString(),
            },
          ],
        };

        expect(balancesAfterRemovalWithFee).toEqual(balancesBeforeRegistration);
      });
    });
  });

  describe('Proposal votes query', () => {
    let queryId: number;
    let proposalId: number;

    beforeEach(async () => {
      // Top up contract address before running query
      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );
      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );

      const proposalResp = await executeMsgSubmitProposal(
        gaiaClient2,
        gaiaWallet2,
        '1250',
      );

      proposalId = parseInt(
        getEventAttribute(
          proposalResp.events,
          'submit_proposal',
          'proposal_id',
        ),
      );

      await executeMsgVote(gaiaClient, gaiaWallet, proposalId, '1250');

      queryId = await registerProposalVotesQuery(
        neutronClient,
        contractAddress,
        connectionId,
        updatePeriods[2],
        proposalId,
        [
          gaiaWallet.address,
          'cosmos1fku9gl93dy3z4d2y58gza06un72ulmd8trruxw', // Random address to check absent vote behavior in the result
        ],
      );
    });

    test('proposal votes registered query data', async () => {
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(queryResult.id).toEqual(queryId.toString());
      expect(queryResult.owner).toEqual(contractAddress);
      // XXX: I could actually check that "key" is correctly derived from contractAddress,
      //      but this requires bech32 decoding/encoding shenanigans
      expect(queryResult.keys.length).toEqual(2);
      expect(queryResult.keys[0].path).toEqual('gov');
      expect(queryResult.keys[0].key.length).toBeGreaterThan(0);
      expect(queryResult.query_type).toEqual('kv');
      expect(queryResult.transactions_filter).toEqual('');
      expect(queryResult.connection_id).toEqual(connectionId);
    });

    test('proposal votes data', async () => {
      await waitForICQResultWithRemoteHeight(
        neutronClient,
        contractAddress,
        queryId,
        await gaiaClient.getHeight(),
      );

      const interchainQueryResult = await getProposalVotesResult(
        neutronClient,
        contractAddress,
        queryId,
      );

      expect(interchainQueryResult.votes.proposal_votes).toEqual([
        {
          proposal_id: proposalId,
          voter: gaiaWallet.address,
          options: [{ option: 1, weight: '1.000000000000000000' }],
        },
        { proposal_id: 0, voter: '', options: [] }, // Absent vote for random address (see above, about address cosmos1fku9gl93dy3z4d2y58gza06un72ulmd8trruxw)
      ]);
    });
  });

  describe('Government proposals query', () => {
    let queryId: number;
    let proposalId: number;

    beforeEach(async () => {
      // Top up contract address before running query
      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );

      const proposalResp = await executeMsgSubmitProposal(
        gaiaClient,
        gaiaWallet,
        '1250',
      );

      proposalId = parseInt(
        getEventAttribute(
          proposalResp.events,
          'submit_proposal',
          'proposal_id',
        ),
      );

      queryId = await registerGovProposalsQuery(
        neutronClient,
        contractAddress,
        connectionId,
        updatePeriods[2],
        [proposalId, proposalId + 1, proposalId + 2], // Send proposalId as well as a couple of non-existent proposals, to check result
      );
    });

    test('proposals registered query data', async () => {
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(queryResult.id).toEqual(queryId.toString());
      expect(queryResult.owner).toEqual(contractAddress);
      // XXX: I could actually check that "key" is correctly derived from contractAddress,
      //      but this requires bech32 decoding/encoding shenanigans
      expect(queryResult.keys.length).toEqual(3);
      expect(queryResult.keys[0].path).toEqual('gov');
      expect(queryResult.keys[0].key.length).toBeGreaterThan(0);
      expect(queryResult.query_type).toEqual('kv');
      expect(queryResult.transactions_filter).toEqual('');
      expect(queryResult.connection_id).toEqual(connectionId);
    });

    test('proposals data', async () => {
      await waitForICQResultWithRemoteHeight(
        neutronClient,
        contractAddress,
        queryId,
        await gaiaClient.getHeight(),
      );

      const interchainQueryResult = await getProposalsResult(
        neutronClient,
        contractAddress,
        queryId,
      );

      expect(interchainQueryResult.proposals.proposals).toEqual([
        {
          proposal_id: proposalId,
          proposal_type: '/cosmos.gov.v1.MsgExecLegacyContent',
          total_deposit: [{ denom: 'uatom', amount: '10000000' }],
          status: 2,
          submit_time: expect.any(Number),
          deposit_end_time: expect.any(Number),
          voting_start_time: expect.any(Number),
          voting_end_time: expect.any(Number),
          final_tally_result: {
            yes: '0',
            no: '0',
            abstain: '0',
            no_with_veto: '0',
          },
        },
        // These are non-existent proposals in the KV result
        {
          proposal_id: 0,
          proposal_type: null,
          total_deposit: [],
          status: 0,
          submit_time: null,
          deposit_end_time: null,
          voting_start_time: null,
          voting_end_time: null,
          final_tally_result: null,
        },
        {
          proposal_id: 0,
          proposal_type: null,
          total_deposit: [],
          status: 0,
          submit_time: null,
          deposit_end_time: null,
          voting_start_time: null,
          voting_end_time: null,
          final_tally_result: null,
        },
      ]);
    });
  });

  describe('Signing info query', () => {
    let queryId: number;
    let indexOffset: bigint;
    let cosmosvalconspub: string;
    beforeEach(async () => {
      // Top up contract address before running query
      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );

      const infos = await slashingQuerier.SigningInfos();
      expect(infos).not.toBeNull();
      const firstValidator = infos.info[0];
      indexOffset = firstValidator.indexOffset;
      cosmosvalconspub = firstValidator.address;

      queryId = await registerSigningInfoQuery(
        neutronClient,
        contractAddress,
        connectionId,
        updatePeriods[2],
        cosmosvalconspub,
      );
    });

    test('signing info registered query data', async () => {
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(queryResult.id).toEqual(queryId.toString());
      expect(queryResult.owner).toEqual(contractAddress);
      expect(queryResult.keys.length).toEqual(1);
      expect(queryResult.keys[0].path).toEqual('slashing');
      expect(queryResult.keys[0].key.length).toBeGreaterThan(0);
      expect(queryResult.query_type).toEqual('kv');
      expect(queryResult.transactions_filter).toEqual('');
      expect(queryResult.connection_id).toEqual(connectionId);
    });

    test('signing info data', async () => {
      await waitForICQResultWithRemoteHeight(
        neutronClient,
        contractAddress,
        queryId,
        await gaiaClient.getHeight(),
      );

      const interchainQueryResult = await getValidatorsSigningInfosResult(
        neutronClient,
        contractAddress,
        queryId,
      );

      expect(
        interchainQueryResult.signing_infos.signing_infos[0].address,
      ).toEqual(cosmosvalconspub);

      expect(
        parseInt(
          interchainQueryResult.signing_infos.signing_infos[0].index_offset,
        ),
      ).toBeGreaterThan(indexOffset);
    });
  });

  describe('Unbonding delegations query', () => {
    let queryId: number;
    let validatorAddress: string;
    let delegatorAddress: string;

    beforeAll(async () => {
      validatorAddress = testState.wallets.cosmos.val1.valAddress;
      delegatorAddress = gaiaWallet.address;

      await executeMsgDelegate(
        gaiaClient,
        gaiaWallet,
        validatorAddress,
        '3000',
      );
      await executeMsgUndelegate(
        gaiaClient,
        gaiaWallet,
        validatorAddress,
        '2000',
      );

      // Top up contract address before running query
      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );

      queryId = await registerUnbondingDelegationsQuery(
        neutronClient,
        contractAddress,
        connectionId,
        updatePeriods[2],
        delegatorAddress,
        validatorAddress,
      );
    });

    test('registered query data', async () => {
      const queryResult = await getRegisteredQuery(
        neutronClient,
        contractAddress,
        queryId,
      );
      expect(queryResult.id).toEqual(queryId.toString());
      expect(queryResult.owner).toEqual(contractAddress);
      expect(queryResult.keys.length).toEqual(1);
      expect(queryResult.keys[0].path).toEqual('staking');
      expect(queryResult.keys[0].key.length).toBeGreaterThan(0);
      expect(queryResult.query_type).toEqual('kv');
      expect(queryResult.transactions_filter).toEqual('');
      expect(queryResult.connection_id).toEqual(connectionId);
    });

    test('query result', async () => {
      await waitForICQResultWithRemoteHeight(
        neutronClient,
        contractAddress,
        queryId,
        await gaiaClient.getHeight(),
      );

      const interchainQueryResult =
        await getDelegatorUnbondingDelegationsResult(
          neutronClient,
          contractAddress,
          queryId,
        );
      expect(interchainQueryResult.last_submitted_local_height).toBeGreaterThan(
        0,
      );
      expect(
        interchainQueryResult.unbonding_delegations.unbonding_responses,
      ).toEqual([
        {
          delegator_address: gaiaWallet.address,
          validator_address: validatorAddress,
          entries: [
            {
              balance: '2000',
              completion_time: expect.any(String),
              creation_height: expect.any(Number),
              initial_balance: '2000',
            },
          ],
        },
      ]);
    });
  });
});
