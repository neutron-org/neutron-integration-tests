import { LocalState } from '../../helpers/local_state';
import { inject } from 'vitest';
import { Wallet } from '../../helpers/wallet';
import { CONTRACTS } from '../../helpers/constants';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import config from '../../config.json';

describe('Float operations support', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let neutronWallet: Wallet;
  let contractAddress: string;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.signer,
      neutronWallet.address,
    );
  });
  describe('Contracts: ', () => {
    test('instantiate', async () => {
      contractAddress = await neutronClient.create(CONTRACTS.FLOATY, {});
    });
  });
  describe('instructions', () => {
    test('autotests', async () => {
      // do not check actual results here, only check
      // returns various supported float instructions
      const instructions = await neutronClient.queryContractSmart(
        contractAddress,
        {
          instructions: {},
        },
      );
      expect(instructions.length).toEqual(70);
      for (let i = 0; i < instructions.length; i++) {
        // returns a random(seed) arguments for a given instruction
        const args = await neutronClient.queryContractSmart(contractAddress, {
          random_args_for: { instruction: instructions[i], seed: 45 },
        });

        // returns a result of operation for a given instructions with supplied arguments
        await neutronClient.queryContractSmart(contractAddress, {
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

      res = await neutronClient.queryContractSmart(contractAddress, {
        run: { instruction: 'f32.add', args: [f2, f2] },
      });
      expect(res.u32).toEqual(f4.f32);

      res = await neutronClient.queryContractSmart(contractAddress, {
        run: { instruction: 'f32.mul', args: [f2, f4] },
      });
      expect(res.u32).toEqual(f8.f32);

      res = await neutronClient.queryContractSmart(contractAddress, {
        run: { instruction: 'f32.sqrt', args: [f4] },
      });
      expect(res.u32).toEqual(f2.f32);

      res = await neutronClient.queryContractSmart(contractAddress, {
        run: { instruction: 'f32.sqrt', args: [f8] },
      });
      // 1077216499 = sqrt(8)
      expect(res.u32).toEqual(1077216499);
    });
  });
});
