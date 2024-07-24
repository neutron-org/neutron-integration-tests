import '@neutron-org/neutronjsplus';
import { inject } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { NeutronContract, Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { NEUTRON_DENOM } from '../../helpers/constants';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { QueryClientImpl as OracleQueryClient } from '@neutron-org/neutronjs/slinky/oracle/v1/query.rpc.Query';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';

import config from '../../config.json';

describe('Neutron / Slinky', () => {
  let testState: LocalState;
  let daoMember1: DaoMember;
  let mainDao: Dao;
  let neutronWallet: Wallet;
  let neutronClient: SigningNeutronClient;
  let chainManagerAddress: string;
  let adminQuery: AdminQueryClient;
  let oracleQuery: OracleQueryClient;

  let proposalId: number;

  let oracleContract: string;
  let marketmapContract: string;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronWallet = testState.wallets.qaNeutron.qa;
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    const neutronRpcClient = await testState.rpcClient('neutron');
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);
    mainDao = new Dao(neutronClient, daoContracts);
    daoMember1 = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );
    adminQuery = new AdminQueryClient(await testState.rpcClient('neutron'));
    chainManagerAddress = (await adminQuery.admins()).admins[0];
    oracleQuery = new OracleQueryClient(neutronRpcClient);
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('10000');
      await neutronClient.getWithAttempts(
        async () => await mainDao.queryVotingPower(daoMember1.user),
        async (response) => response.power == 10000,
        20,
      );
    });
  });

  describe('prepare: deploy contract', () => {
    test('setup oracle contract', async () => {
      const codeId = await neutronClient.upload(NeutronContract.ORACLE);
      expect(codeId).toBeGreaterThan(0);

      oracleContract = await neutronClient.instantiate(codeId, {});
    });

    test('setup marketmap contract', async () => {
      const codeId = await neutronClient.upload(NeutronContract.MARKETMAP);
      expect(codeId).toBeGreaterThan(0);

      marketmapContract = await neutronClient.instantiate(codeId, {});
    });
  });

  describe('before create market map', () => {
    test('query last should return null', async () => {
      const res: LastUpdatedResponse = await neutronClient.queryContractSmart(
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
        await neutronClient.waitBlocks(5);
        await mainDao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
    });
  });

  describe('module fetches prices', () => {
    test('currency pairs not empty', async () => {
      // wait to make sure we updated the price in oracle module
      await neutronClient.waitBlocks(30);
      // check
      const res = await oracleQuery.getAllCurrencyPairs();
      expect(res.currencyPairs[0].base).toBe('TIA');
      expect(res.currencyPairs[0].quote).toBe('USD');
    });

    test('prices not empty', async () => {
      const res = await oracleQuery.getPrices({ currencyPairIds: ['TIA/USD'] });
      expect(+res.prices[0].price.price).toBeGreaterThan(0);
    });

    test('tia/usd price present', async () => {
      const res = await oracleQuery.getPrice({
        currencyPair: { base: 'TIA', quote: 'USD' },
      });
      expect(+res.price.price).toBeGreaterThan(0);
    });
  });

  describe('wasmbindings oracle', () => {
    test('query prices', async () => {
      const res: GetPricesResponse = await neutronClient.queryContractSmart(
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
      const res: GetPriceResponse = await neutronClient.queryContractSmart(
        oracleContract,
        {
          get_price: { currency_pair: { Base: 'TIA', Quote: 'USD' } },
        },
      );
      expect(+res.price.price).toBeGreaterThan(0);
    });

    test('query currencies', async () => {
      const res: GetAllCurrencyPairsResponse =
        await neutronClient.queryContractSmart(oracleContract, {
          get_all_currency_pairs: {},
        });
      expect(res.currency_pairs[0].Base).toBe('TIA');
      expect(res.currency_pairs[0].Quote).toBe('USD');
    });
  });
  describe('wasmbindings marketmap', () => {
    test('query last', async () => {
      const res: LastUpdatedResponse = await neutronClient.queryContractSmart(
        marketmapContract,
        {
          last_updated: {},
        },
      );
      expect(res.last_updated).toBeGreaterThan(0);
    });

    test('query market', async () => {
      const res: MarketResponse = await neutronClient.queryContractSmart(
        marketmapContract,
        {
          market: { currency_pair: { Base: 'TIA', Quote: 'USD' } },
        },
      );
      expect(res.market).toBeDefined();
    });

    test('query market with empty metadata_JSON', async () => {
      const res: MarketResponse = await neutronClient.queryContractSmart(
        marketmapContract,
        {
          market: { currency_pair: { Base: 'USDT', Quote: 'USD' } },
        },
      );
      expect(res.market).toBeDefined();
    });

    test('query market map', async () => {
      const res = await neutronClient.queryContractSmart(marketmapContract, {
        market_map: {},
      });
      expect(res).toBeDefined();
      expect(res.chain_id).toBeDefined();
      expect(res.market_map).toBeDefined();
      expect(res.last_updated).toBeDefined();
    });

    test('query params', async () => {
      const res = await neutronClient.queryContractSmart(marketmapContract, {
        params: {},
      });
      expect(res).toBeDefined();
      expect(res.params.admin).toBeDefined();
      expect(res.params.market_authorities[0]).toEqual(
        'neutron1hxskfdxpp5hqgtjj6am6nkjefhfzj359x0ar3z',
      );
    });
  });
});

export type GetPriceResponse = {
  price: {
    price: string;
    block_timestamp: string;
    block_height: string;
  };
  nonce: string;
  decimals: string;
  id: string;
};

export type GetPricesResponse = {
  prices: GetPriceResponse[];
};

export type CurrencyPair = {
  Quote: string;
  Base: string;
};

export type GetAllCurrencyPairsResponse = {
  currency_pairs: CurrencyPair[];
};

export type ParamsResponse = {
  params: Params;
};

export type CurrencyPair2 = {
  base: string;
  quote: string;
};

export type LastUpdatedResponse = {
  last_updated: number;
};

export type MarketMapResponse = {
  // MarketMap defines the global set of market configurations for all providers
  // and markets.
  market_map: MarketMap;
  // LastUpdated is the last block height that the market map was updated.
  // This field can be used as an optimization for clients checking if there
  // is a new update to the map.
  last_updated: number;
  // ChainId is the chain identifier for the market map.
  chain_id: string;
};

export type MarketResponse = {
  market: Market;
};

export type QuotePrice = {
  price: string;
  // // BlockTimestamp tracks the block height associated with this price update.
  // // We include block timestamp alongside the price to ensure that smart
  // // contracts and applications are not utilizing stale oracle prices
  // block_timestamp: time.Time,
  // BlockHeight is height of block mentioned above
  block_height: number;
};

export type Params = {
  admin: string;
  market_authorities: string[];
};

export type MarketMap = {
  markets: Map<string, Market>;
};

export type Market = {
  // Tickers is the full list of tickers and their associated configurations
  // to be stored on-chain.
  ticker: Ticker;
  // Providers is a map from CurrencyPair to each of to provider-specific
  // configs associated with it.
  provider_configs: Map<string, ProviderConfig>;
};

export type ProviderConfig = {
  // Name corresponds to the name of the provider for which the configuration is
  // being set.
  name: string;
  // OffChainTicker is the off-chain representation of the ticker i.e. BTC/USD.
  // The off-chain ticker is unique to a given provider and is used to fetch the
  // price of the ticker from the provider.
  off_chain_ticker: string;
  // NormalizeByPair is the currency pair for this ticker to be normalized by.
  // For example, if the desired Ticker is BTC/USD, this market could be reached
  // using: OffChainTicker = BTC/USDT NormalizeByPair = USDT/USD This field is
  // optional and nullable.
  normalize_by_pair: CurrencyPair2;
  // Invert is a boolean indicating if the BASE and QUOTE of the market should
  // be inverted. i.e. BASE -> QUOTE, QUOTE -> BASE
  invert: boolean;
  // MetadataJSON is a string of JSON that encodes any extra configuration
  // for the given provider config.
  metadata_json: string;
};

export type Ticker = {
  // CurrencyPair is the currency pair for this ticker.
  currency_pair: CurrencyPair2;
  // Decimals is the number of decimal places for the ticker. The number of
  // decimal places is used to convert the price to a human-readable format.
  decimals: number;
  // MinProviderCount is the minimum number of providers required to consider
  // the ticker valid.
  min_provider_count: number;
  // Enabled is the flag that denotes if the Ticker is enabled for price
  // fetching by an oracle.
  enabled: number;
  // MetadataJSON is a string of JSON that encodes any extra configuration
  // for the given ticker.
  metadata_JSON: string;
};
