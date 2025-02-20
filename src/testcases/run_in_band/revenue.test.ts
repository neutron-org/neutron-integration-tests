import '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import { Wallet } from '../../helpers/wallet';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { RunnerTestSuite, inject } from 'vitest';
import { IBC_USDC_DENOM, NEUTRON_DENOM } from '../../helpers/constants';
import { QueryClientImpl as RevenueQueryClient } from '@neutron-org/neutronjs/neutron/revenue/query.rpc.Query';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query.rpc.Query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import config from '../../config.json';

import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { execSync } from 'child_process';
import { PerformanceRequirement } from '@neutron-org/neutronjs/neutron/revenue/params';
import {
  ParamsRevenue,
  PaymentScheduleType,
  updateRevenueParamsProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';
import {
  QueryPaymentInfoResponse,
  QueryParamsResponse as QueryRevenueParamsResponse,
} from '@neutron-org/neutronjs/neutron/revenue/query';

BigInt.prototype.toJSON = function () {
  return Number(this);
};

const DEFAULT_SHEDULE_BLOCK_PERIOD = 40;

const VALIDATOR_CONTAINER = 'neutron-node-1';
const ORACLE_CONTAINER = 'setup-oracle-1-1';

const VALOPER_VAL2 = 'neutronvaloper1qnk2n4nlkpw9xfqntladh74w6ujtulwnqshepx';
const VALOPER_ACCOUNT_VAL2 = 'neutron1qnk2n4nlkpw9xfqntladh74w6ujtulwn6dwq8z';

/* 
revenue module setup
set_genesis_param_jq ".app_state.revenue.state.payment_schedule.blocks_per_period" "\"40\""              
set_genesis_param_jq ".app_state.revenue.state.payment_schedule.current_period_start_block" "\"0\""        
set_genesis_param_jq ".app_state.revenue.params.blocks_performance_requirement.allowed_to_miss" "\"0.1\"" # 4 blocks
set_genesis_param_jq ".app_state.revenue.params.blocks_performance_requirement.required_at_least" "\"0.4\"" # 16 blocks
set_genesis_param_jq ".app_state.revenue.params.oracle_votes_performance_requirement.allowed_to_miss" "\"0.1\"" # 4 blocks
set_genesis_param_jq ".app_state.revenue.params.oracle_votes_performance_requirement.required_at_least" "\"0.4\"" # 16 blocks
*/

// Due to the fact that the validator periodically loses blocks and oracle votes randomly,
// we cannot rely on exact numbers in tests.
// lost_blocks and lost_oracles can take the following values:
// 'no' - do not intentionally lose blocks (but may happen randomly)
// 'low' - lose 50% of allow_missed
// 'medium' - lose 50% of required_at_least
// 'high' - lose more than 100% of required_at_least

const REVENUE_CASES = [
  { lostBlocks: 'no', lostOracles: 'no' },
  { lostBlocks: 'no', lostOracles: 'low' },
  { lostBlocks: 'no', lostOracles: 'medium' },
  { lostBlocks: 'no', lostOracles: 'high' },
  { lostBlocks: 'low', lostOracles: 'no' },
  { lostBlocks: 'medium', lostOracles: 'no' },
  { lostBlocks: 'high', lostOracles: 'no' },
];

describe('Neutron / Revenue', () => {
  let testState: LocalState;
  let neutronWallet: Wallet;
  let neutronClient: SigningNeutronClient;
  let chainManagerAddress: string;
  let mainDao: Dao;
  let daoMember: DaoMember;

  let revenueQuerier: RevenueQueryClient;
  let bankQuerier: BankQueryClient;
  let blocksPerformanceRequirement: PerformanceRequirement;
  let oraclePerformanceRequirement: PerformanceRequirement;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    const neutronRpcClient = await testState.neutronRpcClient();
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    ); // add assert for some addresses
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);
    mainDao = new Dao(neutronClient, daoContracts);
    daoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );

    const queryClient = new AdminQueryClient(neutronRpcClient);
    const admins = await queryClient.admins();
    chainManagerAddress = admins.admins[0];

    revenueQuerier = new RevenueQueryClient(neutronRpcClient);
    bankQuerier = new BankQueryClient(neutronRpcClient);
  });

  describe('prepare: top up the module account', () => {
    describe('send a bit funds to the module account', () => {
      test('send funds from wallet to revenue treasury', async () => {
        const msg = {
          typeUrl: '/neutron.revenue.MsgFundTreasury',
          value: {
            sender: neutronClient.sender,
            amount: [
              {
                denom: NEUTRON_DENOM,
                amount: '100000000',
              },
            ],
          },
        };
        const res = await neutronClient.client.signAndBroadcast(
          neutronClient.sender,
          [msg],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );

        expect(res.code).toEqual(0);
      });

      // TODO: fix test
      test.skip('should fail: send funds from wallet to revenue treasury non ntrn', async () => {
        const msg = {
          typeUrl: '/neutron.revenue.MsgFundTreasury',
          value: {
            sender: neutronClient.sender,
            amount: [
              {
                denom: IBC_USDC_DENOM,
                amount: '100000000',
              },
            ],
          },
        };
        const res = await neutronClient.client.signAndBroadcast(
          neutronClient.sender,
          [msg],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );

        expect(res.code).toEqual(0);
      });

      test('bond from wallet', async () => {
        await daoMember.bondFunds('30000');
        await neutronClient.getWithAttempts(
          async () => await mainDao.queryVotingPower(daoMember.user),
          async (response) => response.power == 30000,
          20,
        );
      });
    });

    test('query states', async () => {
      const params = await revenueQuerier.params();
      blocksPerformanceRequirement = params.params.blocksPerformanceRequirement;
      oraclePerformanceRequirement =
        params.params.oracleVotesPerformanceRequirement;
    });
  });

  describe('revenue property tests', () => {
    test('wait the slinky to get up and running', async () => {
      for (;;) {
        try {
          await revenueQuerier.paymentInfo();
          break;
        } catch {
          await waitBlocks(1, neutronClient);
        }
      }

      await waitBlocks(10, neutronClient);

      const params = await revenueQuerier.params();
      // enable revenue by setting shedule type to block_based_payment_schedule_type
      await submitRevenueParamsProposal(
        params,
        revenueQuerier,
        daoMember,
        chainManagerAddress,
        mainDao,
        {
          block_based_payment_schedule_type: {
            blocks_per_period: '40',
          },
        },
      );
      // wait for state change
      await waitBlocks(1, neutronClient);
    });

    test.each(REVENUE_CASES)(
      'lostBlocks: $lostBlocks, lostOracles: $lostOracles',
      async ({ lostBlocks, lostOracles }) => {
        const paymentInfo = await revenueQuerier.paymentInfo();
        let valState = await revenueQuerier.validatorStats({
          valOperAddress: VALOPER_VAL2,
        });
        const valBalanceAtStart = await bankQuerier.balance({
          address: VALOPER_ACCOUNT_VAL2,
          denom: 'untrn',
        });
        if (lostOracles == 'low') {
          execSync('docker pause ' + ORACLE_CONTAINER);
          // 0-3
          await waitBlocks(1, neutronClient);
          execSync('docker unpause ' + ORACLE_CONTAINER);
        }
        if (lostOracles == 'medium') {
          execSync('docker pause ' + ORACLE_CONTAINER);
          // 4 - 23
          await waitBlocks(5, neutronClient);
          execSync('docker unpause ' + ORACLE_CONTAINER);
        }
        if (lostOracles == 'high') {
          execSync('docker pause ' + ORACLE_CONTAINER);
          // 24+
          await waitBlocks(25, neutronClient);
          execSync('docker unpause ' + ORACLE_CONTAINER);
        }

        if (lostBlocks == 'low') {
          execSync('docker pause ' + VALIDATOR_CONTAINER);
          // 0-3
          await waitBlocks(1, neutronClient);
          execSync('docker unpause ' + VALIDATOR_CONTAINER);
        }
        if (lostBlocks == 'medium') {
          execSync('docker pause ' + VALIDATOR_CONTAINER);
          // 4 - 23
          await waitBlocks(5, neutronClient);
          execSync('docker unpause ' + VALIDATOR_CONTAINER);
        }
        if (lostBlocks == 'high') {
          execSync('docker pause ' + VALIDATOR_CONTAINER);
          // 24+
          await waitBlocks(25, neutronClient);
          execSync('docker unpause ' + VALIDATOR_CONTAINER);
        }

        const height = await neutronClient.getHeight();
        await waitBlocks(
          Number(
            paymentInfo.paymentSchedule.blockBasedPaymentSchedule
              .blocksPerPeriod,
          ) +
            Number(
              paymentInfo.paymentSchedule.blockBasedPaymentSchedule
                .currentPeriodStartBlock,
            ) -
            height -
            1,
          neutronClient,
        );
        valState = await revenueQuerier.validatorStats({
          valOperAddress: VALOPER_VAL2,
        });
        // wait 2 blocks to ensure next perios begins
        // and validators got paid (or not when perf==0)
        await waitBlocks(2, neutronClient);
        //make sure new period started
        const nextPaymentInfo = await revenueQuerier.paymentInfo();
        expect(
          Number(
            nextPaymentInfo.paymentSchedule.blockBasedPaymentSchedule
              .currentPeriodStartBlock,
          ),
        ).gt(
          Number(
            paymentInfo.paymentSchedule.blockBasedPaymentSchedule
              .currentPeriodStartBlock,
          ),
        );

        const valBalanceAtFinish = await bankQuerier.balance({
          address: VALOPER_ACCOUNT_VAL2,
          denom: 'untrn',
        });
        const balDiff =
          +valBalanceAtFinish.balance.amount -
          +valBalanceAtStart.balance.amount;

        const blocksAtLeast =
          +blocksPerformanceRequirement.requiredAtLeast *
          Number(
            nextPaymentInfo.paymentSchedule.blockBasedPaymentSchedule
              .blocksPerPeriod,
          );
        const oracleVotesAtLeast =
          +oraclePerformanceRequirement.requiredAtLeast *
          Number(
            nextPaymentInfo.paymentSchedule.blockBasedPaymentSchedule
              .blocksPerPeriod,
          );

        if (
          valState.stats.validatorInfo.commitedBlocksInPeriod > blocksAtLeast &&
          valState.stats.validatorInfo.commitedOracleVotesInPeriod >
            oracleVotesAtLeast
        ) {
          expect(balDiff).gt(0);
          expect(+valState.stats.performanceRating).gt(0);
        } else {
          expect(balDiff).eq(0);
          expect(+valState.stats.performanceRating).eq(0);
        }

        let expectedBlockMissedAtMost = 3; // for 'no' and 'low' variants
        if (lostBlocks == 'medium') {
          expectedBlockMissedAtMost = 23;
        }
        if (lostBlocks == 'high') {
          expectedBlockMissedAtMost = 40;
        }
        expect(
          Number(
            nextPaymentInfo.paymentSchedule.blockBasedPaymentSchedule
              .blocksPerPeriod,
          ) - Number(valState.stats.validatorInfo.commitedBlocksInPeriod),
        ).lte(expectedBlockMissedAtMost);

        // TODO: check block events for revenue amount
      },
    );
  });

  describe('change params proposals', () => {
    describe('block type shedule', () => {
      let height: number;
      let params: QueryRevenueParamsResponse;
      let paymentInfo: QueryPaymentInfoResponse;
      test('submit and execute params proposal', async () => {
        params = await submitRevenueParamsProposal(
          params,
          revenueQuerier,
          daoMember,
          chainManagerAddress,
          mainDao,
          {
            block_based_payment_schedule_type: {
              blocks_per_period: '50',
            },
          },
        );
        height = await neutronClient.getHeight();
      });

      test('check params', async () => {
        params = await revenueQuerier.params();
        expect(
          params.params.paymentScheduleType.blockBasedPaymentScheduleType
            .blocksPerPeriod,
        ).eq(50n);
      });

      test('check state', async () => {
        // give a time to change state
        await waitBlocks(1, neutronClient);
        paymentInfo = await revenueQuerier.paymentInfo();
        expect(
          paymentInfo.paymentSchedule.blockBasedPaymentSchedule.blocksPerPeriod,
        ).eq(50n);
        expect(
          Number(
            paymentInfo.paymentSchedule.blockBasedPaymentSchedule
              .currentPeriodStartBlock,
          ),
        ).gte(height);
      });

      test('check validators state', async () => {
        const valsState = await revenueQuerier.validatorsStats();
        height = await neutronClient.getHeight();
        for (let i = 0; i < valsState.stats.length; i++) {
          // we check LTE not EQ because
          // 1) getHeight query might happen one block later then validatorsStats query
          // 2) validator might lost a block/vote
          expect(
            Number(valsState.stats[i].validatorInfo.commitedBlocksInPeriod),
          ).lte(
            height -
              Number(
                paymentInfo.paymentSchedule.blockBasedPaymentSchedule
                  .currentPeriodStartBlock,
              ) +
              1,
          );
          expect(
            Number(
              valsState.stats[i].validatorInfo.commitedOracleVotesInPeriod,
            ),
          ).lte(
            height -
              Number(
                paymentInfo.paymentSchedule.blockBasedPaymentSchedule
                  .currentPeriodStartBlock,
              ) +
              1,
          );
        }
      });
    });

    describe('month type schedule', () => {
      let height: number;
      let params: QueryRevenueParamsResponse;
      let paymentInfo: QueryPaymentInfoResponse;
      test('submit and execute params proposal', async () => {
        params = await revenueQuerier.params();
        const newParams: ParamsRevenue = {
          base_compensation: params.params.baseCompensation + '',
          twap_window: params.params.twapWindow + '',
          blocks_performance_requirement: {
            allowed_to_miss:
              params.params.blocksPerformanceRequirement.allowedToMiss,
            required_at_least:
              params.params.blocksPerformanceRequirement.requiredAtLeast,
          },
          oracle_votes_performance_requirement: {
            allowed_to_miss:
              params.params.oracleVotesPerformanceRequirement.allowedToMiss,
            required_at_least:
              params.params.oracleVotesPerformanceRequirement.requiredAtLeast,
          },
          payment_schedule_type: {
            monthly_payment_schedule_type: {},
          },
        };

        const proposalId = await daoMember.submitUpdateParamsRevenueProposal(
          chainManagerAddress,
          'Proposal update revenue params (monthly type params)',
          '',
          updateRevenueParamsProposal(newParams),
          '1000',
        );

        await daoMember.voteYes(proposalId);
        await mainDao.checkPassedProposal(proposalId);

        height = await neutronClient.getHeight();
        await daoMember.executeProposalWithAttempts(proposalId);
      });

      test('check params', async () => {
        params = await revenueQuerier.params();
        expect(
          params.params.paymentScheduleType.monthlyPaymentScheduleType,
        ).toBeDefined();
      });

      test('check state', async () => {
        // give a time to change state
        await waitBlocks(1, neutronClient);
        paymentInfo = await revenueQuerier.paymentInfo();

        // js .getMonth() start with zero
        expect(
          Number(
            paymentInfo.paymentSchedule.monthlyPaymentSchedule.currentMonth,
          ),
        ).eq(new Date().getMonth() + 1);
        expect(
          Number(
            paymentInfo.paymentSchedule.monthlyPaymentSchedule
              .currentMonthStartBlock,
          ),
        ).gte(height);
      });

      test('check validators state', async () => {
        const valsState = await revenueQuerier.validatorsStats();
        height = await neutronClient.getHeight();
        for (let i = 0; i < valsState.stats.length; i++) {
          // we check LTE not EQ because
          // 1) getHeight query might happen one block later then validatorsStats query
          // 2) validator might lost a block/vote
          expect(
            Number(valsState.stats[i].validatorInfo.commitedBlocksInPeriod),
          ).lte(
            height -
              Number(
                paymentInfo.paymentSchedule.monthlyPaymentSchedule
                  .currentMonthStartBlock,
              ) +
              1,
          );
          expect(
            Number(
              valsState.stats[i].validatorInfo.commitedOracleVotesInPeriod,
            ),
          ).lte(
            height -
              Number(
                paymentInfo.paymentSchedule.monthlyPaymentSchedule
                  .currentMonthStartBlock,
              ) +
              1,
          );
        }
      });
    });

    describe('empty type schedule', () => {
      let params: QueryRevenueParamsResponse;
      test('submit and execute params proposal', async () => {
        params = await revenueQuerier.params();

        const newParams: ParamsRevenue = {
          base_compensation: params.params.baseCompensation + '',
          twap_window: params.params.twapWindow + '',
          blocks_performance_requirement: {
            allowed_to_miss:
              params.params.blocksPerformanceRequirement.allowedToMiss,
            required_at_least:
              params.params.blocksPerformanceRequirement.requiredAtLeast,
          },
          oracle_votes_performance_requirement: {
            allowed_to_miss:
              params.params.oracleVotesPerformanceRequirement.allowedToMiss,
            required_at_least:
              params.params.oracleVotesPerformanceRequirement.requiredAtLeast,
          },
          payment_schedule_type: {
            empty_payment_schedule_type: {},
          },
        };

        const proposalId = await daoMember.submitUpdateParamsRevenueProposal(
          chainManagerAddress,
          'Proposal update revenue params (empty type params)',
          '',
          updateRevenueParamsProposal(newParams),
          '1000',
        );

        await daoMember.voteYes(proposalId);
        await mainDao.checkPassedProposal(proposalId);

        await daoMember.executeProposalWithAttempts(proposalId);
      });

      test('check params', async () => {
        params = await revenueQuerier.params();
        expect(
          params.params.paymentScheduleType.emptyPaymentScheduleType,
        ).toBeDefined();
      });

      test('check state', async () => {
        // give a time to change state
        await waitBlocks(1, neutronClient);
        const paymentInfo = await revenueQuerier.paymentInfo();
        expect(paymentInfo.paymentSchedule.emptyPaymentSchedule).toBeDefined();
      });

      test('check validators state', async () => {
        const valsState = await revenueQuerier.validatorsStats();
        for (let i = 0; i < valsState.stats.length; i++) {
          expect(
            Number(valsState.stats[i].validatorInfo.commitedBlocksInPeriod),
          ).lte(2);
          expect(
            Number(
              valsState.stats[i].validatorInfo.commitedOracleVotesInPeriod,
            ),
          ).lte(2);
        }
      });
    });
  });
});
async function submitRevenueParamsProposal(
  params: QueryRevenueParamsResponse,
  revenueQuerier: RevenueQueryClient,
  daoMember: DaoMember,
  chainManagerAddress: string,
  mainDao: Dao,
  sheduleType: PaymentScheduleType,
) {
  params = await revenueQuerier.params();

  const newParams: ParamsRevenue = {
    base_compensation: params.params.baseCompensation + '',
    twap_window: params.params.twapWindow + '',
    blocks_performance_requirement: {
      allowed_to_miss: params.params.blocksPerformanceRequirement.allowedToMiss,
      required_at_least:
        params.params.blocksPerformanceRequirement.requiredAtLeast,
    },
    oracle_votes_performance_requirement: {
      allowed_to_miss:
        params.params.oracleVotesPerformanceRequirement.allowedToMiss,
      required_at_least:
        params.params.oracleVotesPerformanceRequirement.requiredAtLeast,
    },
    payment_schedule_type: sheduleType,
  };

  const proposalId = await daoMember.submitUpdateParamsRevenueProposal(
    chainManagerAddress,
    'Proposal update revenue params (block type params)',
    '',
    updateRevenueParamsProposal(newParams),
    '1000',
  );

  await daoMember.voteYes(proposalId);
  await mainDao.checkPassedProposal(proposalId);

  await daoMember.executeProposalWithAttempts(proposalId);
  return params;
}
