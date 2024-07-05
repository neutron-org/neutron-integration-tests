import { Registry } from '@cosmjs/proto-signing';
import { LocalState, createLocalState } from '../../helpers/localState';
import '@neutron-org/neutronjsplus';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
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
  updateInterchainqueriesParamsProposal,
  updateInterchaintxsParamsProposal,
  updateTokenfacoryParamsProposal,
  updateTransferParamsProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { wasm, WasmWrapper } from '../../helpers/wasmClient';
import { neutronTypes } from '@neutron-org/neutronjsplus/dist/neutronTypes';
import { QueryParamsResponse } from '@neutron-org/neutronjs/neutron/interchainqueries/query';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import { createRPCQueryClient as createIbcClient } from '@neutron-org/neutronjs/ibc/rpc.query';
import { createRPCQueryClient as createOsmosisClient } from '@neutron-org/neutronjs/osmosis/rpc.query';
import { ProtobufRpcClient } from '@cosmjs/stargate';
import { getWithAttempts } from '@neutron-org/neutronjsplus/dist/wait';
import { IbcType, NeutronType, OsmosisType } from '../../helpers/clientTypes';

const config = require('../../config.json');

describe('Neutron / Parameters', () => {
  let testState: LocalState;

  let neutronAccount: Wallet;
  let neutronClient: WasmWrapper;
  let daoMember1: DaoMember;
  let dao: Dao;
  let chainManagerAddress: string;

  let neutronRpcClient: ProtobufRpcClient;
  let client: NeutronType;
  let ibcClient: IbcType;
  let osmosisClient: OsmosisType;

  beforeAll(async () => {
    testState = await createLocalState(config, inject('mnemonics'));
    neutronAccount = testState.wallets.qaNeutron.qa;
    neutronClient = await wasm(
      testState.rpcNeutron,
      neutronAccount,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );

    neutronRpcClient = await testState.rpcClient('neutron');
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient.client,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(
      neutronClient.client,
      daoCoreAddress,
    );

    client = await createNeutronClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    ibcClient = await createIbcClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    osmosisClient = await createOsmosisClient({
      rpcEndpoint: testState.rpcNeutron,
    });

    // interchainQueriesQuery = new InterchainQueriesQuery(neutronRpcClient);
    // interchainAccountsQuery = new InterchainAccountsQuery(neutronRpcClient);
    // interchainTxsQuery = new InterchainTxQuery(neutronRpcClient);
    // tokenfactoryQuery = new TokenfactoryQuery(neutronRpcClient);
    // feeburnerQuery = new FeeburnerQuery(neutronRpcClient);
    // feerefunderQuery = new FeerefunderQuery(neutronRpcClient);
    // cronQuery = new CronQuery(neutronRpcClient);
    // contractmanagerQuery = new ContractManagerQuery(neutronRpcClient);
    // ibcQuery = new IbcQuery(neutronRpcClient);

    // const queryClient = new AdminQueryClient(neutronRpcClient);
    const admins = await client.cosmos.adminmodule.adminmodule.admins();
    chainManagerAddress = admins.admins[0];

    dao = new Dao(neutronClient.client, daoContracts);
    daoMember1 = new DaoMember(
      dao,
      neutronClient.client,
      neutronAccount.address,
      NEUTRON_DENOM,
    );
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('10000');
      await getWithAttempts(
        neutronClient.client,
        async () => await dao.queryVotingPower(daoMember1.user),
        async (response) => response.power == 10000,
        20,
      );
    });
    test('check voting power', async () => {
      await getWithAttempts(
        neutronClient.client,
        async () => await dao.queryTotalVotingPower(),
        async (response) => response.power == 11000,
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
        updateInterchainqueriesParamsProposal({
          query_submit_timeout: 30,
          query_deposit: null,
          tx_query_removal_limit: 20,
        }),
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
        paramsBefore = await client.neutron.interchainqueries.params();
        const host = (
          await ibcClient.ibc.applications.interchain_accounts.host.v1.params()
        ).params.hostEnabled;
        expect(host).toEqual(true);
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await client.neutron.interchainqueries.params();
        expect(paramsAfter.params.querySubmitTimeout).not.toEqual(
          paramsBefore.params.querySubmitTimeout,
        );
        expect(paramsAfter.params.txQueryRemovalLimit).not.toEqual(
          paramsBefore.params.txQueryRemovalLimit,
        );
        expect(paramsAfter.params.querySubmitTimeout).toEqual(30n);
        expect(paramsAfter.params.txQueryRemovalLimit).toEqual(20n);
      });
    });
  });

  describe('Tokenfactory params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsTokenfactoryProposal(
        chainManagerAddress,
        'Proposal #2',
        'Tokenfactory params proposal',
        updateTokenfacoryParamsProposal({
          fee_collector_address: await getNeutronDAOCore(
            neutronClient.client,
            neutronRpcClient,
          ),
          denom_creation_fee: null,
          denom_creation_gas_consume: 100000,
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
          await osmosisClient.osmosis.tokenfactory.v1beta1.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter =
          await osmosisClient.osmosis.tokenfactory.v1beta1.params();

        expect(paramsAfter.params.denomCreationFee).toEqual(
          paramsBefore.params.denomCreationFee,
        );
        expect(paramsAfter.params.denomCreationGasConsume).not.toEqual(
          paramsBefore.params.denomCreationGasConsume,
        );
        expect(paramsAfter.params.denomCreationFee).toHaveLength(0);
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
        paramsBefore = await client.neutron.feeburner.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await client.neutron.feeburner.params();
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
        paramsBefore = await client.neutron.feerefunder.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await client.neutron.feerefunder.params();
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
        paramsBefore = await client.neutron.cron.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await client.neutron.cron.params();
        expect(paramsAfter.params.securityAddress).not.toEqual(
          paramsBefore.params.securityAddress,
        );
        expect(paramsAfter.params.securityAddress).toEqual(
          dao.contracts.voting.address,
        );
      });
    });
  });

  describe('Contractanager params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsContractmanagerProposal(
        chainManagerAddress,
        'Proposal #6',
        'Contractanager params proposal',
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
        paramsBefore = await client.neutron.contractmanager.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await client.neutron.contractmanager.params();
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
        paramsBefore = await client.neutron.interchaintxs.v1.params();
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await client.neutron.interchaintxs.v1.params();
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
        const paramsRes = await ibcClient.ibc.applications.transfer.v1.params();
        expect(paramsRes.params.sendEnabled).toEqual(false);
        expect(paramsRes.params.receiveEnabled).toEqual(false);
      });
    });
  });
});
