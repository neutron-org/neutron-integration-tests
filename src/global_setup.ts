import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { generateMnemonic } from 'bip39';
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
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
} from './helpers/constants';

import config from './config.json';
import { ethers } from 'ethers';
import { ACC_PATH, ethToNeutronBechAddress } from './helpers/metamask_emulator';
import { stringToPath } from '@cosmjs/crypto/build/slip10';

let teardownHappened = false;

const MNEMONICS_COUNT = 1000;

export default async function ({ provide }: GlobalSetupContext) {
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
  const richguyWallet = await DirectSecp256k1HdWallet.fromMnemonic(
    config.DEMO_MNEMONIC_1,
    { prefix: prefix },
  );
  const richguy = await SigningStargateClient.connectWithSigner(
    rpc,
    richguyWallet,
    { registry: new Registry(defaultRegistryTypes) },
  );

  const richguyAddress = (await richguyWallet.getAccounts())[0].address;
  // amount to be transferred to each new wallet
  const poorAmount = '10000000000';

  let outputs: Output[];
  const values: Promise<Output>[] = mnemonics.map((mnemonic) =>
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
  outputs = await Promise.all(values);

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
  const amount =
    prefix === NEUTRON_PREFIX
      ? +poorAmount * MNEMONICS_COUNT * 2
      : +poorAmount * MNEMONICS_COUNT;

  const inputs: Input[] = [
    {
      address: richguyAddress,
      coins: [{ denom: denom, amount: amount.toString() }],
    },
  ];
  const value: MsgMultiSend = {
    inputs,
    outputs,
  };
  const msg: any = {
    typeUrl: MsgMultiSend.typeUrl,
    value: value,
  };
  const fee = {
    gas: '50000000',
    amount: [{ denom: feeDenom, amount: '125000' }],
  };
  const result = await richguy.signAndBroadcast(richguyAddress, [msg], fee, '');
  const resultTx = await richguy.getTx(result.transactionHash);
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
