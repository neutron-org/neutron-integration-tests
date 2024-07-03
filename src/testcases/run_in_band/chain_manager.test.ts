import { Registry } from '@cosmjs/proto-signing';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@neutron-org/neutronjsplus';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { updateCronParamsProposal } from '@neutron-org/neutronjsplus/dist/proposal';

import config from '../../config.json';
import { LocalState } from '../../helpers/localState';
import { Suite, inject } from 'vitest';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { neutronTypes } from '@neutron-org/neutronjsplus/dist/neutronTypes';
import { WasmWrapper, wasm } from '../../helpers/wasmClient';
import { setupSubDaoTimelockSet } from '../../helpers/dao';
import { QueryClientImpl as CronQuery } from '@neutron-org/neutronjs/neutron/cron/query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query';

describe('Neutron / Chain Manager', () => {
  let testState: LocalState;
  let neutronClient: WasmWrapper;
  let subdaoMember1: DaoMember;
  let mainDaoMember: DaoMember;
  let securityDaoAddr: string;
  let subDao: Dao;
  let mainDao: Dao;
  let cronQuery: CronQuery;
  let chainManagerAddress: string;

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics, suite);
    await testState.init();
    const neutronAccount1 = await testState.nextWallet('neutron');
    neutronClient = await wasm(
      testState.rpcNeutron,
      neutronAccount1,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );
    const securityDaoWallet = await testState.nextWallet('neutron');
    securityDaoAddr = securityDaoWallet.address;
    const neutronRpcClient = await testState.rpcClient('neutron');
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient.client,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(
      neutronClient.client,
      daoCoreAddress,
    );

    mainDao = new Dao(neutronClient.client, daoContracts);
    mainDaoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronAccount1.address,
      NEUTRON_DENOM,
    );
    await mainDaoMember.bondFunds('10000');

    subDao = await setupSubDaoTimelockSet(
      neutronAccount1.address,
      neutronClient,
      mainDao.contracts.core.address,
      securityDaoAddr,
      true,
    );

    subdaoMember1 = new DaoMember(
      subDao,
      neutronClient.client,
      neutronAccount1.address,
      NEUTRON_DENOM,
    );

    const subDaosList = await mainDao.getSubDaoList();
    expect(subDaosList).toContain(subDao.contracts.core.address);

    const votingPower = await subdaoMember1.queryVotingPower();
    expect(votingPower.power).toEqual('1');

    const queryClient = new AdminQueryClient(neutronRpcClient);
    const admins = await queryClient.Admins();
    chainManagerAddress = admins.admins[0];

    cronQuery = new CronQuery(neutronRpcClient);
  });

  // We need to do this because the real main dao has a super long voting period.
  // In the subdao tests, a new set of dao contracts was deployed with a smaller
  // period, but feels like an overkill here.
  describe('Change the overrule proposal voting period', () => {
    let proposalId: number;
    test('create proposal', async () => {
      const currentOverruleProposalConfig =
        await neutronClient.client.queryContractSmart(
          mainDao.contracts.proposals['overrule'].address,
          {
            config: {},
          },
        );
      currentOverruleProposalConfig['max_voting_period']['time'] = 5;
      proposalId = await mainDaoMember.submitSingleChoiceProposal(
        'Proposal',
        'Update the max voting period. It will pass',
        [
          {
            wasm: {
              execute: {
                contract_addr: mainDao.contracts.proposals['overrule'].address,
                msg: Buffer.from(
                  JSON.stringify({
                    update_config: {
                      threshold: currentOverruleProposalConfig['threshold'],
                      max_voting_period:
                        currentOverruleProposalConfig['max_voting_period'],
                      allow_revoting:
                        currentOverruleProposalConfig['allow_revoting'],
                      dao: currentOverruleProposalConfig['dao'],
                      close_proposal_on_execution_failure:
                        currentOverruleProposalConfig[
                          'close_proposal_on_execution_failure'
                        ],
                    },
                  }),
                ).toString('base64'),
                funds: [],
              },
            },
          },
        ],
        '1000',
      );
    });
    describe('vote for proposal', () => {
      test('vote YES from wallet 1', async () => {
        await mainDaoMember.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await mainDaoMember.executeProposalWithAttempts(proposalId);
      });
    });
  });

  describe('Add an ALLOW_ONLY strategy (Cron module parameter updates, legacy param changes)', () => {
    let proposalId: number;
    test('create proposal', async () => {
      proposalId = await mainDaoMember.submitAddChainManagerStrategyProposal(
        chainManagerAddress,
        'Proposal #2',
        'Add strategy proposal. It will pass',
        {
          add_strategy: {
            address: subDao.contracts.core.address,
            strategy: {
              allow_only: [
                {
                  param_change_permission: {
                    params: [
                      {
                        subspace: 'globalfee',
                        key: 'MaxTotalBypassMinFeeMsgGasUsage',
                      },
                    ],
                  },
                },
                {
                  update_params_permission: {
                    cron_update_params_permission: {
                      security_address: true,
                      limit: true,
                    },
                  },
                },
              ],
            },
          },
        },
        '1000',
      );
    });
    describe('vote for proposal', () => {
      test('vote YES from wallet 1', async () => {
        await mainDaoMember.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await mainDaoMember.executeProposalWithAttempts(proposalId);
      });
    });
  });

  describe('ALLOW_ONLY: change CRON parameters', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitUpdateParamsCronProposal(
        chainManagerAddress,
        'Proposal #1',
        'Cron update params proposal. Will pass',
        updateCronParamsProposal({
          security_address: mainDao.contracts.voting.address,
          limit: 42,
        }),
        '1000',
      );

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked: success', async () => {
      await waitSeconds(10);

      await subdaoMember1.executeTimelockedProposal(proposalId);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);

      const cronParams = await cronQuery.Params();
      expect(cronParams.params.limit).toEqual(BigInt(42));
    });
  });
});
