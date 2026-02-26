import { NeutronTestClient } from './neutron_test_client';
import { DeliverTxResponse } from '@cosmjs/stargate';
import {
  NEUTRON_DENOM,
  SECOND_VALIDATOR_CONTAINER,
  STAKING_REWARDS,
} from './constants';
import { expect } from 'vitest';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { execSync } from 'child_process';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';

export type StakeInfo = {
  height: number;
  stake: number;
  totalStake: number;
};

export type VotingPowerInfo = {
  height: number;
  power: number;
  totalPower: number;
};

export const getTrackedStakeInfo = async (
  client: NeutronTestClient,
  address: string,
  stakingTrackerAddr: string,
  height?: number,
): Promise<StakeInfo> => {
  if (typeof height === 'undefined') {
    height = await client.getHeight();
  }

  const stake = await client.queryContractSmart(stakingTrackerAddr, {
    stake_at_height: {
      address: address,
      ...(height !== undefined ? { height: height } : {}),
    },
  });

  const totalStake = await client.queryContractSmart(stakingTrackerAddr, {
    total_stake_at_height: {
      ...(height !== undefined ? { height: height } : {}),
    },
  });

  return {
    height: height,
    stake: +stake,
    totalStake: +totalStake,
  };
};

export const getVaultVPInfo = async (
  client: NeutronTestClient,
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

export const getBondedTokens = async (
  stakingQuerier: StakingQueryClient,
  address: string,
): Promise<number> => {
  const delegations = await stakingQuerier.delegatorDelegations({
    delegatorAddr: address,
  });

  const bondedTokens = delegations.delegationResponses.reduce(
    (sum, delegation) => sum + +delegation.balance.amount,
    0,
  );

  return bondedTokens;
};

export const getTrackedValidators = async (
  client: NeutronTestClient,
  stakingTrackerAddr: string,
  limit = 1000,
): Promise<any> => {
  const validators = await client.queryContractSmart(stakingTrackerAddr, {
    list_validators: { limit },
  });

  return validators;
};

export const checkVotingPowerMatchBondedTokens = async (
  neutronClient: NeutronTestClient,
  stakingQuerier: StakingQueryClient,
  address: string,
  stakingTrackerAddr: string,
  stakingVaultAddr: string,
) => {
  const stake = await neutronClient.queryContractSmart(stakingTrackerAddr, {
    stake_at_height: {
      address: address,
    },
  });

  const power = await neutronClient.queryContractSmart(stakingVaultAddr, {
    voting_power_at_height: {
      address: address,
    },
  });

  const bondedTokens = await getBondedTokens(stakingQuerier, address);

  expect(power.power).toEqual(stake);
  expect(bondedTokens).toEqual(+power.power);
};

export const delegateTokens = async (
  client: NeutronTestClient,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
): Promise<DeliverTxResponse> =>
  await client.signAndBroadcast(
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

export const undelegateTokens = async (
  client: NeutronTestClient,
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
  expect(res.code).toEqual(0);
};

export const redelegateTokens = async (
  client: NeutronTestClient,
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

export const simulateSlashingAndJailing = async (
  validatorClient: NeutronTestClient,
  neutronClient: NeutronTestClient,
  stakingQuerier: StakingQueryClient,
  validatorAddr: string,
  alternativeValidatorAddr: string,
  delegatorAddr: string,
  missedBlocks = 10, // Default to slashing threshold
) => {
  // Check if validator has been slashed
  let validatorInfo = await stakingQuerier.validator({ validatorAddr });

  // Check if the network has enough voting power to continue producing blocks
  const bondedValidators = await stakingQuerier.validators({
    status: 'BOND_STATUS_BONDED',
  });
  const totalBondedTokens = bondedValidators.validators.reduce(
    (acc, val) => acc + Number(val.tokens),
    0,
  );

  const alternativeValidator = bondedValidators.validators.find(
    (val) => val.operatorAddress === alternativeValidatorAddr,
  );

  if (!alternativeValidator) {
    throw 'no alternative validator for slashing found';
  }

  const alternativeValidatorPower = Number(alternativeValidator.tokens);

  const minRequiredBondedTokens = Math.ceil(totalBondedTokens * 0.68);

  if (alternativeValidatorPower < minRequiredBondedTokens) {
    await delegateTokens(
      validatorClient,
      delegatorAddr,
      alternativeValidatorAddr,
      (minRequiredBondedTokens - alternativeValidatorPower).toString(),
    );
  }

  execSync(`docker pause ${SECOND_VALIDATOR_CONTAINER}`);

  await waitBlocks(missedBlocks, neutronClient, 25000);

  execSync(`docker unpause ${SECOND_VALIDATOR_CONTAINER}`);

  await waitBlocks(2, neutronClient);

  // Re-check validator status
  validatorInfo = await stakingQuerier.validator({ validatorAddr });

  return validatorInfo.validator.status;
};


export type Duration = string;

export type ParamsSlashingInfo = {
  signed_blocks_window: string; // int64
  min_signed_per_window: string; // base64?
  downtime_jail_duration: Duration;
  slash_fraction_double_sign: string; // dec
  slash_fraction_downtime: string; // dec
};

export type AddToBlacklistInfo = {
  addresses: string[];
};

export type RemoveFromBlacklistInfo = {
  addresses: string[];
};




export type ParamsStakingInfo = {
  unbonding_time: Duration;
  max_validators: string;
  max_entries: string;
  historical_entries: string;
  bond_denom: string;
};

