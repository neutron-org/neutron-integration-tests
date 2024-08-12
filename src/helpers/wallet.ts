import { AccountData, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

// Wallet is a sample data class for holding simplified wallet data for testing purposes
export class Wallet {
  addrPrefix: string;
  directwallet: DirectSecp256k1HdWallet;
  account: AccountData;
  address: string;
  valAddress: string;
  constructor(
    addrPrefix: string,
    directwallet: DirectSecp256k1HdWallet,
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
