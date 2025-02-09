import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
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

const CLAIM_RECIPIENT = 'neutron1rqg6t032dnpefckup2nlt3sjhawqhynqsgu4qj';

const VALIDATOR_CONTAINER = 'neutron-node-1';

describe('Neutron / Staking Vault - Extended Scenarios', () => {
  let testState: LocalState;
  let neutronClient1: SigningNeutronClient;
  let neutronClient2: SigningNeutronClient;
  // let validatorClient: SigningNeutronClient;

  let neutronWallet1: Wallet;
  let neutronWallet2: Wallet;
  let stakingQuerier: StakingQueryClient;
  let bankQuerier: BankQueryClient;

  // let validatorPrimaryClient: SigningNeutronClient;
  let validatorSecondClient: SigningNeutronClient;
  let validatorWeakAddr: string;
  let validatorStrongAddr: string;
  let validatorSecondary: Wallet;
  // let validatorPrimary: Wallet;

  // let validator1SelfDelegation: number;
  // let validator2SelfDelegation: number;

  const delegationAmount = '1000000'; // 1 NTRN
  const undelegationAmount = '500000'; // 0.5 NTRN
  const redelegationAmount = '300000'; // 0.3 NTRN

  beforeAll(async (suite: RunnerTestSuite) => {
    const mnemonics = inject('mnemonics');
    testState = await LocalState.create(config, mnemonics, suite);

    neutronWallet1 = await testState.nextWallet('neutron');
    neutronWallet2 = await testState.nextWallet('neutron');
    validatorSecondary = await mnemonicToWallet(VAL_MNEMONIC_2, 'neutron');
    // validatorPrimary = await mnemonicToWallet(VAL_MNEMONIC_1, 'neutron');

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

    // This is the client for validator that could be disabled during testrun
    validatorSecondClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      validatorSecondary.directwallet,
      validatorSecondary.address,
    );

    // This is client for validator that should work ALWAYS bc it's only one that exposes ports
    // In the state it is validator #2, so this naming is only for clients
    // validatorPrimaryClient = await SigningNeutronClient.connectWithSigner(
    //   testState.rpcNeutron,
    //   validatorPrimary.directwallet,
    //   validatorPrimary.address,
    // );

    const neutronRpcClient = await testState.neutronRpcClient();
    stakingQuerier = new StakingQueryClient(neutronRpcClient);
    bankQuerier = new BankQueryClient(neutronRpcClient);
  });

  describe('Staking Rewards', () => {
    describe('ClaimRewards', () => {
      test('send to the rewards pool', async () => {
        const res = await neutronClient2.sendTokens(STAKING_REWARDS, [
          {
            denom: NEUTRON_DENOM,
            amount: '8000000000',
          },
        ]);
        expect(res.code).toEqual(0);
      });
      test('save vals and delegate to them', async () => {
        const validators = await stakingQuerier.validators({
          status: 'BOND_STATUS_BONDED',
        });

        validatorWeakAddr = validators.validators[0].operatorAddress; // TODO: why 0 and 1 index? can you deterministically do that?
        // validator1SelfDelegation = +validators.validators[0].tokens;

        validatorStrongAddr = validators.validators[1].operatorAddress;
        // validator2SelfDelegation = +validators.validators[1].tokens;

        // console.log('ValidatorWeak:', validatorWeakAddr);
        // console.log('ValidatorStrong:', validatorStrongAddr);
      });

      test('perform multiple delegations and validate historical voting power', async () => {
        const delegators = [
          { wallet: neutronWallet1, client: neutronClient1 },
          { wallet: neutronWallet2, client: neutronClient2 },
        ];

        for (const { wallet, client } of delegators) {
          const heightBefore = await client.getHeight();

          for (const validator of [validatorWeakAddr, validatorStrongAddr]) {
            await delegateTokens(
              client,
              wallet.address,
              validator,
              delegationAmount,
            );
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

          await waitBlocks(2, client);
          const heightAfter = await client.getHeight();

          const vaultInfoBefore = await getStakingTrackerInfo(
            client,
            wallet.address,
            STAKING_TRACKER,
            heightBefore,
          );
          const vaultInfoAfter = await getStakingTrackerInfo(
            client,
            wallet.address,
            STAKING_TRACKER,
            heightAfter,
          );

          expect(vaultInfoBefore.power).toEqual(0);
          expect(vaultInfoAfter.power).toEqual(+delegationAmount * 2);
        }
      });

      // delegate
      // claim (should work)
      // A = calculate rate per block
      // slash
      // wait blocks
      // claim again (rate of accruing rewards should be less because lf slashing)
      test('claim rewards works as expected', async () => {
        // claim before delegate should not change anything
        const balanceBeforeDelegate = await bankQuerier.balance({
          address: CLAIM_RECIPIENT,
          denom: NEUTRON_DENOM,
        });
        // expect(+balanceBeforeDelegate.balance.amount).toEqual(0);
        console.log(
          'balanceBeforeDelegate: ' + balanceBeforeDelegate.balance.amount,
        );

        const res2 = await neutronClient1.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: CLAIM_RECIPIENT,
          },
        });
        expect(res2.code).toEqual(0);

        // ==================

        // claim did not change balance
        const balanceBeforeDelegate2 = await bankQuerier.balance({
          address: CLAIM_RECIPIENT,
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

        // tmp wallet balance
        // const kekwBefore = await bankQuerier.balance({
        //   address: neutronWallet1.address,
        //   denom: NEUTRON_DENOM,
        // });
        // console.log(
        //   'kekwAfter: ' +
        //     neutronWallet1.address +
        //     'balance: ' +
        //     kekwBefore.balance.amount,
        // );

        const res4 = await neutronClient1.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: CLAIM_RECIPIENT,
          },
        });
        expect(res4.code).toEqual(0);
        // console.log('logs: \n' + JSON.stringify(res4.events));
        const claimHeight1 = res4.height;
        console.log('claimHeight: ' + claimHeight1);

        // tmp wallet balance
        // const kekwAfter = await bankQuerier.balance({
        //   address: neutronWallet1.address,
        //   denom: NEUTRON_DENOM,
        // });
        // console.log(
        //   'kekwAfter: ' +
        //     neutronWallet1.address +
        //     'balance: ' +
        //     kekwAfter.balance.amount,
        // );
        // claim changed balance
        const balanceAfterDelegate1 = await bankQuerier.balance({
          address: CLAIM_RECIPIENT,
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

        // TODO: ADD MORE STAKE TO VALIDATOR1

        await simulateSlashingAndJailing(
          validatorSecondClient,
          neutronClient1,
          stakingQuerier,
          validatorSecondary.valAddress,
          validatorStrongAddr,
          validatorSecondary.address,
          12,
        );

        console.log(
          `Waiting 10 more blocks to check if validator gets jailed...`,
        );
        await waitBlocks(10, neutronClient1);
        // expect(newStatus).toEqual(4);
        const vaultInfoAfterSlashing = await getStakingTrackerInfo(
          validatorSecondClient,
          validatorSecondary.address,
          STAKING_TRACKER,
          await validatorSecondClient.getHeight(),
        );
        console.log(
          `Voting Power After Slashing: ${vaultInfoAfterSlashing.power}`,
        );

        // delegation wallet
        const vaultInfoAfterSlashingWallet = await getStakingTrackerInfo(
          neutronClient1,
          neutronWallet1.address,
          STAKING_TRACKER,
        );
        console.log(
          `WALLET Voting Power After Slashing: ${vaultInfoAfterSlashingWallet.power}`,
        );
        expect(vaultInfoBeforeSlashingWallet.power).toBeGreaterThan(
          vaultInfoAfterSlashingWallet.power,
        );

        // wait blocks to accrue claim under lower stake after slashing
        await neutronClient1.waitBlocks(20);

        const res5 = await neutronClient1.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: CLAIM_RECIPIENT,
          },
        });
        expect(res5.code).toEqual(0);
        // console.log('logs: \n' + JSON.stringify(res4.events));
        const claimHeight2 = res5.height;

        const balanceAfterSlashing1 = await bankQuerier.balance({
          address: CLAIM_RECIPIENT,
          denom: NEUTRON_DENOM,
        });
        console.log(
          'claimed total after slashing: ' +
            balanceAfterSlashing1.balance.amount,
        );
        const newClaimReal =
          +balanceAfterSlashing1.balance.amount -
          +balanceAfterDelegate1.balance.amount;
        console.log('Balance change: ' + newClaimReal);

        const newAccrueRateExpected = +(+delegationAmount * 0.9) * (0.1 / 100); // 10% every 100 blocks
        const newClaimExpected =
          (claimHeight2 - claimHeight1) * newAccrueRateExpected;
        console.log(
          'newRateExpected: ' +
            newAccrueRateExpected +
            ', newClaimExpected: ' +
            newClaimExpected,
        );
        console.log('claimReal: ' + newClaimReal);
        const realRate2 = newClaimReal / (claimHeight2 - claimHeight1);

        console.log('realRate1: ' + realRate1 + ' , realRate2: ' + realRate2);

        expect(realRate2).toBeLessThan(realRate1);
      });

      // TODO: remove later
      test.skip('Validator gets slashed after missing blocks, then rebond and unjail', async () => {
        console.log(`Validator Address: ${validatorWeakAddr}`);

        // Query voting power before slashing
        const heightBeforeSlashing = await validatorSecondClient.getHeight();
        const vaultInfoBefore = await getStakingTrackerInfo(
          validatorSecondClient,
          validatorSecondary.address,
          STAKING_TRACKER,
          heightBeforeSlashing,
        );

        console.log(`Voting Power Before Slashing: ${vaultInfoBefore.power}`);

        console.log(`Validator to slash: ${validatorSecondary.valAddress}`);
        console.log(`Validator #2: ${validatorStrongAddr}`);

        const newStatus = await simulateSlashingAndJailing(
          validatorSecondClient,
          neutronClient1,
          stakingQuerier,
          validatorSecondary.valAddress,
          validatorStrongAddr,
          validatorSecondary.address,
          12,
        );

        console.log(
          `Waiting 10 more blocks to check if validator gets jailed...`,
        );
        await waitBlocks(10, neutronClient1);

        // Expect validator to be in the jail state
        expect(newStatus).toEqual(4);

        // Query voting power after unbonding leading to slashing
        const heightAfterSlashing = await validatorSecondClient.getHeight();
        const vaultInfoAfter = await getStakingTrackerInfo(
          validatorSecondClient,
          validatorSecondary.address,
          STAKING_TRACKER,
          heightAfterSlashing,
        );

        console.log(`Voting Power After Slashing: ${vaultInfoAfter.power}`);
        console.log(`Total Power After Slashing: ${vaultInfoAfter.totalPower}`);

        // Voting power should be lower or zero
        expect(vaultInfoAfter.power).toBeLessThan(vaultInfoBefore.power);

        // **Step 3: Unjail Validator**
        console.log(`Validator will attempt to unjail...`);
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

        console.log(`Waiting 3 blocks to confirm validator is unjailed...`);
        await waitBlocks(3, validatorSecondClient);

        // **Check validator status after unjailing**
        const validatorStateAfterUnjail = await stakingQuerier.validator({
          validatorAddr: validatorWeakAddr,
        });

        console.log(
          `Validator Status After Unjail: ${validatorStateAfterUnjail.validator.status}`,
        );

        // Validator should be bonded again
        expect(validatorStateAfterUnjail.validator.status).toEqual(3);

        // **Check voting power after unjailing**
        const vaultInfoAfterUnjail = await getStakingTrackerInfo(
          validatorSecondClient,
          validatorSecondary.address,
          STAKING_REWARDS,
        );

        console.log(
          `Voting Power After Unjailing: ${vaultInfoAfterUnjail.power}`,
        );

        // Ensure voting power is restored
        expect(vaultInfoAfterUnjail.power).toBeGreaterThan(
          vaultInfoAfter.power,
        );
      });
    });

    test.skip('perform multiple delegations and validate historical voting power', async () => {
      const delegators = [
        { wallet: neutronWallet1, client: neutronClient1 },
        { wallet: neutronWallet2, client: neutronClient2 },
      ];

      for (const { wallet, client } of delegators) {
        const heightBefore = await client.getHeight();

        for (const validator of [validatorWeakAddr, validatorStrongAddr]) {
          await delegateTokens(
            client,
            wallet.address,
            validator,
            delegationAmount,
          );
        }

        await waitBlocks(2, client);
        const heightAfter = await client.getHeight();

        const vaultInfoBefore = await getStakingTrackerInfo(
          client,
          wallet.address,
          STAKING_TRACKER,
          heightBefore,
        );
        const vaultInfoAfter = await getStakingTrackerInfo(
          client,
          wallet.address,
          STAKING_TRACKER,
          heightAfter,
        );

        expect(vaultInfoBefore.power).toEqual(0);
        expect(vaultInfoAfter.power).toEqual(+delegationAmount * 2);
      }
    });

    test.skip('perform redelegation from Validator1 to Validator2', async () => {
      const delegator = { wallet: neutronWallet1, client: neutronClient1 };

      const heightBeforeRedelegation = await delegator.client.getHeight();

      await redelegateTokens(
        delegator.client,
        delegator.wallet.address,
        validatorWeakAddr,
        validatorStrongAddr,
        redelegationAmount,
      );

      await waitBlocks(2, delegator.client);

      const heightAfterRedelegation = await delegator.client.getHeight();

      const vaultInfoBefore = await getStakingTrackerInfo(
        delegator.client,
        delegator.wallet.address,
        STAKING_TRACKER,
        heightBeforeRedelegation,
      );
      const vaultInfoAfter = await getStakingTrackerInfo(
        delegator.client,
        delegator.wallet.address,
        STAKING_TRACKER,
        heightAfterRedelegation,
      );

      expect(vaultInfoBefore.power).toEqual(vaultInfoAfter.power);
    });

    test.skip('perform undelegations and validate historical voting power', async () => {
      const delegators = [
        { wallet: neutronWallet1, client: neutronClient1 },
        { wallet: neutronWallet2, client: neutronClient2 },
      ];

      for (const { wallet, client } of delegators) {
        const heightBeforeUndelegation = await client.getHeight();

        await undelegateTokens(
          client,
          wallet.address,
          validatorWeakAddr,
          undelegationAmount,
        );
        await undelegateTokens(
          client,
          wallet.address,
          validatorStrongAddr,
          undelegationAmount,
        );

        await waitBlocks(2, client);
        const heightAfterUndelegation = await client.getHeight();

        const vaultInfoBefore = await getStakingTrackerInfo(
          client,
          wallet.address,
          STAKING_TRACKER,
          heightBeforeUndelegation,
        );
        const vaultInfoAfter = await getStakingTrackerInfo(
          client,
          wallet.address,
          STAKING_TRACKER,
          heightAfterUndelegation,
        );

        expect(vaultInfoAfter.power).toBeLessThan(vaultInfoBefore.power);
      }
    });
  });
});

const delegateTokens = async (
  client: SigningNeutronClient,
  delegatorAddress,
  validatorAddress,
  amount,
): Promise<DeliverTxResponse> => {
  const res = await client.signAndBroadcast(
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

  return res;
};

const redelegateTokens = async (
  client: SigningNeutronClient,
  delegatorAddress: string,
  validatorSrc: string,
  validatorDst: string,
  amount: string,
) => {
  const res = await client.signAndBroadcast(
    [
      {
        typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
        value: {
          delegatorAddress,
          validatorSrcAddress: validatorSrc,
          validatorDstAddress: validatorDst,
          amount: { denom: NEUTRON_DENOM, amount },
        },
      },
    ],
    {
      amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
      gas: '2000000',
    },
  );

  expect(res.code).toEqual(0);
};

const undelegateTokens = async (
  client: SigningNeutronClient,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
) => {
  const res = await client.signAndBroadcast(
    [
      {
        typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
        value: {
          delegatorAddress,
          validatorAddress,
          amount: { denom: NEUTRON_DENOM, amount },
        },
      },
    ],
    { amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }], gas: '2000000' },
  );
  console.log(res.rawLog);
  expect(res.code).toEqual(0);
};

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
  // console.log(
  //   `Validator status after slashing period: ${validatorInfo.validator.status}`,
  // );

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
    // console.log(`Delegation successful.`);
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
