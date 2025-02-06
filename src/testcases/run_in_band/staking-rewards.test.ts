import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { NEUTRON_DENOM } from '../../helpers/constants';
import { expect, inject, RunnerTestSuite } from 'vitest';
import { LocalState, mnemonicToWallet } from '../../helpers/local_state';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';

const VAL_MNEMONIC_2 =
  'angry twist harsh drastic left brass behave host shove marriage fall update business leg direct reward object ugly security warm tuna model broccoli choice';
// const STAKING_VAULT =
//   'neutron1nyuryl5u5z04dx4zsqgvsuw7fe8gl2f77yufynauuhklnnmnjncqcls0tj';

// const DAO = 'neutron1yw4xvtc43me9scqfr2jr2gzvcxd3a9y4eq7gaukreugw2yd2f8ts8g30fq';
const STAKING_VAULT =
  'neutron1jarq7kgdyd7dcfu2ezeqvg4w4hqdt3m5lv364d8mztnp9pzmwwwqjw7fvg';
const STAKING_TRACKER =
  'neutron1nyuryl5u5z04dx4zsqgvsuw7fe8gl2f77yufynauuhklnnmnjncqcls0tj';
const STAKING_REWARDS =
  'neutron1nhay73rdztlwwxnspup3y4uld59ylaumhddjt80eqmd0xl5e7mfqx0rnr3';
const STAKING_INFO_PROXY =
  'neutron14xw3z6mhrhuckd46t2saxu7h90fzydnfu7xuewm4tmgl0dakkcjqxc3k6x';

describe('Neutron / Staking Vault - Extended Scenarios', () => {
  let testState: LocalState;
  let neutronClient1: SigningNeutronClient;
  let neutronClient2: SigningNeutronClient;
  let validatorClient: SigningNeutronClient;

  let neutronWallet1: Wallet;
  let neutronWallet2: Wallet;
  let stakingQuerier: StakingQueryClient;

  let validator1Addr: string;
  let validator2Addr: string;
  let validatorWallet: Wallet;

  let validator1SelfDelegation: number;
  let validator2SelfDelegation: number;

  const delegationAmount = '1000000'; // 1 NTRN
  const undelegationAmount = '500000'; // 0.5 NTRN
  const redelegationAmount = '300000'; // 0.3 NTRN

  beforeAll(async (suite: RunnerTestSuite) => {
    const mnemonics = inject('mnemonics');
    testState = await LocalState.create(config, mnemonics, suite);

    neutronWallet1 = await testState.nextWallet('neutron');
    neutronWallet2 = await testState.nextWallet('neutron');
    validatorWallet = await mnemonicToWallet(VAL_MNEMONIC_2, 'neutron');

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

    validatorClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      validatorWallet.directwallet,
      validatorWallet.address,
    );

    const neutronRpcClient = await testState.neutronRpcClient();
    stakingQuerier = new StakingQueryClient(neutronRpcClient);
  });

  describe('Staking Vault Operations - Multiple Users & Validators', () => {
    describe('Delegate/Undelegate/Redelegate tokens to multiple validators', () => {
      describe('query validators', () => {
        test('fetch validator data', async () => {
          const validators = await stakingQuerier.validators({
            status: 'BOND_STATUS_BONDED',
          });

          validator1Addr = validators.validators[0].operatorAddress;
          validator1SelfDelegation = +validators.validators[0].tokens;

          validator2Addr = validators.validators[1].operatorAddress;
          validator2SelfDelegation = +validators.validators[1].tokens;

          console.log('Validator1:', validator1Addr, validator1SelfDelegation);
          console.log('Validator2:', validator2Addr, validator2SelfDelegation);
        });
      });

      test('perform multiple delegations and validate historical voting power', async () => {
        const delegators = [
          { wallet: neutronWallet1, client: neutronClient1 },
          { wallet: neutronWallet2, client: neutronClient2 },
        ];

        for (const { wallet, client } of delegators) {
          const heightBefore = await client.getHeight();

          for (const validator of [validator1Addr, validator2Addr]) {
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
            STAKING_VAULT,
            heightBefore,
          );
          const vaultInfoAfter = await getStakingVaultInfo(
            client,
            wallet.address,
            STAKING_VAULT,
            heightAfter,
          );

          expect(vaultInfoBefore.power).toEqual(0);
          expect(vaultInfoAfter.power).toEqual(+delegationAmount * 2);
        }
      });

      test('perform redelegation from Validator1 to Validator2', async () => {
        const delegator = { wallet: neutronWallet1, client: neutronClient1 };

        const heightBeforeRedelegation = await delegator.client.getHeight();

        await redelegateTokens(
          delegator.client,
          delegator.wallet.address,
          validator1Addr,
          validator2Addr,
          redelegationAmount,
        );

        await waitBlocks(2, delegator.client);

        const heightAfterRedelegation = await delegator.client.getHeight();

        const vaultInfoBefore = await getStakingVaultInfo(
          delegator.client,
          delegator.wallet.address,
          STAKING_VAULT,
          heightBeforeRedelegation,
        );
        const vaultInfoAfter = await getStakingVaultInfo(
          delegator.client,
          delegator.wallet.address,
          STAKING_VAULT,
          heightAfterRedelegation,
        );

        expect(vaultInfoBefore.power).toEqual(vaultInfoAfter.power);
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
            validator1Addr,
            undelegationAmount,
          );
          await undelegateTokens(
            client,
            wallet.address,
            validator2Addr,
            undelegationAmount,
          );

          await waitBlocks(2, client);
          const heightAfterUndelegation = await client.getHeight();

          const vaultInfoBefore = await getStakingVaultInfo(
            client,
            wallet.address,
            STAKING_VAULT,
            heightBeforeUndelegation,
          );
          const vaultInfoAfter = await getStakingVaultInfo(
            client,
            wallet.address,
            STAKING_VAULT,
            heightAfterUndelegation,
          );

          expect(vaultInfoAfter.power).toBeLessThan(vaultInfoBefore.power);
        }
      });
      // this works only with cheated ownership for now, later will be done using DAO
      test('blacklist and validate voting power', async () => {
        const blacklistedAddress = neutronWallet1.address;

        const heightBeforeBlacklist = await neutronClient1.getHeight();

        await neutronClient1.execute(STAKING_VAULT, {
          add_to_blacklist: { addresses: [blacklistedAddress] },
        });

        await waitBlocks(2, neutronClient1);

        const vaultInfoAfterBlacklist = await getStakingVaultInfo(
          neutronClient1,
          blacklistedAddress,
          STAKING_VAULT,
        );
        expect(vaultInfoAfterBlacklist.power).toEqual(0);

        const vaultInfoBeforeBlacklist = await getStakingVaultInfo(
          neutronClient1,
          blacklistedAddress,
          STAKING_VAULT,
          heightBeforeBlacklist,
        );
        expect(vaultInfoBeforeBlacklist.power).toBeGreaterThan(0);
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
