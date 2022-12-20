import {
  CORE_CONTRACT_ADDRESS,
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
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cm2 = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.cosmos.demo2,
      NEUTRON_DENOM,
    );
    cm3 = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.cosmos.rly1,
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
      await cm3.bondFunds('1000', cm2.wallet.address.toString());
      await getWithAttempts(
        cm.sdk,
        async () => await cm.queryVotingPower(cm2.wallet.address.toString()),
        async (response) => response.power == '1000',
        20,
      );
    });
    test('bond from wallet 3 ', async () => {
      await cm3.bondFunds('1000', cm3.wallet.address.toString());
      await getWithAttempts(
        cm.sdk,
        async () => await cm.queryVotingPower(cm3.wallet.address.toString()),
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
        async (response) => response.balances[1].amount == '1000',
        20,
      );
    });
  });

  describe('create several proposals', () => {
    test('create proposal #1, will be passed', async () => {
      await cm.submitParameterChangeProposal(
        'Proposal #1',
        'Param change proposal. This one wll pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000stake',
      );
    });

    test('create proposal #2, will be rejected', async () => {
      await cm.submitParameterChangeProposal(
        'Proposal #2',
        'Param change proposal. This one wll not pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000stake',
      );
    });

    test('create proposal #3, will be passed', async () => {
      await cm.submitSendProposal(
        'Proposal #3',
        'This one wll pass',
        '1000',
        CORE_CONTRACT_ADDRESS,
        'false',
      );
    });
  });

  describe('vote for proposal #1 (yes, yes, yes)', () => {
    const proposalId = 1;
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(proposalId, '1000stake');
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(proposalId, '1000stake');
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(proposalId, '1000stake');
    });
  });

  describe('execute proposal #1', () => {
    test('run exucute_execute', async () => {
      const proposalId = 1;
      await cm.executeProposal(proposalId);
      await getWithAttempts(
        cm.sdk,
        async () => await cm.queryProposal(proposalId),
        async (response) => response.proposal.status === 'passed',
        20,
      );
    });
  });

  describe('vote for proposal #2 (no, yes, no)', () => {
    const proposalId = 2;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(proposalId, '1000stake');
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(proposalId, '1000stake');
    });
    test('vote NO from wallet 3', async () => {
      await cm3.voteYes(proposalId, '1000stake');
    });
  });

  describe('execute proposal #2', () => {
    test('vote YES from wallet 1', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (await cm.executeProposal(1)).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes('not in status'));
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
      await cm.voteYes(3, cm3.wallet.address.toString());
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(3, cm2.wallet.address.toString());
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(3, cm3.wallet.address.toString());
    });
  });

  describe('execute proposal #3', () => {
    test('run exucute_execute', async () => {
      const proposalId = 3;
      await cm.executeProposal(proposalId);
      await getWithAttempts(
        cm.sdk,
        async () => await cm.queryProposal(proposalId),
        async (response) => response.proposal.status === 'passed',
        20,
      );
    });
  });
});
