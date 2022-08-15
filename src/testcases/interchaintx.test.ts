import { BLOCK_TIME, CosmosWrapper } from '../helpers/cosmos';

import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import 'jest-extended';
import { wait } from '../helpers/sleep';
import { rest } from '@cosmos-client/core';
import { AccAddress } from '@cosmos-client/core/cjs/types';

describe('Neutron / Interchain TXs', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let contractAddress: string;
  let icaAdress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(testState.sdk_1, testState.wallets.demo1);
    cm2 = new CosmosWrapper(testState.sdk_2, testState.wallets.demo2);
  });

  describe('Interchain Tx', () => {
    let codeId: string;
    test('store contract', async () => {
      codeId = await cm.storeContract('neutron_interchain_txs.wasm');
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await cm.instantiate(
        codeId,
        JSON.stringify({
          connection_id: 'connection-0',
          interchain_account_id: 'test',
          denom: 'stake',
        }),
        'interchaintx',
      );
      contractAddress = res;
      expect(res.toString()).toEqual(
        'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq',
      );
    });
    test('IBC account created', async () => {
      const channels = await cm.listIBCChannels();
      expect(channels.channels).toBeArray();
      expect(channels.channels).toIncludeAllPartialMembers([
        {
          port_id: `icacontroller-${contractAddress}.test`,
        },
      ]);
    });
    test('get ica address', async () => {
      await wait(BLOCK_TIME * 20);
      const ica = await cm.queryContract<{
        interchain_account_address: string;
      }>(contractAddress, { ica: {} });
      expect(ica.interchain_account_address).toStartWith('neutron');
      expect(ica.interchain_account_address.length).toEqual(66);
      icaAdress = ica.interchain_account_address;
    });
    test('add some money to ICA', async () => {
      const res = await cm2.msgSend(icaAdress.toString(), '10000');
      expect(res.length).toBeGreaterThan(0);
    });
    test('delegate', async () => {
      const res = await cm.executeContract(
        contractAddress,
        JSON.stringify({
          delegate: {
            validator: testState.wallets.val2.address.toString(),
            amount: '2000',
          },
        }),
      );
      expect(res.length).toBeGreaterThan(0);
    });
    test('check validator state', async () => {
      const res = await rest.staking.delegatorDelegations(
        cm2.sdk,
        icaAdress as unknown as AccAddress,
      );
      expect(res.data.delegation_responses).toEqual([
        {
          balance: { amount: '2000', denom: 'stake' },
          delegation: {
            delegator_address: icaAdress,
            shares: '2000.000000000000000000',
            validator_address:
              'neutronvaloper1qnk2n4nlkpw9xfqntladh74w6ujtulwnqshepx',
          },
        },
      ]);
    });
  });
});
