/* eslint-disable @typescript-eslint/no-non-null-assertion */
import cosmosclient from '@cosmos-client/core';
import { cosmos, osmosis } from '../generated/proto';
import ICoin = cosmos.base.v1beta1.ICoin;
import { BroadcastTx200ResponseTxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { WalletWrapper } from '../helpers/cosmos';
import Long from 'long';

cosmosclient.codec.register(
  '/osmosis.tokenfactory.v1beta1.MsgCreateDenom',
  osmosis.tokenfactory.v1beta1.MsgCreateDenom,
);
cosmosclient.codec.register(
  '/osmosis.tokenfactory.v1beta1.MsgMint',
  osmosis.tokenfactory.v1beta1.MsgMint,
);
cosmosclient.codec.register(
  '/osmosis.tokenfactory.v1beta1.MsgBurn',
  osmosis.tokenfactory.v1beta1.MsgBurn,
);
cosmosclient.codec.register(
  '/osmosis.tokenfactory.v1beta1.MsgChangeAdmin',
  osmosis.tokenfactory.v1beta1.MsgChangeAdmin,
);
cosmosclient.codec.register(
  '/osmosis.tokenfactory.v1beta1.MsgSetBeforeSendHook',
  osmosis.tokenfactory.v1beta1.MsgSetBeforeSendHook,
);

export const msgMintDenom = async (
  cmNeutron: WalletWrapper,
  creator: string,
  amount: ICoin,
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgMint = new osmosis.tokenfactory.v1beta1.MsgMint({
    sender: creator,
    amount,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
    },
    [msgMint],
    10,
  );

  return res.tx_response!;
};

export const msgCreateDenom = async (
  cmNeutron: WalletWrapper,
  creator: string,
  subdenom: string,
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgCreateDenom = new osmosis.tokenfactory.v1beta1.MsgCreateDenom({
    sender: creator,
    subdenom,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('2000000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '5000' }],
    },
    [msgCreateDenom],
    10,
  );

  return res.tx_response!;
};

export const msgBurn = async (
  cmNeutron: WalletWrapper,
  creator: string,
  denom: string,
  amountToBurn: string,
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgBurn = new osmosis.tokenfactory.v1beta1.MsgBurn({
    sender: creator,
    amount: {
      denom: denom,
      amount: amountToBurn,
    },
    burnFromAddress: creator,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '5000' }],
    },
    [msgBurn],
    10,
  );

  return res.tx_response!;
};

// Create MsgChangeAdmin message
export const msgChangeAdmin = async (
  cmNeutron: WalletWrapper,
  creator: string,
  denom: string,
  newAdmin: string,
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgChangeAdmin = new osmosis.tokenfactory.v1beta1.MsgChangeAdmin({
    sender: creator,
    denom,
    new_admin: newAdmin,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '5000' }],
    },
    [msgChangeAdmin],
    10,
  );

  return res.tx_response!;
};

export const msgSetBeforeSendHook = async (
  cmNeutron: WalletWrapper,
  creator: string,
  denom: string,
  contractAddr: string,
): Promise<BroadcastTx200ResponseTxResponse> => {
  const msgMint = new osmosis.tokenfactory.v1beta1.MsgSetBeforeSendHook({
    sender: creator,
    denom,
    contract_addr: contractAddr,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
    },
    [msgMint],
    10,
  );

  return res.tx_response!;
};
