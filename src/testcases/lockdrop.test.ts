import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  NeutronContract,
} from '../helpers/cosmos';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { Wallet } from '../types';
import { LockdropVaultConfig, VaultBondingStatus } from '../helpers/dao';

describe('Neutron / Lockdrop', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm_dao: CosmosWrapper;
  let cm_owner: CosmosWrapper;
  let cm_manager: CosmosWrapper;
  let cm_holder: CosmosWrapper;
  let dao_wallet: Wallet;
  let owner_wallet: Wallet;
  let manager_wallet: Wallet;
  let holder_wallet: Wallet;
  let owner_addr: AccAddress | ValAddress;
  let manager_addr: AccAddress | ValAddress;
  let holder_addr: AccAddress | ValAddress;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    dao_wallet = testState.wallets.neutron.demo1;
    owner_wallet = testState.wallets.neutron.demo2;
    manager_wallet = testState.wallets.neutron.icq;
    holder_wallet = testState.wallets.neutron.rly1;
    owner_addr = owner_wallet.address;
    manager_addr = manager_wallet.address;
    holder_addr = holder_wallet.address;

    cm_dao = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      dao_wallet,
      NEUTRON_DENOM,
    );
    cm_owner = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      owner_wallet,
      NEUTRON_DENOM,
    );
    cm_manager = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      manager_wallet,
      NEUTRON_DENOM,
    );
    cm_holder = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      holder_wallet,
      NEUTRON_DENOM,
    );
  });

  const original_name = 'Lockdrop Vault';
  const original_description = 'A lockdrop vault for test purposes.';
  describe('Lockdrop vault', () => {
    let lockdrop_contract_addr: AccAddress | ValAddress;
    let lockdrop_vault_addr: string;
    test('Instantiate', async () => {
      // TODO: add a real lockdrop contract when it's implemented
      lockdrop_contract_addr = testState.wallets.neutron.rly2.address;

      lockdrop_vault_addr = await setupLockdropVault(
        cm_dao,
        original_name,
        original_description,
        lockdrop_contract_addr.toString(),
        owner_addr.toString(),
        manager_addr.toString(),
      );
    });

    test('Get config', async () => {
      expect(
        await getLockdropVaultConfig(cm_dao, lockdrop_vault_addr),
      ).toMatchObject({
        name: original_name,
        description: original_description,
        lockdrop_contract: lockdrop_contract_addr.toString(),
        owner: owner_addr.toString(),
        manager: manager_addr.toString(),
      });
    });

    const new_description = 'A new description for the lockdrop vault.';
    test('Update config by manager: success', async () => {
      const res = await updateLockdropVaultConfig(
        cm_manager,
        lockdrop_vault_addr,
        owner_addr.toString(),
        lockdrop_contract_addr.toString(),
        manager_addr.toString(),
        original_name,
        new_description,
      );
      expect(res.code).toEqual(0);

      expect(
        await getLockdropVaultConfig(cm_dao, lockdrop_vault_addr),
      ).toMatchObject({
        name: original_name,
        description: new_description,
        lockdrop_contract: lockdrop_contract_addr.toString(),
        owner: owner_addr.toString(),
        manager: manager_addr.toString(),
      });
    });

    test('Update config by manager: permission denied', async () => {
      // change owner to manager
      await expect(
        updateLockdropVaultConfig(
          cm_manager,
          lockdrop_vault_addr,
          manager_addr.toString(),
          lockdrop_contract_addr.toString(),
          manager_addr.toString(),
          original_name,
          original_description,
        ),
      ).rejects.toThrow(/Only owner can change owner/);

      expect(
        await getLockdropVaultConfig(cm_dao, lockdrop_vault_addr),
      ).toMatchObject({
        name: original_name,
        description: new_description,
        lockdrop_contract: lockdrop_contract_addr.toString(),
        owner: owner_addr.toString(),
        manager: manager_addr.toString(),
      });
    });

    test('Update config by owner', async () => {
      // change owner to manager
      let res = await updateLockdropVaultConfig(
        cm_owner,
        lockdrop_vault_addr,
        manager_addr.toString(),
        lockdrop_contract_addr.toString(),
        manager_addr.toString(),
        original_name,
        original_description,
      );
      expect(res.code).toEqual(0);

      expect(
        await getLockdropVaultConfig(cm_dao, lockdrop_vault_addr),
      ).toMatchObject({
        name: original_name,
        description: original_description,
        lockdrop_contract: lockdrop_contract_addr.toString(),
        owner: manager_addr.toString(),
        manager: manager_addr.toString(),
      });

      // make sure new owner is promoted and get back to original lockdrop vault settings
      res = await updateLockdropVaultConfig(
        cm_manager,
        lockdrop_vault_addr,
        owner_addr.toString(),
        lockdrop_contract_addr.toString(),
        manager_addr.toString(),
        original_name,
        original_description,
      );
      expect(res.code).toEqual(0);

      expect(
        await getLockdropVaultConfig(cm_dao, lockdrop_vault_addr),
      ).toMatchObject({
        name: original_name,
        description: original_description,
        lockdrop_contract: lockdrop_contract_addr.toString(),
        owner: owner_addr.toString(),
        manager: manager_addr.toString(),
      });
    });

    test('Bonding and Unbonding', async () => {
      await expect(
        cm_holder.executeContract(
          lockdrop_vault_addr,
          JSON.stringify({
            bond: {},
          }),
          [{ denom: NEUTRON_DENOM, amount: '1000' }],
        ),
      ).rejects.toThrow(/Bonding is not available for this contract/);
      await expect(
        cm_holder.executeContract(
          lockdrop_vault_addr,
          JSON.stringify({
            unbond: {
              amount: '1000',
            },
          }),
        ),
      ).rejects.toThrow(/Direct unbonding is not available for this contract/);
    });

    test('Bonding status', async () => {
      const status = await getVaultBondingStatus(
        cm_holder,
        lockdrop_vault_addr,
        holder_addr.toString(),
      );
      expect(status.bonding_enabled).toEqual(false);
      expect(status.unbondable_abount).toEqual('0');
      expect(status.height).toBeGreaterThan(0);
    });
  });
});

const setupLockdropVault = async (
  cm: CosmosWrapper,
  name: string,
  description: string,
  lockdrop_contract: string,
  owner?: string,
  manager?: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.LOCKDROP_VAULT);
  return (
    await cm.instantiate(
      codeId,
      JSON.stringify({
        name: name,
        description: description,
        lockdrop_contract: lockdrop_contract,
        owner: {
          address: {
            addr: owner,
          },
        },
        manager: manager,
      }),
      'lockdrop_vault',
    )
  )[0]._contract_address;
};

const getLockdropVaultConfig = async (
  cm: CosmosWrapper,
  lockdrop_vault_contract: string,
): Promise<LockdropVaultConfig> =>
  cm.queryContract<LockdropVaultConfig>(lockdrop_vault_contract, {
    get_config: {},
  });

const getVaultBondingStatus = async (
  cm: CosmosWrapper,
  lockdrop_vault_contract: string,
  address: string,
  height?: number,
): Promise<VaultBondingStatus> =>
  cm.queryContract<VaultBondingStatus>(lockdrop_vault_contract, {
    bonding_status: {
      height: height,
      address: address,
    },
  });

const updateLockdropVaultConfig = async (
  cm: CosmosWrapper,
  lockdrop_vault_contract: string,
  owner: string,
  lockdrop_contract: string,
  manager: string,
  name: string,
  description: string,
): Promise<InlineResponse20075TxResponse> =>
  cm.executeContract(
    lockdrop_vault_contract,
    JSON.stringify({
      update_config: {
        owner: owner,
        lockdrop_contract: lockdrop_contract,
        manager: manager,
        name: name,
        description: description,
      },
    }),
  );
