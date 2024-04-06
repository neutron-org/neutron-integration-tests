import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  NEUTRON_DENOM,
  ADMIN_MODULE_ADDRESS,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { getWithAttempts } from '@neutron-org/neutronjsplus/dist/wait';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import axios from 'axios';

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
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
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
      proposalId = await daoMember1.submitSingleChoiceProposal(
        'Proposal for update marketmap',
        'Add new marketmap with currency pair',
        [updateMarketMapProposal()],
        '1000',
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
      const res = await queryAllCurrencyPairs(neutronChain.sdk);
      expect(res.currency_pairs[0].Base).toBe('ETH');
      expect(res.currency_pairs[0].Quote).toBe('USDT');
    });

    test('prices not empty', async () => {
      const res = await queryPrices(neutronChain.sdk, ['ETH/USDT']);
      expect(+res.prices[0].price.price).toBeGreaterThan(0);
    });

    test('eth price present', async () => {
      const res = await queryPrice(neutronChain.sdk, 'ETH', 'USDT');
      expect(+res.price.price).toBeGreaterThan(0);
    });
  });
});

const updateMarketMapMessage = JSON.stringify({
  '@type': '/slinky.marketmap.v1.MsgUpdateMarketMap',
  signer: ADMIN_MODULE_ADDRESS,
  create_markets: [
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
      providers: {
        providers: [
          {
            name: 'kucoin_ws',
            off_chain_ticker: 'eth-usdt',
          },
        ],
      },
      paths: {
        paths: [
          {
            operations: [
              {
                provider: 'kucoin_ws',
                currency_pair: {
                  Base: 'ETH',
                  Quote: 'USDT',
                },
                invert: false,
              },
            ],
          },
        ],
      },
    },
  ],
});

const updateMarketMapProposal = (): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        proposal_execute_message: {
          message: updateMarketMapMessage,
        },
      },
    },
  },
});

type GetPriceResponse = {
  price: {
    price: string;
    block_timestamp: string;
    block_height: string;
  };
  nonce: string;
  decimals: string;
  id: string;
};

type GetPricesResponse = {
  prices: GetPriceResponse[];
};

type CurrencyPair = {
  Quote: string;
  Base: string;
};

type GetAllCurrencyPairsResponse = {
  currency_pairs: CurrencyPair[];
};

const queryPrice = async (sdk: any, base: string, quote: string): Promise<GetPriceResponse> => {
  try {
    const req = await axios.get<any>(`${sdk.url}/slinky/oracle/v1/get_price`, {
      params: {
        'currency_pair.Base': base,
        'currency_pair.Quote': quote,
      },
    });
    return req.data;
  } catch (e) {
    if (e.response?.data?.message !== undefined) {
      throw new Error(e.response?.data?.message);
    }
    throw e;
  }
};

const queryPrices = async (sdk: any, currencyPairIds: string[]): Promise<GetPricesResponse> => {
  const req = await axios.get(`${sdk.url}/slinky/oracle/v1/get_prices`, {
    params: { currency_pair_ids: currencyPairIds.join(',') },
  });

  return req.data;
};

const queryAllCurrencyPairs = async (sdk: any): Promise<GetAllCurrencyPairsResponse> => {
  const req = await axios.get(`${sdk.url}/slinky/oracle/v1/get_all_tickers`);

  return req.data;
};
