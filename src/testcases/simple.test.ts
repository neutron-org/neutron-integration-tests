import {
  CosmosWrapper,
  COSMOS_DENOM,
  IBC_RELAYER_NEUTRON_ADDRESS,
  NEUTRON_DENOM,
} from '../helpers/cosmos';
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
    describe('Correct way', () => {
      let relayerBalance = 0;
      beforeAll(async () => {
        await waitBlocks(cm.sdk, 10);
        const balances = await cm.queryBalances(IBC_RELAYER_NEUTRON_ADDRESS);
        relayerBalance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
      });
      test('transfer to contract', async () => {
        const res = await cm.msgSend(contractAddress.toString(), '20000');
        expect(res.code).toEqual(0);
      });
      test('check balance', async () => {
        const balances = await cm.queryBalances(contractAddress);
        expect(balances.balances).toEqual([
          { amount: '20000', denom: NEUTRON_DENOM },
        ]);
      });
      test('set payer fees', async () => {
        const res = await cm.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: cm.denom,
              ack_fee: '2333',
              recv_fee: '0',
              timeout_fee: '2666',
            },
          }),
        );
        expect(res.code).toEqual(0);
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
      test('relayer must receive fee', async () => {
        const balances = await cm.queryBalances(IBC_RELAYER_NEUTRON_ADDRESS);
        const balance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
        expect(balance - 2333 * 2 - relayerBalance).toBeLessThan(5); // it may differ by about 1-2 because of the gas fee
      });
      test('contract should be refunded', async () => {
        await waitBlocks(cm.sdk, 10);
        const balances = await cm.queryBalances(contractAddress);
        const balance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
        expect(balance).toBe(20000 - 3000 - 2333 * 2);
      });
    });
    describe('Missing fee', () => {
      beforeAll(async () => {
        await cm.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: cm.denom,
              ack_fee: '0',
              recv_fee: '0',
              timeout_fee: '0',
            },
          }),
        );
      });
      test('execute contract should fail', async () => {
        await expect(
          cm.executeContract(
            contractAddress,
            JSON.stringify({
              send: {
                channel: 'channel-0',
                to: testState.wallets.cosmos.demo2.address.toString(),
                denom: NEUTRON_DENOM,
                amount: '1000',
              },
            }),
          ),
        ).rejects.toThrow(/invalid coins/);
      });
    });
    describe('Not enough amount of tokens on contract to pay fee', () => {
      beforeAll(async () => {
        await cm.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: cm.denom,
              ack_fee: '1000000',
              recv_fee: '0',
              timeout_fee: '100000',
            },
          }),
        );
      });
      test('execute contract should fail', async () => {
        await expect(
          cm.executeContract(
            contractAddress,
            JSON.stringify({
              send: {
                channel: 'channel-0',
                to: testState.wallets.cosmos.demo2.address.toString(),
                denom: NEUTRON_DENOM,
                amount: '1000',
              },
            }),
          ),
        ).rejects.toThrow(/insufficient funds/);
      });
    });
  });
});
