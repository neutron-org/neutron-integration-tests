import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { CONTRACTS, NEUTRON_DENOM } from '../../helpers/constants';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { inject, RunnerTestSuite } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';

describe('Neutron / Staking Vault', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let neutronWallet: Wallet;
  let daoMember: DaoMember;
  let mainDao: Dao;
  let stakingVaultAddr: string;
  let chainManagerAddress: string;
  let stakingQuerier: StakingQueryClient;

  beforeAll(async (suite: RunnerTestSuite) => {
    const mnemonics = inject('mnemonics');
    testState = await LocalState.create(config, mnemonics, suite);
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
    );
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
    stakingQuerier = new StakingQueryClient(neutronRpcClient);
  });

  describe('add hook subscriptions via proposal', () => {
    let proposalId: number;

    test('bond form wallet 1', async () => {
      await daoMember.bondFunds('10000');
      await neutronClient.getWithAttempts(
        async () => await mainDao.queryVotingPower(daoMember.user),
        async (response) => response.power == 10000,
        20,
      );
    });

    test('submit hook subscription proposal', async () => {
      proposalId = await daoMember.submitManageHookSubscriptionProposal(
        chainManagerAddress,
        'Add Hook Subscriptions',
        'Proposal to add hook subscriptions to the contract',
        {
          contract_address: stakingVaultAddr,
          hooks: [0, 1, 2, 3, 4, 5, 6], // Hook types: all
        },
        '1000',
      );

      expect(proposalId).toBeGreaterThan(0);
    });

    test('vote YES', async () => {
      await daoMember.voteYes(proposalId);
    });

    test('execute passed proposal to add hooks', async () => {
      await mainDao.checkPassedProposal(proposalId);
      await daoMember.executeProposalWithAttempts(proposalId);
    });
  });

  describe('Staking Vault Operations', () => {
    beforeAll(async () => {
      stakingVaultAddr = await neutronClient.create(
        CONTRACTS.NEUTRON_STAKING_VAULT,
        {},
      );
      expect(stakingVaultAddr).toBeTruthy();
    });

    describe('Delegate tokens to validator', () => {
      let createdValidatorAddr: string;
      describe('Create a New Validator', () => {
        test('create and validate a new validator', async () => {
          // Create a new validator address
          const newValidatorAddress = 'neutronvaloper1newvalidatorxyzxyz';

          // Ensure the validator is now recognized in the system
          const res = await neutronClient.signAndBroadcast(
            [
              {
                typeUrl: '/cosmos.staking.v1beta1.MsgCreateValidator',
                value: {
                  description: {
                    moniker: 'TestValidator',
                    identity: '',
                    website: '',
                    securityContact: '',
                    details: '',
                  },
                  commission: {
                    rate: '0.1',
                    maxRate: '0.2',
                    maxChangeRate: '0.01',
                  },
                  minSelfDelegation: '1',
                  delegatorAddress: neutronWallet.address,
                  validatorAddress: newValidatorAddress,
                  pubkey: 'AjtXdaTQoCsSsdYcLVc90ofykYghfxXEyD/Hk3U50PY=',
                  value: { denom: NEUTRON_DENOM, amount: '1000' },
                },
              },
            ],
            {
              amount: [{ denom: NEUTRON_DENOM, amount: '5000' }],
              gas: '200000',
            },
          );

          expect(res.code).toEqual(0);

          await waitBlocks(2, neutronClient);

          const validators = await stakingQuerier.validators({
            status: 'bonded',
          });

          const createdValidator = validators.validators.find(
            (val) => val.operatorAddress === newValidatorAddress,
          );
          createdValidatorAddr = createdValidator.operatorAddress;

          expect(createdValidator).toBeDefined();
          expect(createdValidator.tokens).toEqual('1000');
          console.log('Validator created successfully:', createdValidator);
        });
      });

      test('perform multiple delegations and verify VP increase', async () => {
        // Ensure the validator exists
        const validators = await stakingQuerier.validators({
          status: 'bonded',
        });
        const validator = validators.validators.find(
          (val) => val.operatorAddress === createdValidatorAddr,
        );
        expect(validator).toBeDefined();

        const delegationAmount = '1000000'; // 1 ntrn
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
              value: {
                delegatorAddress: neutronWallet.address,
                validatorAddress: createdValidatorAddr,
                amount: { denom: NEUTRON_DENOM, amount: delegationAmount },
              },
            },
          ],
          {
            amount: [{ denom: NEUTRON_DENOM, amount: '5000' }],
            gas: '200000',
          },
        );

        expect(res.code).toEqual(0);

        // Wait for the hooks to process
        await waitBlocks(2, neutronClient);

        const vaultInfo = await getStakingVaultInfo(
          neutronClient,
          neutronWallet.address,
          stakingVaultAddr,
        );
        expect(vaultInfo.power).toBeGreaterThan(0);
        console.log(
          'Delegation successful. Updated voting power:',
          vaultInfo.power,
        );
      });
    });
  });
});

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
    power: +power.power,
    totalPower: +totalPower.power,
  };
};

type VotingPowerInfo = {
  height: number;
  power: number;
  totalPower: number;
};
