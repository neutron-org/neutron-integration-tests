import {
  AminoTypes,
  DeliverTxResponse,
  IndexedTx,
  StdFee,
} from '@cosmjs/stargate';
import { CosmWasmClient, MigrateResult } from '@cosmjs/cosmwasm-stargate';
import { promises as fsPromise } from 'fs';
import path from 'path';
import { Coin, EncodeObject, Registry } from '@cosmjs/proto-signing';
import { CONTRACTS_PATH } from './setup';
import { CometClient, connectComet } from '@cosmjs/tendermint-rpc';
import { GasPrice } from '@cosmjs/stargate';
import {
  waitBlocks,
  getWithAttempts,
  queryContractWithWait,
} from '@neutron-org/neutronjsplus/dist/wait';
import { NEUTRON_DENOM, NEUTRON_RPC } from './constants';
import { neutronTypes } from './registry_types';
import {
  Signer,
  SigningNeutronClient,
} from '@neutron-org/neutronjsplus/dist/signing_neutron_client';
import { Wallet } from './wallet';
import { aminoConverters } from '@neutron-org/neutronjsplus/dist/amino';
import { Eip191Signer } from '@neutron-org/neutronjsplus/dist/eip191_signer';
import {
  DirectSignerAdapter,
  Eip191SignerAdapter,
} from '@neutron-org/neutronjsplus/dist/signer_adapters';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';

// SigningNeutronClient simplifies tests operations for
// storing, instantiating, migrating, executing contracts, executing transactions,
// and also for basic queries, like getHeight, getBlock, or getTx
export class NeutronTestClient extends CosmWasmClient {
  // creates a SigningNeutronClient
  static async connectWithSigner(wallet: Wallet, rpc: string = NEUTRON_RPC) {
    const options = {
      registry: new Registry(neutronTypes),
      gasPrice: GasPrice.fromString('0.05untrn'),
    };
    const aminoTypes = new AminoTypes(aminoConverters);
    const registry = new Registry(neutronTypes);
    let adapter: Signer;
    if (wallet.signerKind === 'secp256k1') {
      adapter = new DirectSignerAdapter(
        wallet.signer as OfflineDirectSigner,
        registry,
      );
    } else if (wallet.signerKind === 'eip191') {
      adapter = new Eip191SignerAdapter(
        wallet.signer as Eip191Signer,
        aminoTypes,
        registry,
      );
    } else {
      throw new Error('Unexpected wallet signerKind: ' + wallet.signerKind);
    }
    const neutronClient = await SigningNeutronClient.connectWithSigner(
      rpc,
      adapter,
      options,
    );
    const cometClient = await connectComet(rpc);
    return new NeutronTestClient(
      rpc,
      wallet.address,
      neutronClient,
      CONTRACTS_PATH,
      cometClient,
    );
  }

  protected constructor(
    public readonly rpc: string,
    public readonly sender: string,
    public readonly client: SigningNeutronClient,
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
    const resTx = await this.client.getTx(res.transactionHash);

    if (resTx === null) {
      return Promise.reject(
        'no transaction found with hash=' + res.transactionHash,
      );
    }

    return resTx;
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
