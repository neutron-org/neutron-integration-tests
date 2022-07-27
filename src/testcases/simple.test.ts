import { rest } from '@cosmos-client/core';
import { AccAddress } from '@cosmos-client/core/cjs/types';
import { CosmosWrapper } from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import _ from 'lodash';

describe('Neutron / Simple', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let contractAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(testState.sdk_1, testState.wallets.demo1);
  });

  afterAll(() => {
    testState.finish();
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
    let startWalletBalance: string;
    beforeAll(async () => {
      const balances = await rest.bank.allBalances(
        cm.sdk,
        testState.wallets.demo1.address,
      );
      startWalletBalance = _.get(balances, 'data.balances.0.amount', '0');
    });
    test('transfer to contract', async () => {
      const res = await cm.msgSend(contractAddress.toString(), '10000');
      expect(res).not.toEqual('');
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
      const res = await cm.execute(
        contractAddress,
        JSON.stringify({
          send: {
            to: testState.wallets.demo1.address.toString(),
            amount: '1000',
          },
        }),
      );
      expect(res.length).toBeGreaterThan(0);
    });
    test('check contract balance', async () => {
      const balances = await rest.bank.allBalances(
        cm.sdk,
        contractAddress as unknown as AccAddress,
      );
      expect(balances.data.balances).toEqual([
        { amount: '9000', denom: 'stake' },
      ]);
    });
    test('check wallet balance', async () => {
      const balances = await rest.bank.allBalances(
        cm.sdk,
        testState.wallets.demo1.address,
      );
      expect(
        parseInt(startWalletBalance) -
          parseInt(_.get(balances, 'data.balances.0.amount', '0')),
      ).toEqual(21000); // so you know 1000 + gas fees 🤖
    });
  });
});
