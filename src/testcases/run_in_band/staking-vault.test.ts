import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { CONTRACTS, NEUTRON_DENOM } from '../../helpers/constants';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import {expect, inject, RunnerTestSuite} from 'vitest';
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

  describe('Staking Vault Operations', () => {
    beforeAll(async () => {
      stakingVaultAddr = "neutron1nyuryl5u5z04dx4zsqgvsuw7fe8gl2f77yufynauuhklnnmnjncqcls0tj";
    });

    describe('Delegate tokens to validator', () => {
      let createdValidatorAddr: string;
      describe('Create a New Validator', () => {
        test('create and validate a new validator', async () => {
          const validators = await stakingQuerier.validators({
            status: 'BOND_STATUS_BONDED',
          });

          createdValidatorAddr = validators.validators[0].operatorAddress;
          console.log('Validator created successfully:', createdValidatorAddr);
        });
      });

      test('perform multiple delegations and verify VP increase', async () => {
        // Ensure the validator exists
        const validators = await stakingQuerier.validators({
          status: 'BOND_STATUS_BONDED',
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
            amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
            gas: '2000000',
          },
        );

        console.log('KEKEKEKEKE', res.rawLog);
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
