import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { generateMnemonic } from 'bip39';
import { setup } from './helpers/setup';
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

let teardownHappened = false;

const WALLET_COUNT = 1000;

export default async function ({ provide }: GlobalSetupContext) {
  const host1 = process.env.NODE1_URL || 'http://localhost:1317';
  const host2 = process.env.NODE2_URL || 'http://localhost:1316';
  if (!process.env.NO_DOCKER) {
    await setup(host1, host2);
  }

  const mnemonics: string[] = [];
  for (let i = 0; i < WALLET_COUNT; i++) {
    mnemonics.push(generateMnemonic());
  }

  // fund a lot or preallocated wallets for testing purposes
  await fundWallets(mnemonics, NEUTRON_RPC, NEUTRON_PREFIX, NEUTRON_DENOM);
  // await fundWallets(mnemonics, GAIA_RPC, COSMOS_PREFIX, COSMOS_DENOM);

  provide('mnemonics', mnemonics);

  return async () => {
    if (teardownHappened) {
      throw new Error('teardown called twice');
    }
    if (!process.env.NO_DOCKER) {
      ch.execSync(`cd setup && make stop-cosmopark`);
    }
    teardownHappened = true;
  };
}

// Funds a lots of new wallets from one wallet.
async function fundWallets(
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
  const pooramount = '10000000000';
  const values: Promise<Output>[] = mnemonics.map((mnemonic) =>
    DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: prefix,
    })
      .then((directwallet) => directwallet.getAccounts())
      .then((accounts) => accounts[0])
      .then((account) => ({
        address: account.address,
        coins: [{ denom: denom, amount: pooramount }],
      })),
  );
  const outputs: Output[] = await Promise.all(values);
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
