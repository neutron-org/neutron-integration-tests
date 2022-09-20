import { cosmosclient, proto } from '@cosmos-client/core';
import bech32 from 'bech32';

export class Wallet {
  address: cosmosclient.AccAddress | cosmosclient.ValAddress;
  account: proto.cosmos.auth.v1beta1.BaseAccount | null;
  pubKey: cosmosclient.PubKey;
  privKey: cosmosclient.PrivKey;
  addrPrefix: string;
  constructor(
    address: cosmosclient.AccAddress | cosmosclient.ValAddress,
    account: proto.cosmos.auth.v1beta1.BaseAccount | null,
    pubKey: cosmosclient.PubKey,
    privKey: cosmosclient.PrivKey,
    addrPrefix: string,
  ) {
    this.address = address;
    this.account = account;
    this.pubKey = pubKey;
    this.privKey = privKey;
    this.addrPrefix = addrPrefix;
    this.address.toString = () => {
      if (this.address instanceof cosmosclient.AccAddress) {
        const words = bech32.toWords(Buffer.from(this.address.value()));
        return bech32.encode(addrPrefix, words);
      } else if (this.address instanceof cosmosclient.ValAddress) {
        const words = bech32.toWords(Buffer.from(this.address.value()));
        return bech32.encode(addrPrefix + 'valoper', words);
      }
      throw new Error('unexpected addr type');
    };
  }
}

export type CodeId = string;
