import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { generateMnemonic } from 'bip39';
import { promises as fs } from 'fs';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import { CONTRACTS_PATH, DEBUG_SUBMIT_TX } from './setup';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { Coin, Registry, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { Suite } from 'vitest';
import { neutronTypes } from '@neutron-org/neutronjsplus/dist/neutronTypes';

// limit of wallets precreated for one test
const LIMIT_PER_TEST = 20;

export class LocalState {
  wallets: Record<string, Record<string, Wallet>>;
  icqWebHost: string;
  rpc1: string;
  rpc2: string;
  rest1: string;
  rest2: string;
  taken: any;
  currentIdx: any;
  suite: Suite | null;
  offset: number;

  constructor(private config: any, private mnemonics: string[], suite?: Suite) {
    this.taken = {
      cosmos: {},
      neutron: {},
    };
    this.currentIdx = { neutron: 0, cosmos: 0 };
    this.suite = suite;
    this.offset = null;
  }

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
    const neutron = await genesisWalletSet(neutronPrefix, this.config);
    const cosmos = await genesisWalletSet(cosmosPrefix, this.config);

    this.wallets = {
      cosmos,
      neutron,
      qaNeutron: { qa: await this.randomWallet(neutronPrefix) },
      qaCosmos: { qa: await this.randomWallet(cosmosPrefix) },
      qaCosmosTwo: { qa: await this.randomWallet(neutronPrefix) },
      qaNeutronThree: { qa: await this.randomWallet(neutronPrefix) },
      qaNeutronFour: { qa: await this.randomWallet(neutronPrefix) },
      qaNeutronFive: { qa: await this.randomWallet(neutronPrefix) },
    };
    return this.wallets;
  }

  async randomWallet(prefix: string): Promise<Wallet> {
    const idx = Math.floor(Math.random() * this.mnemonics.length);
    if (this.taken[prefix][idx]) {
      return this.randomWallet(prefix);
    }
    this.taken[prefix][idx] = true;
    return mnemonicToWallet(this.mnemonics[idx], prefix);
  }

  async walletWithOffset(prefix: string): Promise<Wallet> {
    if (!this.suite) {
      throw 'no suite provided to use walletWithOffset';
    }
    if (this.offset === null) {
      this.offset = await testOffset(this.suite);
    }

    const resultIdx = this.offset * LIMIT_PER_TEST + this.currentIdx[prefix];

    this.currentIdx[prefix] += 1;

    if (this.taken[prefix][resultIdx]) {
      return this.walletWithOffset(prefix);
    }

    this.taken[prefix][resultIdx] = true;

    return mnemonicToWallet(this.mnemonics[resultIdx], prefix);
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

async function testOffset(s: Suite): Promise<number> {
  const filepath = s.file.filepath.trim();
  const splitted = filepath.split('/');
  const filename = splitted.pop().trim();
  const dir = splitted.join('/');

  return testIdxForNameDir(dir, filename);
}

// takes all files in directory, sorts them and finds the index of the current file in the array
async function testIdxForNameDir(
  dir: string,
  filename: string,
): Promise<number> {
  const files = await listFilenames(dir);
  const idx = files.findIndex((f) => f === filename);

  if (idx === -1) {
    throw 'no index for filename: ' + filename + ' and dir: ' + dir;
  }
  return idx;
}

async function listFilenames(dir: string): Promise<string[]> {
  const res = [];
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });
    files.forEach((file) => {
      if (file.isFile()) {
        // console.log('list filename: ' + file.name + ' file.path: ' + file.path);
        res.push(file.name.trim());
      }
    });
  } catch (err) {
    console.error('Error reading directory:', err);
  }
  return res.sort();
}

const genesisWalletSet = async (
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

export async function createWalletWrapper(
  chain: CosmosWrapper,
  wallet: Wallet,
) {
  const registry = new Registry(neutronTypes);

  const wasmClient = await SigningCosmWasmClient.connectWithSigner(
    chain.rpc,
    wallet.directwallet,
    { registry },
  );
  return new WalletWrapper(
    chain,
    wallet,
    wasmClient,
    registry,
    CONTRACTS_PATH,
    DEBUG_SUBMIT_TX,
  );
}
