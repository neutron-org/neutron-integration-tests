import '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import { Wallet } from '../../helpers/wallet';
import { getBlockResults } from '../../helpers/misc';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { RunnerTestSuite, inject } from 'vitest';
import {
  IBC_USDC_DENOM,
  NEUTRON_DENOM,
  NEUTRON_RPC,
} from '../../helpers/constants';
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
  updateSlashingParamsProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';
import { QueryPaymentInfoResponse } from '@neutron-org/neutronjs/neutron/revenue/query';
import { Params as RevenueModuleParams } from '@neutron-org/neutronjs/neutron/revenue/params';
import { EventAttribute } from '@neutron-org/neutronjs/tendermint/abci/types';
import { Coin, parseCoins } from '@cosmjs/proto-signing';

BigInt.prototype.toJSON = function () {
  return Number(this);
};

const VALIDATOR_CONTAINER = 'neutron-node-1';
const ORACLE_CONTAINER = 'setup-oracle-1-1';

const VALOPER_VAL1 = 'neutronvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk5tccmr';
// a validator with a small stake that will be disabled and enabled during the run
const VALOPER_VAL2 = 'neutronvaloper1qnk2n4nlkpw9xfqntladh74w6ujtulwnqshepx';
const VALOPER_ACCOUNT_VAL2 = 'neutron1qnk2n4nlkpw9xfqntladh74w6ujtulwn6dwq8z';

// THE TEST IS TIGHTLY COUPLED WITH THE FOLLOWING PARAM VALUES. CHANGE MAY BREAK THE TEST
/* 
revenue module setup
set_genesis_param_jq ".app_state.revenue.state.payment_schedule.blocks_per_period" "\"40\""              
set_genesis_param_jq ".app_state.revenue.state.payment_schedule.current_period_start_block" "\"0\""        
set_genesis_param_jq ".app_state.revenue.params.blocks_performance_requirement.allowed_to_miss" "\"0.1\"" # 4 blocks
set_genesis_param_jq ".app_state.revenue.params.blocks_performance_requirement.required_at_least" "\"0.4\"" # 16 blocks
set_genesis_param_jq ".app_state.revenue.params.oracle_votes_performance_requirement.allowed_to_miss" "\"0.1\"" # 4 blocks
set_genesis_param_jq ".app_state.revenue.params.oracle_votes_performance_requirement.required_at_least" "\"0.4\"" # 16 blocks
*/

const BLOCK_BASED_PAYMENT_SCHEDULE_DURATION = 40;
// used to quickly jail a validator during a payment period
const SIGNED_BLOCKS_WINDOW = BLOCK_BASED_PAYMENT_SCHEDULE_DURATION / 2;

// Due to the fact that the validator periodically loses blocks and oracle votes randomly,
// we cannot rely on exact numbers in tests.
// lost_blocks and lost_oracles can take the following values:
// 'no' - do not intentionally lose blocks (but may happen randomly)
// 'low' - lose 50% of allow_missed
// 'medium' - lose 50% of required_at_least
// 'high' - lose more than 100% of required_at_least

const REVENUE_CASES = [
  { lostBlocks: 'no', lostOracles: 'no' },
  { lostBlocks: 'low', lostOracles: 'no' },
  { lostBlocks: 'medium', lostOracles: 'no' },
  { lostBlocks: 'high', lostOracles: 'no' },
  { lostBlocks: 'no', lostOracles: 'low' },
  { lostBlocks: 'no', lostOracles: 'medium' },
  { lostBlocks: 'no', lostOracles: 'high' },
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

  describe('preparations', () => {
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
        await daoMember.bondFunds('3000000000');
        await neutronClient.getWithAttempts(
          async () => await mainDao.queryVotingPower(daoMember.user),
          async (response) => response.power == 3000000000,
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

    test('set block-based payment schedule type', async () => {
      // enable revenue by setting shedule type to block_based_payment_schedule_type
      await submitRevenueParamsProposal(
        neutronClient,
        revenueQuerier,
        daoMember,
        chainManagerAddress,
        mainDao,
        {
          block_based_payment_schedule_type: {
            blocks_per_period: BLOCK_BASED_PAYMENT_SCHEDULE_DURATION.toString(),
          },
        },
      );
      // wait for state change
      await waitBlocks(1, neutronClient);
    });

    // to avoid accidental slashing during future node pauses in the test
    test('ease slashing module requirements', async () => {
      const proposalId = await daoMember.submitUpdateParamsSlashingProposal(
        chainManagerAddress,
        'Slashing params proposal',
        'Update slashing params for quick and short jailing',
        updateSlashingParamsProposal({
          downtime_jail_duration: '5s',
          min_signed_per_window: '0.0',
          signed_blocks_window: SIGNED_BLOCKS_WINDOW.toString(),
          slash_fraction_double_sign: '0.000000000000000000',
          slash_fraction_downtime: '0.000000000000000000',
        }),
        '1000',
      );

      await daoMember.voteYes(proposalId);
      await waitBlocks(1, neutronClient);
      await mainDao.checkPassedProposal(proposalId);
      await daoMember.executeProposalWithAttempts(proposalId);
    });

    test('wait the slinky to get up and running', async () => {
      for (;;) {
        try {
          // we get an error until slinky get up and start filling TWAP price
          // no error thrown means slinky up and posts prices
          await revenueQuerier.paymentInfo();
          break;
        } catch {
          await waitBlocks(1, neutronClient);
        }
      }
      await waitBlocks(2, neutronClient);
    });
  });

  describe('revenue property tests', () => {
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

        // TODO: check block events for revenue amount
      },
    );
  });

  describe('validator leave from active validator set', () => {
    describe('adapt slashing module params for quick jailing', () => {
      test('submit and execute slashing params proposal', async () => {
        const proposalId = await daoMember.submitUpdateParamsSlashingProposal(
          chainManagerAddress,
          'Slashing params proposal',
          'Update slashing params for quick and short jailing',
          updateSlashingParamsProposal({
            downtime_jail_duration: '5s',
            min_signed_per_window: '0.500000000000000000',
            signed_blocks_window: SIGNED_BLOCKS_WINDOW.toString(),
            slash_fraction_double_sign: '0.000000000000000000',
            slash_fraction_downtime: '0.000000000000000000',
          }),
          '1000',
        );

        await daoMember.voteYes(proposalId);
        await waitBlocks(1, neutronClient);
        await mainDao.checkPassedProposal(proposalId);
        await daoMember.executeProposalWithAttempts(proposalId);
      });
    });

    // in this test, we need 1.0 perf rating no matter what to test revenue cut only by
    // partial presence in active validator set
    describe('set required at least to zero for revenue module', () => {
      test('submit and execute revenue params proposal', async () => {
        const params = await revenueQuerier.params();

        const newParams: ParamsRevenue = {
          base_compensation: params.params.baseCompensation + '',
          twap_window: params.params.twapWindow + '',
          blocks_performance_requirement: {
            allowed_to_miss: '1.0',
            required_at_least: '0.0',
          },
          oracle_votes_performance_requirement: {
            allowed_to_miss: '1.0',
            required_at_least: '0.0',
          },
          payment_schedule_type: {
            block_based_payment_schedule_type: {
              blocks_per_period:
                params.params.paymentScheduleType.blockBasedPaymentScheduleType.blocksPerPeriod.toString(),
            },
          },
        };

        const proposalId = await daoMember.submitUpdateParamsRevenueProposal(
          chainManagerAddress,
          'Proposal update revenue params',
          '',
          updateRevenueParamsProposal(newParams),
          '1000',
        );

        await daoMember.voteYes(proposalId);
        await mainDao.checkPassedProposal(proposalId);
        await daoMember.executeProposalWithAttempts(proposalId);
      });
    });

    // this is needed to have a fresh payment period going for better test accuracy
    test('wait for the beginning of a new payment period', async () => {
      // expect the block-based payment schedule to already be set at this point
      const paymentInfo = await revenueQuerier.paymentInfo();
      const ppStartBlock =
        paymentInfo.paymentSchedule.blockBasedPaymentSchedule
          .currentPeriodStartBlock;

      for (;;) {
        const newPaymentInfo = await revenueQuerier.paymentInfo();
        const newPpStartBlock =
          newPaymentInfo.paymentSchedule.blockBasedPaymentSchedule
            .currentPeriodStartBlock;
        if (newPpStartBlock > ppStartBlock) {
          break;
        }
        await waitBlocks(1, neutronClient);
      }
    });

    test('turn the validator off to get it jailed', async () => {
      // let the val perform well before turning it off to gather some stats
      await waitBlocks(SIGNED_BLOCKS_WINDOW / 2, neutronClient);
      execSync('docker pause ' + VALIDATOR_CONTAINER);
      execSync('docker pause ' + ORACLE_CONTAINER);
    });

    let revenueDistributionHeight: number;
    test('wait for the beginning of a new payment period', async () => {
      // expect the block-based payment schedule to already be set at this point
      const paymentInfo = await revenueQuerier.paymentInfo();
      const ppStartBlock =
        paymentInfo.paymentSchedule.blockBasedPaymentSchedule
          .currentPeriodStartBlock;

      for (;;) {
        const newPaymentInfo = await revenueQuerier.paymentInfo();
        const newPpStartBlock =
          newPaymentInfo.paymentSchedule.blockBasedPaymentSchedule
            .currentPeriodStartBlock;
        if (newPpStartBlock > ppStartBlock) {
          revenueDistributionHeight = Number(newPpStartBlock);
          break;
        }
        await waitBlocks(1, neutronClient);
      }
    });

    test('check distributed revenue', async () => {
      const rde = await revenueDistributionEventsAtHeight(
        revenueDistributionHeight,
      );
      const val1Revenue = rde.find((e) => e.validator === VALOPER_VAL1);
      const val2Revenue = rde.find((e) => e.validator === VALOPER_VAL2);

      // expect val1 to perform 100%
      expect(val1Revenue.performance_rating).toEqual(1);
      expect(val1Revenue.total_block_in_period).toEqual(
        BLOCK_BASED_PAYMENT_SCHEDULE_DURATION,
      );
      expect(val1Revenue.committed_blocks_in_period).toEqual(
        BLOCK_BASED_PAYMENT_SCHEDULE_DURATION,
      );
      expect(val1Revenue.committed_oracle_votes_in_period).toEqual(
        BLOCK_BASED_PAYMENT_SCHEDULE_DURATION,
      );
      expect(val1Revenue.in_active_valset_for_blocks_in_period).toEqual(
        BLOCK_BASED_PAYMENT_SCHEDULE_DURATION,
      );

      // val2 didn't perform 100% but given the revenue params its rating is 1.0
      expect(val2Revenue.performance_rating).toEqual(1);
      // even though val was stopped in the middle of the payment period, the total blocks
      // number never stopped increasing
      expect(val2Revenue.total_block_in_period).toEqual(
        BLOCK_BASED_PAYMENT_SCHEDULE_DURATION,
      );
      // check that the val stopped in the middle of the payment period indeed
      expect(val2Revenue.committed_blocks_in_period).toBeLessThan(
        BLOCK_BASED_PAYMENT_SCHEDULE_DURATION,
      );
      // check that the val was jailed in the middle of the payment period indeed
      expect(val2Revenue.in_active_valset_for_blocks_in_period).toBeLessThan(
        BLOCK_BASED_PAYMENT_SCHEDULE_DURATION,
      );
      // expect the revenue to be affected with incomplete presence in active valset proportionally
      expect(+val2Revenue.revenue_amount.amount).toEqual(
        Math.floor(
          (+val1Revenue.revenue_amount.amount * // take val1 revenue as 100%
            val2Revenue.in_active_valset_for_blocks_in_period) /
            BLOCK_BASED_PAYMENT_SCHEDULE_DURATION,
        ),
      );
    });
  });

  describe('change params proposals', () => {
    describe('block type shedule', () => {
      let height;
      let params;
      let paymentInfo: QueryPaymentInfoResponse;
      test('submit and execute params proposal', async () => {
        [params, height] = await submitRevenueParamsProposal(
          neutronClient,
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
      let height;
      let params;
      let paymentInfo: QueryPaymentInfoResponse;
      test('submit and execute params proposal', async () => {
        [params, height] = await submitRevenueParamsProposal(
          neutronClient,
          revenueQuerier,
          daoMember,
          chainManagerAddress,
          mainDao,
          {
            monthly_payment_schedule_type: {},
          },
        );
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
      let params;
      test('submit and execute params proposal', async () => {
        [params] = await submitRevenueParamsProposal(
          neutronClient,
          revenueQuerier,
          daoMember,
          chainManagerAddress,
          mainDao,
          {
            empty_payment_schedule_type: {},
          },
        );
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
          ).lte(3);
          expect(
            Number(
              valsState.stats[i].validatorInfo.commitedOracleVotesInPeriod,
            ),
          ).lte(3);
        }
      });
    });
  });
});

async function submitRevenueParamsProposal(
  neutronClient: SigningNeutronClient,
  revenueQuerier: RevenueQueryClient,
  daoMember: DaoMember,
  chainManagerAddress: string,
  mainDao: Dao,
  sheduleType: PaymentScheduleType,
): Promise<[RevenueModuleParams, number]> {
  const params = await revenueQuerier.params();

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
    'Proposal update revenue params',
    '',
    updateRevenueParamsProposal(newParams),
    '1000',
  );

  await daoMember.voteYes(proposalId);
  await mainDao.checkPassedProposal(proposalId);

  const height = await neutronClient.getHeight();

  await daoMember.executeProposalWithAttempts(proposalId);
  return [params.params, height];
}

type RevenueDistributionEvent = {
  validator: string;
  revenue_amount: Coin;
  performance_rating: number;
  in_active_valset_for_blocks_in_period: number;
  committed_blocks_in_period: number;
  committed_oracle_votes_in_period: number;
  total_block_in_period: number;
};

async function revenueDistributionEventsAtHeight(
  height: number,
): Promise<RevenueDistributionEvent[]> {
  const blockResults = await getBlockResults(NEUTRON_RPC, height);
  return blockResults.finalize_block_events
    .filter((event) => event.type === 'revenue_distribution')
    .map((event) => parseRevenueDistributionEvent(event.attributes));
}

// Helper to parse a single revenue_distribution event's attributes.
function parseRevenueDistributionEvent(
  attributes: EventAttribute[],
): RevenueDistributionEvent {
  // Convert the attributes array to a map for easier lookups.
  const attrMap = attributes.reduce<Record<string, string>>(
    (acc, { key, value }) => {
      acc[key] = value;
      return acc;
    },
    {},
  );

  return {
    validator: attrMap['validator'],
    revenue_amount: parseCoins(attrMap['revenue_amount'])[0],
    performance_rating: Number(attrMap['performance_rating']),
    in_active_valset_for_blocks_in_period: Number(
      attrMap['in_active_valset_for_blocks_in_period'],
    ),
    committed_blocks_in_period: Number(attrMap['committed_blocks_in_period']),
    committed_oracle_votes_in_period: Number(
      attrMap['committed_oracle_votes_in_period'],
    ),
    total_block_in_period: Number(attrMap['total_block_in_period']),
  };
}
