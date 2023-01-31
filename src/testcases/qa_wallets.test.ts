import * as bip39 from 'bip39';
import { cosmosclient, proto,} from '@cosmos-client/core';
import {
    CosmosWrapper,
    NEUTRON_DENOM,
  } from '../helpers/cosmos';
import bech32 from 'bech32';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';



describe('Tests', () => {
    let cm: CosmosWrapper;
    let testState: TestStateLocalCosmosTestNet;
    
    beforeAll(async () => {
        testState = new TestStateLocalCosmosTestNet();
        await testState.init();
        cm = new CosmosWrapper(
            testState.sdk1,
            testState.blockWaiter1,
            testState.wallets.qa.demo1,
            NEUTRON_DENOM,
          );
    });

    test('create address from mnemonic', async () => {
        print ('test is done')
         //const words = bech32.toWords(Buffer.from(pubKey.bytes()));
         //const bech32Address = bech32.encode('neutron', words);
  })
})
