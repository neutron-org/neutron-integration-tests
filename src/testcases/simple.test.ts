import { wait } from '../helpers/sleep';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';

describe('StAtom / Short', () => {
  let testState: TestStateLocalCosmosTestNet;
  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
  });
  describe('stake', () => {
    test('some', async () => {
      await wait(1000);
      expect(1).toEqual(1);
    });
  });
});
