import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { CONTRACTS, NEUTRON_DENOM } from '../../helpers/constants';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { expect, inject, RunnerTestSuite } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';

describe('Neutron / Staking Vault', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let neutronWallet: Wallet;
  let stakingVaultAddr: string;
  let stakingQuerier: StakingQueryClient;

  let validator1Addr: string;
  let validator2Addr: string;

  let validator1SelfDelegation: number;
  let validator2SelfDelegation: number;

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

    stakingQuerier = new StakingQueryClient(neutronRpcClient);
  });

  describe('Staking Vault Operations', () => {
    beforeAll(async () => {
      stakingVaultAddr =
        'neutron1nyuryl5u5z04dx4zsqgvsuw7fe8gl2f77yufynauuhklnnmnjncqcls0tj';
    });

    describe('Delegate/Undelegate/Redelegate tokens to validator', () => {
      describe('query validators', () => {
        test('create and validate a new validator', async () => {
          const validators = await stakingQuerier.validators({
            status: 'BOND_STATUS_BONDED',
          });

          validator1Addr = validators.validators[0].operatorAddress;
          validator1SelfDelegation = +validators.validators[0].tokens;

          validator2Addr = validators.validators[1].operatorAddress;
          validator2SelfDelegation = +validators.validators[1].tokens;

          console.log(
            'Validator1 created successfully:',
            validator1Addr,
            validator1SelfDelegation,
          );
          console.log(
            'Validator2 created successfully:',
            validator2Addr,
            validator2SelfDelegation,
          );
        });
      });

      test('perform multiple delegations and verify VP increase', async () => {
        const delegationAmount = '1000000'; // 1 ntrn
        let res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
              value: {
                delegatorAddress: neutronWallet.address,
                validatorAddress: validator1Addr,
                amount: { denom: NEUTRON_DENOM, amount: delegationAmount },
              },
            },
          ],
          {
            amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
            gas: '2000000',
          },
        );

        expect(res.code).toEqual(0);

        // Wait for the hooks to process
        await waitBlocks(2, neutronClient);

        let vaultInfo = await getStakingVaultInfo(
          neutronClient,
          neutronWallet.address,
          stakingVaultAddr,
        );
        expect(vaultInfo.power).toEqual(+delegationAmount);
        expect(vaultInfo.totalPower).toEqual(
          +delegationAmount +
            validator1SelfDelegation +
            validator2SelfDelegation,
        );
        console.log(
          'Delegation successful. Updated voting power:',
          vaultInfo.power,
        );

        res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
              value: {
                delegatorAddress: neutronWallet.address,
                validatorAddress: validator1Addr,
                amount: { denom: NEUTRON_DENOM, amount: delegationAmount },
              },
            },
          ],
          {
            amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
            gas: '2000000',
          },
        );

        expect(res.code).toEqual(0);

        // Wait for the hooks to process
        await waitBlocks(2, neutronClient);

        vaultInfo = await getStakingVaultInfo(
          neutronClient,
          neutronWallet.address,
          stakingVaultAddr,
        );
        expect(vaultInfo.power).toEqual(+delegationAmount * 2);
        expect(vaultInfo.totalPower).toEqual(
          delegationAmount * 2 +
            validator1SelfDelegation +
            validator2SelfDelegation,
        );
        console.log(
          'Delegation successful. Updated voting power:',
          vaultInfo.power,
        );
      });
      test('perform undelegations and verify VP decrease', async () => {
        // Ensure the validator exists
        const validators = await stakingQuerier.validators({
          status: 'BOND_STATUS_BONDED',
        });
        const validator = validators.validators.find(
          (val) => val.operatorAddress === validator1Addr,
        );
        expect(validator).toBeDefined();

        const undelegationAmount = '1000000'; // 1 ntrn
        let res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
              value: {
                delegatorAddress: neutronWallet.address,
                validatorAddress: validator1Addr,
                amount: { denom: NEUTRON_DENOM, amount: undelegationAmount },
              },
            },
          ],
          {
            amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
            gas: '2000000',
          },
        );

        expect(res.code).toEqual(0);

        // Wait for the hooks to process
        await waitBlocks(2, neutronClient);

        let vaultInfo = await getStakingVaultInfo(
          neutronClient,
          neutronWallet.address,
          stakingVaultAddr,
        );
        expect(vaultInfo.power).toEqual(+undelegationAmount);
        expect(vaultInfo.totalPower).toEqual(
          +undelegationAmount +
            validator1SelfDelegation +
            validator2SelfDelegation,
        );
        console.log(
          'Unelegation successful. Updated voting power:',
          vaultInfo.power,
        );

        res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
              value: {
                delegatorAddress: neutronWallet.address,
                validatorAddress: validator1Addr,
                amount: { denom: NEUTRON_DENOM, amount: undelegationAmount },
              },
            },
          ],
          {
            amount: [{ denom: NEUTRON_DENOM, amount: '5000000' }],
            gas: '2000000',
          },
        );

        expect(res.code).toEqual(0);

        // Wait for the hooks to process
        await waitBlocks(2, neutronClient);

        vaultInfo = await getStakingVaultInfo(
          neutronClient,
          neutronWallet.address,
          stakingVaultAddr,
        );
        expect(vaultInfo.power).toEqual(0);
        expect(vaultInfo.totalPower).toEqual(
          validator1SelfDelegation + validator2SelfDelegation,
        );
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
    power: +power,
    totalPower: +totalPower,
  };
};

type VotingPowerInfo = {
  height: number;
  power: number;
  totalPower: number;
};
