import { CosmosWrapper, COSMOS_DENOM, NEUTRON_DENOM } from '../helpers/cosmos';
import { waitBlocks } from '../helpers/wait';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';

describe('Neutron / Simple', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let contractAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cm2 = new CosmosWrapper(
      testState.sdk2,
      testState.wallets.cosmos.demo2,
      COSMOS_DENOM,
    );
  });

  describe('Wallets', () => {
    test('Addresses', () => {
      expect(testState.wallets.neutron.demo1.address.toString()).toEqual(
        'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
      );
      expect(testState.wallets.cosmos.demo2.address.toString()).toEqual(
        'cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw',
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
      expect(balances.balances).toEqual([
        { amount: '10000', denom: NEUTRON_DENOM },
      ]);
    });
    test('execute contract', async () => {
      const res = await cm.executeContract(
        contractAddress,
        JSON.stringify({
          send: {
            channel: 'channel-0',
            to: testState.wallets.cosmos.demo2.address.toString(),
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        }),
      );
      expect(res.code).toEqual(0);
    });

    test('check wallet balance', async () => {
      await waitBlocks(cm.sdk, 10);
      const balances = await cm2.queryBalances(
        testState.wallets.cosmos.demo2.address.toString(),
      );
      // we expect X3 balance because the contract sends 2 txs: first one = amount and the second one amount*2
      expect(
        balances.balances.find(
          (bal): boolean =>
            bal.denom ==
            'ibc/C053D637CCA2A2BA030E2C5EE1B28A16F71CCB0E45E8BE52766DC1B241B77878',
        )?.amount,
      ).toEqual('3000');
    });
  });
});
