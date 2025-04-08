import {
  AccountData,
  encodeSecp256k1Pubkey,
  makeSignDoc as makeSignDocAmino,
  OfflineAminoSigner,
  StdFee,
  // Pubkey as AminoPubkey,
} from '@cosmjs/amino';
import { AuthInfo, Fee, Tx, TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { fromBase64, toUtf8 } from '@cosmjs/encoding';
import { Int53, Uint53 } from '@cosmjs/math';
import { PubKey } from '@neutron-org/neutronjs/neutron/crypto/v1beta1/ethsecp256k1/keys';
import { Any } from 'cosmjs-types/google/protobuf/any';
import {
  ServiceClientImpl,
  SimulateRequest,
} from 'cosmjs-types/cosmos/tx/v1beta1/service';
import {
  EncodeObject,
  encodePubkey,
  isOfflineDirectSigner,
  makeAuthInfoBytes,
  makeSignDoc,
  OfflineDirectSigner,
  OfflineSigner,
  Registry,
  TxBodyEncodeObject,
} from '@cosmjs/proto-signing';
import {
  CometClient,
  connectComet,
  HttpEndpoint,
} from '@cosmjs/tendermint-rpc';
import { assert, assertDefined } from '@cosmjs/utils';
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';

import {
  AminoTypes,
  calculateFee,
  createDefaultAminoConverters,
  defaultRegistryTypes,
  DeliverTxResponse,
  GasPrice,
  Event,
  isDeliverTxFailure,
  MsgSendEncodeObject,
  SigningStargateClientOptions,
  logs,
  Attribute,
  createProtobufRpcClient,
  ProtobufRpcClient,
} from '@cosmjs/stargate';
import {
  CosmWasmClient,
  createWasmAminoConverters,
  ExecuteInstruction,
  ExecuteResult,
  InstantiateOptions,
  InstantiateResult,
  JsonObject,
  MigrateResult,
  MsgExecuteContractEncodeObject,
  MsgInstantiateContractEncodeObject,
  MsgMigrateContractEncodeObject,
  MsgStoreCodeEncodeObject,
  UploadResult,
} from '@cosmjs/cosmwasm-stargate';
import {
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgMigrateContract,
  MsgStoreCode,
} from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { AccessConfig } from 'cosmjs-types/cosmwasm/wasm/v1/types';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';
import { StdSignDoc } from '@cosmjs/amino/build/signdoc';

// TODO: can we implement this using metamask extension?
/**
 * Interface for EIP-191 signer
 */
export interface Eip191Signer {
  getAccounts(): Promise<readonly AccountData[]>;
  signEip191(
    signerAddress: string,
    signDoc: StdSignDoc,
  ): Promise<{ signature: { signature: string }; signed: any }>;
}

/**
 * Type guard to check if a signer is an EIP-191 signer
 */
export function isEip191Signer(
  signer: OfflineSigner | Eip191Signer,
): signer is OfflineSigner | Eip191Signer {
  return 'signEip191' in signer;
}

/**
 * Signing information for a single signer that is not included in the transaction.
 *
 * @see https://github.com/cosmos/cosmos-sdk/blob/v0.42.2/x/auth/signing/sign_mode_handler.go#L23-L37
 */
export interface SignerData {
  readonly accountNumber: number;
  readonly sequence: number;
  readonly chainId: string;
}

export class Eip191SigningCosmwasmClient extends CosmWasmClient {
  public readonly registry: Registry;
  public readonly broadcastTimeoutMs: number | undefined;
  public readonly broadcastPollIntervalMs: number | undefined;

  private readonly signer: OfflineSigner | Eip191Signer;
  private readonly aminoTypes: AminoTypes;
  private readonly gasPrice: GasPrice | undefined;
  // Starting with Cosmos SDK 0.47, we see many cases in which 1.3 is not enough anymore
  // E.g. https://github.com/cosmos/cosmos-sdk/issues/16020
  private readonly defaultGasMultiplier = 1.4;

  /**
   * Creates an instance by connecting to the given CometBFT RPC endpoint.
   *
   * This uses auto-detection to decide between a CometBFT 0.38, Tendermint 0.37 and 0.34 client.
   * To set the Comet client explicitly, use `createWithSigner`.
   */
  public static async connectWithSigner(
    endpoint: string | HttpEndpoint,
    signer: OfflineSigner | Eip191Signer,
    options: SigningStargateClientOptions = {},
  ): Promise<Eip191SigningCosmwasmClient> {
    const cometClient = await connectComet(endpoint);
    return Eip191SigningCosmwasmClient.createWithSigner(
      cometClient,
      signer,
      options,
    );
  }

  /**
   * Creates an instance from a manually created Comet client.
   * Use this to use `Comet38Client` or `Tendermint37Client` instead of `Tendermint34Client`.
   */
  public static async createWithSigner(
    cometClient: CometClient,
    signer: OfflineSigner | Eip191Signer,
    options: SigningStargateClientOptions = {},
  ): Promise<Eip191SigningCosmwasmClient> {
    return new Eip191SigningCosmwasmClient(cometClient, signer, options);
  }

  /**
   * Creates a client in offline mode.
   *
   * This should only be used in niche cases where you know exactly what you're doing,
   * e.g. when building an offline signing application.
   *
   * When you try to use online functionality with such a signer, an
   * exception will be raised.
   */
  public static async offline(
    signer: OfflineSigner,
    options: SigningStargateClientOptions = {},
  ): Promise<Eip191SigningCosmwasmClient> {
    return new Eip191SigningCosmwasmClient(undefined, signer, options);
  }

  protected constructor(
    cometClient: CometClient | undefined,
    signer: OfflineSigner | Eip191Signer,
    options: SigningStargateClientOptions,
  ) {
    super(cometClient);
    const {
      registry = new Registry(defaultRegistryTypes),
      aminoTypes = new AminoTypes({
        ...createDefaultAminoConverters(),
        ...createWasmAminoConverters(),
      }),
    } = options;
    this.registry = registry;
    this.aminoTypes = aminoTypes;
    this.signer = signer;
    this.broadcastTimeoutMs = options.broadcastTimeoutMs;
    this.broadcastPollIntervalMs = options.broadcastPollIntervalMs;
    this.gasPrice = options.gasPrice;
  }

  public async simulate(
    signerAddress: string,
    messages: readonly EncodeObject[],
    memo: string | undefined,
  ): Promise<number> {
    const anyMsgs = messages.map((m) => this.registry.encodeAsAny(m));
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress,
    );
    if (!accountFromSigner) {
      throw new Error('Failed to retrieve account from signer');
    }
    const pubkey1 = await this.getEip191PubKey(accountFromSigner.pubkey);
    // const pubkey = {
    //   type: pubkey1.typeUrl,
    //   value: pubkey1.value,
    // } as AminoPubkey;
    const { sequence } = await this.getSequence(signerAddress);
    const rpc = createProtobufRpcClient(this.forceGetQueryClient());
    const { gasInfo } = await simulate(rpc, anyMsgs, memo, pubkey1, sequence);
    assertDefined(gasInfo);
    return Uint53.fromString(gasInfo.gasUsed.toString()).toNumber();
  }

  public async signAndBroadcast(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee | 'auto' | number,
    memo = '',
    timeoutHeight?: bigint,
  ): Promise<DeliverTxResponse> {
    let usedFee: StdFee;
    if (fee == 'auto' || typeof fee === 'number') {
      assertDefined(
        this.gasPrice,
        'Gas price must be set in the client options when auto gas is used.',
      );
      const gasEstimation = await this.simulate(signerAddress, messages, memo);
      const multiplier =
        typeof fee === 'number' ? fee : this.defaultGasMultiplier;
      usedFee = calculateFee(
        Math.round(gasEstimation * multiplier),
        this.gasPrice,
      );
    } else {
      usedFee = fee;
    }
    const txRaw = await this.sign(
      signerAddress,
      messages,
      usedFee,
      memo,
      undefined,
      timeoutHeight,
    );
    const txBytes = TxRaw.encode(txRaw).finish();
    return this.broadcastTx(
      txBytes,
      this.broadcastTimeoutMs,
      this.broadcastPollIntervalMs,
    );
  }

  /**
   * This method is useful if you want to send a transaction in broadcast,
   * without waiting for it to be placed inside a block, because for example
   * I would like to receive the hash to later track the transaction with another tool.
   * @returns Returns the hash of the transaction
   */
  public async signAndBroadcastSync(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee | 'auto' | number,
    memo = '',
    timeoutHeight?: bigint,
  ): Promise<string> {
    let usedFee: StdFee;
    if (fee == 'auto' || typeof fee === 'number') {
      assertDefined(
        this.gasPrice,
        'Gas price must be set in the client options when auto gas is used.',
      );
      const gasEstimation = await this.simulate(signerAddress, messages, memo);
      const multiplier =
        typeof fee === 'number' ? fee : this.defaultGasMultiplier;
      usedFee = calculateFee(
        Math.round(gasEstimation * multiplier),
        this.gasPrice,
      );
    } else {
      usedFee = fee;
    }
    const txRaw = await this.sign(
      signerAddress,
      messages,
      usedFee,
      memo,
      undefined,
      timeoutHeight,
    );
    const txBytes = TxRaw.encode(txRaw).finish();
    return this.broadcastTxSync(txBytes);
  }

  /**
   * Gets account number and sequence from the API, creates a sign doc,
   * creates a single signature and assembles the signed transaction.
   *
   * The sign mode (SIGN_MODE_DIRECT or SIGN_MODE_LEGACY_AMINO_JSON) is determined by this client's signer.
   *
   * You can pass signer data (account number, sequence and chain ID) explicitly instead of querying them
   * from the chain. This is needed when signing for a multisig account, but it also allows for offline signing
   * (See the SigningStargateClient.offline constructor).
   */
  public async sign(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    explicitSignerData?: SignerData,
    timeoutHeight?: bigint,
  ): Promise<TxRaw> {
    let signerData: SignerData;
    if (explicitSignerData) {
      signerData = explicitSignerData;
    } else {
      const { accountNumber, sequence } = await this.getSequence(signerAddress);
      const chainId = await this.getChainId();
      signerData = {
        accountNumber: accountNumber,
        sequence: sequence,
        chainId: chainId,
      };
    }

    if (isEip191Signer(this.signer)) {
      return this.signEip191(
        signerAddress,
        messages,
        fee,
        memo,
        signerData,
        timeoutHeight,
      );
    }

    return isOfflineDirectSigner(this.signer)
      ? this.signDirect(
          signerAddress,
          messages,
          fee,
          memo,
          signerData,
          timeoutHeight,
        )
      : this.signAmino(
          signerAddress,
          messages,
          fee,
          memo,
          signerData,
          timeoutHeight,
        );
  }

  private async signAmino(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    { accountNumber, sequence, chainId }: SignerData,
    timeoutHeight?: bigint,
  ): Promise<TxRaw> {
    assert(!isOfflineDirectSigner(this.signer as OfflineSigner));
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress,
    );
    if (!accountFromSigner) {
      throw new Error('Failed to retrieve account from signer');
    }
    const pubkey = encodePubkey(
      encodeSecp256k1Pubkey(accountFromSigner.pubkey),
    );
    const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
    const msgs = messages.map((msg) => this.aminoTypes.toAmino(msg));
    const signDoc = makeSignDocAmino(
      msgs,
      fee,
      chainId,
      memo,
      accountNumber,
      sequence,
      timeoutHeight,
    );
    const { signature, signed } = await (
      this.signer as OfflineAminoSigner
    ).signAmino(signerAddress, signDoc);
    const signedTxBody = {
      messages: signed.msgs.map((msg) => this.aminoTypes.fromAmino(msg)),
      memo: signed.memo,
      timeoutHeight: timeoutHeight,
    };
    const signedTxBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: signedTxBody,
    };
    const signedTxBodyBytes = this.registry.encode(signedTxBodyEncodeObject);
    const signedGasLimit = Int53.fromString(signed.fee.gas).toNumber();
    const signedSequence = Int53.fromString(signed.sequence).toNumber();
    const signedAuthInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence: signedSequence }],
      signed.fee.amount,
      signedGasLimit,
      signed.fee.granter,
      signed.fee.payer,
      signMode,
    );
    return TxRaw.fromPartial({
      bodyBytes: signedTxBodyBytes,
      authInfoBytes: signedAuthInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
  }

  private async signDirect(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    { accountNumber, sequence, chainId }: SignerData,
    timeoutHeight?: bigint,
  ): Promise<TxRaw> {
    assert(isOfflineDirectSigner(this.signer as OfflineSigner));
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress,
    );
    if (!accountFromSigner) {
      throw new Error('Failed to retrieve account from signer');
    }
    const pubkey = encodePubkey(
      encodeSecp256k1Pubkey(accountFromSigner.pubkey),
    );
    const txBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: {
        messages: messages,
        memo: memo,
        timeoutHeight: timeoutHeight,
      },
    };
    const txBodyBytes = this.registry.encode(txBodyEncodeObject);
    const gasLimit = Int53.fromString(fee.gas).toNumber();
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence }],
      fee.amount,
      gasLimit,
      fee.granter,
      fee.payer,
    );
    const signDoc = makeSignDoc(
      txBodyBytes,
      authInfoBytes,
      chainId,
      accountNumber,
    );
    const { signature, signed } = await (
      this.signer as OfflineDirectSigner
    ).signDirect(signerAddress, signDoc);
    return TxRaw.fromPartial({
      bodyBytes: signed.bodyBytes,
      authInfoBytes: signed.authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
  }

  private async signEip191(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string,
    { accountNumber, sequence, chainId }: SignerData,
    timeoutHeight?: bigint,
  ): Promise<TxRaw> {
    assert(isEip191Signer(this.signer));
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress,
    );
    if (!accountFromSigner) {
      throw new Error('Failed to retrieve account from signer');
    }
    const pubkey = await this.getEip191PubKey(accountFromSigner.pubkey);
    const signMode = SignMode.SIGN_MODE_EIP_191;
    const msgs = messages.map((msg) => this.aminoTypes.toAmino(msg));
    const signDoc = makeSignDocAmino(
      msgs,
      fee,
      chainId,
      memo,
      accountNumber,
      sequence,
      timeoutHeight,
    );
    console.log('SignDoc: \n' + JSON.stringify(signDoc) + '\n');

    // Use the EIP-191 signer to sign the document
    const { signature, signed } = await (
      this.signer as Eip191Signer
    ).signEip191(signerAddress, signDoc);

    const signedTxBody = {
      messages: signed.msgs.map((msg) => this.aminoTypes.fromAmino(msg)),
      memo: signed.memo,
      timeoutHeight: timeoutHeight,
    };
    const signedTxBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: '/cosmos.tx.v1beta1.TxBody',
      value: signedTxBody,
    };
    const signedTxBodyBytes = this.registry.encode(signedTxBodyEncodeObject);
    const signedGasLimit = Int53.fromString(signed.fee.gas).toNumber();
    const signedSequence = Int53.fromString(signed.sequence).toNumber();
    const signedAuthInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence: signedSequence }],
      signed.fee.amount,
      signedGasLimit,
      signed.fee.granter,
      signed.fee.payer,
      signMode,
    );
    return TxRaw.fromPartial({
      bodyBytes: signedTxBodyBytes,
      authInfoBytes: signedAuthInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
  }

  private async getEip191PubKey(pubKeyBytes: Uint8Array): Promise<Any> {
    return Any.fromPartial({
      typeUrl: PubKey.typeUrl,
      value: PubKey.encode({ key: pubKeyBytes }).finish(),
    });
  }

  /** Uploads code and returns a receipt, including the code ID */
  public async upload(
    senderAddress: string,
    wasmCode: Uint8Array,
    fee: StdFee | 'auto' | number,
    memo = '',
    instantiatePermission?: AccessConfig,
  ): Promise<UploadResult> {
    // TODO: fix
    // const compressed = pako.gzip(wasmCode, { level: 9 });
    const storeCodeMsg: MsgStoreCodeEncodeObject = {
      typeUrl: '/cosmwasm.wasm.v1.MsgStoreCode',
      value: MsgStoreCode.fromPartial({
        sender: senderAddress,
        // wasmByteCode: compressed,
        wasmByteCode: wasmCode,
        instantiatePermission,
      }),
    };

    // When uploading a contract, the simulation is only 1-2% away from the actual gas usage.
    // So we have a smaller default gas multiplier than signAndBroadcast.
    const usedFee = fee == 'auto' ? 1.1 : fee;
    console.log('senderAddress: ' + senderAddress);
    const result = await this.signAndBroadcast(
      senderAddress,
      [storeCodeMsg],
      usedFee,
      memo,
    );
    if (isDeliverTxFailure(result)) {
      throw new Error(createDeliverTxResponseErrorMessage(result));
    }
    const codeIdAttr = findAttribute(result.events, 'store_code', 'code_id');
    return {
      // checksum: toHex(sha256(wasmCode)),
      checksum: '0x', // todo
      originalSize: wasmCode.length,
      // compressedSize: compressed.length,
      compressedSize: wasmCode.length,
      codeId: Number.parseInt(codeIdAttr.value, 10),
      logs: logs.parseRawLog(result.rawLog),
      height: result.height,
      transactionHash: result.transactionHash,
      events: result.events,
      gasWanted: result.gasWanted,
      gasUsed: result.gasUsed,
    };
  }

  public async instantiate(
    senderAddress: string,
    codeId: number,
    msg: JsonObject,
    label: string,
    fee: StdFee | 'auto' | number,
    options: InstantiateOptions = {},
  ): Promise<InstantiateResult> {
    const instantiateContractMsg: MsgInstantiateContractEncodeObject = {
      typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
      value: MsgInstantiateContract.fromPartial({
        sender: senderAddress,
        codeId: BigInt(new Uint53(codeId).toString()),
        label: label,
        msg: toUtf8(JSON.stringify(msg)),
        funds: [...(options.funds || [])],
        admin: options.admin,
      }),
    };
    const result = await this.signAndBroadcast(
      senderAddress,
      [instantiateContractMsg],
      fee,
      options.memo,
    );
    if (isDeliverTxFailure(result)) {
      throw new Error(createDeliverTxResponseErrorMessage(result));
    }
    const contractAddressAttr = findAttribute(
      result.events,
      'instantiate',
      '_contract_address',
    );
    return {
      contractAddress: contractAddressAttr.value,
      logs: logs.parseRawLog(result.rawLog),
      height: result.height,
      transactionHash: result.transactionHash,
      events: result.events,
      gasWanted: result.gasWanted,
      gasUsed: result.gasUsed,
    };
  }

  public async migrate(
    senderAddress: string,
    contractAddress: string,
    codeId: number,
    migrateMsg: JsonObject,
    fee: StdFee | 'auto' | number,
    memo = '',
  ): Promise<MigrateResult> {
    const migrateContractMsg: MsgMigrateContractEncodeObject = {
      typeUrl: '/cosmwasm.wasm.v1.MsgMigrateContract',
      value: MsgMigrateContract.fromPartial({
        sender: senderAddress,
        contract: contractAddress,
        codeId: BigInt(new Uint53(codeId).toString()),
        msg: toUtf8(JSON.stringify(migrateMsg)),
      }),
    };
    const result = await this.signAndBroadcast(
      senderAddress,
      [migrateContractMsg],
      fee,
      memo,
    );
    if (isDeliverTxFailure(result)) {
      throw new Error(createDeliverTxResponseErrorMessage(result));
    }
    return {
      logs: logs.parseRawLog(result.rawLog),
      height: result.height,
      transactionHash: result.transactionHash,
      events: result.events,
      gasWanted: result.gasWanted,
      gasUsed: result.gasUsed,
    };
  }

  public async execute(
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    fee: StdFee | 'auto' | number,
    memo = '',
    funds?: readonly Coin[],
  ): Promise<ExecuteResult> {
    const instruction: ExecuteInstruction = {
      contractAddress: contractAddress,
      msg: msg,
      funds: funds,
    };
    return this.executeMultiple(senderAddress, [instruction], fee, memo);
  }

  /**
   * Like `execute` but allows executing multiple messages in one transaction.
   */
  public async executeMultiple(
    senderAddress: string,
    instructions: readonly ExecuteInstruction[],
    fee: StdFee | 'auto' | number,
    memo = '',
  ): Promise<ExecuteResult> {
    const msgs: MsgExecuteContractEncodeObject[] = instructions.map((i) => ({
      typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
      value: MsgExecuteContract.fromPartial({
        sender: senderAddress,
        contract: i.contractAddress,
        msg: toUtf8(JSON.stringify(i.msg)),
        funds: [...(i.funds || [])],
      }),
    }));
    const result = await this.signAndBroadcast(senderAddress, msgs, fee, memo);
    if (isDeliverTxFailure(result)) {
      throw new Error(createDeliverTxResponseErrorMessage(result));
    }
    return {
      logs: logs.parseRawLog(result.rawLog),
      height: result.height,
      transactionHash: result.transactionHash,
      events: result.events,
      gasWanted: result.gasWanted,
      gasUsed: result.gasUsed,
    };
  }

  public async sendTokens(
    senderAddress: string,
    recipientAddress: string,
    amount: readonly Coin[],
    fee: StdFee | 'auto' | number,
    memo = '',
  ): Promise<DeliverTxResponse> {
    const sendMsg: MsgSendEncodeObject = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: senderAddress,
        toAddress: recipientAddress,
        amount: [...amount],
      },
    };
    return this.signAndBroadcast(senderAddress, [sendMsg], fee, memo);
  }
}

function createDeliverTxResponseErrorMessage(
  result: DeliverTxResponse,
): string {
  return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
}

/**
 * Searches in events for an event of the given event type which contains an
 * attribute for with the given key.
 *
 * Throws if the attribute was not found.
 */
export function findAttribute(
  events: readonly Event[],
  eventType: string,
  attrKey: string,
): Attribute {
  // all attributes from events with the right event type
  const attributes = events
    .filter((event) => event.type === eventType)
    .flatMap((e) => e.attributes);
  const out = attributes.find((attr) => attr.key === attrKey);
  if (!out) {
    throw new Error(
      `Could not find attribute '${attrKey}' in first event of type '${eventType}' in first log.`,
    );
  }
  return out;
}

export async function simulate(
  rpc: ProtobufRpcClient,
  messages: readonly Any[],
  memo: string | undefined,
  signer: Any,
  sequence: number,
) {
  // Use this service to get easy typed access to query methods
  // This cannot be used for proof verification
  const queryService = new ServiceClientImpl(rpc);

  const tx = Tx.fromPartial({
    authInfo: AuthInfo.fromPartial({
      fee: Fee.fromPartial({}),
      signerInfos: [
        {
          publicKey: signer,
          sequence: BigInt(sequence),
          modeInfo: { single: { mode: SignMode.SIGN_MODE_UNSPECIFIED } },
        },
      ],
    }),
    body: TxBody.fromPartial({
      messages: Array.from(messages),
      memo: memo,
    }),
    signatures: [new Uint8Array()],
  });
  const request = SimulateRequest.fromPartial({
    txBytes: Tx.encode(tx).finish(),
  });
  const response = await queryService.Simulate(request);
  return response;
}
