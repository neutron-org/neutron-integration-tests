import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { getWithAttempts } from '../../helpers/wait';
import { Dao, DaoMember, getDaoContracts } from '../../helpers/dao';

describe('Neutron / Governance', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let cm3: CosmosWrapper;
  let dm: DaoMember;
  let dm2: DaoMember;
  let dm3: DaoMember;
  let vaultContractAddress: string;
  let dao: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutron.genQaWal1,
      NEUTRON_DENOM,
    );
    cm2 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutronThree.genQaWal1,
      NEUTRON_DENOM,
    );
    cm3 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutronFour.genQaWal1,
      NEUTRON_DENOM,
    );
    const daoCoreAddress = (await cm.getChainAdmins())[0];
    const daoContracts = await getDaoContracts(cm, daoCoreAddress);
    dao = new Dao(cm, daoContracts);
    vaultContractAddress =
      daoContracts.voting_module.voting_vaults.ntrn_vault.address;
    dm = new DaoMember(cm, dao);
    dm2 = new DaoMember(cm2, dao);
    dm3 = new DaoMember(cm3, dao);
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await cm.bondFunds(
        vaultContractAddress,
        '1000',
        cm.wallet.address.toString(),
      );
      await getWithAttempts(
        cm.blockWaiter,
        async () => await dao.queryVotingPower(cm.wallet.address.toString()),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('bond from wallet 2', async () => {
      await cm2.bondFunds(
        vaultContractAddress,
        '1000',
        cm2.wallet.address.toString(),
      );
      await getWithAttempts(
        cm2.blockWaiter,
        async () => await dao.queryVotingPower(cm2.wallet.address.toString()),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('bond from wallet 3 ', async () => {
      await cm3.bondFunds(
        vaultContractAddress,
        '1000',
        cm3.wallet.address.toString(),
      );
      await getWithAttempts(
        cm3.blockWaiter,
        async () => await dao.queryVotingPower(cm3.wallet.address.toString()),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('check voting power', async () => {
      await getWithAttempts(
        cm.blockWaiter,
        async () => await dao.queryTotalVotingPower(),
        async (response) => response.power == 3000,
        20,
      );
    });
  });

  describe('send a bit funds to core contracts', () => {
    test('send funds from wallet 1', async () => {
      await cm.msgSend(dao.contracts.core.address, '1000');
      await getWithAttempts(
        cm.blockWaiter,
        async () => await cm.queryBalances(dao.contracts.core.address),
        async (response) => response.balances[0].amount == '1000',
        20,
      );
    });
  });

  describe('create several proposals', () => {
    test('create proposal #1, will pass', async () => {
      await dao.submitParameterChangeProposal(
        'Proposal #1',
        'Param change proposal. This one will pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000',
      );
    });

    test('create proposal #2, will be rejected', async () => {
      await dao.submitParameterChangeProposal(
        'Proposal #2',
        'Param change proposal. This one will not pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000',
      );
    });

    test('create proposal #3, will pass', async () => {
      await dao.submitSendProposal(
        'Proposal #3',
        'This one will pass',
        '1000',
        dao.contracts.core.address,
      );
    });

    test('create proposal #4, will pass', async () => {
      await dao.submitSoftwareUpgradeProposal(
        'Proposal #4',
        'Software upgrade proposal. Will pass',
        'Plan #1',
        500,
        'Plan info',
        '1000',
      );
    });

    test('create proposal #5, will pass', async () => {
      await dao.submitCancelSoftwareUpgradeProposal(
        'Proposal #4',
        'Software upgrade proposal. Will pass',
        '1000',
      );
    });

    test('create multi-choice proposal #1, will be picked choice 1', async () => {
      await dao.submitMultiChoiceParameterChangeProposal(
        [
          {
            title: 'title',
            description: 'title',
            subspace: 'icahost',
            key: 'HostEnabled',
            value: 'false',
          },
          {
            title: 'title2',
            description: 'title2',
            subspace: 'icahost',
            key: 'HostEnabled',
            value: 'true',
          },
        ],
        'Proposal multichoice #1',
        'Multi param change proposal. This one will pass and choice 1 picked',
        '1000',
      );
    });

    test('create multi-choice proposal #2, will be rejected', async () => {
      await dao.submitMultiChoiceParameterChangeProposal(
        [
          {
            title: 'title',
            description: 'title',
            subspace: 'icahost',
            key: 'HostEnabled',
            value: 'true',
          },
          {
            title: 'title2',
            description: 'title2',
            subspace: 'icahost',
            key: 'HostEnabled',
            value: 'false',
          },
        ],
        'Proposal multichoice #2',
        'Multi param change proposal. This one be rejected',
        '1000',
      );
    });
  });

  describe('vote for proposal #1 (no, yes, yes)', () => {
    const proposalId = 1;
    test('vote NO from wallet 1', async () => {
      await dm.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await dm2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await dm3.voteYes(proposalId);
    });
  });

  describe('execute proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await dao.executeProposalWithAttempts(proposalId);
    });
  });

  describe('vote for proposal #2 (no, yes, no)', () => {
    const proposalId = 2;
    test('vote NO from wallet 1', async () => {
      await dm.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await dm2.voteYes(proposalId);
    });
    test('vote NO from wallet 3', async () => {
      await dm3.voteNo(proposalId);
    });
  });

  describe('execute proposal #2', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (await dao.executeProposal(proposalId)).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await getWithAttempts(
        cm.blockWaiter,
        async () => await dao.queryProposal(proposalId),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
    });
  });

  describe('vote for proposal #3 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await dm.voteYes(3);
    });
    test('vote NO from wallet 2', async () => {
      await dm2.voteNo(3);
    });
    test('vote YES from wallet 3', async () => {
      await dm3.voteYes(3);
    });
  });

  describe('execute proposal #3', () => {
    const proposalId = 3;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await dao.executeProposalWithAttempts(proposalId);
    });
  });

  describe('vote for multichoice proposal #1 (1, 0, 1)', () => {
    const proposalId = 1;
    test('vote 1 from wallet 1', async () => {
      await dm.voteForOption(proposalId, 1);
    });
    test('vote 0 from wallet 2', async () => {
      await dm2.voteForOption(proposalId, 0);
    });
    test('vote 1 from wallet 3', async () => {
      await dm3.voteForOption(proposalId, 1);
    });
  });

  describe('execute multichoice proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await dao.checkPassedMultiChoiceProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await dao.executeMultiChoiceProposalWithAttempts(proposalId);
    });
    test('check if proposal is executed', async () => {
      await dao.checkExecutedMultiChoiceProposal(proposalId);
    });
  });

  describe('vote for multichoice proposal #2 (2, 2, 0)', () => {
    const proposalId = 2;
    test('vote 2 from wallet 1', async () => {
      await dm.voteForOption(proposalId, 2);
    });
    test('vote 2 from wallet 2', async () => {
      await dm2.voteForOption(proposalId, 0);
    });
    test('vote 0 from wallet 3', async () => {
      await dm3.voteForOption(proposalId, 2);
    });
  });

  describe('execute multichoice proposal #2', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (await dao.executeMultiChoiceProposal(proposalId)).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await getWithAttempts(
        cm.blockWaiter,
        async () => await dao.queryMultiChoiceProposal(proposalId),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
    });
  });

  describe('vote for proposal #4 (no, yes, yes)', () => {
    const proposalId = 4;
    test('vote NO from wallet 1', async () => {
      await dm.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await dm2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await dm3.voteYes(proposalId);
    });
  });

  describe('execute proposal #4', () => {
    const proposalId = 4;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await dao.executeProposalWithAttempts(proposalId);
    });
  });

  describe('vote for proposal #5 (no, yes, yes)', () => {
    const proposalId = 5;
    test('vote NO from wallet 1', async () => {
      await dm.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await dm2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await dm3.voteYes(proposalId);
    });
  });

  describe('execute proposal #5', () => {
    const proposalId = 5;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await dao.executeProposalWithAttempts(proposalId);
    });
  });
});
