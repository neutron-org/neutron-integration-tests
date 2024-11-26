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
  updateCronParamsProposal,
  updateDexParamsProposal,
  updateTokenfactoryParamsProposal,
  AddSchedule,
  RemoveSchedule,
  updateGlobalFeeParamsProposal,
  updateConsumerParamsProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';
import { LocalState } from '../../helpers/local_state';
import { RunnerTestSuite, inject } from 'vitest';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import { setupSubDaoTimelockSet } from '../../helpers/dao';
import { QueryClientImpl as CronQueryClient } from '@neutron-org/neutronjs/neutron/cron/query.rpc.Query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { QueryClientImpl as TokenfactoryQueryClient } from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/query.rpc.Query';
import { QueryClientImpl as UpgradeQueryClient } from '@neutron-org/neutronjs/cosmos/upgrade/v1beta1/query.rpc.Query';
import { QueryClientImpl as DexQueryClient } from '@neutron-org/neutronjs/neutron/dex/query.rpc.Query';
import { QueryClientImpl as DynamicfeesQueryClient } from '@neutron-org/neutronjs/neutron/dynamicfees/v1/query.rpc.Query';
import { QueryClientImpl as GlobalfeeQueryClient } from '@neutron-org/neutronjs/gaia/globalfee/v1beta1/query.rpc.Query';
import { QueryClientImpl as CCVQueryClient } from '@neutron-org/neutronjs/interchain_security/ccv/consumer/v1/query.rpc.Query';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import config from '../../config.json';
import { Wallet } from '../../helpers/wallet';
import { ADMIN_MODULE_ADDRESS } from '@neutron-org/neutronjsplus/dist/constants';
import { Duration } from '@neutron-org/neutronjs/google/protobuf/duration';

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
  let dynamicfeesQuerier: DynamicfeesQueryClient;
  let globalfeeQuerier: GlobalfeeQueryClient;
  let ccvQuerier: CCVQueryClient;
  let upgradeQuerier: UpgradeQueryClient;
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
    upgradeQuerier = new UpgradeQueryClient(neutronRpcClient);
    dynamicfeesQuerier = new DynamicfeesQueryClient(neutronRpcClient);
    globalfeeQuerier = new GlobalfeeQueryClient(neutronRpcClient);
    ccvQuerier = new CCVQueryClient(neutronRpcClient);
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
                {
                  update_ccv_params_permission: {
                    blocks_per_distribution_transmission: true,
                    distribution_transmission_channel: true,
                    provider_fee_pool_addr_str: true,
                    ccv_timeout_period: true,
                    transfer_timeout_period: true,
                    consumer_redistribution_fraction: true,
                    historical_entries: true,
                    unbonding_period: true,
                    soft_opt_out_threshold: true,
                    reward_denoms: true,
                    provider_reward_denoms: true,
                    retry_delay_period: true,
                  },
                },
                {
                  update_globalfee_params_permission: {
                    minimum_gas_prices: true,
                    bypass_min_fee_msg_types: true,
                    max_total_bypass_min_fee_msg_gas_usage: true,
                  },
                },
                {
                  update_dynamicfees_params_permission: {
                    ntrn_prices: true,
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
      // types mixed on purpose, to check contract parser.
      // Numeric types in neutron-std can be deserialized from both number and string
      fee_tiers: ['1', '2', 99],
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

  describe('ALLOW_ONLY: change Dynamicfees parameters', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitDynamicfeesChangeParamsProposal(
        chainManagerAddress,
        'Proposal #2',
        'Dynamicfees update params proposal. Will pass',
        '1000',
        {
          ntrn_prices: [{ denom: 'newdenom', amount: '0.5' }],
        },
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

      const dynamicfeesParams = await dynamicfeesQuerier.params();
      expect(dynamicfeesParams.params.ntrnPrices).toEqual([
        { denom: 'newdenom', amount: '0.5' },
      ]);
    });
  });

  describe('ALLOW_ONLY: change Globalfee parameters', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitUpdateParamsGlobalfeeProposal(
        chainManagerAddress,
        'Proposal #3',
        'Globalfee update params proposal. Will pass',
        updateGlobalFeeParamsProposal({
          minimum_gas_prices: [{ denom: 'untrn', amount: '0.00111' }],
          bypass_min_fee_msg_types: ['/gaia.globalfee.v1beta1.MsgUpdateParams'],
          max_total_bypass_min_fee_msg_gas_usage: '12345',
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

      const globalfeeParams = await globalfeeQuerier.params();
      expect(globalfeeParams.params.minimumGasPrices).toEqual([
        { denom: 'untrn', amount: '0.00111' },
      ]);
      expect(globalfeeParams.params.bypassMinFeeMsgTypes).toEqual([
        '/gaia.globalfee.v1beta1.MsgUpdateParams',
      ]);
      expect(globalfeeParams.params.maxTotalBypassMinFeeMsgGasUsage).toEqual(
        12345n,
      );
    });
  });

  describe('ALLOW_ONLY: change ccv consumer parameters', () => {
    let proposalId: number;
    beforeAll(async () => {
      proposalId = await subdaoMember1.submitUpdateParamsConsumerProposal(
        chainManagerAddress,
        'Proposal #4',
        'Consumer update params proposal. Will pass',
        updateConsumerParamsProposal({
          enabled: true,
          blocksPerDistributionTransmission: 321n,
          distributionTransmissionChannel: 'channel-23',
          providerFeePoolAddrStr: chainManagerAddress,
          ccvTimeoutPeriod: Duration.fromPartial({ seconds: 32n }),
          transferTimeoutPeriod: Duration.fromPartial({ seconds: 23n }),
          consumerRedistributionFraction: '0.33',
          historicalEntries: 123n,
          unbondingPeriod: Duration.fromPartial({ seconds: 43n }),
          softOptOutThreshold: '0.55',
          rewardDenoms: ['tia'],
          providerRewardDenoms: ['tia'],
          retryDelayPeriod: Duration.fromPartial({ seconds: 43n }),
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
      console.log(
        'subdao',
        subdaoMember1.dao.contracts.proposals['single'].pre_propose.timelock
          .address,
      );
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);

      const ccvParams = await ccvQuerier.queryParams();
      expect(ccvParams.params.enabled).toEqual(true);
      expect(ccvParams.params.blocksPerDistributionTransmission).toEqual(321n);
      expect(ccvParams.params.distributionTransmissionChannel).toEqual(
        'channel-23',
      );
      expect(ccvParams.params.providerFeePoolAddrStr).toEqual(
        chainManagerAddress,
      );
      expect(ccvParams.params.ccvTimeoutPeriod).toEqual({
        nanos: 0,
        seconds: 32n,
      });
      expect(ccvParams.params.transferTimeoutPeriod).toEqual({
        nanos: 0,
        seconds: 23n,
      });
      expect(ccvParams.params.consumerRedistributionFraction).toEqual('0.33');
      expect(ccvParams.params.historicalEntries).toEqual(123n);
      expect(ccvParams.params.unbondingPeriod).toEqual({
        nanos: 0,
        seconds: 43n,
      });
      expect(ccvParams.params.softOptOutThreshold).toEqual('0.55');
      expect(ccvParams.params.rewardDenoms).toEqual(['tia']);
      expect(ccvParams.params.providerRewardDenoms).toEqual(['tia']);
      expect(ccvParams.params.retryDelayPeriod).toEqual({
        nanos: 0,
        seconds: 43n,
      });
    });
  });

  describe('ALLOW_ONLY: CRON add schedule / remove schedule', () => {
    let cronAccessClient: SigningNeutronClient;
    let cronAccessWallet: Wallet;
    beforeAll(async () => {
      cronAccessWallet = await testState.nextWallet('neutron');
      cronAccessClient = await SigningNeutronClient.connectWithSigner(
        testState.rpcNeutron,
        cronAccessWallet.directwallet,
        cronAccessWallet.address,
      );
    });

    // grant the expected chain manager strategy to the wallet using Neutron DAO proposal
    describe('assign cron access permissions', async () => {
      let proposalId: number;
      it('create proposal', async () => {
        const assignCronMsg = buildAddCronSchedulesStrategyMsg(
          cronAccessWallet.address,
          true,
          true,
        );

        proposalId = await mainDaoMember.submitSingleChoiceProposal(
          'Assign cron schedules permissions',
          'Assign cron schedules permissions to an authority',
          [
            {
              wasm: {
                execute: {
                  contract_addr: chainManagerAddress,
                  msg: Buffer.from(JSON.stringify(assignCronMsg)).toString(
                    'base64',
                  ),
                  funds: [],
                },
              },
            },
          ],
          '1000',
        );
      });

      it('vote and execute', async () => {
        await mainDaoMember.voteYes(proposalId);
        await mainDao.checkPassedProposal(proposalId);
        await mainDaoMember.executeProposalWithAttempts(proposalId);
      });
    });

    const scheduleName = 'schedule1';
    test('add cron schedule', async () => {
      await cronAccessClient.execute(
        chainManagerAddress,
        {
          execute_messages: {
            messages: [
              buildAddCronScheduleMsg({
                name: scheduleName,
                period: 100,
                msgs: [
                  {
                    contract: 'whatever',
                    msg: JSON.stringify({}),
                  },
                ],
                execution_stage: 0,
              }),
            ],
          },
        },
        [],
        'auto',
      );

      const res = await cronQuerier.schedule({ name: scheduleName });
      expect(res.schedule.name).toEqual(scheduleName);
      expect(res.schedule.msgs.length).toEqual(1);
      expect(res.schedule.period).toEqual(100n);
    });

    test('remove cron schedule', async () => {
      await cronAccessClient.execute(
        chainManagerAddress,
        {
          execute_messages: {
            messages: [buildRemoveCronScheduleMsg({ name: scheduleName })],
          },
        },
        [],
        'auto',
      );

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

  describe('ALLOW_ONLY: software upgrade', () => {
    // only upgrade permission
    let upgradeOnlyClient: SigningNeutronClient;
    let upgradeOnlyWallet: Wallet;

    // only cancel upgrade permission
    let cancelUpgradeOnlyClient: SigningNeutronClient;
    let cancelUpgradeOnlyWallet: Wallet;

    // upgrade and cancel upgrade permissions
    let fullUpgradeAccessClient: SigningNeutronClient;
    let fullUpgradeAccessWallet: Wallet;

    beforeAll(async () => {
      upgradeOnlyWallet = await testState.nextWallet('neutron');
      upgradeOnlyClient = await SigningNeutronClient.connectWithSigner(
        testState.rpcNeutron,
        upgradeOnlyWallet.directwallet,
        upgradeOnlyWallet.address,
      );

      cancelUpgradeOnlyWallet = await testState.nextWallet('neutron');
      cancelUpgradeOnlyClient = await SigningNeutronClient.connectWithSigner(
        testState.rpcNeutron,
        cancelUpgradeOnlyWallet.directwallet,
        cancelUpgradeOnlyWallet.address,
      );

      fullUpgradeAccessWallet = await testState.nextWallet('neutron');
      fullUpgradeAccessClient = await SigningNeutronClient.connectWithSigner(
        testState.rpcNeutron,
        fullUpgradeAccessWallet.directwallet,
        fullUpgradeAccessWallet.address,
      );
    });

    // grant the expected chain manager strategies to the wallets using Neutron DAO proposal
    describe('assign software upgrade permissions', async () => {
      let proposalId: number;
      it('create proposal', async () => {
        const assignUpgradeMsg = buildAddSoftwareUpgradeStrategyMsg(
          upgradeOnlyWallet.address,
          true,
          false,
        );
        const assignCancelMsg = buildAddSoftwareUpgradeStrategyMsg(
          cancelUpgradeOnlyWallet.address,
          false,
          true,
        );
        const assignFullMsg = buildAddSoftwareUpgradeStrategyMsg(
          fullUpgradeAccessWallet.address,
          true,
          true,
        );

        proposalId = await mainDaoMember.submitSingleChoiceProposal(
          'Assign software upgrade permissions',
          'Assign mixed software upgrade permissions to three authorities',
          [
            {
              wasm: {
                execute: {
                  contract_addr: chainManagerAddress,
                  msg: Buffer.from(JSON.stringify(assignUpgradeMsg)).toString(
                    'base64',
                  ),
                  funds: [],
                },
              },
            },
            {
              wasm: {
                execute: {
                  contract_addr: chainManagerAddress,
                  msg: Buffer.from(JSON.stringify(assignCancelMsg)).toString(
                    'base64',
                  ),
                  funds: [],
                },
              },
            },
            {
              wasm: {
                execute: {
                  contract_addr: chainManagerAddress,
                  msg: Buffer.from(JSON.stringify(assignFullMsg)).toString(
                    'base64',
                  ),
                  funds: [],
                },
              },
            },
          ],
          '1000',
        );
      });

      it('vote and execute', async () => {
        await mainDaoMember.voteYes(proposalId);
        await mainDao.checkPassedProposal(proposalId);
        await mainDaoMember.executeProposalWithAttempts(proposalId);
      });
    });

    describe('check software upgrade permissions', () => {
      // checking neutronClient's interaction with chain manager whereas this account
      // hasn't been given any permissions (the proposal above contains other authorities)
      it('random account cannot set or cancel', async () => {
        await expect(
          neutronClient.execute(
            chainManagerAddress,
            {
              execute_messages: {
                messages: [buildSetSoftwareUpgradeMsg('name', 100000, 'info')],
              },
            },
            [],
            'auto',
          ),
        ).rejects.toThrow(/Unauthorized/);
        await expect(
          neutronClient.execute(
            chainManagerAddress,
            {
              execute_messages: {
                messages: [buildCancelSoftwareUpgradeMsg()],
              },
            },
            [],
            'auto',
          ),
        ).rejects.toThrow(/Unauthorized/);
      });

      it('onlyCancel cannot set', async () => {
        await expect(
          cancelUpgradeOnlyClient.execute(
            chainManagerAddress,
            {
              execute_messages: {
                messages: [buildSetSoftwareUpgradeMsg('name', 100000, 'info')],
              },
            },
            [],
            'auto',
          ),
        ).rejects.toThrow(/Unauthorized/);
      });

      it('onlySet cannot cancel', async () => {
        await expect(
          upgradeOnlyClient.execute(
            chainManagerAddress,
            {
              execute_messages: {
                messages: [buildCancelSoftwareUpgradeMsg()],
              },
            },
            [],
            'auto',
          ),
        ).rejects.toThrow(/Unauthorized/);
      });

      describe('full access can both set and cancel', () => {
        it('assert no plan is currently configured', async () => {
          const plan = await upgradeQuerier.currentPlan({});
          expect(plan.plan).toBeUndefined();
        });

        it('set software upgrade', async () => {
          await fullUpgradeAccessClient.execute(
            chainManagerAddress,
            {
              execute_messages: {
                messages: [buildSetSoftwareUpgradeMsg('name', 100000, 'info')],
              },
            },
            [],
            'auto',
          );

          const plan = await upgradeQuerier.currentPlan({});
          expect(plan.plan.height.toString()).toEqual('100000');
        });

        it('cancel software upgrade', async () => {
          await fullUpgradeAccessClient.execute(
            chainManagerAddress,
            {
              execute_messages: {
                messages: [buildCancelSoftwareUpgradeMsg()],
              },
            },
            [],
            'auto',
          );

          const plan = await upgradeQuerier.currentPlan({});
          expect(plan.plan).toBeUndefined();
        });
      });

      describe('limited access can do what they are granted to do', () => {
        it('onlySet can set', async () => {
          await upgradeOnlyClient.execute(
            chainManagerAddress,
            {
              execute_messages: {
                messages: [buildSetSoftwareUpgradeMsg('name', 100000, 'info')],
              },
            },
            [],
            'auto',
          );

          const plan = await upgradeQuerier.currentPlan({});
          expect(plan.plan.height.toString()).toEqual('100000');
        });

        it('onlyCancel can cancel', async () => {
          await cancelUpgradeOnlyClient.execute(
            chainManagerAddress,
            {
              execute_messages: {
                messages: [buildCancelSoftwareUpgradeMsg()],
              },
            },
            [],
            'auto',
          );

          const plan = await upgradeQuerier.currentPlan({});
          expect(plan.plan).toBeUndefined();
        });
      });
    });
  });
});

// returns a wasm execute message to a chain manager that adds cron schedules permissions to
// a given authority.
const buildAddCronSchedulesStrategyMsg = (
  authority: string,
  add: boolean,
  remove: boolean,
): any => ({
  add_strategy: {
    address: authority,
    strategy: {
      allow_only: [
        {
          cron_permission: {
            add_schedule: add,
            remove_schedule: remove,
          },
        },
      ],
    },
  },
});

// returns a wasm execute message to a chain manager that adds software upgrade permissions to
// a given authority.
const buildAddSoftwareUpgradeStrategyMsg = (
  authority: string,
  upgrade: boolean,
  cancelUpgrade: boolean,
): any => ({
  add_strategy: {
    address: authority,
    strategy: {
      allow_only: [
        {
          software_upgrade_permission: {
            upgrade: upgrade,
            cancel_upgrade: cancelUpgrade,
          },
        },
      ],
    },
  },
});

// returns an adminmodule admin proposal message that creates a software upgrade plan.
const buildSetSoftwareUpgradeMsg = (
  name: string,
  height: number,
  info: string,
): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        proposal_execute_message: {
          message: JSON.stringify({
            '@type': '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade',
            authority: ADMIN_MODULE_ADDRESS,
            plan: {
              name,
              height,
              info,
            },
          }),
        },
      },
    },
  },
});

// returns an adminmodule admin proposal message that cancens the current software upgrade plan.
const buildCancelSoftwareUpgradeMsg = (): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        proposal_execute_message: {
          message: JSON.stringify({
            '@type': '/cosmos.upgrade.v1beta1.MsgCancelUpgrade',
            authority: ADMIN_MODULE_ADDRESS,
          }),
        },
      },
    },
  },
});

// returns a cron message that adds a new schedule.
const buildAddCronScheduleMsg = (payload: AddSchedule): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        proposal_execute_message: {
          message: JSON.stringify({
            '@type': '/neutron.cron.MsgAddSchedule',
            authority: ADMIN_MODULE_ADDRESS,
            ...payload,
          }),
        },
      },
    },
  },
});

// returns a cron message that removes a given schedule.
const buildRemoveCronScheduleMsg = (payload: RemoveSchedule): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        proposal_execute_message: {
          message: JSON.stringify({
            '@type': '/neutron.cron.MsgRemoveSchedule',
            authority: ADMIN_MODULE_ADDRESS,
            ...payload,
          }),
        },
      },
    },
  },
});
