import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import {
  DirectSecp256k1HdWallet,
  Registry,
  // makeCosmoshubPath,
} from '@cosmjs/proto-signing';
// import { generateMnemonic } from 'bip39';
import { setup } from './helpers/setup';
import { pathToString } from '@cosmjs/crypto';
import { MsgMultiSend } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/tx';
import { GlobalSetupContext } from 'vitest/node';
import { Input, Output } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/bank';
import ch from 'child_process';
import {
  COSMOS_DENOM,
  COSMOS_PREFIX,
  GAIA_RPC,
  NEUTRON_DENOM,
  NEUTRON_PREFIX,
  NEUTRON_RPC,
} from './helpers/constants';

import config from './config.json';
import { ethers } from 'ethers';
import { ACC_PATH, ethToNeutronBechAddress } from './helpers/metamask_emulator';
import { stringToPath } from '@cosmjs/crypto/build/slip10';
// import { hexlify } from 'ethers';

let teardownHappened = false;

const WALLET_COUNT = 1;

export default async function ({ provide }: GlobalSetupContext) {
  const host1 = process.env.NODE1_URL || 'http://localhost:1317';
  const host2 = process.env.NODE2_URL || 'http://localhost:1316';
  if (!process.env.NO_DOCKER) {
    await setup(host1, host2);
  }

  const mnemonics: string[] = [
    'middle axis hero strike castle result online harvest venue manage language metal',
  ];
  // This is the mnemonic for metamask!
  // Metamask data:
  // ethereum address: 0xCeCd2802Adca78538527244d943610328A6746C0
  // OR:               0xcecd2802adca78538527244d943610328a6746c0
  // neutron address: neutron1emxjsq4defu98pf8y3xegdssx29xw3kq2xytt4
  // middle axis hero strike castle result online harvest venue manage language metal
  // for (let i = 0; i < WALLET_COUNT; i++) {
  //   mnemonics.push(generateMnemonic());
  // }

  // fund a lot or preallocated wallets for testing purposes
  await fundWallets(
    'neutron',
    mnemonics,
    NEUTRON_RPC,
    NEUTRON_PREFIX,
    NEUTRON_DENOM,
  );
  await fundWallets('gaia', mnemonics, GAIA_RPC, COSMOS_PREFIX, COSMOS_DENOM);

  provide('mnemonics', mnemonics);

  return async () => {
    if (teardownHappened) {
      throw new Error('teardown called twice');
    }
    if (!process.env.NO_DOCKER) {
      ch.execSync(`cd setup && make stop-cosmopark`);
      // this is a hack to make sure everything (volumes, etc.) was deleted after the previous test run (very important in case of run-in-band tests)
      ch.execSync(`cd setup && make stop-cosmopark`);
      ch.execSync(`cd setup && make clean`);
    }
    teardownHappened = true;
  };
}

// Funds a lots of new wallets from one wallet.
async function fundWallets(
  network: string,
  mnemonics: string[],
  rpc: string,
  prefix: string,
  denom: string,
): Promise<void> {
  const directwallet = await DirectSecp256k1HdWallet.fromMnemonic(
    config.DEMO_MNEMONIC_1,
    { prefix: prefix },
  );
  const client = await SigningStargateClient.connectWithSigner(
    rpc,
    directwallet,
    { registry: new Registry(defaultRegistryTypes) },
  );

  const richguy = (await directwallet.getAccounts())[0].address;
  // amount to be transferred to each new wallet
  const pooramount = '10000000000';

  let outputs: Output[] = [];
  if (network === 'neutron') {
    // const cosmosHdPath = makeCosmoshubPath(0);
    const cosmosHdPath = stringToPath(ACC_PATH);
    outputs = mnemonics.map((mnemonic) => {
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
      console.log(
        'neutron wallet address: ' +
          neutronAddress +
          ', precreated mnemonic: ' +
          mnemonic,
      );
      return {
        address: neutronAddress,
        coins: [{ denom: denom, amount: pooramount }],
      };
    });
  } else {
    const values: Promise<Output>[] = mnemonics.map((mnemonic) =>
      DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: prefix,
        // hdPaths: [makeCosmoshubPath(0)]
        hdPaths: [stringToPath(ACC_PATH)],
      })
        .then((directwallet) => directwallet.getAccounts())
        .then((accounts) => accounts[0])
        .then((account) => {
          console.log(
            'gaia wallet address: ' +
              account.address +
              ', precreated mnemonic: ' +
              mnemonic,
          );
          // const mnemonicChecked = new EnglishMnemonic(mnemonic);
          // Bip39.mnemonicToSeed(mnemonicChecked, '').then((m) => {
          //   const n = hexlify(m);
          //   console.log('cosmjs seed for mnemonic: ' + mnemonic + ': '+ n + '\n');
          // });
          return {
            address: account.address,
            coins: [{ denom: denom, amount: pooramount }],
          };
        }),
    );
    outputs = await Promise.all(values);
  }
  const inputs: Input[] = [
    {
      address: richguy,
      coins: [
        { denom: denom, amount: (+pooramount * WALLET_COUNT).toString() },
      ],
    },
  ];
  const value: MsgMultiSend = {
    inputs: inputs,
    outputs: outputs,
  };
  const msg: any = {
    typeUrl: MsgMultiSend.typeUrl,
    value: value,
  };
  const fee = {
    gas: '30000000',
    amount: [{ denom: denom, amount: '75000' }],
  };
  const result = await client.signAndBroadcast(richguy, [msg], fee, '');
  const resultTx = await client.getTx(result.transactionHash);
  if (resultTx.code !== 0) {
    throw (
      'could not setup test wallets; rawLog = ' +
      JSON.stringify(resultTx.rawLog)
    );
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
