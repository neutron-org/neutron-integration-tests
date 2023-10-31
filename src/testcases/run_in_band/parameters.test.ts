import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { getWithAttempts } from '../../helpers/wait';
import { Dao, DaoMember, getDaoContracts } from '../../helpers/dao';

describe('Neutron / Parameters', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember1: DaoMember;
  let dao: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    dao = new Dao(neutronChain, daoContracts);
    daoMember1 = new DaoMember(neutronAccount, dao);
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('1000');
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () =>
          await dao.queryVotingPower(daoMember1.user.wallet.address.toString()),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('check voting power', async () => {
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () => await dao.queryTotalVotingPower(),
        async (response) => response.power == 1000,
        20,
      );
    });
  });

  describe('Interchain queries params proposal', () => {
    test('create proposal #1, will pass', async () => {
      await daoMember1.submitUpdateParamsInterchainqueriesProposal(
        'Proposal #1',
        'Param change proposal. This one will pass',
        30,
        20,
        '1000',
      );
    });

    describe('vote for proposal #1', () => {
      const proposalId = 1;
      test('vote NO from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal #1',() => {
      const proposalId = 1;
      var paramsBefore;
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        paramsBefore = await neutronChain.queryInterchainqueriesParams();
        const host = await neutronChain.queryHostEnabled();
        expect(host).toEqual(true);
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await neutronChain.queryInterchainqueriesParams();
        expect(paramsAfter.params.query_submit_timeout).not.toEqual(
          paramsBefore.params.query_submit_timeout,
        );
        expect(paramsAfter.params.tx_query_removal_limit).not.toEqual(
          paramsBefore.params.tx_query_removal_limit,
        );
        expect(paramsAfter.params.query_submit_timeout).toEqual('30');
        expect(paramsAfter.params.tx_query_removal_limit).toEqual('20');
      });
    });
  });

  describe('Tokenfactory params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsTokenfactoryProposal(
        'Proposal #2',
        'This one will pass',
        100000,
        '1000',
      );
    });

    describe('vote for proposal #2', () => {
      const proposalId = 2;
      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal #2', async () => {
      const proposalId = 2;
      const paramsBefore = await neutronChain.queryTokenfactoryParams();
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await neutronChain.queryTokenfactoryParams();
        expect(paramsAfter.params.denom_creation_fee).not.toEqual(
          paramsBefore.params.denom_creation_fee,
        );
        expect(paramsAfter.params.denom_creation_gas_consume).not.toEqual(
          paramsBefore.params.denom_creation_gas_consume,
        );
        expect(paramsAfter.params.denom_creation_fee).toHaveLength(0);
        expect(paramsAfter.params.denom_creation_gas_consume).toEqual('100000');
      });
    });
  });

  describe('Feeburner params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsFeeburnerProposal(
        'Proposal #3',
        'Software upgrade proposal. Will pass',
        dao.contracts.voting.address,
        '1000',
      );
    });

    describe('vote for proposal #3', () => {
      const proposalId = 3;
      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal #3', async () => {
      const proposalId = 3;
      const paramsBefore = await neutronChain.queryFeeburnerParams();
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await neutronChain.queryFeeburnerParams();
        expect(paramsAfter.params.treasury_address).not.toEqual(
          paramsBefore.params.treasury_address,
        );
        expect(paramsAfter.params.treasury_address).toEqual(
          dao.contracts.voting.address,
        );
      });
    });
  });

  describe('Feerefunder params proposal', () => {
    test('create proposal', async () => {
      await daoMember1.submitUpdateParamsFeerefunderProposal(
        'Proposal #4',
        'Feerefunder update params proposal',
        '1000',
      );
    });

    describe('vote for proposal #4', () => {
      const proposalId = 4;
      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal #4', async () => {
      const proposalId = 4;
      const paramsBefore = await neutronChain.queryFeerefunderParams();
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await neutronChain.queryFeerefunderParams();
        expect(paramsAfter.params.min_fee.recv_fee).not.toEqual(
          paramsBefore.params.min_fee.recv_fee,
        );
        expect(paramsAfter.params.min_fee.ack_fee).not.toEqual(
          paramsBefore.params.min_fee.ack_fee,
        );
        expect(paramsAfter.params.min_fee.timeout_fee).not.toEqual(
          paramsBefore.params.min_fee.timeout_fee,
        );
        // toHaveLength(0) equals fee struct is '[]'
        expect(paramsAfter.params.min_fee.recv_fee).toHaveLength(0);
        expect(paramsAfter.params.min_fee.ack_fee).toHaveLength(0);
        expect(paramsAfter.params.min_fee.timeout_fee).toHaveLength(0);
      });
    });
  });

  describe('Cron params proposal', () => {
    test('create proposa', async () => {
      await daoMember1.submitUpdateParamsCronProposal(
        'Proposal #5',
        'Cron update params proposal. Will pass',
        dao.contracts.voting.address,
        10,
        '1000',
      );
    });

    describe('vote for proposal #5', () => {
      const proposalId = 5;
      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal #5', async () => {
      const proposalId = 5;
      const paramsBefore = await neutronChain.queryCronParams();
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await neutronChain.queryCronParams();
        expect(paramsAfter.params.security_address).not.toEqual(
          paramsBefore.params.security_address,
        );
        expect(paramsAfter.params.security_address).toEqual(
          dao.contracts.voting.address,
        );
      });
    });
  });

  describe('Contractanager params proposal', () => {
    test('create proposal #6, will pass', async () => {
      await daoMember1.submitUpdateParamsContractmanageProposal(
        'Proposal #6',
        'Pin codes proposal. Will pass',
        '1000',
        '1000',
      );
    });

    describe('vote for proposal #6', () => {
      const proposalId = 6;
      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal #6', async () => {
      const proposalId = 6;
      const paramsBefore = await neutronChain.queryContractmanagerParams();
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramsAfter = await neutronChain.queryContractmanagerParams();
        expect(paramsAfter.params.sudo_call_gas_limit).not.toEqual(
          paramsBefore.params.sudo_call_gas_limit,
        );
        expect(paramsAfter.params.sudo_call_gas_limit).toEqual('1000');
      });
    });
  });

  describe('Interchaintxs params proposal', () => {
    test('create proposal #7, will pass', async () => {
      await daoMember1.submitUpdateParamsInterchaintxsProposal(
        'Proposal #7',
        'Update interchaintxs params',
        11,
        '1000',
      );
    });

    describe('vote for proposal #6', () => {
      const proposalId = 6;
      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal #7', async () => {
      const proposalId = 7;
      const paramBefore = await neutronChain.queryMaxTxsAllowed();
      test('check if proposal is passed', async () => {
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      test('check if params changed after proposal execution', async () => {
        const paramAfter = await neutronChain.queryMaxTxsAllowed();
        expect(paramBefore).not.toEqual(paramAfter);
        expect(paramAfter).toEqual('11');
      });
    });
  });
});
