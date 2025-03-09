import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import {
  NEUTRON_DENOM,
  STAKING_TRACKER,
  STAKING_VAULT,
  VAL_MNEMONIC_1,
  VAL_MNEMONIC_2,
} from '../../helpers/constants';
import { expect, inject, RunnerTestSuite } from 'vitest';
import { LocalState, mnemonicToWallet } from '../../helpers/local_state';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import {
  delegateTokens,
  getTrackedStakeInfo,
  getVaultVPInfo,
  redelegateTokens,
  simulateSlashingAndJailing,
  submitAddToBlacklistProposal,
  submitUpdateParamsSlashingProposal,
  submitUpdateParamsStakingProposal,
  undelegateTokens,
} from '../../helpers/staking';

describe('Neutron / Staking Tracker - Extended Scenarios', () => {
  let testState: LocalState;
  let neutronClient1: SigningNeutronClient;
  let neutronClient2: SigningNeutronClient;
  let validatorSecondClient: SigningNeutronClient;
  let validatorPrimaryClient: SigningNeutronClient;

  let daoWalletClient: SigningNeutronClient;
  let daoWallet: Wallet;

  let neutronWallet1: Wallet;
  let neutronWallet2: Wallet;
  let stakingQuerier: StakingQueryClient;

  // weak is the validator with drastically less bonded tokens
  let validatorWeakAddr: string;
  // strong is validator that controls ~90% of bonded tokens at the beginning
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

    neutronWallet1 = await testState.nextWallet('neutron');
    neutronWallet2 = await testState.nextWallet('neutron');
    validatorSecondWallet = await mnemonicToWallet(VAL_MNEMONIC_2, 'neutron');
    validatorPrimaryWallet = await mnemonicToWallet(VAL_MNEMONIC_1, 'neutron');

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
      validatorSecondWallet.directwallet,
      validatorSecondWallet.address,
    );

    // This is client for validator that should work ALWAYS bc it's only one that exposes ports
    // In the state it is validator #2, so this naming is only for clients
    validatorPrimaryClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      validatorPrimaryWallet.directwallet,
      validatorPrimaryWallet.address,
    );

    daoWallet = testState.wallets.neutron.demo1;
    daoWalletClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      daoWallet.directwallet,
      daoWallet.address,
    );

    const neutronRpcClient = await testState.neutronRpcClient();
    stakingQuerier = new StakingQueryClient(neutronRpcClient);
  });

  describe('Staking tracker', () => {
    describe('Slashing params', () => {
      let mainDao: Dao;
      let daoMember1: DaoMember;
      let proposalId;
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
            slash_fraction_double_sign: '0.000000000000000000',
            slash_fraction_downtime: '0.000000000000000000',
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

    describe('Staking Vault Operations - Multiple Users & Validators', () => {
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

        test('perform multiple delegations and validate historical stake', async () => {
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
        });

        test('perform undelegations and validate historical stake', async () => {
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
            // address is blacklisted, even in the past no voting power
            expect(vaultInfoBeforeBlacklistOldBlock.power).toBe(0);

            await waitBlocks(2, neutronClient1); // Wait for changes to take effect

            // Validate voting power after blacklist
            const vaultInfoAfterBlacklist = await getVaultVPInfo(
              neutronClient1,
              blacklistedAddress,
              STAKING_VAULT,
            );
            expect(vaultInfoAfterBlacklist.power).toEqual(0);
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

      // Bonded tokens should be lower than before or zero
      expect(stakeInfoAfter.stake).toBeLessThan(stakeInfoBefore.stake);

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
      const totalNetworkPowerInfo = await getTrackedStakeInfo(
        validatorPrimaryClient,
        validatorSecondWallet.address,
        STAKING_TRACKER,
      );

      const totalNetworkPower = totalNetworkPowerInfo.totalStake;

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

      // Ensure another validator has at least 67% of total power before unbonding
      const minRequiredPower = Math.ceil(totalNetworkPower * 0.67);

      const validatorStrongDelegationAmount = Math.max(
        0,
        minRequiredPower - validatorStrongSelfDelegation,
      ).toString();

      // Delegate to another validator before unbonding
      if (validatorStrongDelegationAmount > '0') {
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
    });

    describe('Validator Full Unbonding and Removal', () => {
      let mainDao: Dao;
      let daoMember1: DaoMember;
      let proposalId: number;

      test('Submit proposal for validator removal before unbonding', async () => {
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

        const neutronQuerier = await createNeutronClient({
          rpcEndpoint: testState.rpcNeutron,
        });

        const admins =
          await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
        const chainManagerAddress = admins.admins[0];

        // Submit proposal for validator removal
        proposalId = await submitUpdateParamsStakingProposal(
          daoMember1,
          chainManagerAddress,
          'Validator Removal Proposal',
          'Proposal to remove validator by fully undelegating',
          {
            unbonding_time: '2s',
            max_validators: '125',
            max_entries: '16',
            historical_entries: '10000',
            bond_denom: NEUTRON_DENOM,
          },
          '1000',
        );
      });

      test('Vote on proposal', async () => {
        await daoMember1.voteYes(proposalId);
      });

      test('Check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });

      test('Execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });

      test('All clients undelegate, then validator self-unbonds, ensuring no cross-delegations', async () => {
        const delegators = [
          { wallet: neutronWallet1, client: neutronClient1 },
          { wallet: neutronWallet2, client: neutronClient2 },
          { wallet: daoWallet, client: daoWalletClient },
          { wallet: validatorSecondWallet, client: validatorSecondClient }, // Validator itself
        ];

        const heightBeforeUnbonding = await validatorPrimaryClient.getHeight();

        // Check bonded tokens before unbonding
        const stakeInfoBefore = await getTrackedStakeInfo(
          validatorSecondClient,
          validatorSecondWallet.address,
          STAKING_TRACKER,
          heightBeforeUnbonding,
        );

        for (const { wallet, client } of delegators) {
          const delegations = await stakingQuerier.delegatorDelegations({
            delegatorAddr: wallet.address,
          });

          if (delegations.delegationResponses.length === 0) {
            continue;
          }

          for (const delegation of delegations.delegationResponses) {
            const undelegationAmount = delegation.balance.amount;
            if (+undelegationAmount === 0) {
              continue;
            }

            await undelegateTokens(
              client,
              wallet.address,
              delegation.delegation.validatorAddress,
              undelegationAmount,
            );
          }

          await waitBlocks(2, client);
        }

        const validatorDelegations = await stakingQuerier.validatorDelegations({
          validatorAddr: validatorWeakAddr,
        });

        const selfDelegation = validatorDelegations.delegationResponses.find(
          (del) =>
            del.delegation.delegatorAddress === validatorSecondWallet.address,
        );

        if (selfDelegation) {
          await undelegateTokens(
            validatorSecondClient,
            validatorSecondWallet.address,
            validatorWeakAddr,
            selfDelegation.balance.amount,
          );
        }

        const heightAfterUnbonding = await validatorPrimaryClient.getHeight();

        await waitBlocks(2, neutronClient1);

        const validators = await stakingQuerier.validators({
          status: 'BOND_STATUS_BONDED',
        });

        expect(validators.validators.length).toEqual(1);

        // Check bonded tokens after unbonding
        const stakeInfoAfter = await getTrackedStakeInfo(
          validatorSecondClient,
          validatorSecondWallet.address,
          STAKING_TRACKER,
          heightAfterUnbonding,
        );

        // Ensure bonded tokens amount is reduced to zero
        expect(stakeInfoAfter.stake).toEqual(0);
        expect(stakeInfoAfter.totalStake).toBeLessThan(
          stakeInfoBefore.totalStake,
        );
      });
    });
  });
});
