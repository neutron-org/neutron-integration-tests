import { rest } from '@cosmos-client/core';
import { AccAddress } from '@cosmos-client/core/cjs/types';
import { BLOCK_TIME, CosmosWrapper } from '../helpers/cosmos';
import { wait } from '../helpers/sleep';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';

describe('Neutron / Simple', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let contractAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(testState.sdk_1, testState.wallets.demo1);
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
      const balances = await rest.bank.allBalances(
        cm.sdk,
        contractAddress as unknown as AccAddress,
      );
      expect(balances.data.balances).toEqual([
        { amount: '10000', denom: 'stake' },
      ]);
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
      await wait(BLOCK_TIME * 10);
      const balances = await rest.bank.allBalances(
        testState.sdk_2,
        testState.wallets.demo1.address,
      );
      // we expect X3 balance because the contract sends 2 txs: first one = amount and the second one amount*2
      expect(balances.data.balances).toEqual([
        {
          amount: '3000',
          denom:
            'ibc/C053D637CCA2A2BA030E2C5EE1B28A16F71CCB0E45E8BE52766DC1B241B77878',
        },
      ]);
    });
  });
});
