import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { getWithAttempts } from '../../helpers/wait';
import { NeutronContract } from '../../helpers/types';
import { DaoContracts, getDaoContracts } from '../../helpers/dao';
import { cosmwasmproto } from '@cosmos-client/cosmwasm';

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

  let hooksIbcTransferContractAddress: string;

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
  });

  describe('Contracts', () => {
    let codeId: string;
    test('store contract', async () => {
      codeId = await cm.storeWasm(NeutronContract.HOOK_IBC_TRANSFER);
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await cm.instantiate(codeId, '{}', 'hook_ibc_transfer');
      hooksIbcTransferContractAddress = res[0]._contract_address;
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
        daoContracts.core.address,
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
        'Proposal #4',
        'Software upgrade proposal. Will pass',
        '1000',
      );
    });

    test('create proposal #6, will pass', async () => {
      const msg = '{"test_msg": {"return_err": false, "arg": "test"}}';
      await cm.submitAddSchedule(
        preProposeContractAddress,
        'Proposal #11',
        '',
        '1000',
        'everytime',
        5,
        [
          new cosmwasmproto.cosmwasm.wasm.v1.MsgExecuteContract({
            sender: testState.wallets.neutron.demo1.address.toString(),
            contract: hooksIbcTransferContractAddress,
            msg: Buffer.from(msg),
            funds: [],
          }),
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

  describe('vote for proposal #6 (no, yes, yes)', () => {
    const proposalId = 6;
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

  describe('execute proposal #6', () => {
    const proposalId = 6;
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
    test('check that msg from schedule was executed', async () => {
      await cm.blockWaiter.waitBlocks(15);
      const queryResult = await cm.queryContract<{
        sender: string | null;
        funds: { denom: string; amount: string }[];
      }>(hooksIbcTransferContractAddress, {
        test_msg: { arg: 'test' },
      });

      expect(queryResult.sender).toEqual(
        testState.wallets.neutron.demo1.address.toString(),
      );
      expect(queryResult.funds).toEqual([]);
    });

    // TODO
    // test('check that msg was executed')
  });

  // schedule was added with invalid message
  // schedule was removed
  // schedule was removed from security dao (Optional)
});
