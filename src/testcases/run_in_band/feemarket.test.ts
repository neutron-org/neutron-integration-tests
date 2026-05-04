import { MsgSendEncodeObject } from '@cosmjs/stargate';
import '@neutron-org/neutronjsplus';
import { getEventAttribute } from '@neutron-org/neutronjsplus/dist/cosmos';
import { LocalState } from '../../helpers/local_state';
import { RunnerTestSuite, inject } from 'vitest';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';

import { QueryClientImpl as FeemarketQueryClient } from '@neutron-org/neutronjs/feemarket/feemarket/v1/query.rpc.Query';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import { MsgParams } from '@neutron-org/neutronjs/feemarket/feemarket/v1/tx';
import { Params as FeemarketParams } from '@neutron-org/neutronjs/feemarket/feemarket/v1/params';
import { MsgUpdateParams as DynamicfeesMsgUpdateParams } from '@neutron-org/neutronjs/neutron/dynamicfees/v1/tx';

import config from '../../config.json';
import { IBC_ATOM_DENOM, NEUTRON_DENOM } from '../../helpers/constants';
import { Wallet } from '../../helpers/wallet';
import { delegateTokens } from '../../helpers/staking';
import {
  executeMsgSubmitProposalV1,
  executeMsgVoteNeutron,
} from '../../helpers/gov';

const GOV_MODULE_ADDRESS = 'neutron10d07y265gmmuvt4z0w9aw880jnsr700j7a68v5';

describe('Neutron / Fee Market', () => {
  let testState: LocalState;
  let neutronWallet: Wallet;
  let neutronClient: NeutronTestClient;
  let govWallet: Wallet;
  let govClient: NeutronTestClient;
  let feemarketQuerier: FeemarketQueryClient;
  let tokenRecipientAddress: string;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    const neutronRpcClient = await testState.neutronRpcClient();

    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);
    govWallet = await testState.nextSecp256k1SignNeutronWallet();
    govClient = await NeutronTestClient.connectWithSigner(govWallet);

    await delegateTokens(
      govClient,
      govWallet.address,
      testState.wallets.neutron.val1.valAddress,
      '5000000000',
    );

    feemarketQuerier = new FeemarketQueryClient(neutronRpcClient);
    tokenRecipientAddress = govWallet.address;

    await executeSwitchFeemarket(
      feemarketQuerier,
      govClient,
      govWallet,
      'enable feemarket',
      true,
    );
  });

  let counter = 1;

  const executeSwitchFeemarket = async (
    feemarketQuery: FeemarketQueryClient,
    govClient: NeutronTestClient,
    govWallet: Wallet,
    kind: string,
    enabled: boolean,
    window = 1n,
  ) => {
    const resParams = await feemarketQuery.params();
    const params = resParams.params;
    const updateParams = FeemarketParams.fromPartial({
      alpha: params.alpha,
      beta: params.beta,
      gamma: params.gamma,
      delta: params.delta,
      minBaseGasPrice: params.minBaseGasPrice,
      minLearningRate: params.minLearningRate,
      maxLearningRate: params.maxLearningRate,
      maxBlockUtilization: params.maxBlockUtilization,
      window,
      feeDenom: params.feeDenom,
      enabled,
      distributeFees: params.distributeFees,
      sendTipToProposer: params.sendTipToProposer,
    });

    const res = await executeMsgSubmitProposalV1(
      govClient,
      govWallet,
      'Change Proposal - ' + kind + ' #' + counter,
      'Param change proposal. It will change enabled params of feemarket module.',
      '',
      [
        {
          typeUrl: '/feemarket.feemarket.v1.MsgParams',
          value: MsgParams.encode(
            MsgParams.fromJSON({
              authority: GOV_MODULE_ADDRESS,
              params: FeemarketParams.toJSON(updateParams),
            }),
          ).finish(),
        },
      ],
      [{ denom: NEUTRON_DENOM, amount: '60000000' }],
      true,
      { gas: '4000000', amount: [{ denom: NEUTRON_DENOM, amount: '10000' }] },
    );
    expect(res.code).toEqual(0);
    const proposalId = parseInt(
      getEventAttribute(res.events, 'submit_proposal', 'proposal_id') || '1',
      10,
    );
    const voteRes = await executeMsgVoteNeutron(
      govClient,
      govWallet,
      proposalId,
    );
    expect(voteRes.code).toEqual(0);
    await waitSeconds(15);

    counter++;
  };

  const executeChangeGasPrices = async (
    govClient: NeutronTestClient,
    govWallet: Wallet,
    kind: string,
    params: { ntrnPrices: { denom: string; amount: string }[] },
  ) => {
    const res = await executeMsgSubmitProposalV1(
      govClient,
      govWallet,
      'Change Proposal - ' + kind + ' #' + counter,
      'Param change proposal. It will change gas price list of dynamicfees/feemarket module.',
      '',
      [
        {
          typeUrl: '/neutron.dynamicfees.v1.MsgUpdateParams',
          value: DynamicfeesMsgUpdateParams.encode(
            DynamicfeesMsgUpdateParams.fromJSON({
              authority: GOV_MODULE_ADDRESS,
              params: { ntrnPrices: params.ntrnPrices },
            }),
          ).finish(),
        },
      ],
      [{ denom: NEUTRON_DENOM, amount: '60000000' }],
      true,
      { gas: '4000000', amount: [{ denom: NEUTRON_DENOM, amount: '10000' }] },
    );
    expect(res.code).toEqual(0);
    const proposalId = parseInt(
      getEventAttribute(res.events, 'submit_proposal', 'proposal_id') || '1',
      10,
    );
    const voteRes = await executeMsgVoteNeutron(
      govClient,
      govWallet,
      proposalId,
    );
    expect(voteRes.code).toEqual(0);
    await waitSeconds(15);

    counter++;
  };

  test('success tx', async () => {
    const res = await neutronClient.sendTokens(
      tokenRecipientAddress,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '500' }], // 0.0025
      },
    );

    await neutronClient.waitBlocks(2);

    expect(res.code).toEqual(0);
  });

  test('failed: insufficient fee', async () => {
    await expect(
      neutronClient.sendTokens(
        tokenRecipientAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '200' }], // 0.001
        },
      ),
    ).rejects.toThrowError(
      /error checking fee: got: 200untrn required: 500untrn, minGasPrice: 0.002500000000000000untrn/,
    );
  });

  test('additional ibc denom', async () => {
    await expect(
      neutronClient.sendTokens(
        tokenRecipientAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: IBC_ATOM_DENOM, amount: '200' }],
        },
      ),
    ).rejects.toThrowError(
      /unable to get min gas price for denom uibcatom: unknown denom/,
    );

    // 5 ntrn per ATOM, gives atom gas price 5 times lower,  0.0005 IBC_ATOM_DENOM and 0.0025 NTRN

    await executeChangeGasPrices(
      govClient,
      govWallet,
      'dynamicfees gasprices',
      {
        ntrnPrices: [{ denom: IBC_ATOM_DENOM, amount: '5' }],
      },
    );

    await expect(
      neutronClient.sendTokens(
        tokenRecipientAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: IBC_ATOM_DENOM, amount: '50' }], // 0.00025
        },
      ),
    ).rejects.toThrowError(
      /error checking fee: got: 50uibcatom required: 100uibcatom, minGasPrice: 0.000500000000000000uibcatom/,
    );

    const res = await neutronClient.sendTokens(
      tokenRecipientAddress,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: IBC_ATOM_DENOM, amount: '100' }], // 0.0005
      },
    );

    await neutronClient.waitBlocks(2);

    expect(res.code).toEqual(0);
  });

  test('disable/enable feemarket module', async () => {
    await executeSwitchFeemarket(
      feemarketQuerier,
      govClient,
      govWallet,
      'disable feemarket',
      false,
    );

    // feemarket disabled
    // with a zero fee we fail due to default cosmos ante handler check
    await expect(
      neutronClient.sendTokens(
        tokenRecipientAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '0' }],
        },
      ),
    ).rejects.toThrowError(
      /Insufficient fees; got: 0untrn required: 500ibc\/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2,500untrn: insufficient fee/,
    );

    await neutronClient.waitBlocks(2);

    await executeSwitchFeemarket(
      feemarketQuerier,
      govClient,
      govWallet,
      'enable feemarket',
      true,
    );

    // feemarket enabled
    // with a zero fee we fail due to feemarket ante handler check
    await expect(
      neutronClient.sendTokens(
        tokenRecipientAddress,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '0' }],
        },
      ),
    ).rejects.toThrowError(
      /error checking fee: got: 0untrn required: 500untrn, minGasPrice: 0.002500000000000000untrn/,
    );
  });

  test('gas price gets up and down', async () => {
    await executeSwitchFeemarket(
      feemarketQuerier,
      govClient,
      govWallet,
      'enable feemarket',
      true,
      1n,
    );

    const msgSend: MsgSendEncodeObject = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: neutronWallet.address,
        toAddress: tokenRecipientAddress,
        amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
      },
    };

    const baseGasPrice = +(
      await feemarketQuerier.gasPrice({ denom: NEUTRON_DENOM })
    ).price.amount;
    const requiredGas = '30000000';
    // due to rounding poor accuracy, it's recommended pay a little bit more fees
    const priceAdjustment = 1.55;
    for (let i = 0; i < 5; i++) {
      const fees = Math.floor(
        +requiredGas * baseGasPrice * priceAdjustment,
      ).toString();
      // 1100msgs consume more than 50% gas
      try {
        await neutronClient.signAndBroadcastSync(
          new Array(1100).fill(msgSend),
          {
            gas: requiredGas,
            amount: [{ denom: NEUTRON_DENOM, amount: fees }],
          },
        );
      } catch (e) {
        // do nothing if called with the same sequence
        console.log(e);
      }
      await neutronClient.waitBlocks(1);
    }

    const inflatedGasPrice = +(
      await feemarketQuerier.gasPrice({ denom: NEUTRON_DENOM })
    ).price.amount;
    // gas price should be higher after big transactions
    expect(inflatedGasPrice).toBeGreaterThan(baseGasPrice);

    await neutronClient.waitBlocks(10);

    const newNtrnGasPrice = +(
      await feemarketQuerier.gasPrice({
        denom: NEUTRON_DENOM,
      })
    ).price.amount;
    expect(newNtrnGasPrice).toBeLessThan(inflatedGasPrice);
    // expect gas price to fall to the base after some amount of blocks passed
    expect(newNtrnGasPrice).toBe(0.0025);
  });
});
