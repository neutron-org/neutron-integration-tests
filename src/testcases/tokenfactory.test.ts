import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { CosmosWrapper, NEUTRON_DENOM } from '../helpers/cosmos';
import axios from 'axios';

describe('Neutron / Tokenfactory', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cmNeutron: CosmosWrapper;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cmNeutron = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
  });

  test('tokenfactory module is added', async () => {
    const paramsPresent = await checkTokenfactoryParams(cmNeutron.sdk.url);
    expect(paramsPresent).toBeTruthy();
  });
});

const checkTokenfactoryParams = async (sdkUrl: string): Promise<boolean> => {
  try {
    await axios.get(`${sdkUrl}/osmosis/tokenfactory/v1beta1/params`);
    return true;
  } catch (e) {
    return false;
  }
};
