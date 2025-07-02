import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import {
  NEUTRON_DENOM,
  STAKING_REWARDS,
  STAKING_TRACKER,
  VAL_MNEMONIC_1,
} from '../../helpers/constants';
import { expect, inject, RunnerTestSuite } from 'vitest';
import {
  LocalState,
  mnemonicWithAccountToWallet,
} from '../../helpers/local_state';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query.rpc.Query';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import {
  delegateTokens,
  getTrackedStakeInfo,
  pauseRewardsContract,
  redelegateTokens,
  undelegateTokens,
  simulateSlashingAndJailing,
  submitUpdateParamsSlashingProposal,
} from '../../helpers/staking';

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

    validatorPrimary = await mnemonicWithAccountToWallet(
      VAL_MNEMONIC_1,
      'neutron',
      1,
    );
    validatorSecondary = await mnemonicWithAccountToWallet(
      VAL_MNEMONIC_1,
      'neutron',
      2,
    );

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
      let proposalId: number;
      test('create accept and execute proposal', async () => {
        proposalId = await submitUpdateParamsSlashingProposal(
          daoMember1,
          chainManagerAddress,
          'Proposal #1',
          'Param change proposal. Update slashing params',
          {
            downtime_jail_duration: '3s',
            min_signed_per_window: '0.500000000000000000',
            signed_blocks_window: '30',
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
      // calculate rate per block (rate of accruing rewards should be less because of slashing)
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
        const vaultInfoBeforeSlashingWallet = await getTrackedStakeInfo(
          neutronClient1,
          neutronWallet1.address,
          STAKING_TRACKER,
        );
        expect(+vaultInfoBeforeSlashingWallet.stake).toBeGreaterThan(0);

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

        const vaultInfoAfterSlashing = await getTrackedStakeInfo(
          validatorSecondClient,
          validatorSecondary.address,
          STAKING_TRACKER,
          await validatorSecondClient.getHeight(),
        );
        expect(+vaultInfoAfterSlashing.stake).toEqual(0);

        // delegation wallet
        const vaultInfoAfterSlashingWallet = await getTrackedStakeInfo(
          neutronClient1,
          neutronWallet1.address,
          STAKING_TRACKER,
        );
        expect(vaultInfoBeforeSlashingWallet.stake).toBeGreaterThan(
          vaultInfoAfterSlashingWallet.stake,
        );
        expect(vaultInfoAfterSlashingWallet.stake).toEqual(0);

        // wait blocks to accrue claim under lower stake after slashing
        await neutronClient1.waitBlocks(10);

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
        await waitSeconds(5);

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

      test('full tx unbond works with rewards correctly', async () => {
        const delegationAmount = '10000000'; // 10ntrn
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
          delegationAmount,
        );
        expect(res1.code).toEqual(0);

        await client.waitBlocks(5);

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

        // undelegate full amount
        await undelegateTokens(
          client,
          wallet.address,
          validatorStrongAddr,
          delegationAmount, // Uses dynamically retrieved amount
        );

        await client.waitBlocks(2);

        const info = await getTrackedStakeInfo(
          client,
          wallet.address,
          STAKING_TRACKER,
        );
        expect(info.stake).toEqual(0);

        // claim to remove already accrued funds to make clean test
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

        await client.waitBlocks(5);

        const balance4 = await bankQuerier.balance({
          address: claimRecipient,
          denom: NEUTRON_DENOM,
        });
        // balance has not changed since last claim since stake is now zero
        expect(+balance4.balance.amount).toEqual(+balance3.balance.amount);
      });
    });
    describe('Pause contract', () => {
      test('can not claim rewards', async () => {
        await pauseRewardsContract(demoWalletClient);

        const balanceBefore = await bankQuerier.balance({
          address: validatorPrimary.address,
          denom: NEUTRON_DENOM,
        });

        await expect(
          validatorPrimaryClient.execute(STAKING_REWARDS, {
            claim_rewards: {},
          }),
        ).rejects.toThrow(
          /Action is denied, the contract is on pause temporarily/,
        );

        const balanceAfter = await bankQuerier.balance({
          address: validatorPrimary.address,
          denom: NEUTRON_DENOM,
        });

        expect(+balanceAfter.balance.amount).toEqual(
          +balanceBefore.balance.amount,
        );
      });
    });
  });
});
