import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { generateMnemonic } from 'bip39';

import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { Coin, Registry, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import {
  NEUTRON_DENOM,
  COSMOS_DENOM,
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
} from '@neutron-org/neutronjsplus';

const walletSet = async (
  prefix: string,
  config: any,
): Promise<Record<string, Wallet>> => ({
  val1: await mnemonicToWallet(config.VAL_MNEMONIC_1, prefix),
  demo1: await mnemonicToWallet(config.DEMO_MNEMONIC_1, prefix),
  demo2: await mnemonicToWallet(config.DEMO_MNEMONIC_2, prefix),
  icq: await mnemonicToWallet(config.DEMO_MNEMONIC_3, prefix),
  rly1: await mnemonicToWallet(config.RLY_MNEMONIC_1, prefix),
  rly2: await mnemonicToWallet(config.RLY_MNEMONIC_2, prefix),
});

export class TestStateLocalCosmosTestNet {
  wallets: Record<string, Record<string, Wallet>>;
  icqWebHost: string;
  rpc1: string;
  rpc2: string;
  rest1: string;
  rest2: string;

  constructor(private config: any) {}

  async init() {
    const neutronPrefix = process.env.NEUTRON_ADDRESS_PREFIX || 'neutron';
    const cosmosPrefix = process.env.COSMOS_ADDRESS_PREFIX || 'cosmos';

    const restNeutron = process.env.NODE1_URL || 'http://localhost:1317';
    const restGaia = process.env.NODE2_URL || 'http://localhost:1316';

    const rpcNeutron = process.env.NODE1_RPC || 'http://localhost:26657';
    const rpcGaia = process.env.NODE2_RPC || 'http://localhost:16657';

    this.rpc1 = rpcNeutron;
    this.rpc2 = rpcGaia;

    this.rest1 = restNeutron;
    this.rest2 = restGaia;

    this.icqWebHost = 'http://localhost:9999';

    this.wallets = {};
    const neutron = await walletSet(neutronPrefix, this.config);
    const cosmos = await walletSet(cosmosPrefix, this.config);

    const qaNeutron = await this.createQaWallet(
      neutronPrefix,
      neutron.demo1,
      NEUTRON_DENOM,
      rpcNeutron,
      [
        {
          denom: NEUTRON_DENOM,
          amount: '11500000000',
        },
        {
          denom: IBC_ATOM_DENOM,
          amount: '11500000000',
        },
        {
          denom: IBC_USDC_DENOM,
          amount: '11500000000',
        },
      ],
    );

    const qaNeutronThree = await this.createQaWallet(
      neutronPrefix,
      neutron.demo1,
      NEUTRON_DENOM,
      rpcNeutron,
    );

    const qaNeutronFour = await this.createQaWallet(
      neutronPrefix,
      neutron.demo1,
      NEUTRON_DENOM,
      rpcNeutron,
    );

    const qaNeutronFive = await this.createQaWallet(
      neutronPrefix,
      neutron.demo1,
      NEUTRON_DENOM,
      rpcNeutron,
    );

    const qaCosmos = await this.createQaWallet(
      cosmosPrefix,
      cosmos.demo2,
      COSMOS_DENOM,
      rpcGaia,
    );

    const qaCosmosTwo = await this.createQaWallet(
      cosmosPrefix,
      cosmos.demo2,
      COSMOS_DENOM,
      rpcGaia,
    );

    this.wallets = {
      cosmos,
      neutron,
      qaNeutron,
      qaCosmos,
      qaCosmosTwo,
      qaNeutronThree,
      qaNeutronFour,
      qaNeutronFive,
    };
    return this.wallets;
  }

  async createQaWallet(
    prefix: string,
    wallet: Wallet,
    denom: string,
    rpc: string,
    balances: Coin[] = [],
  ) {
    if (balances.length === 0) {
      balances = [
        {
          denom,
          amount: '11500000000',
        },
      ];
    }

    const client = await SigningStargateClient.connectWithSigner(
      rpc,
      wallet.directwallet,
      { registry: new Registry(defaultRegistryTypes) },
    );
    const mnemonic = generateMnemonic();

    console.log('mnemonic: ' + mnemonic);
    const newWallet = await mnemonicToWallet(mnemonic, prefix);
    for (const balance of balances) {
      await client.sendTokens(
        wallet.account.address,
        newWallet.account.address,
        [{ amount: balance.amount, denom: balance.denom }],
        {
          gas: '200000',
          amount: [{ denom: denom, amount: '1000' }],
        },
      );
    }
    const wal = await mnemonicToWallet(mnemonic, prefix);
    return { qa: wal };
  }
}

export const mnemonicToWallet = async (
  mnemonic: string,
  addrPrefix: string,
): Promise<Wallet> => {
  const directwallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: addrPrefix,
  });
  const account = (await directwallet.getAccounts())[0];
  const directwalletValoper = await DirectSecp256k1HdWallet.fromMnemonic(
    mnemonic,
    {
      prefix: addrPrefix + 'valoper',
    },
  );
  const accountValoper = (await directwalletValoper.getAccounts())[0];
  return new Wallet(addrPrefix, directwallet, account, accountValoper);
};
