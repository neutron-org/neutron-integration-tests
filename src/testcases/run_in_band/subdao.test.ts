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
} from '../../helpers/dao';
import { getHeight, wait } from '../../helpers/wait';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { Wallet } from '../../types';

describe('Neutron / Subdao', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: WalletWrapper;
  let neutronAccount2: WalletWrapper;
  let subdaoMember1: DaoMember;
  let subdaoMember2: DaoMember;
  let mainDaoMember: DaoMember;
  let demo1_wallet: Wallet;
  let security_dao_wallet: Wallet;
  let demo2_wallet: Wallet;
  let demo1_addr: AccAddress | ValAddress;
  let security_dao_addr: AccAddress | ValAddress;
  let demo2_addr: AccAddress | ValAddress;
  let subDao: Dao;
  let mainDao: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    demo1_wallet = testState.wallets.neutron.demo1;
    security_dao_wallet = testState.wallets.neutron.icq;
    demo2_wallet = testState.wallets.neutron.demo2;
    demo1_addr = demo1_wallet.address;
    security_dao_addr = security_dao_wallet.address;
    demo2_addr = demo2_wallet.address;
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount1 = new WalletWrapper(neutronChain, demo1_wallet);
    neutronAccount2 = new WalletWrapper(neutronChain, demo2_wallet);

    const daoContracts = await deployNeutronDao(neutronAccount1);
    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember = new DaoMember(neutronAccount1, mainDao);
    await mainDaoMember.bondFunds('1000');

    subDao = await setupSubDaoTimelockSet(
      neutronAccount1,
      mainDao.contracts.core.address,
      security_dao_addr.toString(),
    );

    subdaoMember1 = new DaoMember(neutronAccount1, subDao);
    subdaoMember2 = new DaoMember(neutronAccount2, subDao);

    const subDaosList = await mainDao.getSubDaoList();
    expect(subDaosList).toContain(subDao.contracts.core.address);

    await neutronChain.getWithAttempts(
      async () =>
        await subDao.queryVotingPower(
          neutronAccount1.wallet.address.toString(),
        ),
      async (response) => response.power == 1,
    );
    // await neutronAccount1.msgSend(subDao.contracts.core.address, '10000'); // funding for gas
  });

  describe('Timelock: Unauthorized', () => {
    test('Unauthorized timelock', async () => {
      await expect(
        neutronAccount1.executeContract(
          subDao.contracts.proposal_modules.single.pre_proposal_module
            .timelock_module.address,
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
    let proposal_id: number;
    test('proposal timelock', async () => {
      proposal_id = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: demo2_addr.toString(),
          amount: 2000,
          denom: neutronChain.denom,
        },
      ]);

      const timelocked_prop = await subdaoMember1.supportAndExecuteProposal(
        proposal_id,
      );

      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(1);
    });

    test('execute timelocked: nonexistant ', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(1_000_000),
      ).rejects.toThrow(/SingleChoiceProposal not found/);
    });

    test('execute timelocked: timelock_duration have not pass', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(proposal_id),
      ).rejects.toThrow(/Proposal is timelocked/);
    });

    test('execute timelocked: execution failed', async () => {
      //wait for timelock durations
      await wait(20);
      // timelocked proposal execution failed due to insufficient funds on timelock contract
      await subdaoMember1.executeTimelockedProposal(proposal_id);
      // TODO: check the reason of the failure
      const timelocked_prop = await subDao.getTimelockedProposal(proposal_id);
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('execution_failed');
      expect(timelocked_prop.msgs).toHaveLength(1);
    });

    test('execute timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(proposal_id),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
    });

    test('overrule timelocked(ExecutionFailed): WrongStatus error', async () => {
      // TODO rewrite with gov overrule proposal
      await expect(
        subdaoMember1.overruleTimelockedProposal(proposal_id),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
    });
  });

  describe('Timelock: Succeed execution', () => {
    let proposal_id: number;
    beforeAll(async () => {
      const coinsForDemo2 = 2000;
      proposal_id = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: neutronAccount2.wallet.address.toString(),
          amount: coinsForDemo2,
          denom: NEUTRON_DENOM,
        },
      ]);

      const timelocked_prop = await subdaoMember1.supportAndExecuteProposal(
        proposal_id,
      );

      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(1);
    });

    test('execute timelocked: success', async () => {
      await neutronAccount1.msgSend(
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address,
        '20000',
      ); // fund the subdao treasury
      const balance2 = await neutronAccount2.queryDenomBalance(NEUTRON_DENOM);
      await wait(20);
      await subdaoMember1.executeTimelockedProposal(proposal_id);
      const balance2_after = await neutronAccount2.queryDenomBalance(
        NEUTRON_DENOM,
      );
      expect(balance2_after).toEqual(balance2 + 2000);

      const timelocked_prop = await subDao.getTimelockedProposal(proposal_id);
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('executed');
      expect(timelocked_prop.msgs).toHaveLength(1);
    });

    test('execute timelocked(Executed): WrongStatus error', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(proposal_id),
      ).rejects.toThrow(/Wrong proposal status \(executed\)/);
    });

    test('overrule timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        subdaoMember1.overruleTimelockedProposal(proposal_id),
      ).rejects.toThrow(/Wrong proposal status \(executed\)/);
    });
  });

  describe('Overrule timelocked', () => {
    let proposal_id: number;
    beforeAll(async () => {
      proposal_id = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: demo2_addr.toString(),
          amount: 2000,
          denom: neutronChain.denom,
        },
      ]);

      const timelocked_prop = await subdaoMember1.supportAndExecuteProposal(
        proposal_id,
      );

      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(1);
    });

    test('overrule timelocked(Timelocked): Unauthorized', async () => {
      await expect(
        subdaoMember2.overruleTimelockedProposal(proposal_id),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('overrule timelocked(Timelocked): Success', async () => {
      await subdaoMember1.overruleTimelockedProposal(proposal_id);
      const timelocked_prop = await subDao.getTimelockedProposal(proposal_id);
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('overruled');
      expect(timelocked_prop.msgs).toHaveLength(1);
    });

    test('execute timelocked(Overruled): WrongStatus error', async () => {
      await expect(
        subdaoMember1.executeTimelockedProposal(proposal_id),
      ).rejects.toThrow(/Wrong proposal status \(overruled\)/);
    });
  });

  describe('execution control', () => {
    const funding = 1000;
    let proposal_id: number;
    test('create a proposal to fund security DAO', async () => {
      proposal_id = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: security_dao_addr.toString(),
          amount: funding,
          denom: neutronChain.denom,
        },
      ]);

      await subdaoMember1.voteYes(proposal_id);
      await subDao.checkPassedProposal(proposal_id);
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
        subdaoMember1.executeProposalWithAttempts(proposal_id),
      ).rejects.toThrow(/Contract execution is paused/);
      await expect(
        subdaoMember1.executeTimelockedProposal(proposal_id),
      ).rejects.toThrow(/SingleChoiceProposal not found/);
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
      await neutronAccount1.msgSend(
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address,
        '10000',
      ); // to let the timelock contract fulfill the proposal
      const beforeExecBalance = await neutronChain.queryBalances(
        security_dao_addr.toString(),
      );
      await subdaoMember1.executeProposalWithAttempts(proposal_id);

      await wait(20); // wait until timelock duration passes
      await subdaoMember1.executeTimelockedProposal(proposal_id);
      const timelocked_prop = await subDao.getTimelockedProposal(proposal_id);
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('executed');
      expect(timelocked_prop.msgs).toHaveLength(1);

      const afterExecBalance = await neutronChain.queryBalances(
        security_dao_addr.toString(),
      );
      expect(+(afterExecBalance.balances[0].amount || 0)).toEqual(
        +(beforeExecBalance.balances[0].amount || 0) + funding,
      );
    });

    test('auto unpause on pause timeout', async () => {
      // pause subDAO on behalf of the Neutron DAO
      const short_pause_duration = 5;
      const pauseHeight = await getHeight(neutronChain.sdk); // an approximate one
      const res = await neutronAccount1.executeContract(
        subDao.contracts.core.address,
        JSON.stringify({
          pause: {
            duration: short_pause_duration,
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
      await neutronChain.blockWaiter.waitBlocks(short_pause_duration);
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
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address,
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
          subDao.contracts.proposal_modules.single.pre_proposal_module
            .timelock_module.address,
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: Incorrect owner address format', async () => {
      await expect(
        neutronAccount1.executeContract(
          subDao.contracts.proposal_modules.single.pre_proposal_module
            .timelock_module.address,
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
          subDao.contracts.proposal_modules.single.pre_proposal_module
            .timelock_module.address,
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
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address,
        JSON.stringify({
          update_config: {
            owner: demo2_addr.toString(),
          },
        }),
      );

      const expectedConfig: TimelockConfig = {
        owner: demo2_addr.toString(),
        overrule_pre_propose:
          mainDao.contracts.proposal_modules.overrule.pre_proposal_module
            .address,
        subdao: subDao.contracts.core.address,
      };

      const c = await neutronChain.queryContract<TimelockConfig>(
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });

    test('Update config: old owner lost update rights', async () => {
      await expect(
        neutronAccount1.executeContract(
          subDao.contracts.proposal_modules.single.pre_proposal_module
            .timelock_module.address,
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: update both params with new owner', async () => {
      await neutronAccount2.executeContract(
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address,
        JSON.stringify({
          update_config: {
            owner: demo1_addr.toString(),
          },
        }),
      );

      const expectedConfig: TimelockConfig = {
        owner: demo1_addr.toString(),
        subdao: subDao.contracts.core.address,
        overrule_pre_propose:
          mainDao.contracts.proposal_modules.overrule.pre_proposal_module
            .address,
      };

      const c = await neutronChain.queryContract<TimelockConfig>(
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address,
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
        demo1_addr.toString(),
      );
      subDAOQueryTestScopeMember = new DaoMember(
        neutronAccount1,
        subDAOQueryTestScope,
      );

      for (let i = 1; i <= 35; i++) {
        const proposal_id =
          await subDAOQueryTestScopeMember.submitSingleChoiceProposal(
            `Proposal ${i}`,
            `proposal ${i} description`,
            [
              createBankMessage(
                demo1_addr.toString(),
                1000,
                neutronChain.denom,
              ),
              createBankMessage(
                demo2_addr.toString(),
                2000,
                neutronChain.denom,
              ),
            ],
          );

        await subDAOQueryTestScopeMember.supportAndExecuteProposal(proposal_id);
      }
    });

    test('Query proposals', async () => {
      const proposals =
        await neutronChain.queryContract<TimelockProposalListResponse>(
          subDAOQueryTestScope.contracts.proposal_modules.single
            .pre_proposal_module.timelock_module.address,
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
          subDAOQueryTestScope.contracts.proposal_modules.single
            .pre_proposal_module.timelock_module.address,
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
          subDAOQueryTestScope.contracts.proposal_modules.single
            .pre_proposal_module.timelock_module.address,
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
          subDAOQueryTestScope.contracts.proposal_modules.single
            .pre_proposal_module.timelock_module.address,
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
    let proposal_id: number;
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
      const config_before = await neutronChain.queryContract<SubDaoConfig>(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );

      const new_dao_name = 'another name';
      expect(config_before.name).not.toEqual(new_dao_name);
      proposal_id = await subdaoMember1.submitUpdateSubDaoConfigProposal({
        name: new_dao_name,
      });
      await subdaoMember1.supportAndExecuteProposal(proposal_id);

      await wait(20);
      await subdaoMember1.executeTimelockedProposal(proposal_id);
      const config_after = await neutronChain.queryContract<SubDaoConfig>(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );
      expect(config_after.name).toEqual(new_dao_name);
    });
    test('Update config with empty subDAO name', async () => {
      const config_before = await neutronChain.queryContract<SubDaoConfig>(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );

      proposal_id = await subdaoMember1.submitUpdateSubDaoConfigProposal({
        name: '',
      });
      await subdaoMember1.supportAndExecuteProposal(proposal_id);

      await wait(20);
      await subdaoMember1.executeTimelockedProposal(proposal_id);
      const timelocked_prop = await subDao.getTimelockedProposal(proposal_id);
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('execution_failed');
      expect(timelocked_prop.msgs).toHaveLength(1);
      const config_after = await neutronChain.queryContract<SubDaoConfig>(
        subDao.contracts.core.address,
        {
          config: {},
        },
      );
      expect(config_after).toEqual(config_before);
    });
  });
});
