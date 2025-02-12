import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitBlocks, waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { NEUTRON_DENOM } from '../../helpers/constants';
import { expect, inject, RunnerTestSuite } from 'vitest';
import { LocalState, mnemonicToWallet } from '../../helpers/local_state';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';
import { DeliverTxResponse, StargateClient } from '@cosmjs/stargate';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query.rpc.Query';
import { execSync } from 'child_process';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { sleep } from '@neutron-org/neutronjsplus/src/wait';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { ADMIN_MODULE_ADDRESS } from '@neutron-org/neutronjsplus/dist/constants';
import { chainManagerWrapper } from '@neutron-org/neutronjsplus/dist/proposal';

const VAL_MNEMONIC_1 =
  'clock post desk civil pottery foster expand merit dash seminar song memory figure uniform spice circle try happy obvious trash crime hybrid hood cushion';
const VAL_MNEMONIC_2 =
  'angry twist harsh drastic left brass behave host shove marriage fall update business leg direct reward object ugly security warm tuna model broccoli choice';

// const DAO = 'neutron1yw4xvtc43me9scqfr2jr2gzvcxd3a9y4eq7gaukreugw2yd2f8ts8g30fq';
// const STAKING_VAULT =
//   'neutron1jarq7kgdyd7dcfu2ezeqvg4w4hqdt3m5lv364d8mztnp9pzmwwwqjw7fvg';
const STAKING_TRACKER =
  'neutron1nyuryl5u5z04dx4zsqgvsuw7fe8gl2f77yufynauuhklnnmnjncqcls0tj';
const STAKING_REWARDS =
  'neutron1nhay73rdztlwwxnspup3y4uld59ylaumhddjt80eqmd0xl5e7mfqx0rnr3';
// const STAKING_INFO_PROXY =
//   'neutron14xw3z6mhrhuckd46t2saxu7h90fzydnfu7xuewm4tmgl0dakkcjqxc3k6x';

const VALIDATOR_CONTAINER = 'neutron-node-1';

describe('Neutron / Staking Vault - Extended Scenarios', () => {
  let testState: LocalState;
  let neutronClient1: SigningNeutronClient;
  let neutronClient2: SigningNeutronClient;
  // let validatorClient: SigningNeutronClient;

  let demoWalletClient: SigningNeutronClient;
  let demoWallet: Wallet;

  let neutronWallet1: Wallet;
  let neutronWallet2: Wallet;
  let stakingQuerier: StakingQueryClient;
  let bankQuerier: BankQueryClient;

  let validatorPrimaryClient: SigningNeutronClient;
  let validatorSecondClient: SigningNeutronClient;
  let validatorWeakAddr: string;
  let validatorStrongAddr: string;
  let validatorPrimary: Wallet;
  let validatorSecondary: Wallet;

  // let validator1SelfDelegation: number;
  // let validator2SelfDelegation: number;

  let claimRecipient: string;

  beforeAll(async (suite: RunnerTestSuite) => {
    const mnemonics = inject('mnemonics');
    testState = await LocalState.create(config, mnemonics, suite);

    demoWallet = testState.wallets.neutron.demo1;
    demoWalletClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      demoWallet.directwallet,
      demoWallet.address,
    );

    neutronWallet1 = await testState.nextWallet('neutron');
    neutronWallet2 = await testState.nextWallet('neutron');
    claimRecipient = (await testState.nextWallet('neutron')).address;

    validatorPrimary = await mnemonicToWallet(VAL_MNEMONIC_1, 'neutron');
    validatorSecondary = await mnemonicToWallet(VAL_MNEMONIC_2, 'neutron');

    neutronClient1 = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet1.directwallet,
      neutronWallet1.address,
    );

    neutronClient2 = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet2.directwallet,
      neutronWallet2.address,
    );

    // This is client for validator that should work ALWAYS bc it's only one that exposes ports
    // In the state it is validator #2, so this naming is only for clients
    validatorPrimaryClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      validatorPrimary.directwallet,
      validatorPrimary.address,
    );

    // This is the client for validator that could be disabled during testrun
    validatorSecondClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      validatorSecondary.directwallet,
      validatorSecondary.address,
    );

    const neutronRpcClient = await testState.neutronRpcClient();
    stakingQuerier = new StakingQueryClient(neutronRpcClient);
    bankQuerier = new BankQueryClient(neutronRpcClient);
  });

  describe('Staking Rewards', () => {
    describe('Set slashing params', () => {
      let mainDao: Dao;
      let daoMember1: DaoMember;
      let proposalId;
      test('create proposal', async () => {
        const neutronRpcClient = await testState.neutronRpcClient();
        const daoCoreAddress = await getNeutronDAOCore(
          demoWalletClient,
          neutronRpcClient,
        ); // add assert for some addresses
        const daoContracts = await getDaoContracts(
          demoWalletClient,
          daoCoreAddress,
        );
        mainDao = new Dao(demoWalletClient, daoContracts);
        daoMember1 = new DaoMember(
          mainDao,
          demoWalletClient.client,
          demoWallet.address,
          NEUTRON_DENOM,
        );
        console.log('daoMember1: ' + daoMember1.user);
        await daoMember1.bondFunds('1999999491000');
        const neutronQuerier = await createNeutronClient({
          rpcEndpoint: testState.rpcNeutron,
        });
        const admins =
          await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
        const chainManagerAddress = admins.admins[0];
        proposalId = await submitUpdateParamsSlashingProposal(
          daoMember1,
          chainManagerAddress,
          'Proposal #1',
          'Param change proposal. Update slashing params',
          {
            downtime_jail_duration: '30s',
            min_signed_per_window: '0.800000000000000000',
            signed_blocks_window: '10',
            slash_fraction_double_sign: '0.010000000000000000',
            slash_fraction_downtime: '0.100000000000000000',
          },
          '1000',
        );
      });
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
    });
    describe('ClaimRewards', () => {
      test('send tokens to the rewards pool', async () => {
        const res = await neutronClient2.sendTokens(STAKING_REWARDS, [
          {
            denom: NEUTRON_DENOM,
            amount: '8000000000',
          },
        ]);
        expect(res.code).toEqual(0);
      });
      test('save vals and delegate to them', async () => {
        // const validators = await stakingQuerier.validators({
        //   status: 'BOND_STATUS_BONDED',
        // });

        validatorStrongAddr = validatorPrimary.valAddress;
        validatorWeakAddr = validatorSecondary.valAddress;
        // validator1SelfDelegation = +validators.validators[0].tokens;
        // validator2SelfDelegation = +validators.validators[1].tokens;

        console.log('ValidatorWeak:', validatorWeakAddr);
        console.log('ValidatorStrong:', validatorStrongAddr);

        await delegateTokens(
          demoWalletClient,
          demoWallet.address,
          validatorStrongAddr,
          '100000000000', // delegate 100000 ntrn to strong so that it's enough to produce blocks by itself (> 66.6%)
        );
      });

      test.skip('perform multiple delegations', async () => {
        const delegators = [
          { wallet: neutronWallet1, client: neutronClient1 },
          { wallet: neutronWallet2, client: neutronClient2 },
        ];

        for (const { wallet, client } of delegators) {
          for (const validator of [validatorWeakAddr, validatorStrongAddr]) {
            await delegateTokens(client, wallet.address, validator, '1000000');
          }

          const demoWallet = testState.wallets.neutron.demo1;
          const demoWalletClient = await SigningNeutronClient.connectWithSigner(
            testState.rpcNeutron,
            demoWallet.directwallet,
            demoWallet.address,
          );
          await delegateTokens(
            demoWalletClient,
            demoWallet.address,
            validatorStrongAddr,
            '100000000000', // delegate 100000 ntrn to strong so that it's enough to produce blocks by itself (> 66.6%)
          );
        }
      });

      test('claim rewards for validator', async () => {
        const balanceBeforeClaim = await bankQuerier.balance({
          address: validatorPrimary.address,
          denom: NEUTRON_DENOM,
        });

        const res = await validatorPrimaryClient.execute(STAKING_REWARDS, {
          claim_rewards: {},
        });
        expect(res.code).toEqual(0);

        const balanceAfterClaim = await bankQuerier.balance({
          address: validatorPrimary.address,
          denom: NEUTRON_DENOM,
        });

        console.log(
          'address: ' +
            validatorPrimary.address +
            '    balanceBeforeClaim: ' +
            balanceBeforeClaim.balance.amount +
            ' , balanceAfterClaim: ' +
            balanceAfterClaim.balance.amount,
        );
        expect(+balanceAfterClaim.balance.amount).toBeGreaterThan(
          +balanceBeforeClaim.balance.amount,
        );
      });

      // delegate
      // claim (should work)
      // calculate rate per block
      // slash
      // wait blocks
      // claim again
      // calculate rate per block (rate of accruing rewards should be less because lf slashing)
      test.skip('claim rewards works as expected', async () => {
        // claim before delegate should not change anything
        const balanceBeforeDelegate = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });
        // expect(+balanceBeforeDelegate.balance.amount).toEqual(0);
        console.log(
          'balanceBeforeDelegate: ' + balanceBeforeDelegate.balance.amount,
        );

        const res2 = await neutronClient1.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res2.code).toEqual(0);

        // ==================

        // claim did not change balance
        const balanceBeforeDelegate2 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });
        console.log(
          'balanceBeforeDelegate2: ' + balanceBeforeDelegate2.balance.amount,
        );
        // expect(+balanceBeforeDelegate2.balance.amount).toEqual(0);

        // delegate
        const delegationAmount = '1000000000';
        // const delegationAmount2 = 10000000000; = delegationAmount;
        const res3 = await delegateTokens(
          neutronClient1,
          neutronWallet1.address,
          validatorWeakAddr,
          delegationAmount, // 1000ntrn
        );
        expect(res3.code).toEqual(0);
        const delegationHeight = res3.height;
        console.log('delegationHeight: ' + delegationHeight);
        // wait some number of blocks to get accumulate claimable tokens
        await neutronClient1.waitBlocks(10);

        const res4 = await neutronClient1.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res4.code).toEqual(0);
        // console.log('logs: \n' + JSON.stringify(res4.events));
        const claimHeight1 = res4.height;
        console.log('claimHeight1: ' + claimHeight1);

        // claim changed balance
        const balanceAfterDelegate1 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });
        console.log(
          'balanceAfterDelegate1: ' + balanceAfterDelegate1.balance.amount,
        );
        expect(+balanceAfterDelegate1.balance.amount).toBeGreaterThan(0);

        // expected rate now is:
        const accrueRateExpected = +delegationAmount * (0.1 / 100); // 10% every 100 blocks
        const claimExpected =
          (claimHeight1 - delegationHeight) * accrueRateExpected;
        console.log('blocksPassed: ' + (claimHeight1 - delegationHeight));
        console.log(
          'rateExpected: ' +
            accrueRateExpected +
            ', claimExpected: ' +
            claimExpected,
        );
        const claimReal =
          +balanceAfterDelegate1.balance.amount -
          +balanceBeforeDelegate2.balance.amount;
        console.log('claimReal: ' + claimReal);
        const realRate1 = claimReal / (claimHeight1 - delegationHeight);

        // delegation wallet
        const vaultInfoBeforeSlashingWallet = await getStakingTrackerInfo(
          neutronClient1,
          neutronWallet1.address,
          STAKING_TRACKER,
        );
        console.log(
          `WALLET Voting Power Before Slashing: ${vaultInfoBeforeSlashingWallet.power}`,
        );

        // console.log(`Validator to slash: ${validatorSecondary.valAddress}`);
        // console.log(`Validator #2: ${validatorStrongAddr}`);

        await simulateSlashingAndJailing(
          validatorSecondClient,
          neutronClient1,
          stakingQuerier,
          validatorSecondary.valAddress,
          validatorStrongAddr,
          validatorSecondary.address,
          12,
        );

        while (true) {
          console.log('waiting for val to be jailed');
          const val = await stakingQuerier.validator({
            validatorAddr: validatorWeakAddr,
          });
          if (val.validator.jailed) {
            break;
          }
          await waitSeconds(3);
        }

        // clean up pending rewards before slashing to see clean rate
        const resClaim2 = await neutronClient1.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(resClaim2.code).toEqual(0);
        const claimHeightAfterSlashing = resClaim2.height;

        const balanceAfterSlashing1 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

        const vaultInfoAfterSlashing = await getStakingTrackerInfo(
          validatorSecondClient,
          validatorSecondary.address,
          STAKING_TRACKER,
          await validatorSecondClient.getHeight(),
        );
        console.log(
          `Voting Power After Slashing and Jailing (SHOULD BE ZERO!!!): ${vaultInfoAfterSlashing.power}`,
        );
        expect(+vaultInfoAfterSlashing.power).toEqual(0);

        // delegation wallet
        const vaultInfoAfterSlashingWallet = await getStakingTrackerInfo(
          neutronClient1,
          neutronWallet1.address,
          STAKING_TRACKER,
        );
        console.log(
          `WALLET Voting Power After Slashing (should be zero!!!): ${vaultInfoAfterSlashingWallet.power}`,
        );
        // TODO: see why sometimes `AssertionError: expected 0 to be greater than 0`
        expect(vaultInfoBeforeSlashingWallet.power).toBeGreaterThan(
          vaultInfoAfterSlashingWallet.power,
        );
        expect(vaultInfoAfterSlashingWallet.power).toEqual(0);

        // wait blocks to accrue claim under lower stake after slashing
        await neutronClient1.waitBlocks(20);

        const res5 = await neutronClient1.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res5.code).toEqual(0);
        const claimHeightAfterSlashing2 = res5.height;

        const balanceAfterSlashing2 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });
        console.log(
          'balanceAfterSlashing1: ' +
            balanceAfterSlashing1.balance.amount +
            '   balanceAfterSlashing2: ' +
            balanceAfterSlashing2.balance.amount,
        );
        const newClaimReal =
          +balanceAfterSlashing2.balance.amount -
          +balanceAfterSlashing1.balance.amount;
        console.log('Balance change: ' + newClaimReal);
        console.log('claimReal: ' + newClaimReal);
        const realRate2 =
          newClaimReal / (claimHeightAfterSlashing2 - claimHeightAfterSlashing);

        console.log(
          'realRate1: ' +
            realRate1 +
            ' , realRate2 (SHOULD BE 0): ' +
            realRate2,
        );

        expect(realRate2).toBeLessThan(realRate1);
        expect(realRate2).toBe(0);

        // waiting for unjail
        console.log('waiting 30s for unjail...');
        await waitSeconds(30);

        const vaultInfoBeforeJail = await getStakingTrackerInfo(
          neutronClient1,
          neutronWallet1.address,
          STAKING_TRACKER,
        );
        console.log(
          'vaultInfoAfterJail: ' + JSON.stringify(vaultInfoBeforeJail),
        );

        // **Step 3: Unjail Validator**
        const resUnjail = await validatorSecondClient.signAndBroadcast(
          [
            {
              typeUrl: '/cosmos.slashing.v1beta1.MsgUnjail',
              value: {
                validatorAddr: validatorSecondary.valAddress,
              },
            },
          ],
          {
            amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
            gas: '2000000',
          },
        );

        console.log(resUnjail.rawLog);
        expect(resUnjail.code).toEqual(0);

        const resAfterSlashing3 = await neutronClient1.execute(
          STAKING_REWARDS,
          {
            claim_rewards: {
              to_address: claimRecipient,
            },
          },
        );
        expect(resAfterSlashing3.code).toEqual(0);
        const claimHeightAfterSlashing3 = resAfterSlashing3.height;
        const balanceAfterSlashing3 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

        await neutronClient1.waitBlocks(10);

        const resAfterSlashing4 = await neutronClient1.execute(
          STAKING_REWARDS,
          {
            claim_rewards: {
              to_address: claimRecipient,
            },
          },
        );
        expect(resAfterSlashing4.code).toEqual(0);
        const claimHeightAfterSlashing4 = resAfterSlashing4.height;
        const balanceAfterSlashing4 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

        // TODO: wait blocks here; then compare to previous line height to get actual rate!

        const vaultInfoAfterJail = await getStakingTrackerInfo(
          neutronClient1,
          neutronWallet1.address,
          STAKING_TRACKER,
        );
        console.log(
          'vaultInfoAfterJail: ' + JSON.stringify(vaultInfoAfterJail),
        );

        console.log(
          'balanceAfterSlashing4: ' + balanceAfterSlashing4.balance.amount,
        );
        const newClaimReal3 =
          +balanceAfterSlashing4.balance.amount -
          +balanceAfterSlashing3.balance.amount;
        console.log(
          'Balance change: ' + newClaimReal3,
          '   height change: ' +
            (claimHeightAfterSlashing4 - claimHeightAfterSlashing3),
        );
        const realRate3 =
          newClaimReal3 /
          (claimHeightAfterSlashing4 - claimHeightAfterSlashing3);
        console.log('realRate3: ' + realRate3, '   realRate1: ' + realRate1);
        expect(realRate3).toBeLessThan(realRate1);
        expect(realRate3 / 2.0).toBeCloseTo((realRate1 * 0.9) / 2, 2);
      });

      test('blacklisted address works with rewards correctly', async () => {
        const delegationAmount = '1000000000'; // 1000ntrn
        const blacklistedWallet = await testState.nextWallet('neutron');
        console.log('blacklistedWallet: ' + blacklistedWallet.address);
        const blacklistedClient = await SigningNeutronClient.connectWithSigner(
          testState.rpcNeutron,
          blacklistedWallet.directwallet,
          blacklistedWallet.address,
        );

        // delegate
        // test claim works
        // blacklist
        // claim, then test claim doesn't add to balance
        // remove from blacklist
        // then test claim works
        const res1 = await delegateTokens(
          blacklistedClient,
          blacklistedWallet.address,
          validatorStrongAddr,
          delegationAmount, // 1000ntrn
        );
        console.log('problems: ' + res1.rawLog);
        expect(res1.code).toEqual(0);

        await blacklistedClient.waitBlocks(2);
        const balance1 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

        const res2 = await blacklistedClient.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res2.code).toEqual(0);

        const balance2 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

        console.log(
          'beforeblacklist: balance1: ' +
            balance1.balance.amount +
            ' balance2: ' +
            balance2.balance.amount,
        );
        expect(+balance2.balance.amount).toBeGreaterThan(
          +balance1.balance.amount,
        );

        // blacklist
        const res3 = await neutronClient1.execute(STAKING_TRACKER, {
          add_to_blacklist: [claimRecipient],
        });
        expect(res3.code).toEqual(0);

        // claim pending rewards
        const res4 = await blacklistedClient.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res4.code).toEqual(0);

        const balance3 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

        await blacklistedClient.waitBlocks(10);

        // claim again, should be zero because blacklisted
        const res5 = await blacklistedClient.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res5.code).toEqual(0);
        const balance4 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });
        console.log(
          'balance4: ' +
            balance4.balance.amount +
            '  balance3: ' +
            balance3.balance.amount,
        );
        expect(+balance4.balance.amount).toEqual(+balance3.balance.amount);

        // remove from blacklist
        const res6 = await neutronClient1.execute(STAKING_REWARDS, {
          remove_from_blacklist: [claimRecipient],
        });
        expect(res6.code).toEqual(0);

        await blacklistedClient.waitBlocks(10);
        const res7 = await blacklistedClient.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res7.code).toEqual(0);

        const balance5 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });
        console.log('balance5: ' + balance5.balance.amount);
        expect(+balance5.balance.amount).toBeGreaterThan(
          +balance4.balance.amount,
        );
      });
    });
  });
});

const delegateTokens = async (
  client: SigningNeutronClient,
  delegatorAddress,
  validatorAddress,
  amount,
): Promise<DeliverTxResponse> =>
  await client.signAndBroadcast(
    [
      {
        typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
        value: {
          delegatorAddress,
          validatorAddress,
          amount: { denom: NEUTRON_DENOM, amount },
        },
      },
    ],
    { amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }], gas: '2000000' },
  );

export const simulateSlashingAndJailing = async (
  validatorClient: SigningNeutronClient,
  neutronClient: SigningNeutronClient,
  stakingQuerier: StakingQueryClient,
  validatorAddr: string,
  alternativeValidatorAddr: string,
  delegatorAddr: string,
  missedBlocks = 10, // Default to slashing threshold
) => {
  // Check if validator has been slashed
  let validatorInfo = await stakingQuerier.validator({ validatorAddr });

  // Check if the network has enough voting power to continue producing blocks
  const activeValidators = await stakingQuerier.validators({
    status: 'BOND_STATUS_BONDED',
  });
  const totalVotingPower = activeValidators.validators.reduce(
    (acc, val) => acc + Number(val.tokens),
    0,
  );

  console.log(`Total active voting power: ${totalVotingPower}`);

  // Retrieve voting power of both validators
  const slashedValidator = activeValidators.validators.find(
    (val) => val.operatorAddress === validatorAddr,
  );
  const alternativeValidator = activeValidators.validators.find(
    (val) => val.operatorAddress === alternativeValidatorAddr,
  );

  if (!slashedValidator) {
    console.log(`Slashed validator ${validatorAddr} not found.`);
  } else {
    console.log(
      `Slashed Validator Power Before: ${Number(slashedValidator.tokens)}`,
    );
  }

  if (!alternativeValidator) {
    console.log(`Alternative validator ${alternativeValidatorAddr} not found.`);
    return;
  }

  const alternativeValidatorPower = Number(alternativeValidator.tokens);
  // console.log(`Alternative Validator Power: ${alternativeValidatorPower}`);

  const minRequiredPower = Math.ceil(totalVotingPower * 0.68);
  // console.log(`Minimum Required Power for Consensus: ${minRequiredPower}`);

  if (alternativeValidatorPower < minRequiredPower) {
    console.log(
      `Alternative validator does not have enough power, delegating ${
        minRequiredPower - alternativeValidatorPower
      } to ${alternativeValidatorAddr}`,
    );
    await delegateTokens(
      validatorClient,
      delegatorAddr,
      alternativeValidatorAddr,
      (minRequiredPower - alternativeValidatorPower).toString(),
    );
  }

  // slashed validator
  const vaultInfoBeforeSlashing = await getStakingTrackerInfo(
    validatorClient,
    validatorAddr,
    STAKING_TRACKER,
  );
  console.log(`Voting Power Before Slashing: ${vaultInfoBeforeSlashing.power}`);

  console.log(`Pausing validator container: ${VALIDATOR_CONTAINER}`);
  execSync(`docker pause ${VALIDATOR_CONTAINER}`);

  console.log(`Waiting ${missedBlocks} blocks to trigger slashing...`);
  try {
    await waitBlocksTimeout(missedBlocks, neutronClient, 20000);
  } catch (e) {
    // console.log('after timeout');
  } // expected error because of timeout. Blocks are not produced after turning off the val, so

  console.log(`Unpausing validator container: ${VALIDATOR_CONTAINER}`);
  execSync(`docker unpause ${VALIDATOR_CONTAINER}`);

  // console.log(`Waiting 2 blocks to confirm status update...`);
  await waitBlocks(2, neutronClient);

  // Re-check validator status
  validatorInfo = await stakingQuerier.validator({ validatorAddr });
  // console.log(`Final validator status: ${validatorInfo.validator.status}`);

  // Retrieve voting power of both validators
  console.log(
    `Slashed Validator Power Before: ${Number(validatorInfo.validator.tokens)}`,
  );

  return validatorInfo.validator.status;
};

const getStakingTrackerInfo = async (
  client: SigningNeutronClient,
  address: string,
  stakingTrackerAddr: string,
  height?: number,
): Promise<VotingPowerInfo> => {
  if (typeof height === 'undefined') {
    height = await client.getHeight();
  }

  const power = await client.queryContractSmart(stakingTrackerAddr, {
    voting_power_at_height: {
      address: address,
      ...(height !== undefined ? { height: height } : {}),
    },
  });

  const totalPower = await client.queryContractSmart(stakingTrackerAddr, {
    total_power_at_height: {
      ...(height !== undefined ? { height: height } : {}),
    },
  });

  return {
    height: height,
    power: +power,
    totalPower: +totalPower,
  };
};

type VotingPowerInfo = {
  height: number;
  power: number;
  totalPower: number;
};

// same as waitBlocks, but do not error on timeout
export const waitBlocksTimeout = async (
  blocks: number,
  client: StargateClient | CosmWasmClient,
  timeout = 120000,
): Promise<void> => {
  const start = Date.now();
  // const client = await StargateClient.connect(this.rpc);
  const initBlock = await client.getBlock();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const block = await client.getBlock();
      if (block.header.height - initBlock.header.height >= blocks) {
        break;
      }
      // console.log('timeout number: ' + (Date.now() - start));
      if (Date.now() - start > timeout) {
        break;
      }
    } catch (e) {
      //noop
    }
    await sleep(1000);
  }
};

// TODO: use from neutronjsplus
/**
 * submitUpdateParamsRateLimitProposal creates proposal which changes params of slashing module.
 */
export const submitUpdateParamsSlashingProposal = async (
  dao: DaoMember,
  chainManagerAddress: string,
  title: string,
  description: string,
  params: ParamsSlashingInfo,
  amount: string,
): Promise<number> => {
  const message = chainManagerWrapper(chainManagerAddress, {
    custom: {
      submit_admin_proposal: {
        admin_proposal: {
          proposal_execute_message: {
            message: JSON.stringify({
              '@type': '/cosmos.slashing.v1beta1.MsgUpdateParams',
              authority: ADMIN_MODULE_ADDRESS,
              params,
            }),
          },
        },
      },
    },
  });
  return await dao.submitSingleChoiceProposal(
    title,
    description,
    [message],
    amount,
  );
};

export type Duration = string;

export type ParamsSlashingInfo = {
  signed_blocks_window: string; // int64
  min_signed_per_window: string; // base64?
  downtime_jail_duration: Duration;
  slash_fraction_double_sign: string; // dec
  slash_fraction_downtime: string; // dec
};
