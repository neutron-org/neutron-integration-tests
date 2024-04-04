import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  NEUTRON_DENOM,
  ADMIN_MODULE_ADDRESS,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { getWithAttempts } from '@neutron-org/neutronjsplus/dist/wait';
import { Dao, DaoMember, getDaoContracts } from '@neutron-org/neutronjsplus/dist/dao';

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
    // test('check voting power', async () => {
    //   await getWithAttempts(
    //     neutronChain.blockWaiter,
    //     async () => await dao.queryTotalVotingPower(),
    //     async (response) => response.power == 21000,
    //     20,
    //   );
    // });
  });

  describe('submit proposal', () => {
    test('create proposal', async () => {
      proposalId = await daoMember1.submitSingleChoiceProposal(
        'Proposal for update marketmap',
        'UpdateMarketmap proposal. This one will pass',
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

  describe('Module fetches prices', () => {
    // TODO
  });
});

// const queryPrices = async(): Promise<any> => {
//   const req = await axios.get(
//     `${this.sdk.url}/slinky/oracle/v1/get_prices`,
//   );

//   return req.data.prices;
// }

// const queryAllTickers = async(): Promise<any> => {
//   const req = await axios.get(
//     `${this.sdk.url}/slinky/oracle/v1/get_all_tickers`,
//   );

//   return req.data.currency_pairs;
// }

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
