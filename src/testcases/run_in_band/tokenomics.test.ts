import '@neutron-org/neutronjsplus';
import { COSMOS_DENOM, NEUTRON_DENOM } from '../../helpers/constants';
import { inject } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { QueryClientImpl as FeeburnerQueryClient } from '@neutron-org/neutronjs/neutron/feeburner/query.rpc.Query';
import { Registry } from '@cosmjs/proto-signing';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/cosmjs-types/cosmos/bank/v1beta1/query';
import { QueryTotalBurnedNeutronsAmountResponse } from '@neutron-org/neutronjs/neutron/feeburner/query';
import { QuerySupplyOfResponse } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';

import config from '../../config.json';
import { Wallet } from '../../helpers/wallet';

describe('Neutron / Tokenomics', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: Wallet;
  let treasuryContractAddress: string;

  let bankQuerier: BankQueryClient;
  let feeburnerQuerier: FeeburnerQueryClient;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronWallet = testState.wallets.qaNeutron.qa;
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );

    gaiaWallet = testState.wallets.qaCosmos.qa;
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.directwallet,
      { registry: new Registry(defaultRegistryTypes) },
    );

    const neutronRpcClient = await testState.rpcClient('neutron');
    const feeburnerQuery = new FeeburnerQueryClient(neutronRpcClient);
    treasuryContractAddress = (await feeburnerQuery.params()).params
      .treasuryAddress;

    bankQuerier = new BankQueryClient(neutronRpcClient);
    feeburnerQuerier = new FeeburnerQueryClient(neutronRpcClient);
  });

  describe('75% of Neutron fees are burned', () => {
    const bigFee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let burnedBefore: QueryTotalBurnedNeutronsAmountResponse;

    test('Read total burned neutrons amount', async () => {
      burnedBefore = await feeburnerQuerier.totalBurnedNeutronsAmount();
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronClient.sendTokens(
        testState.wallets.neutron.rly1.address,
        [
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        ],
        bigFee,
      );
    });

    test('Total burned neutrons amount has increased', async () => {
      const burnedAfter = await feeburnerQuerier.totalBurnedNeutronsAmount();
      const diff =
        +(burnedAfter.totalBurnedNeutronsAmount.coin.amount || 0) -
        +(burnedBefore.totalBurnedNeutronsAmount.coin.amount || 0);
      expect(diff).toBeGreaterThanOrEqual(10e8 * 0.75);
    });
  });

  describe('Total supply of neutrons decreases after fee processing', () => {
    const bigFee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let totalSupplyBefore: QuerySupplyOfResponse;

    test('Read total supply', async () => {
      totalSupplyBefore = await bankQuerier.SupplyOf({ denom: NEUTRON_DENOM });
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronClient.sendTokens(
        testState.wallets.neutron.rly1.address,
        [
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        ],
        bigFee,
      );
    });

    test('Total supply of neutrons has decreased', async () => {
      const totalSupplyAfter = await bankQuerier.SupplyOf({
        denom: NEUTRON_DENOM,
      });
      const diff =
        +(totalSupplyBefore.amount.amount || 0) -
        +(totalSupplyAfter.amount.amount || 0);
      expect(diff).toBeGreaterThanOrEqual(10e8 * 0.75);
    });
  });

  describe('NTRN fees are not sent to Treasury', () => {
    let balanceBefore: number;
    const fee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: '5000' }],
    };

    test('Read Treasury balance', async () => {
      balanceBefore = parseInt(
        (await neutronClient.getBalance(treasuryContractAddress, NEUTRON_DENOM))
          .amount,
        10,
      );
    });

    test('Perform any tx and pay with neutron fee', async () => {
      await neutronClient.sendTokens(
        testState.wallets.neutron.rly1.address,
        [
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        ],
        fee,
      );
    });

    test("Balance of Treasury in NTRNs hasn't increased", async () => {
      await neutronClient.waitBlocks(1);
      const balanceAfter = parseInt(
        (await neutronClient.getBalance(treasuryContractAddress, NEUTRON_DENOM))
          .amount,
        10,
      );
      const diff = balanceAfter - balanceBefore;
      expect(diff).toEqual(0);
    });
  });

  describe('75% of non-Neutron fees are sent to Treasury', () => {
    let balanceBefore: number;
    const ibcUatomDenom =
      'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';
    const fee = {
      gas: '200000',
      amount: [
        {
          denom: ibcUatomDenom,
          amount: '5000',
        },
      ],
    };

    test('obtain uatom tokens', async () => {
      await gaiaClient.signAndBroadcast(
        gaiaWallet.address,
        [
          {
            typeUrl: MsgTransfer.typeUrl,
            value: MsgTransfer.fromPartial({
              sourcePort: 'transfer',
              sourceChannel: 'channel-0',
              token: { denom: COSMOS_DENOM, amount: '100000' },
              sender: gaiaWallet.address,
              receiver: testState.wallets.qaNeutron.qa.address,
              timeoutHeight: {
                revisionNumber: 2n,
                revisionHeight: 100000000n,
              },
            }),
          },
        ],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      await neutronClient.getWithAttempts(
        async () =>
          neutronClient.getBalance(
            testState.wallets.qaNeutron.qa.address,
            ibcUatomDenom,
          ),
        async (balance) => balance !== undefined,
      );
    });

    test('Read Treasury balance', async () => {
      balanceBefore = parseInt(
        (await neutronClient.getBalance(treasuryContractAddress, ibcUatomDenom))
          .amount,
        10,
      );
    });

    test('Perform any tx and pay with uatom fee', async () => {
      await neutronClient.sendTokens(
        testState.wallets.neutron.rly1.address,
        [
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        ],
        fee,
      );
    });

    test('Balance of Treasury in uatoms has been increased', async () => {
      const balanceAfter = parseInt(
        (await neutronClient.getBalance(treasuryContractAddress, ibcUatomDenom))
          .amount,
        10,
      );
      const diff = balanceAfter - balanceBefore;
      expect(diff).toBeGreaterThanOrEqual(+fee.amount[0].amount * 0.75);
    });
  });
});
