import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { getWithAttempts } from '../../helpers/wait';
import { NeutronContract } from '../../helpers/types';
import { DaoContracts, getDaoContracts } from '../../helpers/dao';

describe('Neutron / Governance', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let cm3: CosmosWrapper;
  let daoContracts: DaoContracts;
  let vaultContractAddress: string;
  let preProposeContractAddress: string;
  let proposeSingleContractAddress: string;
  let proposeMultipleContractAddress: string;
  let mainDao: string;

  let contractAddress: string;

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
    daoContracts = await getDaoContracts(cm, daoCoreAddress);
    vaultContractAddress =
      daoContracts.voting_module.voting_vaults.ntrn_vault.address;
    preProposeContractAddress =
      daoContracts.proposal_modules.single.pre_proposal_module.address;
    proposeSingleContractAddress = daoContracts.proposal_modules.single.address;
    proposeMultipleContractAddress =
      daoContracts.proposal_modules.multiple.address;
    mainDao = daoCoreAddress;
  });

  describe('Contracts', () => {
    let codeId: string;
    test('store contract', async () => {
      codeId = await cm.storeWasm(NeutronContract.MSG_RECEIVER);
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await cm.instantiate(codeId, '{}', 'msg_receiver');
      contractAddress = res[0]._contract_address;
    });
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
        async () =>
          await cm.queryVotingPower(
            daoContracts.core.address,
            cm.wallet.address.toString(),
          ),
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
        async () =>
          await cm2.queryVotingPower(
            daoContracts.core.address,
            cm2.wallet.address.toString(),
          ),
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
        async () =>
          await cm3.queryVotingPower(
            daoContracts.core.address,
            cm3.wallet.address.toString(),
          ),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('check voting power', async () => {
      await getWithAttempts(
        cm.blockWaiter,
        async () => await cm.queryTotalVotingPower(daoContracts.core.address),
        async (response) => response.power == 3000,
        20,
      );
    });
  });

  describe('send a bit funds to core contracts', () => {
    test('send funds from wallet 1', async () => {
      await cm.msgSend(daoContracts.core.address, '1000');
      await getWithAttempts(
        cm.blockWaiter,
        async () => await cm.queryBalances(daoContracts.core.address),
        async (response) => response.balances[0].amount == '1000',
        20,
      );
    });
  });

  describe('create several proposals', () => {
    test('create proposal #1, will pass', async () => {
      await cm.submitParameterChangeProposal(
        preProposeContractAddress,
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
        preProposeContractAddress,
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
        preProposeContractAddress,
        'Proposal #3',
        'This one will pass',
        '1000',
        mainDao,
      );
    });

    test('create proposal #4, will pass', async () => {
      await cm.submitSoftwareUpgradeProposal(
        preProposeContractAddress,
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
        preProposeContractAddress,
        'Proposal #5',
        'Software upgrade proposal. Will pass',
        '1000',
      );
    });

    test('create proposal #6, will pass', async () => {
      await cm.submitClientUpdateProposal(
        preProposeContractAddress,
        'Proposal #6',
        'UpdateClient proposal. Will pass',
        '07-tendermint-1',
        '07-tendermint-2',
        '1000',
      );
    });

    test('create proposal #7, will pass', async () => {
      await cm.submitPinCodesProposal(
        preProposeContractAddress,
        'Proposal #7',
        'Pin codes proposal. Will pass',
        [1, 2],
        '1000',
      );
    });

    test('create proposal #8, will pass', async () => {
      await cm.submitUnpinCodesProposal(
        preProposeContractAddress,
        'Proposal #8',
        'Unpin codes proposal. Will pass',
        [1, 2],
        '1000',
      );
    });

    test('create proposal #9, will pass', async () => {
      await cm.submitUpdateAdminProposal(
        preProposeContractAddress,
        'Proposal #9',
        'Update admin proposal. Will pass',
        mainDao,
        cm.wallet.address.toString(),
        '1000',
      );
    });

    test('create proposal #10, will pass', async () => {
      await cm.submitClearAdminProposal(
        preProposeContractAddress,
        'Proposal #10',
        'Clear admin proposal. Will pass',
        mainDao,
        '1000',
      );
    });

    // add schedule with valid message format
    test('create proposal #11, will pass', async () => {
      await cm.submitAddSchedule(
        preProposeContractAddress,
        'Proposal #11',
        '',
        '1000',
        'proposal11',
        5,
        [
          {
            contract: contractAddress,
            msg: '{"test_msg": {"return_err": false, "arg": "proposal_11"}}',
          },
        ],
      );
    });

    // remove schedule
    test('create proposal #12, will pass', async () => {
      await cm.submitRemoveSchedule(
        preProposeContractAddress,
        'Proposal #12',
        '',
        '1000',
        'proposal11',
      );
    });

    // add schedule with 3 messages, first returns error, second in incorrect format, third is valid
    test('create proposal #13, will pass', async () => {
      await cm.submitAddSchedule(
        preProposeContractAddress,
        'Proposal #13',
        '',
        '1000',
        'proposal13',
        5,
        [
          {
            contract: contractAddress,
            msg: '{"test_msg": {"return_err": true, "arg": ""}}',
          },
          {
            contract: contractAddress,
            msg: '{"incorrect_format": {"return_err": false, "arg": "proposal_11"}}',
          },
          {
            contract: contractAddress,
            msg: '{"test_msg": {"return_err": false, "arg": "three_messages"}}',
          },
        ],
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
        proposeSingleContractAddress,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('vote for proposal #2 (no, yes, no)', () => {
    const proposalId = 2;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(
        proposeSingleContractAddress,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 3', async () => {
      await cm3.voteNo(
        proposeSingleContractAddress,
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
          await cm.executeProposal(proposeSingleContractAddress, proposalId)
        ).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await getWithAttempts(
        cm.blockWaiter,
        async () =>
          await cm.queryProposal(proposeSingleContractAddress, proposalId),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
    });
  });

  describe('vote for proposal #3 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        proposeSingleContractAddress,
        3,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        proposeSingleContractAddress,
        3,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        3,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #3', () => {
    const proposalId = 3;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('vote for multichoice proposal #1 (1, 0, 1)', () => {
    const proposalId = 1;
    test('vote 1 from wallet 1', async () => {
      await cm.voteForOption(proposeMultipleContractAddress, proposalId, 1);
    });
    test('vote 0 from wallet 2', async () => {
      await cm2.voteForOption(proposeMultipleContractAddress, proposalId, 0);
    });
    test('vote 1 from wallet 3', async () => {
      await cm3.voteForOption(proposeMultipleContractAddress, proposalId, 1);
    });
  });

  describe('execute multichoice proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await cm.checkPassedMultiChoiceProposal(
        proposeMultipleContractAddress,
        proposalId,
      );
    });
    test('execute passed proposal', async () => {
      await cm.executeMultiChoiceProposalWithAttempts(
        proposeMultipleContractAddress,
        proposalId,
      );
    });
    test('check if proposal is executed', async () => {
      await cm.checkExecutedMultiChoiceProposal(
        proposeMultipleContractAddress,
        proposalId,
      );
    });
  });

  describe('vote for multichoice proposal #2 (2, 2, 0)', () => {
    const proposalId = 2;
    test('vote 2 from wallet 1', async () => {
      await cm.voteForOption(proposeMultipleContractAddress, proposalId, 2);
    });
    test('vote 2 from wallet 2', async () => {
      await cm2.voteForOption(proposeMultipleContractAddress, proposalId, 0);
    });
    test('vote 0 from wallet 3', async () => {
      await cm3.voteForOption(proposeMultipleContractAddress, proposalId, 2);
    });
  });

  describe('execute multichoice proposal #2', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (
          await cm.executeMultiChoiceProposal(
            proposeMultipleContractAddress,
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
            proposeMultipleContractAddress,
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
        proposeSingleContractAddress,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #4', () => {
    const proposalId = 4;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('vote for proposal #5 (no, yes, yes)', () => {
    const proposalId = 5;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(
        proposeSingleContractAddress,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #5', () => {
    const proposalId = 5;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('vote for proposal #6 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        proposeSingleContractAddress,
        6,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        proposeSingleContractAddress,
        6,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        6,
        cm3.wallet.address.toString(),
      );
    });
  });
  describe('execute proposal #6', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 6;
      let rawLog: any;
      try {
        rawLog = (
          await cm.executeProposal(proposeSingleContractAddress, proposalId)
        ).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes('cannot update localhost client with proposal'));
    });
  });

  describe('vote for proposal #7 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        proposeSingleContractAddress,
        7,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        proposeSingleContractAddress,
        7,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        7,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #7', () => {
    const proposalId = 7;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('vote for proposal #8 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        proposeSingleContractAddress,
        8,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        proposeSingleContractAddress,
        8,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        8,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #8', () => {
    const proposalId = 8;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('vote for proposal #9 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        proposeSingleContractAddress,
        9,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        proposeSingleContractAddress,
        9,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        9,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #9', () => {
    const proposalId = 9;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('vote for proposal #10 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await cm.voteYes(
        proposeSingleContractAddress,
        10,
        cm.wallet.address.toString(),
      );
    });
    test('vote NO from wallet 2', async () => {
      await cm2.voteNo(
        proposeSingleContractAddress,
        10,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        10,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #10', () => {
    const proposalId = 10;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('vote for proposal #11 (no, yes, yes)', () => {
    const proposalId = 11;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(
        proposeSingleContractAddress,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #11', () => {
    const proposalId = 11;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('check that schedule was added and executed later', () => {
    test('check that schedule was added', async () => {
      const res = await cm.querySchedules();
      expect(res.schedules.length).toEqual(1);
    });

    test('check that msg from schedule was executed', async () => {
      await cm.blockWaiter.waitBlocks(15);
      const queryResult = await cm.queryContract<TestArgResponse>(
        contractAddress,
        {
          test_msg: { arg: 'proposal_11' },
        },
      );

      expect(queryResult.sender).toEqual(
        'neutron1cd6wafvehv79pm2yxth40thpyc7dc0yrqkyk95',
      );
      expect(queryResult.funds).toEqual([]);

      // check that we get increment after waiting > period blocks
      const beforeCount = queryResult.count;
      expect(beforeCount).toBeGreaterThan(0);

      await cm.blockWaiter.waitBlocks(10);
      const queryResultLater = await cm.queryContract<TestArgResponse>(
        contractAddress,
        {
          test_msg: { arg: 'proposal_11' },
        },
      );
      expect(beforeCount).toBeLessThan(queryResultLater.count);
    });
  });

  describe('vote for proposal #12 (no, yes, yes)', () => {
    const proposalId = 12;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(
        proposeSingleContractAddress,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #12', () => {
    const proposalId = 12;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('check that schedule was removed', () => {
    test('check that schedule was removed', async () => {
      const res = await cm.querySchedules();
      expect(res.schedules.length).toEqual(0);
    });
  });

  describe('vote for proposal #13 (no, yes, yes)', () => {
    const proposalId = 13;
    test('vote NO from wallet 1', async () => {
      await cm.voteNo(
        proposeSingleContractAddress,
        proposalId,
        cm.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 2', async () => {
      await cm2.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm2.wallet.address.toString(),
      );
    });
    test('vote YES from wallet 3', async () => {
      await cm3.voteYes(
        proposeSingleContractAddress,
        proposalId,
        cm3.wallet.address.toString(),
      );
    });
  });

  describe('execute proposal #13', () => {
    const proposalId = 13;
    test('check if proposal is passed', async () => {
      await cm.checkPassedProposal(proposeSingleContractAddress, proposalId);
    });
    test('execute passed proposal', async () => {
      await cm.executeProposalWithAttempts(
        proposeSingleContractAddress,
        proposalId,
      );
    });
  });

  describe('check that schedule was added and executed later', () => {
    test('check that schedule was added', async () => {
      const res = await cm.querySchedules();
      expect(res.schedules.length).toEqual(1);
    });

    test('check that last msg from schedule was not executed because there was error in other messages', async () => {
      await cm.blockWaiter.waitBlocks(15);
      const queryResult = await cm.queryContract<TestArgResponse>(
        contractAddress,
        {
          test_msg: { arg: 'three_messages' },
        },
      );

      expect(queryResult).toEqual(null);
    });
  });
});

type TestArgResponse = {
  sender: string | null;
  funds: { denom: string; amount: string }[];
  count: number;
};
