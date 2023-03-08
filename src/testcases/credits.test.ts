import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { CosmosWrapper, NEUTRON_DENOM } from '../helpers/cosmos';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
// import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { Wallet } from '../types';
import { CreditsVaultConfig } from '../helpers/dao';
import { NeutronContract } from '../helpers/types';

describe('Neutron / Credits', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm_dao: CosmosWrapper;
  // let cm_owner: CosmosWrapper;
  // let cm_manager: CosmosWrapper;
  // let cm_holder: CosmosWrapper;
  let dao_wallet: Wallet;
  let owner_wallet: Wallet;
  let manager_wallet: Wallet;
  let airdrop_wallet: Wallet;
  let lockdrop_wallet: Wallet;
  let dao_addr: AccAddress | ValAddress;
  let airdrop_addr: AccAddress | ValAddress;
  let lockdrop_addr: AccAddress | ValAddress;
  let owner_addr: AccAddress | ValAddress;
  let manager_addr: AccAddress | ValAddress;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    dao_wallet = testState.wallets.neutron.demo1;
    airdrop_wallet = testState.wallets.neutron.demo2;
    lockdrop_wallet = testState.wallets.neutron.icq;
    owner_wallet = testState.wallets.neutron.rly1;
    manager_wallet = testState.wallets.neutron.rly1;
    dao_addr = dao_wallet.address;
    airdrop_addr = airdrop_wallet.address;
    lockdrop_addr = lockdrop_wallet.address;
    owner_addr = owner_wallet.address;
    manager_addr = manager_wallet.address;

    cm_dao = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      dao_wallet,
      NEUTRON_DENOM,
    );
    // cm_owner = new CosmosWrapper(
    //   testState.sdk1,
    //   testState.blockWaiter1,
    //   dao_wallet,
    //   NEUTRON_DENOM,
    // );
  });

  const original_description = 'A credtis vault for test purposes.';
  describe('Credits vault', () => {
    let credits_contract_addr: string;
    let credits_vault_addr: string;

    test('Instantiate', async () => {
      credits_contract_addr = await setupCreditsContract(
        cm_dao,
        dao_addr.toString(),
        airdrop_addr.toString(),
        lockdrop_addr.toString(),
        '1676016745597000',
      );

      credits_vault_addr = await setupCreditsVault(
        cm_dao,
        credits_contract_addr,
        original_description,
        owner_addr.toString(),
        manager_addr.toString(),
      );
    });

    test('Get config', async () => {
      expect(await getVaultConfig(cm_dao, credits_vault_addr)).toMatchObject({
        description: original_description,
        credits_contract_address: credits_contract_addr,
        owner: owner_addr.toString(),
        manager: manager_addr.toString(),
      });
    });

    // const new_description = 'A new description for the lockdrop vault.';
    // test('Update config by manager: success', async () => {
    //   const res = await updateLockdropVaultConfig(
    //     cm_manager,
    //     lockdrop_vault_addr,
    //     owner_addr.toString(),
    //     lockdrop_contract_addr.toString(),
    //     manager_addr.toString(),
    //     original_name,
    //     new_description,
    //   );
    //   expect(res.code).toEqual(0);

    //   expect(
    //     await getLockdropVaultConfig(cm_dao, lockdrop_vault_addr),
    //   ).toMatchObject({
    //     name: original_name,
    //     description: new_description,
    //     lockdrop_contract: lockdrop_contract_addr.toString(),
    //     owner: owner_addr.toString(),
    //     manager: manager_addr.toString(),
    //   });
    // });

    // test('Update config by manager: permission denied', async () => {
    //   // change owner to manager
    //   await expect(
    //     updateLockdropVaultConfig(
    //       cm_manager,
    //       lockdrop_vault_addr,
    //       manager_addr.toString(),
    //       lockdrop_contract_addr.toString(),
    //       manager_addr.toString(),
    //       original_name,
    //       original_description,
    //     ),
    //   ).rejects.toThrow(/Only owner can change owner/);

    //   expect(
    //     await getLockdropVaultConfig(cm_dao, lockdrop_vault_addr),
    //   ).toMatchObject({
    //     name: original_name,
    //     description: new_description,
    //     lockdrop_contract: lockdrop_contract_addr.toString(),
    //     owner: owner_addr.toString(),
    //     manager: manager_addr.toString(),
    //   });
    // });

    // test('Update config by owner', async () => {
    //   // change owner to manager
    //   let res = await updateLockdropVaultConfig(
    //     cm_owner,
    //     lockdrop_vault_addr,
    //     manager_addr.toString(),
    //     lockdrop_contract_addr.toString(),
    //     manager_addr.toString(),
    //     original_name,
    //     original_description,
    //   );
    //   expect(res.code).toEqual(0);

    //   expect(
    //     await getLockdropVaultConfig(cm_dao, lockdrop_vault_addr),
    //   ).toMatchObject({
    //     name: original_name,
    //     description: original_description,
    //     lockdrop_contract: lockdrop_contract_addr.toString(),
    //     owner: manager_addr.toString(),
    //     manager: manager_addr.toString(),
    //   });

    //   // make sure new owner is promoted and get back to original lockdrop vault settings
    //   res = await updateLockdropVaultConfig(
    //     cm_manager,
    //     lockdrop_vault_addr,
    //     owner_addr.toString(),
    //     lockdrop_contract_addr.toString(),
    //     manager_addr.toString(),
    //     original_name,
    //     original_description,
    //   );
    //   expect(res.code).toEqual(0);

    //   expect(
    //     await getLockdropVaultConfig(cm_dao, lockdrop_vault_addr),
    //   ).toMatchObject({
    //     name: original_name,
    //     description: original_description,
    //     lockdrop_contract: lockdrop_contract_addr.toString(),
    //     owner: owner_addr.toString(),
    //     manager: manager_addr.toString(),
    //   });
    // });

    // test('Bonding and Unbonding', async () => {
    //   await expect(
    //     cm_holder.executeContract(
    //       lockdrop_vault_addr,
    //       JSON.stringify({
    //         bond: {},
    //       }),
    //       [{ denom: NEUTRON_DENOM, amount: '1000' }],
    //     ),
    //   ).rejects.toThrow(/Bonding is not available for this contract/);
    //   await expect(
    //     cm_holder.executeContract(
    //       lockdrop_vault_addr,
    //       JSON.stringify({
    //         unbond: {
    //           amount: '1000',
    //         },
    //       }),
    //     ),
    //   ).rejects.toThrow(/Direct unbonding is not available for this contract/);
    // });

    // test('Bonding status', async () => {
    //   const status = await getVaultBondingStatus(
    //     cm_holder,
    //     lockdrop_vault_addr,
    //     holder_addr.toString(),
    //   );
    //   expect(status.bonding_enabled).toEqual(false);
    //   expect(status.unbondable_abount).toEqual('0');
    //   expect(status.height).toBeGreaterThan(0);
    // });
  });
});

const setupCreditsVault = async (
  cm: CosmosWrapper,
  credits_contract_address: string,
  description: string,
  owner?: string,
  manager?: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.CREDITS_VAULT);
  return (
    await cm.instantiate(
      codeId,
      JSON.stringify({
        credits_contract_address,
        description,
        owner: {
          address: {
            addr: owner,
          },
        },
        manager,
      }),
      'credits_vault',
    )
  )[0]._contract_address;
};

const setupCreditsContract = async (
  cm: CosmosWrapper,
  dao_address: string,
  airdrop_address: string,
  lockdrop_address: string,
  when_withdrawable: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.CREDITS);
  console.log(
    JSON.stringify({
      dao_address,
      airdrop_address,
      lockdrop_address,
      when_withdrawable,
    }),
  );
  return (
    await cm.instantiate(
      codeId,
      JSON.stringify({
        dao_address,
        airdrop_address,
        lockdrop_address,
        when_withdrawable,
      }),
      'credits',
    )
  )[0]._contract_address;
};

const getVaultConfig = async (
  cm: CosmosWrapper,
  lockdrop_vault_contract: string,
): Promise<CreditsVaultConfig> =>
  cm.queryContract<CreditsVaultConfig>(lockdrop_vault_contract, {
    get_config: {},
  });

// const updateVaultConfig = async (
//   cm: CosmosWrapper,
//   vault_contract: string,
//   credits_contract_address: string,
//   description: string,
//   owner?: string,
//   manager?: string,
// ): Promise<InlineResponse20075TxResponse> =>
//   cm.executeContract(
//     vault_contract,
//     JSON.stringify({
//       update_config: {
//         credits_contract_address: {
//           address: {
//             addr: credits_contract_address,
//           },
//         },
//         description,
//         owner: {
//           address: {
//             addr: owner,
//           },
//         },
//         manager: {
//           address: {
//             addr: manager,
//           },
//         },
//       },
//     }),
//   );
