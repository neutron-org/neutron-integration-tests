import { promises as fsPromise } from 'fs';
import { cosmosclient, proto, rest } from '@cosmos-client/core';
import { ibcproto } from '@cosmos-client/ibc';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { cosmwasmproto } from '@cosmos-client/cosmwasm';
import { neutron } from '../generated/proto';
import axios from 'axios';
import { CodeId, Wallet } from '../types';
import Long from 'long';
import path from 'path';
import { waitBlocks, getWithAttempts } from './wait';
import {
  CosmosTxV1beta1GetTxResponse,
  InlineResponse20075TxResponse,
} from '@cosmos-client/core/cjs/openapi/api';
import { cosmos, google } from '@cosmos-client/core/cjs/proto';
import { CosmosSDK } from '@cosmos-client/core/cjs/sdk';
import { ibc } from '@cosmos-client/ibc/cjs/proto';
import crypto from 'crypto';
import ICoin = cosmos.base.v1beta1.ICoin;
import IHeight = ibc.core.client.v1.IHeight;
import {
  paramChangeProposal,
  ParamChangeProposalInfo,
  sendProposal,
  SendProposalInfo,
} from './proposal';

export const NEUTRON_DENOM = process.env.NEUTRON_DENOM || 'stake';
export const COSMOS_DENOM = process.env.COSMOS_DENOM || 'uatom';
export const IBC_RELAYER_NEUTRON_ADDRESS =
  'neutron1mjk79fjjgpplak5wq838w0yd982gzkyf8fxu8u';
export const VAULT_CONTRACT_ADDRESS =
  'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq';
export const PROPOSE_CONTRACT_ADDRESS =
  'neutron1unyuj8qnmygvzuex3dwmg9yzt9alhvyeat0uu0jedg2wj33efl5qmysp02';
export const CORE_CONTRACT_ADDRESS =
  'neutron1nc5tatafv6eyq7llkr2gv50ff9e22mnf70qgjlv737ktmt4eswrqcd0mrx';
export const PRE_PROPOSE_CONTRACT_ADDRESS =
  'neutron1eyfccmjm6732k7wp4p6gdjwhxjwsvje44j0hfx8nkgrm8fs7vqfs8hrpdj';
export const PROPOSE_MULTIPLE_CONTRACT_ADDRESS =
  'neutron1pvrwmjuusn9wh34j7y520g8gumuy9xtl3gvprlljfdpwju3x7ucsj3fj40';
export const PRE_PROPOSE_MULTIPLE_CONTRACT_ADDRESS =
  'neutron10qt8wg0n7z740ssvf3urmvgtjhxpyp74hxqvqt7z226gykuus7eqjqrsug';
export const TREASURY_CONTRACT_ADDRESS =
  'neutron1vguuxez2h5ekltfj9gjd62fs5k4rl2zy5hfrncasykzw08rezpfsd2rhm7';
const CONTRACTS_PATH = process.env.CONTRACTS_PATH || './contracts/artifacts';

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

export type TotalSupplyByDenomResponse = {
  amount: ICoin;
};

// TotalBurnedNeutronsAmountResponse is the response model for the feeburner's total-burned-neutrons.
export type TotalBurnedNeutronsAmountResponse = {
  total_burned_neutrons_amount: {
    coin: ICoin;
  };
};

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

// SingleChoiceProposal represents a single governance proposal item (partial object).
type SingleChoiceProposal = {
  readonly title: string;
  readonly description: string;
  /// The address that created this proposal.
  readonly proposer: string;
  /// The block height at which this proposal was created. Voting
  /// power queries should query for voting power at this block
  /// height.
  readonly start_height: number;
  /// The threshold at which this proposal will pass.
  /// proposal's creation.
  readonly total_power: string;
  readonly status:
    | 'open'
    | 'rejected'
    | 'passed'
    | 'executed'
    | 'closed'
    | 'execution_failed';
};

type TotalPowerAtHeightResponse = {
  readonly height: string;
  readonly power: number;
};

type VotingPowerAtHeightResponse = {
  readonly height: string;
  readonly power: number;
};

// PageRequest is the params of pagination for request
export type PageRequest = {
  'pagination.key'?: string;
  'pagination.offset'?: string;
  'pagination.limit'?: string;
  'pagination.count_total'?: boolean;
};

// AckFailuresResponse is the response model for the contractmanager failures.
export type AckFailuresResponse = {
  failures: Failure[];
  pagination: {
    next_key: string;
    total: string;
  };
};

// Failure represents a single contractmanager failure
type Failure = {
  address: string;
  id: number;
  ack_id: number;
  ack_type: string;
};

// BalancesResponse is the response model for the bank balances query.
export type PauseInfoResponse = {
  paused: {
    until_height: number;
  };
  unpaused: Record<string, never>;
};

export const NeutronContract = {
  IBC_TRANSFER: 'ibc_transfer.wasm',
  INTERCHAIN_QUERIES: 'neutron_interchain_queries.wasm',
  INTERCHAIN_TXS: 'neutron_interchain_txs.wasm',
  REFLECT: 'reflect.wasm',
  TREASURY: 'neutron_treasury.wasm',
  DISTRIBUTION: 'neutron_distribution.wasm',
  RESERVE: 'neutron_reserve.wasm',
  SUBDAO_CORE: 'cwd_subdao_core.wasm',
  SUBDAO_PREPROPOSE: 'cwd_subdao_pre_propose_single.wasm',
  SUBDAO_PROPOSAL: 'cwd_subdao_proposal_single.wasm',
  SUBDAO_TIMELOCK: 'cwd_subdao_timelock_single.wasm',
};

type MultiChoiceOption = {
  description: string;
  msgs: any[];
};

cosmosclient.codec.register(
  '/neutron.interchainadapter.interchainqueries.MsgRemoveInterchainQueryRequest',
  neutron.interchainadapter.interchainqueries.MsgRemoveInterchainQueryRequest,
);
cosmosclient.codec.register(
  '/cosmos.params.v1beta1.ParameterChangeProposal',
  proto.cosmos.params.v1beta1.ParameterChangeProposal,
);

cosmosclient.codec.register(
  '/neutron.interchainadapter.interchainqueries.MsgRemoveInterchainQueryRequest',
  neutron.interchainadapter.interchainqueries.MsgRemoveInterchainQueryRequest,
);
cosmosclient.codec.register(
  '/cosmos.params.v1beta1.ParameterChangeProposal',
  proto.cosmos.params.v1beta1.ParameterChangeProposal,
);

export class CosmosWrapper {
  sdk: cosmosclient.CosmosSDK;
  wallet: Wallet;
  denom: string;

  constructor(sdk: cosmosclient.CosmosSDK, wallet: Wallet, denom: string) {
    this.denom = denom;
    this.sdk = sdk;
    this.wallet = wallet;
  }

  /**
   * execTx broadcasts messages and returns the transaction result.
   */
  async execTx<T>(
    fee: proto.cosmos.tx.v1beta1.IFee,
    msgs: T[],
    numAttempts = 10,
    mode: rest.tx.BroadcastTxMode = rest.tx.BroadcastTxMode.Async,
  ): Promise<CosmosTxV1beta1GetTxResponse> {
    const protoMsgs: Array<google.protobuf.IAny> = [];
    msgs.forEach((msg) => {
      protoMsgs.push(cosmosclient.codec.instanceToProtoAny(msg));
    });
    const txBody = new proto.cosmos.tx.v1beta1.TxBody({
      messages: protoMsgs,
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
    const txBuilder = new cosmosclient.TxBuilder(
      this.sdk as CosmosSDK,
      txBody,
      authInfo,
    );
    const signDocBytes = txBuilder.signDocBytes(
      this.wallet.account.account_number,
    );
    txBuilder.addSignature(this.wallet.privKey.sign(signDocBytes));
    const res = await rest.tx.broadcastTx(this.sdk as CosmosSDK, {
      tx_bytes: txBuilder.txBytes(),
      mode,
    });
    const code = res.data?.tx_response.code;
    if (code !== 0) {
      throw new Error(`broadcast error: ${res.data?.tx_response.raw_log}`);
    }
    const txhash = res.data?.tx_response.txhash;
    let error = null;
    while (numAttempts > 0) {
      await waitBlocks(this.sdk, 1);
      numAttempts--;
      const data = await rest.tx
        .getTx(this.sdk as CosmosSDK, txhash)
        .catch((reason) => {
          error = reason;
          return null;
        });
      if (data != null) {
        this.wallet.account.sequence++;
        return data.data;
      }
    }
    error = error ?? new Error('failed to submit tx');
    throw error;
  }

  // storeWasm stores the wasm code by the passed path on the blockchain.
  async storeWasm(fileName: string): Promise<CodeId> {
    const msg = new cosmwasmproto.cosmwasm.wasm.v1.MsgStoreCode({
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

    const attributes = getEventAttributesFromTx(data, 'store_code', [
      'code_id',
    ]);

    return attributes[0].code_id;
  }

  async instantiate(
    codeId: string,
    msg: string | null = null,
    label: string | null = null,
  ): Promise<Array<Record<string, string>>> {
    const msgInit = new cosmwasmproto.cosmwasm.wasm.v1.MsgInstantiateContract({
      code_id: codeId,
      sender: this.wallet.address.toString(),
      admin: this.wallet.address.toString(),
      label,
      msg: Buffer.from(msg),
    });
    const data = await this.execTx(
      {
        amount: [{ denom: NEUTRON_DENOM, amount: '2000000' }],
        gas_limit: Long.fromString('600000000'),
      },
      [msgInit],
    );

    if (data.tx_response.code !== 0) {
      throw new Error(`instantiate error: ${data.tx_response.raw_log}`);
    }

    const attributes = getEventAttributesFromTx(data, 'instantiate', [
      '_contract_address',
      'code_id',
    ]);
    return attributes;
  }

  async executeContract(
    contract: string,
    msg: string,
    funds: proto.cosmos.base.v1beta1.ICoin[] = [],
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    const msgExecute = new cosmwasmproto.cosmwasm.wasm.v1.MsgExecuteContract({
      sender,
      contract,
      msg: Buffer.from(msg),
      funds,
    });

    const res = await this.execTx(
      {
        gas_limit: Long.fromString('2000000'),
        amount: [{ denom: this.denom, amount: '10000' }],
      },
      [msgExecute],
    );
    if (res.tx_response.code !== 0) {
      throw new Error(res.tx_response.raw_log);
    }
    return res?.tx_response;
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
      await waitBlocks(this.sdk, 1);
    }

    throw new Error('failed to query contract');
  }

  async queryContract<T>(
    contract: string,
    query: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.sdk.url}/wasm/contract/${contract}/smart/${Buffer.from(
      JSON.stringify(query),
    ).toString('base64')}?encoding=base64`;
    const req = await axios.get<{
      result: { smart: string };
      height: number;
    }>(url);
    return JSON.parse(
      Buffer.from(req.data.result.smart, 'base64').toString(),
    ) as T;
  }

  /**
   * msgSend processes a transfer, waits two blocks and returns the tx hash.
   */
  async msgSend(
    to: string,
    amount: string,
    fee = {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: this.denom, amount: '1000' }],
    },
  ): Promise<InlineResponse20075TxResponse> {
    const msgSend = new proto.cosmos.bank.v1beta1.MsgSend({
      from_address: this.wallet.address.toString(),
      to_address: to,
      amount: [{ denom: this.denom, amount }],
    });
    const res = await this.execTx(fee, [msgSend]);
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
    let pauseInfo = await this.queryPausedInfo(testingContract);
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
    pauseInfo = await this.queryPausedInfo(testingContract);
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
    pauseInfo = await this.queryPausedInfo(testingContract);
    expect(pauseInfo).toEqual({ unpaused: {} });
    expect(pauseInfo.paused).toEqual(undefined);

    // execute msgs on unpaused contract
    const code = await execAction();
    expect(code).toEqual(0);
    await actionCheck();

    // pause contract again for a short period
    const short_pause_duration = 5;
    res = await this.executeContract(
      testingContract,
      JSON.stringify({
        pause: {
          duration: short_pause_duration,
        },
      }),
    );
    expect(res.code).toEqual(0);

    // check contract's pause info after pausing
    pauseInfo = await this.queryPausedInfo(testingContract);
    expect(pauseInfo.unpaused).toEqual(undefined);
    expect(pauseInfo.paused.until_height).toBeGreaterThan(0);

    // wait and check contract's pause info after unpausing
    await waitBlocks(this.sdk, short_pause_duration);
    pauseInfo = await this.queryPausedInfo(testingContract);
    expect(pauseInfo).toEqual({ unpaused: {} });
    expect(pauseInfo.paused).toEqual(undefined);
  }

  async queryPausedInfo(addr: string): Promise<PauseInfoResponse> {
    return await this.queryContract<PauseInfoResponse>(addr, {
      pause_info: {},
    });
  }

  /* simulateFeeBurning simulates fee burning via send tx.
   */
  async simulateFeeBurning(
    amount: number,
  ): Promise<InlineResponse20075TxResponse> {
    const msgSend = new proto.cosmos.bank.v1beta1.MsgSend({
      from_address: this.wallet.address.toString(),
      to_address: this.wallet.address.toString(),
      amount: [{ denom: this.denom, amount: '1' }],
    });
    const res = await this.execTx(
      {
        gas_limit: Long.fromString('200000'),
        amount: [
          { denom: this.denom, amount: `${Math.ceil((1000 * amount) / 750)}` },
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
  ): Promise<InlineResponse20075TxResponse> {
    const msgRemove =
      new neutron.interchainadapter.interchainqueries.MsgRemoveInterchainQueryRequest(
        {
          query_id: queryId,
          sender,
        },
      );

    const res = await this.execTx(
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: this.denom, amount: '1000' }],
      },
      [msgRemove],
    );
    return res?.tx_response;
  }

  /**
   * submitSendProposal creates proposal to send funds from DAO core contract for given address.
   */
  async submitSendProposal(
    pre_propose_contract: string,
    title: string,
    description: string,
    amount: string,
    to: string,
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    const message = JSON.stringify(
      sendProposal({ to, denom: this.denom, amount }),
    );
    return await this.submitProposal(
      pre_propose_contract,
      title,
      description,
      message,
      amount,
      sender,
    );
  }

  /**
   * submitParameterChangeProposal creates parameter change proposal.
   */
  async submitParameterChangeProposal(
    pre_propose_contract: string,
    title: string,
    description: string,
    subspace: string,
    key: string,
    value: string,
    amount: string,
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    const message = JSON.stringify(
      paramChangeProposal({ title, description, subspace, key, value }),
    );
    return await this.submitProposal(
      pre_propose_contract,
      title,
      description,
      message,
      amount,
      sender,
    );
  }

  /**
   * submitMultiChoiceSendProposal creates parameter change proposal with multiple choices.
   */
  async submitMultiChoiceSendProposal(
    choices: SendProposalInfo[],
    title: string,
    description: string,
    amount: string,
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    const messages: MultiChoiceOption[] = choices.map((choice, idx) => ({
      description: 'choice' + idx,
      msgs: [sendProposal(choice)],
    }));
    return await this.submitMultiChoiceProposal(
      title,
      description,
      amount,
      sender,
      messages,
    );
  }

  /**
   * submitMultiChoiceParameterChangeProposal creates parameter change proposal with multiple choices.
   */
  async submitMultiChoiceParameterChangeProposal(
    choices: ParamChangeProposalInfo[],
    title: string,
    description: string,
    amount: string,
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    const messages: MultiChoiceOption[] = choices.map((choice, idx) => ({
      description: 'choice' + idx,
      msgs: [paramChangeProposal(choice)],
    }));
    return await this.submitMultiChoiceProposal(
      title,
      description,
      amount,
      sender,
      messages,
    );
  }

  /**
   * submitProposal creates proposal with given message.
   */
  async submitProposal(
    pre_propose_contract: string,
    title: string,
    description: string,
    msg: string,
    amount: string,
    sender: string,
  ): Promise<InlineResponse20075TxResponse> {
    const message = JSON.parse(msg);
    return await this.executeContract(
      pre_propose_contract,
      JSON.stringify({
        propose: {
          msg: {
            propose: {
              title: title,
              description: description,
              msgs: [message],
            },
          },
        },
      }),
      [{ denom: this.denom, amount: amount }],
      sender,
    );
  }

  /**
   * submitMultiChoiceProposal creates multi-choice proposal with given message.
   */
  async submitMultiChoiceProposal(
    title: string,
    description: string,
    amount: string,
    sender: string,
    options: MultiChoiceOption[],
  ): Promise<InlineResponse20075TxResponse> {
    return await this.executeContract(
      PRE_PROPOSE_MULTIPLE_CONTRACT_ADDRESS,
      JSON.stringify({
        propose: {
          msg: {
            propose: {
              title: title,
              description: description,
              choices: { options },
            },
          },
        },
      }),
      [{ denom: this.denom, amount: amount }],
      sender,
    );
  }

  /**
   * voteYes  vote 'yes' for given proposal.
   */
  async voteYes(
    propose_contract: string,
    proposalId: number,
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    return await this.executeContract(
      propose_contract,
      JSON.stringify({ vote: { proposal_id: proposalId, vote: 'yes' } }),
      [],
      sender,
    );
  }

  /**
   * voteNo  vote 'no' for given proposal.
   */
  async voteNo(
    propose_contract: string,
    proposalId: number,
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    return await this.executeContract(
      propose_contract,
      JSON.stringify({ vote: { proposal_id: proposalId, vote: 'no' } }),
      [],
      sender,
    );
  }

  /**
   * voteYes  vote for option for given multi choice proposal.
   */
  async voteForOption(
    proposeContract: string,
    proposalId: number,
    optionId: number,
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    return await this.executeContract(
      PROPOSE_MULTIPLE_CONTRACT_ADDRESS,
      JSON.stringify({
        vote: { proposal_id: proposalId, vote: { option_id: optionId } },
      }),
      [],
      sender,
    );
  }

  /**
   * executeProposal executes given proposal.
   */
  async executeProposal(
    propose_contract: string,
    proposalId: number,
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    return await this.executeContract(
      propose_contract,
      JSON.stringify({ execute: { proposal_id: proposalId } }),
      [],
      sender,
    );
  }

  async checkPassedProposal(propose_contract: string, proposalId: number) {
    await getWithAttempts(
      this,
      async () => await this.queryProposal(propose_contract, proposalId),
      async (response) => response.proposal.status === 'passed',
      20,
    );
  }

  async checkPassedMultiChoiceProposal(
    propose_contract: string,
    proposalId: number,
  ) {
    await getWithAttempts(
      this,
      async () =>
        await this.queryMultiChoiceProposal(propose_contract, proposalId),
      async (response) => response.proposal.status === 'passed',
      20,
    );
  }

  async checkExecutedMultiChoiceProposal(
    propose_contract: string,
    proposalId: number,
  ) {
    await getWithAttempts(
      this,
      async () =>
        await this.queryMultiChoiceProposal(propose_contract, proposalId),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  async executeProposalWithAttempts(
    propose_contract: string,
    proposalId: number,
  ) {
    await this.executeProposal(propose_contract, proposalId);
    await getWithAttempts(
      this,
      async () => await this.queryProposal(propose_contract, proposalId),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  async executeMultiChoiceProposalWithAttempts(
    proposalContract: string,
    proposalId: number,
  ) {
    await this.executeMultiChoiceProposal(proposalContract, proposalId);
    await getWithAttempts(
      this,
      async () =>
        await this.queryMultiChoiceProposal(proposalContract, proposalId),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  /**
   * executeMultiChoiceProposal executes given multichoice proposal.
   */
  async executeMultiChoiceProposal(
    proposalContract: string,
    proposalId: number,
    sender: string = this.wallet.address.toString(),
  ): Promise<any> {
    return await this.executeContract(
      proposalContract,
      JSON.stringify({ execute: { proposal_id: proposalId } }),
      [],
      sender,
    );
  }

  async queryMultiChoiceProposal(
    propose_contract: string,
    proposalId: number,
  ): Promise<any> {
    return await this.queryContract<any>(propose_contract, {
      proposal: {
        proposal_id: proposalId,
      },
    });
  }

  async queryProposal(
    propose_contract: string,
    proposalId: number,
  ): Promise<any> {
    return await this.queryContract<SingleChoiceProposal>(propose_contract, {
      proposal: {
        proposal_id: proposalId,
      },
    });
  }

  async queryTotalVotingPower(core_contract: string): Promise<any> {
    return await this.queryContract<TotalPowerAtHeightResponse>(core_contract, {
      total_power_at_height: {},
    });
  }

  async queryVotingPower(core_contract: string, addr: string): Promise<any> {
    return await this.queryContract<VotingPowerAtHeightResponse>(
      core_contract,
      {
        voting_power_at_height: {
          address: addr,
        },
      },
    );
  }

  async queryInterchainqueriesParams(): Promise<any> {
    const req = await axios.get(
      `${this.sdk.url}/neutron/interchainqueries/params`,
    );

    return req.data;
  }

  async queryDelegations(delegatorAddr: cosmosclient.AccAddress): Promise<any> {
    const balances = await rest.staking.delegatorDelegations(
      this.sdk,
      delegatorAddr,
    );
    return balances.data;
  }

  /**
   * msgSend processes an IBC transfer, waits two blocks and returns the tx hash.
   */
  async msgIBCTransfer(
    source_port: string,
    source_channel: string,
    token: ICoin,
    receiver: string,
    timeout_height: IHeight,
  ): Promise<InlineResponse20075TxResponse> {
    const msgSend = new ibcproto.ibc.applications.transfer.v1.MsgTransfer({
      source_port: source_port,
      source_channel: source_channel,
      token: token,
      sender: this.wallet.address.toString(),
      receiver: receiver,
      timeout_height: timeout_height,
    });
    const res = await this.execTx(
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: this.denom, amount: '1000' }],
      },
      [msgSend],
    );
    return res?.tx_response;
  }

  async queryBalances(addr: string): Promise<BalancesResponse> {
    const balances = await rest.bank.allBalances(
      this.sdk,
      addr as unknown as AccAddress,
    );
    return balances.data as BalancesResponse;
  }

  async queryDenomBalance(
    addr: string | AccAddress | ValAddress,
    denom: string,
  ): Promise<number> {
    const { data } = await rest.bank.allBalances(
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

  async msgDelegate(
    delegatorAddress: string,
    validatorAddress: string,
    amount: string,
  ): Promise<InlineResponse20075TxResponse> {
    const msgDelegate = new proto.cosmos.staking.v1beta1.MsgDelegate({
      delegator_address: delegatorAddress,
      validator_address: validatorAddress,
      amount: { denom: this.denom, amount: amount },
    });
    const res = await this.execTx(
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: this.denom, amount: '1000' }],
      },
      [msgDelegate],
    );
    return res?.tx_response;
  }

  async bondFunds(
    vault_contract: string,
    amount: string,
    sender: string = this.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    return await this.executeContract(
      vault_contract,
      JSON.stringify({
        bond: {},
      }),
      [{ denom: this.denom, amount: amount }],
      sender,
    );
  }

  async listIBCChannels(): Promise<ChannelsList> {
    const req = await axios.get<ChannelsList>(
      `${this.sdk.url}/ibc/core/channel/v1/channels`,
    );
    return req.data;
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
        `${this.sdk.url}/cosmos/bank/v1beta1/supply/${denom}`,
      );
      return req.data;
    } catch (e) {
      if (e.response?.data?.message !== undefined) {
        throw new Error(e.response?.data?.message);
      }
      throw e;
    }
  }
}

type TxResponseType = Awaited<ReturnType<typeof rest.tx.getTx>>;

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
): Promise<Wallet> => {
  const privKey = new proto.cosmos.crypto.secp256k1.PrivKey({
    key: await cosmosclient.generatePrivKeyFromMnemonic(mnemonic),
  });

  const pubKey = privKey.pubKey();
  const address = walletType.fromPublicKey(pubKey);
  let account = null;
  cosmosclient.config.setBech32Prefix({
    accAddr: addrPrefix,
    accPub: `${addrPrefix}pub`,
    valAddr: `${addrPrefix}valoper`,
    valPub: `${addrPrefix}valoperpub`,
    consAddr: `${addrPrefix}valcons`,
    consPub: `${addrPrefix}valconspub`,
  });
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

export const getContractsHashes = async (): Promise<Record<string, string>> => {
  const hashes = {};
  for (const key of Object.keys(NeutronContract)) {
    const binary = await getContractBinary(NeutronContract[key]);
    hashes[NeutronContract[key]] = crypto
      .createHash('sha256')
      .update(binary)
      .digest('hex');
  }
  return hashes;
};

const getContractBinary = async (fileName: string): Promise<Buffer> =>
  fsPromise.readFile(path.resolve(CONTRACTS_PATH, fileName));

export const getIBCDenom = (portName, channelName, denom: string): string => {
  const uatomIBCHash = crypto
    .createHash('sha256')
    .update(`${portName}/${channelName}/${denom}`)
    .digest('hex')
    .toUpperCase();
  return `ibc/${uatomIBCHash}`;
};

export const createBankMassage = (address: string, amount: string) => ({
  bank: {
    send: {
      to_address: address,
      amount: [
        {
          denom: NEUTRON_DENOM,
          amount: amount,
        },
      ],
    },
  },
});
