import {
  TextProposal,
  VoteOption,
} from '@neutron-org/neutronjs/cosmos/gov/v1beta1/gov';
import {
  MsgDelegate,
  MsgUndelegate,
} from '@neutron-org/neutronjs/cosmos/staking/v1beta1/tx';
import {
  MsgSubmitProposal,
  MsgVote,
} from '@neutron-org/neutronjs/cosmos/gov/v1beta1/tx';
import { MsgSubmitProposal as MsgSubmitProposalV1 } from '@neutron-org/neutronjs/cosmos/gov/v1/tx';
import { COSMOS_DENOM, NEUTRON_DENOM } from './constants';
import {
  DeliverTxResponse,
  SigningStargateClient,
  StdFee,
} from '@cosmjs/stargate';
import { GaiaWallet, Wallet } from './wallet';
import { NeutronTestClient } from './neutron_test_client';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';
import { Any } from 'cosmjs-types/google/protobuf/any';

export const executeMsgDelegate = async (
  client: SigningStargateClient,
  wallet: GaiaWallet,
  validatorAddress: string,
  amount: string | Coin,
  fee: StdFee | 'auto' | number = 'auto',
): Promise<DeliverTxResponse> => {
  const msgDelegate: MsgDelegate = {
    delegatorAddress: wallet.address,
    validatorAddress,
    amount:
      typeof amount === 'string'
        ? { denom: COSMOS_DENOM, amount: amount }
        : amount,
  };
  const msg = { typeUrl: MsgDelegate.typeUrl, value: msgDelegate };
  return await client.signAndBroadcast(wallet.address, [msg], fee);
};

export const executeMsgUndelegate = async (
  client: SigningStargateClient,
  wallet: GaiaWallet,
  validatorAddress: string,
  amount: string | Coin,
  fee: StdFee | 'auto' | number = {
    gas: '500000',
    amount: [{ denom: COSMOS_DENOM, amount: '5000' }],
  },
): Promise<DeliverTxResponse> => {
  const msgUndelegate: MsgUndelegate = {
    delegatorAddress: wallet.address,
    validatorAddress,
    amount:
      typeof amount === 'string'
        ? { denom: COSMOS_DENOM, amount: amount }
        : amount,
  };
  const msg = { typeUrl: MsgUndelegate.typeUrl, value: msgUndelegate };
  const res = await client.signAndBroadcast(
    wallet instanceof NeutronTestClient ? wallet.sender : wallet.address,
    [msg],
    fee,
  );

  return res;
};

export const executeMsgSubmitProposalLegacy = async (
  client: SigningStargateClient,
  wallet: GaiaWallet,
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
  return await client.signAndBroadcast(wallet.address, [msg], {
    gas: '500000',
    amount: [{ denom: COSMOS_DENOM, amount: amount }],
  });
};

export const executeMsgSubmitProposalV1 = async (
  client: NeutronTestClient,
  wallet: Wallet,
  title: string,
  summary: string,
  metadata: string,
  messages: Any[],
  initialDeposit: Coin[],
  expedited: boolean,
  fee: StdFee | 'auto' | number = {
    gas: '5000000',
    amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
  },
): Promise<DeliverTxResponse> => {
  const msgSubmitProposal: MsgSubmitProposalV1 = {
    proposer: wallet.address,
    messages: messages,
    initialDeposit: initialDeposit,
    metadata: metadata,
    title: title,
    summary: summary,
    expedited: expedited,
  };
  const msg = {
    typeUrl: MsgSubmitProposalV1.typeUrl,
    value: msgSubmitProposal,
  };
  console.log(msg);
  return await client.signAndBroadcast([msg], fee);
};

export const executeMsgVote = async (
  client: SigningStargateClient,
  wallet: GaiaWallet,
  proposalId: number,
  fee: StdFee | 'auto' | number = {
    gas: '500000',
    amount: [{ denom: COSMOS_DENOM, amount: '5000' }],
  },
): Promise<DeliverTxResponse> => {
  const msgVote: MsgVote = {
    voter: wallet.address,
    proposalId: BigInt(proposalId),
    option: VoteOption.VOTE_OPTION_YES,
  };
  const msg = { typeUrl: MsgVote.typeUrl, value: msgVote };

  return await client.signAndBroadcast(wallet.address, [msg], fee);
};

export const executeMsgVoteNeutron = async (
  client: NeutronTestClient,
  wallet: Wallet,
  proposalId: number,
  fee: StdFee | 'auto' | number = {
    gas: '500000',
    amount: [{ denom: NEUTRON_DENOM, amount: '5000' }],
  },
): Promise<DeliverTxResponse> => {
  const msgVote: MsgVote = {
    voter: wallet.address,
    proposalId: BigInt(proposalId),
    option: VoteOption.VOTE_OPTION_YES,
  };
  const msg = { typeUrl: MsgVote.typeUrl, value: msgVote };

  return await client.signAndBroadcast([msg], fee);
};
