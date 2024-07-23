import {
  AckFailuresResponse,
  CodeId,
  Wallet,
} from '@neutron-org/neutronjsplus/dist/types';
import { IndexedTx } from '@cosmjs/stargate';
import {
  MigrateResult,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate';
import { promises as fsPromise } from 'fs';
import path from 'path';
import { Coin, Registry } from '@cosmjs/proto-signing';
import { CONTRACTS_PATH } from './setup';
import { DenomTraceResponse } from './types';

// creates a wasm wrapper
export async function wasm(
  rpc: string,
  wallet: Wallet,
  denom: string,
  registry: Registry,
): Promise<WasmWrapper> {
  const client = await SigningCosmWasmClient.connectWithSigner(
    rpc,
    wallet.directwallet,
    { registry },
  );
  return new WasmWrapper(wallet, client, registry, CONTRACTS_PATH, denom);
}

// WasmWrapper simplifies cosmwasm operations for tests
export class WasmWrapper {
  constructor(
    public wallet: Wallet,
    public client: SigningCosmWasmClient,
    public registry: Registry,
    public contractsPath: string,
    public denom: string,
  ) {}

  async upload(
    fileName: string,
    fee = {
      amount: [{ denom: this.denom, amount: '250000' }],
      gas: '60000000',
    },
  ): Promise<CodeId> {
    const sender = this.wallet.address;
    const wasmCode = await this.getContract(fileName);
    const res = await this.client.upload(sender, wasmCode, fee);
    return res.codeId;
  }

  async instantiate(
    codeId: number,
    msg: any,
    label = 'nonfilled',
    fee = {
      amount: [{ denom: this.denom, amount: '2000000' }],
      gas: '600000000',
    },
    admin: string = this.wallet.address,
  ): Promise<string> {
    const res = await this.client.instantiate(
      this.wallet.address,
      codeId,
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
    fee = {
      gas: '5000000',
      amount: [{ denom: this.denom, amount: '20000' }],
    },
  ): Promise<MigrateResult> {
    const sender = this.wallet.address;
    return await this.client.migrate(sender, contract, codeId, msg, fee);
  }

  async execute(
    contract: string,
    msg: any,
    funds: Coin[] = [],
    fee = {
      gas: '4000000',
      amount: [{ denom: this.denom, amount: '10000' }],
    },
  ): Promise<IndexedTx> {
    const sender = this.wallet.address;
    const res = await this.client.execute(
      sender,
      contract,
      msg,
      fee,
      '',
      funds,
    );
    return await this.client.getTx(res.transactionHash);
  }

  async getContract(fileName: string): Promise<Buffer> {
    return fsPromise.readFile(path.resolve(this.contractsPath, fileName));
  }
}
