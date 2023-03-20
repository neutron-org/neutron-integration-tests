import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import { Wallet } from '../../types';

describe('DAO / Deploy', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm_dao: CosmosWrapper;
  let dao_wallet: Wallet;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    dao_wallet = testState.wallets.qaNeutron.genQaWal1;

    cm_dao = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      dao_wallet,
      NEUTRON_DENOM,
    );
  });
});
