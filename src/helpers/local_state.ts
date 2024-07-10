import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { generateMnemonic } from 'bip39';
import { promises as fs } from 'fs';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import { CONTRACTS_PATH, DEBUG_SUBMIT_TX } from './setup';
import {
  createProtobufRpcClient,
  defaultRegistryTypes,
  ProtobufRpcClient,
  QueryClient,
  SigningStargateClient,
} from '@cosmjs/stargate';
import { Coin, Registry, DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { Suite } from 'vitest';
import { neutronTypes } from '@neutron-org/neutronjsplus/dist/neutronTypes';
import { connectComet } from '@cosmjs/tendermint-rpc';
import { COSMOS_PREFIX, NEUTRON_PREFIX } from './constants';

// limit of wallets precreated for one test
const LIMIT_PER_TEST = 20;

export class LocalState {
  wallets: Record<string, Record<string, Wallet>>;
  icqWebHost: string;

  rpcNeutron: string;
  rpcGaia: string;

  restNeutron: string;
  restGaia: string;

  taken: any;
  currentIdx: any;
  offset: number;

  static async create(
    config: any,
    mnemonics: string[],
    suite?: Suite,
  ): Promise<LocalState> {
    const res = new LocalState(config, mnemonics, suite);
    await res.init();
    return res;
  }

  protected constructor(
    private config: any,
    private mnemonics: string[],
    private suite?: Suite | undefined,
  ) {
    this.taken = {
      cosmos: {},
      neutron: {},
    };
    this.currentIdx = { neutron: 0, cosmos: 0 };
    this.offset = null;
  }

  async init() {
    this.rpcNeutron = process.env.NODE1_RPC || 'http://localhost:26657';
    this.rpcGaia = process.env.NODE2_RPC || 'http://localhost:16657';

    this.restNeutron = process.env.NODE1_URL || 'http://localhost:1317';
    this.restGaia = process.env.NODE2_URL || 'http://localhost:1316';

    this.icqWebHost = process.env.ICQ_WEB_HOST || 'http://localhost:9999';

    this.wallets = {};

    // Do not use these in parallel tests to avoid overlapping of wallets
    const neutron = await genesisWalletSet(NEUTRON_PREFIX, this.config);
    const cosmos = await genesisWalletSet(COSMOS_PREFIX, this.config);

    this.wallets = {
      cosmos,
      neutron,
      qaNeutron: { qa: await this.nextWallet(NEUTRON_PREFIX) },
      qaCosmos: { qa: await this.nextWallet(COSMOS_PREFIX) },
      qaCosmosTwo: { qa: await this.nextWallet(NEUTRON_PREFIX) },
      qaNeutronThree: { qa: await this.nextWallet(NEUTRON_PREFIX) },
      qaNeutronFour: { qa: await this.nextWallet(NEUTRON_PREFIX) },
      qaNeutronFive: { qa: await this.nextWallet(NEUTRON_PREFIX) },
    };
    return this.wallets;
  }

  // Returns new wallet for a given `network`.
  // The wallet is prefunded in a globalSetup.
  // That way we can safely use these wallets in a parallel tests
  // (no sequence overlapping problem when using same wallets in parallel since they're all unique).
  async nextWallet(network: string): Promise<Wallet> {
    if (!this.suite) {
      throw 'no suite provided to use nextWallet';
    }
    if (this.offset === null && this.suite) {
      this.offset = await testFilePosition(this.suite);
    } else {
      this.offset = 0;
    }

    const resultIdx = this.offset * LIMIT_PER_TEST + this.currentIdx[network];

    this.currentIdx[network] += 1;

    if (this.taken[network][resultIdx]) {
      return this.nextWallet(network);
    }

    this.taken[network][resultIdx] = true;

    return mnemonicToWallet(this.mnemonics[resultIdx], network);
  }

  async createQaWallet(
    prefix: string,
    wallet: Wallet,
    denom: string,
    rpc: string,
    balances: Coin[] = [],
  ): Promise<Wallet> {
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
    return await mnemonicToWallet(mnemonic, prefix);
  }

  // Returns protobuf rpc client.
  // Usually used to construct querier for specific module
  async rpcClient(network: string): Promise<ProtobufRpcClient> {
    let rpc: string;
    if (network === 'neutron') {
      rpc = this.rpcNeutron;
    } else if (network === 'gaia') {
      rpc = this.rpcGaia;
    }
    const client = await connectComet(rpc);
    const queryClient = new QueryClient(client);
    return createProtobufRpcClient(queryClient);
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

async function testFilePosition(s: Suite): Promise<number> {
  const filepath = s.file.filepath.trim();
  const splitted = filepath.split('/');
  const filename = splitted.pop().trim();
  const dir = splitted.join('/');

  return testFilePositionForName(dir, filename);
}

// takes all files in directory, sorts them and finds the index of the current file in the array
async function testFilePositionForName(
  dir: string,
  filename: string,
): Promise<number> {
  const files = await listFilenamesInDir(dir);
  const idx = files.findIndex((f) => f === filename);

  if (idx === -1) {
    throw 'no index for filename: ' + filename + ' and dir: ' + dir;
  }
  return idx;
}

async function listFilenamesInDir(dir: string): Promise<string[]> {
  const res = [];
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });
    files.forEach((file) => {
      if (file.isFile()) {
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
