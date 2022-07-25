import { cosmosclient, proto } from '@cosmos-client/core';

export type Wallet = {
  address: cosmosclient.AccAddress;
  account: proto.cosmos.auth.v1beta1.BaseAccount;
  pubKey: cosmosclient.PubKey;
  privKey: cosmosclient.PrivKey;
};

export type CodeId = string;
