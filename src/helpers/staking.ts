import { SigningNeutronClient } from './signing_neutron_client';
import { DeliverTxResponse, StargateClient } from "@cosmjs/stargate";
import { NEUTRON_DENOM, SECOND_VALIDATOR_CONTAINER } from './constants';
import { expect } from 'vitest';
import { QueryClientImpl as StakingQueryClient } from '@neutron-org/neutronjs/cosmos/staking/v1beta1/query.rpc.Query';
import { execSync } from 'child_process';
import { sleep, waitBlocks } from "@neutron-org/neutronjsplus/dist/wait";
import { DaoMember } from '@neutron-org/neutronjsplus/dist/dao';
import { chainManagerWrapper } from '@neutron-org/neutronjsplus/dist/proposal';
import { ADMIN_MODULE_ADDRESS } from '@neutron-org/neutronjsplus/dist/constants';
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";

export type VotingPowerInfo = {
  height: number;
  power: number;
  totalPower: number;
};

export const getTrackingStakeInfo = async (
  client: SigningNeutronClient,
  address: string,
  stakingTrackerAddr: string,
  height?: number,
): Promise<VotingPowerInfo> => {
  if (typeof height === 'undefined') {
    height = await client.getHeight();
  }

  const power = await client.queryContractSmart(stakingTrackerAddr, {
    voting_power_at_height: {
      address: address,
      ...(height !== undefined ? { height: height } : {}),
    },
  });

  const totalPower = await client.queryContractSmart(stakingTrackerAddr, {
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

export const delegateTokens = async (
  client: SigningNeutronClient,
  delegatorAddress,
  validatorAddress,
  amount,
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

export const redelegateTokens = async (
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

export const simulateSlashingAndJailing = async (
  validatorClient: SigningNeutronClient,
  neutronClient: SigningNeutronClient,
  stakingQuerier: StakingQueryClient,
  validatorAddr: string,
  alternativeValidatorAddr: string,
  delegatorAddr: string,
  missedBlocks = 10, // Default to slashing threshold
) => {
  // Check if validator has been slashed
  let validatorInfo = await stakingQuerier.validator({ validatorAddr });

  // Check if the network has enough voting power to continue producing blocks
  const activeValidators = await stakingQuerier.validators({
    status: 'BOND_STATUS_BONDED',
  });
  const totalVotingPower = activeValidators.validators.reduce(
    (acc, val) => acc + Number(val.tokens),
    0,
  );

  // console.log(`Total active voting power: ${totalVotingPower}`);

  // Retrieve voting power of both validators
  // const slashedValidator = activeValidators.validators.find(
  //   (val) => val.operatorAddress === validatorAddr,
  // );
  const alternativeValidator = activeValidators.validators.find(
    (val) => val.operatorAddress === alternativeValidatorAddr,
  );

  // if (!slashedValidator) {
  //   console.log(`Slashed validator ${validatorAddr} not found.`);
  // } else {
  //   console.log(
  //     `Slashed Validator Power Before: ${Number(slashedValidator.tokens)}`,
  //   );
  // }

  if (!alternativeValidator) {
    throw 'no alternative validator for slashing found';
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

  // slashed validator
  // const vaultInfoBeforeSlashing = await getStakingTrackerInfo(
  //   validatorClient,
  //   validatorAddr,
  //   STAKING_TRACKER,
  // );
  // console.log(`Voting Power Before Slashing: ${vaultInfoBeforeSlashing.power}`);

  console.log(`Pausing validator container: ${SECOND_VALIDATOR_CONTAINER}`);
  execSync(`docker pause ${SECOND_VALIDATOR_CONTAINER}`);

  // console.log(`Waiting ${missedBlocks} blocks to trigger slashing...`);
  await waitBlocks(missedBlocks, neutronClient, 25000);

  console.log(`Unpausing validator container: ${SECOND_VALIDATOR_CONTAINER}`);
  execSync(`docker unpause ${SECOND_VALIDATOR_CONTAINER}`);

  // console.log(`Waiting 2 blocks to confirm status update...`);
  await waitBlocks(2, neutronClient);

  // Re-check validator status
  validatorInfo = await stakingQuerier.validator({ validatorAddr });
  // console.log(`Final validator status: ${validatorInfo.validator.status}`);

  // Retrieve voting power of both validators
  // console.log(
  //   `Slashed Validator Power Before: ${Number(validatorInfo.validator.tokens)}`,
  // );

  return validatorInfo.validator.status;
};

// TODO: use from neutronjsplus
/**
 * submitUpdateParamsSlashingProposal creates proposal which changes params of slashing module.
 */
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

// TODO: use from neutronjsplus
export const submitAddToBlacklistProposal = async (
  dao: DaoMember,
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

// TODO: use from neutronjsplus
export const submitRemoveFromBlacklistProposal = async (
  dao: DaoMember,
  contractAddress: string,
  title: string,
  description: string,
  blacklist: RemoveFromBlacklistInfo,
  deposit: string,
): Promise<number> => {
  const wasmMessage = {
    wasm: {
      execute: {
        contract_addr: contractAddress,
        msg: Buffer.from(
          JSON.stringify({
            remove_from_blacklist: blacklist,
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
