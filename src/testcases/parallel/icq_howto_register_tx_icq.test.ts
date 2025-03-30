import config from '../../config.json';
import { inject, RunnerTestSuite } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { Coin, Registry } from '@cosmjs/proto-signing';
import { Wallet } from '../../helpers/wallet';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import {
  COSMOS_DENOM,
  CONTRACTS,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { GasPrice } from '@cosmjs/stargate/build/fee';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { getWithAttempts } from '@neutron-org/neutronjsplus/dist/wait';

const CONNECTION_ID = 'connection-0';
const ICQ_UPDATE_PERIOD = 5;
const GAIA_VAL_ADDR = 'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn';
const DELEGATION_AMOUNT = 1000000;

describe(
  'Neutron / docs / interchainqueries / howto / register TX ICQ',
  {},
  () => {
    let testState: LocalState;
    let gaiaClient: SigningStargateClient;
    let gaiaWallet: Wallet;
    let neutronWallet: Wallet;
    let neutronClient: SigningNeutronClient;

    beforeAll(async (suite: RunnerTestSuite) => {
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
        {
          registry: new Registry(defaultRegistryTypes),
          gasPrice: GasPrice.fromString('0.05uatom'),
        },
      );

      let resp = await gaiaClient.delegateTokens(
        gaiaWallet.address.toString(),
        GAIA_VAL_ADDR,
        { amount: DELEGATION_AMOUNT.toString(), denom: COSMOS_DENOM },
        'auto',
      );
      expect(resp.code).toBe(0);
      await getWithAttempts(
        gaiaClient,
        async () =>
          await gaiaClient.getDelegation(
            gaiaWallet.address.toString(),
            GAIA_VAL_ADDR,
          ),
        async (response) => response.amount == DELEGATION_AMOUNT.toString(),
      );

      resp = await gaiaClient.undelegateTokens(
        gaiaWallet.address.toString(),
        GAIA_VAL_ADDR,
        { amount: (DELEGATION_AMOUNT / 2).toString(), denom: COSMOS_DENOM },
        'auto',
      );
      expect(resp.code).toBe(0);
    });

    let contractAddress: string;
    describe('instantiate contract', () => {
      let codeId: number;
      test('store contract', async () => {
        codeId = await neutronClient.upload(CONTRACTS.HOWTO_REGISTER_TX_ICQ);
        expect(codeId).toBeGreaterThan(0);
      });
      test('instantiate contract', async () => {
        contractAddress = await neutronClient.instantiate(
          codeId,
          {},
          'howto_register_custom_tx_icq',
        );
      });
    });

    describe('register and execute TX ICQ', () => {
      test('top up contract', async () => {
        await neutronClient.sendTokens(
          contractAddress,
          [{ denom: NEUTRON_DENOM, amount: '1000000' }],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
      });

      test('register TX ICQ', async () => {
        await neutronClient.execute(
          contractAddress,
          {
            register_undelegations_query: {
              connection_id: CONNECTION_ID,
              addr: gaiaWallet.address.toString(),
              update_period: ICQ_UPDATE_PERIOD,
            },
          },
          [],
          {
            amount: [{ denom: NEUTRON_DENOM, amount: '1000000' }],
            gas: '2000000',
          },
        );
      });

      describe('check ICQ submitted value result', () => {
        test('beforeAll undelegation result submission', async () => {
          await getWithAttempts(
            neutronClient,
            async (): Promise<Coin[]> =>
              await neutronClient.queryContractSmart(contractAddress, {
                undelegated_amount: { address: gaiaWallet.address.toString() },
              }),
            async (response) =>
              response.length == 1 &&
              response[0].amount == (DELEGATION_AMOUNT / 2).toString(),
          );
        });

        test('undelegate once more', async () => {
          const resp = await gaiaClient.undelegateTokens(
            gaiaWallet.address.toString(),
            GAIA_VAL_ADDR,
            { amount: (DELEGATION_AMOUNT / 4).toString(), denom: COSMOS_DENOM },
            'auto',
          );
          expect(resp.code).toBe(0);
        });

        test('one more undelegation result submission', async () => {
          await getWithAttempts(
            neutronClient,
            async (): Promise<Coin[]> =>
              await neutronClient.queryContractSmart(contractAddress, {
                undelegated_amount: { address: gaiaWallet.address.toString() },
              }),
            async (response) =>
              response.length == 2 &&
              response[1].amount == (DELEGATION_AMOUNT / 4).toString(),
          );
        });
      });
    });
  },
);
