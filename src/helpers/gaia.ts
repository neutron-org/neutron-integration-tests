import { BroadcastTx200ResponseTxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { walletWrapper } from '@neutron-org/neutronjsplus';
import { TextProposal } from '@neutron-org/neutronjsplus/dist/proto/cosmos_sdk/cosmos/gov/v1beta1/gov_pb';
// TODO: should be from basic cosmjs types
import {
  MsgDelegate,
  MsgUndelegate,
} from '@neutron-org/cosmjs-types/cosmos/staking/v1beta1/tx';
import {
  MsgSubmitProposal,
  MsgVote,
} from '@neutron-org/cosmjs-types/cosmos/gov/v1beta1/tx';
import { VoteOption } from '@neutron-org/cosmjs-types/cosmos/gov/v1beta1/gov';

export const msgDelegate = async (
  wallet: walletWrapper.WalletWrapper,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgDelegate: MsgDelegate = {
    delegatorAddress,
    validatorAddress,
    amount: { denom: wallet.chain.denom, amount: amount },
  };
  const msg = { typeUrl: MsgDelegate.typeUrl, value: msgDelegate };
  const res = await wallet.execTx2(
    {
      gas: '500000',
      amount: [{ denom: wallet.chain.denom, amount: '5000' }],
    },
    [msg],
  );
  return res?.tx_response;
};

export const msgUndelegate = async (
  wallet: walletWrapper.WalletWrapper,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgUndelegate: MsgUndelegate = {
    delegatorAddress,
    validatorAddress,
    amount: { denom: wallet.chain.denom, amount: amount },
  };
  const msg = { typeUrl: MsgUndelegate.typeUrl, value: msgUndelegate };
  const res = await wallet.execTx2(
    {
      gas: '500000',
      amount: [{ denom: wallet.chain.denom, amount: '5000' }],
    },
    [msg],
  );

  return res?.tx_response;
};

export const msgSubmitProposal = async (
  wallet: walletWrapper.WalletWrapper,
  proposer: string,
  amount = '0',
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgSubmitProposal: MsgSubmitProposal = {
    proposer,
    content: {
      // TODO: encode using cosmjs types
      typeUrl: '/cosmos.gov.v1beta1.TextProposal',
      value: new TextProposal({
        title: 'mock',
        description: 'mock',
      }).toBinary(),
    },
    initialDeposit: [{ denom: wallet.chain.denom, amount: '10000000' }],
  };
  const msg = { typeUrl: MsgSubmitProposal.typeUrl, value: msgSubmitProposal };
  const res = await wallet.execTx2(
    {
      gas: '500000',
      amount: [{ denom: wallet.chain.denom, amount: amount }],
    },
    [msg],
  );

  return res?.tx_response;
};

export const msgVote = async (
  wallet: walletWrapper.WalletWrapper,
  voter: string,
  proposalId: number,
  amount = '0',
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgVote: MsgVote = {
    voter,
    proposalId: BigInt(proposalId),
    option: VoteOption.VOTE_OPTION_YES,
  };
  const msg = { typeUrl: MsgVote.typeUrl, value: msgVote };

  const res = await wallet.execTx2(
    {
      gas: '500000',
      amount: [{ denom: wallet.chain.denom, amount: amount }],
    },
    [msg],
  );

  return res?.tx_response;
};
