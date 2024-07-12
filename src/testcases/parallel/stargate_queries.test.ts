import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  getEventAttribute,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { COSMOS_DENOM, NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { LocalState, createWalletWrapper } from '../../helpers/local_state';
import { NeutronContract, CodeId } from '@neutron-org/neutronjsplus/dist/types';
import { msgCreateDenom } from '@neutron-org/neutronjsplus/dist/tokenfactory';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import { Suite, inject } from 'vitest';

const config = require('../../config.json');

describe('Neutron / Stargate Queries', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let contractAddress: string;

  let gaiaChain: CosmosWrapper;
  let gaiaAccount: WalletWrapper;

  let newTokenDenom: string;

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = await LocalState.create(config, mnemonics, suite);
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.restNeutron,
      testState.rpcNeutron,
    );
    neutronAccount = await createWalletWrapper(
      neutronChain,
      await testState.nextWallet('neutron'),
    );

    gaiaChain = new CosmosWrapper(
      COSMOS_DENOM,
      testState.restGaia,
      testState.rpcGaia,
    );
    gaiaAccount = await createWalletWrapper(
      gaiaChain,
      await testState.nextWallet('cosmos'),
    );
  });

  describe('Prepare for queries', () => {
    test('uatom IBC transfer from a remote chain to Neutron', async () => {
      const res = await gaiaAccount.msgIBCTransfer(
        'transfer',
        'channel-0',
        { denom: COSMOS_DENOM, amount: '1000' },
        neutronAccount.wallet.address,
        {
          revisionNumber: BigInt(2),
          revisionHeight: BigInt(100000000),
        },
      );
      expect(res.code).toEqual(0);
    });

    test('create denom, mint', async () => {
      const denom = `teststargate`;

      const data = await msgCreateDenom(
        neutronAccount,
        neutronAccount.wallet.address,
        denom,
        {
          gas: '500000',
          amount: [{ denom: 'untrn', amount: '1250' }],
        },
      );
      newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );
    });
  });

  describe('Contract instantiation', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(NeutronContract.STARGATE_QUERIER);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      contractAddress = await neutronAccount.instantiateContract(
        codeId,
        {},
        'stargate_querier',
      );
    });
  });

  async function querySmart(query: any): Promise<string> {
    return await neutronChain.queryContract<string>(contractAddress, query);
  }

  describe('Stargate queries', () => {
    test('bank balance should work', async () => {
      const res = JSON.parse(
        await querySmart({
          bank_balance: {
            address: neutronAccount.wallet.address,
            denom: NEUTRON_DENOM,
          },
        }),
      );
      expect(res.balance.denom).toBe('untrn');
      expect(+res.balance.amount).toBeGreaterThan(1000000);
    });

    test('bank denom metadata should work', async () => {
      const res = JSON.parse(
        await querySmart({
          bank_denom_metadata: { denom: newTokenDenom },
        }),
      );
      expect(res.metadatas[0].denom_units[0].denom).toBe(newTokenDenom);
    });

    test('bank params should work', async () => {
      const res = JSON.parse(await querySmart({ bank_params: {} }));
      expect(res.params.default_send_enabled).toBe(true);
    });

    test('bank supply of should work', async () => {
      const res = JSON.parse(
        await querySmart({
          bank_supply_of: { denom: NEUTRON_DENOM },
        }),
      );
      expect(res.amount.denom).toBe('untrn');
      expect(+res.amount.amount).toBeGreaterThan(1000000);
    });

    test('auth account should work', async () => {
      const res = JSON.parse(
        await querySmart({
          auth_account: {
            address: neutronAccount.wallet.address,
          },
        }),
      );
      expect(res.account.address).toBe(neutronAccount.wallet.address);
    });

    test('transfer denom trace should work', async () => {
      const res = JSON.parse(
        await querySmart({
          transfer_denom_trace: {
            hash: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
          },
        }),
      );
      expect(res.denom_trace.path).toBe('transfer/channel-0');
      expect(res.denom_trace.base_denom).toBe('uatom');
    });

    test('ibc client state should work', async () => {
      const res = JSON.parse(
        await querySmart({
          ibc_client_state: {
            client_id: '07-tendermint-1',
          },
        }),
      );
      expect(res.client_state['@type']).toBe(
        '/ibc.lightclients.tendermint.v1.ClientState',
      );
      expect(res.client_state.chain_id).toBe('test-2');
    });

    test('ibc consensus state should work', async () => {
      const res = JSON.parse(
        await querySmart({
          ibc_consensus_state: {
            client_id: '07-tendermint-1',
            revision_number: 0,
            revision_height: 0,
            latest_height: true,
          },
        }),
      );
      expect(res.consensus_state['@type']).toBe(
        '/ibc.lightclients.tendermint.v1.ConsensusState',
      );
      expect(+res.proof_height.revision_height).toBeGreaterThan(0);
    });

    test('ibc connection should work', async () => {
      const res = JSON.parse(
        await querySmart({
          ibc_connection: {
            connection_id: 'connection-0',
          },
        }),
      );
      expect(res.connection.client_id).toBe('07-tendermint-1');
      expect(+res.proof_height.revision_height).toBeGreaterThan(0);
    });

    test('tokenfactory params should work', async () => {
      const res = JSON.parse(await querySmart({ tokenfactory_params: {} }));
      expect(res.params.denom_creation_gas_consume).toBe('0');
    });

    test('tokenfactory denom authority metadata should work', async () => {
      const res = await querySmart({
        tokenfactory_denom_authority_metadata: {
          denom: newTokenDenom,
        },
      });
      expect(res).toBe(`{"authority_metadata":{"Admin":""}}`);
    });

    test('denoms from creator should work', async () => {
      const res = await querySmart({
        tokenfactory_denoms_from_creator: {
          creator: neutronAccount.wallet.address,
        },
      });
      expect(res).toBe(`{"denoms":["${newTokenDenom}"]}`);
    });

    test('interchaintx params should work', async () => {
      const res = JSON.parse(await querySmart({ interchaintx_params: {} }));
      expect(+res.params.msg_submit_tx_max_messages).toBeGreaterThan(0);
    });

    test('interchainqueries params should work', async () => {
      const res = JSON.parse(
        await querySmart({ interchainqueries_params: {} }),
      );
      expect(+res.params.query_submit_timeout).toBeGreaterThan(0);
    });

    test('feeburner params should work', async () => {
      const res = JSON.parse(await querySmart({ feeburner_params: {} }));
      expect(res.params.neutron_denom).toBe('untrn');
    });
  });
});
