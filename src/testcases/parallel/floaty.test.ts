import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { NeutronContract } from '../../helpers/types';
import { CodeId } from '../../types';

describe('Float operations support', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let contractAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
  });
  describe('Contracts: ', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(NeutronContract.FLOATY);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await neutronAccount.instantiateContract(
        codeId,
        '{}',
        'floaty',
      );
      contractAddress = res[0]._contract_address;
    });
  });
  describe('instructions', () => {
    test('autotests', async () => {
      // do not check actual resuts here, only check
      // retuns various supported float instrustions
      const instructions = await neutronChain.queryContract<string[]>(
        contractAddress,
        {
          instructions: {},
        },
      );
      expect(instructions.length).toEqual(70);
      for (let i = 0; i < instructions.length; i++) {
        // returns a random(seed) arguments for a given instrustion
        const args = await neutronChain.queryContract<any[]>(contractAddress, {
          random_args_for: { instruction: instructions[i], seed: 45 },
        });

        // returns a result of operation for a given instructions with supplied arguments
        await neutronChain.queryContract<any>(contractAddress, {
          run: { instruction: instructions[i], args: args },
        });
      }
    });
    test('manual', async () => {
      // some float as bits
      // 2.0 - 1073741824
      const f2 = { f32: 1073741824 };
      // // 3.0 - 1077936128
      // const f3 = { f32: 1077936128 };
      // 4.0 - 1082130432
      const f4 = { f32: 1082130432 };
      // 8.0 - 1090519040
      const f8 = { f32: 1090519040 };

      let res: { u32: number };

      res = await neutronChain.queryContract<{ u32: number }>(contractAddress, {
        run: { instruction: 'f32.add', args: [f2, f2] },
      });
      expect(res.u32).toEqual(f4.f32);

      res = await neutronChain.queryContract<{ u32: number }>(contractAddress, {
        run: { instruction: 'f32.mul', args: [f2, f4] },
      });
      expect(res.u32).toEqual(f8.f32);

      res = await neutronChain.queryContract<{ u32: number }>(contractAddress, {
        run: { instruction: 'f32.sqrt', args: [f4] },
      });
      expect(res.u32).toEqual(f2.f32);

      res = await neutronChain.queryContract<{ u32: number }>(contractAddress, {
        run: { instruction: 'f32.sqrt', args: [f8] },
      });
      // 1077216499 = sqrt(8)
      expect(res.u32).toEqual(1077216499);
    });
  });
});
