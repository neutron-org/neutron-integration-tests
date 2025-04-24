import { promises as fs } from 'fs';
import {
  AminoTypes,
  createProtobufRpcClient,
  ProtobufRpcClient,
  QueryClient,
} from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, OfflineSigner } from '@cosmjs/proto-signing';
import { RunnerTestSuite } from 'vitest';
import { connectComet } from '@cosmjs/tendermint-rpc';
import {
  COSMOS_PREFIX,
  GAIA_CONNECTION,
  GAIA_REST,
  GAIA_RPC,
  IBC_WEB_HOST,
  NEUTRON_PREFIX,
  NEUTRON_REST,
  NEUTRON_RPC,
  WALLETS_SIGN_METHOD,
} from './constants';
import { GaiaWallet, Wallet } from './wallet';
import { IbcClient, Link } from '@confio/relayer';
import { GasPrice } from '@cosmjs/stargate/build/fee';
import { MetaMaskEmulator } from './metamask_emulator';
import { FakeMetaMaskEip191Signer } from './fake_eip191_signer';
import { aminoConverters } from '@neutron-org/neutronjsplus/dist/amino';
import { Eip191Signer } from '@neutron-org/neutronjsplus/dist/eip191';

// limit of wallets precreated for one test
const WALLETS_PER_TEST_FILE = 20;

const NEUTRON_VALOPER_OPTIONS = {
  prefix: NEUTRON_PREFIX + 'valoper',
};
const COSMOS_VALOPER_OPTIONS = {
  prefix: COSMOS_PREFIX + 'valoper',
};

export class LocalState {
  wallets: {
    cosmos: Record<string, GaiaWallet>;
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
    this.icqWebHost = IBC_WEB_HOST;
    this.walletIndexes = { neutron: 0, cosmos: 0 };
  }

  protected async init() {
    if (this.suite) {
      this.testFilePosition = await testFilePosition(this.suite);
    } else {
      this.testFilePosition = 0;
    }

    this.wallets = {
      cosmos: await getGenesisGaiaWallets(this.config),
      neutron: await getGenesisWallets(this.config),
    };
  }

  // Returns new wallet for a given `network`.
  // The wallet is prefunded in a globalSetup.
  // That way we can safely use these wallets in a parallel tests
  // (no sequence overlapping problem when using the same wallets in parallel since they're all unique).
  async nextNeutronWallet(): Promise<Wallet> {
    let kind: string;
    if (WALLETS_SIGN_METHOD === 'random') {
      kind = Math.random() < 0.5 ? 'eip191' : 'secp256k1';
    } else {
      kind = WALLETS_SIGN_METHOD;
    }
    return this.nextNeutronWalletWithSigner(kind);
  }

  // similar to nextWallet, but returns ordinary signing neutron wallet
  // helpful when some functions cannot use eip191 sign due to not using Eip191CosmwasmClient inside
  async nextSimpleSignNeutronWallet(): Promise<Wallet> {
    return this.nextNeutronWalletWithSigner('secp256k1');
  }

  private async nextNeutronWalletWithSigner(
    signerKind: string,
  ): Promise<Wallet> {
    const nextWalletIndex = await this.getAndUpdateNextWalletIndex('neutron');
    const mnemonic = this.mnemonics[nextWalletIndex];

    let signer: OfflineSigner | Eip191Signer;
    if (signerKind === 'eip191') {
      signer = new FakeMetaMaskEip191Signer(
        await MetaMaskEmulator.connect([mnemonic]),
      );
    } else if (signerKind === 'secp256k1') {
      signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: NEUTRON_PREFIX,
      });
    } else {
      throw new Error('unknown neutron signer kind: ' + signerKind);
    }

    const account = (await signer.getAccounts())[0];
    const directwalletValoper = await DirectSecp256k1HdWallet.fromMnemonic(
      mnemonic,
      NEUTRON_VALOPER_OPTIONS,
    );
    const accountValoper = (await directwalletValoper.getAccounts())[0];
    return new Wallet(signer, account, accountValoper);
  }

  async nextGaiaWallet(): Promise<GaiaWallet> {
    const nextWalletIndex = await this.getAndUpdateNextWalletIndex('cosmos');
    const mnemonic = this.mnemonics[nextWalletIndex];
    const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: COSMOS_PREFIX,
    });

    const account = (await signer.getAccounts())[0];
    const directwalletValoper = await DirectSecp256k1HdWallet.fromMnemonic(
      mnemonic,
      COSMOS_VALOPER_OPTIONS,
    );
    const accountValoper = (await directwalletValoper.getAccounts())[0];
    return new GaiaWallet(signer, account, accountValoper);
  }

  async getAndUpdateNextWalletIndex(network: string): Promise<number> {
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

    return nextWalletIndex;
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
  // since hermes don't have a manual relay.
  async relayerLink(): Promise<Link> {
    const neutronWallet = await this.nextSimpleSignNeutronWallet();
    const gaiaWallet = await this.nextGaiaWallet();
    const neutronIbcClient = await IbcClient.connectWithSigner(
      this.rpcNeutron,
      neutronWallet.signer as OfflineSigner,
      neutronWallet.address,
      {
        gasPrice: GasPrice.fromString('0.05untrn'),
        estimatedBlockTime: 3,
        estimatedIndexerTime: 100,
        aminoTypes: new AminoTypes(aminoConverters),
      },
    );
    const gaiaIbcClient = await IbcClient.connectWithSigner(
      this.rpcGaia,
      gaiaWallet.signer,
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
  config: any,
): Promise<Record<string, Wallet>> => ({
  val1: await Wallet.fromMnemonic(config.VAL_MNEMONIC_1),
  val2: await Wallet.fromMnemonic(config.VAL_MNEMONIC_2),
  demo1: await Wallet.fromMnemonic(config.DEMO_MNEMONIC_1),
  demo2: await Wallet.fromMnemonic(config.DEMO_MNEMONIC_2),
  icq: await Wallet.fromMnemonic(config.DEMO_MNEMONIC_3),
  rly1: await Wallet.fromMnemonic(config.RLY_MNEMONIC_1),
  rly2: await Wallet.fromMnemonic(config.RLY_MNEMONIC_2),
});

const getGenesisGaiaWallets = async (
  config: any,
): Promise<Record<string, GaiaWallet>> => ({
  val1: await GaiaWallet.fromMnemonic(config.VAL_MNEMONIC_1),
  demo1: await GaiaWallet.fromMnemonic(config.DEMO_MNEMONIC_1),
  demo2: await GaiaWallet.fromMnemonic(config.DEMO_MNEMONIC_2),
  icq: await GaiaWallet.fromMnemonic(config.DEMO_MNEMONIC_3),
  rly1: await GaiaWallet.fromMnemonic(config.RLY_MNEMONIC_1),
  rly2: await GaiaWallet.fromMnemonic(config.RLY_MNEMONIC_2),
});
