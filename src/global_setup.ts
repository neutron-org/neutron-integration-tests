import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { generateMnemonic } from 'bip39';
import { setup } from './helpers/setup';
import { pathToString, stringToPath } from '@cosmjs/crypto';
import { MsgMultiSend } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/tx';
import { GlobalSetupContext } from 'vitest/node';
import { Input, Output } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/bank';
import { execSync } from 'child_process';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import {
  COSMOS_DENOM,
  COSMOS_PREFIX,
  GAIA_RPC,
  NEUTRON_DENOM,
  NEUTRON_PREFIX,
  NEUTRON_RPC,
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
} from './helpers/constants';

import config from './config.json';
import { ethers } from 'ethers';
import { ACC_PATH, ethToNeutronBechAddress } from './helpers/metamask_emulator';

let teardownHappened = false;

const PREFUNDED_WALLETS_COUNT = 1000;

export default async function ({ provide }: GlobalSetupContext) {
  const host1 = process.env.NODE1_URL || 'http://localhost:1317';
  const host2 = process.env.NODE2_URL || 'http://localhost:1316';
  if (!process.env.NO_DOCKER) {
    await setup(host1, host2);
  }

  // generate lots of mnemonics for test wallets
  const mnemonics: string[] = [];
  for (let i = 0; i < PREFUNDED_WALLETS_COUNT; i++) {
    mnemonics.push(generateMnemonic());
  }

  const denomsToFund = [NEUTRON_DENOM, IBC_ATOM_DENOM, IBC_USDC_DENOM];
  for (let i = 0; i < denomsToFund.length; i++) {
    await fundWallets(
      mnemonics,
      NEUTRON_RPC,
      NEUTRON_PREFIX,
      NEUTRON_DENOM,
      denomsToFund[i],
    );
  }

  await fundWallets(
    mnemonics,
    GAIA_RPC,
    COSMOS_PREFIX,
    COSMOS_DENOM,
    COSMOS_DENOM,
  );

  // make mnemonics fetchable in test
  provide('mnemonics', mnemonics);

  return async () => {
    if (teardownHappened) {
      throw new Error('teardown called twice');
    }
    if (!process.env.NO_DOCKER) {
      execSync(`cd setup && make stop-cosmopark`);
      // this is a hack to make sure everything (volumes, etc.) was deleted after the previous test run (very important in case of run-in-band tests)
      execSync(`cd setup && make stop-cosmopark`);
    }
    teardownHappened = true;
  };
}

// Funds lots of new wallets from one wallet.
async function fundWallets(
  mnemonics: string[],
  rpc: string,
  prefix: string,
  feeDenom: string,
  denom: string,
): Promise<void> {
  const richguyWallet = await DirectSecp256k1HdWallet.fromMnemonic(
    config.DEMO_MNEMONIC_1,
    { prefix: prefix },
  );

  const richguyAddress = (await richguyWallet.getAccounts())[0].address;
  // amount to be transferred to each new wallet
  const poorAmount = '10000000000';

  let outputs: Output[] = [];

  // Process mnemonics sequentially with small delays to avoid overwhelming the system
  const LOG_INTERVAL = 100;
  const maxRetries = 3; // Used for all retry logic in this function

  for (let i = 0; i < mnemonics.length; i++) {
    const mnemonic = mnemonics[i];
    const directwallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: prefix,
    });

    // Get accounts with retry logic
    let accounts = null;
    let retries = 0;
    while (retries < maxRetries && !accounts) {
      try {
        accounts = await directwallet.getAccounts();
      } catch (error) {
        retries++;
        console.log(
          `getAccounts attempt ${retries}/${maxRetries} for wallet ${i} failed, retrying...`,
        );
        if (retries < maxRetries) {
          await waitSeconds(1);
        } else {
          throw error;
        }
      }
    }

    if (!accounts) {
      throw new Error(`Failed to get accounts for wallet ${i} after retries`);
    }

    const account = accounts[0];
    const output: Output = {
      address: account.address,
      coins: [{ denom: denom, amount: poorAmount }],
    };
    outputs.push(output);

    // Log progress and add small delay every 100 wallets to let system breathe
    if ((i + 1) % LOG_INTERVAL === 0) {
      // Small delay to prevent connection pool exhaustion
      await waitSeconds(0.5);
    }
  }

  if (prefix === NEUTRON_PREFIX) {
    // fund both addresses derived from ethereum and cosmos-sdk for a given mnemonic.
    // this will allow us to use either one in any test.
    const cosmosHdPath = stringToPath(ACC_PATH);
    const ethDerivedOutputs = mnemonics.map((mnemonic) => {
      const hdNode = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        pathToString(cosmosHdPath),
      );
      const wallet = new ethers.Wallet(hdNode.privateKey);
      const neutronAddress = ethToNeutronBechAddress(wallet.address);
      return {
        address: neutronAddress,
        coins: [{ denom: denom, amount: poorAmount }],
      };
    });
    outputs = outputs.concat(ethDerivedOutputs);
  }

  // Send single MsgMultiSend transaction with all outputs
  // Add retry logic to handle connection closure issues
  let richguy: SigningStargateClient | null = null;
  let connectRetries = 0;

  while (connectRetries < maxRetries && !richguy) {
    try {
      richguy = await SigningStargateClient.connectWithSigner(
        rpc,
        richguyWallet,
        { registry: new Registry(defaultRegistryTypes) },
      );
    } catch (error) {
      connectRetries++;
      console.log(
        `Connection attempt ${connectRetries}/${maxRetries} failed, retrying...`,
      );
      if (connectRetries < maxRetries) {
        await waitSeconds(2);
      } else {
        throw error;
      }
    }
  }

  if (!richguy) {
    throw new Error('Failed to connect to RPC after retries');
  }

  const totalAmount = +poorAmount * outputs.length;

  const inputs: Input[] = [
    {
      address: richguyAddress,
      coins: [{ denom: denom, amount: totalAmount.toString() }],
    },
  ];
  const value: MsgMultiSend = {
    inputs,
    outputs: outputs,
  };
  const msg: any = {
    typeUrl: MsgMultiSend.typeUrl,
    value: value,
  };
  const fee = {
    gas: '60000000',
    amount: [{ denom: feeDenom, amount: '150000' }],
  };

  // Add retry logic for signAndBroadcast
  let result;
  let broadcastRetries = 0;
  while (broadcastRetries < maxRetries) {
    try {
      result = await richguy.signAndBroadcast(richguyAddress, [msg], fee, '');
      break; // Success, exit retry loop
    } catch (error) {
      broadcastRetries++;
      console.log(
        `Broadcast attempt ${broadcastRetries}/${maxRetries} failed, retrying...`,
      );
      if (broadcastRetries < maxRetries) {
        await waitSeconds(2);
      } else {
        throw error;
      }
    }
  }

  const resultTx = await richguy.getTx(result.transactionHash);
  if (resultTx == null) {
    throw new Error('could not get MsgMultiSend tx from richguy');
  }
  if (resultTx.code !== 0) {
    throw (
      'could not setup test wallets; rawLog = ' +
      JSON.stringify(resultTx.rawLog)
    );
  }

  // Disconnect client
  richguy.disconnect();
}

// You can also extend `ProvidedContext` type
// to have type safe access to `provide/inject` methods:
declare module 'vitest' {
  export interface ProvidedContext {
    mnemonics: string[];
  }
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
