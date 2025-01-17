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

    test('verify hook subscriptions', async () => {
      // TODO generate query client for harpoon
      // const queryClient = new AdminQueryClient(
      //   await testState.neutronRpcClient(),
      // );
      // const subscriptions = await queryClient.hookSubscriptions({
      //   contractAddress: stakingVaultAddr,
      // });
      //
      // // Ensure the subscribed hooks match the proposal
      // expect(subscriptions.hooks).toEqual([0, 1, 3]);
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
      test('perform multiple delegations and verify VP increase', async () => {
        const validators = await stakingQuerier.validators({
          status: 'bonded',
        });
        const validatorAddress = validators.validators[0].operatorAddress;
        const firstDelegationAmount = '1000000'; // 1 ntrn
        const secondDelegationAmount = '500000'; // 0.5 ntrn

        // Perform the first delegation
        let res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
              value: {
                delegatorAddress: neutronWallet.address,
                validatorAddress: validatorAddress,
                amount: { denom: NEUTRON_DENOM, amount: firstDelegationAmount },
              },
            },
          ],
          {
            amount: [{ denom: NEUTRON_DENOM, amount: '5000' }],
            gas: '200000',
          },
        );

        expect(res.code).toEqual(0);

        // Wait for hooks to process
        await waitBlocks(2, neutronClient);

        // Query voting power after the first delegation
        let vaultInfo = await getStakingVaultInfo(
          neutronClient,
          neutronWallet.address,
          stakingVaultAddr,
        );
        const firstVP = vaultInfo.power;

        expect(firstVP).toBeGreaterThan(0);

        // Perform the second delegation
        res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
              value: {
                delegatorAddress: neutronWallet.address,
                validatorAddress: validatorAddress,
                amount: {
                  denom: NEUTRON_DENOM,
                  amount: secondDelegationAmount,
                },
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

        // Query voting power after the second delegation
        vaultInfo = await getStakingVaultInfo(
          neutronClient,
          neutronWallet.address,
          stakingVaultAddr,
        );
        const secondVP = vaultInfo.power;

        // Ensure voting power has increased
        expect(secondVP).toBeGreaterThan(firstVP);

        console.log(
          `Voting power after first delegation: ${firstVP}, after second delegation: ${secondVP}`,
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
