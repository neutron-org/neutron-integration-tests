import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import {
  COSMOS_DENOM,
  CosmosWrapper,
  NEUTRON_DENOM,
  TotalBurnedNeutronsAmountResponse,
  TotalSupplyByDenomResponse,
  TREASURY_CONTRACT_ADDRESS,
} from '../helpers/cosmos';
import Long from 'long';
import { getWithAttempts } from '../helpers/wait';

describe('Neutron / Tokenomics', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cmNeutron: CosmosWrapper;
  let cmGaia: CosmosWrapper;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cmNeutron = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.qaNeutron.genQaWal1,
      NEUTRON_DENOM,
    );
    cmGaia = new CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      testState.wallets.qaCosmos.genQaWal1,
      COSMOS_DENOM,
    );
  });

  describe('75% of Neutron fees are burned', () => {
    const bigFee = {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let burnedBefore: TotalBurnedNeutronsAmountResponse;

    test('Read total burned neutrons amount', async () => {
      burnedBefore = await cmNeutron.queryTotalBurnedNeutronsAmount();
    });

    test('Perform tx with a very big neutron fee', async () => {
      await cmNeutron.msgSend(
        testState.wallets.neutron.rly1.address.toString(),
        '1000',
        bigFee,
      );
    });

    test('Total burned neutrons amount has increased', async () => {
      const burnedAfter = await cmNeutron.queryTotalBurnedNeutronsAmount();
      const diff =
        +(burnedAfter.total_burned_neutrons_amount.coin.amount || 0) -
        +(burnedBefore.total_burned_neutrons_amount.coin.amount || 0);
      expect(diff).toBeGreaterThanOrEqual(10e8 * 0.75);
    });
  });

  describe('Total supply of neutrons decreases after fee processing', () => {
    const bigFee = {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let totalSupplyBefore: TotalSupplyByDenomResponse;

    test('Read total supply', async () => {
      totalSupplyBefore = await cmNeutron.queryTotalSupplyByDenom(
        NEUTRON_DENOM,
      );
    });

    test('Perform tx with a very big neutron fee', async () => {
      await cmNeutron.msgSend(
        testState.wallets.neutron.rly1.address.toString(),
        '1000',
        bigFee,
      );
    });

    test('Total supply of neutrons has decreased', async () => {
      const totalSupplyAfter = await cmNeutron.queryTotalSupplyByDenom(
        NEUTRON_DENOM,
      );
      const diff =
        +(totalSupplyBefore.amount.amount || 0) -
        +(totalSupplyAfter.amount.amount || 0);
      expect(diff).toBeGreaterThanOrEqual(10e8 * 0.75);
    });
  });

  describe('Neutron fees are not being sent to Treasury', () => {
    let balanceBefore: number;
    const fee = {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: NEUTRON_DENOM, amount: '5000' }],
    };

    test('Read Treasury balance', async () => {
      balanceBefore = await cmNeutron.queryDenomBalance(
        TREASURY_CONTRACT_ADDRESS,
        NEUTRON_DENOM,
      );
    });

    test('Perform any tx and pay with neutron fee', async () => {
      await cmNeutron.msgSend(
        testState.wallets.neutron.rly1.address.toString(),
        '1000',
        fee,
      );
    });

    test("Balance of Treasury in Neutrons hasn't been increased", async () => {
      const balanceAfter = await cmNeutron.queryDenomBalance(
        TREASURY_CONTRACT_ADDRESS,
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
      gas_limit: Long.fromString('200000'),
      amount: [
        {
          denom: ibcUatomDenom,
          amount: '5000',
        },
      ],
    };

    test('obtain uatom tokens', async () => {
      await cmGaia.msgIBCTransfer(
        'transfer',
        'channel-0',
        {
          denom: COSMOS_DENOM,
          amount: '100000',
        },
        testState.wallets.qaNeutron.genQaWal1.address.toString(),
        { revision_number: new Long(2), revision_height: new Long(100000000) },
      );
      await getWithAttempts(
        cmNeutron.blockWaiter,
        async () =>
          cmNeutron.queryBalances(
            testState.wallets.qaNeutron.genQaWal1.address.toString(),
          ),
        async (balances) =>
          balances.balances.find(
            (balance) => balance.denom === ibcUatomDenom,
          ) !== undefined,
      );
    });

    test('Read Treasury balance', async () => {
      balanceBefore = await cmNeutron.queryDenomBalance(
        TREASURY_CONTRACT_ADDRESS,
        ibcUatomDenom,
      );
    });

    test('Perform any tx and pay with uatom fee', async () => {
      await cmNeutron.msgSend(
        testState.wallets.neutron.rly1.address.toString(),
        '1000',
        fee,
      );
    });

    test('Balance of Treasury in uatoms has been increased', async () => {
      const balanceAfter = await cmNeutron.queryDenomBalance(
        TREASURY_CONTRACT_ADDRESS,
        ibcUatomDenom,
      );
      const diff = balanceAfter - balanceBefore;
      expect(diff).toBeGreaterThanOrEqual(+fee.amount[0].amount * 0.75);
    });
  });
});
