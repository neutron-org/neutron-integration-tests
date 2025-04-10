import { AccountData } from '@cosmjs/proto-signing';
import { MetaMaskEmulator } from './metamask_emulator';
import { Eip191Signer } from './eip191_cosmwasm_client';
// import { toBase64 } from '@cosmjs/encoding';
// , escapeCharacters, sortedJsonStringify
import { serializeSignDoc, StdSignDoc } from '@cosmjs/amino/build/signdoc';
import { Buffer } from 'buffer';
import { AccountData } from '@cosmjs/amino';

// import { SDKProvider } from '@metamask/sdk';
// export class MetamaskEip191Signer implements Eip191Signer {
//   constructor(private readonly ext: SDKProvider) {
//   }
//
//   getAccounts(): Promise<readonly AccountData[]> {
//         throw new Error('Method not implemented.');
//     }
//     signEip191(signerAddress: string, signDoc: StdSignDoc): Promise<{ signature: { signature: Buffer; }; signed: any; }> {
//         throw new Error('Method not implemented.');
//     }
// }

/**
 * Implementation of Eip191Signer that uses MetaMaskEmulator for signing
 */
export class FakeMetaMaskEip191Signer implements Eip191Signer {
  constructor(private readonly metamaskEmulator: MetaMaskEmulator) {}

  /**
   * Get accounts from the MetaMask emulator
   */
  async getAccounts(): Promise<readonly AccountData[]> {
    // Use the new method to get both addresses and public keys
    return this.metamaskEmulator.getAccountsWithPubkeys();
  }

  /**
   * Sign a document using EIP-191 format
   * This implementation uses the personal_sign method from MetaMask
   */
  async signEip191(
    signerAddress: string,
    signDoc: StdSignDoc,
  ): Promise<{ signature: { signature: Buffer }; signed: any }> {
    const messageToSign = serializeSignDoc(signDoc);
    // const serialized = escapeCharacters(sortedJsonStringify(signDoc));
    // console.log('serialized: ', serialized);

    // Sign the message using the MetaMask emulator
    const signature = await this.metamaskEmulator.personalSign(
      messageToSign,
      signerAddress,
    );
    const signatureHex = Buffer.from(signature.replace('0x', ''), "hex");

    // Return the signature and the original document
    return {
      signature: {
        signature: signatureHex,
      },
      signed: signDoc,
    };
  }
}
