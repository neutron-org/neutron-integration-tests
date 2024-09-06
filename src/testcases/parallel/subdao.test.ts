import { RunnerTestSuite, inject } from 'vitest';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@neutron-org/neutronjsplus';
import { createBankSendMessage } from '@neutron-org/neutronjsplus/dist/cosmos';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { Dao, DaoMember } from '@neutron-org/neutronjsplus/dist/dao';
import { SingleChoiceProposal } from '@neutron-org/neutronjsplus/dist/types';
import { IndexedTx } from '@cosmjs/cosmwasm-stargate';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import {
  paramChangeProposal,
  sendProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';
import { deployNeutronDao, setupSubDaoTimelockSet } from '../../helpers/dao';
import { LocalState } from '../../helpers/local_state';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import { Wallet } from '../../helpers/wallet';
import { TimelockConfig } from '@neutron-org/neutronjsplus/dist/dao_types';
import config from '../../config.json';

describe('Neutron / Subdao', () => {
  let testState: LocalState;
  let neutronWallet1: Wallet;
  let neutronWallet2: Wallet;
  let neutronClient1: SigningNeutronClient;
  let neutronClient2: SigningNeutronClient;
  let subdaoMember1: DaoMember;
  let subdaoMember2: DaoMember;
  let mainDaoMember: DaoMember;
  let securityDaoWallet: Wallet;
  let demo1Addr: string;
  let securityDaoAddr: string;
  let demo2Addr: string;
  let subDao: Dao;
  let mainDao: Dao;
  let adminQuery: AdminQueryClient;
  let chainManagerAddress;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    neutronWallet1 = await testState.nextWallet('neutron');
    securityDaoWallet = await testState.nextWallet('neutron');
    neutronWallet2 = await testState.nextWallet('neutron');
    demo1Addr = neutronWallet1.address;
    demo2Addr = neutronWallet2.address;
    securityDaoAddr = securityDaoWallet.address;
    neutronClient1 = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet1.directwallet,
      neutronWallet1.address,
    );
    neutronClient2 = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet2.directwallet,
      neutronWallet2.address,
    );

    const daoContracts = await deployNeutronDao(
      neutronWallet1.address,
      neutronClient1,
    );
    mainDao = new Dao(neutronClient1, daoContracts);
    mainDaoMember = new DaoMember(
      mainDao,
      neutronClient1.client,
      neutronWallet1.address,
      NEUTRON_DENOM,
    );
    await mainDaoMember.bondFunds('10000');

    subDao = await setupSubDaoTimelockSet(
      neutronWallet1.address,
      neutronClient1,
      mainDao.contracts.core.address,
      securityDaoAddr,
      true,
    );

    subdaoMember1 = new DaoMember(
      subDao,
      neutronClient1.client,
      neutronWallet1.address,
      NEUTRON_DENOM,
    );
    subdaoMember2 = new DaoMember(
      subDao,
      neutronClient2.client,
      neutronWallet2.address,
      NEUTRON_DENOM,
    );

    adminQuery = new AdminQueryClient(await testState.rpcClient('neutron'));
    chainManagerAddress = (await adminQuery.admins()).admins[0];

    const subDaosList = await mainDao.getSubDaoList();
    expect(subDaosList).toContain(subDao.contracts.core.address);

    const votingPower = await subdaoMember1.queryVotingPower();
    expect(votingPower.power).toEqual('1');
  });

  describe('Timelock: Unauthorized', () => {
    test('Unauthorized timelock', async () => {
      await expect(
        neutronClient1.execute(
          subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
          {
            timelock_proposal: {
              proposal_id: 1,
              msgs: [],
            },
          },
        ),
      ).rejects.toThrow(/Unauthorized/);
    });
  });

  describe('Timelock: failed execution', () => {
    let proposalId: number;
    test('proposal timelock', async () => {
      proposalId = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: demo2Addr,
          amount: 2000,
          denom: NEUTRON_DENOM,
        },
      ]);

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked: nonexistent', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(1_000_000),
      ).rejects.toThrow(/not found: execute wasm contract failed/);
    });

    test('execute timelocked: timelock_duration have not pass', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId),
      ).rejects.toThrow(/Proposal is timelocked/);
    });

    test('execute timelocked: execution failed', async () => {
      //wait for timelock durations
      await waitSeconds(20);
      // timelocked proposal execution failed due to insufficient funds on timelock contract
      await subdaoMember1.executeTimelockedProposal(proposalId);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('execution_failed');
      expect(timelockedProp.msgs).toHaveLength(1);

      const error = await subDao.getTimelockedProposalError(proposalId);
      expect(error).toEqual('codespace: sdk, code: 5'); // 'insufficient funds' error
    });

    test('execute timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
    });

    let proposalId2: number;
    test('proposal timelock 2 with two messages, one of them fails', async () => {
      // pack two messages in one proposal
      const failMessage = paramChangeProposal(
        {
          title: 'paramchange',
          description: 'paramchange',
          subspace: 'icahost',
          key: 'HostEnabled',
          value: '123123123', // expected boolean, provided number
        },
        chainManagerAddress,
      );
      const goodMessage = sendProposal({
        to: neutronWallet2.address,
        denom: NEUTRON_DENOM,
        amount: '100',
      });
      const fee = {
        gas: '4000000',
        amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
      };
      proposalId2 = await subdaoMember1.submitSingleChoiceProposal(
        'proposal2',
        'proposal2',
        [goodMessage, failMessage],
        '1000',
        'single',
        fee,
      );

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId2,
      );

      expect(timelockedProp.id).toEqual(proposalId2);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked 2: execution failed', async () => {
      await neutronClient1.sendTokens(
        subDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '100000' }],
        {
          gas: '4000000',
          amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
        },
      ); // fund the subdao treasury
      const balance2 = await neutronClient2.getBalance(
        neutronWallet2.address,
        NEUTRON_DENOM,
      );

      //wait for timelock durations
      await waitSeconds(20);
      // timelocked proposal execution failed due to invalid param value
      await subdaoMember1.executeTimelockedProposal(proposalId2);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId2);
      expect(timelockedProp.id).toEqual(proposalId2);
      expect(timelockedProp.status).toEqual('execution_failed');
      expect(timelockedProp.msgs).toHaveLength(1);

      // check that goodMessage failed as well
      const balance2After = await neutronClient2.getBalance(
        neutronWallet2.address,
        NEUTRON_DENOM,
      );
      expect(balance2After).toEqual(balance2);

      // cannot execute failed proposal with closeOnProposalExecutionFailed=true
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId2),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
      await neutronClient1.waitBlocks(2);
    });

    test('change subdao proposal config with closeOnProposalExecutionFailed = false', async () => {
      const subdaoConfig = await neutronClient1.queryContractSmart(
        subDao.contracts.proposals.single.address,
        {
          config: {},
        },
      );
      expect(subdaoConfig.close_proposal_on_execution_failure).toEqual(true);
      subdaoConfig.close_proposal_on_execution_failure = false;

      const proposalId = await subdaoMember1.submitUpdateConfigProposal(
        'updateconfig',
        'updateconfig',
        subdaoConfig,
        '1000',
      );
      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );
      expect(timelockedProp.status).toEqual('timelocked');
      //wait for timelock durations
      await waitSeconds(20);
      await subdaoMember1.executeTimelockedProposal(proposalId); // should execute no problem

      await neutronClient1.waitBlocks(2);

      const subdaoConfigAfter = await neutronClient1.queryContractSmart(
        subDao.contracts.proposals.single.address,
        {
          config: {},
        },
      );
      expect(subdaoConfigAfter.close_proposal_on_execution_failure).toEqual(
        false,
      );
    });

    let proposalId3: number;
    test('proposal timelock 3 with not enough funds initially to resubmit later', async () => {
      proposalId3 = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: demo2Addr,
          amount: 200000,
          denom: NEUTRON_DENOM,
        },
      ]);

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId3,
      );

      expect(timelockedProp.id).toEqual(proposalId3);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked 3: execution failed at first and then successful after funds sent', async () => {
      const subdaoConfig = await neutronClient1.queryContractSmart(
        subDao.contracts.proposals.single.address,
        {
          config: {},
        },
      );
      expect(subdaoConfig.close_proposal_on_execution_failure).toEqual(false);

      //wait for timelock durations
      await waitSeconds(20);
      // timelocked proposal execution failed due to insufficient funds
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId3),
      ).rejects.toThrow(/insufficient funds/);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId3);
      expect(timelockedProp.id).toEqual(proposalId3);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);

      const error = await subDao.getTimelockedProposalError(proposalId3);
      // do not have an error because we did not have reply
      expect(error).toEqual(null);

      await neutronClient1.sendTokens(
        subDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '300000' }],
        {
          gas: '4000000',
          amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
        },
      );

      // now that we have funds should execute without problems

      const balanceBefore = await neutronClient1.getBalance(
        demo2Addr,
        NEUTRON_DENOM,
      );
      await subdaoMember1.executeTimelockedProposal(proposalId3);
      await neutronClient1.waitBlocks(2);
      const balanceAfter = await neutronClient1.getBalance(
        demo2Addr,
        NEUTRON_DENOM,
      );

      expect(+balanceAfter.amount - +balanceBefore.amount).toEqual(200000);
    });
  });

  describe('Timelock: Succeed execution', () => {
    let proposalId: number;
    beforeAll(async () => {
      const coinsForDemo2 = 2000;
      proposalId = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: neutronWallet2.address,
          amount: coinsForDemo2,
          denom: NEUTRON_DENOM,
        },
      ]);

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked: success', async () => {
      await neutronClient1.sendTokens(
        subDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '20000' }],
        {
          gas: '4000000',
          amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
        },
      ); // fund the subdao treasury
      const balance2 = await neutronClient2.getBalance(
        neutronWallet2.address,
        NEUTRON_DENOM,
      );
      await waitSeconds(20);
      await subdaoMember1.executeTimelockedProposal(proposalId);
      const balance2After = await neutronClient2.getBalance(
        neutronWallet2.address,
        NEUTRON_DENOM,
      );
      expect(+balance2After.amount).toEqual(+balance2.amount + 2000);

      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked(Executed): WrongStatus error', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId),
      ).rejects.toThrow(/Wrong proposal status \(executed\)/);
    });

    test('overrule timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        overruleTimelockedProposalMock(
          neutronClient1,
          subdaoMember1,
          proposalId,
        ),
      ).rejects.toThrow(/Wrong proposal status \(executed\)/);
    });
  });

  describe('Overrule timelocked', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: demo2Addr,
          amount: 2000,
          denom: NEUTRON_DENOM,
        },
      ]);

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('overrule timelocked(Timelocked): Unauthorized', async () => {
      await expect(
        overruleTimelockedProposalMock(
          neutronClient2,
          subdaoMember2,
          proposalId,
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('overrule timelocked(Timelocked): Success', async () => {
      await overruleTimelockedProposalMock(
        neutronClient1,
        subdaoMember1,
        proposalId,
      );
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('overruled');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked(Overruled): WrongStatus error', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId),
      ).rejects.toThrow(/Wrong proposal status \(overruled\)/);
    });
  });

  describe('Timelock2: Succeed execution', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitUpdateSubDaoConfigProposal(
        {
          name: 'dao name after timelock2',
        },
        'single2',
      );

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
        'single2',
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked: success', async () => {
      await waitSeconds(20);
      await subdaoMember1.executeTimelockedProposal(proposalId, 'single2');

      const timelockedProp = await subDao.getTimelockedProposal(
        proposalId,
        'single2',
      );
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);
    });
  });

  describe('Overrule timelocked2', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitUpdateSubDaoConfigProposal(
        {
          name: 'dao name after timelock2',
        },
        'single2',
      );

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
        'single2',
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('overrule timelocked(Timelocked): Success', async () => {
      await overruleTimelockedProposalMock(
        neutronClient1,
        subdaoMember1,
        proposalId,
        'single2',
      );
      const timelockedProp = await subDao.getTimelockedProposal(
        proposalId,
        'single2',
      );
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('overruled');
      expect(timelockedProp.msgs).toHaveLength(1);
    });
  });

  describe('Timelock3: Closed overruled proposal should not prevent execution', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitUpdateSubDaoConfigProposal(
        {
          name: 'dao name after timelock3',
        },
        'single2',
      );

      // move proposal to the timelocked state where it can be overruled
      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
        'single2',
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('close rejected overrule proposal', async () => {
      const overruleProposalId = await mainDao.getOverruleProposalId(
        subDao.contracts.proposals.single2.pre_propose.timelock!.address,
        proposalId,
      );

      // wait 20 seconds
      await waitSeconds(20);

      const propOverruledTest = await neutronClient1.queryContractSmart(
        mainDaoMember.dao.contracts.proposals.overrule?.address,
        {
          proposal: {
            proposal_id: overruleProposalId,
          },
        },
      );
      expect(propOverruledTest.proposal.status).toEqual('rejected');

      await neutronClient1.execute(
        mainDaoMember.dao.contracts.proposals.overrule.address,
        {
          close: { proposal_id: overruleProposalId },
        },
      );

      const propOverruledTest2 = await neutronClient1.getWithAttempts(
        async () =>
          await neutronClient1.queryContractWithWait<SingleChoiceProposal>(
            mainDaoMember.dao.contracts.proposals.overrule?.address,
            {
              proposal: {
                proposal_id: overruleProposalId,
              },
            },
          ),
        async (p) => p.proposal.status === 'closed',
        5,
      );

      expect(propOverruledTest2.proposal.status).toEqual('closed');
    });

    test('execute timelocked: success', async () => {
      await waitSeconds(20);
      await subdaoMember1.executeTimelockedProposal(proposalId, 'single2');

      const timelockedProp = await subDao.getTimelockedProposal(
        proposalId,
        'single2',
      );
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);
    });
  });

  describe('Non-timelock typed duration pause proposal: Succeed creation', () => {
    let proposalId: number;

    test('Non-timelock pause proposal: Succeed creation', async () => {
      const pauseInfo = await mainDao.queryPausedInfo(
        subDao.contracts.core.address,
      );
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);

      proposalId = await subdaoMember1.submitTypedPauseProposal(
        mainDao.contracts.core.address,
        10,
        'single_nt_pause',
      );
      await subdaoMember1.voteYes(proposalId, 'single_nt_pause');
      await expect(
        subdaoMember1.executeProposal(proposalId, 'single_nt_pause'),
      ).rejects.toThrow(/Unauthorized/);

      const p = await subDao.queryProposal(proposalId, 'single_nt_pause');
      expect(p.proposal.status).toEqual('passed');
    });
  });

  describe('Non-timelock pause proposal, untyped duration: Succeed creation', () => {
    let proposalId: number;
    test('Non-timelock pause proposal: Succeed execution', async () => {
      const pauseInfo = await mainDao.queryPausedInfo(
        subDao.contracts.core.address,
      );
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);

      proposalId = await subdaoMember1.submitUntypedPauseProposal(
        subDao.contracts.core.address,
        10,
        'single_nt_pause',
      );
      await subdaoMember1.voteYes(proposalId, 'single_nt_pause');
      // Unauthorized here means that execute message is right, so pre-propose module works fine
      await expect(
        subdaoMember1.executeProposal(proposalId, 'single_nt_pause'),
      ).rejects.toThrow(/Unauthorized/);
    });
  });

  describe('Non-timelock pause pre-propose proposal: Failed creation', () => {
    test('Non-timelock pause pre-propose module: non-pause msg failed creation', async () => {
      const newDaoName = 'dao name after non-timelock';

      await expect(
        subdaoMember1.submitUpdateSubDaoConfigProposal(
          {
            name: newDaoName,
          },
          'single_nt_pause',
        ),
      ).rejects.toThrow(/Proposal is malformed/);
    });
  });

  describe('Non-timelock schedule proposal: Succeed creation', () => {
    let proposalId: number;

    test('Non-timelock schedule proposal: Succeed creation', async () => {
      proposalId = await subdaoMember1.submitRemoveSchedule(
        chainManagerAddress,
        'Proposal #12',
        '',
        '1000',
        {
          name: 'proposal11',
        },
        'single_nt_pause',
        true,
      );
      await subdaoMember1.voteYes(proposalId, 'single_nt_pause');

      await expect(
        subdaoMember1.executeProposal(proposalId, 'single_nt_pause'),
      ).rejects.toThrow(/only admin or security dao can remove schedule/);

      const p = await subDao.queryProposal(proposalId, 'single_nt_pause');
      expect(p.proposal.status).toEqual('passed');
    });
  });

  describe('Non-timelock pause proposal w funds attached: Failed creation', () => {
    test('Non-timelock pause proposal w funds attached : failed creation', async () => {
      await expect(
        subdaoMember1.submitUntypedPauseProposalWFunds(
          mainDao.contracts.core.address,
          10,
          'single_nt_pause',
          NEUTRON_DENOM,
        ),
      ).rejects.toThrow(/Proposal is malformed/);
    });
  });

  describe('Update members', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitUpdateSubDaoMultisigParticipants([
        subdaoMember2.user,
      ]);

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('update members: success', async () => {
      await waitSeconds(20);
      const votingPowerBefore = await subdaoMember2.queryVotingPower();
      expect(votingPowerBefore.power).toEqual('0');
      const res = await subdaoMember1.executeTimelockedProposal(proposalId);
      const resTx = await neutronClient1.getTx(res.transactionHash);
      expect(resTx.code).toEqual(0);
      await neutronClient1.waitBlocks(1);
      const votingPowerAfter = await subdaoMember2.queryVotingPower();
      expect(votingPowerAfter.power).toEqual('1');

      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);
    });
  });

  describe('execution control', () => {
    const funding = 1000;
    let proposalId: number;
    test('create a proposal to fund security DAO', async () => {
      proposalId = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: securityDaoAddr,
          amount: funding,
          denom: NEUTRON_DENOM,
        },
      ]);

      await subdaoMember1.voteYes(proposalId);
      await subDao.checkPassedProposal(proposalId);
    });
    test('pause subDAO', async () => {
      let pauseInfo = await mainDao.queryPausedInfo(
        subDao.contracts.core.address,
      );
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);

      // pause subDAO on behalf of the security DAO
      const pauseHeight = await neutronClient1.getHeight(); // an approximate one
      const res = await neutronClient1.execute(subDao.contracts.core.address, {
        pause: {
          duration: 50,
        },
      });
      expect(res.code).toEqual(0);

      // check contract's pause info after pausing
      pauseInfo = await mainDao.queryPausedInfo(subDao.contracts.core.address);
      expect(pauseInfo.unpaused).toEqual(undefined);
      expect(pauseInfo.paused.until_height).toBeGreaterThan(pauseHeight);
    });
    test('execute proposal when subDAO is paused', async () => {
      await expect(
        subdaoMember1.executeProposalWithAttempts(proposalId),
      ).rejects.toThrow(/Contract execution is paused/);
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId),
      ).rejects.toThrow(/not found: execute wasm contract failed/);
    });
    test('unpause subDAO', async () => {
      // unpause subDAO on behalf of the main DAO
      const res = await neutronClient1.execute(subDao.contracts.core.address, {
        unpause: {},
      });
      expect(res.code).toEqual(0);

      // check contract's pause info after unpausing
      const pauseInfo = await mainDao.queryPausedInfo(
        subDao.contracts.core.address,
      );
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);
    });
    test('execute proposal when subDAO is unpaused', async () => {
      await neutronClient1.sendTokens(
        subDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '10000' }],
        {
          gas: '4000000',
          amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
        },
      );
      const beforeExecBalance = await neutronClient1.getBalance(
        securityDaoAddr,
        NEUTRON_DENOM,
      );
      await subdaoMember1.executeProposalWithAttempts(proposalId);

      await waitSeconds(20); // wait until timelock duration passes
      await subdaoMember1.executeTimelockedProposal(proposalId);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);

      const afterExecBalance = await neutronClient1.getBalance(
        securityDaoAddr,
        NEUTRON_DENOM,
      );
      expect(+afterExecBalance.amount).toEqual(
        +beforeExecBalance.amount + funding,
      );
    });

    test('auto unpause on pause timeout', async () => {
      // pause subDAO on behalf of the Neutron DAO
      const shortPauseDuration = 5;
      const pauseHeight = await neutronClient1.getHeight(); // an approximate one
      const res = await neutronClient1.execute(subDao.contracts.core.address, {
        pause: {
          duration: shortPauseDuration,
        },
      });
      expect(res.code).toEqual(0);

      // check contract's pause info after pausing
      let pauseInfo = await mainDao.queryPausedInfo(
        subDao.contracts.core.address,
      );
      expect(pauseInfo.unpaused).toEqual(undefined);
      expect(pauseInfo.paused.until_height).toBeGreaterThan(pauseHeight);

      // wait and check contract's pause info after unpausing
      await neutronClient1.waitBlocks(shortPauseDuration);
      pauseInfo = await mainDao.queryPausedInfo(subDao.contracts.core.address);
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);
    });
  });

  describe('Timelock: Update config', () => {
    afterAll(async () => {
      // return to the starting timelock_duration
      await neutronClient1.execute(
        subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
        {
          update_config: {
            timelock_duration: 20,
          },
        },
      );
    });

    test('Update config: Unauthorized', async () => {
      await expect(
        neutronClient2.execute(
          subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
          {
            update_config: {},
          },
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: Incorrect owner address format', async () => {
      await expect(
        neutronClient1.execute(
          subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
          {
            update_config: {
              owner: 'owner',
            },
          },
        ),
      ).rejects.toThrow(
        /addr_validate errored: decoding bech32 failed: invalid bech32/,
      );

      await expect(
        neutronClient1.execute(
          subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
          {
            update_config: {
              owner: 'cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw',
            },
          },
        ),
      ).rejects.toThrow(
        /addr_validate errored: invalid Bech32 prefix; expected neutron, got cosmos/,
      );
    });

    test('Update config: owner success', async () => {
      await neutronClient1.execute(
        subDao.contracts.proposals.single.pre_propose.timelock!.address,
        {
          update_config: {
            owner: demo2Addr,
          },
        },
      );

      const expectedConfig: TimelockConfig = {
        owner: demo2Addr,
        overrule_pre_propose:
          mainDao.contracts.proposals.overrule.pre_propose.address,
        subdao: subDao.contracts.core.address,
      };

      const c = await neutronClient1.queryContractSmart(
        subDao.contracts.proposals.single.pre_propose.timelock!.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });

    test('Update config: old owner lost update rights', async () => {
      await expect(
        neutronClient1.execute(
          subDao.contracts.proposals.single.pre_propose.timelock!.address,
          {
            update_config: {},
          },
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: update both params with new owner', async () => {
      await neutronClient2.execute(
        subDao.contracts.proposals.single.pre_propose.timelock!.address,
        {
          update_config: {
            owner: demo1Addr,
          },
        },
      );

      const expectedConfig: TimelockConfig = {
        owner: demo1Addr,
        subdao: subDao.contracts.core.address,
        overrule_pre_propose:
          mainDao.contracts.proposals.overrule.pre_propose.address,
      };

      const c = await neutronClient1.queryContractSmart(
        subDao.contracts.proposals.single.pre_propose.timelock!.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });
  });

  describe('Query Proposals', () => {
    let subDAOQueryTestScope: Dao;
    let subDAOQueryTestScopeMember: DaoMember;
    beforeAll(async () => {
      subDAOQueryTestScope = await setupSubDaoTimelockSet(
        neutronWallet1.address,
        neutronClient1,
        mainDao.contracts.core.address,
        demo1Addr,
        true,
      );
      subDAOQueryTestScopeMember = new DaoMember(
        subDAOQueryTestScope,
        neutronClient1.client,
        neutronWallet1.address,
        NEUTRON_DENOM,
      );

      for (let i = 1; i <= 35; i++) {
        const proposalId =
          await subDAOQueryTestScopeMember.submitSingleChoiceProposal(
            `Proposal ${i}`,
            `proposal ${i} description`,
            [
              createBankSendMessage(demo1Addr, 1000, NEUTRON_DENOM),
              createBankSendMessage(demo2Addr, 2000, NEUTRON_DENOM),
            ],
          );

        await subDAOQueryTestScopeMember.supportAndExecuteProposal(proposalId);
      }
    });

    test('Query proposals', async () => {
      const proposals = await neutronClient1.queryContractSmart(
        subDAOQueryTestScope.contracts.proposals.single.pre_propose.timelock!
          .address,
        {
          list_proposals: {
            start_after: 10,
            limit: 10,
          },
        },
      );
      expect(proposals.proposals[0].id).toEqual(11);
      expect(proposals.proposals).toHaveLength(10);
      expect(proposals.proposals[9].id).toEqual(20);
    });

    test('Query proposals: no params', async () => {
      const proposals = await neutronClient1.queryContractSmart(
        subDAOQueryTestScope.contracts.proposals.single.pre_propose.timelock!
          .address,
        {
          list_proposals: {},
        },
      );

      expect(proposals.proposals[0].id).toEqual(1);
      expect(proposals.proposals).toHaveLength(30);
      expect(proposals.proposals[29].id).toEqual(30);
    });

    test('Query proposals: no params', async () => {
      const proposals = await neutronClient1.queryContractSmart(
        subDAOQueryTestScope.contracts.proposals.single.pre_propose.timelock!
          .address,
        {
          list_proposals: {
            start_after: 30,
          },
        },
      );

      expect(proposals.proposals[0].id).toEqual(31);
      expect(proposals.proposals).toHaveLength(5);
      expect(proposals.proposals[4].id).toEqual(35);
    });

    test('Query proposals: limit 100', async () => {
      const proposals = await neutronClient1.queryContractSmart(
        subDAOQueryTestScope.contracts.proposals.single.pre_propose.timelock!
          .address,
        {
          list_proposals: {
            limit: 100,
          },
        },
      );

      expect(proposals.proposals[0].id).toEqual(1);
      expect(proposals.proposals).toHaveLength(35);
      expect(proposals.proposals[34].id).toEqual(35);
    });
  });

  describe('Subdao: Proposals and access', () => {
    let proposalId: number;
    test('Update config: Unauthorized', async () => {
      await expect(
        neutronClient1.execute(subDao.contracts.core.address, {
          update_config: {},
        }),
      ).rejects.toThrow(/Unauthorized/);
    });
    test('Update config (subDAO name) via proposal', async () => {
      const configBefore = await neutronClient1.queryContractSmart(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );

      const newDaoName = 'another name';
      expect(configBefore.name).not.toEqual(newDaoName);
      proposalId = await subdaoMember1.submitUpdateSubDaoConfigProposal({
        name: newDaoName,
      });
      await subdaoMember1.supportAndExecuteProposal(proposalId);

      await waitSeconds(20);
      await subdaoMember1.executeTimelockedProposal(proposalId);
      const configAfter = await neutronClient1.queryContractSmart(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );
      expect(configAfter.name).toEqual(newDaoName);
    });
    test('Update config with empty subDAO name', async () => {
      const configBefore = await neutronClient1.queryContractSmart(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );

      proposalId = await subdaoMember1.submitUpdateSubDaoConfigProposal({
        name: '',
      });
      await subdaoMember1.supportAndExecuteProposal(proposalId);

      await waitSeconds(20);
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId),
      ).rejects.toThrow(/config name cannot be empty/);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
      const configAfter = await neutronClient1.queryContractSmart(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );
      expect(configAfter).toEqual(configBefore);
    });
  });
});

async function overruleTimelockedProposalMock(
  client: SigningNeutronClient,
  member: DaoMember,
  proposalId: number,
  customModule = 'single',
): Promise<IndexedTx> {
  return client.execute(
    member.dao.contracts.proposals[customModule].pre_propose.timelock!.address,
    {
      overrule_proposal: {
        proposal_id: proposalId,
      },
    },
  );
}
