import { BLOCK_TIME, CosmosWrapper } from '../helpers/cosmos';

import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import 'jest-extended';
import { wait } from '../helpers/sleep';

describe('Neutron / Interchain TXs', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let contractAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(testState.sdk_1, testState.wallets.demo1);
  });

  describe('Interchain Tx', () => {
    let codeId: string;
    test('store contract', async () => {
      codeId = await cm.storeWasm('neutron_interchain_txs.wasm');
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
      await wait(BLOCK_TIME * 10);
      const ica = await cm.queryContract<{
        interchain_account_address: string;
      }>(contractAddress, { ica: {} });
      expect(ica.interchain_account_address).toStartWith('neutron');
      expect(ica.interchain_account_address.length).toEqual(66);
    });
  });
});
