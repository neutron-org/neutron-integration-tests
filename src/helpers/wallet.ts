import { AccountData, OfflineSigner } from '@cosmjs/proto-signing';
import { Eip191Signer } from './eip191_cosmwasm_client';

// Wallet is a sample data class for holding simplified wallet data for testing purposes
export class Wallet {
  addrPrefix: string;
  directwallet: OfflineSigner | Eip191Signer;
  account: AccountData;
  address: string;
  valAddress: string;
  constructor(
    addrPrefix: string,
    directwallet: OfflineSigner | Eip191Signer,
    account: AccountData,
    valAccount: AccountData,
  ) {
    this.addrPrefix = addrPrefix;
    this.directwallet = directwallet;
    this.account = account;
    this.address = this.account.address;
    this.valAddress = valAccount.address;
  }
}
