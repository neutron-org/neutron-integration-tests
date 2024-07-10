import { walletWrapper } from '@neutron-org/neutronjsplus';
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
import { IndexedTx } from '@cosmjs/cosmwasm-stargate';

export const executeMsgDelegate = async (
  wallet: walletWrapper.WalletWrapper,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
): Promise<IndexedTx> => {
  const msgDelegate: MsgDelegate = {
    delegatorAddress,
    validatorAddress,
    amount: { denom: wallet.chain.denom, amount: amount },
  };
  const msg = { typeUrl: MsgDelegate.typeUrl, value: msgDelegate };
  const res = await wallet.execTx(
    {
      gas: '500000',
      amount: [{ denom: wallet.chain.denom, amount: '5000' }],
    },
    [msg],
  );
  return res;
};

export const executeMsgUndelegate = async (
  wallet: walletWrapper.WalletWrapper,
  delegatorAddress: string,
  validatorAddress: string,
  amount: string,
): Promise<IndexedTx> => {
  const msgUndelegate: MsgUndelegate = {
    delegatorAddress,
    validatorAddress,
    amount: { denom: wallet.chain.denom, amount: amount },
  };
  const msg = { typeUrl: MsgUndelegate.typeUrl, value: msgUndelegate };
  const res = await wallet.execTx(
    {
      gas: '500000',
      amount: [{ denom: wallet.chain.denom, amount: '5000' }],
    },
    [msg],
  );

  return res;
};

export const executeMsgSubmitProposal = async (
  wallet: walletWrapper.WalletWrapper,
  proposer: string,
  amount = '0',
): Promise<IndexedTx> => {
  wallet.registry.register(TextProposal.typeUrl, TextProposal as any);
  const textProposal: TextProposal = {
    title: 'mock',
    description: 'mock',
  };
  const value = wallet.registry.encode({
    typeUrl: TextProposal.typeUrl,
    value: textProposal,
  });
  const msgSubmitProposal: MsgSubmitProposal = {
    proposer,
    content: {
      typeUrl: '/cosmos.gov.v1beta1.TextProposal',
      value: value,
    },
    initialDeposit: [{ denom: wallet.chain.denom, amount: '10000000' }],
  };
  const msg = { typeUrl: MsgSubmitProposal.typeUrl, value: msgSubmitProposal };
  const res = await wallet.execTx(
    {
      gas: '500000',
      amount: [{ denom: wallet.chain.denom, amount: amount }],
    },
    [msg],
  );

  return res;
};

export const executeMsgVote = async (
  wallet: walletWrapper.WalletWrapper,
  voter: string,
  proposalId: number,
  amount = '0',
): Promise<IndexedTx> => {
  const msgVote: MsgVote = {
    voter,
    proposalId: BigInt(proposalId),
    option: VoteOption.VOTE_OPTION_YES,
  };
  const msg = { typeUrl: MsgVote.typeUrl, value: msgVote };

  const res = await wallet.execTx(
    {
      gas: '500000',
      amount: [{ denom: wallet.chain.denom, amount: amount }],
    },
    [msg],
  );

  return res;
};
