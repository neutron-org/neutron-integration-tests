import {
  CORE_CONTRACT_ADDRESS,
  CosmosWrapper,
  NEUTRON_DENOM,
} from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { getWithAttempts } from '../helpers/wait';

const checkPassedProposal = async (cm: CosmosWrapper, proposalId: number) =>
  await getWithAttempts(
    cm.sdk,
    async () => await cm.queryProposal(proposalId),
    async (response) => response.proposal.status === 'passed',
    20,
  );

const checkPassedMultiChoiceProposal = async (
  cm: CosmosWrapper,
  proposalId: number,
) =>
  await getWithAttempts(
    cm.sdk,
    async () => await cm.queryMultiChoiceProposal(proposalId),
    async (response) => response.proposal.status === 'passed',
    20,
  );

const checkExecutedMultiChoiceProposal = async (
  cm: CosmosWrapper,
  proposalId: number,
) =>
  await getWithAttempts(
    cm.sdk,
    async () => await cm.queryMultiChoiceProposal(proposalId),
    async (response) => response.proposal.status === 'executed',
    20,
  );

const executeProposalWithAttempts = async (
  cm: CosmosWrapper,
  proposalId: number,
) => {
  await cm.executeProposal(proposalId);
  await getWithAttempts(
    cm.sdk,
    async () => await cm.queryProposal(proposalId),
    async (response) => response.proposal.status === 'executed',
    20,
  );
};

const executeMultiChoiceProposalWithAttempts = async (
  cm: CosmosWrapper,
  proposalId: number,
) => {
  await cm.executeMultiChoiceProposal(proposalId);
  await getWithAttempts(
    cm.sdk,
    async () => await cm.queryMultiChoiceProposal(proposalId),
    async (response) => response.proposal.status === 'executed',
    20,
  );
};

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
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cm2 = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo2,
      NEUTRON_DENOM,
    );
    cm3 = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.rly1,
      NEUTRON_DENOM,
    );
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await cm.bondFunds('1000', cm.wallet.address.toString());
      await getWithAttempts(
        cm.sdk,
        async () => await cm.queryVotingPower(cm.wallet.address.toString()),
        async (response) => response.power == '1000',
        20,
      );
    });
    test('bond from wallet 2', async () => {
      await cm2.bondFunds('1000');
      await getWithAttempts(
        cm2.sdk,
        async () => await cm2.queryVotingPower(cm2.wallet.address.toString()),
        async (response) => response.power == '1000',
        20,
      );
    });
    test('bond from wallet 3 ', async () => {
      await cm3.bondFunds('1000', cm3.wallet.address.toString());
      await getWithAttempts(
        cm3.sdk,
        async () => await cm3.queryVotingPower(cm3.wallet.address.toString()),
        async (response) => response.power == '1000',
        20,
      );
    });
    test('check voting power', async () => {
      await getWithAttempts(
        cm.sdk,
        async () => await cm.queryTotalVotingPower(),
        async (response) => response.power == '3000',
        20,
      );
    });
  });

  describe('send a bit funds to core contracts', () => {
    test('send funds from wallet 1', async () => {
      await cm.msgSend(CORE_CONTRACT_ADDRESS, '1000');
      await getWithAttempts(
        cm.sdk,
        async () => await cm.queryBalances(CORE_CONTRACT_ADDRESS),
        async (response) => response.balances[0].amount == '1000',
        20,
      );
    });
  });

  describe('create several proposals', () => {
    test('create proposal #1, will be passed', async () => {
      await cm.submitParameterChangeProposal(
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
        'Proposal #2',
        'Param change proposal. This one will not pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000',
      );
    });

    test('create proposal #3, will be passed', async () => {
      await cm.submitSendProposal(
        'Proposal #3',
        'This one will pass',
        '1000',
        CORE_CONTRACT_ADDRESS,
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
      await cm.voteNo(proposalId, cm.wallet.address.toString());
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(proposalId, cm2.wallet.address.toString());
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(proposalId, cm3.wallet.address.toString());
    });
  });

  describe('execute proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await checkPassedProposal(cm, proposalId);
    });
    test('execute passed proposal', async () => {
      await executeProposalWithAttempts(cm, proposalId);
    });
  });

  describe('vote for proposal #2 (no, yes, no)', () => {
    const proposalId = 2;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(proposalId, cm.wallet.address.toString());
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(proposalId, cm2.wallet.address.toString());
    });
    test('vote NO from wallet 3', async () => {
      await cm3.voteNo(proposalId, cm3.wallet.address.toString());
    });
  });

  describe('execute proposal #2', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (await cm.executeProposal(proposalId)).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await getWithAttempts(
        cm.sdk,
        async () => await cm.queryProposal(proposalId),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
    });
  });

  describe('vote for proposal #3 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(3, cm.wallet.address.toString());
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(3, cm2.wallet.address.toString());
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(3, cm3.wallet.address.toString());
    });
  });

  describe('execute proposal #3', () => {
    const proposalId = 3;
    test('check if proposal is passed', async () => {
      await checkPassedProposal(cm, proposalId);
    });
    test('execute passed proposal', async () => {
      await executeProposalWithAttempts(cm, proposalId);
    });
  });

  describe('vote for multichoice proposal #1 (1, 0, 1)', () => {
    const proposalId = 1;
    test('vote 1 from wallet 1', async () => {
      await cm.voteForOption(proposalId, 1);
    });
    test('vote 0 from wallet 2', async () => {
      await cm2.voteForOption(proposalId, 0);
    });
    test('vote 1 from wallet 3', async () => {
      await cm3.voteForOption(proposalId, 1);
    });
  });

  describe('execute multichoice proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await checkPassedMultiChoiceProposal(cm, proposalId);
    });
    test('execute passed proposal', async () => {
      await executeMultiChoiceProposalWithAttempts(cm, proposalId);
    });
    test('check if proposal is executed', async () => {
      await checkExecutedMultiChoiceProposal(cm, proposalId);
    });
  });

  describe('vote for multichoice proposal #2 (2, 2, 0)', () => {
    const proposalId = 2;
    test('vote 2 from wallet 1', async () => {
      await cm.voteForOption(proposalId, 2);
    });
    test('vote 2 from wallet 2', async () => {
      await cm2.voteForOption(proposalId, 0);
    });
    test('vote 0 from wallet 3', async () => {
      await cm3.voteForOption(proposalId, 2);
    });
  });

  describe('execute multichoice proposal #2', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (await cm.executeMultiChoiceProposal(proposalId)).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await getWithAttempts(
        cm.sdk,
        async () => await cm.queryMultiChoiceProposal(proposalId),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
    });
  });
});
