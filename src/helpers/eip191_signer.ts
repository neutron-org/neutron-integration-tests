import { MetaMaskEmulator } from './metamask_emulator';
import { Eip191Signer } from './eip191_cosmwasm_client';
import { toBase64 } from '@cosmjs/encoding';

/**
 * Implementation of Eip191Signer that uses MetaMaskEmulator for signing
 */
export class MetaMaskEip191Signer implements Eip191Signer {
  constructor(private readonly metamaskEmulator: MetaMaskEmulator) {}

  /**
   * Get accounts from the MetaMask emulator
   */
  async getAccounts(): Promise<Array<{ address: string; pubkey: Uint8Array }>> {
    // Use the new method to get both addresses and public keys
    return this.metamaskEmulator.getAccountsWithPubkeys();
  }

  /**
   * Sign a document using EIP-191 format
   * This implementation uses the personal_sign method from MetaMask
   */
  async signEip191(
    signerAddress: string,
    signDoc: any,
  ): Promise<{ signature: { signature: string }; signed: any }> {
    // Convert the signDoc to a string that can be signed
    // In a real implementation, you would need to properly format the document according to EIP-191
    const messageToSign = JSON.stringify(signDoc);

    // Sign the message using the MetaMask emulator
    const signature = await this.metamaskEmulator.personal_sign(
      messageToSign,
      signerAddress,
    );

    // Return the signature and the original document
    return {
      signature: {
        signature: toBase64(new TextEncoder().encode(signature)),
      },
      signed: signDoc,
    };
  }
}
