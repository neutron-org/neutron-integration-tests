import '@neutron-org/neutronjsplus';
import { getEventAttribute } from '@neutron-org/neutronjsplus/dist/cosmos';
import { LocalState } from '../../helpers/local_state';
import { NeutronContract, Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { Suite, inject } from 'vitest';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { MsgCreateDenom } from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/tx';
import { COSMOS_DENOM, NEUTRON_DENOM } from '../../helpers/constants';

import config from '../../config.json';

describe('Neutron / Stargate Queries', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let neutronWallet: Wallet;
  let contractAddress: string;

  let gaiaClient: SigningStargateClient;
  let gaiaWallet: Wallet;

  let newTokenDenom: string;

  beforeAll(async (suite: Suite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    gaiaWallet = await testState.nextWallet('cosmos');
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.directwallet,
      { registry: new Registry(defaultRegistryTypes) },
    );
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
                revisionNumber: BigInt(2),
                revisionHeight: BigInt(100000000),
              },
            }),
          },
        ],
        fee,
      );
    });

    test('create denom, mint', async () => {
      const denom = `teststargate`;
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
        NeutronContract.STARGATE_QUERIER,
        {},
        'stargate_querier',
      );
    });
  });

  // TODO: this function does not make much sense: remove it
  async function querySmart(query: any): Promise<string> {
    return await neutronClient.queryContractSmart(contractAddress, query);
  }

  describe('Stargate queries', () => {
    test('bank balance should work', async () => {
      const res = JSON.parse(
        await querySmart({
          bank_balance: {
            address: neutronWallet.address,
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
            address: neutronWallet.address,
          },
        }),
      );
      expect(res.account.address).toBe(neutronWallet.address);
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
          creator: neutronWallet.address,
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
