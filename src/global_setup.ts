import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { generateMnemonic } from 'bip39';
import { setup } from './helpers/setup';
import { pathToString, stringToPath } from '@cosmjs/crypto';
import { MsgMultiSend } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/tx';
import { GlobalSetupContext } from 'vitest/node';
import { Input, Output } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/bank';
import ch from 'child_process';
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

const MNEMONICS_COUNT = 1000;

export default async function ({ provide }: GlobalSetupContext) {
  console.log('global setup started');
  const host1 = process.env.NODE1_URL || 'http://localhost:1317';
  const host2 = process.env.NODE2_URL || 'http://localhost:1316';
  if (!process.env.NO_DOCKER) {
    await setup(host1, host2);
  }

  // generate lots of mnemonics for test wallets
  const mnemonics: string[] = [];
  for (let i = 0; i < MNEMONICS_COUNT; i++) {
    mnemonics.push(generateMnemonic());
  }

  console.log('fund wallets');
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
  console.log('fund wallets: gaia');

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
    console.log('on teardown');
    if (teardownHappened) {
      throw new Error('teardown called twice');
    }
    if (!process.env.NO_DOCKER) {
      ch.execSync(`cd setup && make stop-cosmopark`);
      // this is a hack to make sure everything (volumes, etc.) was deleted after the previous test run (very important in case of run-in-band tests)
      ch.execSync(`cd setup && make stop-cosmopark`);
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
  console.log('fund wallets: denom=' + denom);
  const richguyWallet = await DirectSecp256k1HdWallet.fromMnemonic(
    config.DEMO_MNEMONIC_1,
    { prefix: prefix },
  );

  console.log('before richguyWallet.get accounts');
  const richguyAddress = (await richguyWallet.getAccounts())[0].address;
  console.log('after richguyWallet.get accounts');
  // amount to be transferred to each new wallet
  const poorAmount = '10000000000';

  let outputs: Output[] = [];
  const BATCH_SIZE = 1000;

  console.log('before outputs');
  // Process mnemonics in batches to avoid overwhelming the system
  for (let i = 0; i < mnemonics.length; i += BATCH_SIZE) {
    const batch = mnemonics.slice(i, i + BATCH_SIZE);
    const values: Promise<Output>[] = batch.map((mnemonic) =>
      DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: prefix,
      })
        .then((directwallet) => directwallet.getAccounts())
        .then((accounts) => accounts[0])
        .then((account) => ({
          address: account.address,
          coins: [{ denom: denom, amount: poorAmount }],
        })),
    );
    const batchOutputs = await Promise.all(values);
    outputs.push(...batchOutputs);
    console.log(
      `Processed batch ${i / BATCH_SIZE + 1}/${Math.ceil(
        mnemonics.length / BATCH_SIZE,
      )}`,
    );
  }
  console.log('after outputs');

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

  // Split outputs into batches and send multiple MsgMultiSend transactions
  const MULTISEND_BATCH_SIZE = 1000;
  const totalBatches = Math.ceil(outputs.length / MULTISEND_BATCH_SIZE);

  for (
    let batchIdx = 0;
    batchIdx < outputs.length;
    batchIdx += MULTISEND_BATCH_SIZE
  ) {
    // Recreate client for each batch to avoid connection reuse issues
    const richguy = await SigningStargateClient.connectWithSigner(
      rpc,
      richguyWallet,
      { registry: new Registry(defaultRegistryTypes) },
    );

    const batchOutputs = outputs.slice(
      batchIdx,
      batchIdx + MULTISEND_BATCH_SIZE,
    );
    const batchAmount = +poorAmount * batchOutputs.length;

    const inputs: Input[] = [
      {
        address: richguyAddress,
        coins: [{ denom: denom, amount: batchAmount.toString() }],
      },
    ];
    const value: MsgMultiSend = {
      inputs,
      outputs: batchOutputs,
    };
    const msg: any = {
      typeUrl: MsgMultiSend.typeUrl,
      value: value,
    };
    const fee = {
      gas: '60000000',
      amount: [{ denom: feeDenom, amount: '150000' }],
    };

    console.log(
      `Sending MsgMultiSend batch ${
        batchIdx / MULTISEND_BATCH_SIZE + 1
      }/${totalBatches}`,
    );
    const result = await richguy.signAndBroadcast(
      richguyAddress,
      [msg],
      fee,
      '',
    );
    console.log(
      `Broadcast complete for batch ${batchIdx / MULTISEND_BATCH_SIZE + 1}`,
    );

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

    // Disconnect client and wait before next batch to avoid connection issues
    richguy.disconnect();

    // Wait 3 seconds between batches to let the RPC server recover
    if (batchIdx + MULTISEND_BATCH_SIZE < outputs.length) {
      await waitSeconds(3);
    }
  }
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
