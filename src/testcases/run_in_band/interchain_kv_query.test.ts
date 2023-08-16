import { proto, rest } from '@cosmos-client/core';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { CosmosSDK } from '@cosmos-client/core/cjs/sdk';
import { Coin } from '@cosmos-client/core/cjs/openapi/api';
import {
  cosmosWrapper,
  COSMOS_DENOM,
  dao,
  icq,
  NEUTRON_DENOM,
  proposal,
  TestStateLocalCosmosTestNet,
  types,
  wait,
} from '@neutron-org/neutronjsplus';

const getKvCallbackStatus = (
  cm: cosmosWrapper.CosmosWrapper,
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
  neutronCm: cosmosWrapper.CosmosWrapper,
  targetCm: cosmosWrapper.CosmosWrapper,
  contractAddress: string,
  queryIds: number[],
) => {
  const statusPrev = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(neutronCm, contractAddress, i)),
  );
  const targetHeight = await wait.getHeight(targetCm.sdk);
  await Promise.all(
    queryIds.map((i) =>
      icq.waitForICQResultWithRemoteHeight(
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
  cm: cosmosWrapper.CosmosWrapper,
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
  cm: cosmosWrapper.CosmosWrapper,
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
  cm: cosmosWrapper.WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  denom: string,
  addr: AccAddress,
) => {
  const txResult = await cm.executeContract(
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

  const attribute = cosmosWrapper.getEventAttribute(
    (txResult as any).events,
    'neutron',
    'query_id',
  );

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

const acceptInterchainqueriesParamsChangeProposal = async (
  cm: cosmosWrapper.WalletWrapper,
  title: string,
  description: string,
  key: string,
  value: string,
) => {
  const daoCoreAddress = (await cm.chain.getChainAdmins())[0];
  const daoContracts = await dao.getDaoContracts(cm.chain, daoCoreAddress);
  const daoMain = new dao.Dao(cm.chain, daoContracts);
  const daoMember = new dao.DaoMember(cm, daoMain);
  const message = proposal.paramChangeProposal({
    title,
    description,
    subspace: 'interchainqueries',
    key,
    value,
  });
  await daoMain.makeSingleChoiceProposalPass(
    [daoMember],
    title,
    description,
    [message],
    '1000',
  );
};

const removeQuery = async (
  cm: cosmosWrapper.WalletWrapper,
  contractAddress: string,
  queryId: number,
) =>
  await cm.executeContract(
    contractAddress,
    JSON.stringify({
      remove_interchain_query: {
        query_id: queryId,
      },
    }),
    [],
  );

const removeQueryViaTx = async (
  cm: cosmosWrapper.WalletWrapper,
  queryId: number,
  sender: string = cm.wallet.address.toString(),
) => await cm.msgRemoveInterchainQuery(queryId, sender);

const registerDelegatorDelegationsQuery = async (
  cm: cosmosWrapper.WalletWrapper,
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
  neutronCm: cosmosWrapper.CosmosWrapper,
  targetCm: cosmosWrapper.CosmosWrapper,
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
  expect(
    cosmosWrapper.filterIBCDenoms(interchainQueryResult.balances.coins),
  ).toEqual(
    cosmosWrapper.filterIBCDenoms(directQueryResult.data.balances as Coin[]),
  );
};

describe('Neutron / Interchain KV Query', () => {
  const connectionId = 'connection-0';
  const updatePeriods: { [key: number]: number } = {
    2: 3,
    3: 4,
    4: 3,
  };
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: cosmosWrapper.CosmosWrapper;
  let gaiaChain: cosmosWrapper.CosmosWrapper;
  let neutronAccount: cosmosWrapper.WalletWrapper;
  let gaiaAccount: cosmosWrapper.WalletWrapper;
  let contractAddress =
    'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq';

  const config = require('../../config.json');

  beforeAll(async () => {
    cosmosWrapper.registerCodecs();

    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
    gaiaChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      COSMOS_DENOM,
    );
    gaiaAccount = new cosmosWrapper.WalletWrapper(
      gaiaChain,
      testState.wallets.cosmos.demo2,
    );

    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await dao.getDaoContracts(
      neutronChain,
      daoCoreAddress,
    );
    const daoMain = new dao.Dao(neutronChain, daoContracts);
    const daoMember = new dao.DaoMember(neutronAccount, daoMain);
    await daoMember.bondFunds('10000000000');
  });

  describe('Instantiate interchain queries contract', () => {
    let codeId: types.CodeId;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(
        types.NeutronContract.INTERCHAIN_QUERIES,
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

  describe('Register interchain queries', () => {
    describe('Deposit escrow for query', () => {
      test('should throw exception because of not enough deposit', async () => {
        expect.assertions(1);

        try {
          await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              register_balance_query: {
                connection_id: connectionId,
                denom: gaiaChain.denom,
                addr: testState.wallets.cosmos.demo2.address.toString(),
                update_period: 10,
              },
            }),
          );
        } catch (err) {
          const error = err as Error;
          expect(error.message).toMatch(/0untrn is smaller than 1000000untrn/i);
        }
      });

      test('should throw exception because of empty keys', async () => {
        await expect(
          neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              integration_tests_register_query_empty_keys: {
                connection_id: connectionId,
              },
            }),
          ),
        ).rejects.toThrowError(/keys cannot be empty/);
      });

      test('should throw exception because of empty key id', async () => {
        await expect(
          neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              integration_tests_register_query_empty_id: {
                connection_id: connectionId,
              },
            }),
          ),
        ).rejects.toThrowError(/keys id cannot be empty/);
      });

      test('should throw exception because of empty key path', async () => {
        await expect(
          neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              integration_tests_register_query_empty_path: {
                connection_id: connectionId,
              },
            }),
          ),
        ).rejects.toThrowError(/keys path cannot be empty/);
      });

      test('should escrow deposit', async () => {
        // Top up contract address before running query
        await neutronAccount.msgSend(contractAddress, '1000000');

        let balances = await neutronChain.queryBalances(contractAddress);
        expect(balances.balances[0].amount).toEqual('1000000');

        await registerBalanceQuery(
          neutronAccount,
          contractAddress,
          connectionId,
          10,
          gaiaChain.denom,
          testState.wallets.cosmos.demo2.address,
        );

        balances = await neutronChain.queryBalances(contractAddress);
        expect(balances.balances.length).toEqual(0);
      });
    });

    describe('Successfully', () => {
      beforeEach(async () => {
        // Top up contract address before running query
        await neutronAccount.msgSend(contractAddress, '1000000');
      });

      test('register icq #2: balance', async () => {
        await registerBalanceQuery(
          neutronAccount,
          contractAddress,
          connectionId,
          updatePeriods[2],
          gaiaChain.denom,
          testState.wallets.cosmos.demo2.address,
        );
      });

      test('register icq #3: balance', async () => {
        await registerBalanceQuery(
          neutronAccount,
          contractAddress,
          connectionId,
          updatePeriods[3],
          gaiaChain.denom,
          testState.wallets.cosmos.val1.address,
        );
      });

      test('register icq #4: delegator delegations', async () => {
        await registerDelegatorDelegationsQuery(
          neutronAccount,
          contractAddress,
          connectionId,
          updatePeriods[4],
          testState.wallets.cosmos.demo2.address,
          [testState.wallets.cosmos.val1.address],
        );
      });
    });
  });

  describe('Get interchain queries', () => {
    test('get registered icq #2: balance', async () => {
      const queryId = 2;
      const queryResult = await icq.getRegisteredQuery(
        neutronChain,
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
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
        updatePeriods[queryId],
      );
    });

    test('get registered icq #3: balance', async () => {
      // in this test, we only focus on parts that are different
      const queryId = 3;
      const queryResult = await icq.getRegisteredQuery(
        neutronChain,
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.keys.length).toEqual(1);
      expect(queryResult.registered_query.update_period).toEqual(
        updatePeriods[queryId],
      );
    });

    test('get registered icq #4: delegator delegations', async () => {
      const queryId = 4;
      const queryResult = await icq.getRegisteredQuery(
        neutronChain,
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      // we expect three keys, 1 always + 2 per validator
      expect(queryResult.registered_query.keys.length).toEqual(3);
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
      expect(queryResult.registered_query.update_period).toEqual(
        updatePeriods[queryId],
      );
    });

    test("registered icq #5 doesn't exist", async () => {
      const queryId = 5;
      await expect(
        icq.getRegisteredQuery(neutronChain, contractAddress, queryId),
      ).rejects.toThrow();
    });
  });

  describe('Perform interchain queries', () => {
    test('perform icq #2: balance', async () => {
      // reduce balance of demo2 wallet
      const queryId = 2;
      const res = await gaiaAccount.msgSend(
        testState.wallets.cosmos.rly2.address.toString(),
        '9000',
      );
      expect(res.code).toEqual(0);
      await icq.waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await wait.getHeight(gaiaChain.sdk),
      );
      await validateBalanceQuery(
        neutronChain,
        gaiaChain,
        contractAddress,
        queryId,
        gaiaAccount.wallet.address,
      );
    });

    test('perform icq #3: balance', async () => {
      // increase balance of val2 wallet
      const queryId = 3;
      const res = await gaiaAccount.msgSend(
        testState.wallets.cosmos.val1.address.toAccAddress().toString(),
        '9000',
      );
      expect(res.code).toEqual(0);
      await icq.waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await wait.getHeight(gaiaChain.sdk),
      );
      await validateBalanceQuery(
        neutronChain,
        gaiaChain,
        contractAddress,
        queryId,
        testState.wallets.cosmos.val1.address.toAccAddress(),
      );
    });

    // TODO: test this query with multiple validators, this is impossible right now
    //       because we only have one node per network in cosmopark
    test('perform icq #4: delegator delegations', async () => {
      const queryId = 4;
      await gaiaAccount.msgDelegate(
        testState.wallets.cosmos.demo2.address.toString(),
        testState.wallets.cosmos.val1.address.toString(),
        '3000',
      );
      await icq.waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await wait.getHeight(gaiaChain.sdk),
      );
      const interchainQueryResult = await getQueryDelegatorDelegationsResult(
        neutronChain,
        contractAddress,
        queryId,
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
        neutronChain,
        gaiaChain,
        contractAddress,
        [2, 3, 4],
      );
    });

    test('enable mock', async () => {
      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_set_query_mock: {},
        }),
      );
    });

    test('callbacks are failing, but contract state is not corrupted', async () => {
      const start = await Promise.all(
        [2, 3, 4].map((i) =>
          getKvCallbackStatus(neutronChain, contractAddress, i),
        ),
      );
      for (let i = 0; i <= Math.max(...Object.values(updatePeriods)); ++i) {
        const res = await Promise.all(
          [2, 3, 4].map((i) =>
            getKvCallbackStatus(neutronChain, contractAddress, i),
          ),
        );
        for (const j of res) {
          expect(j).not.toEqual(0);
        }
        await neutronChain.blockWaiter.waitBlocks(1);
      }
      const end = await Promise.all(
        [2, 3, 4].map((i) =>
          getKvCallbackStatus(neutronChain, contractAddress, i),
        ),
      );
      expect(start).toEqual(end);
    });

    test('disable mock', async () => {
      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_unset_query_mock: {},
        }),
      );
    });

    test('now callbacks work again', async () => {
      await watchForKvCallbackUpdates(
        neutronChain,
        gaiaChain,
        contractAddress,
        [2, 3, 4],
      );
    });
  });

  describe('Remove interchain query', () => {
    test('remove icq #1 using query owner address', async () => {
      let balances = await neutronChain.queryBalances(contractAddress);
      expect(balances.balances.length).toEqual(0);

      await removeQuery(neutronAccount, contractAddress, 1);

      balances = await neutronChain.queryBalances(contractAddress);
      expect(balances.balances[0].amount).toEqual('1000000');
    });

    test('should fail to remove icq #2 from non owner address before timeout expiration', async () => {
      const queryId = 2;
      const result = await removeQueryViaTx(neutronAccount, queryId);
      expect(result.raw_log).toMatch(
        /only owner can remove a query within its service period: unauthorized/i,
      );
    });

    describe('Remove interchain query', () => {
      beforeEach(async () => {
        // Top up contract address before running query
        await neutronAccount.msgSend(contractAddress, '1000000');
      });

      test('should check query creation with governance parameters', async () => {
        const params = await neutronChain.queryInterchainqueriesParams();

        const queryId = await registerBalanceQuery(
          neutronAccount,
          contractAddress,
          connectionId,
          2,
          gaiaChain.denom,
          gaiaAccount.wallet.address,
        );

        await neutronChain.blockWaiter.waitBlocks(1);

        const queryResult = await icq.getRegisteredQuery(
          neutronChain,
          contractAddress,
          queryId,
        );

        expect(queryResult.registered_query.deposit).toEqual(
          params.params.query_deposit,
        );
        expect(queryResult.registered_query.submit_timeout.toString()).toEqual(
          params.params.query_submit_timeout,
        );
      });

      test('should change new query params based on governance proposal', async () => {
        // Get old query params
        const registeredQueryBeforeParamChange = await icq.getRegisteredQuery(
          neutronChain,
          contractAddress,
          2,
        );

        const querySubmitTimeoutParam = 1;

        await acceptInterchainqueriesParamsChangeProposal(
          neutronAccount,
          'Change query_submit_timeout parameter of the interchainqueries module',
          'Change query_submit_timeout parameter of the interchainqueries module',
          'QuerySubmitTimeout',
          `"${querySubmitTimeoutParam.toString()}"`,
        );

        const queryDepositParam: proto.cosmos.base.v1beta1.ICoin[] = [
          {
            amount: '10000',
            denom: NEUTRON_DENOM,
          },
        ];

        await acceptInterchainqueriesParamsChangeProposal(
          neutronAccount,
          'Change query_deposit parameter of the interchainqueries module',
          'Change query_deposit parameter of the interchainqueries module',
          'QueryDeposit',
          JSON.stringify(queryDepositParam),
        );

        const queryId = await registerBalanceQuery(
          neutronAccount,
          contractAddress,
          connectionId,
          10,
          gaiaChain.denom,
          testState.wallets.cosmos.demo2.address,
        );

        await neutronChain.blockWaiter.waitBlocks(1);

        const queryResult = await icq.getRegisteredQuery(
          neutronChain,
          contractAddress,
          queryId,
        );

        expect(queryResult.registered_query.deposit).toEqual(queryDepositParam);
        expect(queryResult.registered_query.submit_timeout.toString()).toEqual(
          '1',
        );

        const interchainQueriesParams =
          await neutronChain.queryInterchainqueriesParams();

        expect(interchainQueriesParams.params.query_deposit).toEqual(
          queryDepositParam,
        );
        expect(interchainQueriesParams.params.query_submit_timeout).toEqual(
          querySubmitTimeoutParam.toString(),
        );

        // Get old query params after param change proposal
        const registeredQueryAfterParamChange = await icq.getRegisteredQuery(
          neutronChain,
          contractAddress,
          2,
        );

        expect(
          registeredQueryBeforeParamChange.registered_query.deposit,
        ).toEqual(registeredQueryAfterParamChange.registered_query.deposit);
        expect(
          registeredQueryBeforeParamChange.registered_query.deposit,
        ).toEqual(registeredQueryAfterParamChange.registered_query.deposit);
      });

      test('should remove icq and check balances updates', async () => {
        const balancesBeforeRegistration = await neutronChain.queryBalances(
          testState.wallets.neutron.demo1.address.toString(),
        );
        balancesBeforeRegistration.balances = cosmosWrapper.filterIBCDenoms(
          balancesBeforeRegistration.balances as Coin[],
        );

        const queryId = await registerBalanceQuery(
          neutronAccount,
          contractAddress,
          connectionId,
          15,
          gaiaChain.denom,
          testState.wallets.cosmos.demo2.address,
        );

        await wait.getWithAttempts(
          neutronChain.blockWaiter,
          () => icq.getRegisteredQuery(neutronChain, contractAddress, queryId),
          async (response) =>
            response.registered_query.last_submitted_result_local_height > 0 &&
            response.registered_query.last_submitted_result_local_height + 5 <
              (await wait.getHeight(neutronChain.sdk)),
          20,
        );

        const balancesAfterRegistration = await neutronChain.queryBalances(
          testState.wallets.neutron.demo1.address.toString(),
        );
        balancesAfterRegistration.balances = cosmosWrapper.filterIBCDenoms(
          balancesAfterRegistration.balances as Coin[],
        );

        await removeQueryViaTx(neutronAccount, queryId);

        await wait.getWithAttempts(
          neutronChain.blockWaiter,
          async () =>
            await neutronChain.queryBalances(
              testState.wallets.neutron.demo1.address.toString(),
            ),
          async (response) => {
            const balances = cosmosWrapper.filterIBCDenoms(
              response.balances as Coin[],
            );
            const beforeBalances = balancesAfterRegistration.balances;
            return (
              balances[0].denom === balances[0].denom &&
              parseInt(balances[0].amount || '0') >
                parseInt(beforeBalances[0].amount || '0')
            );
          },

          100,
        );

        const balancesAfterRemoval = await neutronChain.queryBalances(
          testState.wallets.neutron.demo1.address.toString(),
        );
        balancesAfterRemoval.balances = cosmosWrapper.filterIBCDenoms(
          balancesAfterRemoval.balances as Coin[],
        );
        // Add fees (100) that was deducted during removeQueryViaTx call
        const balancesAfterRemovalWithFee = {
          ...balancesAfterRemoval,
          balances: [
            {
              denom: balancesAfterRemoval.balances[0].denom,
              amount: (
                parseInt(balancesAfterRemoval.balances[0].amount || '') + 1000
              ).toString(),
            },
          ],
        };

        expect(balancesAfterRemovalWithFee).toEqual(balancesBeforeRegistration);
      });
    });
  });
});
