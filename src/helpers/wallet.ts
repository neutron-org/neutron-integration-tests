import { AccountData, OfflineSigner } from '@cosmjs/proto-signing';
import { Eip191Signer } from '@neutron-org/neutronjsplus/dist/eip191';

// Wallet is a sample data class for holding simplified wallet data for testing purposes
export class Wallet {
  address: string;
  valAddress: string;

  constructor(
    public readonly signer: OfflineSigner | Eip191Signer,
    public readonly account: AccountData,
    valAccount: AccountData,
  ) {
    this.address = this.account.address;
    this.valAddress = valAccount.address;
  }
}

// TODO: try to make valAddress into just using another Wallet with another AccountData (with 'valoper' prefix)

// GaiaWallet is a sample data class for holding simplified gaia wallet data for testing purposes
export class GaiaWallet {
  address: string;
  valAddress: string;

  constructor(
    public readonly signer: OfflineSigner,
    public readonly account: AccountData,
    valAccount: AccountData,
  ) {
    this.address = this.account.address;
    this.valAddress = valAccount.address;
  }
}
