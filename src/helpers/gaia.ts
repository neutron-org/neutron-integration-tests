import { TextProposal } from '@neutron-org/neutronjs/cosmos/gov/v1beta1/gov';
import {
  MsgDelegate,
  MsgUndelegate,
} from '@neutron-org/neutronjs/cosmos/staking/v1beta1/tx';
import {
  MsgSubmitProposal,
  MsgVote,
} from '@neutron-org/neutronjs/cosmos/gov/v1beta1/tx';
import { VoteOption } from '@neutron-org/neutronjs/cosmos/gov/v1beta1/gov';
import { COSMOS_DENOM } from './constants';
import { DeliverTxResponse, SigningStargateClient } from '@cosmjs/stargate';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';

export const executeMsgDelegate = async (
  client: SigningStargateClient,
  wallet: Wallet,
  validatorAddress: string,
  amount: string,
): Promise<DeliverTxResponse> => {
  const msgDelegate: MsgDelegate = {
    delegatorAddress: wallet.address,
    validatorAddress,
    amount: { denom: COSMOS_DENOM, amount: amount },
  };
  const msg = { typeUrl: MsgDelegate.typeUrl, value: msgDelegate };
  const res = await client.signAndBroadcast(wallet.address, [msg], {
    gas: '500000',
    amount: [{ denom: COSMOS_DENOM, amount: '5000' }],
  });
  return res;
};

export const executeMsgUndelegate = async (
  client: SigningStargateClient,
  wallet: Wallet,
  validatorAddress: string,
  amount: string,
): Promise<DeliverTxResponse> => {
  const msgUndelegate: MsgUndelegate = {
    delegatorAddress: wallet.address,
    validatorAddress,
    amount: { denom: COSMOS_DENOM, amount: amount },
  };
  const msg = { typeUrl: MsgUndelegate.typeUrl, value: msgUndelegate };
  const res = await client.signAndBroadcast(
    wallet.address,
    [msg],

    {
      gas: '500000',
      amount: [{ denom: COSMOS_DENOM, amount: '5000' }],
    },
  );

  return res;
};

export const executeMsgSubmitProposal = async (
  client: SigningStargateClient,
  wallet: Wallet,
  amount = '0',
): Promise<DeliverTxResponse> => {
  client.registry.register(TextProposal.typeUrl, TextProposal as any);
  const textProposal: TextProposal = {
    title: 'mock',
    description: 'mock',
  };
  const value = client.registry.encode({
    typeUrl: TextProposal.typeUrl,
    value: textProposal,
  });
  const msgSubmitProposal: MsgSubmitProposal = {
    proposer: wallet.address,
    content: {
      typeUrl: '/cosmos.gov.v1beta1.TextProposal',
      value: value,
    },
    initialDeposit: [{ denom: COSMOS_DENOM, amount: '10000000' }],
  };
  const msg = { typeUrl: MsgSubmitProposal.typeUrl, value: msgSubmitProposal };
  const res = await client.signAndBroadcast(wallet.address, [msg], {
    gas: '500000',
    amount: [{ denom: COSMOS_DENOM, amount: amount }],
  });

  return res;
};

export const executeMsgVote = async (
  client: SigningStargateClient,
  wallet: Wallet,
  proposalId: number,
  amount = '0',
): Promise<DeliverTxResponse> => {
  const msgVote: MsgVote = {
    voter: wallet.address,
    proposalId: BigInt(proposalId),
    option: VoteOption.VOTE_OPTION_YES,
  };
  const msg = { typeUrl: MsgVote.typeUrl, value: msgVote };

  const res = await client.signAndBroadcast(wallet.address, [msg], {
    gas: '500000',
    amount: [{ denom: COSMOS_DENOM, amount: amount }],
  });

  return res;
};
