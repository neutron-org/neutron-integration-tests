import { NeutronTestClient } from '../../helpers/neutron_test_client';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import {
  NEUTRON_DENOM,
  STAKING_TRACKER,
  STAKING_VAULT,
} from '../../helpers/constants';
import { expect, inject, RunnerTestSuite } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';
import {
  PubKey,
  PubKey as CosmosCryptoEd25519Pubkey,
} from 'cosmjs-types/cosmos/crypto/ed25519/keys';

import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import {
  checkVotingPowerMatchBondedTokens,
  delegateTokens,
  getBondedTokens,
  getTrackedStakeInfo,
  getTrackedValidators,
  getVaultVPInfo,
  pauseRewardsContract,
  redelegateTokens,
  simulateSlashingAndJailing,
  submitAddToBlacklistProposal,
  submitUpdateParamsSlashingProposal,
  undelegateTokens,
} from '../../helpers/staking';
import { MsgCreateValidator } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/tx';
import { bytesFromBase64 } from 'cosmjs-types/helpers';

describe('Neutron / Staking Tracker - Extended Scenarios', () => {
  let testState: LocalState;
  let neutronClient1: NeutronTestClient;
  let neutronClient2: NeutronTestClient;
  let validatorSecondClient: NeutronTestClient;
  let validatorPrimaryClient: NeutronTestClient;

  let daoWalletClient: NeutronTestClient;
  let daoWallet: Wallet;

  let neutronWallet1: Wallet;
  let neutronWallet2: Wallet;
  let stakingQuerier: StakingQueryClient;

  // weak is the validator with drastically less bonded tokens
  let validatorWeakAddr: string;
  // strong is the validator that controls ~90% of bonded tokens at the beginning
  let validatorStrongAddr: string;
  let validatorSecondWallet: Wallet;
  let validatorPrimaryWallet: Wallet;

  let validatorWeakSelfDelegation: number;
  let validatorStrongSelfDelegation: number;

  const delegationAmount = '1000000'; // 1 NTRN
  const undelegationAmount = '500000'; // 0.5 NTRN
  const redelegationAmount = '300000'; // 0.3 NTRN

  beforeAll(async (suite: RunnerTestSuite) => {
    const mnemonics = inject('mnemonics');
    testState = await LocalState.create(config, mnemonics, suite);

    neutronWallet1 = await testState.nextNeutronWallet();
    neutronWallet2 = await testState.nextNeutronWallet();

    validatorPrimaryWallet = testState.wallets.neutron.val1;
    validatorSecondWallet = testState.wallets.neutron.val2;

    neutronClient1 = await NeutronTestClient.connectWithSigner(neutronWallet1);

    neutronClient2 = await NeutronTestClient.connectWithSigner(neutronWallet2);

    // This is the client for validator that could be disabled during testrun
    validatorSecondClient = await NeutronTestClient.connectWithSigner(
      validatorSecondWallet,
    );

    // This is client for validator that should work ALWAYS bc it's only one that exposes ports
    // In the state it is validator #2, so this naming is only for clients
    validatorPrimaryClient = await NeutronTestClient.connectWithSigner(
      validatorPrimaryWallet,
    );

    daoWallet = testState.wallets.neutron.demo1;
    daoWalletClient = await NeutronTestClient.connectWithSigner(daoWallet);

    const neutronRpcClient = await testState.neutronRpcClient();
    stakingQuerier = new StakingQueryClient(neutronRpcClient);

    const admin = testState.wallets.neutron.demo1Secp256k1;
    const adminClient = await NeutronTestClient.connectWithSigner(admin);
    process.env.PAUSE_REWARDS === '1' &&
      (await pauseRewardsContract(adminClient));
  });

  describe('Staking tracker', () => {
    test('removed validator gets removed from the tracker contract', async () => {
      const wallet = await testState.nextSecp256k1SignNeutronWallet();
      const msgCreateValidator = MsgCreateValidator.fromPartial({
        description: {
          moniker: 'test_val',
          identity: 'test_val',
          website: '',
          securityContact: '',
          details: '',
        },
        commission: {
          rate: '0.070000000000000000',
          maxRate: '1.000000000000000000',
          maxChangeRate: '0.010000000000000000',
        },
        minSelfDelegation: '1',
        validatorAddress: wallet.valAddress,
        pubkey: {
          typeUrl: PubKey.typeUrl,
          value: Uint8Array.from(
            CosmosCryptoEd25519Pubkey.encode(
              CosmosCryptoEd25519Pubkey.fromPartial({
                key: bytesFromBase64(
                  'ZQ2K/Bp26WWVRFO+km3YyYFGu8fu65ICR/u0Q6Mqn3U=',
                ),
              }),
            ).finish(),
          ),
        },
        value: {
          amount: '1',
          denom: NEUTRON_DENOM,
        },
      });
      const client = await NeutronTestClient.connectWithSigner(wallet);
      const fee = {
        gas: '5000000',
        amount: [{ denom: NEUTRON_DENOM, amount: '12500' }],
      };
      await client.signAndBroadcastSync(
        [
          {
            typeUrl: MsgCreateValidator.typeUrl,
            value: msgCreateValidator,
          },
        ],
        fee,
      );
      await client.waitBlocks(1);

      const trackingValidatorsBefore = await getTrackedValidators(
        client,
        STAKING_TRACKER,
      );
      const moduleValidatorsBefore = await stakingQuerier.validators({
        status: '',
      });
      expect(trackingValidatorsBefore.length).toEqual(
        moduleValidatorsBefore.validators.length,
      );
      const beforeLength = trackingValidatorsBefore.length;

      // undelegate all tokens
      await undelegateTokens(client, wallet.address, wallet.valAddress, '1');

      await client.waitBlocks(1);

      const trackingValidatorsAfter = await getTrackedValidators(
        client,
        STAKING_TRACKER,
      );
      const moduleValidatorsAfter = await stakingQuerier.validators({
        status: '',
      });
      expect(trackingValidatorsAfter.length).toEqual(
        moduleValidatorsAfter.validators.length,
      );
      expect(trackingValidatorsAfter.length).toEqual(beforeLength - 1);
    });

    describe('Slashing params', () => {
      let mainDao: Dao;
      let daoMember1: DaoMember;
      let proposalId: number;
      test('create proposal', async () => {
        const neutronRpcClient = await testState.neutronRpcClient();
        const daoCoreAddress = await getNeutronDAOCore(
          daoWalletClient,
          neutronRpcClient,
        ); // add assert for some addresses
        const daoContracts = await getDaoContracts(
          daoWalletClient,
          daoCoreAddress,
        );
        mainDao = new Dao(daoWalletClient, daoContracts);
        daoMember1 = new DaoMember(
          mainDao,
          daoWalletClient.client,
          daoWallet.address,
          NEUTRON_DENOM,
        );
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
            downtime_jail_duration: '5s',
            min_signed_per_window: '0.500000000000000000',
            signed_blocks_window: '30',
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

    describe('Staking Tracker Operations - Multiple Users & Validators', () => {
      describe('Delegate/Undelegate/Redelegate tokens to multiple validators', () => {
        describe('query validators', () => {
          test('fetch validator data', async () => {
            const validators = await stakingQuerier.validators({
              status: 'BOND_STATUS_BONDED',
            });

            validatorWeakAddr = validators.validators[0].operatorAddress;
            validatorWeakSelfDelegation = +validators.validators[0].tokens;

            validatorStrongAddr = validators.validators[1].operatorAddress;
            validatorStrongSelfDelegation = +validators.validators[1].tokens;
          });
        });

        test('perform multiple delegations and validate historical stake info', async () => {
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

            const stakeInfoBefore = await getTrackedStakeInfo(
              client,
              wallet.address,
              STAKING_TRACKER,
              heightBefore,
            );
            const stakeInfoAfter = await getTrackedStakeInfo(
              client,
              wallet.address,
              STAKING_TRACKER,
              heightAfter,
            );

            expect(stakeInfoBefore.stake).toEqual(0);
            expect(stakeInfoAfter.stake).toEqual(+delegationAmount * 2);
            await checkVotingPowerMatchBondedTokens(
              client,
              stakingQuerier,
              wallet.address,
              STAKING_TRACKER,
              STAKING_VAULT,
            );
          }
        });

        test('perform redelegation from ValidatorWeak to ValidatorStrong', async () => {
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

          const stakeInfoBefore = await getTrackedStakeInfo(
            delegator.client,
            delegator.wallet.address,
            STAKING_TRACKER,
            heightBeforeRedelegation,
          );
          const stakeInfoAfter = await getTrackedStakeInfo(
            delegator.client,
            delegator.wallet.address,
            STAKING_TRACKER,
            heightAfterRedelegation,
          );

          expect(stakeInfoBefore.stake).toEqual(stakeInfoAfter.stake);
          await checkVotingPowerMatchBondedTokens(
            delegator.client,
            stakingQuerier,
            delegator.wallet.address,
            STAKING_TRACKER,
            STAKING_VAULT,
          );
        });

        test('perform undelegations and validate historical stake info', async () => {
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

            const stakeInfoBefore = await getTrackedStakeInfo(
              client,
              wallet.address,
              STAKING_TRACKER,
              heightBeforeUndelegation,
            );
            const stakeInfoAfter = await getTrackedStakeInfo(
              client,
              wallet.address,
              STAKING_TRACKER,
              heightAfterUndelegation,
            );

            expect(stakeInfoAfter.stake).toBeLessThan(stakeInfoBefore.stake);
            await checkVotingPowerMatchBondedTokens(
              client,
              stakingQuerier,
              wallet.address,
              STAKING_TRACKER,
              STAKING_VAULT,
            );
          }
        });

        test('perform full undelegation from one validator', async () => {
          const delegator = { wallet: neutronWallet1, client: neutronClient1 };

          // Query delegation balance instead of bonded tokens from contract
          const delegations = await stakingQuerier.delegatorDelegations({
            delegatorAddr: delegator.wallet.address,
          });

          const delegation = delegations.delegationResponses.find(
            (del) => del.delegation.validatorAddress === validatorWeakAddr,
          );

          if (!delegation) {
            return;
          }

          const fullUndelegationAmount = delegation.balance.amount;

          expect(Number(fullUndelegationAmount)).toBeGreaterThan(0);

          // Perform full undelegation
          await undelegateTokens(
            delegator.client,
            delegator.wallet.address,
            validatorWeakAddr,
            fullUndelegationAmount,
          );

          await waitBlocks(2, delegator.client);

          // Re-query delegation to ensure it's removed
          const delegationsAfter = await stakingQuerier.delegatorDelegations({
            delegatorAddr: delegator.wallet.address,
          });

          const remainingDelegation = delegationsAfter.delegationResponses.find(
            (del) => del.delegation.validatorAddress === validatorWeakAddr,
          );

          expect(remainingDelegation).toBeUndefined();
          await checkVotingPowerMatchBondedTokens(
            delegator.client,
            stakingQuerier,
            delegator.wallet.address,
            STAKING_TRACKER,
            STAKING_VAULT,
          );
        });

        describe('Blacklist', () => {
          let mainDao: Dao;
          let daoMember1: DaoMember;
          let proposalId: number;
          let blacklistedAddress: string;
          let heightBeforeBlacklist: number;

          test('create proposal', async () => {
            blacklistedAddress = neutronWallet2.address;

            const neutronRpcClient = await testState.neutronRpcClient();
            const daoCoreAddress = await getNeutronDAOCore(
              daoWalletClient,
              neutronRpcClient,
            );

            const daoContracts = await getDaoContracts(
              daoWalletClient,
              daoCoreAddress,
            );

            mainDao = new Dao(daoWalletClient, daoContracts);
            daoMember1 = new DaoMember(
              mainDao,
              daoWalletClient.client,
              daoWallet.address,
              NEUTRON_DENOM,
            );

            // Create the Blacklist Proposal
            proposalId = await submitAddToBlacklistProposal(
              daoMember1,
              STAKING_VAULT,
              'Blacklist Address Proposal',
              'Proposal to blacklist an address from voting',
              { addresses: [blacklistedAddress] },
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
            heightBeforeBlacklist = await neutronClient1.getHeight();
            const vaultInfoBeforeBlacklist = await getVaultVPInfo(
              neutronClient1,
              blacklistedAddress,
              STAKING_VAULT,
              heightBeforeBlacklist,
            );
            // before blacklist there are some bonded tokens
            expect(vaultInfoBeforeBlacklist.power).toBeGreaterThan(0);
            await waitBlocks(1, daoWalletClient);
            await daoMember1.executeProposalWithAttempts(proposalId);
          });

          test('validate blacklist effect on voting power', async () => {
            // Validate voting power before blacklist
            const vaultInfoBeforeBlacklistOldBlock = await getVaultVPInfo(
              neutronClient1,
              blacklistedAddress,
              STAKING_VAULT,
              heightBeforeBlacklist,
            );
            // despite address is blacklisted, it still has voting power in the past
            expect(vaultInfoBeforeBlacklistOldBlock.power).toBeGreaterThan(0);

            await waitBlocks(2, neutronClient1); // Wait for changes to take effect

            // Validate voting power after blacklist
            const vaultInfoAfterBlacklist = await getVaultVPInfo(
              neutronClient1,
              blacklistedAddress,
              STAKING_VAULT,
            );
            expect(vaultInfoAfterBlacklist.power).toEqual(0);

            const stakeInfoAfterBlacklist = await getTrackedStakeInfo(
              neutronClient1,
              blacklistedAddress,
              STAKING_TRACKER,
            );
            expect(stakeInfoAfterBlacklist.stake).toBeGreaterThan(0);

            const bondedTokens = await getBondedTokens(
              stakingQuerier,
              blacklistedAddress,
            );
            expect(bondedTokens).toBeGreaterThan(0);
            expect(stakeInfoAfterBlacklist.stake).toEqual(bondedTokens);
          });
        });
      });
    });

    test('Validator gets slashed after missing blocks, then rebond and unjail', async () => {
      // Query bonded tokens before slashing
      const heightBeforeSlashing = await validatorSecondClient.getHeight();
      const stakeInfoBefore = await getTrackedStakeInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        STAKING_TRACKER,
        heightBeforeSlashing,
      );

      await simulateSlashingAndJailing(
        validatorSecondClient,
        neutronClient1,
        stakingQuerier,
        validatorSecondWallet.valAddress,
        validatorStrongAddr,
        validatorSecondWallet.address,
        16,
      );

      // Query validator status after potential jailing
      const validatorStateAfterSlashing = await stakingQuerier.validator({
        validatorAddr: validatorWeakAddr,
      });

      // Ensure the validator is jailed before proceeding
      if (validatorStateAfterSlashing.validator.jailed !== true) {
        throw new Error(
          `Validator is not jailed, unjail should not be attempted.`,
        );
      }

      // Query bonded tokens after unbonding leading to slashing
      const heightAfterSlashing = await validatorSecondClient.getHeight();
      const stakeInfoAfter = await getTrackedStakeInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        STAKING_TRACKER,
        heightAfterSlashing,
      );

      // Stake should be zero since validator is in jail and unbonded
      expect(stakeInfoAfter.stake).toBeLessThan(stakeInfoBefore.stake);
      expect(stakeInfoAfter.stake).toBe(0);

      const vaultInfoAfter = await getVaultVPInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        STAKING_VAULT,
      );
      expect(vaultInfoAfter.power).toEqual(stakeInfoAfter.stake);

      const bondedTokens = await getBondedTokens(
        stakingQuerier,
        validatorSecondWallet.address,
      );
      expect(bondedTokens).toBeGreaterThan(0);

      // should be enough to cover jail period
      await waitBlocks(3, neutronClient1);

      // **Step 3: Unjail Validator**
      const resUnjail = await validatorSecondClient.signAndBroadcast(
        [
          {
            typeUrl: '/cosmos.slashing.v1beta1.MsgUnjail',
            value: {
              validatorAddr: validatorSecondWallet.valAddress,
            },
          },
        ],
        {
          amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
          gas: '2000000',
        },
      );
      expect(resUnjail.code).toEqual(0);

      await waitBlocks(3, validatorSecondClient);

      // **Check validator status after unjailing**
      const validatorStateAfterUnjail = await stakingQuerier.validator({
        validatorAddr: validatorWeakAddr,
      });

      // Validator should be bonded again
      expect(validatorStateAfterUnjail.validator.status).toEqual(3);

      // **Check bonded tokens after unjailing**
      const stakeInfoAfterUnjail = await getTrackedStakeInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        STAKING_TRACKER,
      );

      // Ensure bonded tokens amount is restored
      expect(stakeInfoAfterUnjail.stake).toBeGreaterThan(stakeInfoAfter.stake);
      await checkVotingPowerMatchBondedTokens(
        validatorSecondClient,
        stakingQuerier,
        validatorSecondWallet.address,
        STAKING_TRACKER,
        STAKING_VAULT,
      );

      // Ensure voting power is less than before it was slashed
      expect(stakeInfoBefore.stake).toBeGreaterThan(stakeInfoAfterUnjail.stake);
      const delegationsAfterUnjail = await stakingQuerier.validatorDelegations({
        validatorAddr: validatorSecondWallet.valAddress,
      });
      const selfDelegation = delegationsAfterUnjail.delegationResponses.find(
        (r) =>
          r.delegation.validatorAddress == validatorSecondWallet.valAddress &&
          r.delegation.delegatorAddress === validatorSecondWallet.address,
      );
      expect(+selfDelegation.balance.amount).toEqual(
        stakeInfoAfterUnjail.stake,
      );
    });

    test('Unbond validator while keeping at least 67% of consensus', async () => {
      const heightBeforeEdit = await validatorPrimaryClient.getHeight();

      const validators = await stakingQuerier.validators({
        status: 'BOND_STATUS_BONDED',
      });

      const validatorInfo = validators.validators[0];

      const currentDescription = validatorInfo.description || {
        moniker: '',
        identity: '',
        website: '',
        securityContact: '',
        details: '',
      };

      validatorWeakAddr = validatorInfo.operatorAddress;
      validatorWeakSelfDelegation = +validatorInfo.tokens;

      // Query total bonded tokens
      const totalStakeInfo = await getTrackedStakeInfo(
        validatorPrimaryClient,
        validatorSecondWallet.address,
        STAKING_TRACKER,
      );

      const totalStake = totalStakeInfo.totalStake;

      // Print delegations before unbonding
      const validatorDelegationsBefore =
        await stakingQuerier.validatorDelegations({
          validatorAddr: validatorWeakAddr,
        });

      // Retrieve validator's **self-delegation** before unbonding
      const selfDelegationEntry =
        validatorDelegationsBefore.delegationResponses?.find(
          (del) =>
            del.delegation.delegatorAddress === validatorSecondWallet.address,
        );

      const selfDelegationAmount = selfDelegationEntry
        ? selfDelegationEntry.balance.amount
        : '0';

      // Ensure another validator has at least 67% of total stake before unbonding
      const minRequiredStake = Math.ceil(totalStake * 0.67);

      const validatorStrongDelegationAmount = Math.max(
        0,
        minRequiredStake - validatorStrongSelfDelegation,
      ).toString();

      // Delegate to another validator before unbonding
      if (+validatorStrongDelegationAmount > 0) {
        await delegateTokens(
          neutronClient1,
          neutronWallet1.address,
          validatorStrongAddr,
          validatorStrongDelegationAmount,
        );

        await waitBlocks(2, validatorPrimaryClient);
      }

      // Check bonded tokens before unbonding
      const stakeInfoBefore = await getTrackedStakeInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        STAKING_TRACKER,
        heightBeforeEdit,
      );

      // Set min_self_delegation above current self-delegation
      const increasedMinSelfDelegation = (
        validatorWeakSelfDelegation * 2
      ).toString();

      const res = await validatorSecondClient.signAndBroadcast(
        [
          {
            typeUrl: '/cosmos.staking.v1beta1.MsgEditValidator',
            value: {
              validatorAddress: validatorSecondWallet.valAddress,
              minSelfDelegation: increasedMinSelfDelegation,
              commissionRate: undefined, // No change
              description: {
                moniker: currentDescription.moniker || 'Validator',
                identity: currentDescription.identity || '',
                website: currentDescription.website || '',
                securityContact: currentDescription.securityContact || '',
                details: currentDescription.details || '',
              },
            },
          },
        ],
        {
          amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
          gas: '2000000',
        },
      );

      // Validator's self-delegation must be greater than their minimum self-delegation
      expect(res.code).toEqual(16);

      // Now proceed with undelegation using retrieved self-delegation amount
      await undelegateTokens(
        validatorSecondClient,
        validatorSecondWallet.address,
        validatorSecondWallet.valAddress,
        selfDelegationAmount, // Uses dynamically retrieved amount
      );
      const heightAfterEdit = await validatorPrimaryClient.getHeight();

      // Query validator state to check if it got unbonded
      const validatorState = await stakingQuerier.validator({
        validatorAddr: validatorWeakAddr,
      });

      // Validator should no longer be bonded
      expect(validatorState.validator.status).not.toEqual('BOND_STATUS_BONDED');

      // Check bonded tokens after unbonding
      const stakeInfoAfter = await getTrackedStakeInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        STAKING_TRACKER,
        heightAfterEdit,
      );

      // Ensure bonded tokens amount is reduced to zero
      expect(stakeInfoAfter.stake).toEqual(0);
      expect(stakeInfoAfter.totalStake).toBeLessThan(
        stakeInfoBefore.totalStake,
      );
      await checkVotingPowerMatchBondedTokens(
        validatorSecondClient,
        stakingQuerier,
        validatorSecondWallet.address,
        STAKING_TRACKER,
        STAKING_VAULT,
      );

      await delegateTokens(
        validatorSecondClient,
        validatorSecondWallet.address,
        validatorWeakAddr, // Delegating back to itself
        selfDelegationAmount, // Uses the previously retrieved self-delegation amount
      );

      const resUnjail = await validatorSecondClient.signAndBroadcast(
        [
          {
            typeUrl: '/cosmos.slashing.v1beta1.MsgUnjail',
            value: {
              validatorAddr: validatorSecondWallet.valAddress,
            },
          },
        ],
        {
          amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
          gas: '2000000',
        },
      );

      expect(resUnjail.code).toEqual(0);

      await waitBlocks(10, validatorPrimaryClient);

      // Query validator state to check if it got bonded again
      const heightAfterBonding = await validatorSecondClient.getHeight();
      const validatorStateAfterBonding = await stakingQuerier.validator({
        validatorAddr: validatorWeakAddr,
      });

      // Validator should be bonded again
      expect(validatorStateAfterBonding.validator.status).toEqual(3);

      // Check bonded tokens after bonding back
      const stakeInfoAfterBonding = await getTrackedStakeInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        STAKING_TRACKER,
        heightAfterBonding,
      );

      // Ensure bonded tokens amount is increased after self-delegation
      expect(stakeInfoAfterBonding.stake).toBeGreaterThan(stakeInfoAfter.stake);
      await checkVotingPowerMatchBondedTokens(
        validatorSecondClient,
        stakingQuerier,
        validatorSecondWallet.address,
        STAKING_TRACKER,
        STAKING_VAULT,
      );
    });
  });
});
