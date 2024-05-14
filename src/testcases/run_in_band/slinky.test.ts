import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { getWithAttempts } from '@neutron-org/neutronjsplus/dist/wait';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';

const config = require('../../config.json');

describe('Neutron / Slinky', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember1: DaoMember;
  let dao: Dao;

  let proposalId: number;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    const daoCoreAddress = await neutronChain.getNeutronDAOCore();
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    dao = new Dao(neutronChain, daoContracts);
    daoMember1 = new DaoMember(neutronAccount, dao);
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('10000');
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () =>
          await dao.queryVotingPower(daoMember1.user.wallet.address.toString()),
        async (response) => response.power == 10000,
        20,
      );
    });
  });

  describe('submit proposal', () => {
    test('create proposal', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      proposalId = await daoMember1.submitCreateMarketMap(
        chainManagerAddress,
        'Proposal for update marketmap',
        'Add new marketmap with currency pair',
        [
          {
            ticker: {
              currency_pair: {
                Base: 'ETH',
                Quote: 'USDT',
              },
              decimals: 8,
              min_provider_count: 1,
              enabled: true,
              metadata_JSON: '{}',
            },
            provider_configs: [
              {
                name: 'kucoin_ws',
                off_chain_ticker: 'eth-usdt',
                normalize_by_pair: {
                  Base: 'ETH',
                  Quote: 'USDT',
                },
                invert: false,
                metadata_JSON: '{}',
              },
            ],
          },
        ],
      );
    });

    describe('vote for proposal', () => {
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      test('check if proposal is passed', async () => {
        await neutronChain.blockWaiter.waitBlocks(5);
        await dao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
    });
  });

  describe('module fetches prices', () => {
    test('currency pairs not empty', async () => {
      // wait to make sure we updated the price in oracle module
      await neutronChain.blockWaiter.waitBlocks(5);
      // check
      const res = await neutronChain.queryOracleAllCurrencyPairs();
      expect(res.currency_pairs[0].Base).toBe('ETH');
      expect(res.currency_pairs[0].Quote).toBe('USDT');
    });

    test('prices not empty', async () => {
      const res = await neutronChain.queryOraclePrices(['ETH/USDT']);
      expect(+res.prices[0].price.price).toBeGreaterThan(0);
    });

    test('eth price present', async () => {
      const res = await neutronChain.queryOraclePrice('ETH', 'USDT');
      expect(+res.price.price).toBeGreaterThan(0);
    });
  });
});
