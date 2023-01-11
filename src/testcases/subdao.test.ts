import {
  CosmosWrapper,
  NEUTRON_DENOM,
  VAULT_CONTRACT_ADDRESS,
  getEventAttributesFromTx,
  createBankMassage,
  NeutronContract,
} from '../helpers/cosmos';
import { TimeLockSingleChoiceProposal } from '../helpers/dao';
import { wait } from '../helpers/wait';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';

describe('Neutron / Timelock', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm3: CosmosWrapper;
  let subDAO: SubDAO;
  let timelocked_prop_id: number;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cm3 = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo2,
      NEUTRON_DENOM,
    );
    subDAO = await setupSubDaoTimelockSet(
      cm,
      testState.wallets.neutron.demo1.address.toString(),
    );
    console.log(subDAO);

    await cm.bondFunds('10000');
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
                  createBankMassage(
                    testState.wallets.neutron.demo1.address.toString(),
                    '1000',
                  ),
                  createBankMassage(
                    testState.wallets.neutron.demo2.address.toString(),
                    '2000',
                  ),
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
                  createBankMassage(
                    testState.wallets.neutron.demo1.address.toString(),
                    '1000',
                  ),
                  createBankMassage(
                    testState.wallets.neutron.demo2.address.toString(),
                    '2000',
                  ),
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
      await cm.msgSend(subDAO.timelock.address, '10000');
      const balance_demo1 = await cm.queryBalances(
        testState.wallets.neutron.demo1.address.toString(),
      );
      const balance_demo2 = await cm.queryBalances(
        testState.wallets.neutron.demo2.address.toString(),
      );
      await wait(20);
      await cm.executeContract(
        subDAO.timelock.address,
        JSON.stringify({
          execute_proposal: {
            proposal_id: timelocked_prop_id,
          },
        }),
      );
      const balance_demo1_after = await cm.queryBalances(
        testState.wallets.neutron.demo1.address.toString(),
      );
      const balance_demo2_after = await cm.queryBalances(
        testState.wallets.neutron.demo2.address.toString(),
      );
      // -10000 gas fees
      expect(
        Number(
          balance_demo1_after.balances.find((b) => b.denom == NEUTRON_DENOM)!
            .amount,
        ),
      ).toEqual(
        Number(
          balance_demo1.balances.find((b) => b.denom == NEUTRON_DENOM)!.amount,
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
                  createBankMassage(
                    testState.wallets.neutron.demo1.address.toString(),
                    '1000',
                  ),
                  createBankMassage(
                    testState.wallets.neutron.demo2.address.toString(),
                    '2000',
                  ),
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
  //               createBankMassage(testState.wallets.neutron.demo1.address.toString(), "1000"),
  //               createBankMassage(testState.wallets.neutron.demo2.address.toString(), "2000"),
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
  ownder: string,
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
                    owner: ownder,
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
