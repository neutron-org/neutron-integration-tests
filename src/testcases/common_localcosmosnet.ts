import { exec } from 'child_process';
import { cosmosclient, proto } from '@cosmos-client/core';
import { Wallet } from '../types';
import { mnemonicToWallet } from '../helpers/cosmos';
import { setup } from '../helpers/env';
import { BlockWaiter } from '../helpers/wait';
import {generateMnemonic} from 'bip39';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
} from '../helpers/cosmos';
import { neutron } from '../generated/proto';

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
): Promise<Record<string, Wallet>> => ({
  demo1: await mnemonicToWallet(
    cosmosclient.AccAddress,
    sdk,
    TestStateLocalCosmosTestNet.arguments.createQaWallet.mnemonicQa,
    prefix,
  ),
});
console.log('this is after walletSetQA')


export class TestStateLocalCosmosTestNet {
  sdk1: cosmosclient.CosmosSDK;
  sdk2: cosmosclient.CosmosSDK;
  x1: BlockWaiter;
  blockWaiter2: BlockWaiter;
  wallets: Record<string, Record<string, Wallet>>;
  icq_web_host: string;
  init = async () => {
    const neutron_prefix = process.env.NEUTRON_ADDRESS_PREFIX || 'neutron';
    const cosmos_prefix = process.env.COSMOS_ADDRESS_PREFIX || 'cosmos';
    console.log('after cosmos_prefix')

    const host1 = process.env.NODE1_URL || 'http://localhost:1317';
    const host2 = process.env.NODE2_URL || 'http://localhost:1316';
    console.log('after hosts')

    this.sdk1 = new cosmosclient.CosmosSDK(host1, config.CHAIN_ID_1);
    this.sdk2 = new cosmosclient.CosmosSDK(host2, config.CHAIN_ID_2);
   

    this.icq_web_host = 'http://localhost:9999';

    this.blockWaiter1 = new BlockWaiter(
      process.env.NODE1_WS_URL || 'ws://localhost:26657',
    );
    this.blockWaiter2 = new BlockWaiter(
      process.env.NODE2_WS_URL || 'ws://localhost:16657',
    );
    console.log('after blockWaiter')
    
    const demo4 = await mnemonicToWallet(
    cosmosclient.AccAddress,
    this.sdk1,
    config.DEMO_MNEMONIC_1,
    neutron_prefix,
    );
  
    const cm = new CosmosWrapper(
      this.sdk1,
      this.blockWaiter1,
      demo4,
      NEUTRON_DENOM,
    );
   
    const createQaWallet = async () => {
      const addrPrefix = 'neutron'
      cosmosclient.config.setBech32Prefix({
          accAddr: addrPrefix,
          accPub: `${addrPrefix}pub`,
          valAddr: `${addrPrefix}valoper`,
          valPub: `${addrPrefix}valoperpub`,
          consAddr: `${addrPrefix}valcons`,
          consPub: `${addrPrefix}valconspub`,
        });
      let mnemonicQa = generateMnemonic()
      const privKey = new proto.cosmos.crypto.secp256k1.PrivKey({
          key: await cosmosclient.generatePrivKeyFromMnemonic(mnemonicQa),
        });
       const pubKey = privKey.pubKey();
       const address = cosmosclient.AccAddress.fromPublicKey(pubKey).toString()
       const res = await cm.msgSend(address, '50000')     
       const balances = await cm.queryBalances(address)
       console.log(balances)
      }
    
    await setup(host1, host2);

    this.wallets = {};
    this.wallets.neutron = await walletSet(this.sdk1, neutron_prefix);
    this.wallets.cosmos = await walletSet(this.sdk2, cosmos_prefix);
    this.wallets.qa = await walletSetQa(this.sdk1, neutron_prefix);
  };
}
