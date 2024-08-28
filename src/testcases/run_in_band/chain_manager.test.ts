/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@neutron-org/neutronjsplus';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import {
  addCronScheduleProposal,
  removeCronScheduleProposal,
  updateCronParamsProposal,
  updateDexParamsProposal,
  updateTokenfactoryParamsProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';
import { LocalState } from '../../helpers/local_state';
import { RunnerTestSuite, inject } from 'vitest';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import { setupSubDaoTimelockSet } from '../../helpers/dao';
import { QueryClientImpl as CronQueryClient } from '@neutron-org/neutronjs/neutron/cron/query.rpc.Query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { QueryClientImpl as TokenfactoryQueryClient } from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/query.rpc.Query';
import { QueryClientImpl as DexQueryClient } from '@neutron-org/neutronjs/neutron/dex/query.rpc.Query';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import config from '../../config.json';
import { chainManagerWrapper } from '@neutron-org/neutronjsplus/src/proposal';

describe('Neutron / Chain Manager', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let subdaoMember1: DaoMember;
  let mainDaoMember: DaoMember;
  let securityDaoAddr: string;
  let subDao: Dao;
  let mainDao: Dao;
  let cronQuerier: CronQueryClient;
  let tokenfactoryQuerier: TokenfactoryQueryClient;
  let dexQuerier: DexQueryClient;
  let chainManagerAddress: string;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    const neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    const securityDaoWallet = await testState.nextWallet('neutron');
    securityDaoAddr = securityDaoWallet.address;
    const neutronRpcClient = await testState.rpcClient('neutron');
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);

    mainDao = new Dao(neutronClient, daoContracts);
    mainDaoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );
    await mainDaoMember.bondFunds('10000');

    subDao = await setupSubDaoTimelockSet(
      neutronWallet.address,
      neutronClient,
      mainDao.contracts.core.address,
      securityDaoAddr,
      true,
    );

    subdaoMember1 = new DaoMember(
      subDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );

    const subDaosList = await mainDao.getSubDaoList();
    expect(subDaosList).toContain(subDao.contracts.core.address);

    const votingPower = await subdaoMember1.queryVotingPower();
    expect(votingPower.power).toEqual('1');

    const queryClient = new AdminQueryClient(neutronRpcClient);
    const admins = await queryClient.admins();
    chainManagerAddress = admins.admins[0];

    tokenfactoryQuerier = new TokenfactoryQueryClient(neutronRpcClient);
    cronQuerier = new CronQueryClient(neutronRpcClient);
    dexQuerier = new DexQueryClient(neutronRpcClient);
  });

  // We need to do this because the real main dao has a super long voting period.
  // In the subdao tests, a new set of dao contracts was deployed with a smaller
  // period, but feels like an overkill here.
  describe('Change the overrule proposal voting period', () => {
    let proposalId: number;
    test('create proposal', async () => {
      const currentOverruleProposalConfig =
        await neutronClient.queryContractSmart(
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

  describe('Add an ALLOW_ONLY strategy for module parameter updates (Cron, Tokenfactory, Dex), and legacy param changes)', () => {
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
                  update_cron_params_permission: {
                    security_address: true,
                    limit: true,
                  },
                },
                {
                  cron_permission: {
                    add_schedule: true,
                    remove_schedule: true,
                  },
                },
                {
                  update_tokenfactory_params_permission: {
                    denom_creation_fee: true,
                    denom_creation_gas_consume: true,
                    fee_collector_address: true,
                    whitelisted_hooks: true,
                  },
                },
                {
                  update_dex_params_permission: {
                    fee_tiers: true,
                    paused: true,
                    max_jits_per_block: true,
                    good_til_purge_allowance: true,
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

      const cronParams = await cronQuerier.params();
      expect(cronParams.params.limit).toEqual(42n);
    });
  });

  describe('ALLOW_ONLY: change TOKENFACTORY parameters', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitUpdateParamsTokenfactoryProposal(
        chainManagerAddress,
        'Proposal #2',
        'Cron update params proposal. Will pass',
        updateTokenfactoryParamsProposal({
          denom_creation_fee: [{ denom: 'untrn', amount: '1' }],
          denom_creation_gas_consume: 20,
          fee_collector_address:
            'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
          whitelisted_hooks: [
            {
              code_id: 1,
              denom_creator: 'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
            },
          ],
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

      const tokenfactoryParams = await tokenfactoryQuerier.params();
      expect(tokenfactoryParams.params.denomCreationFee).toEqual([
        { denom: 'untrn', amount: '1' },
      ]);
      expect(tokenfactoryParams.params.denomCreationGasConsume).toEqual(20n);
      expect(tokenfactoryParams.params.feeCollectorAddress).toEqual(
        'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
      );
      expect(tokenfactoryParams.params.whitelistedHooks).toEqual([
        {
          codeId: 1n,
          denomCreator: 'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
        },
      ]);
    });
  });
  describe('ALLOW_ONLY: change DEX parameters', () => {
    let proposalId: number;
    const newParams = {
      fee_tiers: [1, 2, 99],
      paused: true,
      max_jits_per_block: 11,
      good_til_purge_allowance: 50000,
    };
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitUpdateParamsDexProposal(
        chainManagerAddress,
        'Proposal #1',
        'dex update params proposal. Will pass',
        updateDexParamsProposal(newParams),
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

      const dexParams = await dexQuerier.params();
      expect(dexParams.params.feeTiers).toEqual([1n, 2n, 99n]);
      expect(dexParams.params.paused).toEqual(true);
      expect(dexParams.params.maxJitsPerBlock).toEqual(11n);
      expect(dexParams.params.goodTilPurgeAllowance).toEqual(50000n);
    });
  });

  describe('ALLOW_ONLY: CRON add schedule / remove schedule', () => {
    let proposalId: number;
    const scheduleName = 'schedule1';

    test('create addSchedule proposal', async () => {
      const info = {
        name: 'schedule1',
        period: 100,
        msgs: [
          {
            contract: 'whatever',
            msg: JSON.stringify({}),
          },
        ],
        execution_stage: 0,
      };
      proposalId = await subdaoMember1.submitSingleChoiceProposal(
        'Add schedule',
        'cron add schedule proposal. Will pass',
        [
          chainManagerWrapper(
            chainManagerAddress,
            addCronScheduleProposal(info),
          ),
        ],
        '1000',
      );

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked addSchedule: success', async () => {
      await waitSeconds(10);

      await subdaoMember1.executeTimelockedProposal(proposalId);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);

      const res = await cronQuerier.schedule({ name: scheduleName });
      expect(res.schedule.name).toEqual(scheduleName);
      expect(res.schedule.msgs.length).toEqual(1);
      expect(res.schedule.period).toEqual(100n);
    });

    test('create removeSchedule proposal', async () => {
      const info = {
        name: 'schedule1',
      };
      proposalId = await subdaoMember1.submitSingleChoiceProposal(
        'Add schedule',
        'cron add schedule proposal. Will pass',
        [
          chainManagerWrapper(
            chainManagerAddress,
            removeCronScheduleProposal(info),
          ),
        ],
        '1000',
      );

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked removeSchedule: success', async () => {
      await waitSeconds(10);

      await subdaoMember1.executeTimelockedProposal(proposalId);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);

      let exceptionThrown = false;
      try {
        await cronQuerier.schedule({ name: scheduleName });
      } catch (error) {
        expect(error.message).toMatch(/schedule not found: key not found/);
        exceptionThrown = true;
      }
      expect(exceptionThrown).toBeTruthy();
    });
  });
});
