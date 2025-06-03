import {
  AccountData,
  DirectSecp256k1HdWallet,
  OfflineSigner,
} from '@cosmjs/proto-signing';
import { Eip191Signer } from '@neutron-org/neutronjsplus/dist/eip191_signer';
import { COSMOS_PREFIX, NEUTRON_PREFIX } from './constants';
import { FakeMetaMaskEip191Signer } from './fake_eip191_signer';
import { MetaMaskEmulator } from './metamask_emulator';

// Wallet is a sample data class for holding simplified wallet data for testing purposes
export class Wallet {
  address: string;
  valAddress: string;

  constructor(
    public readonly signer: OfflineSigner | Eip191Signer,
    public readonly account: AccountData,
    public readonly signerKind: string,
    valAccount: AccountData,
  ) {
    this.address = this.account.address;
    this.valAddress = valAccount.address;
  }

  public static async fromMnemonic(
    mnemonic: string,
    signerKind = 'secp256k1',
  ): Promise<Wallet> {
    let signer: OfflineSigner | Eip191Signer;
    if (signerKind === 'eip191') {
      signer = new FakeMetaMaskEip191Signer(
        await MetaMaskEmulator.connect([mnemonic]),
      );
    } else if (signerKind === 'secp256k1') {
      signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: NEUTRON_PREFIX,
      });
    } else {
      throw new Error('unknown neutron signer kind: ' + signerKind);
    }

    const account = (await signer.getAccounts())[0];
    const directwalletValoper = await DirectSecp256k1HdWallet.fromMnemonic(
      mnemonic,
      {
        prefix: NEUTRON_PREFIX + 'valoper',
      },
    );
    const accountValoper = (await directwalletValoper.getAccounts())[0];
    return new Wallet(signer, account, signerKind, accountValoper);
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
