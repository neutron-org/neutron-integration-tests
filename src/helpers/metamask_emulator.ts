import { AccountData } from '@cosmjs/proto-signing';
import { ethers } from 'ethers';
import { bech32, BytesCoder, hex, utf8 } from '@scure/base';
import { pathToString } from '@cosmjs/crypto';
import * as secp256k1 from '@noble/secp256k1';
import { stringToPath } from '@cosmjs/crypto/build/slip10';
// eslint-disable-next-line camelcase
import { keccak_256 } from '@noble/hashes/sha3';

export const ACC_PATH = "m/44'/60'/0'/0/1";

export class MetaMaskEmulator {
  private wallets: Map<string, { wallet: ethers.Wallet; mnemonic: string }> =
    new Map();

  protected constructor(
    wallets: Map<string, { wallet: ethers.Wallet; mnemonic: string }>,
  ) {
    this.wallets = wallets;
  }

  public static async connect(mnemonics: string[]): Promise<MetaMaskEmulator> {
    const cosmosHdPath = stringToPath(ACC_PATH);

    const wallets: Map<string, { wallet: ethers.Wallet; mnemonic: string }> =
      new Map();

    for (const mnemonic of mnemonics) {
      const ethMnemonic = ethers.Mnemonic.fromPhrase(mnemonic);
      const hdNode = ethers.HDNodeWallet.fromMnemonic(
        ethMnemonic,
        pathToString(cosmosHdPath),
      );
      const wallet = new ethers.Wallet(hdNode.privateKey);
      const neutronAddress = ethToNeutronBechAddress(wallet.address);
      wallets.set(neutronAddress, { wallet, mnemonic });
    }
    return new MetaMaskEmulator(wallets);
  }

  /**
   * Simulates eth_requestAccounts: returns the list of wallet addresses.
   * Returns both addresses and public keys for all wallets
   */
  public async getAccountsWithPubkeys(): Promise<readonly AccountData[]> {
    const res: Promise<AccountData>[] = Array.from(this.wallets.entries()).map(
      async ([address, { wallet }]) => {
        // In ethers.js v6, we can use the signingKey property
        // The signingKey property contains the publicKey property

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

        // Sign sample message
        const message = utf8.decode(
          'Sign to allow retrieval of your public key',
        );
        const signature = await wallet.signMessage(message);
        const pubKeyBytes = recoverPubKeyFromEthSignature(
          message,
          ethhex.decode(signature),
        );
        return {
          address,
          pubkey: pubKeyBytes,
          algo: 'secp256k1',
        } as AccountData;
      },
    );

    return Promise.all(res);
  }

  /**
   * Simulates personal_sign: signs a message with the wallet of the given address.
   * @param message - The message to sign
   * @param address - The Ethereum address to sign with
   * @returns The signature
   */
  public async personalSign(
    message: Uint8Array,
    address: string,
  ): Promise<string> {
    const wallet = this.wallets.get(address.toLowerCase());
    if (!wallet) {
      throw new Error(`Wallet for address ${address} not found.`);
    }

    return wallet.wallet.signMessage(message);
  }
}

// Converts ethereum address to the neutron bech32 address.
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

export function recoverPubKeyFromEthSignature(
  message: Uint8Array,
  signature: Uint8Array,
): Uint8Array {
  if (signature.length !== 65) {
    throw new Error('Invalid signature');
  }
  const r = signature.slice(0, 32);
  const s = signature.slice(32, 64);
  const v = signature[64];
  // Adapted from https://github.com/ethers-io/ethers.js/blob/6017d3d39a4d428793bddae33d82fd814cacd878/src.ts/crypto/signature.ts#L255-L265
  const yParity = v <= 1 ? v : (v + 1) % 2;
  const secpSignature = secp256k1.Signature.fromCompact(
    Uint8Array.from([...r, ...s]),
  ).addRecoveryBit(yParity);
  const digest = hashEthArbitraryMessage(message);
  return secpSignature.recoverPublicKey(digest).toRawBytes(true);
}

/**
 * Hashes and returns the digest of the given EIP191 `message` bytes.
 */
export function hashEthArbitraryMessage(message: Uint8Array): Uint8Array {
  return keccak_256(
    Uint8Array.from([
      ...utf8.decode('\x19Ethereum Signed Message:\n'),
      ...utf8.decode(message.length.toString()),
      ...message,
    ]),
  );
}
