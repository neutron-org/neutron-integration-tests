import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitBlocks, waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import {
  NEUTRON_DENOM,
  SECOND_VALIDATOR_CONTAINER,
  STAKING_REWARDS,
  STAKING_TRACKER,
  VAL_MNEMONIC_1,
  VAL_MNEMONIC_2,
} from '../../helpers/constants';
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

describe('Neutron / Staking Rewards', () => {
  let testState: LocalState;
  let neutronClient1: SigningNeutronClient;
  let neutronClient2: SigningNeutronClient;

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

  let claimRecipient: string;

  // dao
  let mainDao: Dao;
  let daoMember1: DaoMember;
  let chainManagerAddress: string;

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
    // bond a lot to avoid not passing the proposal since now all stake is counted
    await daoMember1.bondFunds('1999999491000');
    const neutronQuerier = await createNeutronClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    const admins = await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
    chainManagerAddress = admins.admins[0];
  });

  describe('Staking Rewards', () => {
    describe('Set slashing params', () => {
      let proposalId;
      test('create proposal', async () => {
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
        await daoMember1.voteYes(proposalId);
        await mainDao.checkPassedProposal(proposalId);
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
        validatorStrongAddr = validatorPrimary.valAddress;
        validatorWeakAddr = validatorSecondary.valAddress;

        await delegateTokens(
          demoWalletClient,
          demoWallet.address,
          validatorStrongAddr,
          '100000000000', // delegate 100000 ntrn to strong so that it's enough to produce blocks by itself (> 66.6%)
        );
      });

      test('claim rewards for strong validator', async () => {
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

        expect(+balanceAfterClaim.balance.amount).toBeGreaterThan(
          +balanceBeforeClaim.balance.amount,
        );
      });

      test('claim rewards for weak validator without new delegations', async () => {
        const balanceBeforeClaim = await bankQuerier.balance({
          address: validatorSecondary.address,
          denom: NEUTRON_DENOM,
        });

        const res = await validatorSecondClient.execute(STAKING_REWARDS, {
          claim_rewards: {},
        });
        expect(res.code).toEqual(0);

        const balanceAfterClaim = await bankQuerier.balance({
          address: validatorSecondary.address,
          denom: NEUTRON_DENOM,
        });

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
      test('claim rewards works as a user', async () => {
        const balanceBeforeDelegate = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

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
        expect(+balanceBeforeDelegate2.balance.amount).toEqual(
          +balanceBeforeDelegate.balance.amount,
        );

        // delegate
        const delegationAmount = '1000000000';
        const res3 = await delegateTokens(
          neutronClient1,
          neutronWallet1.address,
          validatorWeakAddr,
          delegationAmount, // 1000ntrn
        );
        expect(res3.code).toEqual(0);
        const delegationHeight = res3.height;
        // wait some number of blocks to get accumulate claimable tokens
        await neutronClient1.waitBlocks(10);

        const res4 = await neutronClient1.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res4.code).toEqual(0);
        const claimHeight1 = res4.height;

        // claim changed balance
        const balanceAfterDelegate1 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });
        expect(+balanceAfterDelegate1.balance.amount).toBeGreaterThan(0);

        // expected rate now is:
        const claimReal =
          +balanceAfterDelegate1.balance.amount -
          +balanceBeforeDelegate2.balance.amount;
        const realRate1 = claimReal / (claimHeight1 - delegationHeight);

        // delegation wallet
        const vaultInfoBeforeSlashingWallet = await getStakingTrackerInfo(
          neutronClient1,
          neutronWallet1.address,
          STAKING_TRACKER,
        );

        await simulateSlashingAndJailing(
          validatorSecondClient,
          neutronClient1,
          stakingQuerier,
          validatorSecondary.valAddress,
          validatorStrongAddr,
          validatorSecondary.address,
          12,
        );

        for (;;) {
          console.log('waiting for val to be jailed...');
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
        expect(+vaultInfoAfterSlashing.power).toEqual(0);

        // delegation wallet
        const vaultInfoAfterSlashingWallet = await getStakingTrackerInfo(
          neutronClient1,
          neutronWallet1.address,
          STAKING_TRACKER,
        );
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
        const newClaimReal =
          +balanceAfterSlashing2.balance.amount -
          +balanceAfterSlashing1.balance.amount;
        const realRate2 =
          newClaimReal / (claimHeightAfterSlashing2 - claimHeightAfterSlashing);

        expect(realRate2).toBeLessThan(realRate1);
        expect(realRate2).toBe(0);

        // waiting for unjail
        console.log('waiting 30s for unjail...');
        await waitSeconds(30);

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

        const newClaimReal3 =
          +balanceAfterSlashing4.balance.amount -
          +balanceAfterSlashing3.balance.amount;
        const realRate3 =
          newClaimReal3 /
          (claimHeightAfterSlashing4 - claimHeightAfterSlashing3);
        expect(realRate3).toBeLessThan(realRate1);
        expect(realRate3 / 2.0).toBeCloseTo((realRate1 * 0.9) / 2, 2);
      });

      test('blacklisted address works with rewards correctly', async () => {
        const delegationAmount = '1000000000'; // 1000ntrn
        const blacklistedWallet = await testState.nextWallet('neutron');
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

        expect(+balance2.balance.amount).toBeGreaterThan(
          +balance1.balance.amount,
        );

        // blacklist
        // Create the Blacklist Proposal

        const proposalId1 = await submitAddToBlacklistProposal(
          daoMember1,
          STAKING_TRACKER,
          'Blacklist Address Proposal',
          'Proposal to blacklist an address from voting',
          { addresses: [blacklistedWallet.address] },
          '1000',
        );
        await daoMember1.voteYes(proposalId1);
        await mainDao.checkPassedProposal(proposalId1);
        await daoMember1.executeProposalWithAttempts(proposalId1);

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
        expect(+balance4.balance.amount).toEqual(+balance3.balance.amount);

        // remove from blacklist
        const proposalId2 = await submitRemoveFromBlacklistProposal(
          daoMember1,
          STAKING_TRACKER,
          'Remove from Blacklist Address Proposal',
          'Proposal to remove blacklisted address from voting',
          { addresses: [blacklistedWallet.address] },
          '1000',
        );
        await daoMember1.voteYes(proposalId2);
        await mainDao.checkPassedProposal(proposalId2);
        await daoMember1.executeProposalWithAttempts(proposalId2);

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
        expect(+balance5.balance.amount).toBeGreaterThan(
          +balance4.balance.amount,
        );
      });

      test('redelegation works with rewards correctly', async () => {
        const delegationAmount = '1000000000'; // 1000ntrn
        const redelegationAmount = '1000000000';
        const wallet = await testState.nextWallet('neutron');
        const client = await SigningNeutronClient.connectWithSigner(
          testState.rpcNeutron,
          wallet.directwallet,
          wallet.address,
        );

        const claimRecipient = (await testState.nextWallet('neutron')).address;

        // delegate
        // redelegate
        // test claim still accrues funds after redelegation
        const res1 = await delegateTokens(
          client,
          wallet.address,
          validatorStrongAddr,
          delegationAmount, // 1000ntrn
        );
        expect(res1.code).toEqual(0);

        await redelegateTokens(
          client,
          wallet.address,
          validatorStrongAddr,
          validatorWeakAddr,
          redelegationAmount,
        );

        const balance1 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

        const res2 = await client.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res2.code).toEqual(0);

        const balance2 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

        expect(+balance2.balance.amount).toBeGreaterThan(
          +balance1.balance.amount,
        );

        // wait for claim tokens to accrue
        await client.waitBlocks(5);

        const res3 = await client.execute(STAKING_REWARDS, {
          claim_rewards: {
            to_address: claimRecipient,
          },
        });
        expect(res3.code).toEqual(0);

        const balance3 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });

        expect(+balance3.balance.amount).toBeGreaterThan(
          +balance2.balance.amount,
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
  console.log(`Alternative Validator Power: ${alternativeValidatorPower}`);

  const minRequiredPower = Math.ceil(totalVotingPower * 0.68);
  console.log(`Minimum Required Power for Consensus: ${minRequiredPower}`);

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

  console.log(`Pausing validator container: ${SECOND_VALIDATOR_CONTAINER}`);
  execSync(`docker pause ${SECOND_VALIDATOR_CONTAINER}`);

  console.log(`Waiting ${missedBlocks} blocks to trigger slashing...`);
  try {
    await waitBlocksTimeout(missedBlocks, neutronClient, 20000);
  } catch (e) {
    // expected error because of timeout. Blocks are not produced after turning off the val.
  }

  console.log(`Unpausing validator container: ${SECOND_VALIDATOR_CONTAINER}`);
  execSync(`docker unpause ${SECOND_VALIDATOR_CONTAINER}`);

  console.log(`Waiting 2 blocks to confirm status update...`);
  await waitBlocks(2, neutronClient);

  // Re-check validator status
  validatorInfo = await stakingQuerier.validator({ validatorAddr });
  console.log(`Final validator status: ${validatorInfo.validator.status}`);

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

export type AddToBlacklistInfo = {
  addresses: string[];
};

export type RemoveFromBlacklistInfo = {
  addresses: string[];
};

// TODO: use from neutronjsplus
export const submitAddToBlacklistProposal = async (
  dao: DaoMember,
  contractAddress: string,
  title: string,
  description: string,
  blacklist: AddToBlacklistInfo,
  deposit: string,
): Promise<number> => {
  const wasmMessage = {
    wasm: {
      execute: {
        contract_addr: contractAddress,
        msg: Buffer.from(
          JSON.stringify({
            add_to_blacklist: blacklist,
          }),
        ).toString('base64'),
        funds: [],
      },
    },
  };

  return await dao.submitSingleChoiceProposal(
    title,
    description,
    [wasmMessage],
    deposit,
  );
};

// TODO: use from neutronjsplus
export const submitRemoveFromBlacklistProposal = async (
  dao: DaoMember,
  contractAddress: string,
  title: string,
  description: string,
  blacklist: RemoveFromBlacklistInfo,
  deposit: string,
): Promise<number> => {
  const wasmMessage = {
    wasm: {
      execute: {
        contract_addr: contractAddress,
        msg: Buffer.from(
          JSON.stringify({
            remove_from_blacklist: blacklist,
          }),
        ).toString('base64'),
        funds: [],
      },
    },
  };

  return await dao.submitSingleChoiceProposal(
    title,
    description,
    [wasmMessage],
    deposit,
  );
};
