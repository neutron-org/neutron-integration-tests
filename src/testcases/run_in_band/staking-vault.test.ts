import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { sleep, waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { NEUTRON_DENOM } from '../../helpers/constants';
import { expect, inject, RunnerTestSuite } from 'vitest';
import { LocalState, mnemonicToWallet } from '../../helpers/local_state';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';
import { execSync } from 'child_process';
import { StargateClient } from '@cosmjs/stargate';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import { chainManagerWrapper } from '@neutron-org/neutronjsplus/dist/proposal';
import { ADMIN_MODULE_ADDRESS } from '@neutron-org/neutronjsplus/dist/constants';
const VAL_MNEMONIC_1 =
  'clock post desk civil pottery foster expand merit dash seminar song memory figure uniform spice circle try happy obvious trash crime hybrid hood cushion';
const VAL_MNEMONIC_2 =
  'angry twist harsh drastic left brass behave host shove marriage fall update business leg direct reward object ugly security warm tuna model broccoli choice';

const VALIDATOR_CONTAINER = 'neutron-node-1';

describe('Neutron / Staking Vault - Extended Scenarios', () => {
  let testState: LocalState;
  let neutronClient1: SigningNeutronClient;
  let neutronClient2: SigningNeutronClient;
  let validatorSecondClient: SigningNeutronClient;
  let validatorPrimarClient: SigningNeutronClient;

  let daoWalletClient: SigningNeutronClient;
  let daoWallet: Wallet;

  let neutronWallet1: Wallet;
  let neutronWallet2: Wallet;
  let stakingVaultAddr: string;
  let stakingQuerier: StakingQueryClient;

  // weak is the validator with drastically less voting power
  let validatorWeakAddr: string;
  // strong is validator that controls ~90% of total vp at the beginning
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
    validatorPrimarClient = await SigningNeutronClient.connectWithSigner(
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

    describe('Staking Vault Operations - Multiple Users & Validators', () => {
      beforeAll(async () => {
        stakingVaultAddr =
          'neutron1nyuryl5u5z04dx4zsqgvsuw7fe8gl2f77yufynauuhklnnmnjncqcls0tj';
      });

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

            console.log(
              'ValidatorWeak:',
              validatorWeakAddr,
              validatorWeakSelfDelegation,
            );
            console.log(
              'ValidatorStrong:',
              validatorStrongAddr,
              validatorStrongSelfDelegation,
            );
          });
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

            await waitBlocks(2, client);
            const heightAfter = await client.getHeight();

            const vaultInfoBefore = await getStakingVaultInfo(
              client,
              wallet.address,
              stakingVaultAddr,
              heightBefore,
            );
            const vaultInfoAfter = await getStakingVaultInfo(
              client,
              wallet.address,
              stakingVaultAddr,
              heightAfter,
            );

            expect(vaultInfoBefore.power).toEqual(0);
            expect(vaultInfoAfter.power).toEqual(+delegationAmount * 2);
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

          const vaultInfoBefore = await getStakingVaultInfo(
            delegator.client,
            delegator.wallet.address,
            stakingVaultAddr,
            heightBeforeRedelegation,
          );
          const vaultInfoAfter = await getStakingVaultInfo(
            delegator.client,
            delegator.wallet.address,
            stakingVaultAddr,
            heightAfterRedelegation,
          );

          expect(vaultInfoBefore.power).toEqual(vaultInfoAfter.power);
        });

        test('perform full undelegation from one validator', async () => {
          const delegator = { wallet: neutronWallet1, client: neutronClient1 };

          const heightBeforeFullUndelegation =
            await delegator.client.getHeight();

          const vaultInfoBefore = await getStakingVaultInfo(
            delegator.client,
            delegator.wallet.address,
            stakingVaultAddr,
            heightBeforeFullUndelegation,
          );

          const fullUndelegationAmount = vaultInfoBefore.power;

          expect(fullUndelegationAmount).toBeGreaterThan(0);

          // Perform full undelegation
          await undelegateTokens(
            delegator.client,
            delegator.wallet.address,
            validatorWeakAddr,
            fullUndelegationAmount.toString(),
          );

          await waitBlocks(2, delegator.client);

          const heightAfterFullUndelegation =
            await delegator.client.getHeight();

          const vaultInfoAfter = await getStakingVaultInfo(
            delegator.client,
            delegator.wallet.address,
            stakingVaultAddr,
            heightAfterFullUndelegation,
          );

          expect(vaultInfoAfter.power).toEqual(0);
        });

        test('perform undelegations and validate historical voting power', async () => {
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

            const vaultInfoBefore = await getStakingVaultInfo(
              client,
              wallet.address,
              stakingVaultAddr,
              heightBeforeUndelegation,
            );
            const vaultInfoAfter = await getStakingVaultInfo(
              client,
              wallet.address,
              stakingVaultAddr,
              heightAfterUndelegation,
            );

            expect(vaultInfoAfter.power).toBeLessThan(vaultInfoBefore.power);
          }
        });

        test('Perform full undelegation from one validator', async () => {
          const delegator = { wallet: neutronWallet1, client: neutronClient1 };

          console.log(`Fetching block height before full undelegation...`);
          const heightBeforeFullUndelegation =
            await delegator.client.getHeight();
          console.log(
            `Block height before undelegation: ${heightBeforeFullUndelegation}`,
          );

          console.log(
            `Fetching staking vault info for ${delegator.wallet.address}...`,
          );
          const vaultInfoBefore = await getStakingVaultInfo(
            delegator.client,
            delegator.wallet.address,
            stakingVaultAddr,
            heightBeforeFullUndelegation,
          );

          const fullUndelegationAmount = vaultInfoBefore.power;

          console.log(
            `Total delegated amount before undelegation: ${fullUndelegationAmount}`,
          );

          expect(fullUndelegationAmount).toBeGreaterThan(0);

          // Perform full undelegation
          console.log(
            `Performing full undelegation of ${fullUndelegationAmount} from validator ${validatorWeakAddr}...`,
          );
          await undelegateTokens(
            delegator.client,
            delegator.wallet.address,
            validatorWeakAddr,
            fullUndelegationAmount.toString(),
          );

          await waitBlocks(2, delegator.client);

          console.log(`Fetching block height after full undelegation...`);
          const heightAfterFullUndelegation =
            await delegator.client.getHeight();
          console.log(
            `Block height after undelegation: ${heightAfterFullUndelegation}`,
          );

          console.log(`Fetching updated staking vault info...`);
          const vaultInfoAfter = await getStakingVaultInfo(
            delegator.client,
            delegator.wallet.address,
            stakingVaultAddr,
            heightAfterFullUndelegation,
          );

          console.log(
            `Total delegated amount after undelegation: ${vaultInfoAfter.power}`,
          );

          expect(vaultInfoAfter.power).toEqual(0);
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

            const neutronQuerier = await createNeutronClient({
              rpcEndpoint: testState.rpcNeutron,
            });

            const admins =
              await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
            const chainManagerAddress = admins.admins[0];

            // Create the Blacklist Proposal
            proposalId = await submitAddToBlacklistProposal(
              daoMember1,
              chainManagerAddress,
              stakingVaultAddr,
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
            const vaultInfoBeforeBlacklist = await getStakingVaultInfo(
              neutronClient1,
              blacklistedAddress,
              stakingVaultAddr,
              heightBeforeBlacklist,
            );
            // before blacklist there is a vp
            expect(vaultInfoBeforeBlacklist.power).toBeGreaterThan(0);
            await waitBlocks(1, daoWalletClient);
            await daoMember1.executeProposalWithAttempts(proposalId);
          });

          test('validate blacklist effect on voting power', async () => {
            // Validate voting power before blacklist
            const vaultInfoBeforeBlacklistOldBlock = await getStakingVaultInfo(
              neutronClient1,
              blacklistedAddress,
              stakingVaultAddr,
              heightBeforeBlacklist,
            );
            // address is blacklisted, even in the past no voting power
            expect(vaultInfoBeforeBlacklistOldBlock.power).toBe(0);
            console.log(
              `Voting Power After Blacklist, old block: ${vaultInfoBeforeBlacklistOldBlock.power}`,
            );

            await waitBlocks(2, neutronClient1); // Wait for changes to take effect

            // Validate voting power after blacklist
            const vaultInfoAfterBlacklist = await getStakingVaultInfo(
              neutronClient1,
              blacklistedAddress,
              stakingVaultAddr,
            );
            expect(vaultInfoAfterBlacklist.power).toEqual(0);
            console.log(
              `Voting Power After Blacklist: ${vaultInfoAfterBlacklist.power}`,
            );
          });
        });
      });
    });

    test('Validator gets slashed after missing blocks, then rebond and unjail', async () => {
      console.log(`Validator Address: ${validatorWeakAddr}`);

      // Query voting power before slashing
      const heightBeforeSlashing = await validatorSecondClient.getHeight();
      const vaultInfoBefore = await getStakingVaultInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        stakingVaultAddr,
        heightBeforeSlashing,
      );

      console.log(`Voting Power Before Slashing: ${vaultInfoBefore.power}`);

      console.log(`Validator to slash: ${validatorSecondWallet.valAddress}`);
      console.log(`Validator #2: ${validatorStrongAddr}`);

      const newStatus = await simulateSlashingAndJailing(
        validatorSecondClient,
        neutronClient1,
        stakingQuerier,
        validatorSecondWallet.valAddress,
        validatorStrongAddr,
        validatorSecondWallet.address,
        16,
      );
      console.log(`Validator after slashing status: ${newStatus}`);

      // Query validator status after potential jailing
      const validatorStateAfterSlashing = await stakingQuerier.validator({
        validatorAddr: validatorWeakAddr,
      });

      console.log(
        `Validator Status After Slashing: ${validatorStateAfterSlashing.validator.status}`,
      );

      // Ensure the validator is jailed before proceeding
      if (validatorStateAfterSlashing.validator.jailed !== true) {
        throw new Error(
          `Validator is not jailed, unjail should not be attempted.`,
        );
      }

      // Query voting power after unbonding leading to slashing
      const heightAfterSlashing = await validatorSecondClient.getHeight();
      const vaultInfoAfter = await getStakingVaultInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        stakingVaultAddr,
        heightAfterSlashing,
      );

      console.log(`Voting Power After Slashing: ${vaultInfoAfter.power}`);
      console.log(`Total Power After Slashing: ${vaultInfoAfter.totalPower}`);

      // Voting power should be lower or zero
      expect(vaultInfoAfter.power).toBeLessThan(vaultInfoBefore.power);

      // should be enought to cover jail period
      await waitBlocks(3, neutronClient1);

      // **Step 3: Unjail Validator**
      console.log(`Validator will attempt to unjail...`);
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
      const vaultInfoAfterUnjail = await getStakingVaultInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        stakingVaultAddr,
      );

      console.log(
        `Voting Power After Unjailing: ${vaultInfoAfterUnjail.power}`,
      );

      // Ensure voting power is restored
      expect(vaultInfoAfterUnjail.power).toBeGreaterThan(vaultInfoAfter.power);
    });

    test('Unbond validator while keeping at least 67% of consensus', async () => {
      const heightBeforeEdit = await validatorPrimarClient.getHeight();

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

      console.log(`ValidatorWeak: ${validatorWeakAddr}`);
      console.log(
        `Self-Delegation Before Unbonding: ${validatorWeakSelfDelegation}`,
      );

      // Query total network voting power
      const totalNetworkPowerInfo = await getStakingVaultInfo(
        validatorPrimarClient,
        validatorSecondWallet.address,
        stakingVaultAddr,
      );

      const totalNetworkPower = totalNetworkPowerInfo.totalPower;
      console.log(
        `Total Network Voting Power Before Unbonding: ${totalNetworkPower}`,
      );
      console.log(
        `Ensure validator self delegation gives vp: ${totalNetworkPowerInfo.power}`,
      );

      // Print delegations before unbonding
      const validatorDelegationsBefore =
        await stakingQuerier.validatorDelegations({
          validatorAddr: validatorWeakAddr,
        });

      console.log(
        `Validator Delegations Before Unbonding:`,
        validatorDelegationsBefore.delegationResponses,
      );

      // Retrieve validator's **self-delegation** before unbonding
      const selfDelegationEntry =
        validatorDelegationsBefore.delegationResponses?.find(
          (del) =>
            del.delegation.delegatorAddress === validatorSecondWallet.address,
        );

      const selfDelegationAmount = selfDelegationEntry
        ? selfDelegationEntry.balance.amount
        : '0';

      console.log(`Retrieved Self-Delegation Amount: ${selfDelegationAmount}`);

      // Ensure another validator has at least 67% of total power before unbonding
      const minRequiredPower = Math.ceil(totalNetworkPower * 0.67);
      console.log(`Minimum Required Power for Consensus: ${minRequiredPower}`);

      const validatorStrongDelegationAmount = Math.max(
        0,
        minRequiredPower - validatorStrongSelfDelegation,
      ).toString();

      console.log(
        `Delegating ${validatorStrongDelegationAmount} to ValidatorStrong to maintain network consensus...`,
      );

      // Delegate to another validator before unbonding
      if (validatorStrongDelegationAmount > '0') {
        await delegateTokens(
          neutronClient1,
          neutronWallet1.address,
          validatorStrongAddr,
          validatorStrongDelegationAmount,
        );

        await waitBlocks(2, validatorPrimarClient);
      }

      // Check voting power before unbonding
      const vaultInfoBefore = await getStakingVaultInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        stakingVaultAddr,
        heightBeforeEdit,
      );

      console.log(`Voting Power Before Unbonding: ${vaultInfoBefore.power}`);

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

      console.log(`Edit Validator Transaction Response:`, res.rawLog);
      // Validator's self-delegation must be greater than their minimum self-delegation
      expect(res.code).toEqual(16);

      // Now proceed with undelegation using retrieved self-delegation amount
      await undelegateTokens(
        validatorSecondClient,
        validatorSecondWallet.address,
        validatorSecondWallet.valAddress,
        selfDelegationAmount, // Uses dynamically retrieved amount
      );
      const heightAfterEdit = await validatorPrimarClient.getHeight();

      // Query validator state to check if it got unbonded
      const validatorState = await stakingQuerier.validator({
        validatorAddr: validatorWeakAddr,
      });

      console.log(
        `Validator Status After Unbonding: ${validatorState.validator.status}`,
      );

      // Validator should no longer be bonded
      expect(validatorState.validator.status).not.toEqual('BOND_STATUS_BONDED');

      // Check voting power after unbonding
      const vaultInfoAfter = await getStakingVaultInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        stakingVaultAddr,
        heightAfterEdit,
      );

      console.log(`Voting Power After Unbonding: ${vaultInfoAfter.power}`);
      console.log(
        `Total Network Power After Unbonding: ${vaultInfoAfter.totalPower}`,
      );

      // Ensure voting power is reduced to zero
      expect(vaultInfoAfter.power).toEqual(0);
      expect(vaultInfoAfter.totalPower).toBeLessThan(
        vaultInfoBefore.totalPower,
      );
      console.log(`Performing self-delegation to bond validator back...`);

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

      console.log(resUnjail.rawLog);
      expect(resUnjail.code).toEqual(0);

      console.log(`Waiting for blocks to confirm bonding...`);
      await waitBlocks(10, validatorPrimarClient);

      // Query validator state to check if it got bonded again
      const heightAfterBonding = await validatorSecondClient.getHeight();
      const validatorStateAfterBonding = await stakingQuerier.validator({
        validatorAddr: validatorWeakAddr,
      });

      console.log(
        `Validator Status After Self-Delegation: ${validatorStateAfterBonding.validator.status}`,
      );

      // Validator should be bonded again
      expect(validatorStateAfterBonding.validator.status).toEqual(3);

      // Check voting power after bonding back
      const vaultInfoAfterBonding = await getStakingVaultInfo(
        validatorSecondClient,
        validatorSecondWallet.address,
        stakingVaultAddr,
        heightAfterBonding,
      );

      console.log(
        `Voting Power After Self-Delegation: ${vaultInfoAfterBonding.power}`,
      );
      console.log(
        `Total Network Power After Self-Delegation: ${vaultInfoAfterBonding.totalPower}`,
      );

      // Ensure voting power increased after self-delegation
      expect(vaultInfoAfterBonding.power).toBeGreaterThan(vaultInfoAfter.power);
    });

    describe('Validator Full Unbonding and Removal', () => {
      let mainDao: Dao;
      let daoMember1: DaoMember;
      let proposalId: number;

      test('Submit proposal for validator removal before unbonding', async () => {
        console.log(
          `Submitting proposal to remove validator: ${validatorWeakAddr}`,
        );

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

        console.log(`Proposal submitted with ID: ${proposalId}`);
      });

      test('Vote on proposal', async () => {
        await daoMember1.voteYes(proposalId);
        console.log(`Voted YES on proposal ${proposalId}`);
      });

      test('Check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
        console.log(`Proposal ${proposalId} has passed.`);
      });

      test('Execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
        console.log(`Executed proposal ${proposalId}.`);
      });

      test('All clients undelegate, then validator self-unbonds, ensuring no cross-delegations', async () => {
        console.log(`Starting validator unbonding process...`);
        console.log(`Validator to be removed: ${validatorWeakAddr}`);
        console.log(`Remaining validator: ${validatorStrongAddr}`);

        const delegators = [
          { wallet: neutronWallet1, client: neutronClient1 },
          { wallet: neutronWallet2, client: neutronClient2 },
          { wallet: daoWallet, client: daoWalletClient },
          { wallet: validatorSecondWallet, client: validatorSecondClient }, // Validator itself
          { wallet: validatorPrimaryWallet, client: validatorPrimarClient }, // Primary validator
        ];

        const heightBeforeUnbonding = await validatorPrimarClient.getHeight();
        console.log(`Current block height: ${heightBeforeUnbonding}`);

        for (const { wallet, client } of delegators) {
          console.log(`Checking delegations for ${wallet.address}...`);

          const delegations = await stakingQuerier.delegatorDelegations({
            delegatorAddr: wallet.address,
          });

          if (delegations.delegationResponses.length === 0) {
            console.log(
              `No delegations found for ${wallet.address}. Skipping...`,
            );
            continue;
          }

          for (const delegation of delegations.delegationResponses) {
            const undelegationAmount = delegation.balance.amount;
            if (undelegationAmount === '0') {
              console.log(
                `Skipping undelegation for ${wallet.address} from ${delegation.delegation.validatorAddress}, amount is zero.`,
              );
              continue;
            }

            console.log(
              `Undelegating ${undelegationAmount} from ${delegation.delegation.validatorAddress} for ${wallet.address}...`,
            );

            await undelegateTokens(
              client,
              wallet.address,
              delegation.delegation.validatorAddress,
              undelegationAmount,
            );
          }

          await waitBlocks(2, client);
        }

        console.log(
          `Verifying that ${validatorStrongAddr} does not have delegations in ${validatorWeakAddr}...`,
        );

        const strongValidatorDelegations =
          await stakingQuerier.delegatorDelegations({
            delegatorAddr: validatorStrongAddr,
          });

        const crossDelegation =
          strongValidatorDelegations.delegationResponses.find(
            (del) => del.delegation.validatorAddress === validatorWeakAddr,
          );

        if (crossDelegation) {
          console.log(
            `Validator ${validatorStrongAddr} has delegation in ${validatorWeakAddr}, undelegating ${crossDelegation.balance.amount}...`,
          );

          await undelegateTokens(
            validatorPrimarClient,
            validatorStrongAddr,
            validatorWeakAddr,
            crossDelegation.balance.amount,
          );

          await waitBlocks(2, validatorPrimarClient);

          console.log(
            `Validator ${validatorStrongAddr} successfully undelegated from ${validatorWeakAddr}.`,
          );
        } else {
          console.log(
            `Confirmed: ${validatorStrongAddr} has no delegations in ${validatorWeakAddr}. Proceeding with self-unbonding.`,
          );
        }

        console.log(
          `Initiating final self-unbonding for ${validatorWeakAddr}...`,
        );

        const validatorDelegations = await stakingQuerier.validatorDelegations({
          validatorAddr: validatorWeakAddr,
        });

        const selfDelegation = validatorDelegations.delegationResponses.find(
          (del) =>
            del.delegation.delegatorAddress === validatorSecondWallet.address,
        );

        if (!selfDelegation) {
          console.log(
            `Validator ${validatorWeakAddr} has no self-delegation left.`,
          );
        } else {
          console.log(
            `Self-undelegating ${selfDelegation.balance.amount} from ${validatorWeakAddr}...`,
          );

          await undelegateTokens(
            validatorSecondClient,
            validatorSecondWallet.address,
            validatorWeakAddr,
            selfDelegation.balance.amount,
          );

          await waitBlocks(2, validatorSecondClient);
        }

        console.log(`Verifying removal of validator ${validatorWeakAddr}...`);

        const validatorState = await stakingQuerier.validator({
          validatorAddr: validatorWeakAddr,
        });

        console.log(
          `Validator Status After Full Unbonding: ${validatorState.validator.status}`,
        );

        expect(validatorState.validator.status).not.toEqual(
          'BOND_STATUS_BONDED',
        );

        const heightAfterUnbonding = await validatorPrimarClient.getHeight();
        console.log(`New block height: ${heightAfterUnbonding}`);

        const vaultInfoAfter = await getStakingVaultInfo(
          validatorSecondClient,
          validatorSecondWallet.address,
          stakingVaultAddr,
          heightAfterUnbonding,
        );

        console.log(
          `Final Voting Power After Unbonding: ${vaultInfoAfter.power}`,
        );
        console.log(
          `Total Network Power After Unbonding: ${vaultInfoAfter.totalPower}`,
        );

        expect(vaultInfoAfter.power).toEqual(0);
        expect(vaultInfoAfter.totalPower).toBeLessThan(
          vaultInfoAfter.totalPower,
        );
      });
    });
  });
});
const delegateTokens = async (
  client,
  delegatorAddress,
  validatorAddress,
  amount,
) => {
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

  expect(res.code).toEqual(0);
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
  console.log(res.rawLog);
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
const getStakingVaultInfo = async (
  client: SigningNeutronClient,
  address: string,
  stakingVaultAddr: string,
  height?: number,
): Promise<VotingPowerInfo> => {
  if (typeof height === 'undefined') {
    height = await client.getHeight();
  }

  const power = await client.queryContractSmart(stakingVaultAddr, {
    voting_power_at_height: {
      address: address,
      ...(height !== undefined ? { height: height } : {}),
    },
  });

  const totalPower = await client.queryContractSmart(stakingVaultAddr, {
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

export type Duration = string;

export type ParamsSlashingInfo = {
  signed_blocks_window: string;
  min_signed_per_window: string;
  downtime_jail_duration: Duration;
  slash_fraction_double_sign: string;
  slash_fraction_downtime: string;
};

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

export type AddToBlacklistInfo = {
  addresses: string[];
};

export const submitAddToBlacklistProposal = async (
  dao: DaoMember,
  chainManagerAddress: string,
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

export type ParamsStakingInfo = {
  unbonding_time: Duration;
  max_validators: string;
  max_entries: string;
  historical_entries: string;
  bond_denom: string;
};

export const submitUpdateParamsStakingProposal = async (
  dao: DaoMember,
  chainManagerAddress: string,
  title: string,
  description: string,
  params: ParamsStakingInfo,
  amount: string,
): Promise<number> => {
  const message = chainManagerWrapper(chainManagerAddress, {
    custom: {
      submit_admin_proposal: {
        admin_proposal: {
          proposal_execute_message: {
            message: JSON.stringify({
              '@type': '/cosmos.staking.v1beta1.MsgUpdateParams',
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
