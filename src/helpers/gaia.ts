import { BroadcastTx200ResponseTxResponse } from '@cosmos-client/core/cjs/openapi/api';
import {
  MsgDelegate,
  MsgUndelegate,
} from '@neutron-org/neutronjsplus/dist/proto/cosmos_sdk/cosmos/staking/v1beta1/tx_pb';
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
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: wallet.chain.denom, amount: '1000' }],
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
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: wallet.chain.denom, amount: '1000' }],
    },
    [packAnyMsg('/cosmos.staking.v1beta1.MsgUndelegate', msgUndelegate)],
  );
  return res?.tx_response;
};
