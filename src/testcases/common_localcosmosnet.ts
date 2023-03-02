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
import { AccAddress } from '@cosmos-client/core/cjs/types';

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

    this.wallets = {};
    this.wallets.neutron = await walletSet(this.sdk1, neutronPrefix);
    this.wallets.cosmos = await walletSet(this.sdk2, cosmosPrefix);
    this.wallets.qaNeutron = await this.createQaWallet(
      neutronPrefix,
      this.sdk1,
      this.blockWaiter1,
      this.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    this.wallets.qaCosmos = await this.createQaWallet(
      cosmosPrefix,
      this.sdk2,
      this.blockWaiter2,
      this.wallets.cosmos.demo2,
      COSMOS_DENOM,
    );
    this.wallets.qaNeutronThree = await this.createQaWallet(
      neutronPrefix,
      this.sdk1,
      this.blockWaiter1,
      this.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    this.wallets.qaNeutronFour = await this.createQaWallet(
      neutronPrefix,
      this.sdk1,
      this.blockWaiter1,
      this.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    this.wallets.qaNeutronFive = await this.createQaWallet(
      neutronPrefix,
      this.sdk1,
      this.blockWaiter1,
      this.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
  };

  sendTokensWithRetry = async (
    cm: CosmosWrapper,
    to: string,
    amount: string,
    address: AccAddress,
    retryCount = 10,
  ): Promise<void> => {
    const fee = {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cm.denom, amount: '1000' }],
    };
    let attemptCount = 0;

    while (retryCount > attemptCount) {
      try {
        const sequence = await cm.getSeq(cm.sdk, cm.wallet.address);
        await cm.msgSend(to, amount, fee, sequence);
        return;
      } catch (e) {
        if (e.message.includes('sequence')) {
          await cm.blockWaiter.waitBlocks(1);
          attemptCount++;
        } else {
          throw e;
        }
      }
    }
    const balances = await cm.queryBalances(address.toString());
    if (balances == null) {
      throw new Error('Could not put tokens on the generated wallet.');
    }
    throw new Error(`Failed to send tokens after ${retryCount} retries.`);
  };

  createQaWallet = async (
    prefix: string,
    sdk: cosmosclient.CosmosSDK,
    blockWaiter: BlockWaiter,
    wallet: Wallet,
    denom: string,
    tokens = '11500000000',
  ) => {
    const cm = new CosmosWrapper(sdk, blockWaiter, wallet, denom);

    cosmosclient.config.setBech32Prefix({
      accAddr: prefix,
      accPub: `${prefix}pub`,
      valAddr: `${prefix}valoper`,
      valPub: `${prefix}valoperpub`,
      consAddr: `${prefix}valcons`,
      consPub: `${prefix}valconspub`,
    });
    const mnemonic = generateMnemonic();
    const address = await createAddress(mnemonic);
    await this.sendTokensWithRetry(cm, address.toString(), tokens, address);
    const wal = {
      genQaWal1: await mnemonicToWallet(
        cosmosclient.AccAddress,
        sdk,
        mnemonic,
        prefix,
      ),
    };
    return wal;
  };
}
