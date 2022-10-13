import { CosmosWrapper } from '../helpers/cosmos';
import { waitBlocks } from '../helpers/wait';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import axios from 'axios';

describe('Neutron / Simple', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let contractAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(testState.sdk1, testState.wallets.demo1);
    cm2 = new CosmosWrapper(testState.sdk2, testState.wallets.demo2);
  });

  describe('Wallets', () => {
    test('Addresses', () => {
      expect(testState.wallets.demo1.address.toString()).toEqual(
        'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
      );
      expect(testState.wallets.demo2.address.toString()).toEqual(
        'neutron10h9stc5v6ntgeygf5xf945njqq5h32r54rf7kf',
      );
    });
  });

  describe('Contracts', () => {
    let codeId: string;
    test('store contract', async () => {
      codeId = await cm.storeWasm('ibc_transfer.wasm');
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await cm.instantiate(codeId, '{}', 'ibc_transfer');
      contractAddress = res;
      expect(res.toString()).toEqual(
        'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq',
      );
    });
  });

  describe('IBC', () => {
    test('transfer to contract', async () => {
      const res = await cm.msgSend(contractAddress.toString(), '10000');
      expect(res.code).toEqual(0);
    });
    test('check balance', async () => {
      const balances = await cm.queryBalances(contractAddress);
      expect(balances.balances).toEqual([{ amount: '10000', denom: 'stake' }]);
    });
    test('execute contract', async () => {
      const res = await cm.executeContract(
        contractAddress,
        JSON.stringify({
          send: {
            to: testState.wallets.demo1.address.toString(),
            amount: '1000',
          },
        }),
      );
      expect(res.code).toEqual(0);
    });

    test('check wallet balance', async () => {
      await waitBlocks(cm.sdk, 10);
      const balances = await cm2.queryBalances(
        testState.wallets.demo1.address.toString(),
      );
      // we expect X3 balance because the contract sends 2 txs: first one = amount and the second one amount*2
      expect(balances.balances).toEqual([
        {
          amount: '3000',
          denom:
            'ibc/C053D637CCA2A2BA030E2C5EE1B28A16F71CCB0E45E8BE52766DC1B241B77878',
        },
      ]);
    });
  });

  describe('Swagger-ui', () => {
    test('swagger-ui', async () => {
      const uiLink1 = new URL('/swagger/', cm.sdk.url);
      const yamlLink1 = new URL('/swagger/openapi.yml', cm.sdk.url);

      const uiLink2 = new URL('/swagger/', cm2.sdk.url);
      const yamlLink2 = new URL('/swagger/openapi.yml', cm2.sdk.url);

      const successResponse = { status: 200 };
      const failedResponse = { response: { status: 501 } };

      expect.assertions(4);

      await expect(axios.get(uiLink1.toString())).rejects.toMatchObject(
        failedResponse,
      );
      await expect(axios.get(yamlLink1.toString())).rejects.toMatchObject(
        failedResponse,
      );
      await expect(axios.get(uiLink2.toString())).resolves.toMatchObject(
        successResponse,
      );
      await expect(axios.get(yamlLink2.toString())).resolves.toMatchObject(
        successResponse,
      );
    });
  });
});
