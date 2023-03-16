/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  CosmosWrapper,
  createBankMassage,
  getEventAttributesFromTx,
  NEUTRON_DENOM,
} from '../../helpers/cosmos';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import {
  TimelockConfig,
  TimelockProposalListResponse,
  TimeLockSingleChoiceProposal,
  SubDaoConfig,
  getDaoContracts,
  getVotingModule,
  getVotingVaults,
} from '../../helpers/dao';
import { getHeight, getWithAttempts, wait } from '../../helpers/wait';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { Wallet } from '../../types';
import { NeutronContract } from '../../helpers/types';

describe('Neutron / Subdao', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm_main_dao: CosmosWrapper;
  let cm_demo3: CosmosWrapper;
  let main_dao_wallet: Wallet;
  let security_dao_wallet: Wallet;
  let demo2_wallet: Wallet;
  let main_dao_addr: AccAddress | ValAddress;
  let security_dao_addr: AccAddress | ValAddress;
  let demo2_addr: AccAddress | ValAddress;
  let subDAO: SubDAO;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    main_dao_wallet = testState.wallets.neutron.demo1;
    security_dao_wallet = testState.wallets.neutron.icq;
    demo2_wallet = testState.wallets.neutron.demo2;
    main_dao_addr = main_dao_wallet.address;
    security_dao_addr = security_dao_wallet.address;
    demo2_addr = demo2_wallet.address;
    cm_main_dao = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      main_dao_wallet,
      NEUTRON_DENOM,
    );
    cm_demo3 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      demo2_wallet,
      NEUTRON_DENOM,
    );
    subDAO = await setupSubDaoTimelockSet(
      cm_main_dao,
      main_dao_addr.toString(),
      security_dao_addr.toString(),
    );

    const votingModuleAddress = await getVotingModule(
      cm_main_dao,
      subDAO.core.address,
    );
    const votingVaults = await getVotingVaults(
      cm_main_dao,
      votingModuleAddress,
    );
    const simpleVault = votingVaults.ntrn_vault.address;

    await cm_main_dao.bondFunds(simpleVault, '10000');
    await getWithAttempts(
      cm_main_dao.blockWaiter,
      async () =>
        await cm_main_dao.queryVotingPower(
          subDAO.core.address,
          main_dao_addr.toString(),
        ),
      async (response) => response.power == 10000,
      20,
    );
    await cm_main_dao.msgSend(subDAO.core.address, '10000'); // funding for gas
  });

  describe('Timelock: Unauthorized', () => {
    test('Unauthorized timelock', async () => {
      await expect(
        cm_main_dao.executeContract(
          subDAO.timelock.address,
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
      proposal_id = await proposeSendFunds(
        cm_main_dao,
        subDAO.prepropose.address,
        [
          { recipient: main_dao_addr.toString(), amount: 1000 },
          { recipient: demo2_addr.toString(), amount: 2000 },
        ],
      );

      const timelocked_prop = await supportAndExecuteProposal(
        cm_main_dao,
        subDAO.propose.address,
        subDAO.timelock.address,
        proposal_id,
      );

      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked: nonexistant ', async () => {
      await expect(
        executeTimelockedProposal(
          cm_main_dao,
          subDAO.timelock.address,
          1_000_000,
        ),
      ).rejects.toThrow(/SingleChoiceProposal not found/);
    });

    test('execute timelocked: timelock_duration have not pass', async () => {
      await expect(
        executeTimelockedProposal(
          cm_main_dao,
          subDAO.timelock.address,
          proposal_id,
        ),
      ).rejects.toThrow(/Proposal is timelocked/);
    });

    test('execute timelocked: execution failed', async () => {
      //wait for timelock durations
      await wait(20);
      // timelocked proposal execution failed due to insufficient funds on timelock contract
      await executeTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      // TODO: check the reason of the failure
      const timelocked_prop = await getTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('execution_failed');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        executeTimelockedProposal(
          cm_main_dao,
          subDAO.timelock.address,
          proposal_id,
        ),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
    });

    test('overrule timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        overruleTimelockedProposal(
          cm_main_dao,
          subDAO.timelock.address,
          proposal_id,
        ),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
    });
  });

  describe('Timelock: Succeed execution', () => {
    let proposal_id: number;
    beforeAll(async () => {
      proposal_id = await proposeSendFunds(
        cm_main_dao,
        subDAO.prepropose.address,
        [
          { recipient: main_dao_addr.toString(), amount: 1000 },
          { recipient: demo2_addr.toString(), amount: 2000 },
        ],
      );

      const timelocked_prop = await supportAndExecuteProposal(
        cm_main_dao,
        subDAO.propose.address,
        subDAO.timelock.address,
        proposal_id,
      );

      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked: success', async () => {
      await cm_main_dao.msgSend(subDAO.timelock.address, '20000'); // funding for gas
      const balance_main_dao = await cm_main_dao.queryBalances(
        main_dao_addr.toString(),
      );
      const balance_demo2 = await cm_main_dao.queryBalances(
        demo2_addr.toString(),
      );
      await wait(20);
      await executeTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      const balance_main_dao_after = await cm_main_dao.queryBalances(
        main_dao_addr.toString(),
      );
      const balance_demo2_after = await cm_main_dao.queryBalances(
        demo2_addr.toString(),
      );
      // -10000 gas fees
      expect(
        Number(
          balance_main_dao_after.balances.find((b) => b.denom == NEUTRON_DENOM)!
            .amount,
        ),
      ).toEqual(
        Number(
          balance_main_dao.balances.find((b) => b.denom == NEUTRON_DENOM)!
            .amount,
        ) +
          1000 -
          10000,
      );
      expect(
        Number(
          balance_demo2_after.balances.find((b) => b.denom == NEUTRON_DENOM)!
            .amount,
        ),
      ).toEqual(
        Number(
          balance_demo2.balances.find((b) => b.denom == NEUTRON_DENOM)!.amount,
        ) + 2000,
      );

      const timelocked_prop = await getTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('executed');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked(Executed): WrongStatus error', async () => {
      await expect(
        executeTimelockedProposal(
          cm_main_dao,
          subDAO.timelock.address,
          proposal_id,
        ),
      ).rejects.toThrow(/Wrong proposal status \(executed\)/);
    });

    test('overrule timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        overruleTimelockedProposal(
          cm_main_dao,
          subDAO.timelock.address,
          proposal_id,
        ),
      ).rejects.toThrow(/Wrong proposal status \(executed\)/);
    });
  });

  describe('Overrule timelocked', () => {
    let proposal_id: number;
    beforeAll(async () => {
      proposal_id = await proposeSendFunds(
        cm_main_dao,
        subDAO.prepropose.address,
        [
          { recipient: main_dao_addr.toString(), amount: 1000 },
          { recipient: demo2_addr.toString(), amount: 2000 },
        ],
      );

      const timelocked_prop = await supportAndExecuteProposal(
        cm_main_dao,
        subDAO.propose.address,
        subDAO.timelock.address,
        proposal_id,
      );

      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('overrule timelocked(Timelocked): Unauthorized', async () => {
      await expect(
        overruleTimelockedProposal(
          cm_demo3,
          subDAO.timelock.address,
          proposal_id,
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('overrule timelocked(Timelocked): Success', async () => {
      await overruleTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      const timelocked_prop = await getTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('overruled');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked(Overruled): WrongStatus error', async () => {
      await expect(
        executeTimelockedProposal(
          cm_main_dao,
          subDAO.timelock.address,
          proposal_id,
        ),
      ).rejects.toThrow(/Wrong proposal status \(overruled\)/);
    });
  });

  describe('execution control', () => {
    const funding = 1000;
    let proposal_id: number;
    test('create a proposal to fund security DAO', async () => {
      proposal_id = await proposeSendFunds(
        cm_main_dao,
        subDAO.prepropose.address,
        [{ recipient: security_dao_addr.toString(), amount: funding }],
      );

      await cm_main_dao.voteYes(
        subDAO.propose.address,
        proposal_id,
        main_dao_addr.toString(),
      );
      await cm_main_dao.checkPassedProposal(
        subDAO.propose.address,
        proposal_id,
      );
    });
    test('pause subDAO', async () => {
      let pauseInfo = await cm_main_dao.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);

      // pause subDAO on behalf of the security DAO
      const pauseHeight = await getHeight(cm_main_dao.sdk); // an approximate one
      const res = await cm_main_dao.executeContract(
        subDAO.core.address,
        JSON.stringify({
          pause: {
            duration: 50,
          },
        }),
      );
      expect(res.code).toEqual(0);

      // check contract's pause info after pausing
      pauseInfo = await cm_main_dao.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo.unpaused).toEqual(undefined);
      expect(pauseInfo.paused.until_height).toBeGreaterThan(pauseHeight);
    });
    test('execute proposal when subDAO is paused', async () => {
      await expect(
        cm_main_dao.executeProposalWithAttempts(
          subDAO.propose.address,
          proposal_id,
        ),
      ).rejects.toThrow(/Contract execution is paused/);
      await expect(
        executeTimelockedProposal(
          cm_main_dao,
          subDAO.timelock.address,
          proposal_id,
        ),
      ).rejects.toThrow(/SingleChoiceProposal not found/);
    });
    test('unpause subDAO', async () => {
      // unpause subDAO on behalf of the main DAO
      const res = await cm_main_dao.executeContract(
        subDAO.core.address,
        JSON.stringify({
          unpause: {},
        }),
      );
      expect(res.code).toEqual(0);

      // check contract's pause info after unpausing
      const pauseInfo = await cm_main_dao.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);
    });
    test('execute proposal when subDAO is unpaused', async () => {
      await cm_main_dao.msgSend(subDAO.timelock.address, '10000'); // to let the timelock contract fulfill the proposal
      const beforeExecBalance = await cm_main_dao.queryBalances(
        security_dao_addr.toString(),
      );
      await cm_main_dao.executeProposalWithAttempts(
        subDAO.propose.address,
        proposal_id,
      );

      await wait(20); // wait until timelock duration passes
      await executeTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      const timelocked_prop = await getTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('executed');
      expect(timelocked_prop.msgs).toHaveLength(1);

      const afterExecBalance = await cm_main_dao.queryBalances(
        security_dao_addr.toString(),
      );
      expect(+(afterExecBalance.balances[0].amount || 0)).toEqual(
        +(beforeExecBalance.balances[0].amount || 0) + funding,
      );
    });

    test('auto unpause on pause timeout', async () => {
      // pause subDAO on behalf of the Neutron DAO
      const short_pause_duration = 5;
      const pauseHeight = await getHeight(cm_main_dao.sdk); // an approximate one
      const res = await cm_main_dao.executeContract(
        subDAO.core.address,
        JSON.stringify({
          pause: {
            duration: short_pause_duration,
          },
        }),
      );
      expect(res.code).toEqual(0);

      // check contract's pause info after pausing
      let pauseInfo = await cm_main_dao.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo.unpaused).toEqual(undefined);
      expect(pauseInfo.paused.until_height).toBeGreaterThan(pauseHeight);

      // wait and check contract's pause info after unpausing
      await cm_main_dao.blockWaiter.waitBlocks(short_pause_duration);
      pauseInfo = await cm_main_dao.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);
    });
  });

  describe('Timelock: Update config', () => {
    afterAll(async () => {
      // return to the starting timelock_duration
      await cm_main_dao.executeContract(
        subDAO.timelock.address,
        JSON.stringify({
          update_config: {
            timelock_duration: 20,
          },
        }),
      );
    });

    test('Update config: Unauthorized', async () => {
      await expect(
        cm_demo3.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: Incorrect owner address format', async () => {
      await expect(
        cm_main_dao.executeContract(
          subDAO.timelock.address,
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
        cm_main_dao.executeContract(
          subDAO.timelock.address,
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

    test('Update config: change duration failed', async () => {
      await expect(
        cm_main_dao.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            update_config: {
              timelock_duration: -1,
            },
          }),
        ),
      ).rejects.toThrow(
        /Error parsing into type neutron_subdao_timelock_single::msg::ExecuteMsg: Invalid number/,
      );
    });

    test('Update config: timelock duration success', async () => {
      await cm_main_dao.executeContract(
        subDAO.timelock.address,
        JSON.stringify({
          update_config: {
            timelock_duration: 50,
          },
        }),
      );

      const expectedConfig: TimelockConfig = {
        owner: main_dao_addr.toString(),
        timelock_duration: 50,
        subdao: subDAO.core.address,
      };

      const c = await cm_main_dao.queryContract<TimelockConfig>(
        subDAO.timelock.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });

    test('Update config: owner success', async () => {
      await cm_main_dao.executeContract(
        subDAO.timelock.address,
        JSON.stringify({
          update_config: {
            owner: demo2_addr.toString(),
          },
        }),
      );

      const expectedConfig: TimelockConfig = {
        owner: demo2_addr.toString(),
        timelock_duration: 50,
        subdao: subDAO.core.address,
      };

      const c = await cm_main_dao.queryContract<TimelockConfig>(
        subDAO.timelock.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });

    test('Update config: old owner lost update rights', async () => {
      await expect(
        cm_main_dao.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: update both params with new owner', async () => {
      await cm_demo3.executeContract(
        subDAO.timelock.address,
        JSON.stringify({
          update_config: {
            owner: main_dao_addr.toString(),
            timelock_duration: 100,
          },
        }),
      );

      const expectedConfig: TimelockConfig = {
        owner: main_dao_addr.toString(),
        timelock_duration: 100,
        subdao: subDAO.core.address,
      };

      const c = await cm_main_dao.queryContract<TimelockConfig>(
        subDAO.timelock.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });
  });

  describe('Query Proposals', () => {
    let proposal_id: number;
    let subDAOQueryTestScope: SubDAO;
    beforeAll(async () => {
      subDAOQueryTestScope = await setupSubDaoTimelockSet(
        cm_main_dao,
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );

      for (let i = 1; i <= 35; i++) {
        const resp = await cm_main_dao.executeContract(
          subDAOQueryTestScope.prepropose.address,
          JSON.stringify({
            propose: {
              msg: {
                propose: {
                  title: `Proposal ${i}`,
                  description: `proposal ${i} description`,
                  msgs: [
                    createBankMassage(main_dao_addr.toString(), '1000'),
                    createBankMassage(demo2_addr.toString(), '2000'),
                  ],
                },
              },
            },
          }),
        );
        proposal_id = Number(
          getEventAttributesFromTx({ tx_response: resp }, 'wasm', [
            'proposal_id',
          ])[0].proposal_id,
        );

        await cm_main_dao.executeContract(
          subDAOQueryTestScope.propose.address,
          JSON.stringify({
            vote: { proposal_id: proposal_id, vote: 'yes' },
          }),
        );

        await cm_main_dao.executeContract(
          subDAOQueryTestScope.propose.address,
          JSON.stringify({ execute: { proposal_id: proposal_id } }),
        );
      }
    });

    test('Query proposals', async () => {
      const proposals =
        await cm_main_dao.queryContract<TimelockProposalListResponse>(
          subDAOQueryTestScope.timelock.address,
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
        await cm_main_dao.queryContract<TimelockProposalListResponse>(
          subDAOQueryTestScope.timelock.address,
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
        await cm_main_dao.queryContract<TimelockProposalListResponse>(
          subDAOQueryTestScope.timelock.address,
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
        await cm_main_dao.queryContract<TimelockProposalListResponse>(
          subDAOQueryTestScope.timelock.address,
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
        cm_main_dao.executeContract(
          subDAO.core.address,
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });
    test('Update config (subDAO name) via proposal', async () => {
      const config_before = await cm_main_dao.queryContract<SubDaoConfig>(
        subDAO.core.address,
        {
          config: {},
        },
      );

      const new_dao_name = 'another name';
      expect(config_before.name).not.toEqual(new_dao_name);
      proposal_id = await proposeUpdateSubDaoConfig(
        cm_main_dao,
        subDAO.prepropose.address,
        subDAO.core.address,
        { name: new_dao_name },
      );
      await supportAndExecuteProposal(
        cm_main_dao,
        subDAO.propose.address,
        subDAO.timelock.address,
        proposal_id,
      );

      await wait(20);
      await executeTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      const config_after = await cm_main_dao.queryContract<SubDaoConfig>(
        subDAO.core.address,
        {
          config: {},
        },
      );
      expect(config_after.name).toEqual(new_dao_name);
    });
    test('Update config with empty subDAO name', async () => {
      const config_before = await cm_main_dao.queryContract<SubDaoConfig>(
        subDAO.core.address,
        {
          config: {},
        },
      );

      proposal_id = await proposeUpdateSubDaoConfig(
        cm_main_dao,
        subDAO.prepropose.address,
        subDAO.core.address,
        { name: '' },
      );
      await supportAndExecuteProposal(
        cm_main_dao,
        subDAO.propose.address,
        subDAO.timelock.address,
        proposal_id,
      );

      await wait(20);
      await executeTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      const timelocked_prop = await getTimelockedProposal(
        cm_main_dao,
        subDAO.timelock.address,
        proposal_id,
      );
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('execution_failed');
      expect(timelocked_prop.msgs).toHaveLength(1);
      const config_after = await cm_main_dao.queryContract<SubDaoConfig>(
        subDAO.core.address,
        {
          config: {},
        },
      );
      expect(config_after).toEqual(config_before);
    });
  });

  // TODO: uncomment when overrule handler updated to take into account timelock_duration
  // handler should fail
  // describe("Overrule timelocked: timelock duration has passed", () => {
  //   let proposal_id: number;
  //   beforeAll(async () => {
  //     let resp = await cm.executeContract(subDAO.prepropose.address, JSON.stringify({
  //       propose: {
  //         msg: {
  //           propose: {
  //             title: "Proposal 1",
  //             description: "proposal 1 description",
  //             msgs: [
  //               createBankMassage(main_dao_addr.toString(), "1000"),
  //               createBankMassage(demo2_addr.toString(), "2000"),
  //             ],
  //           }
  //         }
  //       }
  //     }))

  //     proposal_id = Number(getEventAttributesFromTx({ tx_response: resp }, 'wasm', [
  //       'proposal_id'
  //     ])[0].proposal_id);

  //     await cm.executeContract(subDAO.propose.address, JSON.stringify({ vote: { proposal_id: proposal_id, vote: 'yes' } }))

  //     await cm.executeContract(subDAO.propose.address, JSON.stringify({ execute: { proposal_id: proposal_id } }))

  //     let timelocked_prop = await cm.queryContract<TimeLockSingleChoiceProposal>(subDAO.timelock.address, {
  //       proposal: {
  //         proposal_id: proposal_id,
  //       }
  //     })
  //     expect(timelocked_prop.id).toEqual(proposal_id)
  //     expect(timelocked_prop.status).toEqual("timelocked")
  //     expect(timelocked_prop.msgs).toHaveLength(2)
  //   })

  // test('execute timelocked(Overruled): TimelockDuration error', async () => {
  //   await wait(20)
  //   await expect(cm.executeContract(subDAO.timelock.address, JSON.stringify({
  //     overrule_proposal: {
  //       proposal_id: proposal_id,
  //     }
  //   }))
  //   ).rejects.toThrow(/Wrong proposal status \(overruled\)/)
  // })
  // })
});

type contract = {
  codeID: number;
  address: string;
};

type SubDAO = {
  core: contract;
  propose: contract;
  prepropose: contract;
  timelock: contract;
};

const setupSubDaoTimelockSet = async (
  cm: CosmosWrapper,
  main_dao_addr: string,
  security_dao_addr: string,
): Promise<SubDAO> => {
  const coreCodeId = parseInt(await cm.storeWasm(NeutronContract.SUBDAO_CORE));
  const proposeCodeId = parseInt(
    await cm.storeWasm(NeutronContract.SUBDAO_PROPOSAL),
  );
  const preProposeCodeId = parseInt(
    await cm.storeWasm(NeutronContract.SUBDAO_PREPROPOSE),
  );
  const timelockCodeId = parseInt(
    await cm.storeWasm(NeutronContract.SUBDAO_TIMELOCK),
  );

  const mainDaoCore = (await cm.getChainAdmins())[0];
  const daoContracts = await getDaoContracts(cm, mainDaoCore);

  const votingModuleContractInfo = await cm.getContractInfo(
    daoContracts.voting_module.address,
  );
  const votingModuleCodeId =
    votingModuleContractInfo['contract_info']['code_id'];

  const vaults = [
    daoContracts.voting_module.voting_vaults.ntrn_vault.address,
    daoContracts.voting_module.voting_vaults.lockdrop_vault.address,
  ];

  const votingModuleInstantiateInfo = {
    code_id: +votingModuleCodeId,
    label: 'subDAO_Neutron_voting_registry',
    msg: Buffer.from(
      JSON.stringify({
        manager: null,
        owner: {
          address: {
            addr: main_dao_addr,
          },
        },
        voting_vaults: vaults,
      }),
    ).toString('base64'),
  };

  const proposeInstantiateMessage = {
    threshold: { absolute_count: { threshold: '1' } },
    max_voting_period: { height: 10 },
    allow_revoting: false,
    pre_propose_info: {
      module_may_propose: {
        info: {
          code_id: preProposeCodeId,
          label: 'subDAO prepropose module',
          msg: Buffer.from(
            JSON.stringify({
              open_proposal_submission: true,
              timelock_module_instantiate_info: {
                code_id: timelockCodeId,
                label: 'subDAO timelock contract',
                msg: Buffer.from(
                  JSON.stringify({
                    timelock_duration: 20,
                  }),
                ).toString('base64'),
              },
            }),
          ).toString('base64'),
        },
      },
    },
    close_proposal_on_execution_failure: false,
  };
  const proposalModuleInstantiateInfo = {
    code_id: proposeCodeId,
    label: 'subDAO proposal contract',
    msg: Buffer.from(JSON.stringify(proposeInstantiateMessage)).toString(
      'base64',
    ),
  };
  const coreInstantiateMessage = {
    name: 'SubDAO core test 1',
    description: 'serves testing purposes',
    vote_module_instantiate_info: votingModuleInstantiateInfo,
    proposal_modules_instantiate_info: [proposalModuleInstantiateInfo],
    dao_uri: 'www.testsubdao.org',
    main_dao: main_dao_addr,
    security_dao: security_dao_addr,
  };
  const res = await cm.instantiate(
    coreCodeId + '',
    JSON.stringify(coreInstantiateMessage),
    'cwd_subdao_core',
  );
  const subDAO = {
    core: {
      codeID: coreCodeId,
      address: res.find((v) => Number(v.code_id) == coreCodeId)!
        ._contract_address,
    },
    propose: {
      codeID: proposeCodeId,
      address: res.find((v) => Number(v.code_id) == proposeCodeId)!
        ._contract_address,
    },
    prepropose: {
      codeID: preProposeCodeId,
      address: res.find((v) => Number(v.code_id) == preProposeCodeId)!
        ._contract_address,
    },
    timelock: {
      codeID: timelockCodeId,
      address: res.find((v) => Number(v.code_id) == timelockCodeId)!
        ._contract_address,
    },
  };
  return subDAO;
};

const proposeSendFunds = async (
  cm: CosmosWrapper,
  pre_propose_contract: string,
  payments: { recipient: string; amount: number }[],
): Promise<number> => {
  const resp = await cm.executeContract(
    pre_propose_contract,
    JSON.stringify({
      propose: {
        msg: {
          propose: {
            title: 'Payment proposal',
            description: 'Send funds to good folks',
            msgs: payments.map((payment) =>
              createBankMassage(payment.recipient, payment.amount.toString()),
            ),
          },
        },
      },
    }),
  );

  const proposal_id = Number(
    getEventAttributesFromTx({ tx_response: resp }, 'wasm', ['proposal_id'])[0]
      .proposal_id,
  );
  return proposal_id;
};

const proposeUpdateSubDaoConfig = async (
  cm: CosmosWrapper,
  pre_propose_contract: string,
  core_contract: string,
  new_config: {
    name?: string;
    description?: string;
    dao_uri?: string;
  },
): Promise<number> => {
  const resp = await cm.executeContract(
    pre_propose_contract,
    JSON.stringify({
      propose: {
        msg: {
          propose: {
            title: 'update subDAO config',
            description: 'sets subDAO config to new value',
            msgs: [
              {
                wasm: {
                  execute: {
                    contract_addr: core_contract,
                    msg: Buffer.from(
                      JSON.stringify({
                        update_config: new_config,
                      }),
                    ).toString('base64'),
                    funds: [],
                  },
                },
              },
            ],
          },
        },
      },
    }),
  );

  const proposal_id = Number(
    getEventAttributesFromTx({ tx_response: resp }, 'wasm', ['proposal_id'])[0]
      .proposal_id,
  );
  return proposal_id;
};

const supportAndExecuteProposal = async (
  cm: CosmosWrapper,
  propose_contract: string,
  timelock_contract: string,
  proposal_id: number,
): Promise<TimeLockSingleChoiceProposal> => {
  await cm.executeContract(
    propose_contract,
    JSON.stringify({
      vote: { proposal_id: proposal_id, vote: 'yes' },
    }),
  );

  await cm.executeContract(
    propose_contract,
    JSON.stringify({ execute: { proposal_id: proposal_id } }),
  );
  return await getTimelockedProposal(cm, timelock_contract, proposal_id);
};

const executeTimelockedProposal = async (
  cm: CosmosWrapper,
  timelock_contract: string,
  proposal_id: number,
): Promise<InlineResponse20075TxResponse> =>
  cm.executeContract(
    timelock_contract,
    JSON.stringify({
      execute_proposal: {
        proposal_id: proposal_id,
      },
    }),
  );

const overruleTimelockedProposal = async (
  cm: CosmosWrapper,
  timelock_contract: string,
  proposal_id: number,
): Promise<InlineResponse20075TxResponse> =>
  cm.executeContract(
    timelock_contract,
    JSON.stringify({
      overrule_proposal: {
        proposal_id: proposal_id,
      },
    }),
  );

const getTimelockedProposal = async (
  cm: CosmosWrapper,
  timelock_contract: string,
  proposal_id: number,
): Promise<TimeLockSingleChoiceProposal> =>
  cm.queryContract<TimeLockSingleChoiceProposal>(timelock_contract, {
    proposal: {
      proposal_id: proposal_id,
    },
  });
