import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { COSMOS_DENOM, NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { inject } from 'vitest';
import { LocalState, createWalletWrapper } from '../../helpers/localState';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import {
  TotalBurnedNeutronsAmountResponse,
  TotalSupplyByDenomResponse,
} from '@neutron-org/neutronjsplus/dist/types';
import { QueryClientImpl as FeeburnerQueryClient } from '@neutron-org/cosmjs-types/neutron/feeburner/query';

const config = require('../../config.json');

describe('Neutron / Tokenomics', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let gaiaChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let gaiaAccount: WalletWrapper;
  let treasuryContractAddress: string;

  beforeAll(async () => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.restNeutron,
      testState.rpcNeutron,
    );
    neutronAccount = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.qa,
    );
    gaiaChain = new CosmosWrapper(
      COSMOS_DENOM,
      testState.restGaia,
      testState.rpcGaia,
    );
    gaiaAccount = await createWalletWrapper(
      gaiaChain,
      testState.wallets.qaCosmos.qa,
    );

    const neutronRpcClient = await testState.rpcClient('neutron');
    const feeburnerQuery = new FeeburnerQueryClient(neutronRpcClient);
    treasuryContractAddress = (await feeburnerQuery.Params()).params
      .treasuryAddress;
  });

  describe('75% of Neutron fees are burned', () => {
    const bigFee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let burnedBefore: TotalBurnedNeutronsAmountResponse;

    test('Read total burned neutrons amount', async () => {
      burnedBefore = await neutronChain.queryTotalBurnedNeutronsAmount();
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address,
        '1000',
        bigFee,
      );
    });

    test('Total burned neutrons amount has increased', async () => {
      const burnedAfter = await neutronChain.queryTotalBurnedNeutronsAmount();
      const diff =
        +(burnedAfter.total_burned_neutrons_amount.coin.amount || 0) -
        +(burnedBefore.total_burned_neutrons_amount.coin.amount || 0);
      expect(diff).toBeGreaterThanOrEqual(10e8 * 0.75);
    });
  });

  describe('Total supply of neutrons decreases after fee processing', () => {
    const bigFee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let totalSupplyBefore: TotalSupplyByDenomResponse;

    test('Read total supply', async () => {
      totalSupplyBefore = await neutronChain.queryTotalSupplyByDenom(
        NEUTRON_DENOM,
      );
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address,
        '1000',
        bigFee,
      );
    });

    test('Total supply of neutrons has decreased', async () => {
      const totalSupplyAfter = await neutronChain.queryTotalSupplyByDenom(
        NEUTRON_DENOM,
      );
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
      balanceBefore = await neutronChain.queryDenomBalance(
        treasuryContractAddress,
        NEUTRON_DENOM,
      );
    });

    test('Perform any tx and pay with neutron fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address,
        '1000',
        fee,
      );
    });

    test("Balance of Treasury in NTRNs hasn't increased", async () => {
      await neutronChain.waitBlocks(1);
      const balanceAfter = await neutronChain.queryDenomBalance(
        treasuryContractAddress,
        NEUTRON_DENOM,
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
      await gaiaAccount.msgIBCTransfer(
        'transfer',
        'channel-0',
        {
          denom: COSMOS_DENOM,
          amount: '100000',
        },
        testState.wallets.qaNeutron.qa.address,
        { revisionNumber: BigInt(2), revisionHeight: BigInt(100000000) },
      );
      await neutronChain.getWithAttempts(
        async () =>
          neutronChain.queryBalances(testState.wallets.qaNeutron.qa.address),
        async (balances) =>
          balances.find((balance) => balance.denom === ibcUatomDenom) !==
          undefined,
      );
    });

    test('Read Treasury balance', async () => {
      balanceBefore = await neutronChain.queryDenomBalance(
        treasuryContractAddress,
        ibcUatomDenom,
      );
    });

    test('Perform any tx and pay with uatom fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address,
        '1000',
        fee,
      );
    });

    test('Balance of Treasury in uatoms has been increased', async () => {
      const balanceAfter = await neutronChain.queryDenomBalance(
        treasuryContractAddress,
        ibcUatomDenom,
      );
      const diff = balanceAfter - balanceBefore;
      expect(diff).toBeGreaterThanOrEqual(+fee.amount[0].amount * 0.75);
    });
  });
});
