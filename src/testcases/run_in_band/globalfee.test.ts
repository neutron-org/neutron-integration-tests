import { Coin } from '@cosmjs/proto-signing';
import '@neutron-org/neutronjsplus';
import { inject, expect } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { QueryClientImpl as GlobalfeeQueryClient } from '@neutron-org/neutronjs/gaia/globalfee/v1beta1/query.rpc.Query';
import config from '../../config.json';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import { Wallet } from '../../helpers/wallet';
import { delegateTokens } from '../../helpers/staking';
import { executeMsgSubmitProposalV1, executeMsgVoteNeutron } from '../../helpers/gov';
import { getEventAttribute } from '@neutron-org/neutronjsplus/dist/cosmos';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { MsgUpdateParams as GlobalfeeMsgUpdateParams } from '@neutron-org/neutronjs/gaia/globalfee/v1beta1/tx';
import { Params as GlobalfeeParams } from '@neutron-org/neutronjs/gaia/globalfee/v1beta1/params';
import { RunnerTestSuite } from 'vitest';

const GOV_MODULE_ADDRESS = 'neutron10d07y265gmmuvt4z0w9aw880jnsr700j7a68v5';

const PROPOSAL_DEPOSIT = [{ denom: NEUTRON_DENOM, amount: '60000000' }];
const PROPOSAL_FEE = { gas: '4000000', amount: [{ denom: NEUTRON_DENOM, amount: '40000' }] };

describe('Neutron / Global Fee', () => {
  let testState: LocalState;
  let neutronWallet: Wallet;
  let neutronClient: NeutronTestClient;
  let govWallet: Wallet;
  let govClient: NeutronTestClient;
  let globalfeeQuerier: GlobalfeeQueryClient;
  let recipientAddress: string;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);
    govWallet = await testState.nextSecp256k1SignNeutronWallet();
    govClient = await NeutronTestClient.connectWithSigner(govWallet);
    recipientAddress = govWallet.address;

    const neutronRpcClient = await testState.neutronRpcClient();
    globalfeeQuerier = new GlobalfeeQueryClient(neutronRpcClient);

    const govRes = await delegateTokens(
      govClient,
      govWallet.address,
      testState.wallets.neutron.val1.valAddress,
      '5000000000',
    );
    expect(govRes.code).toEqual(0);
  });

  let counter = 1;

  const executeParamChange = async (
    kind: string,
    bypassMinFeeMsgTypes: string[] | null,
    minimumGasPrices: Coin[] | null,
    maxTotalBypassMinFeesGasUsage: bigint | null,
  ) => {
    const res = await globalfeeQuerier.params();
    if (bypassMinFeeMsgTypes == null) {
      bypassMinFeeMsgTypes = res.params.bypassMinFeeMsgTypes;
    }
    if (minimumGasPrices == null) {
      minimumGasPrices = res.params.minimumGasPrices.map((p) => ({
        denom: p.denom,
        amount: p.amount,
      }));
    }
    if (maxTotalBypassMinFeesGasUsage == null) {
      maxTotalBypassMinFeesGasUsage = res.params.maxTotalBypassMinFeeMsgGasUsage;
    }

    const msgRes = await executeMsgSubmitProposalV1(
      govClient,
      govWallet,
      'Change Proposal - ' + kind + ' #' + counter,
      'Param change proposal. It will change the bypass min fee msg types of the global fee module to use MsgSend.',
      '',
      [
        {
          typeUrl: GlobalfeeMsgUpdateParams.typeUrl,
          value: GlobalfeeMsgUpdateParams.encode(
            GlobalfeeMsgUpdateParams.fromPartial({
              authority: GOV_MODULE_ADDRESS,
              params: GlobalfeeParams.fromPartial({
                bypassMinFeeMsgTypes,
                maxTotalBypassMinFeeMsgGasUsage: maxTotalBypassMinFeesGasUsage,
                minimumGasPrices,
              }),
            }),
          ).finish(),
        },
      ],
      PROPOSAL_DEPOSIT,
      true,
      PROPOSAL_FEE,
    );
    expect(msgRes.code).toEqual(0);
    const proposalId = parseInt(
      getEventAttribute(msgRes.events, 'submit_proposal', 'proposal_id') || '1',
      10,
    );
    const voteRes = await executeMsgVoteNeutron(govClient, govWallet, proposalId);
    expect(voteRes.code).toEqual(0);
    await waitSeconds(15);

    counter++;
  };

  test('check globalfee params before proposal execution', async () => {
    const res = await globalfeeQuerier.params();
    expect(res.params.minimumGasPrices).toEqual([
      {
        denom:
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        amount: '0',
      },
      { denom: 'untrn', amount: '0' },
    ]);
    expect(res.params.bypassMinFeeMsgTypes).toEqual([
      '/ibc.core.channel.v1.Msg/RecvPacket',
      '/ibc.core.channel.v1.Msg/Acknowledgement',
      '/ibc.core.client.v1.Msg/UpdateClient',
    ]);
    expect(res.params.maxTotalBypassMinFeeMsgGasUsage).toEqual(1000000n);
  });

  test('change minimum gas price parameter', async () => {
    await executeParamChange(
      'MinimumGasPricesParam',
      null,
      [{ denom: 'untrn', amount: '0.01' }],
      null,
    );
  });

  test('check globalfee minimum param changed', async () => {
    const res = await globalfeeQuerier.params();
    expect(res.params.minimumGasPrices).toEqual([
      { denom: 'untrn', amount: '0.01' },
    ]);
  });

  test('check minimum global fees with bank send command', async () => {
    await expect(
      neutronClient.sendTokens(
        recipientAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
        },
      ),
    ).rejects.toThrowError(
      /Insufficient fees; got: 500untrn required: 2000untrn: insufficient fee/,
    );
  });

  test('set bypass_min_fee_msg_types to allow bypass for MsgSend', async () => {
    await executeParamChange(
      'BypassMinFeeMsgTypes',
      ['/cosmos.bank.v1beta1.MsgSend'],
      null,
      null,
    );
  });

  test('check globalfee params after setting bypass_min_fee_msg_types', async () => {
    const res = await globalfeeQuerier.params();
    expect(res.params.bypassMinFeeMsgTypes).toEqual([
      '/cosmos.bank.v1beta1.MsgSend',
    ]);
  });

  test('check that MsgSend passes check for allowed messages - now works with only validator fees', async () => {
    const res = await neutronClient.sendTokens(
      recipientAddress,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
      },
    );

    await neutronClient.waitBlocks(2);

    expect(res.code).toEqual(0);
  });

  test('set max_total_bypass_min_fee_msg_gas_usage to very low value', async () => {
    await executeParamChange(
      'MaxTotalBypassMinFeeMsgGasUsage',
      null,
      null,
      50n,
    );
  });

  test('check globalfee params after setting max_total_bypass_min_fee_msg_gas_usage', async () => {
    const res = await globalfeeQuerier.params();
    expect(res.params.maxTotalBypassMinFeeMsgGasUsage).toEqual(50n);
  });

  test('check that MsgSend does not work without minimal fees now', async () => {
    await neutronClient.waitBlocks(2);
    await expect(
      neutronClient.sendTokens(
        recipientAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
        },
      ),
    ).rejects.toThrowError(
      /Insufficient fees; bypass-min-fee-msg-types with gas consumption 200000 exceeds the maximum allowed gas value of 50.: insufficient fee/,
    );
  });

  test('revert minimum gas price parameter to zero values', async () => {
    await executeParamChange(
      'MinimumGasPricesParam',
      null,
      [
        {
          denom:
            'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
          amount: '0',
        },
        { denom: 'untrn', amount: '0' },
      ],
      null,
    );
  });

  test('revert bypass_min_fee_msg_types to defaults', async () => {
    await executeParamChange(
      'BypassMinFeeMsgTypes',
      [
        '/ibc.core.channel.v1.Msg/RecvPacket',
        '/ibc.core.channel.v1.Msg/Acknowledgement',
        '/ibc.core.client.v1.Msg/UpdateClient',
      ],
      null,
      null,
    );
  });

  test('check minumum global fees with bank send command after revert with zero value (only validator min fee settings applied)', async () => {
    const res = await neutronClient.sendTokens(
      recipientAddress,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
      },
    );

    await neutronClient.waitBlocks(2);

    expect(res.code).toEqual(0);
  });
});
