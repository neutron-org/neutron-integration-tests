import { DeliverTxResponse, IndexedTx, StdFee } from '@cosmjs/stargate';
import {
  CosmWasmClient,
  MigrateResult,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate';
import { promises as fsPromise } from 'fs';
import path from 'path';
import {
  Coin,
  DirectSecp256k1HdWallet,
  EncodeObject,
  Registry,
} from '@cosmjs/proto-signing';
import { CONTRACTS_PATH } from './setup';
import { CometClient, connectComet } from '@cosmjs/tendermint-rpc';
import { GasPrice } from '@cosmjs/stargate/build/fee';
import {
  waitBlocks,
  getWithAttempts,
  queryContractWithWait,
} from '@neutron-org/neutronjsplus/dist/wait';
import { NEUTRON_DENOM } from './constants';
import { neutronTypes } from './registry_types';

// SigningNeutronClient simplifies tests operations for
// storing, instantiating, migrating, executing contracts, executing transactions,
// and also for basic queries, like getHeight, getBlock, or getTx
export class SigningNeutronClient extends CosmWasmClient {
  // creates a SigningNeutronClient
  static async connectWithSigner(
    rpc: string,
    wallet: DirectSecp256k1HdWallet,
    signer: string,
    customGasPrice?: GasPrice,
  ) {
    const registry = new Registry(neutronTypes);
    const neutronClient = await SigningCosmWasmClient.connectWithSigner(
      rpc,
      wallet,
      {
        registry: registry,
        gasPrice:
          customGasPrice != undefined
            ? customGasPrice
            : GasPrice.fromString('0.05untrn'),
      },
    );
    const cometClient = await connectComet(rpc);
    return new SigningNeutronClient(
      rpc,
      signer,
      neutronClient,
      CONTRACTS_PATH,
      cometClient,
    );
  }

  protected constructor(
    public rpc: string,
    public sender: string,
    public client: SigningCosmWasmClient,
    private contractsPath: string,
    cometClient: CometClient,
  ) {
    super(cometClient);
  }

  async upload(
    fileName: string,
    fee: StdFee | 'auto' | number = 'auto',
  ): Promise<number> {
    // upload
    const wasmCode = await this.getNeutronContract(fileName);
    const uploadResult = await this.client.upload(this.sender, wasmCode, fee);
    return uploadResult.codeId;
  }

  async instantiate(
    codeId: number,
    msg: any,
    label = 'unfilled',
    fee: StdFee | 'auto' | number = 'auto',
    admin: string = this.sender,
  ): Promise<string> {
    const res = await this.client.instantiate(
      this.sender,
      codeId,
      msg,
      label,
      fee,
      { admin },
    );
    return res.contractAddress;
  }

  // uploads and instantiates a contract in one
  async create(
    fileName: string,
    msg: any,
    label = 'unfilled',
    fee: StdFee | 'auto' | number = 'auto',
    admin: string = this.sender,
  ): Promise<string> {
    // upload
    const wasmCode = await this.getNeutronContract(fileName);
    const uploadResult = await this.client.upload(this.sender, wasmCode, fee);

    // instantiate
    const res = await this.client.instantiate(
      this.sender,
      uploadResult.codeId,
      msg,
      label,
      fee,
      { admin },
    );
    return res.contractAddress;
  }

  async migrate(
    contract: string,
    codeId: number,
    msg: any,
    fee: StdFee | 'auto' | number = 'auto',
  ): Promise<MigrateResult> {
    return await this.client.migrate(this.sender, contract, codeId, msg, fee);
  }

  async execute(
    contract: string,
    msg: any,
    funds: Coin[] = [],
    fee: StdFee | 'auto' | number = 'auto',
  ): Promise<IndexedTx> {
    const res = await this.client.execute(
      this.sender,
      contract,
      msg,
      fee,
      '',
      funds,
    );
    return await this.client.getTx(res.transactionHash);
  }

  async signAndBroadcast(
    messages: readonly EncodeObject[],
    fee: StdFee | 'auto' | number = 'auto',
    memo?: string,
    timeoutHeight?: bigint,
  ): Promise<DeliverTxResponse> {
    return this.client.signAndBroadcast(
      this.sender,
      messages,
      fee,
      memo,
      timeoutHeight,
    );
  }

  async signAndBroadcastSync(
    messages: readonly EncodeObject[],
    fee: StdFee | 'auto' | number = 'auto',
    memo?: string,
    timeoutHeight?: bigint,
  ): Promise<string> {
    return this.client.signAndBroadcastSync(
      this.sender,
      messages,
      fee,
      memo,
      timeoutHeight,
    );
  }

  async getNeutronContract(fileName: string): Promise<Buffer> {
    return fsPromise.readFile(path.resolve(this.contractsPath, fileName));
  }

  async sendTokens(
    recipientAddress: string,
    amount: readonly Coin[],
    fee: StdFee | 'auto' | number = 'auto',
    memo?: string,
  ): Promise<DeliverTxResponse> {
    return this.client.sendTokens(
      this.sender,
      recipientAddress,
      amount,
      fee,
      memo,
    );
  }

  async waitBlocks(blocks: number, timeout = 120000): Promise<void> {
    return waitBlocks(blocks, this.client, timeout);
  }

  async getWithAttempts<T>(
    getFunc: () => Promise<T>,
    readyFunc: (t: T) => Promise<boolean>,
    numAttempts = 20,
  ): Promise<T> {
    return getWithAttempts(this.client, getFunc, readyFunc, numAttempts);
  }

  async queryContractWithWait<T>(
    contract: string,
    query: any,
    numAttempts = 20,
  ): Promise<T> {
    return queryContractWithWait(this.client, contract, query, numAttempts);
  }

  async simulateFeeBurning(amount: number): Promise<DeliverTxResponse> {
    const fee = {
      gas: '200000',
      amount: [
        {
          denom: NEUTRON_DENOM,
          amount: `${Math.ceil((1000 * amount) / 750)}`,
        },
      ],
    };

    return this.client.sendTokens(
      this.sender,
      this.sender,
      [{ denom: NEUTRON_DENOM, amount: '1' }],
      fee,
    );
  }
}
