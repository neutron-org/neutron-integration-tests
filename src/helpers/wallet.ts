import { AccountData, OfflineSigner } from '@cosmjs/proto-signing';
import { Eip191Signer } from './eip191_cosmwasm_client';

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
