import cosmosclient from '@cosmos-client/core';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import cosmwasmclient from '@cosmos-client/cosmwasm';
import { cosmos as AdminProto, ibc as ibcProto } from '../generated/ibc/proto';
import { pob } from '../generated/pob/proto';
import { neutron } from '../generated/proto';
import axios from 'axios';
import { CodeId, Wallet } from '../types';
import Long from 'long';
import { BlockWaiter, getWithAttempts } from './wait';
import {
  BroadcastTx200ResponseTxResponse,
  CosmosTxV1beta1GetTxResponse,
} from '@cosmos-client/core/cjs/openapi/api';
import { cosmos, google } from '@cosmos-client/core/cjs/proto';
import { CosmosSDK } from '@cosmos-client/core/cjs/sdk';
import { ibc } from '@cosmos-client/ibc/cjs/proto';
import crypto from 'crypto';
import ICoin = cosmos.base.v1beta1.ICoin;
import IHeight = ibc.core.client.v1.IHeight;
import {
  AckFailuresResponse,
  ScheduleResponse,
  ChannelsList,
  PageRequest,
  PauseInfoResponse,
  CurrentPlanResponse,
  PinnedCodesResponse,
  IcaHostParamsResponse,
  GlobalfeeParamsResponse,
  InterchaintxsParamsResponse,
} from './types';
import { DEBUG_SUBMIT_TX, getContractBinary } from './env';
const adminmodule = AdminProto.adminmodule.adminmodule;

export const NEUTRON_DENOM = process.env.NEUTRON_DENOM || 'untrn';
export const IBC_ATOM_DENOM = process.env.IBC_ATOM_DENOM || 'uibcatom';
export const IBC_USDC_DENOM = process.env.IBC_USDC_DENOM || 'uibcusdc';
export const COSMOS_DENOM = process.env.COSMOS_DENOM || 'uatom';
export const IBC_RELAYER_NEUTRON_ADDRESS =
  'neutron1mjk79fjjgpplak5wq838w0yd982gzkyf8fxu8u';
export const ADMIN_MODULE_ADDRESS =
  'neutron1hxskfdxpp5hqgtjj6am6nkjefhfzj359x0ar3z';

// BalancesResponse is the response model for the bank balances query.
type BalancesResponse = {
  balances: ICoin[];
  pagination: {
    next_key: string;
    total: string;
  };
};

// DenomTraceResponse is the response model for the ibc transfer denom trace query.
type DenomTraceResponse = {
  path?: string;
  base_denom?: string;
};

export type TotalSupplyByDenomResponse = {
  amount: ICoin;
};

// TotalBurnedNeutronsAmountResponse is the response model for the feeburner's total-burned-neutrons.
export type TotalBurnedNeutronsAmountResponse = {
  total_burned_neutrons_amount: {
    coin: ICoin;
  };
};

cosmosclient.codec.register(
  '/neutron.interchainqueries.MsgRemoveInterchainQueryRequest',
  neutron.interchainqueries.MsgRemoveInterchainQueryRequest,
);
cosmosclient.codec.register(
  '/cosmos.params.v1beta1.ParameterChangeProposal',
  cosmosclient.proto.cosmos.params.v1beta1.ParameterChangeProposal,
);
cosmosclient.codec.register(
  '/neutron.interchainqueries.MsgRemoveInterchainQueryRequest',
  neutron.interchainqueries.MsgRemoveInterchainQueryRequest,
);
cosmosclient.codec.register(
  '/cosmos.params.v1beta1.ParameterChangeProposal',
  cosmosclient.proto.cosmos.params.v1beta1.ParameterChangeProposal,
);
cosmosclient.codec.register(
  '/ibc.applications.transfer.v1.MsgTransfer',
  ibcProto.applications.transfer.v1.MsgTransfer,
);
cosmosclient.codec.register(
  '/cosmos.adminmodule.adminmodule.MsgSubmitProposal',
  adminmodule.MsgSubmitProposal,
);
cosmosclient.codec.register(
  '/cosmos.adminmodule.adminmodule.MsgSubmitProposalLegacy',
  adminmodule.MsgSubmitProposalLegacy,
);
cosmosclient.codec.register(
  '/ibc.lightclients.tendermint.v1.ClientState',
  ibcProto.lightclients.tendermint.v1.ClientState,
);
cosmosclient.codec.register(
  '/pob.builder.v1.MsgAuctionBid',
  pob.builder.v1.MsgAuctionBid,
);
cosmosclient.codec.register(
  '/neutron.interchaintxs.v1.MsgUpdateParams',
  neutron.interchaintxs.v1.MsgUpdateParams,
);

export class CosmosWrapper {
  readonly sdk: cosmosclient.CosmosSDK;
  readonly blockWaiter: BlockWaiter;
  readonly denom: string;

  constructor(
    sdk: cosmosclient.CosmosSDK,
    blockWaiter: BlockWaiter,
    denom: string,
  ) {
    this.denom = denom;
    this.sdk = sdk;
    this.blockWaiter = blockWaiter;
  }

  async queryContractWithWait<T>(
    contract: string,
    query: Record<string, unknown>,
    numAttempts = 20,
  ): Promise<T> {
    while (numAttempts > 0) {
      const res: T = await this.queryContract<T>(contract, query).catch(
        () => null,
      );

      if (res !== null) {
        return res;
      }

      numAttempts--;
      await this.blockWaiter.waitBlocks(1);
    }

    throw new Error('failed to query contract');
  }

  async queryContract<T>(
    contract: string,
    query: Record<string, unknown>,
  ): Promise<T> {
    const url = `${
      this.sdk.url
    }/cosmwasm/wasm/v1/contract/${contract}/smart/${Buffer.from(
      JSON.stringify(query),
    ).toString('base64')}?encoding=base64`;
    const resp = await axios.get(url).catch((error) => {
      if (error.response) {
        throw new Error(
          `Status: ${JSON.stringify(error.response.status)} \n` +
            `Response: ${JSON.stringify(error.response.data)} \n` +
            `Headers: ${JSON.stringify(error.response.headers)}`,
        );
      } else if (error.request) {
        throw new Error(error.request);
      }
      throw new Error('Error: ' + error.message);
    });
    return resp.data.data as T;
  }

  async getContractInfo(contract: string): Promise<any> {
    const url = `${this.sdk.url}/cosmwasm/wasm/v1/contract/${contract}`;
    try {
      const resp = await axios.get(url);
      return resp.data;
    } catch (e) {
      throw new Error(e.response?.data?.message);
    }
  }

  async getSeq(address: cosmosclient.AccAddress): Promise<number> {
    const account = await cosmosclient.rest.auth
      .account(this.sdk, address)
      .then((res) =>
        cosmosclient.codec.protoJSONToInstance(
          cosmosclient.codec.castProtoJSONOfProtoAny(res.data.account),
        ),
      )
      .catch((e) => {
        console.log(e);
        throw e;
      });

    if (
      !(account instanceof cosmosclient.proto.cosmos.auth.v1beta1.BaseAccount)
    ) {
      throw new Error("can't get account");
    }

    return account.sequence;
  }

  async queryInterchainqueriesParams(): Promise<any> {
    const req = await axios.get(
      `${this.sdk.url}/neutron/interchainqueries/params`,
    );

    return req.data;
  }

  async queryDelegations(delegatorAddr: cosmosclient.AccAddress): Promise<any> {
    const balances = await cosmosclient.rest.staking.delegatorDelegations(
      this.sdk,
      delegatorAddr,
    );
    return balances.data;
  }

  async queryBalances(addr: string): Promise<BalancesResponse> {
    const balances = await cosmosclient.rest.bank.allBalances(
      this.sdk,
      addr as unknown as AccAddress,
    );
    return balances.data as BalancesResponse;
  }

  async queryDenomBalance(
    addr: string | AccAddress | ValAddress,
    denom: string,
  ): Promise<number> {
    const { data } = await cosmosclient.rest.bank.allBalances(
      this.sdk,
      addr.toString() as unknown as AccAddress,
    );
    const balance = data.balances.find((b) => b.denom === denom);
    return parseInt(balance?.amount ?? '0', 10);
  }

  async queryDenomTrace(ibcDenom: string): Promise<DenomTraceResponse> {
    const data = axios.get<{ denom_trace: DenomTraceResponse }>(
      `${this.sdk.url}/ibc/apps/transfer/v1/denom_traces/${ibcDenom}`,
    );
    return data.then((res) => res.data.denom_trace);
  }

  async queryAckFailures(
    addr: string,
    pagination?: PageRequest,
  ): Promise<AckFailuresResponse> {
    try {
      const req = await axios.get<AckFailuresResponse>(
        `${this.sdk.url}/neutron/contractmanager/failures/${addr}`,
        { params: pagination },
      );
      return req.data;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  async listIBCChannels(): Promise<ChannelsList> {
    const res = await axios.get<ChannelsList>(
      `${this.sdk.url}/ibc/core/channel/v1/channels`,
    );
    return res.data;
  }

  async queryTotalBurnedNeutronsAmount(): Promise<TotalBurnedNeutronsAmountResponse> {
    try {
      const req = await axios.get<TotalBurnedNeutronsAmountResponse>(
        `${this.sdk.url}/neutron/feeburner/total_burned_neutrons_amount`,
      );
      return req.data;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  async queryTotalSupplyByDenom(
    denom: string,
  ): Promise<TotalSupplyByDenomResponse> {
    try {
      const req = await axios.get<TotalSupplyByDenomResponse>(
        `${this.sdk.url}/cosmos/bank/v1beta1/supply/by_denom?denom=${denom}`,
      );
      return req.data;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  async getChainAdmins() {
    const url = `${this.sdk.url}/cosmos/adminmodule/adminmodule/admins`;
    const resp = await axios.get<{
      admins: [string];
    }>(url);
    return resp.data.admins;
  }

  async queryPausedInfo(addr: string): Promise<PauseInfoResponse> {
    return await this.queryContract<PauseInfoResponse>(addr, {
      pause_info: {},
    });
  }

  async getWithAttempts<T>(
    getFunc: () => Promise<T>,
    readyFunc: (t: T) => Promise<boolean>,
    numAttempts = 20,
  ): Promise<T> {
    return await getWithAttempts(
      this.blockWaiter,
      getFunc,
      readyFunc,
      numAttempts,
    );
  }

  async getCodeDataHash(codeId: number): Promise<string> {
    try {
      const res = await axios.get(
        `${this.sdk.url}/cosmwasm/wasm/v1/code/${codeId}`,
      );
      return res.data.code_info.data_hash;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  async querySchedules(pagination?: PageRequest): Promise<ScheduleResponse> {
    try {
      const req = await axios.get<ScheduleResponse>(
        `${this.sdk.url}/neutron/cron/schedule`,
        { params: pagination },
      );
      return req.data;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  async queryCurrentUpgradePlan(): Promise<CurrentPlanResponse> {
    try {
      const req = await axios.get<CurrentPlanResponse>(
        `${this.sdk.url}/cosmos/upgrade/v1beta1/current_plan`,
        {},
      );
      return req.data;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  async queryPinnedCodes(): Promise<PinnedCodesResponse> {
    try {
      const req = await axios.get<PinnedCodesResponse>(
        `${this.sdk.url}/cosmwasm/wasm/v1/codes/pinned`,
        {},
      );
      return req.data;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  async queryHostEnabled(): Promise<boolean> {
    try {
      const req = await axios.get<IcaHostParamsResponse>(
        `${this.sdk.url}/ibc/apps/interchain_accounts/host/v1/params`,
        {},
      );
      return req.data.params.host_enabled;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  async queryMaxTxsAllowed(): Promise<string> {
    try {
      const req = await axios.get<InterchaintxsParamsResponse>(
        `${this.sdk.url}/neutron/interchaintxs/params`,
        {},
      );
      return req.data.params.msg_submit_tx_max_messages;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }

  async queryGlobalfeeParams(): Promise<GlobalfeeParamsResponse> {
    const req = await axios.get(
      `${this.sdk.url}/gaia/globalfee/v1beta1/params`,
    );

    return req.data.params;
  }

  async queryContractAdmin(address: string): Promise<string> {
    const resp = await this.getContractInfo(address);
    return resp.contract_info.admin;
  }
}

export class WalletWrapper {
  readonly chain: CosmosWrapper;
  readonly wallet: Wallet;

  constructor(cw: CosmosWrapper, wallet: Wallet) {
    this.chain = cw;
    this.wallet = wallet;
  }

  async queryBalances(): Promise<BalancesResponse> {
    return await this.chain.queryBalances(this.wallet.address.toString());
  }

  async queryDenomBalance(denom: string): Promise<number> {
    return await this.chain.queryDenomBalance(
      this.wallet.address.toString(),
      denom,
    );
  }

  buildTx<T>(
    fee: cosmosclient.proto.cosmos.tx.v1beta1.IFee,
    msgs: T[],
    sequence: number = this.wallet.account.sequence,
  ): cosmosclient.TxBuilder {
    const protoMsgs: Array<google.protobuf.IAny> = [];
    msgs.forEach((msg) => {
      protoMsgs.push(cosmosclient.codec.instanceToProtoAny(msg));
    });
    const txBody = new cosmosclient.proto.cosmos.tx.v1beta1.TxBody({
      messages: protoMsgs,
      // TODO: set dynamic value?
      timeout_height: 1_000_000_000,
    });
    const authInfo = new cosmosclient.proto.cosmos.tx.v1beta1.AuthInfo({
      signer_infos: [
        {
          public_key: cosmosclient.codec.instanceToProtoAny(this.wallet.pubKey),
          mode_info: {
            single: {
              mode: cosmosclient.proto.cosmos.tx.signing.v1beta1.SignMode
                .SIGN_MODE_DIRECT,
            },
          },
          sequence,
        },
      ],
      fee,
    });
    const txBuilder = new cosmosclient.TxBuilder(
      this.chain.sdk as CosmosSDK,
      txBody,
      authInfo,
    );
    const signDocBytes = txBuilder.signDocBytes(
      this.wallet.account.account_number,
    );
    txBuilder.addSignature(this.wallet.privKey.sign(signDocBytes));
    return txBuilder;
  }

  async broadcastTx(
    txBuilder: cosmosclient.TxBuilder,
    mode: cosmosclient.rest.tx.BroadcastTxMode = cosmosclient.rest.tx
      .BroadcastTxMode.Sync,
  ): Promise<string> {
    if (DEBUG_SUBMIT_TX) {
      console.log('\n\n\nStart broadcasting tx: ----------------------');
      try {
        console.log(JSON.stringify(txBuilder.toProtoJSON()));
      } catch (error) {
        console.log('failed to serrialize tx');
      }
    }
    const res = await cosmosclient.rest.tx.broadcastTx(
      this.chain.sdk as CosmosSDK,
      {
        tx_bytes: txBuilder.txBytes(),
        mode,
      },
    );
    const code = res.data?.tx_response.code;
    if (DEBUG_SUBMIT_TX) {
      console.log('async response code: ', code);
    }
    if (code !== 0) {
      if (DEBUG_SUBMIT_TX) {
        console.log(`broadcast error: ${res.data?.tx_response.raw_log}`);
      }
      throw new Error(`broadcast error: ${res.data?.tx_response.raw_log}`);
    }
    const txhash = res.data?.tx_response.txhash;
    this.wallet.account.sequence++;
    return txhash;
  }

  /**
   * execTx broadcasts messages and returns the transaction result.
   */
  async execTx<T>(
    fee: cosmosclient.proto.cosmos.tx.v1beta1.IFee,
    msgs: T[],
    numAttempts = 10,
    mode: cosmosclient.rest.tx.BroadcastTxMode = cosmosclient.rest.tx
      .BroadcastTxMode.Sync,
    sequence: number = this.wallet.account.sequence,
  ): Promise<CosmosTxV1beta1GetTxResponse> {
    const txBuilder = this.buildTx(fee, msgs, sequence);
    const txhash = await this.broadcastTx(txBuilder, mode);
    if (DEBUG_SUBMIT_TX) {
      console.log('tx hash: ', txhash);
    }
    let error = null;
    while (numAttempts > 0) {
      await this.chain.blockWaiter.waitBlocks(1);
      numAttempts--;
      const data = await cosmosclient.rest.tx
        .getTx(this.chain.sdk as CosmosSDK, txhash)
        .catch((reason) => {
          error = reason;
          return null;
        });
      if (data != null) {
        if (DEBUG_SUBMIT_TX) {
          const code = +data.data?.tx_response.code;
          console.log('response code: ', code);
          if (code > 0) {
            console.log('\x1b[31m error log: ', data.data?.tx_response.raw_log);
          }
          console.log('response: ', JSON.stringify(data.data));
        }
        return data.data;
      }
    }
    error = error ?? new Error('failed to submit tx');
    throw error;
  }

  // storeWasm stores the wasm code by the passed path on the blockchain.
  async storeWasm(fileName: string): Promise<CodeId> {
    const msg = new cosmwasmclient.proto.cosmwasm.wasm.v1.MsgStoreCode({
      sender: this.wallet.address.toString(),
      wasm_byte_code: await getContractBinary(fileName),
      instantiate_permission: null,
    });
    const data = await this.execTx(
      {
        amount: [{ denom: NEUTRON_DENOM, amount: '250000' }],
        gas_limit: Long.fromString('60000000'),
      },
      [msg],
    );

    if (data.tx_response.code !== 0) {
      throw new Error(`upload error: ${data.tx_response.raw_log}`);
    }

    const attributes = getEventAttributesFromTx(data, 'store_code', [
      'code_id',
    ]);

    return parseInt(attributes[0].code_id);
  }

  async instantiateContract(
    codeId: number,
    msg: string,
    label: string,
    admin: string = this.wallet.address.toString(),
  ): Promise<Array<Record<string, string>>> {
    const msgInit =
      new cosmwasmclient.proto.cosmwasm.wasm.v1.MsgInstantiateContract({
        code_id: codeId + '',
        sender: this.wallet.address.toString(),
        admin: admin,
        label,
        msg: Buffer.from(msg),
      });

    const data = await this.execTx(
      {
        amount: [{ denom: NEUTRON_DENOM, amount: '2000000' }],
        gas_limit: Long.fromString('600000000'),
      },
      [msgInit],
      10,
      cosmosclient.rest.tx.BroadcastTxMode.Sync,
    );

    if (data.tx_response.code !== 0) {
      throw new Error(`instantiate error: ${data.tx_response.raw_log}`);
    }

    return getEventAttributesFromTx(data, 'instantiate', [
      '_contract_address',
      'code_id',
    ]);
  }

  async migrateContract(
    contract: string,
    codeId: number,
    msg: string | Record<string, unknown>,
  ): Promise<BroadcastTx200ResponseTxResponse> {
    const sender = this.wallet.address.toString();
    const msgMigrate =
      new cosmwasmclient.proto.cosmwasm.wasm.v1.MsgMigrateContract({
        sender,
        contract,
        code_id: codeId + '',
        msg: Buffer.from(typeof msg === 'string' ? msg : JSON.stringify(msg)),
      });
    const res = await this.execTx(
      {
        gas_limit: Long.fromString('5000000'),
        amount: [{ denom: this.chain.denom, amount: '20000' }],
      },
      [msgMigrate],
    );
    if (res.tx_response.code !== 0) {
      throw new Error(
        `${res.tx_response.raw_log}\nFailed tx hash: ${res.tx_response.txhash}`,
      );
    }
    return res?.tx_response;
  }

  async executeContract(
    contract: string,
    msg: string,
    funds: cosmosclient.proto.cosmos.base.v1beta1.ICoin[] = [],
    fee = {
      gas_limit: Long.fromString('4000000'),
      amount: [{ denom: this.chain.denom, amount: '10000' }],
    },
  ): Promise<BroadcastTx200ResponseTxResponse> {
    const sender = this.wallet.address.toString();
    const msgExecute =
      new cosmwasmclient.proto.cosmwasm.wasm.v1.MsgExecuteContract({
        sender,
        contract,
        msg: Buffer.from(msg),
        funds,
      });

    const res = await this.execTx(fee, [msgExecute]);
    if (res.tx_response.code !== 0) {
      throw new Error(
        `${res.tx_response.raw_log}\nFailed tx hash: ${res.tx_response.txhash}`,
      );
    }
    return res?.tx_response;
  }

  /**
   * msgSend processes a transfer, waits two blocks and returns the tx hash.
   */
  async msgSend(
    to: string,
    coin:
      | {
          amount: string;
          denom?: string;
        }
      | string,
    fee = {
      gas_limit: Long.fromString('300000'),
      amount: [{ denom: this.chain.denom, amount: '1500' }],
    },
    sequence: number = this.wallet.account.sequence,
    mode: cosmosclient.rest.tx.BroadcastTxMode = cosmosclient.rest.tx
      .BroadcastTxMode.Sync,
  ): Promise<BroadcastTx200ResponseTxResponse> {
    const { amount, denom = this.chain.denom } =
      typeof coin === 'string' ? { amount: coin } : coin;
    const msgSend = new cosmosclient.proto.cosmos.bank.v1beta1.MsgSend({
      from_address: this.wallet.address.toString(),
      to_address: to,
      amount: [{ denom, amount }],
    });
    const res = await this.execTx(fee, [msgSend], 10, mode, sequence);
    return res?.tx_response;
  }

  async msgSendDirectProposal(
    subspace: string,
    key: string,
    value: string,
    fee = {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: this.chain.denom, amount: '1000' }],
    },
    sequence: number = this.wallet.account.sequence,
    mode: cosmosclient.rest.tx.BroadcastTxMode = cosmosclient.rest.tx
      .BroadcastTxMode.Sync,
  ): Promise<BroadcastTx200ResponseTxResponse> {
    const msg = new adminmodule.MsgSubmitProposalLegacy({
      content: cosmosclient.codec.instanceToProtoAny(
        new cosmosclient.proto.cosmos.params.v1beta1.ParameterChangeProposal({
          title: 'mock',
          description: 'mock',
          changes: [
            new cosmosclient.proto.cosmos.params.v1beta1.ParamChange({
              key: key,
              subspace: subspace,
              value: value,
            }),
          ],
        }),
      ),
      proposer: this.wallet.account.address,
    });
    const res = await this.execTx(fee, [msg], 10, mode, sequence);
    return res?.tx_response;
  }

  async msgSendAuction(
    bidder: string,
    bid: ICoin,
    transactions: Uint8Array[],
    fee = {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: this.chain.denom, amount: '1000' }],
    },
    sequence: number = this.wallet.account.sequence,
    mode: cosmosclient.rest.tx.BroadcastTxMode = cosmosclient.rest.tx
      .BroadcastTxMode.Sync,
  ): Promise<BroadcastTx200ResponseTxResponse> {
    const msg = new pob.builder.v1.MsgAuctionBid({
      bidder: bidder,
      bid: bid,
      transactions: transactions,
    });
    const res = await this.execTx(fee, [msg], 10, mode, sequence);
    return res?.tx_response;
  }

  /**
   * Tests a pausable contract execution control.
   * @param testingContract is the contract the method tests;
   * @param execAction is an executable action to be called during a pause and after unpausing
   * as the main part of the test. Should return the execution response code;
   * @param actionCheck is called after unpausing to make sure the executable action worked.
   */
  async testExecControl(
    testingContract: string,
    execAction: () => Promise<number | undefined>,
    actionCheck: () => Promise<void>,
  ) {
    // check contract's pause info before pausing
    let pauseInfo = await this.chain.queryPausedInfo(testingContract);
    expect(pauseInfo).toEqual({ unpaused: {} });
    expect(pauseInfo.paused).toEqual(undefined);

    // pause contract
    let res = await this.executeContract(
      testingContract,
      JSON.stringify({
        pause: {
          duration: 50,
        },
      }),
    );
    expect(res.code).toEqual(0);

    // check contract's pause info after pausing
    pauseInfo = await this.chain.queryPausedInfo(testingContract);
    expect(pauseInfo.unpaused).toEqual(undefined);
    expect(pauseInfo.paused.until_height).toBeGreaterThan(0);

    // execute msgs on paused contract
    await expect(execAction()).rejects.toThrow(/Contract execution is paused/);

    // unpause contract
    res = await this.executeContract(
      testingContract,
      JSON.stringify({
        unpause: {},
      }),
    );
    expect(res.code).toEqual(0);

    // check contract's pause info after unpausing
    pauseInfo = await this.chain.queryPausedInfo(testingContract);
    expect(pauseInfo).toEqual({ unpaused: {} });
    expect(pauseInfo.paused).toEqual(undefined);

    // execute msgs on unpaused contract
    const code = await execAction();
    expect(code).toEqual(0);
    await actionCheck();

    // pause contract again for a short period
    const shortPauseDuration = 5;
    res = await this.executeContract(
      testingContract,
      JSON.stringify({
        pause: {
          duration: shortPauseDuration,
        },
      }),
    );
    expect(res.code).toEqual(0);

    // check contract's pause info after pausing
    pauseInfo = await this.chain.queryPausedInfo(testingContract);
    expect(pauseInfo.unpaused).toEqual(undefined);
    expect(pauseInfo.paused.until_height).toBeGreaterThan(0);

    // wait and check contract's pause info after unpausing
    await this.chain.blockWaiter.waitBlocks(shortPauseDuration);
    pauseInfo = await this.chain.queryPausedInfo(testingContract);
    expect(pauseInfo).toEqual({ unpaused: {} });
    expect(pauseInfo.paused).toEqual(undefined);
  }

  /* simulateFeeBurning simulates fee burning via send tx.
   */
  async simulateFeeBurning(
    amount: number,
  ): Promise<BroadcastTx200ResponseTxResponse> {
    const msgSend = new cosmosclient.proto.cosmos.bank.v1beta1.MsgSend({
      from_address: this.wallet.address.toString(),
      to_address: this.wallet.address.toString(),
      amount: [{ denom: this.chain.denom, amount: '1' }],
    });
    const res = await this.execTx(
      {
        gas_limit: Long.fromString('200000'),
        amount: [
          {
            denom: this.chain.denom,
            amount: `${Math.ceil((1000 * amount) / 750)}`,
          },
        ],
      },
      [msgSend],
    );
    return res?.tx_response;
  }

  /**
   * msgRemoveInterchainQuery sends transaction to remove interchain query, waits two blocks and returns the tx hash.
   */
  async msgRemoveInterchainQuery(
    queryId: number,
    sender: string,
  ): Promise<BroadcastTx200ResponseTxResponse> {
    const msgRemove =
      new neutron.interchainqueries.MsgRemoveInterchainQueryRequest({
        query_id: queryId,
        sender,
      });

    const res = await this.execTx(
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: this.chain.denom, amount: '1000' }],
      },
      [msgRemove],
    );
    return res?.tx_response;
  }

  /**
   * msgSend processes an IBC transfer, waits two blocks and returns the tx hash.
   */
  async msgIBCTransfer(
    sourcePort: string,
    sourceChannel: string,
    token: ICoin,
    receiver: string,
    timeoutHeight: IHeight,
    memo?: string,
  ): Promise<BroadcastTx200ResponseTxResponse> {
    const msgSend = new ibcProto.applications.transfer.v1.MsgTransfer({
      source_port: sourcePort,
      source_channel: sourceChannel,
      token: token,
      sender: this.wallet.address.toString(),
      receiver: receiver,
      timeout_height: timeoutHeight,
      memo: memo,
    });
    msgSend.memo = memo;
    const res = await this.execTx(
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: this.chain.denom, amount: '1000' }],
      },
      [msgSend],
    );
    return res?.tx_response;
  }

  async msgDelegate(
    delegatorAddress: string,
    validatorAddress: string,
    amount: string,
  ): Promise<BroadcastTx200ResponseTxResponse> {
    const msgDelegate =
      new cosmosclient.proto.cosmos.staking.v1beta1.MsgDelegate({
        delegator_address: delegatorAddress,
        validator_address: validatorAddress,
        amount: { denom: this.chain.denom, amount: amount },
      });
    const res = await this.execTx(
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: this.chain.denom, amount: '1000' }],
      },
      [msgDelegate],
    );
    return res?.tx_response;
  }
}

type TxResponseType = Awaited<ReturnType<typeof cosmosclient.rest.tx.getTx>>;

export const getEventAttributesFromTx = (
  data: TxResponseType['data'],
  event: string,
  attributes: string[],
): Array<Record<typeof attributes[number], string> | Record<string, never>> => {
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
  const resp = [];
  for (const e of events) {
    if (event === e.type) {
      let out = {};
      for (const a of e.attributes) {
        if (attributes.includes(a.key)) {
          out[a.key] = a.value;
        }
        if (Object.keys(out).length == attributes.length) {
          resp.push(out);
          out = {};
        }
      }
    }
  }
  return resp;
};

export const mnemonicToWallet = async (
  walletType: {
    fromPublicKey: (
      k: cosmosclient.PubKey,
    ) => cosmosclient.AccAddress | cosmosclient.ValAddress;
  },
  sdk: cosmosclient.CosmosSDK,
  mnemonic: string,
  addrPrefix: string,
  validate = true,
): Promise<Wallet> => {
  const privKey = new cosmosclient.proto.cosmos.crypto.secp256k1.PrivKey({
    key: await cosmosclient.generatePrivKeyFromMnemonic(mnemonic),
  });

  const pubKey = privKey.pubKey();
  let account = null;
  cosmosclient.config.setBech32Prefix({
    accAddr: addrPrefix,
    accPub: `${addrPrefix}pub`,
    valAddr: `${addrPrefix}valoper`,
    valPub: `${addrPrefix}valoperpub`,
    consAddr: `${addrPrefix}valcons`,
    consPub: `${addrPrefix}valconspub`,
  });
  const address = walletType.fromPublicKey(pubKey);
  // eslint-disable-next-line no-prototype-builtins
  if (cosmosclient.ValAddress !== walletType && validate) {
    account = await cosmosclient.rest.auth
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

    if (
      !(account instanceof cosmosclient.proto.cosmos.auth.v1beta1.BaseAccount)
    ) {
      throw new Error("can't get account");
    }
  }
  return new Wallet(address, account, pubKey, privKey, addrPrefix);
};

export const getSequenceId = (rawLog: string | undefined): number => {
  if (!rawLog) {
    throw 'getSequenceId: empty rawLog';
  }
  const events = JSON.parse(rawLog)[0]['events'];
  const sequence = events
    .find((e) => e['type'] === 'send_packet')
    ['attributes'].find((a) => a['key'] === 'packet_sequence').value;
  return +sequence;
};

export const getIBCDenom = (portName, channelName, denom: string): string => {
  const uatomIBCHash = crypto
    .createHash('sha256')
    .update(`${portName}/${channelName}/${denom}`)
    .digest('hex')
    .toUpperCase();
  return `ibc/${uatomIBCHash}`;
};

export const createBankMessage = (
  addr: string,
  amount: number,
  denom: string,
) => ({
  bank: {
    send: {
      to_address: addr,
      amount: [
        {
          denom: denom,
          amount: amount.toString(),
        },
      ],
    },
  },
});

export const getEventAttribute = (
  events: { type: string; attributes: { key: string; value: string }[] }[],
  eventType: string,
  attribute: string,
): string => {
  const attributes = events
    .filter((event) => event.type === eventType)
    .map((event) => event.attributes)
    .flat();

  const attrValue = attributes?.find((attr) => attr.key === attribute)
    ?.value as string;

  expect(attrValue).toBeDefined();

  return attrValue;
};

export const filterIBCDenoms = (list: ICoin[]) =>
  list.filter(
    (coin) =>
      coin.denom && ![IBC_ATOM_DENOM, IBC_USDC_DENOM].includes(coin.denom),
  );

export const wrapMsg = (x) => Buffer.from(JSON.stringify(x)).toString('base64');
