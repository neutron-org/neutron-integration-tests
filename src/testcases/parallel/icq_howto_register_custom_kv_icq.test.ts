import config from '../../config.json';
import { inject, RunnerTestSuite } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { Registry } from '@cosmjs/proto-signing';
import { Wallet } from '../../helpers/wallet';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import {
  COSMOS_DENOM,
  CONTRACTS,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { GasPrice } from '@cosmjs/stargate/build/fee';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';

// just a fresh test-specific address. don't use it in other parallel test cases to avoid races
const WATCHED_GAIA_ADDR = 'cosmos1yfhvt7uje9ztwr9mk6xnkg0thf83r2d53w38ja';

const CONNECTION_ID = 'connection-0';
const ICQ_UPDATE_PERIOD = 5;

describe(
  'Neutron / docs / interchainqueries / howto / register KV ICQ',
  {},
  () => {
    let testState: LocalState;
    let gaiaClient: SigningStargateClient;
    let gaiaAddress: string;
    let neutronWallet: Wallet;
    let neutronClient: SigningNeutronClient;

    beforeAll(async (suite: RunnerTestSuite) => {
      testState = await LocalState.create(config, inject('mnemonics'), suite);
      neutronWallet = await testState.nextWallet('neutron');

      const galaWallet = await testState.nextWallet('cosmos');
      gaiaClient = await SigningStargateClient.connectWithSigner(
        testState.rpcGaia,
        galaWallet.directwallet,
        {
          registry: new Registry(defaultRegistryTypes),
          gasPrice: GasPrice.fromString('0.05uatom'),
        },
      );
      gaiaAddress = (
        await galaWallet.directwallet.getAccounts()
      )[0].address.toString();

      neutronClient = await SigningNeutronClient.connectWithSigner(
        testState.rpcNeutron,
        neutronWallet.directwallet,
        neutronWallet.address,
      );

      await gaiaClient.sendTokens(
        gaiaAddress,
        WATCHED_GAIA_ADDR,
        [
          {
            amount: '1000000',
            denom: COSMOS_DENOM,
          },
        ],
        300000,
      );
    });

    let contractAddress: string;
    describe('instantiate contract', () => {
      let codeId: number;
      test('store contract', async () => {
        codeId = await neutronClient.upload(
          CONTRACTS.HOWTO_REGISTER_CUSTOM_KV_ICQ,
        );
        expect(codeId).toBeGreaterThan(0);
      });
      test('instantiate contract', async () => {
        contractAddress = await neutronClient.instantiate(
          codeId,
          {},
          'howto_register_custom_kv_icq',
        );
      });
    });

    describe('register and execute KV ICQ', () => {
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

      test('register KV ICQ', async () => {
        await neutronClient.execute(
          contractAddress,
          {
            register_account_query: {
              connection_id: CONNECTION_ID,
              addr: WATCHED_GAIA_ADDR,
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

      test('check ICQ submitted value result', async () => {
        await waitBlocks(ICQ_UPDATE_PERIOD, neutronClient);

        const queryResult = await neutronClient.queryContractSmart(
          contractAddress,
          { account: { address: WATCHED_GAIA_ADDR } },
        );
        expect(queryResult.address).toEqual(WATCHED_GAIA_ADDR);
        expect(+queryResult.sequence).toEqual(0);
        expect(+queryResult.account_number).not.toEqual(0);
      });
    });
  },
);
