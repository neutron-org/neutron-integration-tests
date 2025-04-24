import {
  AccountData,
  DirectSecp256k1HdWallet,
  OfflineSigner,
} from '@cosmjs/proto-signing';
import { Eip191Signer } from '@neutron-org/neutronjsplus/dist/eip191';
import { COSMOS_PREFIX, NEUTRON_PREFIX } from './constants';

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

  public static async fromMnemonic(mnemonic: string): Promise<Wallet> {
    const directwallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: NEUTRON_PREFIX,
    });
    const account = (await directwallet.getAccounts())[0];
    const directwalletValoper = await DirectSecp256k1HdWallet.fromMnemonic(
      mnemonic,
      {
        prefix: NEUTRON_PREFIX + 'valoper',
      },
    );
    const accountValoper = (await directwalletValoper.getAccounts())[0];
    return new Wallet(directwallet, account, accountValoper);
  }
}

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

  public static async fromMnemonic(mnemonic: string): Promise<GaiaWallet> {
    const directwallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: COSMOS_PREFIX,
    });
    const account = (await directwallet.getAccounts())[0];
    const directwalletValoper = await DirectSecp256k1HdWallet.fromMnemonic(
      mnemonic,
      {
        prefix: COSMOS_PREFIX + 'valoper',
      },
    );
    const accountValoper = (await directwalletValoper.getAccounts())[0];
    return new GaiaWallet(directwallet, account, accountValoper);
  }
}
