import { exec } from 'child_process';
import { cosmosclient } from '@cosmos-client/core';
import { Wallet } from '../types';
import {
  COSMOS_DENOM,
  createAddress,
  mnemonicToWallet,
} from '../helpers/cosmos';
import { setup } from '../helpers/env';
import { BlockWaiter } from '../helpers/wait';
import { generateMnemonic } from 'bip39';
import { CosmosWrapper, NEUTRON_DENOM } from '../helpers/cosmos';
import Long from 'long';

const config = require('../config.json');

export const disconnectValidator = async (name: string) => {
  const { stdout } = await exec(`docker stop ${name}`);
  return stdout;
};

const walletSet = async (
  sdk: cosmosclient.CosmosSDK,
  prefix: string,
): Promise<Record<string, Wallet>> => ({
  val1: await mnemonicToWallet(
    cosmosclient.ValAddress,
    sdk,
    config.VAL_MNEMONIC_1,
    prefix,
  ),
  demo1: await mnemonicToWallet(
    cosmosclient.AccAddress,
    sdk,
    config.DEMO_MNEMONIC_1,
    prefix,
  ),
  demo2: await mnemonicToWallet(
    cosmosclient.AccAddress,
    sdk,
    config.DEMO_MNEMONIC_2,
    prefix,
  ),
  icq: await mnemonicToWallet(
    cosmosclient.AccAddress,
    sdk,
    config.DEMO_MNEMONIC_3,
    prefix,
  ),
  rly1: await mnemonicToWallet(
    cosmosclient.AccAddress,
    sdk,
    config.RLY_MNEMONIC_1,
    prefix,
  ),
  rly2: await mnemonicToWallet(
    cosmosclient.AccAddress,
    sdk,
    config.RLY_MNEMONIC_2,
    prefix,
  ),
});
const walletSetQa = async (
  sdk: cosmosclient.CosmosSDK,
  prefix: string,
  mnemonicQA: string,
): Promise<Record<string, Wallet>> => ({
  genQaWal1: await mnemonicToWallet(
    cosmosclient.AccAddress,
    sdk,
    mnemonicQA,
    prefix,
  ),
});

export class TestStateLocalCosmosTestNet {
  sdk1: cosmosclient.CosmosSDK;
  sdk2: cosmosclient.CosmosSDK;
  blockWaiter1: BlockWaiter;
  blockWaiter2: BlockWaiter;
  wallets: Record<string, Record<string, Wallet>>;
  icq_web_host: string;
  init = async () => {
    const neutronPrefix = process.env.NEUTRON_ADDRESS_PREFIX || 'neutron';
    const cosmosPrefix = process.env.COSMOS_ADDRESS_PREFIX || 'cosmos';

    const host1 = process.env.NODE1_URL || 'http://localhost:1317';
    const host2 = process.env.NODE2_URL || 'http://localhost:1316';

    this.sdk1 = new cosmosclient.CosmosSDK(host1, config.CHAIN_ID_1);
    this.sdk2 = new cosmosclient.CosmosSDK(host2, config.CHAIN_ID_2);

    this.icq_web_host = 'http://localhost:9999';

    this.blockWaiter1 = new BlockWaiter(
      process.env.NODE1_WS_URL || 'ws://localhost:26657',
    );
    this.blockWaiter2 = new BlockWaiter(
      process.env.NODE2_WS_URL || 'ws://localhost:16657',
    );

    await setup(host1, host2);
    const mnemonicQA = generateMnemonic();
    const mnemonicQATwo = generateMnemonic();

    this.wallets = {};
    this.wallets.neutron = await walletSet(this.sdk1, neutronPrefix);
    this.wallets.cosmos = await walletSet(this.sdk2, cosmosPrefix);

    await this.createQaWallet(mnemonicQA, neutronPrefix);
    await this.createQaWalletTwo(mnemonicQATwo, cosmosPrefix);

    this.wallets.qaOne = await walletSetQa(
      this.sdk1,
      neutronPrefix,
      mnemonicQA,
    );
    this.wallets.qaTwo = await walletSetQa(
      this.sdk2,
      cosmosPrefix,
      mnemonicQATwo,
    );
  };

  createQaWallet = async (mnemonic: string, prefix: string) => {
    const cm = new CosmosWrapper(
      this.sdk1,
      this.blockWaiter1,
      this.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );

    cosmosclient.config.setBech32Prefix({
      accAddr: prefix,
      accPub: `${prefix}pub`,
      valAddr: `${prefix}valoper`,
      valPub: `${prefix}valoperpub`,
      consAddr: `${prefix}valcons`,
      consPub: `${prefix}valconspub`,
    });
    const address = await createAddress(mnemonic);
    try {
      await cm.msgSend(address, '5500000000');
    } catch (e) {
      await cm.msgSend(
        address,
        '3000000000',
        {
          gas_limit: Long.fromString('200000'),
          amount: [{ denom: cm.denom, amount: '15000' }],
        },
        Number(this.wallets.neutron.demo1.account.sequence) + 1,
      );
    }
    const balances = await cm.queryBalances(address);
    if (balances == null) {
      throw new Error('Could not  put tokens on the generated wallet.');
    }
    console.log(balances);
  };
  createQaWalletTwo = async (mnemonicQATwo: string, cosmosPrefix: string) => {
    const tmpWalletTwo = await mnemonicToWallet(
      cosmosclient.AccAddress,
      this.sdk2,
      config.DEMO_MNEMONIC_2,
      cosmosPrefix,
    );
    const cm2 = new CosmosWrapper(
      this.sdk2,
      this.blockWaiter2,
      tmpWalletTwo,
      COSMOS_DENOM,
    );
    cosmosclient.config.setBech32Prefix({
      accAddr: cosmosPrefix,
      accPub: `${cosmosPrefix}pub`,
      valAddr: `${cosmosPrefix}valoper`,
      valPub: `${cosmosPrefix}valoperpub`,
      consAddr: `${cosmosPrefix}valcons`,
      consPub: `${cosmosPrefix}valconspub`,
    });
    const address = await createAddress(mnemonicQATwo);
    try {
      await cm2.msgSend(address, '5500000000');
    } catch (e) {
      await cm2.msgSend(
        address,
        '3000000000',
        {
          gas_limit: Long.fromString('200000'),
          amount: [{ denom: cm2.denom, amount: '15000' }],
        },
        Number(tmpWalletTwo.account.sequence) + 1,
      );
    }
    const balances = await cm2.queryBalances(address);
    if (balances == null) {
      throw new Error('Could not  put tokens on the generated wallet.');
    }
    console.log(balances);
  };
}
