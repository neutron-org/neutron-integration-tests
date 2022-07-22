import {
  StargateClient,
  QueryClient,
  setupStakingExtension,
  setupAuthExtension,
  setupTxExtension,
  setupDistributionExtension,
  StakingExtension,
  AuthExtension,
  TxExtension,
  DistributionExtension,
  SigningStargateClient,
  SigningStargateClientOptions,
  GasPrice,
  BankExtension,
  setupBankExtension,
} from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import {
  MsgStoreCode,
  MsgInstantiateContract,
  MsgExecuteContract,
} from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import axios, { AxiosInstance } from 'axios';
import { Decimal } from '@cosmjs/math';
import { MsgUnjail } from 'cosmjs-types/cosmos/slashing/v1beta1/tx';

const defaultSigningClientOptions: SigningStargateClientOptions = {
  broadcastPollIntervalMs: 100,
  broadcastTimeoutMs: 120_000,
};

const cachedClients = new WeakMap<
  DirectSecp256k1HdWallet,
  SigningStargateClient
>();

const registry = new Registry();
registry.register('/liquidstaking.slashing.v1beta1.MsgUnjail', MsgUnjail);
registry.register('/cosmwasm.wasm.v1.MsgStoreCode', MsgStoreCode);
registry.register('/cosmwasm.wasm.v1.MsgExecuteContract', MsgExecuteContract);
registry.register(
  '/cosmwasm.wasm.v1.MsgInstantiateContract',
  MsgInstantiateContract,
);

export const getSignedClient = async (
  wallet: DirectSecp256k1HdWallet,
): Promise<SigningStargateClient> => {
  let client: SigningStargateClient | undefined = cachedClients.get(wallet);
  if (!client) {
    client = await SigningStargateClient.connectWithSigner(
      'http://127.0.0.1:26657',
      wallet,
      {
        ...defaultSigningClientOptions,
        registry,
        gasPrice: new GasPrice(Decimal.fromUserInput('25000', 1), 'stake'),
      },
    );
  }
  return client;
};

export class CosmosWrapper {
  lcdClient: AxiosInstance;
  client: StargateClient;
  signingClient: SigningStargateClient;
  tmClient: Tendermint34Client;
  queryClient: QueryClient &
    BankExtension &
    StakingExtension &
    AuthExtension &
    TxExtension &
    DistributionExtension;

  public async init(owner: DirectSecp256k1HdWallet) {
    this.client = await StargateClient.connect('http://127.0.0.1:26657');
    this.signingClient = await SigningStargateClient.connectWithSigner(
      'http://127.0.0.1:26657',
      owner,
      {
        ...defaultSigningClientOptions,
        registry,
        gasPrice: new GasPrice(Decimal.fromUserInput('25000', 1), 'stake'),
      },
    );
    this.tmClient = await Tendermint34Client.connect('http://127.0.0.1:26657');
    this.queryClient = await QueryClient.withExtensions(
      this.tmClient,
      setupStakingExtension,
      setupAuthExtension,
      setupTxExtension,
      setupDistributionExtension,
      setupBankExtension,
    );
    const fn = this.queryClient.queryUnverified;
    this.queryClient.queryUnverified = (path, request) => {
      path = path.replace(
        /\/cosmos\.(staking|slashing|distribution)/,
        '/liquidstaking.$1',
      );
      return fn.call(this.queryClient, path, request);
    };
    this.lcdClient = axios.create({
      baseURL: 'http://127.0.0.1:1317',
    });
  }
}
