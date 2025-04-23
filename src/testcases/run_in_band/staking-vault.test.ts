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
  pauseRewardsContract,
} from '../../helpers/staking';
import { updateSlashingParamsProposal } from '@neutron-org/neutronjsplus/dist/proposal';

describe('Neutron / Staking Vault', () => {
  let testState: LocalState;

  let daoWallet: Wallet;
  let neutronWallet2: Wallet;
  let neutronWallet3: Wallet;
  let validatorWallet1: Wallet;
  let validatorWallet2: Wallet;

  let daoWalletClient: SigningNeutronClient;
  let neutronClient2: SigningNeutronClient;
  let neutronClient3: SigningNeutronClient;

  let validatorAddr1: string;
  let validatorAddr2: string;

  let mainDao: Dao;
  let daoMember1: DaoMember;
  let daoMember2: DaoMember;
  let daoMember3: DaoMember;

  let chainManagerAddress: string;

  const delegationAmount = '500000000'; // 500 NTRN

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    daoWallet = testState.wallets.neutron.demo1;
    daoWalletClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      daoWallet.directwallet,
      daoWallet.address,
    );
    const neutronRpcClient = await testState.neutronRpcClient();
    const daoCoreAddress = await getNeutronDAOCore(
      daoWalletClient,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(daoWalletClient, daoCoreAddress);
    mainDao = new Dao(daoWalletClient, daoContracts);
    daoMember1 = new DaoMember(
      mainDao,
      daoWalletClient.client,
      daoWallet.address,
      NEUTRON_DENOM,
    );
    await daoMember1.bondFunds('1000000000');

    neutronWallet2 = await testState.nextWallet('neutron');
    neutronClient2 = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet2.directwallet,
      neutronWallet2.address,
    );
    daoMember2 = new DaoMember(
      mainDao,
      neutronClient2.client,
      neutronWallet2.address,
      NEUTRON_DENOM,
    );

    neutronWallet3 = await testState.nextWallet('neutron');
    neutronClient3 = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet3.directwallet,
      neutronWallet3.address,
    );
    daoMember3 = new DaoMember(
      mainDao,
      neutronClient3.client,
      neutronWallet3.address,
      NEUTRON_DENOM,
    );

    validatorWallet1 = await mnemonicToWallet(VAL_MNEMONIC_1, 'neutron');
    validatorAddr1 = validatorWallet1.valAddress;

    validatorWallet2 = await mnemonicToWallet(VAL_MNEMONIC_2, 'neutron');
    validatorAddr2 = validatorWallet2.valAddress;

    const neutronQuerier = await createNeutronClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    const admins = await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
    chainManagerAddress = admins.admins[0];

    process.env.PAUSE_REWARDS === '1' &&
      (await pauseRewardsContract(daoWalletClient));
  });

  describe('Delegate tokens to multiple validators', () => {
    test('perform multiple delegations and validate historical stake info', async () => {
      const delegators = [
        { wallet: neutronWallet2, client: neutronClient2 },
        { wallet: neutronWallet3, client: neutronClient3 },
      ];

      for (const { wallet, client } of delegators) {
        const heightBefore = await client.getHeight();

        for (const validator of [validatorAddr1, validatorAddr2]) {
          const res = await delegateTokens(
            client,
            wallet.address,
            validator,
            delegationAmount,
          );
          expect(res.code).toEqual(0);
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
  });

  describe('Create several proposals', () => {
    let blacklistedAddress: string;

    describe('Set slashing params', () => {
      let proposalId: number;
      let heightBeforeBlacklist: number;

      test('create proposal', async () => {
        proposalId = await daoMember1.submitUpdateParamsSlashingProposal(
          chainManagerAddress,
          'Proposal #1',
          'Param change proposal. Update slashing params',
          updateSlashingParamsProposal({
            downtime_jail_duration: '3s',
            min_signed_per_window: '0.500000000000000000',
            signed_blocks_window: '10',
            slash_fraction_double_sign: '0.010000000000000000',
            slash_fraction_downtime: '0.100000000000000000',
          }),
          '1000',
        );
      });

      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });

      test('vote NO from wallet 3', async () => {
        await daoMember3.voteNo(proposalId);
      });

      describe('Blacklist wallet 2', () => {
        let proposalId: number;

        test('create proposal', async () => {
          blacklistedAddress = neutronWallet2.address;

          // Create the Blacklist Proposal
          proposalId = await daoMember1.submitAddToBlacklistProposal(
            STAKING_VAULT,
            'Blacklist Address Proposal',
            'Proposal to blacklist an address from voting',
            { addresses: [blacklistedAddress] },
            '1000',
          );
        });

        test('vote YES from wallet 1', async () => {
          await daoMember1.voteYes(proposalId);
        });

        test('vote YES from wallet 3', async () => {
          await daoMember3.voteYes(proposalId);
        });

        test('check if proposal is passed', async () => {
          await mainDao.checkPassedProposal(proposalId);
        });

        test('execute passed proposal', async () => {
          heightBeforeBlacklist = await neutronClient2.getHeight();

          const vaultInfoBeforeBlacklist = await getVaultVPInfo(
            neutronClient2,
            blacklistedAddress,
            STAKING_VAULT,
            heightBeforeBlacklist,
          );
          // before blacklist there are some bonded tokens
          expect(vaultInfoBeforeBlacklist.power).toEqual(+delegationAmount * 2);

          await daoMember1.executeProposalWithAttempts(proposalId);

          await waitBlocks(2, neutronClient2); // Wait for changes to take effect

          // Validate voting power after blacklist
          const vaultInfoAfterBlacklist = await getVaultVPInfo(
            neutronClient2,
            blacklistedAddress,
            STAKING_VAULT,
          );
          expect(vaultInfoAfterBlacklist.power).toEqual(0);
        });
      });

      test('validate wallet 2 has voting power and vote YES', async () => {
        // Validate voting power before blacklist
        const vaultInfoBeforeBlacklistOldBlock = await getVaultVPInfo(
          neutronClient2,
          blacklistedAddress,
          STAKING_VAULT,
          heightBeforeBlacklist,
        );
        // despite address is blacklisted, it still has voting power in the past
        expect(vaultInfoBeforeBlacklistOldBlock.power).toEqual(
          +delegationAmount * 2,
        );

        await daoMember2.voteYes(proposalId);
      });

      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });

      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
    });

    describe('Set slashing params 2', () => {
      let proposalId: number;
      let heightBeforeWhitelist: number;

      test('create proposal', async () => {
        proposalId = await daoMember1.submitUpdateParamsSlashingProposal(
          chainManagerAddress,
          'Proposal #1',
          'Param change proposal. Update slashing params',
          updateSlashingParamsProposal({
            downtime_jail_duration: '3s',
            min_signed_per_window: '0.400000000000000000',
            signed_blocks_window: '8',
            slash_fraction_double_sign: '0.010000000000000000',
            slash_fraction_downtime: '0.100000000000000000',
          }),
          '1000',
        );
      });

      test('vote YES from wallet 1', async () => {
        await daoMember1.voteYes(proposalId);
      });

      test('vote YES from wallet 3', async () => {
        await daoMember3.voteYes(proposalId);
      });

      describe('Whitelist wallet 2', () => {
        let proposalId: number;

        test('create proposal', async () => {
          proposalId = await daoMember1.submitRemoveFromBlacklistProposal(
            STAKING_VAULT,
            'Remove address from blacklist Proposal',
            'Proposal to remove the address from the blacklist and return its voting power',
            { addresses: [blacklistedAddress] },
            '1000',
          );
        });

        test('vote YES from wallet 1', async () => {
          await daoMember1.voteYes(proposalId);
        });

        test('vote YES from wallet 3', async () => {
          await daoMember3.voteYes(proposalId);
        });

        test('check if proposal is passed', async () => {
          await mainDao.checkPassedProposal(proposalId);
        });

        test('execute passed proposal', async () => {
          heightBeforeWhitelist = await neutronClient2.getHeight();

          const vaultInfoBeforeWhitelist = await getVaultVPInfo(
            neutronClient2,
            blacklistedAddress,
            STAKING_VAULT,
            heightBeforeWhitelist,
          );
          expect(vaultInfoBeforeWhitelist.power).toEqual(0);

          await daoMember1.executeProposalWithAttempts(proposalId);

          await waitBlocks(2, neutronClient2);

          // Validate voting power after whitelist
          const vaultInfoAfterWhitelist = await getVaultVPInfo(
            neutronClient2,
            blacklistedAddress,
            STAKING_VAULT,
          );
          expect(vaultInfoAfterWhitelist.power).toEqual(+delegationAmount * 2);
        });
      });

      test('validate wallet 2 has no voting power', async () => {
        const vaultInfoBeforeWhitelistOldBlock = await getVaultVPInfo(
          neutronClient2,
          blacklistedAddress,
          STAKING_VAULT,
          heightBeforeWhitelist,
        );
        // despite address is whitelisted, it still has no voting power in the past
        expect(vaultInfoBeforeWhitelistOldBlock.power).toEqual(0);
      });

      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });

      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
    });
  });
});
