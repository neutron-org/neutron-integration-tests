import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { inject } from 'vitest';
import { TestStateLocalCosmosTestNet } from './../../helpers/cosmosTestnet';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import {
  WalletWrapper,
  createWalletWrapper,
} from '@neutron-org/neutronjsplus/dist/wallet_wrapper';

const config = require('../../config.json');

describe('Neutron / Slinky', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember1: DaoMember;
  let dao: Dao;

  let proposalId: number;

  beforeAll(async () => {
    const mnemonics = inject('initMnemonics');
    testState = new TestStateLocalCosmosTestNet(config, mnemonics);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronAccount = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.qa,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    dao = new Dao(neutronChain, daoContracts);
    daoMember1 = new DaoMember(neutronAccount, dao);
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('10000');
      await neutronChain.getWithAttempts(
        async () => await dao.queryVotingPower(daoMember1.user.wallet.address),
        async (response) => response.power == 10000,
        20,
      );
    });
  });

  describe('submit proposal', () => {
    test('create proposal', async () => {
      proposalId = await daoMember1.submitUpdateMarketMap(
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
      );
    });

    describe('vote for proposal', () => {
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      test('check if proposal is passed', async () => {
        await neutronChain.waitBlocks(5);
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
      await neutronChain.waitBlocks(5);
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
