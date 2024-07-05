import { Registry } from '@cosmjs/proto-signing';
import '@neutron-org/neutronjsplus';
import { inject } from 'vitest';
import { LocalState } from '../../helpers/localState';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { NeutronContract, Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { wasm, WasmWrapper } from '../../helpers/wasmClient';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { neutronTypes } from '@neutron-org/neutronjsplus/dist/neutronTypes';
import {
  getWithAttempts,
  waitBlocks,
} from '@neutron-org/neutronjsplus/dist/wait';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { QueryClientImpl as OracleQueryClient } from '@neutron-org/neutronjs/slinky/oracle/v1/query.rpc.Query';

const config = require('../../config.json');

describe('Neutron / Slinky', () => {
  let testState: LocalState;
  let daoMember1: DaoMember;
  let mainDao: Dao;
  let neutronAccount: Wallet;
  let neutronClient: WasmWrapper;
  let chainManagerAddress: string;
  let adminQuery: AdminQueryClient;
  let oracleQuery: OracleQueryClient;

  let proposalId: number;

  beforeAll(async () => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics);
    await testState.init();
    neutronAccount = testState.wallets.qaNeutron.qa;
    neutronClient = await wasm(
      testState.rpcNeutron,
      neutronAccount,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );
    const neutronRpcClient = await testState.rpcClient('neutron');
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient.client,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(
      neutronClient.client,
      daoCoreAddress,
    );
    mainDao = new Dao(neutronClient.client, daoContracts);
    daoMember1 = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronAccount.address,
      NEUTRON_DENOM,
    );
    adminQuery = new AdminQueryClient(await testState.rpcClient('neutron'));
    chainManagerAddress = (await adminQuery.admins()).admins[0];
    oracleQuery = new OracleQueryClient(neutronRpcClient);
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('10000');
      await getWithAttempts(
        neutronClient.client,
        async () => await mainDao.queryVotingPower(daoMember1.user),
        async (response) => response.power == 10000,
        20,
      );
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
        await waitBlocks(5, neutronClient.client);
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
      await waitBlocks(30, neutronClient.client);
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
    let contractAddress: string;

    test('setup contract', async () => {
      const codeId = await neutronClient.upload(NeutronContract.ORACLE);
      expect(codeId).toBeGreaterThan(0);

      contractAddress = await neutronClient.instantiate(codeId, {}, 'oracle');
    });

    test('query prices', async () => {
      const res = await neutronClient.client.queryContractSmart(
        contractAddress,
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
      const res = await neutronClient.client.queryContractSmart(
        contractAddress,
        {
          get_price: { currency_pair: { Base: 'TIA', Quote: 'USD' } },
        },
      );
      expect(+res.price.price).toBeGreaterThan(0);
    });

    test('query currencies', async () => {
      const res = await neutronClient.client.queryContractSmart(
        contractAddress,
        {
          get_all_currency_pairs: {},
        },
      );
      expect(res.currency_pairs[0].Base).toBe('TIA');
      expect(res.currency_pairs[0].Quote).toBe('USD');
    });
  });
  describe('wasmbindings marketmap', () => {
    let contractAddress: string;

    test('setup contract', async () => {
      const codeId = await neutronClient.upload(NeutronContract.MARKETMAP);
      expect(codeId).toBeGreaterThan(0);

      contractAddress = await neutronClient.instantiate(
        codeId,
        {},
        'marketmap',
      );
    });

    test('query last', async () => {
      const res = await neutronClient.client.queryContractSmart(
        contractAddress,
        {
          last_updated: {},
        },
      );
      expect(res.last_updated).toBeGreaterThan(0);
    });

    test('query market', async () => {
      const res = await neutronClient.client.queryContractSmart(
        contractAddress,
        {
          market: { currency_pair: { Base: 'TIA', Quote: 'USD' } },
        },
      );
      expect(res.market).toBeDefined();
    });

    test('query market map', async () => {
      const res = await neutronClient.client.queryContractSmart(
        contractAddress,
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
      const res = await neutronClient.client.queryContractSmart(
        contractAddress,
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
