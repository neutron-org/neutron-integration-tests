import Long from 'long';
import {
  cosmosWrapper,
  COSMOS_DENOM,
  dao,
  NEUTRON_DENOM,
  TestStateLocalCosmosTestNet,
  wait,
} from '@neutron-org/neutronjsplus';

const config = require('../../config.json');
describe('Neutron / Tokenomics', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: cosmosWrapper.CosmosWrapper;
  let gaiaChain: cosmosWrapper.CosmosWrapper;
  let neutronAccount: cosmosWrapper.WalletWrapper;
  let gaiaAccount: cosmosWrapper.WalletWrapper;
  let treasuryContractAddress: string;

  beforeAll(async () => {
    cosmosWrapper.registerCodecs();

    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    gaiaChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      COSMOS_DENOM,
    );
    gaiaAccount = new cosmosWrapper.WalletWrapper(
      gaiaChain,
      testState.wallets.qaCosmos.genQaWal1,
    );

    treasuryContractAddress = await dao.getTreasuryContract(neutronChain);
  });

  describe('75% of Neutron fees are burned', () => {
    const bigFee = {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let burnedBefore: cosmosWrapper.TotalBurnedNeutronsAmountResponse;

    test('Read total burned neutrons amount', async () => {
      burnedBefore = await neutronChain.queryTotalBurnedNeutronsAmount();
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address.toString(),
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
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let totalSupplyBefore: cosmosWrapper.TotalSupplyByDenomResponse;

    test('Read total supply', async () => {
      totalSupplyBefore = await neutronChain.queryTotalSupplyByDenom(
        NEUTRON_DENOM,
      );
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address.toString(),
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
      gas_limit: Long.fromString('200000'),
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
        testState.wallets.neutron.rly1.address.toString(),
        '1000',
        fee,
      );
    });

    test("Balance of Treasury in NTRNs hasn't increased", async () => {
      await neutronChain.blockWaiter.waitBlocks(1);
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
      gas_limit: Long.fromString('200000'),
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
        testState.wallets.qaNeutron.genQaWal1.address.toString(),
        { revision_number: new Long(2), revision_height: new Long(100000000) },
      );
      await wait.getWithAttempts(
        neutronChain.blockWaiter,
        async () =>
          neutronChain.queryBalances(
            testState.wallets.qaNeutron.genQaWal1.address.toString(),
          ),
        async (balances) =>
          balances.balances.find(
            (balance) => balance.denom === ibcUatomDenom,
          ) !== undefined,
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
        testState.wallets.neutron.rly1.address.toString(),
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
