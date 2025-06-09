import { AccountData } from '@cosmjs/proto-signing';
import { MetaMaskEmulator } from './metamask_emulator';
import { serializeSignDoc, StdSignDoc } from '@cosmjs/amino/build/signdoc';
import { Buffer } from 'buffer';
import { Eip191Signer } from '@neutron-org/neutronjsplus/dist/eip191_signer';

/**
 * Implementation of Eip191Signer that uses MetaMaskEmulator (ether.js inside) for signing
 */
export class FakeMetaMaskEip191Signer implements Eip191Signer {
  constructor(private readonly metamaskEmulator: MetaMaskEmulator) {}

  // Get accounts from the MetaMask emulator.
  async getAccounts(): Promise<readonly AccountData[]> {
    // Use the new method to get both addresses and public keys
    return this.metamaskEmulator.getAccountsWithPubkeys();
  }

  // Sign a document using EIP-191 format.
  // This implementation uses the personal_sign method from MetaMask.
  async signEip191(
    signerAddress: string,
    signDoc: StdSignDoc,
  ): Promise<{ signature: { signature: Buffer }; signed: any }> {
    const messageToSign = serializeSignDoc(signDoc);

    // Sign the message using the MetaMask emulator
    const signature = await this.metamaskEmulator.personalSign(
      messageToSign,
      signerAddress,
    );
    const signatureHex = Buffer.from(signature.replace('0x', ''), 'hex');

    // Return the signature and the original document
    return {
      signature: {
        signature: signatureHex,
      },
      signed: signDoc,
    };
  }
}
