import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
  wrapMsg,
} from '../../helpers/cosmos';
import { NeutronContract } from '../../helpers/types';
import { wait } from '../../helpers/wait';

describe('Rescueer', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;

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
      testState.wallets.qaNeutron.genQaWal1,
    );
  });

  describe('rescueer', () => {
    test('multisig', async () => {
      const multisigCodeId = await neutronAccount.storeWasm(
        NeutronContract.MULTISIG,
      );
      const reflectCodeId = await neutronAccount.storeWasm(
        NeutronContract.REFLECT,
      );
      const rescuerCodeId = await neutronAccount.storeWasm(
        NeutronContract.RESCUEEER,
      );
      const contractCodeId = await neutronAccount.storeWasm(
        NeutronContract.IBC_TRANSFER,
      );
      expect(multisigCodeId).toBeGreaterThan(0);
      expect(reflectCodeId).toBeGreaterThan(0);
      expect(rescuerCodeId).toBeGreaterThan(0);
      expect(contractCodeId).toBeGreaterThan(0);

      const multisigRes = await neutronAccount.instantiateContract(
        multisigCodeId,
        JSON.stringify({
          voters: [
            {
              addr: neutronAccount.wallet.address.toString(),
              weight: 1,
            },
          ],
          threshold: { absolute_count: { weight: 1 } },
          max_voting_period: { height: 1000 },
        }),
        'multisig',
      );
      const multisigAddress = multisigRes[0]._contract_address;
      expect(multisigAddress).toBeDefined();
      expect(multisigAddress).not.toEqual('');

      const dao = (await neutronChain.getChainAdmins())[0];
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const eol = currentTimestamp + 30;
      const rescuerRes = await neutronAccount.instantiateContract(
        rescuerCodeId,
        JSON.stringify({
          owner: multisigAddress,
          true_admin: dao,
          eol: eol,
        }),
        'rescueeer',
      );
      const rescuerAddress = rescuerRes[0]._contract_address;
      expect(rescuerAddress).toBeDefined();
      expect(rescuerAddress).not.toEqual('');

      const contractRes = await neutronAccount.instantiateContract(
        contractCodeId,
        '{}',
        'ibc_transfer',
        rescuerAddress,
      );
      const contractAddress = contractRes[0]._contract_address;
      expect(contractAddress).toBeDefined();
      expect(contractAddress).not.toEqual('');

      const currentAdmin = (
        await neutronChain.getContractInfo(contractAddress)
      )['contract_info']['admin'];
      expect(currentAdmin).toBe(rescuerAddress);

      const rescuerExecMigrateMsg = {
        execute: {
          msgs: [
            {
              wasm: {
                migrate: {
                  contract_addr: contractAddress,
                  msg: wrapMsg({}),
                  new_code_id: reflectCodeId,
                },
              },
            },
          ],
        },
      };

      await expect(
        neutronAccount.executeContract(
          rescuerAddress,
          JSON.stringify(rescuerExecMigrateMsg),
        ),
      ).rejects.toThrow(/Unauthorized/);
      await neutronAccount.executeContract(
        multisigAddress,
        JSON.stringify({
          propose: {
            title: '123',
            description: '234',
            msgs: [
              {
                wasm: {
                  execute: {
                    contract_addr: rescuerAddress,
                    msg: wrapMsg(rescuerExecMigrateMsg),
                    funds: [],
                  },
                },
              },
            ],
          },
        }),
      );

      await neutronAccount.executeContract(
        multisigAddress,
        JSON.stringify({
          execute: {
            proposal_id: 1,
          },
        }),
      );

      const newCodeId = parseInt(
        (await neutronChain.getContractInfo(contractAddress))['contract_info'][
          'code_id'
        ],
      );
      expect(newCodeId).toBe(reflectCodeId);

      expect(Math.floor(Date.now() / 1000)).toBeLessThan(eol - 10);

      await expect(
        neutronAccount.executeContract(
          rescuerAddress,
          JSON.stringify({
            transfer_admin: {
              address: contractAddress,
            },
          }),
        ),
      ).rejects.toThrow(/End of life hasn't reached yet/);

      await wait(eol - Math.floor(Date.now() / 1000) + 3);

      await neutronAccount.executeContract(
        rescuerAddress,
        JSON.stringify({
          transfer_admin: {
            address: contractAddress,
          },
        }),
      );

      const newAdmin = (await neutronChain.getContractInfo(contractAddress))[
        'contract_info'
      ]['admin'];
      expect(newAdmin).toBe(dao);
    });
  });
});
