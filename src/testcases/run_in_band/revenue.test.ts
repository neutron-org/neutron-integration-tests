import '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import { Wallet } from '../../helpers/wallet';
import { CONTRACTS } from '../../helpers/constants';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { RunnerTestSuite, inject } from 'vitest';
import { NEUTRON_DENOM } from '../../helpers/constants';
import { QueryClientImpl as RevenueQueryClient } from '@neutron-org/neutronjs/neutron/revenue/query.rpc.Query';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query.rpc.Query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import config from '../../config.json';
import { BlockBasedPaymentSchedule } from '@neutron-org/neutronjs/neutron/revenue/genesis';
import { BinaryReader } from '@neutron-org/neutronjs/binary';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { createHash } from 'crypto';
import { PubKey as Ed25519PubKey } from 'cosmjs-types/cosmos/crypto/ed25519/keys';
import { execSync } from 'child_process';
import { PerformanceRequirement } from '@neutron-org/neutronjs/neutron/revenue/params';
import {
  ParamsRevenue,
  updateRevenueParamsProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';
const bech32 = require('bech32');

BigInt.prototype.toJSON = function () {
  return Number(this);
};

const VALIDATOR_CONTAINER = 'neutron-node-1';
const ORACLE_CONTAINER = 'setup-oracle-1-1';

const VALOPER_VAL2 = 'neutronvaloper1qnk2n4nlkpw9xfqntladh74w6ujtulwnqshepx';
const VALOPER_ACCOUNT_VAL2 = 'neutron1qnk2n4nlkpw9xfqntladh74w6ujtulwn6dwq8z';
const RevenuePoolAccount = 'neutron1k5d2e2572uf85wa6ek0yv24ezw26z6n5rnfkad';

/* 
настройки revenue для теста
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

const CASES = [
  { lostBlocks: 'no', lostOracles: 'no' },
  { lostBlocks: 'no', lostOracles: 'low' },
  { lostBlocks: 'no', lostOracles: 'medium' },
  { lostBlocks: 'no', lostOracles: 'high' },
  { lostBlocks: 'low', lostOracles: 'no' },
  { lostBlocks: 'medium', lostOracles: 'no' },
  { lostBlocks: 'high', lostOracles: 'no' },
];

describe('Neutron / Cron', () => {
  let testState: LocalState;
  let neutronWallet: Wallet;
  let neutronClient: SigningNeutronClient;
  let chainManagerAddress: string;
  let mainDao: Dao;
  let daoMember: DaoMember;

  let revenueQuerier: RevenueQueryClient;
  let stakingQuerier: StakingQueryClient;
  let bankQuerier: BankQueryClient;
  let consensusAddressVal2: string;
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
    stakingQuerier = new StakingQueryClient(neutronRpcClient);
    bankQuerier = new BankQueryClient(neutronRpcClient);

    const valResp = await stakingQuerier.validator({
      validatorAddr: VALOPER_VAL2,
    });
    const pk = Ed25519PubKey.decode(valResp.validator.consensusPubkey.value);
    const sha256Hash = createHash('sha256').update(pk.key).digest();
    const consensusAddressBytes = sha256Hash.slice(0, 20);

    consensusAddressVal2 = bech32.encode(
      'neutronvalcons',
      bech32.toWords(consensusAddressBytes),
    );
  });

  describe('prepare: top up the module account', () => {
    describe('send a bit funds to the module account', () => {
      test('send funds from wallet', async () => {
        const res = await neutronClient.sendTokens(
          RevenuePoolAccount,
          [
            {
              denom: NEUTRON_DENOM,
              amount: '100000000',
            },
          ],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        expect(res.code).toEqual(0);
      });

      test('bond from wallet', async () => {
        await daoMember.bondFunds('10000');
        await neutronClient.getWithAttempts(
          async () => await mainDao.queryVotingPower(daoMember.user),
          async (response) => response.power == 10000,
          20,
        );
      });
    });

    test('query states', async () => {
      const state = await revenueQuerier.state();
      const params = await revenueQuerier.params();
      const validators = await revenueQuerier.validatorsStats();
      const ps = BlockBasedPaymentSchedule.decode(
        new BinaryReader(state.state.paymentSchedule.value),
      );
      console.log(state);
      console.log(params);
      console.log(ps);
      console.log(JSON.stringify(validators, null, 2));
      blocksPerformanceRequirement = params.params.blocksPerformanceRequirement;
      oraclePerformanceRequirement =
        params.params.oracleVotesPerformanceRequirement;
    });
  });

  describe.skip('behavior tests', () => {
    test('wait the new revenue period begins', async () => {
      const height = await neutronClient.getHeight();
      const state = await revenueQuerier.state();
      const ps = BlockBasedPaymentSchedule.decode(
        new BinaryReader(state.state.paymentSchedule.value),
      );
      await waitBlocks(
        Number(ps.blocksPerPeriod) +
          Number(ps.currentPeriodStartBlock) -
          height,
        neutronClient,
      );
    });

    test.each(CASES)(
      'lostBlocks: $lostBlocks, lostOracles: $lostOracles, expectedRevenue: $expectedRevenue',
      async ({ lostBlocks, lostOracles, expectedRevenue }) => {
        const state = await revenueQuerier.state();
        const ps = BlockBasedPaymentSchedule.decode(
          new BinaryReader(state.state.paymentSchedule.value),
        );
        let valState = await revenueQuerier.validatorStats({
          consensusAddress: consensusAddressVal2,
        });
        console.log('at start: ', valState);
        const valBalanceAtStart = await bankQuerier.balance({
          address: VALOPER_ACCOUNT_VAL2,
          denom: 'untrn',
        });
        console.log('at start: ', valBalanceAtStart);
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
          Number(ps.blocksPerPeriod) +
            Number(ps.currentPeriodStartBlock) -
            height -
            1,
          neutronClient,
        );
        valState = await revenueQuerier.validatorStats({
          consensusAddress: consensusAddressVal2,
        });
        console.log('at finish: ', valState);
        // wait 2 blocks to ensure next perios begins
        // and validators got paid (or not when perf==0)
        await waitBlocks(2, neutronClient);
        //make sure new period started
        const nextState = await revenueQuerier.state();
        const nextps = BlockBasedPaymentSchedule.decode(
          new BinaryReader(nextState.state.paymentSchedule.value),
        );
        expect(Number(nextps.currentPeriodStartBlock)).gt(
          Number(ps.currentPeriodStartBlock),
        );

        console.log('');
        const valBalanceAtFinish = await bankQuerier.balance({
          address: VALOPER_ACCOUNT_VAL2,
          denom: 'untrn',
        });
        console.log('at finish: ', valBalanceAtFinish);
        const balDiff =
          +valBalanceAtFinish.balance.amount -
          +valBalanceAtStart.balance.amount;
        console.log(
          'diff: ',
          +valBalanceAtFinish.balance.amount -
            +valBalanceAtStart.balance.amount,
        );

        const blocksAtLeast =
          +blocksPerformanceRequirement.requiredAtLeast *
          Number(ps.blocksPerPeriod);
        const oracleVotesAtLeast =
          +oraclePerformanceRequirement.requiredAtLeast *
          Number(ps.blocksPerPeriod);
        console.log(
          'oracle at least: ',
          oracleVotesAtLeast,
          ' block at least: ',
          blocksAtLeast,
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
          Number(ps.blocksPerPeriod) -
            Number(valState.stats.validatorInfo.commitedBlocksInPeriod),
        ).lte(expectedBlockMissedAtMost);

        // TODO: check block events for revenue amount
      },
    );
  });

  describe('change params', () => {
    test('wait the new revenue period begins', async () => {
      const height = await neutronClient.getHeight();
      let params = await revenueQuerier.params();

      const newParams: ParamsRevenue = {
        denom_compensation: params.params.denomCompensation,
        base_compensation: params.params.baseCompensation + '',
        TWAP_Window: params.params.tWAPWindow + '',
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
        block_based_payment_schedule_type: {
          blocks_per_period: '50',
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
      // TODO: intentionally wait the middle of revenue period
      const state = await revenueQuerier.state();
      const ps = BlockBasedPaymentSchedule.decode(
        new BinaryReader(state.state.paymentSchedule.value),
      );
      await daoMember.executeProposalWithAttempts(proposalId);
      params = await revenueQuerier.params();
      expect(params.params.blockBasedPaymentScheduleType.blocksPerPeriod).eq(
        50,
      );
    });
  });
});
