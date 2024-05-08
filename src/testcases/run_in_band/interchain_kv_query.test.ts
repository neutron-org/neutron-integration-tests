import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  filterIBCDenoms,
  getEventAttribute,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { COSMOS_DENOM } from '@neutron-org/neutronjsplus';
import { inject } from 'vitest';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import {
  getRegisteredQuery,
  waitForICQResultWithRemoteHeight,
} from '@neutron-org/neutronjsplus/dist/icq';
import { CodeId, NeutronContract } from '@neutron-org/neutronjsplus/dist/types';
import { msgDelegate, msgUndelegate } from '../../helpers/gaia';
import { LocalState, createWalletWrapper } from '../../helpers/localState';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import { Coin } from '@cosmjs/proto-signing';
import { msgSubmitProposal, msgVote } from '../../helpers/gaia';
import {
  acceptInterchainqueriesParamsChangeProposal,
  getCosmosSigningInfosResult,
  getDelegatorUnbondingDelegationsResult,
  getKvCallbackStatus,
  getProposalsResult,
  getProposalVotesResult,
  getQueryDelegatorDelegationsResult,
  getValidatorsSigningInfosResult,
  registerBalanceQuery,
  registerDelegatorDelegationsQuery,
  registerGovProposalsQuery,
  registerProposalVotesQuery,
  registerSigningInfoQuery,
  registerUnbondingDelegationsQuery,
  removeQuery,
  removeQueryViaTx,
  validateBalanceQuery,
  watchForKvCallbackUpdates,
} from '../../helpers/kvQuery';

const config = require('../../config.json');

describe('Neutron / Interchain KV Query', () => {
  const connectionId = 'connection-0';
  const updatePeriods: { [key: number]: number } = {
    2: 3,
    3: 4,
    4: 3,
  };
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let gaiaChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let otherNeutronAccount: WalletWrapper;
  let gaiaAccount: WalletWrapper;
  let contractAddress =
    'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq';

  beforeAll(async () => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronAccount = await createWalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
    otherNeutronAccount = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronThree.qa,
    );
    gaiaChain = new CosmosWrapper(
      COSMOS_DENOM,
      testState.rest2,
      testState.rpc2,
    );
    gaiaAccount = await createWalletWrapper(
      gaiaChain,
      testState.wallets.cosmos.demo2,
    );

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
      contractAddress = await neutronAccount.instantiateContract(
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
          await neutronAccount.executeContract(contractAddress, {
            register_balance_query: {
              connection_id: connectionId,
              denom: gaiaChain.denom,
              addr: testState.wallets.cosmos.demo2.address,
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
          neutronAccount.executeContract(contractAddress, {
            integration_tests_register_query_empty_keys: {
              connection_id: connectionId,
            },
          }),
        ).rejects.toThrowError(/keys cannot be empty/);
      });

      test('should throw exception because of empty key id', async () => {
        await expect(
          neutronAccount.executeContract(contractAddress, {
            integration_tests_register_query_empty_id: {
              connection_id: connectionId,
            },
          }),
        ).rejects.toThrowError(/keys id cannot be empty/);
      });

      test('should throw exception because of empty key path', async () => {
        await expect(
          neutronAccount.executeContract(contractAddress, {
            integration_tests_register_query_empty_path: {
              connection_id: connectionId,
            },
          }),
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
          [testState.wallets.cosmos.val1.valAddress],
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
        testState.wallets.cosmos.rly2.address,
        '9000',
      );
      expect(res.code).toEqual(0);
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await gaiaChain.getHeight(),
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
        testState.wallets.cosmos.val1.address,
        '9000',
      );
      expect(res.code).toEqual(0);
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await gaiaChain.getHeight(),
      );
      await validateBalanceQuery(
        neutronChain,
        gaiaChain,
        contractAddress,
        queryId,
        testState.wallets.cosmos.val1.address,
      );
    });

    // TODO: test this query with multiple validators, this is impossible right now
    //       because we only have one node per network in cosmopark
    test('perform icq #4: delegator delegations', async () => {
      const queryId = 4;
      await msgDelegate(
        gaiaAccount,
        testState.wallets.cosmos.demo2.address,
        testState.wallets.cosmos.val1.valAddress,
        '1500000',
      );
      await waitForICQResultWithRemoteHeight(
        neutronChain,
        contractAddress,
        queryId,
        await gaiaChain.getHeight(),
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
      await neutronAccount.executeContract(contractAddress, {
        integration_tests_set_query_mock: {},
      });
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
        await neutronChain.waitBlocks(1);
      }
      const end = await Promise.all(
        [2, 3, 4].map((i) =>
          getKvCallbackStatus(neutronChain, contractAddress, i),
        ),
      );
      expect(start).toEqual(end);
    });

    test('disable mock', async () => {
      await neutronAccount.executeContract(contractAddress, {
        integration_tests_unset_query_mock: {},
      });
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
      const result = await removeQueryViaTx(otherNeutronAccount, queryId);
      expect(JSON.stringify(result.rawLog)).toMatch(
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

        await neutronChain.waitBlocks(1);

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

        const queryDepositParam: Coin[] = [
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

        await neutronChain.waitBlocks(1);

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
          testState.wallets.neutron.demo1.address,
        );
        balancesBeforeRegistration.balances = filterIBCDenoms(
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

        await neutronChain.getWithAttempts(
          () => getRegisteredQuery(neutronChain, contractAddress, queryId),
          async (response) =>
            response.registered_query.last_submitted_result_local_height > 0 &&
            response.registered_query.last_submitted_result_local_height + 5 <
              (await neutronChain.getHeight()),
          20,
        );

        const balancesAfterRegistration = await neutronChain.queryBalances(
          testState.wallets.neutron.demo1.address,
        );
        balancesAfterRegistration.balances = filterIBCDenoms(
          balancesAfterRegistration.balances as Coin[],
        );

        await removeQueryViaTx(neutronAccount, BigInt(queryId));

        await neutronChain.getWithAttempts(
          async () =>
            await neutronChain.queryBalances(
              testState.wallets.neutron.demo1.address,
            ),
          async (response) => {
            const balances = filterIBCDenoms(response.balances as Coin[]);
            const beforeBalances = filterIBCDenoms(
              balancesAfterRegistration.balances as Coin[],
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
          testState.wallets.neutron.demo1.address,
        );
        balancesAfterRemoval.balances = filterIBCDenoms(
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

  describe('Proposal votes query', () => {
    let queryId: number;
    let proposalId: number;

    beforeEach(async () => {
      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '1000000');

      const proposalResp = await msgSubmitProposal(
        gaiaAccount,
        testState.wallets.cosmos.demo2.address,
        '1250',
      );

      testState.wallets.neutron.demo1;

      proposalId = parseInt(
        getEventAttribute(
          proposalResp.events,
          'submit_proposal',
          'proposal_id',
        ),
      );

      await msgVote(
        gaiaAccount,
        testState.wallets.cosmos.demo2.address,
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
          testState.wallets.cosmos.demo2.address,
          'cosmos1fku9gl93dy3z4d2y58gza06un72ulmd8trruxw', // Random address to check absent vote behavior in the result
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
        await gaiaChain.getHeight(),
      );

      const interchainQueryResult = await getProposalVotesResult(
        neutronChain,
        contractAddress,
        queryId,
      );

      expect(interchainQueryResult.votes.proposal_votes).toEqual([
        {
          proposal_id: proposalId,
          voter: testState.wallets.cosmos.demo2.address,
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
      await neutronAccount.msgSend(contractAddress, '1000000');

      const proposalResp = await msgSubmitProposal(
        gaiaAccount,
        testState.wallets.cosmos.demo2.address,
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
        neutronAccount,
        contractAddress,
        connectionId,
        updatePeriods[2],
        [proposalId, proposalId + 1, proposalId + 2], // Send proposal Id as well as couple of non-existent proposals, to check result
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
        await gaiaChain.getHeight(),
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
    let indexOffset: number;
    let cosmosvalconspub: string;
    beforeEach(async () => {
      // Top up contract address before running query
      await neutronAccount.msgSend(contractAddress, '1000000');

      const infos = await getCosmosSigningInfosResult(gaiaChain.rest);
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
        await gaiaChain.getHeight(),
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
      validatorAddress = testState.wallets.cosmos.val1.valAddress;
      delegatorAddress = testState.wallets.cosmos.demo2.address;

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
        await gaiaChain.getHeight(),
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
