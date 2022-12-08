import { cosmosclient } from '@cosmos-client/core';
import { Wallet } from '../types';
import { mnemonicToWallet } from '../helpers/cosmos';
import { restart, setup } from '../helpers/env';

const config = require('../config.json');

const NEUTRON_PREFIX = process.env.NEUTRON_ADDRESS_PREFIX || 'neutron';
const COSMOS_PREFIX = process.env.COSMOS_ADDRESS_PREFIX || 'cosmos';

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
  wallets: Record<string, Record<string, Wallet>>;
  host1: string;
  host2: string;
  init = async () => {
    this.host1 = process.env.NODE1_URL || 'http://localhost:1317';
    this.host2 = process.env.NODE2_URL || 'http://localhost:1316';

    this.sdk1 = new cosmosclient.CosmosSDK(this.host1, config.CHAIN_ID_1);
    this.sdk2 = new cosmosclient.CosmosSDK(this.host2, config.CHAIN_ID_2);

    await setup(this.host1);

    this.wallets = {};
    this.wallets.neutron = await walletSet(this.sdk1, NEUTRON_PREFIX);
    this.wallets.cosmos = await walletSet(this.sdk2, COSMOS_PREFIX);
  };

  restart = async () => {
    this.host1 = process.env.NODE1_URL || 'http://localhost:1317';
    this.host2 = process.env.NODE2_URL || 'http://localhost:1316';

    this.sdk1 = new cosmosclient.CosmosSDK(this.host1, config.CHAIN_ID_1);
    this.sdk2 = new cosmosclient.CosmosSDK(this.host2, config.CHAIN_ID_2);

    await restart(this.host1);

    this.wallets = {};
    this.wallets.neutron = await walletSet(this.sdk1, NEUTRON_PREFIX);
    this.wallets.cosmos = await walletSet(this.sdk2, COSMOS_PREFIX);
  };
}
