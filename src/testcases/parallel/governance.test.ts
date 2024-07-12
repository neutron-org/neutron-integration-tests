import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { LocalState, createWalletWrapper } from '../../helpers/local_state';
import { NeutronContract } from '@neutron-org/neutronjsplus/dist/types';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import { updateInterchaintxsParamsProposal } from '@neutron-org/neutronjsplus/dist/proposal';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import { Suite, inject } from 'vitest';
import {
  ADMIN_MODULE_ADDRESS,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus';

const config = require('../../config.json');

describe('Neutron / Governance', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember1: DaoMember;
  let daoMember2: DaoMember;
  let daoMember3: DaoMember;
  let mainDao: Dao;

  let contractAddress: string;
  let contractAddressForAdminMigration: string;

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = await LocalState.create(config, mnemonics, suite);
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.restNeutron,
      testState.rpcNeutron,
    );
    neutronAccount = await createWalletWrapper(
      neutronChain,
      await testState.nextWallet('neutron'),
    );
    const daoCoreAddress = await neutronChain.getNeutronDAOCore();
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    mainDao = new Dao(neutronChain, daoContracts);
    daoMember1 = new DaoMember(neutronAccount, mainDao);
    daoMember2 = new DaoMember(
      await createWalletWrapper(
        neutronChain,
        await testState.nextWallet('neutron'),
      ),
      mainDao,
    );
    daoMember3 = new DaoMember(
      await createWalletWrapper(
        neutronChain,
        await testState.nextWallet('neutron'),
      ),
      mainDao,
    );

    const contractCodeId = await neutronAccount.storeWasm(
      NeutronContract.IBC_TRANSFER,
    );
    expect(contractCodeId).toBeGreaterThan(0);
    contractAddressForAdminMigration = await neutronAccount.instantiateContract(
      contractCodeId,
      {},
      'ibc_transfer',
      mainDao.contracts.core.address,
    );
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
      contractAddress = await neutronAccount.instantiateContract(
        codeId,
        {},
        'msg_receiver',
      );
    });
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('10000');
      await neutronChain.getWithAttempts(
        async () =>
          await mainDao.queryVotingPower(daoMember1.user.wallet.address),
        async (response) => response.power == 10000,
        20,
      );
    });
    test('bond from wallet 2', async () => {
      await daoMember2.bondFunds('10000');
      await neutronChain.getWithAttempts(
        async () =>
          await mainDao.queryVotingPower(daoMember1.user.wallet.address),
        async (response) => response.power == 10000,
        20,
      );
    });
    test('bond from wallet 3 ', async () => {
      await daoMember3.bondFunds('10000');
      await neutronChain.getWithAttempts(
        async () =>
          await mainDao.queryVotingPower(daoMember1.user.wallet.address),
        async (response) => response.power == 10000,
        20,
      );
    });
    test('check voting power', async () => {
      await neutronChain.getWithAttempts(
        async () => await mainDao.queryTotalVotingPower(),
        // 3x10000 + 1000 from investors vault (see neutron/network/init-neutrond.sh)
        async (response) => response.power == 31000,
        20,
      );
    });
  });

  describe('send a bit funds to core contracts', () => {
    test('send funds from wallet 1', async () => {
      const res = await daoMember1.user.msgSend(
        mainDao.contracts.core.address,
        '1000',
      );
      expect(res.code).toEqual(0);
    });
  });

  describe('create several proposals', () => {
    test('create proposal #1, will be rejected', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitParameterChangeProposal(
        chainManagerAddress,
        'Proposal #1',
        'Param change proposal. This one will pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000',
      );
    });

    test('create proposal #2, will be rejected', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitParameterChangeProposal(
        chainManagerAddress,
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
            recipient: mainDao.contracts.core.address,
            amount: 1000,
            denom: neutronChain.denom,
          },
        ],
        '1000',
      );
    });

    test('create proposal #4, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitSoftwareUpgradeProposal(
        chainManagerAddress,
        'Proposal #4',
        'Software upgrade proposal. Will pass',
        'Plan #1',
        100000,
        'Plan info',
        '1000',
      );
    });

    test('create proposal #5, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitCancelSoftwareUpgradeProposal(
        chainManagerAddress,
        'Proposal #5',
        'Software upgrade proposal. Will pass',
        '1000',
      );
    });

    test('create proposal #6, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitRecoverIBCClient(
        chainManagerAddress,
        'Proposal #6',
        'UpdateClient proposal. Will pass',
        '07-tendermint-2',
        '07-tendermint-1',
      );
    });

    test('create proposal #7, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitPinCodesProposal(
        chainManagerAddress,
        'Proposal #7',
        'Pin codes proposal. Will pass',
        [1, 2],
        '1000',
      );
    });

    test('create proposal #8, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitUnpinCodesProposal(
        chainManagerAddress,
        'Proposal #8',
        'Unpin codes proposal. Will pass',
        [1, 2],
        '1000',
      );
    });

    test('create proposal #9, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitUpdateAdminProposal(
        chainManagerAddress,
        'Proposal #9',
        'Update admin proposal. Will pass',
        ADMIN_MODULE_ADDRESS,
        contractAddressForAdminMigration,
        daoMember1.user.wallet.address,
        '1000',
      );
    });

    test('create proposal #10, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitClearAdminProposal(
        chainManagerAddress,
        'Proposal #10',
        'Clear admin proposal. Will pass',
        ADMIN_MODULE_ADDRESS,
        contractAddressForAdminMigration,
        '1000',
      );
    });

    // add schedule with valid message format
    test('create proposal #11, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitAddSchedule(
        chainManagerAddress,
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
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitRemoveSchedule(
        chainManagerAddress,
        'Proposal #12',
        '',
        '1000',
        'proposal11',
      );
    });

    // add schedule with 3 messages, first returns error, second in incorrect format, third is valid
    test('create proposal #13, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitAddSchedule(
        chainManagerAddress,
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
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitAddSchedule(
        chainManagerAddress,
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

    test('create proposal #15, will pass', async () => {
      for (let i = 0; i < 40; i++)
        await neutronAccount.storeWasm(NeutronContract.RESERVE);
      const codeids = Array.from({ length: 40 }, (_, i) => i + 1);
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitPinCodesProposal(
        chainManagerAddress,
        'Proposal #15',
        'Pin codes proposal. Will pass',
        codeids,
        '1000',
      );
    });

    test('create proposal #16, will be rejected', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitParameterChangeProposal(
        chainManagerAddress,
        'Proposal #16',
        'Param change proposal. This one will not pass',
        'icahost',
        'HostEnabled',
        'false',
        '1000',
      );
    });

    test('create proposal #17, will be rejected', async () => {
      await daoMember1.submitUpgradeProposal(
        'Proposal #17',
        'Param change proposal. This one will not pass',
        'icahost',
        10000,
        'false',
        '1000',
      );
    });

    test('create proposal #18, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitPinCodesCustomAuthorityProposal(
        chainManagerAddress,
        'Proposal #18',
        'Pin codes proposal with wrong authority. This one will pass & fail on execution',
        [1, 2],
        '1000',
        daoMember1.user.wallet.address,
      );
    });

    test('create proposal #19, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitBankSendProposal(
        chainManagerAddress,
        'Proposal #19',
        'Submit bank send proposal. This one will pass & fail on execution due type is not whitelisted',
        '1000',
      );
    });

    test('create multi-choice proposal #1, will be picked choice 1', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitMultiChoiceParameterChangeProposal(
        chainManagerAddress,
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

    test('create proposal #20, will pass', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitUpdateParamsInterchaintxsProposal(
        chainManagerAddress,
        'Proposal #20',
        'Update interchaintxs params',
        updateInterchaintxsParamsProposal({
          msg_submit_tx_max_messages: 11,
        }),
        '1000',
      );
    });

    test('create multi-choice proposal #2, will be rejected', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await daoMember1.submitMultiChoiceParameterChangeProposal(
        chainManagerAddress,
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

  describe('vote for proposal #1 (no, yes, no)', () => {
    const proposalId = 1;
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

  describe('execute proposal #1', () => {
    test('check if proposal is rejected', async () => {
      const proposalId = 1;
      let rawLog: any;
      try {
        rawLog = JSON.stringify(
          (await daoMember1.executeProposal(proposalId)).rawLog,
        );
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await neutronChain.getWithAttempts(
        async () => await mainDao.queryProposal(proposalId),
        async (response) => response.proposal.status === 'rejected',
        20,
      );
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
        rawLog = JSON.stringify(
          (await daoMember1.executeProposal(proposalId)).rawLog,
        );
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes("proposal is not in 'passed' state"));
      await neutronChain.getWithAttempts(
        async () => await mainDao.queryProposal(proposalId),
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
      await mainDao.checkPassedProposal(proposalId);
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
      await mainDao.checkPassedMultiChoiceProposal(proposalId);
    });
    test('execute passed proposal, should fail on neutron side', async () => {
      let rawLog: any;
      try {
        rawLog = (await daoMember1.executeMultiChoiceProposal(proposalId))
          .raw_log;
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes('proposal content is not whitelisted'));
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
      await neutronChain.getWithAttempts(
        async () => await mainDao.queryMultiChoiceProposal(proposalId),
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
      await mainDao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('check state change from proposal #4 execution', () => {
    test('check if software current plan was created', async () => {
      const currentPlan = await neutronChain.queryCurrentUpgradePlan();
      expect(currentPlan.plan?.height).toEqual('100000');
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
      await mainDao.checkPassedProposal(proposalId);
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
    test('check client statuses before update', async () => {
      expect(
        (await neutronChain.getIBCClientStatus('07-tendermint-2')).status,
      ).toBe('Expired');
      expect(
        (await neutronChain.getIBCClientStatus('07-tendermint-1')).status,
      ).toBe('Active');
    });

    const proposalId = 6;
    test('check if proposal is passed', async () => {
      await mainDao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposal(proposalId);
    });

    test('check client statuses after update', async () => {
      expect(
        (await neutronChain.getIBCClientStatus('07-tendermint-2')).status,
      ).toBe('Active');
      expect(
        (await neutronChain.getIBCClientStatus('07-tendermint-1')).status,
      ).toBe('Active');
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
      await mainDao.checkPassedProposal(proposalId);
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
      await mainDao.checkPassedProposal(proposalId);
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
      await mainDao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check that admin was changed', async () => {
      const admin = await neutronChain.queryContractAdmin(
        contractAddressForAdminMigration,
      );
      expect(admin).toEqual(daoMember1.user.wallet.address);
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
      await mainDao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check that admin was changed', async () => {
      const admin = await neutronChain.queryContractAdmin(
        contractAddressForAdminMigration,
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
      await mainDao.checkPassedProposal(proposalId);
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
      await neutronChain.waitBlocks(15);
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

      await neutronChain.waitBlocks(10);
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
    test('check that schedule exists before removing', async () => {
      const res = await neutronChain.querySchedules();
      expect(res.schedules.length).toEqual(1);
    });
    test('check if proposal is passed', async () => {
      await mainDao.checkPassedProposal(proposalId);
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
      await mainDao.checkPassedProposal(proposalId);
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
      await neutronChain.waitBlocks(15);
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
      await mainDao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('vote for proposal #15 (no, yes, yes)', () => {
    const proposalId = 15;
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

  describe('execute proposal #15', () => {
    const proposalId = 15;
    test('check if proposal is passed', async () => {
      await mainDao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
  });

  describe('vote for proposal #16 with unbonded funds(no, yes, yes)', () => {
    const proposalId = 16;
    test('vote NO from wallet 1 with unbonded funds', async () => {
      await daoMember1.unbondFunds('1000');
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2 with unbonded funds', async () => {
      await daoMember2.unbondFunds('1000');
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3 with unbonded funds', async () => {
      await daoMember3.unbondFunds('1000');
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('try to execute proposal #16', () => {
    test('check if proposal is failed', async () => {
      const proposalId = 16;
      let rawLog: any;
      try {
        rawLog = JSON.stringify(
          (await daoMember1.executeProposal(proposalId)).rawLog,
        );
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes('proposal content is not whitelisted'));
    });
  });

  describe('check that schedule was added and executed later', () => {
    test('check that schedule was added', async () => {
      const res = await neutronChain.querySchedules();
      expect(res.schedules.length).toEqual(2);
    });

    test('check that first msg from schedule was not committed because there was error in the last msg', async () => {
      await neutronChain.waitBlocks(15);
      const queryResult = await neutronChain.queryContract<TestArgResponse>(
        contractAddress,
        {
          test_msg: { arg: 'correct_msg' },
        },
      );

      expect(queryResult).toEqual(null);
    });
  });

  describe('vote for proposal #18 (no, yes, yes)', () => {
    const proposalId = 18;
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

  describe('execute proposal #18', () => {
    const proposalId = 18;
    test('check if proposal is passed', async () => {
      await mainDao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal, should fail', async () => {
      let rawLog: any;
      try {
        rawLog = JSON.stringify(
          (await daoMember1.executeProposal(proposalId)).rawLog,
        );
      } catch (e) {
        rawLog = e.message;
      }
      expect(
        rawLog.includes(
          'authority in incoming msg is not equal to admin module',
        ),
      );
    });
  });

  describe('vote for proposal #19 (no, yes, yes)', () => {
    const proposalId = 19;
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

  describe('execute proposal #19', () => {
    const proposalId = 19;
    test('check if proposal is passed', async () => {
      await mainDao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal, should fail', async () => {
      let rawLog: any;
      try {
        rawLog = JSON.stringify(
          (await daoMember1.executeProposal(proposalId)).rawLog,
        );
      } catch (e) {
        rawLog = e.message;
      }
      expect(rawLog.includes('sdk.Msg is not whitelisted')).toBeTruthy();
    });
  });

  describe('vote for proposal #20 with unbonded funds(no, yes, yes)', () => {
    const proposalId = 20;
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

  describe('try to execute proposal #20', () => {
    const proposalId = 20;
    test('check if proposal is passed', async () => {
      await mainDao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
      const paramAfter = await neutronChain.queryMaxTxsAllowed();
      expect(paramAfter).toEqual('11');
    });
  });

  describe('check that only admin can create valid proposals', () => {
    test('submit admin proposal from non-admin addr, should fail', async () => {
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
