import { promises as fsPromise } from 'fs';
import { cosmosclient, rest, proto } from '@cosmos-client/core';
import { AccAddress } from '@cosmos-client/core/cjs/types';
import { cosmwasmproto } from '@cosmos-client/cosmwasm';
import axios from 'axios';
import { Wallet, CodeId } from '../types';
import Long from 'long';
import path from 'path';
import { wait } from './sleep';
import { CosmosTxV1beta1GetTxResponse } from '@cosmos-client/core/cjs/openapi/api';

const DENOM = process.env.DENOM || 'stake';
export const BLOCK_TIME = parseInt(process.env.BLOCK_TIME || '1000');

type ChannelsList = {
  channels: {
    state: string;
    ordering: string;
    counterparty: {
      port_id: string;
      channel_id: string;
    };
    connection_hops: string[];
    version: string;
    port_id: string;
    channel_id: string;
  }[];
};

// BalancesResponse is the response model for the bank balances query.
type BalancesResponse = {
  balances: Balance[],
  pagination: {
    next_key: string,
    total: string,
  }
}

// Balance represents a single asset balance of an account.
type Balance = {
  denom: string,
  amount: string,
}

export class CosmosWrapper {
  sdk: cosmosclient.CosmosSDK;
  wallet: Wallet;
  denom: string;
  constructor(sdk: cosmosclient.CosmosSDK, wallet: Wallet) {
    this.denom = DENOM;
    this.sdk = sdk;
    this.wallet = wallet;
  }

  async execTx<T>(
    msg: T,
    fee: proto.cosmos.tx.v1beta1.IFee,
  ): Promise<CosmosTxV1beta1GetTxResponse> {
    const txBody = new proto.cosmos.tx.v1beta1.TxBody({
      messages: [cosmosclient.codec.instanceToProtoAny(msg)],
    });
    const authInfo = new proto.cosmos.tx.v1beta1.AuthInfo({
      signer_infos: [
        {
          public_key: cosmosclient.codec.instanceToProtoAny(this.wallet.pubKey),
          mode_info: {
            single: {
              mode: proto.cosmos.tx.signing.v1beta1.SignMode.SIGN_MODE_DIRECT,
            },
          },
          sequence: this.wallet.account.sequence,
        },
      ],
      fee,
    });
    const txBuilder = new cosmosclient.TxBuilder(this.sdk, txBody, authInfo);

    const signDocBytes = txBuilder.signDocBytes(
      this.wallet.account.account_number,
    );

    txBuilder.addSignature(this.wallet.privKey.sign(signDocBytes));
    const res = await rest.tx.broadcastTx(this.sdk, {
      tx_bytes: txBuilder.txBytes(),
      mode: rest.tx.BroadcastTxMode.Sync,
    });

    const code = res.data?.tx_response.code;
    if (code !== 0) {
      throw new Error(`broadcast error: ${res.data?.tx_response.raw_log}`);
    }
    const txhash = res.data?.tx_response.txhash;
    await wait(2 * BLOCK_TIME);
    this.wallet.account.sequence++;
    const data = (await rest.tx.getTx(this.sdk, txhash)).data;

    return data;
  }

  // storeWasm stores the wasm code by the passed path on the blockchain.
  async storeWasm(fileName: string): Promise<CodeId> {
    const contractPath = process.env.CONTRACTS_PATH || './contracts/artifacts';
    const msg = new cosmwasmproto.cosmwasm.wasm.v1.MsgStoreCode({
      sender: this.wallet.address.toString(),
      wasm_byte_code: await fsPromise.readFile(
        path.resolve(contractPath, fileName),
      ),
      instantiate_permission: null,
    });
    const data = await this.execTx(msg, {
      amount: [{ denom: DENOM, amount: '250000' }],
      gas_limit: Long.fromString('60000000'),
    });

    const attributes = getEventAttributesFromTx(data, 'store_code', [
      'code_id',
    ]);

    return attributes.code_id;
  }

  async instantiate(
    codeId: string,
    msg: string | null = null,
    label: string | null = null,
  ): Promise<string> {
    const msgInit = new cosmwasmproto.cosmwasm.wasm.v1.MsgInstantiateContract({
      code_id: codeId,
      sender: this.wallet.address.toString(),
      admin: this.wallet.address.toString(),
      label,
      msg: Buffer.from(msg),
    });
    const data = await this.execTx(msgInit, {
      amount: [{ denom: DENOM, amount: '2000000' }],
      gas_limit: Long.fromString('600000000'),
    });

    const attributes = getEventAttributesFromTx(data, 'instantiate', [
      '_contract_address',
    ]);
    return attributes._contract_address;
  }

  async executeContract(
    contract: string,
    msg: string,
    funds: proto.cosmos.base.v1beta1.ICoin[] = [],
  ): Promise<string> {
    const msgExecute = new cosmwasmproto.cosmwasm.wasm.v1.MsgExecuteContract({
      sender: this.wallet.address.toString(),
      contract,
      msg: Buffer.from(msg),
      funds,
    });
    const res = await this.execTx(msgExecute, {
      gas_limit: Long.fromString('2000000'),
      amount: [{ denom: this.denom, amount: '10000' }],
    });
    if (res.tx_response.code !== 0) {
      throw new Error(res.tx_response.raw_log);
    }
    return res?.tx_response.txhash;
  }

  async queryContract<T>(
    contract: string,
    query: Record<string, unknown>,
  ): Promise<T> {
    const req = await axios.get<{
      result: { smart: string };
      height: number;
    }>(
      `${this.sdk.url}/wasm/contract/${contract}/smart/${Buffer.from(
        JSON.stringify(query),
      ).toString('base64')}?encoding=base64`,
    );
    return JSON.parse(
      Buffer.from(req.data.result.smart, 'base64').toString(),
    ) as T;
  }

  async msgSend(to: string, amount: string): Promise<string> {
    const msgSend = new proto.cosmos.bank.v1beta1.MsgSend({
      from_address: this.wallet.address.toString(),
      to_address: to,
      amount: [{ denom: this.denom, amount }],
    });
    const res = await this.execTx(msgSend, {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: this.denom, amount: '1000' }],
    });
    return res?.tx_response.txhash;
  }

  async queryBalances(addr: string): Promise<BalancesResponse> {
    let balances = await rest.bank.allBalances(this.sdk, addr as unknown as AccAddress);
    return balances.data as BalancesResponse;
  }

  async listIBCChannels(): Promise<ChannelsList> {
    const req = await axios.get<ChannelsList>(
      `${this.sdk.url}/ibc/core/channel/v1/channels`,
    );
    return req.data;
  }
}

type TxResponseType = Awaited<ReturnType<typeof rest.tx.getTx>>;

export const getEventAttributesFromTx = (
  data: TxResponseType['data'],
  event: string,
  attributes: string[],
): Record<typeof attributes[number], string> | Record<string, never> => {
  const events =
    (
      JSON.parse(data?.tx_response.raw_log) as [
        {
          events: [
            { type: string; attributes: [{ key: string; value: string }] },
          ];
        },
      ]
    )[0].events || [];
  const out = {};
  for (const e of events) {
    if (event === e.type) {
      for (const a of e.attributes) {
        if (attributes.includes(a.key)) {
          out[a.key] = a.value;
        }
      }
    }
  }
  return out;
};

export const mnemonicToWallet = async (
  walletType: {
    fromPublicKey: (
      k: cosmosclient.PubKey,
    ) => cosmosclient.AccAddress | cosmosclient.ValAddress;
  },
  sdk: cosmosclient.CosmosSDK,
  mnemonic: string,
): Promise<Wallet> => {
  const privKey = new proto.cosmos.crypto.secp256k1.PrivKey({
    key: await cosmosclient.generatePrivKeyFromMnemonic(mnemonic),
  });

  const pubKey = privKey.pubKey();
  const address = walletType.fromPublicKey(pubKey);
  let account = null;
  // eslint-disable-next-line no-prototype-builtins
  if (cosmosclient.ValAddress !== walletType) {
    account = await rest.auth
      .account(sdk, address)
      .then((res) =>
        cosmosclient.codec.protoJSONToInstance(
          cosmosclient.codec.castProtoJSONOfProtoAny(res.data.account),
        ),
      )
      .catch((e) => {
        console.log(e);
        throw e;
      });

    if (!(account instanceof proto.cosmos.auth.v1beta1.BaseAccount)) {
      throw new Error("can't get account");
    }
  }
  return {
    address,
    account,
    pubKey,
    privKey,
  };
};
