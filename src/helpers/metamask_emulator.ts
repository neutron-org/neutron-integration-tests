import { AccountData, makeCosmoshubPath } from '@cosmjs/proto-signing';
import { ethers } from 'ethers';
import { bech32, BytesCoder, hex } from '@scure/base';
import { pathToString } from '@cosmjs/crypto';
export class MetaMaskEmulator {
  private wallets: Map<string, { wallet: ethers.Wallet; mnemonic: string }> =
    new Map();

  protected constructor(
    wallets: Map<string, { wallet: ethers.Wallet; mnemonic: string }>,
  ) {
    this.wallets = wallets;
  }

  public static async connect(mnemonics: string[]): Promise<MetaMaskEmulator> {
    const cosmosHdPath = makeCosmoshubPath(0);

    const wallets: Map<string, { wallet: ethers.Wallet; mnemonic: string }> =
      new Map();

    for (const mnemonic of mnemonics) {
      const ethMnemonic = ethers.Mnemonic.fromPhrase(mnemonic);
      // const seed = mnemonicS.computeSeed();
      // console.log('ethers seed: ' + seed);
      const hdNode = ethers.HDNodeWallet.fromMnemonic(
        ethMnemonic,
        pathToString(cosmosHdPath),
      );
      // const hdNodeCosmos = hdNode.derivePath(pathToString(cosmosHdPath));
      const wallet = new ethers.Wallet(hdNode.privateKey);
      const neutronAddress = ethToNeutronBechAddress(wallet.address);
      // console.log(
      //   'set wallet: ' + neutronAddress + ' for mnemonic: ' + mnemonic + '\n',
      // );
      wallets.set(neutronAddress, { wallet, mnemonic });
    }
    return new MetaMaskEmulator(wallets);
  }

  /**
   * Simulates eth_requestAccounts: returns the list of wallet addresses.
   * Returns both addresses and public keys for all wallets
   */
  public async getAccountsWithPubkeys(): Promise<readonly AccountData[]> {
    return Array.from(this.wallets.entries()).map(([address, { wallet }]) => {
      // In ethers.js v6, we can use the signingKey property
      // The signingKey property contains the publicKey property

      console.log('wallet: ', JSON.stringify(wallet));
      const pubkeyHex = wallet.signingKey.publicKey;

      // Remove the '0x' prefix if present
      const cleanHex = pubkeyHex.startsWith('0x')
        ? pubkeyHex.slice(2)
        : pubkeyHex;

      // Convert hex to Uint8Array
      const pubkeyBytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        pubkeyBytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
      }

      return {
        address,
        pubkey: pubkeyBytes,
        algo: 'secp256k1',
      };
    });
  }

  /**
   * Simulates personal_sign: signs a message with the wallet of the given address.
   * @param message - The message to sign
   * @param address - The Ethereum address to sign with
   * @returns The signature
   */
  public async personal_sign(
    message: Uint8Array,
    address: string,
  ): Promise<string> {
    const wallet = this.wallets.get(address.toLowerCase());
    if (!wallet) {
      throw new Error(`Wallet for address ${address} not found.`);
    }

    // const messageBytes = ethers.toUtf8Bytes(message);

    // Create the Ethereum signed message prefix according to EIP-191
    const prefix = '\x19Ethereum Signed Message:\n' + message.length;
    const prefixBytes = ethers.toUtf8Bytes(prefix);

    // Combine prefix and message bytes
    const messageToSign = new Uint8Array(prefixBytes.length + message.length);
    messageToSign.set(prefixBytes, 0);
    messageToSign.set(message, prefixBytes.length);

    return wallet.wallet.signMessage(messageToSign);
  }
}

// TODO: move to some meaningful place
export function ethToNeutronBechAddress(ethAddress: string) {
  const bytes = ethhex.decode(ethAddress);
  const prefix = 'neutron';
  return bech32.encode(prefix, bech32.toWords(bytes));
}

/**
 * Convenience wrapper around `hex` that deals with hex strings typically
 * seen in Ethereum, where strings start with `0x` and are lower case.
 *
 * - For `encode`, the resulting string will be lower case
 * - For `decode`, the `str` arg can either be lower or upper case
 */
export const ethhex = {
  encode: (bytes: Uint8Array) => '0x' + hex.encode(bytes),
  decode: (str: string) => hex.decode(str.replace(/^0x/, '').toLowerCase()),
} satisfies BytesCoder;
