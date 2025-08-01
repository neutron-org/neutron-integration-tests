import '@neutron-org/neutronjsplus';
import { getEventAttribute } from '@neutron-org/neutronjsplus/dist/cosmos';
import { LocalState } from '../../helpers/local_state';
import { GaiaWallet, Wallet } from '../../helpers/wallet';
import { CONTRACTS } from '../../helpers/constants';
import { RunnerTestSuite, inject } from 'vitest';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { MsgTransfer } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/tx';
import { QueryClientImpl as IbcQueryClient } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/query.rpc.Query';
import { MsgCreateDenom } from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/tx';
import { COSMOS_DENOM, NEUTRON_DENOM } from '../../helpers/constants';
import config from '../../config.json';

describe('Neutron / Grpc Queries', () => {
  let testState: LocalState;
  let neutronClient: NeutronTestClient;
  let neutronWallet: Wallet;
  let contractAddress: string;

  let gaiaClient: SigningStargateClient;
  let gaiaWallet: GaiaWallet;

  let newTokenDenom: string;

  let ibcQuerier: IbcQueryClient;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);

    gaiaWallet = await testState.nextGaiaWallet();
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.signer,
      { registry: new Registry(defaultRegistryTypes) },
    );

    const neutronRpcClient = await testState.neutronRpcClient();
    ibcQuerier = new IbcQueryClient(neutronRpcClient);
  });

  describe('Prepare for queries', () => {
    test('uatom IBC transfer from a remote chain to Neutron', async () => {
      const fee = {
        gas: '500000',
        amount: [{ denom: COSMOS_DENOM, amount: '1250' }],
      };

      await gaiaClient.signAndBroadcast(
        gaiaWallet.address,
        [
          {
            typeUrl: MsgTransfer.typeUrl,
            value: MsgTransfer.fromPartial({
              sourcePort: 'transfer',
              sourceChannel: 'channel-0',
              token: { denom: COSMOS_DENOM, amount: '1000' },
              sender: gaiaWallet.address,
              receiver: neutronWallet.address,
              timeoutHeight: {
                revisionNumber: 2n,
                revisionHeight: 100000000n,
              },
            }),
          },
        ],
        fee,
      );
    });

    test('create denom, mint', async () => {
      const denom = `testgrpc`;
      const fee = {
        gas: '500000',
        amount: [{ denom: NEUTRON_DENOM, amount: '1250' }],
      };
      const data = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.fromPartial({
              sender: neutronWallet.address,
              subdenom: denom,
            }),
          },
        ],
        fee,
      );
      newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );
    });
  });

  describe('Contract instantiation', () => {
    test('instantiate', async () => {
      contractAddress = await neutronClient.create(
        CONTRACTS.GRPC_QUERIER,
        {},
        'grpc_querier',
      );
    });
  });

  describe('Grpc queries', () => {
    test('bank balance should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        bank_balance: {
          address: neutronWallet.address,
          denom: NEUTRON_DENOM,
        },
      });
      expect(res.balance.denom).toBe('untrn');
      expect(+res.balance.amount).toBeGreaterThan(1000000);
    });

    test('bank denom metadata should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        bank_denom_metadata: {
          denom: newTokenDenom,
        },
      });
      expect(res.metadata.denom_units[0].denom).toBe(newTokenDenom);
    });

    test('bank params should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        bank_params: {},
      });
      expect(res.params.default_send_enabled).toBe(true);
    });

    test('bank supply of should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        bank_supply_of: {
          denom: NEUTRON_DENOM,
        },
      });
      expect(res.amount.denom).toBe('untrn');
      expect(+res.amount.amount).toBeGreaterThan(1000000);
    });

    // response with the field of type `Any` is expected, but actual type is a different struct
    test.skip('auth account should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        auth_account: {
          address: neutronWallet.address,
        },
      });
      expect(res.account.address).toBe(neutronWallet.address);
    });

    test('transfer denom trace should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        transfer_denom_trace: {
          hash: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        },
      });
      expect(res.denom_trace.path).toBe('transfer/channel-0');
      expect(res.denom_trace.base_denom).toBe(COSMOS_DENOM);
    });

    test('transfer escrow address should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        transfer_escrow_address: {
          port_id: 'transfer',
          channel_id: 'channel-0',
        },
      });
      const res2 = await ibcQuerier.escrowAddress({
        portId: 'transfer',
        channelId: 'channel-0',
      });
      expect(res2.escrowAddress).toBe(res.escrow_address);
    });

    // response with the field of type `Any` is expected, but actual type is a different struct
    test.skip('ibc client state should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        ibc_client_state: {
          client_id: '07-tendermint-1',
        },
      });
      expect(res.client_state['@type']).toBe(
        '/ibc.lightclients.tendermint.v1.ClientState',
      );
      expect(res.client_state.chain_id).toBe('test-2');
    });

    // response with the field of type `Any` is expected, but actual type is a different struct
    test.skip('ibc consensus state should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        ibc_consensus_state: {
          client_id: '07-tendermint-1',
          revision_number: 0,
          revision_height: 0,
          latest_height: true,
        },
      });
      expect(res.consensus_state['@type']).toBe(
        '/ibc.lightclients.tendermint.v1.ConsensusState',
      );
      expect(+res.proof_height.revision_height).toBeGreaterThan(0);
    });

    test('ibc connection should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        ibc_connection: {
          connection_id: 'connection-0',
        },
      });
      expect(res.connection.client_id).toBe('07-tendermint-0');
      expect(+res.proof_height.revision_height).toBeGreaterThan(0);
    });

    test('tokenfactory params should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        tokenfactory_params: {},
      });
      expect(res.params.denom_creation_gas_consume).toBe(null);
    });

    test('tokenfactory denom authority metadata should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        tokenfactory_denom_authority_metadata: {
          creator: neutronWallet.address,
          subdenom: newTokenDenom,
        },
      });
      expect(res.authority_metadata.admin).toBe('');
    });

    test('tokenfactory denoms from creator should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        tokenfactory_denoms_from_creator: {
          creator: neutronWallet.address,
        },
      });
      expect(res.denoms[0]).toBe(newTokenDenom);
    });

    test('interchaintxs params should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        interchaintxs_params: {},
      });
      expect(+res.params.msg_submit_tx_max_messages).toBeGreaterThan(0);
    });

    test('interchainqueries params should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        interchainqueries_params: {},
      });
      expect(+res.params.query_submit_timeout).toBeGreaterThan(0);
    });

    test('feeburner params should work', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        feeburner_params: {},
      });
      expect(res.params.neutron_denom).toBe('untrn');
    });
  });
});
