import { exec } from 'child_process';
import * as cosmos from '@cosmos-client/core';
import { cosmwasmproto } from '@cosmos-client/cosmwasm';
import { promises as fsPromise } from 'fs';
import path from 'path';

const config = require('../config.json');

export type Wallet = {
  address: cosmos.cosmosclient.AccAddress;
  account: cosmos.proto.cosmos.auth.v1beta1.BaseAccount;
  pubKey: cosmos.cosmosclient.PubKey;
};

export const mnemonicToWallet = async (
  sdk: cosmos.cosmosclient.CosmosSDK,
  mnemonic: string,
): Promise<Wallet> => {
  const privKey = new cosmos.proto.cosmos.crypto.secp256k1.PrivKey({
    key: await cosmos.cosmosclient.generatePrivKeyFromMnemonic(mnemonic),
  });

  const pubKey = privKey.pubKey();
  const address = cosmos.cosmosclient.AccAddress.fromPublicKey(pubKey);

  // get account info
  const account = await cosmos.rest.auth
    .account(sdk, address)
    .then((res) =>
      cosmos.cosmosclient.codec.protoJSONToInstance(
        cosmos.cosmosclient.codec.castProtoJSONOfProtoAny(res.data.account),
      ),
    )
    .catch((e) => {
      console.log(e);
      throw e;
    });

  if (!(account instanceof cosmos.proto.cosmos.auth.v1beta1.BaseAccount)) {
    throw new Error("can't get account");
  }
  return {
    address,
    account,
    pubKey,
  };
};

export const disconnectValidator = async (name: string) => {
  const { stdout } = await exec(`docker stop ${name}`);
  return stdout;
};

export class TestStateLocalCosmosTestNet {
  sdk_1: cosmos.cosmosclient.CosmosSDK;
  sdk_2: cosmos.cosmosclient.CosmosSDK;
  wallets: Record<string, Wallet>;
  contractPath: string;
  init = async () => {
    this.contractPath = '../neutron-contracts/artifacts';
    cosmos.cosmosclient.config.setBech32Prefix({
      accAddr: 'neutron',
      accPub: 'neutronpub',
      valAddr: 'neutronvaloper',
      valPub: 'neutronvaloperpub',
      consAddr: 'neutronvalcons',
      consPub: 'neutronvalconspub',
    });

    this.sdk_1 = new cosmos.cosmosclient.CosmosSDK(
      process.env.NODE1_URL || 'http://localhost:1316',
      'testchain',
    );
    this.sdk_2 = new cosmos.cosmosclient.CosmosSDK(
      process.env.NODE2_URL || 'http://localhost:1317',
      'testchain',
    );

    this.wallets = {
      val1: await mnemonicToWallet(this.sdk_1, config.VAL_MNEMONIC_1),
      val2: await mnemonicToWallet(this.sdk_2, config.VAL_MNEMONIC_2),
      demo1: await mnemonicToWallet(this.sdk_1, config.DEMO_MNEMONIC_1),
      demo2: await mnemonicToWallet(this.sdk_2, config.DEMO_MNEMONIC_2),
      rly1: await mnemonicToWallet(this.sdk_1, config.RLY_MNEMONIC_1),
      rly2: await mnemonicToWallet(this.sdk_2, config.RLY_MNEMONIC_2),
    };

    await this.storeWasm();
  };

  async storeWasm(): Promise<void> {
    const msg = new cosmwasmproto.cosmwasm.wasm.v1.MsgStoreCode({
      sender: this.wallets.demo1.address.toString(),
      wasm_byte_code: await fsPromise.readFile(
        path.resolve(this.contractPath, 'neutron_interchain_txs.wasm'),
      ),
    });
    console.log(msg);
  }
}
