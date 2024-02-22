import { BroadcastTx200ResponseTxResponse } from '@cosmos-client/core/cjs/openapi/api';
import {
  MsgDelegate,
  MsgUndelegate,
} from '@neutron-org/neutronjsplus/dist/proto/cosmos_sdk/cosmos/staking/v1beta1/tx_pb';
import {
  MsgSubmitProposal,
  MsgVote,
  TextProposal,
  VoteOption,
} from '@neutron-org/neutronjsplus/dist/proto/cosmos_sdk/cosmos/gov/v1beta1/tx_pb';
import {
  packAnyMsg,
  WalletWrapper,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import Long from 'long';

export const msgDelegate = async (
  wallet: WalletWrapper,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgDelegate = new MsgDelegate({
    delegatorAddress,
    validatorAddress,
    amount: { denom: wallet.chain.denom, amount: amount },
  });
  const res = await wallet.execTx(
    {
      gas_limit: Long.fromString('500000'),
      amount: [{ denom: wallet.chain.denom, amount: '5000' }],
    },
    [packAnyMsg('/cosmos.staking.v1beta1.MsgDelegate', msgDelegate)],
  );
  return res?.tx_response;
};

export const msgUndelegate = async (
  wallet: WalletWrapper,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgUndelegate = new MsgUndelegate({
    delegatorAddress,
    validatorAddress,
    amount: { denom: wallet.chain.denom, amount: amount },
  });
  const res = await wallet.execTx(
    {
      gas_limit: Long.fromString('500000'),
      amount: [{ denom: wallet.chain.denom, amount: '5000' }],
    },
    [packAnyMsg('/cosmos.staking.v1beta1.MsgUndelegate', msgUndelegate)],
  );

  return res?.tx_response;
};

export const msgSubmitProposal = async (
  wallet: WalletWrapper,
  proposer: string,
  amount = '0',
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgSubmitProposal = new MsgSubmitProposal({
    proposer,
    content: {
      typeUrl: '/cosmos.gov.v1beta1.TextProposal',
      value: new TextProposal({
        title: 'mock',
        description: 'mock',
      }).toBinary(),
    },
    initialDeposit: [{ denom: wallet.chain.denom, amount: '10000000' }],
  });
  const res = await wallet.execTx(
    {
      gas_limit: Long.fromString('500000'),
      amount: [{ denom: wallet.chain.denom, amount: amount }],
    },
    [packAnyMsg('/cosmos.gov.v1beta1.MsgSubmitProposal', msgSubmitProposal)],
  );

  return res?.tx_response;
};

export const msgVote = async (
  wallet: WalletWrapper,
  voter: string,
  proposalId: number,
  amount = '0',
): Promise<BroadcastTx200ResponseTxResponse> => {
  console.log('msgVote', voter, proposalId, amount);
  const msgVote = new MsgVote({
    voter,
    proposalId: BigInt(proposalId),
    option: VoteOption.YES,
  });

  const res = await wallet.execTx(
    {
      gas_limit: Long.fromString('500000'),
      amount: [{ denom: wallet.chain.denom, amount: amount }],
    },
    [packAnyMsg('/cosmos.gov.v1beta1.MsgVote', msgVote)],
  );

  return res?.tx_response;
};
