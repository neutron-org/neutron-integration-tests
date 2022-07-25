import { exec } from 'child_process';
import { cosmosclient } from '@cosmos-client/core';
import { Wallet } from '../types';
import { mnemonicToWallet } from '../helpers/cosmos';
import { setup, teardown } from '../helpers/env';

const config = require('../config.json');

const CHAIN_ID = process.env.CHAIN_ID || 'test-1';

export const disconnectValidator = async (name: string) => {
  const { stdout } = await exec(`docker stop ${name}`);
  return stdout;
};

export class TestStateLocalCosmosTestNet {
  sdk_1: cosmosclient.CosmosSDK;
  sdk_2: cosmosclient.CosmosSDK;
  wallets: Record<string, Wallet>;
  init = async () => {
    const prefix = process.env.ADDRESS_PREFIX || 'neutron';
    cosmosclient.config.setBech32Prefix({
      accAddr: prefix,
      accPub: `${prefix}pub`,
      valAddr: `${prefix}valoper`,
      valPub: `${prefix}valoperpub`,
      consAddr: `${prefix}valcons`,
      consPub: `${prefix}valconspub`,
    });

    const host1 = process.env.NODE1_URL || 'http://localhost:1316';
    const host2 = process.env.NODE2_URL || 'http://localhost:1317';

    this.sdk_1 = new cosmosclient.CosmosSDK(host1, CHAIN_ID);
    this.sdk_2 = new cosmosclient.CosmosSDK(host2, CHAIN_ID);

    await setup(host1);

    this.wallets = {
      val1: await mnemonicToWallet(this.sdk_1, config.VAL_MNEMONIC_1),
      val2: await mnemonicToWallet(this.sdk_2, config.VAL_MNEMONIC_2),
      demo1: await mnemonicToWallet(this.sdk_1, config.DEMO_MNEMONIC_1),
      demo2: await mnemonicToWallet(this.sdk_2, config.DEMO_MNEMONIC_2),
      rly1: await mnemonicToWallet(this.sdk_1, config.RLY_MNEMONIC_1),
      rly2: await mnemonicToWallet(this.sdk_2, config.RLY_MNEMONIC_2),
    };
  };

  finish() {
    teardown();
  }
}
