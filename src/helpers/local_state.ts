import { promises as fs } from 'fs';
import {
  createProtobufRpcClient,
  ProtobufRpcClient,
  QueryClient,
} from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { HdPath, stringToPath } from "@cosmjs/crypto";
import { RunnerTestSuite } from 'vitest';
import { connectComet } from '@cosmjs/tendermint-rpc';
import {
  COSMOS_PREFIX,
  GAIA_CONNECTION,
  GAIA_REST,
  GAIA_RPC,
  ICQ_WEB_HOST,
  NEUTRON_PREFIX,
  NEUTRON_REST,
  NEUTRON_RPC,
} from './constants';
import { Wallet } from './wallet';
import { IbcClient, Link } from '@confio/relayer';
import { GasPrice } from '@cosmjs/stargate/build/fee';

// limit of wallets precreated for one test
const WALLETS_PER_TEST_FILE = 20;

export class LocalState {
  wallets: {
    cosmos: Record<string, Wallet>;
    neutron: Record<string, Wallet>;
  };
  icqWebHost: string;

  rpcNeutron: string;
  rpcGaia: string;

  restNeutron: string;
  restGaia: string;

  walletIndexes: {
    neutron: number;
    cosmos: number;
  };
  testFilePosition: number;

  static async create(
    config: any,
    mnemonics: string[],
    suite?: RunnerTestSuite,
  ): Promise<LocalState> {
    const res = new LocalState(config, mnemonics, suite);
    await res.init();
    return res;
  }

  protected constructor(
    private config: any,
    private mnemonics: string[],
    private suite?: RunnerTestSuite | undefined,
  ) {
    this.rpcNeutron = NEUTRON_RPC;
    this.rpcGaia = GAIA_RPC;

    this.restNeutron = NEUTRON_REST;
    this.restGaia = GAIA_REST;

    this.icqWebHost = ICQ_WEB_HOST;

    this.walletIndexes = { neutron: 0, cosmos: 0 };
  }

  protected async init() {
    if (this.suite) {
      this.testFilePosition = await testFilePosition(this.suite);
    } else {
      this.testFilePosition = 0;
    }

    this.wallets = {
      cosmos: await getGenesisWallets(COSMOS_PREFIX, this.config),
      neutron: await getGenesisWallets(NEUTRON_PREFIX, this.config),
    };
  }

  // Returns new wallet for a given `network`.
  // The wallet is prefunded in a globalSetup.
  // That way we can safely use these wallets in a parallel tests
  // (no sequence overlapping problem when using same wallets in parallel since they're all unique).
  async nextWallet(network: string): Promise<Wallet> {
    const currentOffsetInTestFile = this.walletIndexes[network];
    if (currentOffsetInTestFile >= WALLETS_PER_TEST_FILE) {
      return Promise.reject(
        'cannot give next wallet: current offset is greater than ' +
          WALLETS_PER_TEST_FILE,
      );
    }
    const nextWalletIndex =
      this.testFilePosition * WALLETS_PER_TEST_FILE + currentOffsetInTestFile;

    this.walletIndexes[network] = currentOffsetInTestFile + 1;

    return mnemonicToWallet(this.mnemonics[nextWalletIndex], network);
  }

  async neutronRpcClient() {
    const client = await connectComet(this.rpcNeutron);
    const queryClient = new QueryClient(client);
    return createProtobufRpcClient(queryClient);
  }

  async gaiaRpcClient(): Promise<ProtobufRpcClient> {
    const client = await connectComet(this.rpcGaia);
    const queryClient = new QueryClient(client);
    return createProtobufRpcClient(queryClient);
  }

  // Returns protobuf rpc client.
  // Usually used to construct querier for specific module
  async rpcClient(network: string): Promise<ProtobufRpcClient> {
    if (network === 'neutron') {
      return this.neutronRpcClient();
    } else if (network === 'gaia') {
      return this.gaiaRpcClient();
    } else {
      throw new Error('rpcClient() called non existent network: ' + network);
    }
  }

  // Creates an IBC relayer between neutron and gaia
  // This relayer can be used to manually relay packets
  // since hermes don't have manual relay.
  async relayerLink(): Promise<Link> {
    const neutronWallet = await this.nextWallet('neutron');
    const gaiaWallet = await this.nextWallet('cosmos');
    const neutronIbcClient = await IbcClient.connectWithSigner(
      this.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
      {
        gasPrice: GasPrice.fromString('0.05untrn'),
        estimatedBlockTime: 3,
        estimatedIndexerTime: 100,
      },
    );
    const gaiaIbcClient = await IbcClient.connectWithSigner(
      this.rpcGaia,
      gaiaWallet.directwallet,
      gaiaWallet.address,
      {
        gasPrice: GasPrice.fromString('0.05uatom'),
        estimatedBlockTime: 3,
        estimatedIndexerTime: 100,
      },
    );

    return await Link.createWithExistingConnections(
      neutronIbcClient,
      gaiaIbcClient,
      GAIA_CONNECTION,
      GAIA_CONNECTION,
    );
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

export const mnemonicWithAccountToWallet = async (
  mnemonic: string,
  addrPrefix: string,
  accountIndex: number,
): Promise<Wallet> => {
  const hdPath: HdPath = stringToPath(`m/44'/118'/${accountIndex}'/0/0`);
  const directwallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: addrPrefix,
    hdPaths: [hdPath],
  });
  const account = (await directwallet.getAccounts())[0];
  const directwalletValoper = await DirectSecp256k1HdWallet.fromMnemonic(
    mnemonic,
    {
      prefix: addrPrefix + 'valoper',
      hdPaths: [hdPath],
    },
  );
  const accountValoper = (await directwalletValoper.getAccounts())[0];
  return new Wallet(addrPrefix, directwallet, account, accountValoper);
};

async function testFilePosition(s: RunnerTestSuite): Promise<number> {
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

const getGenesisWallets = async (
  prefix: string,
  config: any,
): Promise<Record<string, Wallet>> => ({
  val1: await mnemonicWithAccountToWallet(config.VAL_MNEMONIC_1, prefix, 1),
  demo1: await mnemonicToWallet(config.DEMO_MNEMONIC_1, prefix),
  demo2: await mnemonicToWallet(config.DEMO_MNEMONIC_2, prefix),
  icq: await mnemonicToWallet(config.DEMO_MNEMONIC_3, prefix),
  rly1: await mnemonicToWallet(config.RLY_MNEMONIC_1, prefix),
});
