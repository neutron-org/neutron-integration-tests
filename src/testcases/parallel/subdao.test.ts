/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  CosmosWrapper,
  createBankMessage,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import {
  TimelockConfig,
  TimelockProposalListResponse,
  SubDaoConfig,
  Dao,
  DaoMember,
  setupSubDaoTimelockSet,
  deployNeutronDao,
  SubdaoProposalConfig,
} from '../../helpers/dao';
import { getHeight, wait } from '../../helpers/wait';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { Wallet } from '../../types';
import { BroadcastTx200ResponseTxResponse } from '@cosmos-client/core/cjs/openapi/api';
import Long from 'long';
import { paramChangeProposal, sendProposal } from '../../helpers/proposal';

describe('Neutron / Subdao', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: WalletWrapper;
  let neutronAccount2: WalletWrapper;
  let subdaoMember1: DaoMember;
  let subdaoMember2: DaoMember;
  let mainDaoMember: DaoMember;
  let demo1Wallet: Wallet;
  let securityDaoWallet: Wallet;
  let demo2Wallet: Wallet;
  let demo1Addr: AccAddress | ValAddress;
  let securityDaoAddr: AccAddress | ValAddress;
  let demo2Addr: AccAddress | ValAddress;
  let subDao: Dao;
  let mainDao: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    demo1Wallet = testState.wallets.qaNeutron.genQaWal1;
    securityDaoWallet = testState.wallets.qaNeutronThree.genQaWal1;
    demo2Wallet = testState.wallets.qaNeutronFour.genQaWal1;
    demo1Addr = demo1Wallet.address;
    securityDaoAddr = securityDaoWallet.address;
    demo2Addr = demo2Wallet.address;
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount1 = new WalletWrapper(neutronChain, demo1Wallet);
    neutronAccount2 = new WalletWrapper(neutronChain, demo2Wallet);

    const daoContracts = await deployNeutronDao(neutronAccount1);
    console.log(JSON.stringify(daoContracts, null, 2));
    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember = new DaoMember(neutronAccount1, mainDao);
    await mainDaoMember.bondFunds('10000');

    subDao = await setupSubDaoTimelockSet(
      neutronAccount1,
      mainDao.contracts.core.address,
      securityDaoAddr.toString(),
      true,
    );

    subdaoMember1 = new DaoMember(neutronAccount1, subDao);
    subdaoMember2 = new DaoMember(neutronAccount2, subDao);

    const subDaosList = await mainDao.getSubDaoList();
    expect(subDaosList).toContain(subDao.contracts.core.address);

    const votingPower = await subdaoMember1.queryVotingPower();
    expect(votingPower.power).toEqual('1');
  });

  describe('Timelock: Unauthorized', () => {
    test('Unauthorized timelock', async () => {
      await expect(
        neutronAccount1.executeContract(
          subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
          JSON.stringify({
            timelock_proposal: {
              proposal_id: 1,
              msgs: [],
            },
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });
  });

  describe('Timelock: failed execution', () => {
    let proposalId: number;
    test('proposal timelock', async () => {
      proposalId = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: demo2Addr.toString(),
          amount: 2000,
          denom: neutronChain.denom,
        },
      ]);

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked: nonexistant', async () => {
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
      await wait(20);
      // timelocked proposal execution failed due to insufficient funds on timelock contract
      await subdaoMember1.executeTimelockedProposal(proposalId);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('execution_failed');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
    });

    let proposalId2: number;
    test('proposal timelock 2 with two messages, one of them fails', async () => {
      // pack two messages in one proposal
      const failMessage = paramChangeProposal({
        title: 'paramchange',
        description: 'paramchange',
        subspace: 'icahost',
        key: 'HostEnabled',
        value: '123123123', // expected boolean, provided number
      });
      const goodMessage = sendProposal({
        to: neutronAccount2.wallet.address.toString(),
        denom: NEUTRON_DENOM,
        amount: '100',
      });
      const fee = {
        gas_limit: Long.fromString('4000000'),
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
      await neutronAccount1.msgSend(subDao.contracts.core.address, '100000'); // fund the subdao treasury
      const balance2 = await neutronAccount2.queryDenomBalance(NEUTRON_DENOM);

      //wait for timelock durations
      await wait(20);
      // timelocked proposal execution failed due to invalid param value
      await subdaoMember1.executeTimelockedProposal(proposalId2);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId2);
      expect(timelockedProp.id).toEqual(proposalId2);
      expect(timelockedProp.status).toEqual('execution_failed');
      expect(timelockedProp.msgs).toHaveLength(1);

      // check that goodMessage failed as well
      const balance2After = await neutronAccount2.queryDenomBalance(
        NEUTRON_DENOM,
      );
      expect(balance2After).toEqual(balance2);

      // cannot execute failed proposal with closeOnProposalExecutionFailed=true
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId2),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
      await neutronChain.blockWaiter.waitBlocks(2);
    });

    test('change subdao proposal config with closeOnProposalExecutionFailed = false', async () => {
      const subdaoConfig =
        await neutronChain.queryContract<SubdaoProposalConfig>(
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
      await wait(20);
      await subdaoMember1.executeTimelockedProposal(proposalId); // should execute no problem

      await neutronChain.blockWaiter.waitBlocks(2);

      const subdaoConfigAfter =
        await neutronChain.queryContract<SubdaoProposalConfig>(
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
          recipient: demo2Addr.toString(),
          amount: 200000,
          denom: neutronChain.denom,
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
      const subdaoConfig =
        await neutronChain.queryContract<SubdaoProposalConfig>(
          subDao.contracts.proposals.single.address,
          {
            config: {},
          },
        );
      expect(subdaoConfig.close_proposal_on_execution_failure).toEqual(false);

      //wait for timelock durations
      await wait(20);
      // timelocked proposal execution failed due to insufficient funds
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId3),
      ).rejects.toThrow(/insufficient funds/);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId3);
      expect(timelockedProp.id).toEqual(proposalId3);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);

      await neutronAccount1.msgSend(subDao.contracts.core.address, '300000');

      // now that we have funds should execute without problems

      const balanceBefore = await neutronChain.queryDenomBalance(
        demo2Addr.toString(),
        NEUTRON_DENOM,
      );
      await subdaoMember1.executeTimelockedProposal(proposalId3);
      await neutronChain.blockWaiter.waitBlocks(2);
      const balanceAfter = await neutronChain.queryDenomBalance(
        demo2Addr.toString(),
        NEUTRON_DENOM,
      );

      expect(balanceAfter - balanceBefore).toEqual(200000);
    });
  });

  describe('Timelock: Succeed execution', () => {
    let proposalId: number;
    beforeAll(async () => {
      const coinsForDemo2 = 2000;
      proposalId = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: neutronAccount2.wallet.address.toString(),
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
      await neutronAccount1.msgSend(subDao.contracts.core.address, '20000'); // fund the subdao treasury
      const balance2 = await neutronAccount2.queryDenomBalance(NEUTRON_DENOM);
      await wait(20);
      await subdaoMember1.executeTimelockedProposal(proposalId);
      const balance2After = await neutronAccount2.queryDenomBalance(
        NEUTRON_DENOM,
      );
      expect(balance2After).toEqual(balance2 + 2000);

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
        overruleTimelockedProposalMock(subdaoMember1, proposalId),
      ).rejects.toThrow(/Wrong proposal status \(executed\)/);
    });
  });

  describe('Overrule timelocked', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: demo2Addr.toString(),
          amount: 2000,
          denom: neutronChain.denom,
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
        overruleTimelockedProposalMock(subdaoMember2, proposalId),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('overrule timelocked(Timelocked): Success', async () => {
      await overruleTimelockedProposalMock(subdaoMember1, proposalId);
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
      await wait(20);
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

  describe('Non-timelock typed duration pause proposal: Succeed creation', () => {
    let proposalId: number;

    test('Non-timelock pause proposal: Succeed creation', async () => {
      const pauseInfo = await neutronChain.queryPausedInfo(
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
      const pauseInfo = await neutronChain.queryPausedInfo(
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
      // Unauthorzed here means that execute message is right, so pre-propose module works fine
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
        'Proposal #12',
        '',
        '1000',
        'proposal11',
        'single_nt_pause',
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
        subdaoMember2.user.wallet.address.toString(),
      ]);

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('update members: success', async () => {
      await wait(20);
      const votingPowerBefore = await subdaoMember2.queryVotingPower();
      expect(votingPowerBefore.power).toEqual('0');
      const res = await subdaoMember1.executeTimelockedProposal(proposalId);
      expect(res.code).toEqual(0);
      await neutronChain.blockWaiter.waitBlocks(1);
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
          recipient: securityDaoAddr.toString(),
          amount: funding,
          denom: neutronChain.denom,
        },
      ]);

      await subdaoMember1.voteYes(proposalId);
      await subDao.checkPassedProposal(proposalId);
    });
    test('pause subDAO', async () => {
      let pauseInfo = await neutronChain.queryPausedInfo(
        subDao.contracts.core.address,
      );
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);

      // pause subDAO on behalf of the security DAO
      const pauseHeight = await getHeight(neutronChain.sdk); // an approximate one
      const res = await neutronAccount1.executeContract(
        subDao.contracts.core.address,
        JSON.stringify({
          pause: {
            duration: 50,
          },
        }),
      );
      expect(res.code).toEqual(0);

      // check contract's pause info after pausing
      pauseInfo = await neutronChain.queryPausedInfo(
        subDao.contracts.core.address,
      );
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
      const res = await neutronAccount1.executeContract(
        subDao.contracts.core.address,
        JSON.stringify({
          unpause: {},
        }),
      );
      expect(res.code).toEqual(0);

      // check contract's pause info after unpausing
      const pauseInfo = await neutronChain.queryPausedInfo(
        subDao.contracts.core.address,
      );
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);
    });
    test('execute proposal when subDAO is unpaused', async () => {
      await neutronAccount1.msgSend(subDao.contracts.core.address, '10000');
      const beforeExecBalance = await neutronChain.queryDenomBalance(
        securityDaoAddr.toString(),
        neutronChain.denom,
      );
      await subdaoMember1.executeProposalWithAttempts(proposalId);

      await wait(20); // wait until timelock duration passes
      await subdaoMember1.executeTimelockedProposal(proposalId);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);

      const afterExecBalance = await neutronChain.queryDenomBalance(
        securityDaoAddr.toString(),
        neutronChain.denom,
      );
      expect(afterExecBalance).toEqual(beforeExecBalance + funding);
    });

    test('auto unpause on pause timeout', async () => {
      // pause subDAO on behalf of the Neutron DAO
      const shortPauseDuration = 5;
      const pauseHeight = await getHeight(neutronChain.sdk); // an approximate one
      const res = await neutronAccount1.executeContract(
        subDao.contracts.core.address,
        JSON.stringify({
          pause: {
            duration: shortPauseDuration,
          },
        }),
      );
      expect(res.code).toEqual(0);

      // check contract's pause info after pausing
      let pauseInfo = await neutronChain.queryPausedInfo(
        subDao.contracts.core.address,
      );
      expect(pauseInfo.unpaused).toEqual(undefined);
      expect(pauseInfo.paused.until_height).toBeGreaterThan(pauseHeight);

      // wait and check contract's pause info after unpausing
      await neutronChain.blockWaiter.waitBlocks(shortPauseDuration);
      pauseInfo = await neutronChain.queryPausedInfo(
        subDao.contracts.core.address,
      );
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);
    });
  });

  describe('Timelock: Update config', () => {
    afterAll(async () => {
      // return to the starting timelock_duration
      await neutronAccount1.executeContract(
        subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
        JSON.stringify({
          update_config: {
            timelock_duration: 20,
          },
        }),
      );
    });

    test('Update config: Unauthorized', async () => {
      await expect(
        neutronAccount2.executeContract(
          subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: Incorrect owner address format', async () => {
      await expect(
        neutronAccount1.executeContract(
          subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
          JSON.stringify({
            update_config: {
              owner: 'owner',
            },
          }),
        ),
      ).rejects.toThrow(
        /addr_validate errored: decoding bech32 failed: invalid bech32/,
      );

      await expect(
        neutronAccount1.executeContract(
          subDao.contracts.proposals.single.pre_propose.timelock?.address || '',
          JSON.stringify({
            update_config: {
              owner: 'cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw',
            },
          }),
        ),
      ).rejects.toThrow(
        /addr_validate errored: invalid Bech32 prefix; expected neutron, got cosmos/,
      );
    });

    test('Update config: owner success', async () => {
      await neutronAccount1.executeContract(
        subDao.contracts.proposals.single.pre_propose.timelock!.address,
        JSON.stringify({
          update_config: {
            owner: demo2Addr.toString(),
          },
        }),
      );

      const expectedConfig: TimelockConfig = {
        owner: demo2Addr.toString(),
        overrule_pre_propose:
          mainDao.contracts.proposals.overrule.pre_propose.address,
        subdao: subDao.contracts.core.address,
      };

      const c = await neutronChain.queryContract<TimelockConfig>(
        subDao.contracts.proposals.single.pre_propose.timelock!.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });

    test('Update config: old owner lost update rights', async () => {
      await expect(
        neutronAccount1.executeContract(
          subDao.contracts.proposals.single.pre_propose.timelock!.address,
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: update both params with new owner', async () => {
      await neutronAccount2.executeContract(
        subDao.contracts.proposals.single.pre_propose.timelock!.address,
        JSON.stringify({
          update_config: {
            owner: demo1Addr.toString(),
          },
        }),
      );

      const expectedConfig: TimelockConfig = {
        owner: demo1Addr.toString(),
        subdao: subDao.contracts.core.address,
        overrule_pre_propose:
          mainDao.contracts.proposals.overrule.pre_propose.address,
      };

      const c = await neutronChain.queryContract<TimelockConfig>(
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
        neutronAccount1,
        mainDao.contracts.core.address,
        demo1Addr.toString(),
        true,
      );
      subDAOQueryTestScopeMember = new DaoMember(
        neutronAccount1,
        subDAOQueryTestScope,
      );

      for (let i = 1; i <= 35; i++) {
        const proposalId =
          await subDAOQueryTestScopeMember.submitSingleChoiceProposal(
            `Proposal ${i}`,
            `proposal ${i} description`,
            [
              createBankMessage(demo1Addr.toString(), 1000, neutronChain.denom),
              createBankMessage(demo2Addr.toString(), 2000, neutronChain.denom),
            ],
          );

        await subDAOQueryTestScopeMember.supportAndExecuteProposal(proposalId);
      }
    });

    test('Query proposals', async () => {
      const proposals =
        await neutronChain.queryContract<TimelockProposalListResponse>(
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
      const proposals =
        await neutronChain.queryContract<TimelockProposalListResponse>(
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
      const proposals =
        await neutronChain.queryContract<TimelockProposalListResponse>(
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
      const proposals =
        await neutronChain.queryContract<TimelockProposalListResponse>(
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
        neutronAccount1.executeContract(
          subDao.contracts.core.address,
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });
    test('Update config (subDAO name) via proposal', async () => {
      const configBefore = await neutronChain.queryContract<SubDaoConfig>(
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

      await wait(20);
      await subdaoMember1.executeTimelockedProposal(proposalId);
      const configAfter = await neutronChain.queryContract<SubDaoConfig>(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );
      expect(configAfter.name).toEqual(newDaoName);
    });
    test('Update config with empty subDAO name', async () => {
      const configBefore = await neutronChain.queryContract<SubDaoConfig>(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );

      proposalId = await subdaoMember1.submitUpdateSubDaoConfigProposal({
        name: '',
      });
      await subdaoMember1.supportAndExecuteProposal(proposalId);

      await wait(20);
      await expect(
        subdaoMember1.executeTimelockedProposal(proposalId),
      ).rejects.toThrow(/config name cannot be empty/);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
      const configAfter = await neutronChain.queryContract<SubDaoConfig>(
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
  acc: DaoMember,
  proposalId: number,
  customModule = 'single',
): Promise<BroadcastTx200ResponseTxResponse> {
  return acc.user.executeContract(
    acc.dao.contracts.proposals[customModule].pre_propose.timelock!.address,
    JSON.stringify({
      overrule_proposal: {
        proposal_id: proposalId,
      },
    }),
  );
}
