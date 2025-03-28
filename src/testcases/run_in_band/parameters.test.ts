import { LocalState } from '../../helpers/local_state';
import '@neutron-org/neutronjsplus';
import { inject } from 'vitest';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import {
  updateContractmanagerParamsProposal,
  updateCronParamsProposal,
  updateFeeburnerParamsProposal,
  updateFeerefunderParamsProposal,
  updateInterchaintxsParamsProposal,
  updateTokenfactoryParamsProposal,
  updateTransferParamsProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';
import { QueryParamsResponse } from '@neutron-org/neutronjs/neutron/interchainqueries/query';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import { createRPCQueryClient as createIbcClient } from '@neutron-org/neutronjs/ibc/rpc.query';
import { createRPCQueryClient as createOsmosisClient } from '@neutron-org/neutronjs/osmosis/rpc.query';
import { QueryClientImpl as ConsensusClient } from '@neutron-org/neutronjs/cosmos/consensus/v1/query.rpc.Query';
import {
  IbcQuerier,
  NeutronQuerier,
  OsmosisQuerier,
} from '@neutron-org/neutronjs/querier_types';
import { ProtobufRpcClient } from '@cosmjs/stargate';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import config from '../../config.json';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import { Wallet } from '../../helpers/wallet';

describe('Neutron / Parameters', () => {
  let testState: LocalState;

  let neutronWallet: Wallet;
  let neutronClient: SigningNeutronClient;
  let daoMember1: DaoMember;
  let dao: Dao;
  let chainManagerAddress: string;

  let neutronRpcClient: ProtobufRpcClient;

  let neutronQuerier: NeutronQuerier;
  let ibcQuerier: IbcQuerier;
  let osmosisQuerier: OsmosisQuerier;
  let consensusQuerier: ConsensusClient;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    neutronRpcClient = await testState.rpcClient('neutron');
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);

    neutronQuerier = await createNeutronClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    ibcQuerier = await createIbcClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    osmosisQuerier = await createOsmosisClient({
      rpcEndpoint: testState.rpcNeutron,
    });

    consensusQuerier = new ConsensusClient(await testState.neutronRpcClient());

    const admins = await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
    chainManagerAddress = admins.admins[0];

    dao = new Dao(neutronClient, daoContracts);
    daoMember1 = new DaoMember(
      dao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('1000000000');
      await neutronClient.getWithAttempts(
        async () => await dao.queryVotingPower(daoMember1.user),
        async (response) => response.power == 1000000000,
        20,
      );
    });
    test('check voting power', async () => {
      await neutronClient.getWithAttempts(
        async () => await dao.queryTotalVotingPower(),
        async (response) => response.power == 1110001000,
        20,
      );
    });
  });

  describe('Interchain queries params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsInterchainqueriesProposal(
        chainManagerAddress,
        'Proposal #1',
        'Param change proposal. This one will pass',
        {
          query_submit_timeout: 30,
          query_deposit: null,
          tx_query_removal_limit: 20,
          max_kv_query_keys_count: 10,
          max_transactions_filters: 10,
        },
        '1000',
      );
    });

    describe('vote for proposal', () => {
      const proposalId = 1;
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      const proposalId = 1;
      let paramsBefore: QueryParamsResponse;
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        paramsBefore = await neutronQuerier.neutron.interchainqueries.params();
        const host = (
          await ibcQuerier.ibc.applications.interchain_accounts.host.v1.params()
        ).params.hostEnabled;
        expect(host).toEqual(true);
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter =
          await neutronQuerier.neutron.interchainqueries.params();
        expect(paramsAfter.params.querySubmitTimeout).not.toEqual(
          paramsBefore.params.querySubmitTimeout,
        );
        expect(paramsAfter.params.txQueryRemovalLimit).not.toEqual(
          paramsBefore.params.txQueryRemovalLimit,
        );
        expect(paramsAfter.params.querySubmitTimeout).toEqual(30n);
        expect(paramsAfter.params.txQueryRemovalLimit).toEqual(20n);
        expect(paramsAfter.params.maxKvQueryKeysCount).toEqual(10n);
        expect(paramsAfter.params.maxTransactionsFilters).toEqual(10n);
      });
    });
  });

  describe('Tokenfactory params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsTokenfactoryProposal(
        chainManagerAddress,
        'Proposal #2',
        'Tokenfactory params proposal',
        updateTokenfactoryParamsProposal({
          fee_collector_address: await getNeutronDAOCore(
            neutronClient,
            neutronRpcClient,
          ),
          denom_creation_fee: [{ denom: NEUTRON_DENOM, amount: '1' }],
          denom_creation_gas_consume: 100000,
          whitelisted_hooks: [],
        }),
        '1000',
      );
    });

    describe('vote for proposal', () => {
      const proposalId = 2;
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      const proposalId = 2;
      let paramsBefore;
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        paramsBefore =
          await osmosisQuerier.osmosis.tokenfactory.v1beta1.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter =
          await osmosisQuerier.osmosis.tokenfactory.v1beta1.params();

        expect(paramsAfter.params.denomCreationFee).not.toEqual(
          paramsBefore.params.denomCreationFee,
        );
        expect(paramsAfter.params.denomCreationGasConsume).not.toEqual(
          paramsBefore.params.denomCreationGasConsume,
        );
        expect(paramsAfter.params.denomCreationFee).toEqual([
          {
            denom: 'untrn',
            amount: '1',
          },
        ]);
        expect(paramsAfter.params.denomCreationFee).toHaveLength(1);
        expect(paramsAfter.params.denomCreationGasConsume).toEqual(100000n);
      });
    });
  });

  describe('Feeburner params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsFeeburnerProposal(
        chainManagerAddress,
        'Proposal #3',
        'Feeburner params proposal',
        updateFeeburnerParamsProposal({
          treasury_address: dao.contracts.voting.address,
        }),
        '1000',
      );
    });

    describe('vote for proposal', () => {
      const proposalId = 3;
      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      const proposalId = 3;
      let paramsBefore;
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        paramsBefore = await neutronQuerier.neutron.feeburner.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await neutronQuerier.neutron.feeburner.params();
        expect(paramsAfter.params.treasuryAddress).not.toEqual(
          paramsBefore.params.treasuryAddress,
        );
        expect(paramsAfter.params.treasuryAddress).toEqual(
          dao.contracts.voting.address,
        );
      });
    });
  });

  describe('Feerefunder params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsFeerefunderProposal(
        chainManagerAddress,
        'Proposal #4',
        'Feerefunder update params proposal',
        updateFeerefunderParamsProposal({
          min_fee: {
            recv_fee: [],
            ack_fee: [
              {
                amount: '1',
                denom: NEUTRON_DENOM,
              },
            ],
            timeout_fee: [
              {
                amount: '1',
                denom: NEUTRON_DENOM,
              },
            ],
          },
        }),
        '1000',
      );
    });

    describe('vote for proposal', () => {
      const proposalId = 4;
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      const proposalId = 4;
      let paramsBefore;
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        paramsBefore = await neutronQuerier.neutron.feerefunder.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await neutronQuerier.neutron.feerefunder.params();
        expect(paramsAfter.params.minFee.recvFee).toEqual(
          paramsBefore.params.minFee.recvFee,
        );
        expect(paramsAfter.params.minFee.ackFee).not.toEqual(
          paramsBefore.params.minFee.ackFee,
        );
        expect(paramsAfter.params.minFee.timeoutFee).not.toEqual(
          paramsBefore.params.minFee.timeoutFee,
        );
        // toHaveLength(0) equals fee struct is '[]'
        expect(paramsAfter.params.minFee.recvFee).toHaveLength(0);

        expect(paramsAfter.params.minFee.ackFee).toEqual([
          {
            amount: '1',
            denom: NEUTRON_DENOM,
          },
        ]);
        expect(paramsAfter.params.minFee.timeoutFee).toEqual([
          {
            amount: '1',
            denom: NEUTRON_DENOM,
          },
        ]);
      });
    });
  });

  describe('Cron params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsCronProposal(
        chainManagerAddress,
        'Proposal #5',
        'Cron update params proposal. Will pass',
        updateCronParamsProposal({
          security_address: dao.contracts.voting.address,
          limit: 10,
        }),
        '1000',
      );
    });

    describe('vote for proposal', () => {
      const proposalId = 5;
      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      const proposalId = 5;
      let paramsBefore;
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        paramsBefore = await neutronQuerier.neutron.cron.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await neutronQuerier.neutron.cron.params();
        expect(paramsAfter.params.securityAddress).not.toEqual(
          paramsBefore.params.securityAddress,
        );
        expect(paramsAfter.params.securityAddress).toEqual(
          dao.contracts.voting.address,
        );
      });
    });
  });

  describe('Contractmanager params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsContractmanagerProposal(
        chainManagerAddress,
        'Proposal #6',
        'Contractmanager params proposal',
        updateContractmanagerParamsProposal({
          sudo_call_gas_limit: '1000',
        }),
        '1000',
      );
    });

    describe('vote for proposal', () => {
      const proposalId = 6;
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      const proposalId = 6;
      let paramsBefore;
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        paramsBefore = await neutronQuerier.neutron.contractmanager.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter =
          await neutronQuerier.neutron.contractmanager.params();
        expect(paramsAfter.params.sudoCallGasLimit).not.toEqual(
          paramsBefore.params.sudoCallGasLimit,
        );
        expect(paramsAfter.params.sudoCallGasLimit).toEqual(1000n);
      });
    });
  });

  describe('Interchaintxs params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsInterchaintxsProposal(
        chainManagerAddress,
        'Proposal #7',
        'Update interchaintxs params',
        updateInterchaintxsParamsProposal({
          msg_submit_tx_max_messages: 11,
        }),
        '1000',
      );
    });

    describe('vote for proposal', () => {
      const proposalId = 7;
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      const proposalId = 7;
      let paramsBefore;
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        paramsBefore = await neutronQuerier.neutron.interchaintxs.v1.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter =
          await neutronQuerier.neutron.interchaintxs.v1.params();
        expect(paramsAfter.params.msgSubmitTxMaxMessages).not.toEqual(
          paramsBefore.params.msgSubmitTxMaxMessages,
        );
        expect(paramsAfter.params.msgSubmitTxMaxMessages).toEqual(11n);
      });
    });
  });

  describe('Transfer params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsTransferProposal(
        chainManagerAddress,
        'Proposal #8',
        'Update transfer params',
        updateTransferParamsProposal({
          receive_enabled: false,
          send_enabled: false,
        }),
        '1000',
      );
    });

    describe('vote for proposal', () => {
      const proposalId = 8;
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      const proposalId = 8;
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsRes =
          await ibcQuerier.ibc.applications.transfer.v1.params();
        expect(paramsRes.params.sendEnabled).toEqual(false);
        expect(paramsRes.params.receiveEnabled).toEqual(false);
      });
    });
  });

  describe('Consensus params proposal', () => {
    let proposalId: number;
    test('create proposal', async () => {
      proposalId = await daoMember1.submitUpdateParamsConsensusProposal(
        chainManagerAddress,
        'Proposal #9',
        'Update consensus params',
        {
          abci: {
            vote_extensions_enable_height: 1,
          },
          evidence: {
            max_age_duration: '1000h',
            max_age_num_blocks: 100000,
            max_bytes: 1048576,
          },
          validator: {
            pub_key_types: ['ed25519'],
          },
          block: {
            max_gas: 30_000_000,
            max_bytes: 14_857_600,
          },
        },
        '1000',
      );
    });

    describe('vote for proposal', () => {
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsRes = await consensusQuerier.params();
        expect(paramsRes.params.block.maxGas).toEqual(30_000_000n);
        expect(paramsRes.params.block.maxBytes).toEqual(14_857_600n);
      });
    });
  });
});
