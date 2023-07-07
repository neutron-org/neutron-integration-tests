import Long from 'long';
import {
  CosmosWrapper,
  COSMOS_DENOM,
  NEUTRON_DENOM,
  WalletWrapper,
  getEventAttribute,
} from '../../helpers/cosmos';
import { Wallet } from '../../types';
import { NeutronContract } from '../../helpers/types';
import { msgCreateDenom } from '../../helpers/tokenfactory';

import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { CodeId } from '../../types';

describe('Neutron / Simple', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let contractAddress: string;

  let ownerWallet: Wallet;

  let gaiaChain: CosmosWrapper;
  let gaiaAccount: WalletWrapper;

  let newTokenDenom: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
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

    ownerWallet = testState.wallets.qaNeutron.genQaWal1;

    gaiaChain = new CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      COSMOS_DENOM,
    );
    gaiaAccount = new WalletWrapper(
      gaiaChain,
      testState.wallets.qaCosmos.genQaWal1,
    );
  });

  describe('Prepare for queries', () => {
    test('uatom IBC transfer from a remote chain to Neutron', async () => {
      const res = await gaiaAccount.msgIBCTransfer(
        'transfer',
        'channel-0',
        { denom: COSMOS_DENOM, amount: '1000' },
        neutronAccount.wallet.address.toString(),
        {
          revision_number: new Long(2),
          revision_height: new Long(100000000),
        },
      );
      expect(res.code).toEqual(0);
    });

    test('create denom, mint', async () => {
      const denom = `teststargate`;

      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address.toString(),
        denom,
      );
      newTokenDenom = getEventAttribute(
        (data as any).events,
        'create_denom',
        'new_token_denom',
      );
      console.log('New token denom: ' + newTokenDenom);
    });
  });

  describe('Contract instantiation', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(NeutronContract.STARGATE_QUERIER);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await neutronAccount.instantiateContract(codeId, '{}', 'stargate_querier');
      contractAddress = res[0]._contract_address;
    });
  });

  async function querySmart(query: any): Promise<string> {
    return await neutronChain.queryContract<string>(contractAddress, query);
  }

  describe('Stargate queries', () => {
    test('stargate query bank balance should work', async () => {
      const first = await querySmart({ bank_balance: { address: neutronAccount.wallet.address.toString(), denom: NEUTRON_DENOM } });
      const res = JSON.parse(first);
      expect(res.balance.denom).toBe('untrn');
      // expect(first).toBe("{\"balance\":{\"denom\":\"untrn\",\"amount\":\"11497750000\"}}");
    });

    // TODO: create denom
    test('stargate query bank denom metadata should work', async () => {
      const first = await querySmart({ bank_denom_metadata: { denom: newTokenDenom } });
      expect(first).toBe(`{"metadatas":[{"description":"","denom_units":[{"denom":"${newTokenDenom}","exponent":0,"aliases":[]}],"base":"${newTokenDenom}","display":"","name":"","symbol":""}],"pagination":null}`);
    });

    test('stargate query bank params should work', async () => {
      const first = await querySmart({ bank_params: {} });
      expect(first).toBe(`{"params":{"send_enabled":[],"default_send_enabled":true}}`);
    });

    test('stargate query bank supply of should work', async () => {
      const first = await querySmart({ bank_supply_of: { denom: NEUTRON_DENOM } });
      const res = JSON.parse(first);
      expect(res.amount.denom).toBe('untrn');
      // expect(first).toBe("{\"amount\":{\"denom\":\"untrn\",\"amount\":\"699999998306642\"}}");
    });

    test('stargate query auth account should work', async () => {
      const first = await querySmart({ auth_account: { address: neutronAccount.wallet.address.toString() } });
      // expect(first).toMatch(/{"account":{"@type":"cosmos.auth.v1beta1.BaseAccount/)
      const res = JSON.parse(first);
      expect(res.account.address).toBe(neutronAccount.wallet.address.toString());
      // expect(first).toBe("{\"account\":{\"@type\":\"/cosmos.auth.v1beta1.BaseAccount\",\"address\":\"neutron1pkmgmxg3yymj4zrq47uxw69xes56d6xlc748zv\",\"pub_key\":{\"@type\":\"/cosmos.crypto.secp256k1.PubKey\",\"key\":\"AmGN2qGzlEi+8oDwg4ruXKI+j4qKw8CG92kagyREKaE8\"},\"account_number\":\"32\",\"sequence\":\"2\"}}");
    });

    // TODO: transfer coins to neutron, get ibc/hash denom to query trace
    test('stargate query transfer denom trace should work', async () => {
      const first = await querySmart({ transfer_denom_trace: { hash: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2' } });
      expect(first).toBe(`{"denom_trace":{"path":"transfer/channel-0","base_denom":"uatom"}}`);
    });

    test('stargate query ibc client state should work', async () => {
      const first = await querySmart({ ibc_client_state: { client_id: '07-tendermint-1' } });
      const res = JSON.parse(first);
      expect(res.client_state['@type']).toBe('/ibc.lightclients.tendermint.v1.ClientState');
      // expect(first).toBe('"{\"client_state\":{\"@type\":\"/ibc.lightclients.tendermint.v1.ClientState\",\"chain_id\":\"test-2\",\"trust_level\":{\"numerator\":\"1\",\"denominator\":\"3\"},\"trusting_period\":\"1209600s\",\"unbonding_period\":\"1814400s\",\"max_clock_drift\":\"20s\",\"frozen_height\":{\"revision_number\":\"0\",\"revision_height\":\"0\"},\"latest_height\":{\"revision_number\":\"2\",\"revision_height\":\"111\"},\"proof_specs\":[{\"leaf_spec\":{\"hash\":\"SHA256\",\"prehash_key\":\"NO_HASH\",\"prehash_value\":\"SHA256\",\"length\":\"VAR_PROTO\",\"prefix\":\"AA==\"},\"inner_spec\":{\"child_order\":[0,1],\"child_size\":33,\"min_prefix_length\":4,\"max_prefix_length\":12,\"empty_child\":null,\"hash\":\"SHA256\"},\"max_depth\":0,\"min_depth\":0},{\"leaf_spec\":{\"hash\":\"SHA256\",\"prehash_key\":\"NO_HASH\",\"prehash_value\":\"SHA256\",\"length\":\"VAR_PROTO\",\"prefix\":\"AA==\"},\"inner_spec\":{\"child_order\":[0,1],\"child_size\":32,\"min_prefix_length\":1,\"max_prefix_length\":1,\"empty_child\":null,\"hash\":\"SHA256\"},\"max_depth\":0,\"min_depth\":0}],\"upgrade_path\":[\"upgrade\",\"upgradedIBCState\"],\"allow_update_after_expiry\":true,\"allow_update_after_misbehaviour\":true},\"proof\":null,\"proof_height\":{\"revision_number\":\"1\",\"revision_height\":\"116\"}}"');
    });

    test('stargate query ibc consensus state should work', async () => {
      const first = await querySmart({ ibc_consensus_state: { client_id: '07-tendermint-1', revision_number: 0, revision_height: 0, latest_height: true } });
      const res = JSON.parse(first);
      expect(res.consensus_state['@type']).toBe('/ibc.lightclients.tendermint.v1.ConsensusState');
      // expect(first).toBe('"{\"consensus_state\":{\"@type\":\"/ibc.lightclients.tendermint.v1.ConsensusState\",\"timestamp\":\"2023-07-11T08:19:53.955495715Z\",\"root\":{\"hash\":\"BN1gYi/hnSvjnSdDuUhqpk2M6RvQUl4+U4T0eczUHYY=\"},\"next_validators_hash\":\"802675C2BDF3CEA2D4B19D3DAB962F26F0D077E98C8DE8FC021621CB0887B2C7\"},\"proof\":null,\"proof_height\":{\"revision_number\":\"1\",\"revision_height\":\"116\"}}"');
    });

    test('stargate query ibc connection should work', async () => {
      const first = await querySmart({ ibc_connection: { connection_id: 'connection-0' } });
      const res = JSON.parse(first);
      expect(res.connection.client_id).toBe('07-tendermint-1');
      // expect(first).toBe("{\"connection\":{\"client_id\":\"07-tendermint-1\",\"versions\":[{\"identifier\":\"1\",\"features\":[\"ORDER_ORDERED\",\"ORDER_UNORDERED\"]}],\"state\":\"STATE_OPEN\",\"counterparty\":{\"client_id\":\"07-tendermint-0\",\"connection_id\":\"connection-0\",\"prefix\":{\"key_prefix\":\"aWJj\"}},\"delay_period\":\"0\"},\"proof\":null,\"proof_height\":{\"revision_number\":\"1\",\"revision_height\":\"106\"}}");
    });

    test('stargate query tokenfactory params should work', async () => {
      const first = await querySmart({ tokenfactory_params: {} });
      const res = JSON.parse(first);
      expect(res.params.denom_creation_fee[0].denom).toBe('untrn');
      // expect(first).toBe("{\"params\":{\"denom_creation_fee\":[{\"denom\":\"untrn\",\"amount\":\"1000000\"}],\"fee_collector_address\":\"neutron1suhgf5svhu4usrurvxzlgn54ksxmn8gljarjtxqnapv8kjnp4nrstdxvff\"}}");
    });

    test('stargate query tokenfactory denom authority metadata should work', async () => {
      const first = await querySmart({ tokenfactory_denom_authority_metadata: { denom: newTokenDenom } });
      expect(first).toBe(`{"authority_metadata":{"Admin":""}}`);
    });

    test('stargate query denoms from creator should work', async () => {
      const first = await querySmart({ tokenfactory_denoms_from_creator: { creator: ownerWallet.address.toString() } });
      expect(first).toBe(`{"denoms":["${newTokenDenom}"]}`);
    });

    test('stargate query contractmanager address failures should work', async () => {
      const first = await querySmart({ contractmanager_address_failures: { address: neutronAccount.wallet.address.toString() } });
      expect(first).toBe(`{"failures":[],"pagination":{"next_key":null,"total":"0"}}`);
    });

    test('stargate query contractmanager failures should work', async () => {
      const first = await querySmart({ contractmanager_failures: { address: neutronAccount.wallet.address.toString() } });
      expect(first).toBe(`{"failures":[],"pagination":{"next_key":null,"total":"0"}}`);
    });

    test('stargate query interchaintx params should work', async () => {
      const first = await querySmart({ interchaintx_params: {} });
      expect(first).toBe(`{"params":{"msg_submit_tx_max_messages":"16"}}`);
    });

    test('stargate query interchainqueries params should work', async () => {
      const first = await querySmart({ interchainqueries_params: {} });
      expect(first).toBe(`{"params":{"query_submit_timeout":"1036800","query_deposit":[{"denom":"untrn","amount":"1000000"}],"tx_query_removal_limit":"10000"}}`);
    });

    test('stargate query feeburner params should work', async () => {
      const first = await querySmart({ feeburner_params: {} });
      expect(first).toBe(`{"params":{"neutron_denom":"untrn","reserve_address":"","treasury_address":"neutron1suhgf5svhu4usrurvxzlgn54ksxmn8gljarjtxqnapv8kjnp4nrstdxvff"}}`);
    });
  });
});
