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
import { NeutronContract } from '@neutron-org/neutronjsplus/dist/types';
import {
  GetPriceResponse,
  GetAllCurrencyPairsResponse,
  GetPricesResponse,
} from '@neutron-org/neutronjsplus/src/oracle';
import {
  ParamsResponse,
  LastUpdatedResponse,
  MarketMapResponse,
  MarketResponse,
} from '@neutron-org/neutronjsplus/src/marketmap';

const config = require('../../config.json');

describe('Neutron / Slinky', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember1: DaoMember;
  let dao: Dao;

  let proposalId: number;

  let oracleContract: string;
  let marketmapContract: string;

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

  describe('prepare: deploy contract', () => {
    test('setup oracle contract', async () => {
      const codeId = await neutronAccount.storeWasm(NeutronContract.ORACLE);
      expect(codeId).toBeGreaterThan(0);

      const res = await neutronAccount.instantiateContract(
        codeId,
        '{}',
        'oracle',
      );
      oracleContract = res[0]._contract_address;
    });

    test('setup marketmap contract', async () => {
      const codeId = await neutronAccount.storeWasm(NeutronContract.MARKETMAP);
      expect(codeId).toBeGreaterThan(0);

      const res = await neutronAccount.instantiateContract(
        codeId,
        '{}',
        'marketmap',
      );
      marketmapContract = res[0]._contract_address;
    });
  });

  describe('before create market map', () => {
    test('query last should return null', async () => {
      const res = await neutronChain.queryContract<LastUpdatedResponse>(
        marketmapContract,
        {
          last_updated: {},
        },
      );
      expect(res.last_updated).toBe(null);
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
                Base: 'TIA',
                Quote: 'USD',
              },
              decimals: 8,
              min_provider_count: 1,
              enabled: true,
              metadata_JSON: '{}',
            },
            provider_configs: [
              {
                name: 'kraken_api',
                off_chain_ticker: 'TIAUSD',
                invert: false,
                metadata_JSON: '{}',
              },
            ],
          },
          {
            ticker: {
              currency_pair: {
                Base: 'USDT',
                Quote: 'USD',
              },
              decimals: 6,
              min_provider_count: 1,
              enabled: false,
              metadata_JSON: '',
            },
            provider_configs: [
              {
                name: 'kraken_api',
                off_chain_ticker: 'USDTUSD',
                invert: false,
                metadata_JSON: '',
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
      await neutronChain.blockWaiter.waitBlocks(30);
      // check
      const res = await neutronChain.queryOracleAllCurrencyPairs();
      expect(res.currency_pairs[0].Base).toBe('TIA');
      expect(res.currency_pairs[0].Quote).toBe('USD');
    });

    test('prices not empty', async () => {
      const res = await neutronChain.queryOraclePrices(['TIA/USD']);
      expect(+res.prices[0].price.price).toBeGreaterThan(0);
    });

    test('tia/usd price present', async () => {
      const res = await neutronChain.queryOraclePrice('TIA', 'USD');
      expect(+res.price.price).toBeGreaterThan(0);
    });
  });

  describe('wasmbindings oracle', () => {
    test('query prices', async () => {
      const res = await neutronChain.queryContract<GetPricesResponse>(
        oracleContract,
        {
          get_prices: {
            currency_pair_ids: ['TIA/USD'],
          },
        },
      );
      expect(res.prices).toHaveLength(1);
      expect(+res.prices[0].price.price).toBeGreaterThan(0);
    });

    test('query price', async () => {
      const res = await neutronChain.queryContract<GetPriceResponse>(
        oracleContract,
        {
          get_price: { currency_pair: { Base: 'TIA', Quote: 'USD' } },
        },
      );
      expect(+res.price.price).toBeGreaterThan(0);
    });

    test('query currencies', async () => {
      const res = await neutronChain.queryContract<GetAllCurrencyPairsResponse>(
        oracleContract,
        {
          get_all_currency_pairs: {},
        },
      );
      expect(res.currency_pairs[0].Base).toBe('TIA');
      expect(res.currency_pairs[0].Quote).toBe('USD');
    });
  });
  describe('wasmbindings marketmap', () => {
    test('query last', async () => {
      const res = await neutronChain.queryContract<LastUpdatedResponse>(
        marketmapContract,
        {
          last_updated: {},
        },
      );
      expect(res.last_updated).toBeGreaterThan(0);
    });

    test('query market', async () => {
      const res = await neutronChain.queryContract<MarketResponse>(
        marketmapContract,
        {
          market: { currency_pair: { Base: 'TIA', Quote: 'USD' } },
        },
      );
      expect(res.market).toBeDefined();
    });

    test('query market with empty metadata_JSON', async () => {
      const res = await neutronChain.queryContract<MarketResponse>(
        marketmapContract,
        {
          market: { currency_pair: { Base: 'USDT', Quote: 'USD' } },
        },
      );
      expect(res.market).toBeDefined();
    });

    test('query market map', async () => {
      const res = await neutronChain.queryContract<MarketMapResponse>(
        marketmapContract,
        {
          market_map: {},
        },
      );
      expect(res).toBeDefined();
      expect(res.chain_id).toBeDefined();
      expect(res.market_map).toBeDefined();
      expect(res.last_updated).toBeDefined();
    });

    test('query params', async () => {
      const res = await neutronChain.queryContract<ParamsResponse>(
        marketmapContract,
        {
          params: {},
        },
      );
      expect(res).toBeDefined();
      expect(res.params.admin).toBeDefined();
      expect(res.params.market_authorities[0]).toEqual(
        'neutron1hxskfdxpp5hqgtjj6am6nkjefhfzj359x0ar3z',
      );
    });
  });
});
