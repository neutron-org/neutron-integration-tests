import { ethers } from 'ethers';

export class MetaMaskEmulator {
  private wallets: Map<string, ethers.Wallet> = new Map();

  constructor(mnemonics: string[]) {
    for (const mnemonic of mnemonics) {
      const hdNode = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
      );
      const wallet = new ethers.Wallet(hdNode.privateKey);
      this.wallets.set(wallet.address.toLowerCase(), wallet);
    }
  }

  /**
   * Simulates eth_requestAccounts: returns the list of wallet addresses.
   * Returns both addresses and public keys for all wallets
   */
  public getAccountsWithPubkeys(): Array<{
    address: string;
    pubkey: Uint8Array;
  }> {
    return Array.from(this.wallets.entries()).map(([address, wallet]) => {
      // Get the public key as a hex string and convert it to Uint8Array
      const pubkeyHex = wallet.signingKey.publicKey;
      // Remove the '0x' prefix if present
      const cleanHex = pubkeyHex.startsWith('0x')
        ? pubkeyHex.slice(2)
        : pubkeyHex;
      // Convert hex to Uint8Array
      // TODO: what is this?
      const pubkeyBytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        pubkeyBytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
      }

      return {
        address,
        pubkey: pubkeyBytes,
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
    message: string,
    address: string,
  ): Promise<string> {
    const wallet = this.wallets.get(address.toLowerCase());
    if (!wallet) {
      throw new Error(`Wallet for address ${address} not found.`);
    }

    const messageBytes = ethers.toUtf8Bytes(message);
    return wallet.signMessage(messageBytes);
  }
}
