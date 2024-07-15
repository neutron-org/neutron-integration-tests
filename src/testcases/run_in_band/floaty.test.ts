import { LocalState } from '../../helpers/local_state';
import { inject } from 'vitest';
import {CodeId, NeutronContract, Wallet} from '@neutron-org/neutronjsplus/dist/types';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import {wasm, WasmWrapper} from "../../helpers/wasmClient";
import {Registry} from "@cosmjs/proto-signing";
import {neutronTypes} from "@neutron-org/neutronjsplus/dist/neutronTypes";

const config = require('../../config.json');

describe('Float operations support', () => {
  let testState: LocalState;
  let neutronClient: WasmWrapper;
  let neutronAccount: Wallet;
  let contractAddress: string;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronAccount = await testState.nextWallet('neutron');
    neutronClient = await wasm(
      testState.rpcNeutron,
      neutronAccount,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );

  });
  describe('Contracts: ', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronClient.upload(NeutronContract.FLOATY);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      contractAddress = await neutronClient.instantiate(
        codeId,
        {},
        'floaty',
      );
    });
  });
  describe('instructions', () => {
    test('autotests', async () => {
      // do not check actual resuts here, only check
      // retuns various supported float instrustions
      const instructions = await neutronClient.client.queryContractSmart<string[]>(
        contractAddress,
        {
          instructions: {},
        },
      );
      expect(instructions.length).toEqual(70);
      for (let i = 0; i < instructions.length; i++) {
        // returns a random(seed) arguments for a given instrustion
        const args = await neutronClient.client.queryContractSmart<any[]>(contractAddress, {
          random_args_for: { instruction: instructions[i], seed: 45 },
        });

        // returns a result of operation for a given instructions with supplied arguments
        await neutronClient.client.queryContractSmart<any>(contractAddress, {
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

      res = await neutronClient.client.queryContractSmart<{ u32: number }>(contractAddress, {
        run: { instruction: 'f32.add', args: [f2, f2] },
      });
      expect(res.u32).toEqual(f4.f32);

      res = await neutronClient.client.queryContractSmart<{ u32: number }>(contractAddress, {
        run: { instruction: 'f32.mul', args: [f2, f4] },
      });
      expect(res.u32).toEqual(f8.f32);

      res = await neutronClient.client.queryContractSmart<{ u32: number }>(contractAddress, {
        run: { instruction: 'f32.sqrt', args: [f4] },
      });
      expect(res.u32).toEqual(f2.f32);

      res = await neutronClient.client.queryContractSmart<{ u32: number }>(contractAddress, {
        run: { instruction: 'f32.sqrt', args: [f8] },
      });
      // 1077216499 = sqrt(8)
      expect(res.u32).toEqual(1077216499);
    });
  });
});
