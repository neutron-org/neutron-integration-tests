import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  filterIBCDenoms,
  getEventAttribute,
  NEUTRON_DENOM,
  WalletWrapper,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import {
  COSMOS_DENOM,
  TestStateLocalCosmosTestNet,
} from '@neutron-org/neutronjsplus';
import { getWithAttempts } from '@neutron-org/neutronjsplus/dist/wait';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import cosmosclient from '@cosmos-client/core';
import { getHeight } from '@neutron-org/neutronjsplus/dist/env';
import {
  getRegisteredQuery,
  waitForICQResultWithRemoteHeight,
} from '@neutron-org/neutronjsplus/dist/icq';
import { CodeId, NeutronContract } from '@neutron-org/neutronjsplus/dist/types';
import { paramChangeProposal } from '@neutron-org/neutronjsplus/dist/proposal';
import axios from 'axios';
import { msgDelegate, msgUndelegate } from '../../helpers/gaia';
import ICoin = cosmosclient.proto.cosmos.base.v1beta1.ICoin;
import { msgSubmitProposal, msgVote } from '../../helpers/gaia';

const config = require('../../config.json');

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
  queryIds: number[],
) => {
  const statusPrev = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(neutronCm, contractAddress, i)),
  );
  const targetHeight = await getHeight(targetCm.sdk);
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

const getValidatorsSigningInfosResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    signing_infos: {
      signing_infos: {
        address: string;
        start_height: string;
        index_offset: string;
        jailed_until: string;
        tombstoned: boolean;
        missed_blocks_counter: number;
      }[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    validators_signing_infos: {
      query_id: queryId,
    },
  });

const getDelegatorUnbondingDelegationsResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    unbonding_delegations: {
      unbonding_responses: {
        delegator_address: string;
        validator_address: string;
        entries: {
          balance: string;
          completion_time: string | null;
          creation_height: number;
          initial_balance: string;
        }[];
      }[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    get_unbonding_delegations: {
      query_id: queryId,
    },
  });

const getCosmosSigningInfosResult = async (sdkUrl: string) => {
  try {
    return (await axios.get(`${sdkUrl}/cosmos/slashing/v1beta1/signing_infos`))
      .data;
  } catch (e) {
    return null;
  }
};

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
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  denom: string,
  addr: cosmosclient.AccAddress,
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

  const attribute = getEventAttribute(
    (txResult as any).events,
    'neutron',
    'query_id',
  );

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

const registerSigningInfoQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  valcons: string,
) => {
  const txResult = await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_validators_signing_info_query: {
        connection_id: connectionId,
        validators: [valcons],
        update_period: updatePeriod,
      },
    }),
  );

  const attribute = getEventAttribute(
    (txResult as any).events,
    'neutron',
    'query_id',
  );

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

const registerUnbondingDelegationsQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  delegator: string,
  validator: string,
) => {
  const txResult = await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_delegator_unbonding_delegations_query: {
        connection_id: connectionId,
        delegator,
        validators: [validator],
        update_period: updatePeriod,
      },
    }),
  );

  const attribute = getEventAttribute(
    (txResult as any).events,
    'neutron',
    'query_id',
  );

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

const acceptInterchainqueriesParamsChangeProposal = async (
  cm: WalletWrapper,
  title: string,
  description: string,
  key: string,
  value: string,
) => {
  const daoCoreAddress = (await cm.chain.getChainAdmins())[0];
  const daoContracts = await getDaoContracts(cm.chain, daoCoreAddress);
  const dao = new Dao(cm.chain, daoContracts);
  const daoMember = new DaoMember(cm, dao);
  const message = paramChangeProposal({
    title,
    description,
    subspace: 'interchainqueries',
    key,
    value,
  });
  await dao.makeSingleChoiceProposalPass(
    [daoMember],
    title,
    description,
    [message],
    '1000',
  );
};

const removeQuery = async (
  cm: WalletWrapper,
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
  cm: WalletWrapper,
  queryId: bigint,
  sender: string = cm.wallet.address.toString(),
) => await cm.msgRemoveInterchainQuery(queryId, sender);

const registerDelegatorDelegationsQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  delegator: cosmosclient.AccAddress,
  validators: cosmosclient.ValAddress[],
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
  address: cosmosclient.AccAddress,
) => {
  const interchainQueryResult = await getQueryBalanceResult(
    neutronCm,
    contractAddress,
    queryId,
  );
  const directQueryResult = await cosmosclient.rest.bank.allBalances(
    targetCm.sdk as cosmosclient.CosmosSDK,
    address.toString(),
  );
  expect(filterIBCDenoms(interchainQueryResult.balances.coins)).toEqual(
    filterIBCDenoms(directQueryResult.data.balances as ICoin[]),
  );
};

const registerProposalVotesQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  proposalId: number,
  voters: string[],
) => {
  const txResult = await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_government_proposal_votes_query: {
        connection_id: connectionId,
        update_period: updatePeriod,
        proposals_ids: [proposalId],
        voters: voters,
      },
    }),
  );

  const attribute = getEventAttribute(
    (txResult as any).events,
    'neutron',
    'query_id',
  );

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

const getProposalVotesResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    votes: {
      proposal_votes: {
        proposal_id: number;
        voter: string;
        options: any;
      }[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    government_proposal_votes: {
      query_id: queryId,
    },
  });

const registerGovProposalsQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  proposalsIds: number[],
) => {
  const txResult = await cm.executeContract(
    contractAddress,
    JSON.stringify({
      register_government_proposals_query: {
        connection_id: connectionId,
        update_period: updatePeriod,
        proposals_ids: proposalsIds,
      },
    }),
  );

  const attribute = getEventAttribute(
    (txResult as any).events,
    'neutron',
    'query_id',
  );

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

const getProposalsResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    proposals: {
      proposals: any[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    government_proposals: {
      query_id: queryId,
    },
  });

describe('Neutron / Interchain KV Query', () => {
  const connectionId = 'connection-0';
  const updatePeriods: { [key: number]: number } = {
    2: 3,
    3: 4,
    4: 3,
  };
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let gaiaChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let gaiaAccount: WalletWrapper;
  let contractAddress =
    'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq';

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

    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    const dao = new Dao(neutronChain, daoContracts);
    const daoMember = new DaoMember(neutronAccount, dao);
    await daoMember.bondFunds('10000000000');
  });

  describe('Instantiate interchain queries contract', () => {
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
          expect(error.message).toMatch(
            /spendable balance {2}is smaller than 1000000untrn/i,
          );
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
      const queryResult = await getRegisteredQuery(
        neutronChain,
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
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
      const queryResult = await getRegisteredQuery(
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
      const queryResult = await getRegisteredQuery(
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
        getRegisteredQuery(neutronChain, contractAddress, queryId),
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
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await getHeight(gaiaChain.sdk),
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
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await getHeight(gaiaChain.sdk),
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
      await msgDelegate(
        gaiaAccount,
        testState.wallets.cosmos.demo2.address.toString(),
        testState.wallets.cosmos.val1.address.toString(),
        '1500000',
      );
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await getHeight(gaiaChain.sdk),
      );
      const interchainQueryResult = await getQueryDelegatorDelegationsResult(
        neutronChain,
        contractAddress,
        queryId,
      );
      expect(interchainQueryResult.delegations[0].amount.amount).toEqual(
        (1500000).toString(),
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
      const queryId = BigInt(2);
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

        const queryResult = await getRegisteredQuery(
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

      // FIXME: fix update params
      test.skip('should change new query params based on governance proposal', async () => {
        // Get old query params
        const registeredQueryBeforeParamChange = await getRegisteredQuery(
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

        const queryDepositParam: cosmosclient.proto.cosmos.base.v1beta1.ICoin[] =
          [
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

        const queryResult = await getRegisteredQuery(
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
        const registeredQueryAfterParamChange = await getRegisteredQuery(
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

      // FIXME: enable after fix change params via proposal
      test.skip('should remove icq and check balances updates', async () => {
        const balancesBeforeRegistration = await neutronChain.queryBalances(
          testState.wallets.neutron.demo1.address.toString(),
        );
        balancesBeforeRegistration.balances = filterIBCDenoms(
          balancesBeforeRegistration.balances as ICoin[],
        );

        const queryId = await registerBalanceQuery(
          neutronAccount,
          contractAddress,
          connectionId,
          15,
          gaiaChain.denom,
          testState.wallets.cosmos.demo2.address,
        );

        await getWithAttempts(
          neutronChain.blockWaiter,
          () => getRegisteredQuery(neutronChain, contractAddress, queryId),
          async (response) =>
            response.registered_query.last_submitted_result_local_height > 0 &&
            response.registered_query.last_submitted_result_local_height + 5 <
              (await getHeight(neutronChain.sdk)),
          20,
        );

        const balancesAfterRegistration = await neutronChain.queryBalances(
          testState.wallets.neutron.demo1.address.toString(),
        );
        balancesAfterRegistration.balances = filterIBCDenoms(
          balancesAfterRegistration.balances as ICoin[],
        );

        await removeQueryViaTx(neutronAccount, BigInt(queryId));

        await getWithAttempts(
          neutronChain.blockWaiter,
          async () =>
            await neutronChain.queryBalances(
              testState.wallets.neutron.demo1.address.toString(),
            ),
          async (response) => {
            const balances = filterIBCDenoms(response.balances as ICoin[]);
            const beforeBalances = filterIBCDenoms(
              balancesAfterRegistration.balances as ICoin[],
            );
            return (
              balances[0].denom === beforeBalances[0].denom &&
              parseInt(balances[0].amount || '0') >
                parseInt(beforeBalances[0].amount || '0')
            );
          },

          100,
        );

        const balancesAfterRemoval = await neutronChain.queryBalances(
          testState.wallets.neutron.demo1.address.toString(),
        );
        balancesAfterRemoval.balances = filterIBCDenoms(
          balancesAfterRemoval.balances as ICoin[],
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

  describe('Proposal votes query', () => {
    let queryId: number;
    let proposalId: number;

    beforeEach(async () => {
      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '1000000');

      const proposalResp = await msgSubmitProposal(
        gaiaAccount,
        testState.wallets.cosmos.demo2.address.toString(),
        '1250',
      );

      testState.wallets.neutron.demo1;

      proposalId = parseInt(
        getEventAttribute(
          (proposalResp as any).events,
          'submit_proposal',
          'proposal_id',
        ),
      );

      await msgVote(
        gaiaAccount,
        testState.wallets.cosmos.demo2.address.toString(),
        proposalId,
        '1250',
      );

      queryId = await registerProposalVotesQuery(
        neutronAccount,
        contractAddress,
        connectionId,
        updatePeriods[2],
        proposalId,
        [
          testState.wallets.cosmos.demo2.address.toString(),
          'cosmos1fku9gl93dy3z4d2y58gza06un72ulmd8trruxw',
        ],
      );
    });

    test('proposal votes registered query data', async () => {
      const queryResult = await getRegisteredQuery(
        neutronChain,
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      // XXX: I could actually check that "key" is correctly derived from contractAddress,
      //      but this requires bech32 decoding/encoding shenanigans
      expect(queryResult.registered_query.keys.length).toEqual(2);
      expect(queryResult.registered_query.keys[0].path).toEqual('gov');
      expect(queryResult.registered_query.keys[0].key.length).toBeGreaterThan(
        0,
      );
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
    });

    test('proposal votes data', async () => {
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await getHeight(gaiaChain.sdk),
      );

      const interchainQueryResult = await getProposalVotesResult(
        neutronChain,
        contractAddress,
        queryId,
      );

      console.log('proposalId');
      console.log(proposalId);

      expect(interchainQueryResult.votes.proposal_votes).toEqual([
        {
          proposal_id: proposalId,
          voter: testState.wallets.cosmos.demo2.address.toString(),
          options: [{ option: 1, weight: '1.000000000000000000' }],
        },
        { proposal_id: 0, voter: '', options: [] },
      ]);
    });
  });

  describe('Government proposals query', () => {
    let queryId: number;
    let proposalId: number;

    beforeEach(async () => {
      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '1000000');

      const proposalResp = await msgSubmitProposal(
        gaiaAccount,
        testState.wallets.cosmos.demo2.address.toString(),
        '1250',
      );

      proposalId = parseInt(
        getEventAttribute(
          (proposalResp as any).events,
          'submit_proposal',
          'proposal_id',
        ),
      );

      queryId = await registerGovProposalsQuery(
        neutronAccount,
        contractAddress,
        connectionId,
        updatePeriods[2],
        [proposalId, proposalId + 1, proposalId + 2],
      );
    });

    test('proposals registered query data', async () => {
      const queryResult = await getRegisteredQuery(
        neutronChain,
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      // XXX: I could actually check that "key" is correctly derived from contractAddress,
      //      but this requires bech32 decoding/encoding shenanigans
      expect(queryResult.registered_query.keys.length).toEqual(3);
      expect(queryResult.registered_query.keys[0].path).toEqual('gov');
      expect(queryResult.registered_query.keys[0].key.length).toBeGreaterThan(
        0,
      );
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
    });

    test('proposals data', async () => {
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await getHeight(gaiaChain.sdk),
      );

      const interchainQueryResult = await getProposalsResult(
        neutronChain,
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
    let indexOffset: number;
    let cosmosvalconspub: string;
    beforeEach(async () => {
      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '1000000');

      const infos = await getCosmosSigningInfosResult(gaiaChain.sdk.url);
      expect(infos).not.toBeNull();
      const firstValidator = infos.info[0];
      indexOffset = parseInt(firstValidator.index_offset);
      cosmosvalconspub = firstValidator.address;

      queryId = await registerSigningInfoQuery(
        neutronAccount,
        contractAddress,
        connectionId,
        updatePeriods[2],
        cosmosvalconspub,
      );
    });

    test('signing info registered query data', async () => {
      const queryResult = await getRegisteredQuery(
        neutronChain,
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      expect(queryResult.registered_query.keys.length).toEqual(1);
      expect(queryResult.registered_query.keys[0].path).toEqual('slashing');
      expect(queryResult.registered_query.keys[0].key.length).toBeGreaterThan(
        0,
      );
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
    });

    test('signing info data', async () => {
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await getHeight(gaiaChain.sdk),
      );

      const interchainQueryResult = await getValidatorsSigningInfosResult(
        neutronChain,
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
      validatorAddress = testState.wallets.cosmos.val1.address.toString();
      delegatorAddress = testState.wallets.cosmos.demo2.address.toString();

      await msgDelegate(
        gaiaAccount,
        delegatorAddress,
        validatorAddress,
        '3000',
      );
      await msgUndelegate(
        gaiaAccount,
        delegatorAddress,
        validatorAddress,
        '2000',
      );

      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '1000000');

      queryId = await registerUnbondingDelegationsQuery(
        neutronAccount,
        contractAddress,
        connectionId,
        updatePeriods[2],
        delegatorAddress,
        validatorAddress,
      );
    });

    test('registered query data', async () => {
      const queryResult = await getRegisteredQuery(
        neutronChain,
        contractAddress,
        queryId,
      );
      expect(queryResult.registered_query.id).toEqual(queryId);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      expect(queryResult.registered_query.keys.length).toEqual(1);
      expect(queryResult.registered_query.keys[0].path).toEqual('staking');
      expect(queryResult.registered_query.keys[0].key.length).toBeGreaterThan(
        0,
      );
      expect(queryResult.registered_query.query_type).toEqual('kv');
      expect(queryResult.registered_query.transactions_filter).toEqual('');
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
    });

    test('query result', async () => {
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await getHeight(gaiaChain.sdk),
      );

      const interchainQueryResult =
        await getDelegatorUnbondingDelegationsResult(
          neutronChain,
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
          delegator_address: 'cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw',
          validator_address:
            'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
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
