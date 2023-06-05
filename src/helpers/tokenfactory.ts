/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { cosmosclient } from '@cosmos-client/core';
import { cosmos, osmosis } from '../generated/proto';
import ICoin = cosmos.base.v1beta1.ICoin;
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
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

export const msgMintDenom = async (
  cmNeutron: WalletWrapper,
  creator: string,
  amount: ICoin,
): Promise<InlineResponse20075TxResponse> => {
  const msgCreateDenom = new osmosis.tokenfactory.v1beta1.MsgMint({
    sender: creator,
    amount,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
    },
    [msgCreateDenom],
    10,
  );

  return res.tx_response!;
};

export const msgCreateDenom = async (
  cmNeutron: WalletWrapper,
  creator: string,
  subdenom: string,
): Promise<InlineResponse20075TxResponse> => {
  const msgCreateDenom = new osmosis.tokenfactory.v1beta1.MsgCreateDenom({
    sender: creator,
    subdenom,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
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
): Promise<InlineResponse20075TxResponse> => {
  const msgBurn = new osmosis.tokenfactory.v1beta1.MsgBurn({
    sender: creator,
    amount: {
      denom: denom,
      amount: amountToBurn,
    },
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
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
): Promise<InlineResponse20075TxResponse> => {
  const msgChangeAdmin = new osmosis.tokenfactory.v1beta1.MsgChangeAdmin({
    sender: creator,
    denom,
    newAdmin,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
    },
    [msgChangeAdmin],
    10,
  );

  return res.tx_response!;
};
