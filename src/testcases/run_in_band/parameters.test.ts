import { LocalState } from '../../helpers/local_state';
import '@neutron-org/neutronjsplus';
import { inject, expect } from 'vitest';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import { createRPCQueryClient as createIbcClient } from '@neutron-org/neutronjs/ibc/rpc.query';
import { createRPCQueryClient as createOsmosisClient } from '@neutron-org/neutronjs/osmosis/rpc.query';
import { QueryClientImpl as ConsensusClient } from '@neutron-org/neutronjs/cosmos/consensus/v1/query.rpc.Query';
import {
  IbcQuerier,
  NeutronQuerier,
  OsmosisQuerier,
} from '@neutron-org/neutronjs/querier_types';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import config from '../../config.json';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import { Wallet } from '../../helpers/wallet';
import {
  executeMsgSubmitProposalV1,
  executeMsgVoteNeutron,
} from '../../helpers/gov';
import { delegateTokens } from '../../helpers/staking';
import { getEventAttribute } from '@neutron-org/neutronjsplus/dist/cosmos';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { MsgUpdateParams as InterchainqueriesMsgUpdateParams } from '@neutron-org/neutronjs/neutron/interchainqueries/tx';
import { Params as InterchainqueriesParams } from '@neutron-org/neutronjs/neutron/interchainqueries/params';
import { MsgUpdateParams as FeerefunderMsgUpdateParams } from '@neutron-org/neutronjs/neutron/feerefunder/tx';
import { Params as FeerefunderParams } from '@neutron-org/neutronjs/neutron/feerefunder/params';
import { MsgUpdateParams as CronMsgUpdateParams } from '@neutron-org/neutronjs/neutron/cron/tx';
import { Params as CronParams } from '@neutron-org/neutronjs/neutron/cron/params';
import { MsgUpdateParams as ContractmanagerMsgUpdateParams } from '@neutron-org/neutronjs/neutron/contractmanager/tx';
import { Params as ContractmanagerParams } from '@neutron-org/neutronjs/neutron/contractmanager/params';
import { MsgUpdateParams as InterchaintxsMsgUpdateParams } from '@neutron-org/neutronjs/neutron/interchaintxs/v1/tx';
import { Params as InterchaintxsParams } from '@neutron-org/neutronjs/neutron/interchaintxs/v1/params';
import { MsgUpdateParams as TransferMsgUpdateParams } from '@neutron-org/neutronjs/neutron/transfer/v1/tx';
import { Params as IbcTransferParams } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/transfer';
import { MsgUpdateParams as ConsensusMsgUpdateParams } from '@neutron-org/neutronjs/cosmos/consensus/v1/tx';
import { BinaryWriter } from '@neutron-org/neutronjs/binary';
import { Params as TokenfactoryParams } from '@neutron-org/neutronjs/osmosis/tokenfactory/params';
import { Duration } from '@neutron-org/neutronjs/google/protobuf/duration';

const GOV_MODULE_ADDRESS = 'neutron10d07y265gmmuvt4z0w9aw880jnsr700j7a68v5';

const PROPOSAL_DEPOSIT = [{ denom: NEUTRON_DENOM, amount: '60000000' }];
const PROPOSAL_FEE = {
  gas: '4000000',
  amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
};

function encodeTokenfactoryMsgUpdateParams(
  authority: string,
  params: {
    denomCreationFee: { denom: string; amount: string }[];
    denomCreationGasConsume?: bigint;
    feeCollectorAddress: string;
    whitelistedHooks: { codeId: bigint; denomCreator: string }[];
  },
): Uint8Array {
  const writer = BinaryWriter.create();
  if (authority !== '') writer.uint32(10).string(authority);
  TokenfactoryParams.encode(
    TokenfactoryParams.fromPartial(params),
    writer.uint32(18).fork(),
  ).ldelim();
  return writer.finish();
}

async function submitGovProposal(
  govClient: NeutronTestClient,
  govWallet: Wallet,
  title: string,
  summary: string,
  messages: { typeUrl: string; value: Uint8Array }[],
): Promise<number> {
  const res = await executeMsgSubmitProposalV1(
    govClient,
    govWallet,
    title,
    summary,
    '',
    messages,
    PROPOSAL_DEPOSIT,
    true,
    PROPOSAL_FEE,
  );
  expect(res.code).toEqual(0);
  const proposalId = parseInt(
    getEventAttribute(res.events, 'submit_proposal', 'proposal_id') || '1',
    10,
  );
  const voteRes = await executeMsgVoteNeutron(govClient, govWallet, proposalId);
  expect(voteRes.code).toEqual(0);
  await waitSeconds(15);
  return proposalId;
}

describe('Neutron / Parameters', () => {
  let testState: LocalState;

  let govWallet: Wallet;
  let govClient: NeutronTestClient;

  let neutronQuerier: NeutronQuerier;
  let ibcQuerier: IbcQuerier;
  let osmosisQuerier: OsmosisQuerier;
  let consensusQuerier: ConsensusClient;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    govWallet = await testState.nextSecp256k1SignNeutronWallet();
    govClient = await NeutronTestClient.connectWithSigner(govWallet);

    neutronQuerier = await createNeutronClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    ibcQuerier = await createIbcClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    osmosisQuerier = await createOsmosisClient({
      rpcEndpoint: testState.rpcNeutron,
    });

    consensusQuerier = new ConsensusClient(await testState.neutronRpcClient());

    const govDelegateRes = await delegateTokens(
      govClient,
      govWallet.address,
      testState.wallets.neutron.val1.valAddress,
      '5000000000',
    );
    expect(govDelegateRes.code).toEqual(0);
  });

  describe('Interchain queries params proposal', () => {
    test('submit, vote and execute proposal', async () => {
      await submitGovProposal(
        govClient,
        govWallet,
        'Proposal #1',
        'Param change proposal. This one will pass',
        [
          {
            typeUrl: InterchainqueriesMsgUpdateParams.typeUrl,
            value: InterchainqueriesMsgUpdateParams.encode(
              InterchainqueriesMsgUpdateParams.fromPartial({
                authority: GOV_MODULE_ADDRESS,
                params: InterchainqueriesParams.fromPartial({
                  querySubmitTimeout: 30n,
                  queryDeposit: [],
                  txQueryRemovalLimit: 20n,
                  maxKvQueryKeysCount: 10n,
                  maxTransactionsFilters: 10n,
                }),
              }),
            ).finish(),
          },
        ],
      );
    });

    test('check if params changed after proposal execution', async () => {
      const paramsAfter =
        await neutronQuerier.neutron.interchainqueries.params();
      expect(paramsAfter.params.querySubmitTimeout).toEqual(30n);
      expect(paramsAfter.params.txQueryRemovalLimit).toEqual(20n);
      expect(paramsAfter.params.maxKvQueryKeysCount).toEqual(10n);
      expect(paramsAfter.params.maxTransactionsFilters).toEqual(10n);
    });
  });

  describe('Tokenfactory params proposal', () => {
    test('submit, vote and execute proposal', async () => {
      await submitGovProposal(
        govClient,
        govWallet,
        'Proposal #2',
        'Tokenfactory params proposal',
        [
          {
            typeUrl: '/osmosis.tokenfactory.v1beta1.MsgUpdateParams',
            value: encodeTokenfactoryMsgUpdateParams(GOV_MODULE_ADDRESS, {
              feeCollectorAddress: GOV_MODULE_ADDRESS,
              denomCreationFee: [{ denom: NEUTRON_DENOM, amount: '1' }],
              denomCreationGasConsume: 100000n,
              whitelistedHooks: [],
            }),
          },
        ],
      );
    });

    test('check if params changed after proposal execution', async () => {
      const paramsAfter =
        await osmosisQuerier.osmosis.tokenfactory.v1beta1.params();
      expect(paramsAfter.params.denomCreationFee).toEqual([
        { denom: 'untrn', amount: '1' },
      ]);
      expect(paramsAfter.params.denomCreationFee).toHaveLength(1);
      expect(paramsAfter.params.denomCreationGasConsume).toEqual(100000n);
    });
  });

  describe('Feerefunder params proposal', () => {
    test('submit, vote and execute proposal', async () => {
      await submitGovProposal(
        govClient,
        govWallet,
        'Proposal #4',
        'Feerefunder update params proposal',
        [
          {
            typeUrl: FeerefunderMsgUpdateParams.typeUrl,
            value: FeerefunderMsgUpdateParams.encode(
              FeerefunderMsgUpdateParams.fromPartial({
                authority: GOV_MODULE_ADDRESS,
                params: FeerefunderParams.fromPartial({
                  minFee: {
                    recvFee: [],
                    ackFee: [{ amount: '1', denom: NEUTRON_DENOM }],
                    timeoutFee: [{ amount: '1', denom: NEUTRON_DENOM }],
                  },
                  feeEnabled: true,
                }),
              }),
            ).finish(),
          },
        ],
      );
    });

    test('check if params changed after proposal execution', async () => {
      const paramsAfter = await neutronQuerier.neutron.feerefunder.params();
      expect(paramsAfter.params.minFee.recvFee).toHaveLength(0);
      expect(paramsAfter.params.minFee.ackFee).toEqual([
        { amount: '1', denom: NEUTRON_DENOM },
      ]);
      expect(paramsAfter.params.minFee.timeoutFee).toEqual([
        { amount: '1', denom: NEUTRON_DENOM },
      ]);
    });
  });

  describe('Cron params proposal', () => {
    test('submit, vote and execute proposal', async () => {
      await submitGovProposal(
        govClient,
        govWallet,
        'Proposal #5',
        'Cron update params proposal. Will pass',
        [
          {
            typeUrl: CronMsgUpdateParams.typeUrl,
            value: CronMsgUpdateParams.encode(
              CronMsgUpdateParams.fromPartial({
                authority: GOV_MODULE_ADDRESS,
                params: CronParams.fromPartial({
                  securityAddress: GOV_MODULE_ADDRESS,
                  limit: 10n,
                }),
              }),
            ).finish(),
          },
        ],
      );
    });

    test('check if params changed after proposal execution', async () => {
      const paramsAfter = await neutronQuerier.neutron.cron.params();
      expect(paramsAfter.params.securityAddress).toEqual(GOV_MODULE_ADDRESS);
      expect(paramsAfter.params.limit).toEqual(10n);
    });
  });

  describe('Contractmanager params proposal', () => {
    test('submit, vote and execute proposal', async () => {
      await submitGovProposal(
        govClient,
        govWallet,
        'Proposal #6',
        'Contractmanager params proposal',
        [
          {
            typeUrl: ContractmanagerMsgUpdateParams.typeUrl,
            value: ContractmanagerMsgUpdateParams.encode(
              ContractmanagerMsgUpdateParams.fromPartial({
                authority: GOV_MODULE_ADDRESS,
                params: ContractmanagerParams.fromPartial({
                  sudoCallGasLimit: 1000n,
                }),
              }),
            ).finish(),
          },
        ],
      );
    });

    test('check if params changed after proposal execution', async () => {
      const paramsAfter = await neutronQuerier.neutron.contractmanager.params();
      expect(paramsAfter.params.sudoCallGasLimit).toEqual(1000n);
    });
  });

  describe('Interchaintxs params proposal', () => {
    test('submit, vote and execute proposal', async () => {
      const currentParams =
        await neutronQuerier.neutron.interchaintxs.v1.params();
      await submitGovProposal(
        govClient,
        govWallet,
        'Proposal #7',
        'Update interchaintxs params',
        [
          {
            typeUrl: InterchaintxsMsgUpdateParams.typeUrl,
            value: InterchaintxsMsgUpdateParams.encode(
              InterchaintxsMsgUpdateParams.fromPartial({
                authority: GOV_MODULE_ADDRESS,
                params: InterchaintxsParams.fromPartial({
                  ...currentParams.params,
                  msgSubmitTxMaxMessages: 11n,
                }),
              }),
            ).finish(),
          },
        ],
      );
    });

    test('check if params changed after proposal execution', async () => {
      const paramsAfter =
        await neutronQuerier.neutron.interchaintxs.v1.params();
      expect(paramsAfter.params.msgSubmitTxMaxMessages).toEqual(11n);
    });
  });

  describe('Transfer params proposal', () => {
    test('submit, vote and execute proposal', async () => {
      await submitGovProposal(
        govClient,
        govWallet,
        'Proposal #8',
        'Update transfer params',
        [
          {
            typeUrl: TransferMsgUpdateParams.typeUrl,
            value: TransferMsgUpdateParams.encode(
              TransferMsgUpdateParams.fromPartial({
                signer: GOV_MODULE_ADDRESS,
                params: IbcTransferParams.fromPartial({
                  receiveEnabled: false,
                  sendEnabled: false,
                }),
              }),
            ).finish(),
          },
        ],
      );
    });

    test('check if params changed after proposal execution', async () => {
      const paramsRes = await ibcQuerier.ibc.applications.transfer.v1.params();
      expect(paramsRes.params.sendEnabled).toEqual(false);
      expect(paramsRes.params.receiveEnabled).toEqual(false);
    });
  });

  describe('Consensus params proposal', () => {
    test('submit, vote and execute proposal', async () => {
      await submitGovProposal(
        govClient,
        govWallet,
        'Proposal #9',
        'Update consensus params',
        [
          {
            typeUrl: ConsensusMsgUpdateParams.typeUrl,
            value: ConsensusMsgUpdateParams.encode(
              ConsensusMsgUpdateParams.fromPartial({
                authority: GOV_MODULE_ADDRESS,
                abci: {
                  voteExtensionsEnableHeight: 1n,
                },
                evidence: {
                  maxAgeDuration: Duration.fromPartial({
                    seconds: 3600000n,
                    nanos: 0,
                  }),
                  maxAgeNumBlocks: 100000n,
                  maxBytes: 1048576n,
                },
                validator: {
                  pubKeyTypes: ['ed25519'],
                },
                block: {
                  maxGas: 30_000_000n,
                  maxBytes: 14_857_600n,
                },
              }),
            ).finish(),
          },
        ],
      );
    });

    test('check if params changed after proposal execution', async () => {
      const paramsRes = await consensusQuerier.params();
      expect(paramsRes.params.block?.maxGas).toEqual(30_000_000n);
      expect(paramsRes.params.block?.maxBytes).toEqual(14_857_600n);
    });
  });
});
