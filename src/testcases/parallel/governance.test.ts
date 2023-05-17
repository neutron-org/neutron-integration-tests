import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { getWithAttempts } from '../../helpers/wait';
import { NeutronContract } from '../../helpers/types';
import { Dao, DaoMember, getDaoContracts } from '../../helpers/dao';

describe('Neutron / Governance', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember1: DaoMember;
  let daoMember2: DaoMember;
  let daoMember3: DaoMember;
  let dao: Dao;

  let contractAddress: string;
  let contractAddressForAdminMigration: string;

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
    daoMember2 = new DaoMember(
      new WalletWrapper(
        neutronChain,
        testState.wallets.qaNeutronThree.genQaWal1,
      ),
      dao,
    );
    daoMember3 = new DaoMember(
      new WalletWrapper(
        neutronChain,
        testState.wallets.qaNeutronFour.genQaWal1,
      ),
      dao,
    );

    const contractCodeId = await neutronAccount.storeWasm(
      NeutronContract.IBC_TRANSFER,
    );
    expect(contractCodeId).toBeGreaterThan(0);
    const contractRes = await neutronAccount.instantiateContract(
      contractCodeId,
      '{}',
      'ibc_transfer',
      dao.contracts.core.address,
    );
    contractAddressForAdminMigration = contractRes[0]._contract_address;
    expect(contractAddressForAdminMigration).toBeDefined();
    expect(contractAddressForAdminMigration).not.toEqual('');
  });

  describe('Contracts', () => {
    let codeId: number;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(NeutronContract.MSG_RECEIVER);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await neutronAccount.instantiateContract(
        codeId,
        '{}',
        'msg_receiver',
      );
      contractAddress = res[0]._contract_address;
    });
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
    test('bond from wallet 2', async () => {
      await daoMember2.bondFunds('1000');
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () =>
          await dao.queryVotingPower(daoMember1.user.wallet.address.toString()),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('bond from wallet 3 ', async () => {
      await daoMember3.bondFunds('1000');
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
        async (response) => response.power == 3000,
        20,
      );
    });
  });

  describe('send a bit funds to core contracts', () => {
    test('send funds from wallet 1', async () => {
      const balanceBefore = await neutronChain.queryDenomBalance(
        dao.contracts.core.address,
        NEUTRON_DENOM,
      );
      await daoMember1.user.msgSend(dao.contracts.core.address, '1000');
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () =>
          await neutronChain.queryDenomBalance(
            dao.contracts.core.address,
            NEUTRON_DENOM,
          ),
        async (response) => response == balanceBefore + 1000,
        20,
      );
    });
  });

  describe('create several proposals', () => {
    test('create proposal #1, will pass', async () => {
      await daoMember1.submitParameterChangeProposal(
        'Proposal #1',
        'Param change proposal. This one will pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000',
      );
    });

    test('create proposal #2, will be rejected', async () => {
      await daoMember1.submitParameterChangeProposal(
        'Proposal #2',
        'Param change proposal. This one will not pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000',
      );
    });

    test('create proposal #3, will pass', async () => {
      await daoMember1.submitSendProposal(
        'Proposal #3',
        'This one will pass',
        [
          {
            recipient: dao.contracts.core.address.toString(),
            amount: 1000,
            denom: neutronChain.denom,
          },
        ],
        '1000',
      );
    });

    test('create proposal #4, will pass', async () => {
      await daoMember1.submitSoftwareUpgradeProposal(
        'Proposal #4',
        'Software upgrade proposal. Will pass',
        'Plan #1',
        500,
        'Plan info',
        '1000',
      );
    });

    test('create proposal #5, will pass', async () => {
      await daoMember1.submitCancelSoftwareUpgradeProposal(
        'Proposal #5',
        'Software upgrade proposal. Will pass',
        '1000',
      );
    });

    test('create proposal #6, will pass', async () => {
      await daoMember1.submitClientUpdateProposal(
        'Proposal #6',
        'UpdateClient proposal. Will pass',
        '07-tendermint-1',
        '07-tendermint-2',
        '1000',
      );
    });

    test('create proposal #7, will pass', async () => {
      await daoMember1.submitPinCodesProposal(
        'Proposal #7',
        'Pin codes proposal. Will pass',
        [1, 2],
        '1000',
      );
    });

    test('create proposal #8, will pass', async () => {
      await daoMember1.submitUnpinCodesProposal(
        'Proposal #8',
        'Unpin codes proposal. Will pass',
        [1, 2],
        '1000',
      );
    });

    test('create proposal #9, will pass', async () => {
      await daoMember1.submitUpdateAdminProposal(
        'Proposal #9',
        'Update admin proposal. Will pass',
        contractAddressForAdminMigration,
        daoMember1.user.wallet.address.toString(),
        '1000',
      );
    });

    test('create proposal #10, will pass', async () => {
      await daoMember1.submitClearAdminProposal(
        'Proposal #10',
        'Clear admin proposal. Will pass',
        contractAddressForAdminMigration,
        '1000',
      );
    });

    // add schedule with valid message format
    test('create proposal #11, will pass', async () => {
      await daoMember1.submitAddSchedule(
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
      await daoMember1.submitRemoveSchedule(
        'Proposal #12',
        '',
        '1000',
        'proposal11',
      );
    });

    // add schedule with 3 messages, first returns error, second in incorrect format, third is valid
    test('create proposal #13, will pass', async () => {
      await daoMember1.submitAddSchedule(
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

    // add schedule with 3 messages, first is valid, second returns error
    test('create proposal #14, will pass', async () => {
      await daoMember1.submitAddSchedule(
        'Proposal #14',
        '',
        '1000',
        'proposal14',
        5,
        [
          {
            contract: contractAddress,
            msg: '{"test_msg": {"return_err": false, "arg": "correct_msg"}}',
          },
          {
            contract: contractAddress,
            msg: '{"test_msg": {"return_err": true, "arg": ""}}',
          },
        ],
      );
    });

    test('create multi-choice proposal #1, will be picked choice 1', async () => {
      await daoMember1.submitMultiChoiceParameterChangeProposal(
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
      await daoMember1.submitMultiChoiceParameterChangeProposal(
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
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check if proposal is passed', async () => {
      const host = await neutronChain.queryHostEnabled();
      expect(host).toEqual(false);
    });
  });

  describe('vote for proposal #2 (no, yes, no)', () => {
    const proposalId = 2;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote NO from wallet 3', async () => {
      await daoMember3.voteNo(proposalId);
    });
  });

  describe('execute proposal #2', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (await daoMember1.executeProposal(proposalId)).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () => await dao.queryProposal(proposalId),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
    });
  });

  describe('vote for proposal #3 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await daoMember1.voteYes(3);
    });
    test('vote NO from wallet 2', async () => {
      await daoMember2.voteNo(3);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(3);
    });
  });

  describe('execute proposal #3', () => {
    const proposalId = 3;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('vote for multichoice proposal #1 (1, 0, 1)', () => {
    const proposalId = 1;
    test('vote 1 from wallet 1', async () => {
      await daoMember1.voteForOption(proposalId, 1);
    });
    test('vote 0 from wallet 2', async () => {
      await daoMember2.voteForOption(proposalId, 0);
    });
    test('vote 1 from wallet 3', async () => {
      await daoMember3.voteForOption(proposalId, 1);
    });
  });

  describe('execute multichoice proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await dao.checkPassedMultiChoiceProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeMultiChoiceProposalWithAttempts(proposalId);
    });
    test('check if proposal is executed', async () => {
      await dao.checkExecutedMultiChoiceProposal(proposalId);
    });
  });

  describe('vote for multichoice proposal #2 (2, 2, 0)', () => {
    const proposalId = 2;
    test('vote 2 from wallet 1', async () => {
      await daoMember1.voteForOption(proposalId, 2);
    });
    test('vote 2 from wallet 2', async () => {
      await daoMember2.voteForOption(proposalId, 0);
    });
    test('vote 0 from wallet 3', async () => {
      await daoMember3.voteForOption(proposalId, 2);
    });
  });

  describe('execute multichoice proposal #2', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 2;
      let rawLog: any;
      try {
        rawLog = (await daoMember1.executeMultiChoiceProposal(proposalId))
          .raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () => await dao.queryMultiChoiceProposal(proposalId),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
    });
  });

  describe('vote for proposal #4 (no, yes, yes)', () => {
    const proposalId = 4;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #4', () => {
    const proposalId = 4;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('check state change from proposal #4 execution', () => {
    test('check if software current plan was created', async () => {
      const currentPlan = await neutronChain.queryCurrentUpgradePlan();
      expect(currentPlan.plan?.height).toEqual('500');
      expect(currentPlan.plan?.name).toEqual('Plan #1');
      expect(currentPlan.plan?.info).toEqual('Plan info');
    });
  });

  describe('vote for proposal #5 (no, yes, yes)', () => {
    const proposalId = 5;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #5', () => {
    const proposalId = 5;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('check state change from proposal #5 execution', () => {
    test('check if software current plan was removed', async () => {
      const currentPlan = await neutronChain.queryCurrentUpgradePlan();
      expect(currentPlan.plan).toBeNull();
    });
  });

  describe('vote for proposal #6 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await daoMember1.voteYes(6);
    });
    test('vote NO from wallet 2', async () => {
      await daoMember2.voteNo(6);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(6);
    });
  });
  describe('execute proposal #6', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 6;
      let rawLog: any;
      try {
        rawLog = (await daoMember1.executeProposal(proposalId)).raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes('cannot update localhost client with proposal'));
    });
  });

  describe('vote for proposal #7 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await daoMember1.voteYes(7);
    });
    test('vote NO from wallet 2', async () => {
      await daoMember2.voteNo(7);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(7);
    });
  });

  describe('execute proposal #7', () => {
    const proposalId = 7;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check that codes were pinned', async () => {
      const res = await neutronChain.queryPinnedCodes();
      expect(res.code_ids).toEqual(['1', '2']);
    });
  });

  describe('vote for proposal #8 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await daoMember1.voteYes(8);
    });
    test('vote NO from wallet 2', async () => {
      await daoMember2.voteNo(8);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(8);
    });
  });

  describe('execute proposal #8', () => {
    const proposalId = 8;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check that codes were unpinned', async () => {
      const res = await neutronChain.queryPinnedCodes();
      expect(res.code_ids.length).toEqual(0);
    });
  });

  describe('vote for proposal #9 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await daoMember1.voteYes(9);
    });
    test('vote NO from wallet 2', async () => {
      await daoMember2.voteNo(9);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(9);
    });
  });

  describe('execute proposal #9', () => {
    const proposalId = 9;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
      const contractInfo = await neutronChain.getContractInfo(
        contractAddressForAdminMigration,
      );
      const newAdmin = contractInfo.contract_info.admin;
      expect(newAdmin).toEqual(daoMember1.user.wallet.address.toString());
    });
    test('check that admin was changed', async () => {
      const admin = await neutronChain.queryContractAdmin(
        dao.contracts.core.address,
      );
      expect(admin).toEqual(daoMember1.user.wallet.address.toString());
    });
  });

  describe('vote for proposal #10 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await daoMember1.voteYes(10);
    });
    test('vote NO from wallet 2', async () => {
      await daoMember2.voteNo(10);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(10);
    });
  });

  describe('execute proposal #10', () => {
    const proposalId = 10;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
      const contractInfo = await neutronChain.getContractInfo(
        contractAddressForAdminMigration,
      );
      const newAdmin = contractInfo.contract_info.admin;
      expect(newAdmin).toEqual('');
    });
    test('check that admin was changed', async () => {
      const admin = await neutronChain.queryContractAdmin(
        dao.contracts.core.address,
      );
      expect(admin).toEqual('');
    });
  });

  describe('vote for proposal #11 (no, yes, yes)', () => {
    const proposalId = 11;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #11', () => {
    const proposalId = 11;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('check that schedule was added and executed later', () => {
    test('check that schedule was added', async () => {
      const res = await neutronChain.querySchedules();
      expect(res.schedules.length).toEqual(1);
    });

    test('check that msg from schedule was executed', async () => {
      await neutronChain.blockWaiter.waitBlocks(15);
      const queryResult = await neutronChain.queryContract<TestArgResponse>(
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

      await neutronChain.blockWaiter.waitBlocks(10);
      const queryResultLater =
        await neutronChain.queryContract<TestArgResponse>(contractAddress, {
          test_msg: { arg: 'proposal_11' },
        });
      expect(beforeCount).toBeLessThan(queryResultLater.count);
    });
  });

  describe('vote for proposal #12 (no, yes, yes)', () => {
    const proposalId = 12;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #12', () => {
    const proposalId = 12;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('check that schedule was removed', () => {
    test('check that schedule was removed', async () => {
      const res = await neutronChain.querySchedules();
      expect(res.schedules.length).toEqual(0);
    });
  });

  describe('vote for proposal #13 (no, yes, yes)', () => {
    const proposalId = 13;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #13', () => {
    const proposalId = 13;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('check that schedule was added and executed later', () => {
    test('check that schedule was added', async () => {
      const res = await neutronChain.querySchedules();
      expect(res.schedules.length).toEqual(1);
    });

    test('check that last msg from schedule was not executed because there was error in other messages', async () => {
      await neutronChain.blockWaiter.waitBlocks(15);
      const queryResult = await neutronChain.queryContract<TestArgResponse>(
        contractAddress,
        {
          test_msg: { arg: 'three_messages' },
        },
      );

      expect(queryResult).toEqual(null);
    });
  });

  describe('vote for proposal #14 (no, yes, yes)', () => {
    const proposalId = 14;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #14', () => {
    const proposalId = 14;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('check that schedule was added and executed later', () => {
    test('check that schedule was added', async () => {
      const res = await neutronChain.querySchedules();
      expect(res.schedules.length).toEqual(2);
    });

    test('check that first msg from schedule was not committed because there was error in the last msg', async () => {
      await neutronChain.blockWaiter.waitBlocks(15);
      const queryResult = await neutronChain.queryContract<TestArgResponse>(
        contractAddress,
        {
          test_msg: { arg: 'correct_msg' },
        },
      );

      expect(queryResult).toEqual(null);
    });
  });
  describe('check that only admin can create valid proposals', () => {
    test('submit admin proposal from non-admin addr, should fail', async () => {
      const hostStatus = await neutronChain.queryHostEnabled();
      expect(hostStatus).toEqual(true);
      const res = await daoMember1.user.msgSendDirectProposal(
        'icahost',
        'HostEnabled',
        'false',
      );
      expect(res.code).toEqual(1); // must be admin to submit proposals to admin-module
      const afterProposalHostStatus = await neutronChain.queryHostEnabled();
      expect(afterProposalHostStatus).toEqual(true);
    });
  });
});

type TestArgResponse = {
  sender: string | null;
  funds: { denom: string; amount: string }[];
  count: number;
};
