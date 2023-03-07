import {
  CORE_CONTRACT_ADDRESS,
  PRE_PROPOSE_CONTRACT_ADDRESS,
  PROPOSE_CONTRACT_ADDRESS,
  VAULT_CONTRACT_ADDRESS,
  PROPOSE_MULTIPLE_CONTRACT_ADDRESS,
  CosmosWrapper,
  NEUTRON_DENOM,
} from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { getWithAttempts } from '../helpers/wait';

describe('Neutron / Governance', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let cm3: CosmosWrapper;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cm2 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.demo2,
      NEUTRON_DENOM,
    );
    cm3 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.rly1,
      NEUTRON_DENOM,
    );
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await cm.bondFunds(
        VAULT_CONTRACT_ADDRESS,
        '1000',
        cm.wallet.address.toString(),
      );
      await getWithAttempts(
        cm.blockWaiter,
        async () =>
          await cm.queryVotingPower(
            CORE_CONTRACT_ADDRESS,
            cm.wallet.address.toString(),
          ),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('bond from wallet 2', async () => {
      await cm2.bondFunds(
        VAULT_CONTRACT_ADDRESS,
        '1000',
        cm2.wallet.address.toString(),
      );
      await getWithAttempts(
        cm2.blockWaiter,
        async () =>
          await cm2.queryVotingPower(
            CORE_CONTRACT_ADDRESS,
            cm2.wallet.address.toString(),
          ),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('bond from wallet 3 ', async () => {
      await cm3.bondFunds(
        VAULT_CONTRACT_ADDRESS,
        '1000',
        cm3.wallet.address.toString(),
      );
      await getWithAttempts(
        cm3.blockWaiter,
        async () =>
          await cm3.queryVotingPower(
            CORE_CONTRACT_ADDRESS,
            cm3.wallet.address.toString(),
          ),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('check voting power', async () => {
      await getWithAttempts(
        cm.blockWaiter,
        async () => await cm.queryTotalVotingPower(CORE_CONTRACT_ADDRESS),
        async (response) => response.power == 3000,
        20,
      );
    });
  });

  describe('send a bit funds to core contracts', () => {
    test('send funds from wallet 1', async () => {
      await cm.msgSend(CORE_CONTRACT_ADDRESS, '1000');
      await getWithAttempts(
        cm.blockWaiter,
        async () => await cm.queryBalances(CORE_CONTRACT_ADDRESS),
        async (response) => response.balances[0].amount == '1000',
        20,
      );
    });
  });

  describe('create several proposals', () => {
    test('create proposal #1, will pass', async () => {
      await cm.submitParameterChangeProposal(
        PRE_PROPOSE_CONTRACT_ADDRESS,
        'Proposal #1',
        'Param change proposal. This one will pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000',
      );
    });

    test('create proposal #2, will be rejected', async () => {
      await cm.submitParameterChangeProposal(
        PRE_PROPOSE_CONTRACT_ADDRESS,
        'Proposal #2',
        'Param change proposal. This one will not pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000',
      );
    });

    test('create proposal #3, will pass', async () => {
      await cm.submitSendProposal(
        PRE_PROPOSE_CONTRACT_ADDRESS,
        'Proposal #3',
        'This one will pass',
        '1000',
        CORE_CONTRACT_ADDRESS,
      );
    });

    test('create proposal #4, will pass', async () => {
      await cm.submitSoftwareUpgradeProposal(
        PRE_PROPOSE_CONTRACT_ADDRESS,
        'Proposal #4',
        'Software upgrade proposal. Will pass',
        'Plan #1',
        500,
        'Plan info',
        '1000',
      );
    });

    test('create proposal #5, will pass', async () => {
      await cm.submitCancelSoftwareUpgradeProposal(
        PRE_PROPOSE_CONTRACT_ADDRESS,
        'Proposal #5',
        'Software upgrade proposal. Will pass',
        '1000',
      );
    });

    test('create proposal #6, will pass', async () => {
      await cm.submitUpgradeProposal(
        PRE_PROPOSE_CONTRACT_ADDRESS,
        'Proposal #6',
        'Software upgrade proposal. Will pass',
        'Plan #1',
        500,
        'Plan info',
        'any',
        '1000',
      );
    });

    test('create proposal #7, will pass', async () => {
      await cm.submitUpdateClientProposal(
        PRE_PROPOSE_CONTRACT_ADDRESS,
        'Proposal #7',
        'Software upgrade proposal. Will pass',
        'Plan #1',
        '1',
        '1000',
      );
    });

    test('create proposal #8, will pass', async () => {
      await cm.submitPinCodesProposal(
        PRE_PROPOSE_CONTRACT_ADDRESS,
        'Proposal #8',
        'Software upgrade proposal. Will pass',
        [1, 2],
        '1000',
      );
    });

    test('create proposal #9, will pass', async () => {
      await cm.submitUnpinCodesProposal(
        PRE_PROPOSE_CONTRACT_ADDRESS,
        'Proposal #6',
        'Software upgrade proposal. Will pass',
        [1, 2],
        '1000',
      );
    });

    test('create multi-choice proposal #1, will be picked choice 1', async () => {
      await cm.submitMultiChoiceParameterChangeProposal(
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
      await cm.submitMultiChoiceParameterChangeProposal(
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
      await cm.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(PROPOSE_CONTRACT_ADDRESS, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
  });

  describe('vote for proposal #2 (no, yes, no)', () => {
    const proposalId = 2;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 3', async () => {
      await cm3.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #2', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (
          await cm.executeProposal(PROPOSE_CONTRACT_ADDRESS, proposalId)
        ).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await getWithAttempts(
        cm.blockWaiter,
        async () =>
          await cm.queryProposal(PROPOSE_CONTRACT_ADDRESS, proposalId),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
    });
  });

  describe('vote for proposal #3 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        3,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        3,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        3,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #3', () => {
    const proposalId = 3;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(PROPOSE_CONTRACT_ADDRESS, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
  });

  describe('vote for multichoice proposal #1 (1, 0, 1)', () => {
    const proposalId = 1;
    test('vote 1 from wallet 1', async () => {
      await cm.voteForOption(PROPOSE_MULTIPLE_CONTRACT_ADDRESS, proposalId, 1);
    });
    test('vote 0 from wallet 2', async () => {
      await cm2.voteForOption(PROPOSE_MULTIPLE_CONTRACT_ADDRESS, proposalId, 0);
    });
    test('vote 1 from wallet 3', async () => {
      await cm3.voteForOption(PROPOSE_MULTIPLE_CONTRACT_ADDRESS, proposalId, 1);
    });
  });

  describe('execute multichoice proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await cm.checkPassedMultiChoiceProposal(
        PROPOSE_MULTIPLE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
    test('execute passed proposal', async () => {
      await cm.executeMultiChoiceProposalWithAttempts(
        PROPOSE_MULTIPLE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
    test('check if proposal is executed', async () => {
      await cm.checkExecutedMultiChoiceProposal(
        PROPOSE_MULTIPLE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
  });

  describe('vote for multichoice proposal #2 (2, 2, 0)', () => {
    const proposalId = 2;
    test('vote 2 from wallet 1', async () => {
      await cm.voteForOption(PROPOSE_MULTIPLE_CONTRACT_ADDRESS, proposalId, 2);
    });
    test('vote 2 from wallet 2', async () => {
      await cm2.voteForOption(PROPOSE_MULTIPLE_CONTRACT_ADDRESS, proposalId, 0);
    });
    test('vote 0 from wallet 3', async () => {
      await cm3.voteForOption(PROPOSE_MULTIPLE_CONTRACT_ADDRESS, proposalId, 2);
    });
  });

  describe('execute multichoice proposal #2', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (
          await cm.executeMultiChoiceProposal(
            PROPOSE_MULTIPLE_CONTRACT_ADDRESS,
            proposalId,
          )
        ).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await getWithAttempts(
        cm.blockWaiter,
        async () =>
          await cm.queryMultiChoiceProposal(
            PROPOSE_MULTIPLE_CONTRACT_ADDRESS,
            proposalId,
          ),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
    });
  });

  describe('vote for proposal #4 (no, yes, yes)', () => {
    const proposalId = 4;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #4', () => {
    const proposalId = 4;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(PROPOSE_CONTRACT_ADDRESS, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
  });

  describe('vote for proposal #5 (no, yes, yes)', () => {
    const proposalId = 5;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #5', () => {
    const proposalId = 5;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(PROPOSE_CONTRACT_ADDRESS, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
  });

  describe('vote for proposal #6 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        6,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        6,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        6,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #7', () => {
    const proposalId = 7;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(PROPOSE_CONTRACT_ADDRESS, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
  });

  describe('vote for proposal #7 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        7,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        7,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        7,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #8', () => {
    const proposalId = 8;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(PROPOSE_CONTRACT_ADDRESS, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
  });

  describe('vote for proposal #8 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        8,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        8,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        8,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #8', () => {
    const proposalId = 8;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(PROPOSE_CONTRACT_ADDRESS, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
  });

  describe('vote for proposal #9 (yes, no, yes)', () => {
    test('vote YES from wallet 9', async () => {
      await cm.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        9,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        PROPOSE_CONTRACT_ADDRESS,
        9,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        PROPOSE_CONTRACT_ADDRESS,
        9,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #3', () => {
    const proposalId = 9;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(PROPOSE_CONTRACT_ADDRESS, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        PROPOSE_CONTRACT_ADDRESS,
        proposalId,
      );
    });
  });
});
