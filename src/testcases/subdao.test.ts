import {
  CosmosWrapper,
  NEUTRON_DENOM,
  VAULT_CONTRACT_ADDRESS,
  getEventAttributesFromTx,
  createBankMassage,
  NeutronContract,
} from '../helpers/cosmos';
import {
  TimelockConfig,
  TimelockProposalListResponse,
  TimeLockSingleChoiceProposal,
} from '../helpers/dao';
import {
  wait,
  waitBlocks,
  getWithAttempts,
  getRemoteHeight,
} from '../helpers/wait';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { Wallet } from '../types';

describe('Neutron / Subdao', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let cm3: CosmosWrapper;
  let main_dao_wallet: Wallet;
  let security_dao_wallet: Wallet;
  let demo2_wallet: Wallet;
  let main_dao_addr: AccAddress | ValAddress;
  let security_dao_addr: AccAddress | ValAddress;
  let demo2_addr: AccAddress | ValAddress;
  let subDAO: SubDAO;
  let timelocked_prop_id: number;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    main_dao_wallet = testState.wallets.neutron.demo1;
    security_dao_wallet = testState.wallets.neutron.icq;
    demo2_wallet = testState.wallets.neutron.demo2;
    main_dao_addr = main_dao_wallet.address;
    security_dao_addr = security_dao_wallet.address;
    demo2_addr = demo2_wallet.address;
    cm = new CosmosWrapper(testState.sdk1, main_dao_wallet, NEUTRON_DENOM);
    cm2 = new CosmosWrapper(testState.sdk1, security_dao_wallet, NEUTRON_DENOM);
    cm3 = new CosmosWrapper(testState.sdk1, demo2_wallet, NEUTRON_DENOM);
    subDAO = await setupSubDaoTimelockSet(
      cm,
      main_dao_addr.toString(),
      security_dao_addr.toString(),
    );

    await cm.bondFunds(VAULT_CONTRACT_ADDRESS, '10000');
    await getWithAttempts(
      cm.sdk,
      async () =>
        await cm.queryVotingPower(
          subDAO.core.address,
          main_dao_addr.toString(),
        ),
      async (response) => response.power == '10000',
      20,
    );
    await cm.msgSend(subDAO.core.address, '10000'); // funding for gas
  });

  describe('Timelock: Unauthorized', () => {
    test('Unauthorized timelock', async () => {
      await expect(
        cm.executeContract(
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
    test('proposal timelock', async () => {
      const resp = await cm.executeContract(
        subDAO.prepropose.address,
        JSON.stringify({
          propose: {
            msg: {
              propose: {
                title: 'Proposal 1',
                description: 'proposal 1 description',
                msgs: [
                  createBankMassage(main_dao_addr.toString(), '1000'),
                  createBankMassage(demo2_addr.toString(), '2000'),
                ],
              },
            },
          },
        }),
      );

      timelocked_prop_id = Number(
        getEventAttributesFromTx({ tx_response: resp }, 'wasm', [
          'proposal_id',
        ])[0].proposal_id,
      );

      await cm.executeContract(
        subDAO.propose.address,
        JSON.stringify({
          vote: { proposal_id: timelocked_prop_id, vote: 'yes' },
        }),
      );

      await cm.executeContract(
        subDAO.propose.address,
        JSON.stringify({ execute: { proposal_id: timelocked_prop_id } }),
      );

      const timelocked_prop =
        await cm.queryContract<TimeLockSingleChoiceProposal>(
          subDAO.timelock.address,
          {
            proposal: {
              proposal_id: timelocked_prop_id,
            },
          },
        );
      expect(timelocked_prop.id).toEqual(timelocked_prop_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked: nonexistant ', async () => {
      await expect(
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            execute_proposal: {
              proposal_id: 1_000_000,
            },
          }),
        ),
      ).rejects.toThrow(/SingleChoiceProposal not found/);
    });

    test('execute timelocked: timelock_duration have not pass', async () => {
      await expect(
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            execute_proposal: {
              proposal_id: timelocked_prop_id,
            },
          }),
        ),
      ).rejects.toThrow(/Proposal is timelocked/);
    });

    test('execute timelocked: execution failed', async () => {
      //wait for timelock durations
      await wait(20);
      // timelocked proposal execution failed due to insufficient funds on timelock contract
      await cm.executeContract(
        subDAO.timelock.address,
        JSON.stringify({
          execute_proposal: {
            proposal_id: timelocked_prop_id,
          },
        }),
      );
      // TODO: check the reason of the failure
      const timelocked_prop =
        await cm.queryContract<TimeLockSingleChoiceProposal>(
          subDAO.timelock.address,
          {
            proposal: {
              proposal_id: timelocked_prop_id,
            },
          },
        );
      expect(timelocked_prop.id).toEqual(timelocked_prop_id);
      expect(timelocked_prop.status).toEqual('execution_failed');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            execute_proposal: {
              proposal_id: timelocked_prop_id,
            },
          }),
        ),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
    });

    test('overrule timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            execute_proposal: {
              proposal_id: timelocked_prop_id,
            },
          }),
        ),
      ).rejects.toThrow(/Wrong proposal status \(execution_failed\)/);
    });
  });

  describe('Timelock: Succeed execution', () => {
    beforeAll(async () => {
      const resp = await cm.executeContract(
        subDAO.prepropose.address,
        JSON.stringify({
          propose: {
            msg: {
              propose: {
                title: 'Proposal 1',
                description: 'proposal 1 description',
                msgs: [
                  createBankMassage(main_dao_addr.toString(), '1000'),
                  createBankMassage(demo2_addr.toString(), '2000'),
                ],
              },
            },
          },
        }),
      );

      timelocked_prop_id = Number(
        getEventAttributesFromTx({ tx_response: resp }, 'wasm', [
          'proposal_id',
        ])[0].proposal_id,
      );

      await cm.executeContract(
        subDAO.propose.address,
        JSON.stringify({
          vote: { proposal_id: timelocked_prop_id, vote: 'yes' },
        }),
      );

      await cm.executeContract(
        subDAO.propose.address,
        JSON.stringify({ execute: { proposal_id: timelocked_prop_id } }),
      );

      const timelocked_prop =
        await cm.queryContract<TimeLockSingleChoiceProposal>(
          subDAO.timelock.address,
          {
            proposal: {
              proposal_id: timelocked_prop_id,
            },
          },
        );
      expect(timelocked_prop.id).toEqual(timelocked_prop_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked: success', async () => {
      await cm.msgSend(subDAO.timelock.address, '20000'); // funding for gas
      const balance_main_dao = await cm.queryBalances(main_dao_addr.toString());
      const balance_demo2 = await cm.queryBalances(demo2_addr.toString());
      await wait(20);
      await cm.executeContract(
        subDAO.timelock.address,
        JSON.stringify({
          execute_proposal: {
            proposal_id: timelocked_prop_id,
          },
        }),
      );
      const balance_main_dao_after = await cm.queryBalances(
        main_dao_addr.toString(),
      );
      const balance_demo2_after = await cm.queryBalances(demo2_addr.toString());
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

      const timelocked_prop =
        await cm.queryContract<TimeLockSingleChoiceProposal>(
          subDAO.timelock.address,
          {
            proposal: {
              proposal_id: timelocked_prop_id,
            },
          },
        );
      expect(timelocked_prop.id).toEqual(timelocked_prop_id);
      expect(timelocked_prop.status).toEqual('executed');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked(Executed): WrongStatus error', async () => {
      await expect(
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            execute_proposal: {
              proposal_id: timelocked_prop_id,
            },
          }),
        ),
      ).rejects.toThrow(/Wrong proposal status \(executed\)/);
    });

    test('overrule timelocked(ExecutionFailed): WrongStatus error', async () => {
      await expect(
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            execute_proposal: {
              proposal_id: timelocked_prop_id,
            },
          }),
        ),
      ).rejects.toThrow(/Wrong proposal status \(executed\)/);
    });
  });

  describe('Overrule timelocked', () => {
    beforeAll(async () => {
      const resp = await cm.executeContract(
        subDAO.prepropose.address,
        JSON.stringify({
          propose: {
            msg: {
              propose: {
                title: 'Proposal 1',
                description: 'proposal 1 description',
                msgs: [
                  createBankMassage(main_dao_addr.toString(), '1000'),
                  createBankMassage(demo2_addr.toString(), '2000'),
                ],
              },
            },
          },
        }),
      );

      timelocked_prop_id = Number(
        getEventAttributesFromTx({ tx_response: resp }, 'wasm', [
          'proposal_id',
        ])[0].proposal_id,
      );

      await cm.executeContract(
        subDAO.propose.address,
        JSON.stringify({
          vote: { proposal_id: timelocked_prop_id, vote: 'yes' },
        }),
      );

      await cm.executeContract(
        subDAO.propose.address,
        JSON.stringify({ execute: { proposal_id: timelocked_prop_id } }),
      );

      const timelocked_prop =
        await cm.queryContract<TimeLockSingleChoiceProposal>(
          subDAO.timelock.address,
          {
            proposal: {
              proposal_id: timelocked_prop_id,
            },
          },
        );
      expect(timelocked_prop.id).toEqual(timelocked_prop_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('overrule timelocked(Timelocked): Unauthorized', async () => {
      await expect(
        cm3.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            overrule_proposal: {
              proposal_id: timelocked_prop_id,
            },
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('overrule timelocked(Timelocked): Success', async () => {
      await cm.executeContract(
        subDAO.timelock.address,
        JSON.stringify({
          overrule_proposal: {
            proposal_id: timelocked_prop_id,
          },
        }),
      );
      const timelocked_prop =
        await cm.queryContract<TimeLockSingleChoiceProposal>(
          subDAO.timelock.address,
          {
            proposal: {
              proposal_id: timelocked_prop_id,
            },
          },
        );
      expect(timelocked_prop.id).toEqual(timelocked_prop_id);
      expect(timelocked_prop.status).toEqual('overruled');
      expect(timelocked_prop.msgs).toHaveLength(2);
    });

    test('execute timelocked(Overruled): WrongStatus error', async () => {
      await expect(
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            overrule_proposal: {
              proposal_id: timelocked_prop_id,
            },
          }),
        ),
      ).rejects.toThrow(/Wrong proposal status \(overruled\)/);
    });
  });

  describe('execution control', () => {
    const funding = 1000;
    let proposal_id: number;
    test('create a proposal to fund security DAO', async () => {
      const resp = await cm.executeContract(
        subDAO.prepropose.address,
        JSON.stringify({
          propose: {
            msg: {
              propose: {
                title: 'security DAO funding',
                description: 'send 1000 uNTRN to the security DAO',
                msgs: [
                  createBankMassage(
                    security_dao_addr.toString(),
                    String(funding),
                  ),
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

      await cm.voteYes(
        subDAO.propose.address,
        proposal_id,
        main_dao_addr.toString(),
      );
      await cm.checkPassedProposal(subDAO.propose.address, proposal_id);
    });
    test('pause subDAO', async () => {
      let pauseInfo = await cm.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);

      // pause subDAO on behalf of the security DAO
      const pauseHeight = await getRemoteHeight(cm.sdk); // an approximate one
      const res = await cm.executeContract(
        subDAO.core.address,
        JSON.stringify({
          pause: {
            duration: 50,
          },
        }),
      );
      expect(res.code).toEqual(0);

      // check contract's pause info after pausing
      pauseInfo = await cm.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo.unpaused).toEqual(undefined);
      expect(pauseInfo.paused.until_height).toBeGreaterThan(pauseHeight);
    });
    test('execute proposal when subDAO is paused', async () => {
      await expect(
        cm.executeProposalWithAttempts(subDAO.propose.address, proposal_id),
      ).rejects.toThrow(/Contract execution is paused/);
      await expect(
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            execute_proposal: {
              proposal_id: proposal_id,
            },
          }),
        ),
      ).rejects.toThrow(/SingleChoiceProposal not found/);
    });
    test('unpause subDAO', async () => {
      // unpause subDAO on behalf of the main DAO
      const res = await cm.executeContract(
        subDAO.core.address,
        JSON.stringify({
          unpause: {},
        }),
      );
      expect(res.code).toEqual(0);

      // check contract's pause info after unpausing
      const pauseInfo = await cm.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);
    });
    test('execute proposal when subDAO is unpaused', async () => {
      await cm.msgSend(subDAO.timelock.address, '10000'); // funding for gas
      const beforeExecBalance = await cm.queryBalances(
        security_dao_addr.toString(),
      );
      await cm.executeProposalWithAttempts(subDAO.propose.address, proposal_id);

      await wait(20); // wait until timelock duration passes
      await cm.executeContract(
        subDAO.timelock.address,
        JSON.stringify({
          execute_proposal: {
            proposal_id: proposal_id,
          },
        }),
      );
      const timelocked_prop =
        await cm.queryContract<TimeLockSingleChoiceProposal>(
          subDAO.timelock.address,
          {
            proposal: {
              proposal_id: proposal_id,
            },
          },
        );
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('executed');
      expect(timelocked_prop.msgs).toHaveLength(1);

      const afterExecBalance = await cm.queryBalances(
        security_dao_addr.toString(),
      );
      expect(+afterExecBalance.balances[0].amount).toEqual(
        +beforeExecBalance.balances[0].amount + funding,
      );
    });

    test('auto unpause on pause timeout', async () => {
      // pause subDAO on behalf of the Neutron DAO
      const short_pause_duration = 5;
      const pauseHeight = await getRemoteHeight(cm.sdk); // an approximate one
      const res = await cm.executeContract(
        subDAO.core.address,
        JSON.stringify({
          pause: {
            duration: short_pause_duration,
          },
        }),
      );
      expect(res.code).toEqual(0);

      // check contract's pause info after pausing
      let pauseInfo = await cm.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo.unpaused).toEqual(undefined);
      expect(pauseInfo.paused.until_height).toBeGreaterThan(pauseHeight);

      // wait and check contract's pause info after unpausing
      await waitBlocks(cm.sdk, short_pause_duration);
      pauseInfo = await cm.queryPausedInfo(subDAO.core.address);
      expect(pauseInfo).toEqual({ unpaused: {} });
      expect(pauseInfo.paused).toEqual(undefined);
    });
  });

  describe('Update config', () => {
    test('Update config: Unauthorized', async () => {
      await expect(
        cm3.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: Incorrect owner address format', async () => {
      await expect(
        cm.executeContract(
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
        cm.executeContract(
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
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            update_config: {
              timelock_duration: -1,
            },
          }),
        ),
      ).rejects.toThrow(
        /Error parsing into type neutron_timelock::single::ExecuteMsg: Invalid number/,
      );
    });

    test('Update config: timelock duration success', async () => {
      await cm.executeContract(
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

      const c = await cm.queryContract<TimelockConfig>(
        subDAO.timelock.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });

    test('Update config: owner success', async () => {
      await cm.executeContract(
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

      const c = await cm.queryContract<TimelockConfig>(
        subDAO.timelock.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });

    test('Update config: old owner lost update rights', async () => {
      await expect(
        cm.executeContract(
          subDAO.timelock.address,
          JSON.stringify({
            update_config: {},
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
    });

    test('Update config: update both params with new owner', async () => {
      await cm3.executeContract(
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

      const c = await cm.queryContract<TimelockConfig>(
        subDAO.timelock.address,
        {
          config: {},
        },
      );
      expect(c).toEqual(expectedConfig);
    });
  });

  describe('Query Proposals', () => {
    let subDAOQueryTestScope: SubDAO;
    beforeAll(async () => {
      subDAOQueryTestScope = await setupSubDaoTimelockSet(
        cm,
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );

      for (let i = 1; i <= 35; i++) {
        const resp = await cm.executeContract(
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
        timelocked_prop_id = Number(
          getEventAttributesFromTx({ tx_response: resp }, 'wasm', [
            'proposal_id',
          ])[0].proposal_id,
        );

        await cm.executeContract(
          subDAOQueryTestScope.propose.address,
          JSON.stringify({
            vote: { proposal_id: timelocked_prop_id, vote: 'yes' },
          }),
        );

        await cm.executeContract(
          subDAOQueryTestScope.propose.address,
          JSON.stringify({ execute: { proposal_id: timelocked_prop_id } }),
        );
      }
    });

    test('Query proposals', async () => {
      const proposals = await cm.queryContract<TimelockProposalListResponse>(
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
      const proposals = await cm.queryContract<TimelockProposalListResponse>(
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
      const proposals = await cm.queryContract<TimelockProposalListResponse>(
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
      const proposals = await cm.queryContract<TimelockProposalListResponse>(
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

  // TODO: uncomment when overrule handler updated to take into account timelock_duration
  // handler should fail
  // describe("Overrule timelocked: timelock duration has passed", () => {
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

  //     timelocked_prop_id = Number(getEventAttributesFromTx({ tx_response: resp }, 'wasm', [
  //       'proposal_id'
  //     ])[0].proposal_id);

  //     await cm.executeContract(subDAO.propose.address, JSON.stringify({ vote: { proposal_id: timelocked_prop_id, vote: 'yes' } }))

  //     await cm.executeContract(subDAO.propose.address, JSON.stringify({ execute: { proposal_id: timelocked_prop_id } }))

  //     let timelocked_prop = await cm.queryContract<TimeLockSingleChoiceProposal>(subDAO.timelock.address, {
  //       proposal: {
  //         proposal_id: timelocked_prop_id,
  //       }
  //     })
  //     expect(timelocked_prop.id).toEqual(timelocked_prop_id)
  //     expect(timelocked_prop.status).toEqual("timelocked")
  //     expect(timelocked_prop.msgs).toHaveLength(2)
  //   })

  // test('execute timelocked(Overruled): TimelockDuration error', async () => {
  //   await wait(20)
  //   await expect(cm.executeContract(subDAO.timelock.address, JSON.stringify({
  //     overrule_proposal: {
  //       proposal_id: timelocked_prop_id,
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
  const votingModuleInstantiateInfo = {
    code_id: 4, // contract uploaded during genesis initialization stage,
    label: 'DAO_Neutron_voting_registry',
    msg: Buffer.from(
      JSON.stringify({
        manager: null,
        owner: null,
        voting_vault: VAULT_CONTRACT_ADDRESS,
      }),
    ).toString('base64'),
  };
  const proposeInstantiateMessage = {
    threshold: { absolute_count: { threshold: '1' } },
    max_voting_period: { height: 10 },
    allow_revoting: false,
    pre_propose_info: {
      ModuleMayPropose: {
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
                    owner: main_dao_addr,
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
    description: '',
    vote_module_instantiate_info: votingModuleInstantiateInfo,
    proposal_modules_instantiate_info: [proposalModuleInstantiateInfo],
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
