import '@neutron-org/neutronjsplus';
import { LocalState, mnemonicToWallet } from '../../helpers/local_state';
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
const VALOPER_ACCOUNT_VAL1 = 'neutron18hl5c9xn5dze2g50uaw0l2mr02ew57zkwkppa8';
// a validator with a small stake that will be disabled and enabled during the run
const VALOPER_VAL2 = 'neutronvaloper1qnk2n4nlkpw9xfqntladh74w6ujtulwnqshepx';
const VALOPER_ACCOUNT_VAL2 = 'neutron1qnk2n4nlkpw9xfqntladh74w6ujtulwn6dwq8z';

// THE TEST IS TIGHTLY COUPLED WITH THE FOLLOWING PARAM VALUES. CHANGE MAY BREAK THE TEST
const REVENUE_PARAM_REWARD_QUOTE_AMOUNT = 2500;
const REVENUE_PARAM_REWARD_QUOTE_ASSET = 'USD';
const REVENUE_PARAM_TWAP_WINDOW = 40;
const REVENUE_PARAM_BLOCKS_REQUIRED_AT_LEAST = 0.1;
const REVENUE_PARAM_BLOCKS_ALLOWED_TO_MISS = 0.4;
const REVENUE_PARAM_ORACLE_VOTES_REQUIRED_AT_LEAST = 0.1;
const REVENUE_PARAM_ORACLE_VOTES_ALLOWED_TO_MISS = 0.4;
const REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH = 40;

// duration of a short absence simulation of a validator
const ABSENCE_SIM_SHORT = Math.ceil(
  REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH /
    REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH,
);
// duration of a medium absence simulation of a validator
const ABSENCE_SIM_MEDIUM = Math.ceil(
  REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH / 10,
);
// duration of a long absence simulation of a validator
const ABSENCE_SIM_LONG = Math.ceil(
  REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH / 2,
);

// used to quickly jail a validator during a payment period
const SIGNED_BLOCKS_WINDOW =
  REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH / 2;

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

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    neutronWallet = await mnemonicToWallet(config.DEMO_MNEMONIC_1, 'neutron');
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
                amount: (900_000_000_000).toString(),
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
          async (response) => response.power >= 3000000000,
          20,
        );
      });
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

    test('set main params for revenue module', async () => {
      const newParams: ParamsRevenue = {
        reward_asset: NEUTRON_DENOM,
        reward_quote: {
          amount: REVENUE_PARAM_REWARD_QUOTE_AMOUNT.toString(),
          asset: REVENUE_PARAM_REWARD_QUOTE_ASSET,
        },
        twap_window: REVENUE_PARAM_TWAP_WINDOW.toString(),
        blocks_performance_requirement: {
          allowed_to_miss: REVENUE_PARAM_BLOCKS_ALLOWED_TO_MISS.toString(),
          required_at_least: REVENUE_PARAM_BLOCKS_REQUIRED_AT_LEAST.toString(),
        },
        oracle_votes_performance_requirement: {
          allowed_to_miss:
            REVENUE_PARAM_ORACLE_VOTES_ALLOWED_TO_MISS.toString(),
          required_at_least:
            REVENUE_PARAM_ORACLE_VOTES_REQUIRED_AT_LEAST.toString(),
        },
        payment_schedule_type: {
          block_based_payment_schedule_type: {
            blocks_per_period:
              REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH.toString(),
          },
        },
      };

      const proposalId = await daoMember.submitUpdateParamsRevenueProposal(
        chainManagerAddress,
        'Revenue params proposal',
        'Update main revenue params',
        updateRevenueParamsProposal(newParams),
        '1000',
      );

      await daoMember.voteYes(proposalId);
      await waitBlocks(1, neutronClient);
      await mainDao.checkPassedProposal(proposalId);
      await daoMember.executeProposalWithAttempts(proposalId);
    });

    test('wait the slinky to get up and running', async () => {
      let tries = 0;
      for (;;) {
        tries++;
        if (tries > 120) {
          throw new Error("slinky couldn't provide NTRN price in 2 minutes");
        }

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
    const blocksAllowedToMiss = 0.1;
    const oracleVotesAllowedToMiss = 0.1;
    const blocksRequiredAtLeast = 0.6;
    const oracleVotesRequiredAtLeast = 0.05; // this is hardly possible to achieve a somehow high value for val2
    test('set test-specific revenue module params', async () => {
      const params = await revenueQuerier.params();

      // set a pretty much wide window for performance requirement calc to catch all performance
      // rating values: 1.0, 0.0, and inbetween. Also set block-based payment schedule type.
      const newParams: ParamsRevenue = {
        reward_asset: params.params.rewardAsset,
        reward_quote: {
          amount: params.params.rewardQuote.amount + '',
          asset: params.params.rewardQuote.asset,
        },
        twap_window: params.params.twapWindow + '',
        blocks_performance_requirement: {
          allowed_to_miss: blocksAllowedToMiss.toString(),
          required_at_least: blocksRequiredAtLeast.toString(),
        },
        oracle_votes_performance_requirement: {
          allowed_to_miss: oracleVotesAllowedToMiss.toString(),
          required_at_least: oracleVotesRequiredAtLeast.toString(),
        },
        payment_schedule_type: {
          block_based_payment_schedule_type: {
            blocks_per_period:
              REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH.toString(),
          },
        },
      };

      const proposalId = await daoMember.submitUpdateParamsRevenueProposal(
        chainManagerAddress,
        'Revenue params proposal',
        'Update revenue params wide allowed performance rating',
        updateRevenueParamsProposal(newParams),
        '1000',
      );

      await daoMember.voteYes(proposalId);
      await waitBlocks(1, neutronClient);
      await mainDao.checkPassedProposal(proposalId);
      await daoMember.executeProposalWithAttempts(proposalId);
    });

    // flags for all possible performance rating quality occurrences
    let perfectPrFound = false;
    let terriblePrFound = false;
    let averagePrFound = false;
    test.each(REVENUE_CASES)(
      'lostBlocks: $lostBlocks, lostOracles: $lostOracles',
      async ({ lostBlocks, lostOracles }) => {
        const val1BalanceBefore = await bankQuerier.balance({
          address: VALOPER_ACCOUNT_VAL1,
          denom: 'untrn',
        });
        const val2BalanceBefore = await bankQuerier.balance({
          address: VALOPER_ACCOUNT_VAL2,
          denom: 'untrn',
        });

        if (lostOracles == 'low') {
          execSync('docker pause ' + ORACLE_CONTAINER);
          await waitBlocks(ABSENCE_SIM_SHORT, neutronClient);
          execSync('docker unpause ' + ORACLE_CONTAINER);
        }
        if (lostOracles == 'medium') {
          execSync('docker pause ' + ORACLE_CONTAINER);
          await waitBlocks(ABSENCE_SIM_MEDIUM, neutronClient);
          execSync('docker unpause ' + ORACLE_CONTAINER);
        }
        if (lostOracles == 'high') {
          execSync('docker pause ' + ORACLE_CONTAINER);
          await waitBlocks(ABSENCE_SIM_LONG, neutronClient);
          execSync('docker unpause ' + ORACLE_CONTAINER);
        }

        if (lostBlocks == 'low') {
          execSync('docker pause ' + VALIDATOR_CONTAINER);
          await waitBlocks(ABSENCE_SIM_SHORT, neutronClient);
          execSync('docker unpause ' + VALIDATOR_CONTAINER);
        }
        if (lostBlocks == 'medium') {
          execSync('docker pause ' + VALIDATOR_CONTAINER);
          await waitBlocks(ABSENCE_SIM_MEDIUM, neutronClient);
          execSync('docker unpause ' + VALIDATOR_CONTAINER);
        }
        if (lostBlocks == 'high') {
          execSync('docker pause ' + VALIDATOR_CONTAINER);
          await waitBlocks(ABSENCE_SIM_LONG, neutronClient);
          execSync('docker unpause ' + VALIDATOR_CONTAINER);
        }

        const nextPpStartBlock = await waitForNextPaymentPeriod(
          revenueQuerier,
          neutronClient,
        );
        const val1BalanceAfter = await bankQuerier.balance({
          address: VALOPER_ACCOUNT_VAL1,
          denom: 'untrn',
        });
        const val1BalDiff =
          +val1BalanceAfter.balance.amount - +val1BalanceBefore.balance.amount;
        const val2BalanceAfter = await bankQuerier.balance({
          address: VALOPER_ACCOUNT_VAL2,
          denom: 'untrn',
        });
        const val2BalDiff =
          +val2BalanceAfter.balance.amount - +val2BalanceBefore.balance.amount;

        const paymentInfo = await revenueQuerier.paymentInfo();
        const baseRevenue = +paymentInfo.baseRevenueAmount.amount;

        const rde = await revenueDistributionEventsAtHeight(nextPpStartBlock);
        const val1Rde = rde.find((e) => e.validator === VALOPER_VAL1);
        const val2Rde = rde.find((e) => e.validator === VALOPER_VAL2);
        // logging for debug cases because of expected tests instability
        console.log('val1 rde:', JSON.stringify(val1Rde));
        console.log('val2 rde:', JSON.stringify(val2Rde));

        const val1RevenuePropertyInfo: ValRevenuePropertyInfo = {
          rde: val1Rde,
          balanceDiff: val1BalDiff,
          baseRevenue: baseRevenue,
          blocksRequiredAtLeast: blocksRequiredAtLeast,
          oracleVotesRequiredAtLeast: oracleVotesRequiredAtLeast,
          blocksAllowedToMiss: blocksAllowedToMiss,
          oracleVotesAllowedToMiss: oracleVotesAllowedToMiss,
        };
        const val2RevenuePropertyInfo: ValRevenuePropertyInfo = {
          rde: val2Rde,
          balanceDiff: val2BalDiff,
          baseRevenue: baseRevenue,
          blocksRequiredAtLeast: blocksRequiredAtLeast,
          oracleVotesRequiredAtLeast: oracleVotesRequiredAtLeast,
          blocksAllowedToMiss: blocksAllowedToMiss,
          oracleVotesAllowedToMiss: oracleVotesAllowedToMiss,
        };
        checkValRevenueProperty(val1RevenuePropertyInfo);
        checkValRevenueProperty(val2RevenuePropertyInfo);

        for (const pr of [
          val1Rde.performance_rating,
          val2Rde.performance_rating,
        ]) {
          switch (pr) {
            case 1:
              perfectPrFound = true;
              break;

            case 0:
              terriblePrFound = true;
              break;

            default:
              averagePrFound = true;
              break;
          }
        }
      },
    );

    test('check that all performance ratings are covered', async () => {
      expect(perfectPrFound).toBeTruthy();
      expect(terriblePrFound).toBeTruthy();
      expect(averagePrFound).toBeTruthy();
    });
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
          reward_asset: params.params.rewardAsset,
          reward_quote: {
            amount: params.params.rewardQuote.amount + '',
            asset: params.params.rewardQuote.asset,
          },
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
      await waitForNextPaymentPeriod(revenueQuerier, neutronClient);
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
      revenueDistributionHeight = await waitForNextPaymentPeriod(
        revenueQuerier,
        neutronClient,
      );
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
        REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH,
      );
      expect(val1Revenue.in_active_valset_for_blocks_in_period).toEqual(
        REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH,
      );

      // val2 didn't perform 100% but given the revenue params its rating is 1.0
      expect(val2Revenue.performance_rating).toEqual(1);
      // even though val was stopped in the middle of the payment period, the total blocks
      // number never stopped increasing
      expect(val2Revenue.total_block_in_period).toEqual(
        REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH,
      );
      // check that the val stopped in the middle of the payment period indeed
      expect(val2Revenue.committed_blocks_in_period).toBeLessThan(
        REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH,
      );
      // check that the val was jailed in the middle of the payment period indeed
      expect(val2Revenue.in_active_valset_for_blocks_in_period).toBeLessThan(
        REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH,
      );
      // expect the revenue to be affected with incomplete presence in active valset proportionally
      expect(+val2Revenue.revenue_amount.amount).toEqual(
        Math.floor(
          (+val1Revenue.revenue_amount.amount * // take val1 revenue as 100%
            val2Revenue.in_active_valset_for_blocks_in_period) /
            REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH,
        ),
      );
    });
  });

  describe('change params proposals', () => {
    describe('block->block payment shedule change', () => {
      const blocksPerPeriod =
        REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH + 10;
      let height: number;
      let paymentInfo: QueryPaymentInfoResponse;
      test('submit and execute params proposal', async () => {
        const resp = await submitRevenueParamsProposal(
          neutronClient,
          revenueQuerier,
          daoMember,
          chainManagerAddress,
          mainDao,
          {
            block_based_payment_schedule_type: {
              blocks_per_period: blocksPerPeriod.toString(),
            },
          },
        );
        height = resp[1];
      });

      test('check params', async () => {
        const newParams = await revenueQuerier.params();
        expect(
          Number(
            newParams.params.paymentScheduleType.blockBasedPaymentScheduleType
              .blocksPerPeriod,
          ),
        ).eq(blocksPerPeriod);
      });

      let newPeriodStartBlock: number;
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
        newPeriodStartBlock = Number(
          paymentInfo.paymentSchedule.blockBasedPaymentSchedule
            .currentPeriodStartBlock,
        );
      });

      test('check partial revenue distribution', async () => {
        const paymentInfo = await revenueQuerier.paymentInfo();
        const rde = await revenueDistributionEventsAtHeight(
          newPeriodStartBlock,
        );
        const val1Events = rde.find((e) => e.validator === VALOPER_VAL1);
        expect(val1Events.effective_period_progress).toBeLessThan(1);
        expect(val1Events.effective_period_progress).toBeGreaterThan(0);
        expect(val1Events.performance_rating).toEqual(1);
        expect(+val1Events.revenue_amount.amount).toBeGreaterThan(0);
        // allow price fluctuation
        expect(+val1Events.revenue_amount.amount).toBeWithin(
          +paymentInfo.baseRevenueAmount.amount *
            val1Events.effective_period_progress *
            0.99,
          +paymentInfo.baseRevenueAmount.amount *
            val1Events.effective_period_progress *
            1.01,
        );
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

    describe('block->month payment shedule change', () => {
      let height: number;
      let paymentInfo: QueryPaymentInfoResponse;
      test('submit and execute params proposal', async () => {
        const resp = await submitRevenueParamsProposal(
          neutronClient,
          revenueQuerier,
          daoMember,
          chainManagerAddress,
          mainDao,
          {
            monthly_payment_schedule_type: {},
          },
        );
        height = resp[1];
      });

      test('check params', async () => {
        const newParams = await revenueQuerier.params();
        expect(
          newParams.params.paymentScheduleType.monthlyPaymentScheduleType,
        ).toBeDefined();
      });

      let newPeriodStartBlock: number;
      test('check state', async () => {
        // give a time to change state
        await waitBlocks(1, neutronClient);
        paymentInfo = await revenueQuerier.paymentInfo();

        expect(
          new Date(
            Number(
              paymentInfo.paymentSchedule.monthlyPaymentSchedule
                .currentMonthStartBlockTs,
            ) * 1000, // seconds to milliseconds
          ).getMonth(),
        ).eq(new Date().getMonth());
        expect(
          Number(
            paymentInfo.paymentSchedule.monthlyPaymentSchedule
              .currentMonthStartBlock,
          ),
        ).gte(height);
        newPeriodStartBlock = Number(
          paymentInfo.paymentSchedule.monthlyPaymentSchedule
            .currentMonthStartBlock,
        );
      });

      test('check partial revenue distribution', async () => {
        const paymentInfo = await revenueQuerier.paymentInfo();
        const rde = await revenueDistributionEventsAtHeight(
          newPeriodStartBlock,
        );
        const val1Events = rde.find((e) => e.validator === VALOPER_VAL1);
        expect(val1Events.effective_period_progress).toBeLessThan(1);
        expect(val1Events.effective_period_progress).toBeGreaterThan(0);
        expect(val1Events.performance_rating).toEqual(1);
        expect(+val1Events.revenue_amount.amount).toBeGreaterThan(0);
        // allow price fluctuation
        expect(+val1Events.revenue_amount.amount).toBeWithin(
          +paymentInfo.baseRevenueAmount.amount *
            val1Events.effective_period_progress *
            0.99,
          +paymentInfo.baseRevenueAmount.amount *
            val1Events.effective_period_progress *
            1.01,
        );
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

    describe('month->empty payment shedule change', () => {
      let height: number;
      test('submit and execute params proposal', async () => {
        const resp = await submitRevenueParamsProposal(
          neutronClient,
          revenueQuerier,
          daoMember,
          chainManagerAddress,
          mainDao,
          {
            empty_payment_schedule_type: {},
          },
        );
        height = resp[1];
      });

      test('check params', async () => {
        const newParams = await revenueQuerier.params();
        expect(
          newParams.params.paymentScheduleType.emptyPaymentScheduleType,
        ).toBeDefined();
      });

      test('check state', async () => {
        // give a time to change state
        await waitBlocks(1, neutronClient);
        const paymentInfo = await revenueQuerier.paymentInfo();
        expect(paymentInfo.paymentSchedule.emptyPaymentSchedule).toBeDefined();
      });

      test('check partial revenue distribution', async () => {
        const paymentInfo = await revenueQuerier.paymentInfo();
        // try to find distribution events somewhere after proposal exec
        for (let tryHeigh = height + 1; ; tryHeigh++) {
          if (tryHeigh > height + 10) {
            // we expect to find distribution events in a nearest block
            throw new Error(
              'no distribution events found after payment schedule change',
            );
          }

          const rde = await revenueDistributionEventsAtHeight(tryHeigh);
          if (rde.length == 0) {
            await waitBlocks(1, neutronClient);
            continue;
          }
          const val1Events = rde.find((e) => e.validator === VALOPER_VAL1);

          // a tiny part of a month passed
          expect(val1Events.effective_period_progress).toBeLessThan(0.0001);
          expect(val1Events.effective_period_progress).toBeGreaterThan(0);
          expect(val1Events.performance_rating).toEqual(1);
          expect(+val1Events.revenue_amount.amount).toBeGreaterThan(0);
          // allow price fluctuation
          expect(+val1Events.revenue_amount.amount).toBeWithin(
            +paymentInfo.baseRevenueAmount.amount *
              val1Events.effective_period_progress *
              0.99,
            +paymentInfo.baseRevenueAmount.amount *
              val1Events.effective_period_progress *
              1.01,
          );
          break;
        }
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

    describe('empty->block payment shedule change', () => {
      const blocksPerPeriod = 50;
      let height: number;
      let paymentInfo: QueryPaymentInfoResponse;
      test('submit and execute params proposal', async () => {
        const resp = await submitRevenueParamsProposal(
          neutronClient,
          revenueQuerier,
          daoMember,
          chainManagerAddress,
          mainDao,
          {
            block_based_payment_schedule_type: {
              blocks_per_period: blocksPerPeriod.toString(),
            },
          },
        );
        height = resp[1];
      });

      test('check params', async () => {
        const newParams = await revenueQuerier.params();
        expect(
          Number(
            newParams.params.paymentScheduleType.blockBasedPaymentScheduleType
              .blocksPerPeriod,
          ),
        ).eq(blocksPerPeriod);
      });

      let newPeriodStartBlock: number;
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
        newPeriodStartBlock = Number(
          paymentInfo.paymentSchedule.blockBasedPaymentSchedule
            .currentPeriodStartBlock,
        );
      });

      test('check revenue distribution events', async () => {
        const blockResults = await getBlockResults(
          NEUTRON_RPC,
          newPeriodStartBlock,
        );
        const rdNone = blockResults.finalize_block_events.find(
          (e) => e.type === 'revenue_distribution_none',
        );
        expect(rdNone).toBeDefined();
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
    reward_asset: params.params.rewardAsset,
    reward_quote: {
      amount: params.params.rewardQuote.amount + '',
      asset: params.params.rewardQuote.asset,
    },
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
  effective_period_progress: number;
};

async function revenueDistributionEventsAtHeight(
  height: number,
): Promise<RevenueDistributionEvent[]> {
  const blockResults = await getBlockResults(NEUTRON_RPC, height);
  if (blockResults.finalize_block_events == undefined) {
    return [];
  }

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
    effective_period_progress: Number(attrMap['effective_period_progress']),
  };
}

/**
 * waitForNextPaymentPeriod waits for the next payment period to start. Requires a block-based
payment schedule to be configured. Returns the block height of the next payment period.
 */
async function waitForNextPaymentPeriod(
  revenueQuerier: RevenueQueryClient,
  neutronClient: SigningNeutronClient,
): Promise<number> {
  const paymentInfo = await revenueQuerier.paymentInfo();
  const ppStartBlock =
    paymentInfo.paymentSchedule.blockBasedPaymentSchedule
      .currentPeriodStartBlock;
  const blocksPerPeriod = Number(
    paymentInfo.paymentSchedule.blockBasedPaymentSchedule.blocksPerPeriod,
  );

  for (let tries = 0; ; tries++) {
    if (tries > blocksPerPeriod * 1.5) {
      throw new Error("next paymen period didn't start meaningful in time");
    }

    const newPaymentInfo = await revenueQuerier.paymentInfo();
    const newPpStartBlock =
      newPaymentInfo.paymentSchedule.blockBasedPaymentSchedule
        .currentPeriodStartBlock;
    if (newPpStartBlock > ppStartBlock) {
      return Number(newPpStartBlock);
    }
    await waitBlocks(1, neutronClient);
  }
}

type ValRevenuePropertyInfo = {
  rde: RevenueDistributionEvent;
  balanceDiff: number;
  baseRevenue: number;
  blocksRequiredAtLeast: number;
  oracleVotesRequiredAtLeast: number;
  blocksAllowedToMiss: number;
  oracleVotesAllowedToMiss: number;
};

function checkValRevenueProperty(info: ValRevenuePropertyInfo) {
  const committedBlocksRate =
    info.rde.committed_blocks_in_period / info.rde.total_block_in_period;
  const committedOracleVotesRate =
    info.rde.committed_oracle_votes_in_period / info.rde.total_block_in_period;
  // logging for debug cases because of expected tests instability
  console.log(
    'validator commited blocks rate:',
    committedBlocksRate,
    info.rde.validator,
  );
  console.log(
    'validator commited oracle votes rate:',
    committedOracleVotesRate,
    info.rde.validator,
  );

  // expect the payment period to be fully complete
  expect(info.rde.effective_period_progress).toEqual(1);
  expect(info.rde.total_block_in_period).eq(
    REVENUE_PARAM_BLOCK_BASED_PAYMENT_SCHEDULE_WIDTH,
  );

  switch (info.rde.performance_rating) {
    case 1: {
      // event and actual balance diff match
      expect(info.balanceDiff).eq(+info.rde.revenue_amount.amount);
      // revenue amount is within 1% of base revenue
      expect(info.balanceDiff).toBeWithin(
        info.baseRevenue * 0.99,
        info.baseRevenue * 1.01,
      );
      // commitments are better than requirements
      expect(committedBlocksRate).toBeGreaterThanOrEqual(
        1 - info.blocksAllowedToMiss,
      );
      expect(committedOracleVotesRate).toBeGreaterThanOrEqual(
        1 - info.oracleVotesAllowedToMiss,
      );
      break;
    }

    case 0: {
      // no revenue for terrible performance
      expect(info.balanceDiff).eq(0);
      // at least one commitment is worse than requirements
      const terribleBlocksCommitted =
        committedBlocksRate < info.blocksRequiredAtLeast;
      const terribleOracleVotesCommitted =
        committedOracleVotesRate < info.oracleVotesRequiredAtLeast;
      expect(terribleBlocksCommitted || terribleOracleVotesCommitted);
      break;
    }

    default: {
      // event and actual balance diff match
      expect(info.balanceDiff).eq(+info.rde.revenue_amount.amount);
      // revenue amount is somewhat between zero and full
      expect(info.balanceDiff).toBeGreaterThan(0);
      expect(info.balanceDiff).toBeLessThan(info.baseRevenue);

      // at least one commitment is between requirement bounds and none lower
      // than the minimal requirement
      expect(committedBlocksRate).toBeGreaterThanOrEqual(
        info.blocksRequiredAtLeast,
      );
      expect(committedOracleVotesRate).toBeGreaterThanOrEqual(
        info.oracleVotesRequiredAtLeast,
      );
      const averageBlocksCommitted =
        committedBlocksRate < 1 - info.blocksAllowedToMiss &&
        committedBlocksRate >= info.blocksRequiredAtLeast;
      const averageOracleVotesCommitted =
        committedOracleVotesRate < 1 - info.oracleVotesAllowedToMiss &&
        committedOracleVotesRate >= info.oracleVotesRequiredAtLeast;
      expect(
        averageBlocksCommitted || averageOracleVotesCommitted,
      ).toBeTruthy();
      break;
    }
  }
}
