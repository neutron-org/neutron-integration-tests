import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { CosmosWrapper, NEUTRON_DENOM } from '../helpers/cosmos';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
// import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { Wallet } from '../types';
import { CreditsVaultConfig } from '../helpers/dao';
import { NeutronContract } from '../helpers/types';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { getHeight } from '../helpers/wait';

describe('Neutron / Credits', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm_dao: CosmosWrapper;
  let cm_manager: CosmosWrapper;
  let dao_wallet: Wallet;
  let manager_wallet: Wallet;
  let airdrop_wallet: Wallet;
  let lockdrop_wallet: Wallet;
  let dao_addr: AccAddress | ValAddress;
  let airdrop_addr: AccAddress | ValAddress;
  let lockdrop_addr: AccAddress | ValAddress;
  let manager_addr: AccAddress | ValAddress;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    dao_wallet = testState.wallets.neutron.demo1;
    airdrop_wallet = testState.wallets.neutron.demo2;
    lockdrop_wallet = testState.wallets.neutron.icq;
    manager_wallet = testState.wallets.neutron.rly1;
    dao_addr = dao_wallet.address;
    airdrop_addr = airdrop_wallet.address;
    lockdrop_addr = lockdrop_wallet.address;
    manager_addr = manager_wallet.address;

    cm_dao = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      dao_wallet,
      NEUTRON_DENOM,
    );
    cm_manager = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      manager_wallet,
      NEUTRON_DENOM,
    );
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
        dao_addr.toString(),
        manager_addr.toString(),
      );
    });

    test('Get config', async () => {
      expect(await getVaultConfig(cm_dao, credits_vault_addr)).toMatchObject({
        description: original_description,
        credits_contract_address: credits_contract_addr,
        owner: dao_addr.toString(),
        manager: manager_addr.toString(),
      });
    });

    const new_description = 'A new description for the lockdrop vault.';
    test('Update config by manager: success', async () => {
      const res = await updateVaultConfig(
        cm_manager,
        credits_vault_addr,
        credits_contract_addr,
        new_description,
        dao_addr.toString(),
        manager_addr.toString(),
      );
      expect(res.code).toEqual(0);

      expect(await getVaultConfig(cm_dao, credits_vault_addr)).toMatchObject({
        description: new_description,
        credits_contract_address: credits_contract_addr,
        owner: dao_addr.toString(),
        manager: manager_addr.toString(),
      });
    });

    test('Update config by manager: permission denied', async () => {
      // change owner to manager
      await expect(
        updateVaultConfig(
          cm_manager,
          credits_vault_addr,
          credits_contract_addr,
          original_description,
          manager_addr.toString(),
          manager_addr.toString(),
        ),
      ).rejects.toThrow(/Only owner can change owner/);

      expect(await getVaultConfig(cm_dao, credits_vault_addr)).toMatchObject({
        description: new_description,
        credits_contract_address: credits_contract_addr,
        owner: dao_addr.toString(),
        manager: manager_addr.toString(),
      });
    });

    test('Update config by owner', async () => {
      // change owner to manager
      let res = await updateVaultConfig(
        cm_dao,
        credits_vault_addr,
        credits_contract_addr,
        original_description,
        manager_addr.toString(),
        manager_addr.toString(),
      );
      expect(res.code).toEqual(0);

      expect(await getVaultConfig(cm_dao, credits_vault_addr)).toMatchObject({
        description: original_description,
        credits_contract_address: credits_contract_addr,
        owner: manager_addr.toString(),
        manager: manager_addr.toString(),
      });

      // make sure new owner is promoted and get back to original lockdrop vault settings
      res = await updateVaultConfig(
        cm_manager,
        credits_vault_addr,
        credits_contract_addr,
        original_description,
        dao_addr.toString(),
        manager_addr.toString(),
      );
      expect(res.code).toEqual(0);

      expect(await getVaultConfig(cm_dao, credits_vault_addr)).toMatchObject({
        description: original_description,
        credits_contract_address: credits_contract_addr,
        owner: dao_addr.toString(),
        manager: manager_addr.toString(),
      });
    });

    test('Query total voting power at height', async () => {
      const currentHeight = await getHeight(cm_manager.sdk);
      expect(
        await getTotalPowerAtHeight(
          cm_manager,
          credits_vault_addr,
          currentHeight,
        ),
      ).toMatchObject({
        height: currentHeight,
        power: '0',
      });
    });

    test('Query airdrop address voting power at height', async () => {
      const currentHeight = await getHeight(cm_manager.sdk);
      expect(
        await getVotingPowerAtHeight(
          cm_manager,
          credits_vault_addr,
          airdrop_addr.toString(),
          currentHeight,
        ),
      ).toMatchObject({
        height: currentHeight,
        power: '0',
      });
    });

    test('Query voting power at different heights', async () => {
      const firstHeight = await getHeight(cm_manager.sdk);

      await mintTokens(cm_dao, credits_contract_addr, '1000');
      await cm_dao.blockWaiter.waitBlocks(1);
      const secondHeight = await getHeight(cm_manager.sdk);

      await mintTokens(cm_dao, credits_contract_addr, '1000');
      await cm_dao.blockWaiter.waitBlocks(1);
      const thirdHeight = await getHeight(cm_manager.sdk);

      expect(
        await getTotalPowerAtHeight(
          cm_manager,
          credits_vault_addr,
          secondHeight,
        ),
      ).toMatchObject({
        height: secondHeight,
        power: '1000',
      });
      expect(
        await getVotingPowerAtHeight(
          cm_manager,
          credits_vault_addr,
          airdrop_addr.toString(),
          secondHeight,
        ),
      ).toMatchObject({
        height: secondHeight,
        power: '1000',
      });

      expect(
        await getTotalPowerAtHeight(
          cm_manager,
          credits_vault_addr,
          firstHeight,
        ),
      ).toMatchObject({
        height: firstHeight,
        power: '0',
      });
      expect(
        await getVotingPowerAtHeight(
          cm_manager,
          credits_vault_addr,
          airdrop_addr.toString(),
          firstHeight,
        ),
      ).toMatchObject({
        height: firstHeight,
        power: '0',
      });

      expect(
        await getTotalPowerAtHeight(
          cm_manager,
          credits_vault_addr,
          thirdHeight,
        ),
      ).toMatchObject({
        height: thirdHeight,
        power: '2000',
      });
      expect(
        await getVotingPowerAtHeight(
          cm_manager,
          credits_vault_addr,
          airdrop_addr.toString(),
          thirdHeight,
        ),
      ).toMatchObject({
        height: thirdHeight,
        power: '2000',
      });
    });
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
  credits_vault_contract: string,
): Promise<CreditsVaultConfig> =>
  cm.queryContract<CreditsVaultConfig>(credits_vault_contract, {
    get_config: {},
  });

const getTotalPowerAtHeight = async (
  cm: CosmosWrapper,
  credits_vault_contract: string,
  height: number,
): Promise<CreditsVaultConfig> =>
  cm.queryContract<CreditsVaultConfig>(credits_vault_contract, {
    total_power_at_height: {
      height,
    },
  });

const getVotingPowerAtHeight = async (
  cm: CosmosWrapper,
  credits_vault_contract: string,
  address: string,
  height: number,
): Promise<CreditsVaultConfig> =>
  cm.queryContract<CreditsVaultConfig>(credits_vault_contract, {
    voting_power_at_height: {
      address,
      height,
    },
  });

const mintTokens = async (
  cm: CosmosWrapper,
  credits_contract_address: string,
  amount: string,
): Promise<InlineResponse20075TxResponse> =>
  cm.executeContract(
    credits_contract_address,
    JSON.stringify({
      mint: {},
    }),
    [
      {
        amount,
        denom: NEUTRON_DENOM,
      },
    ],
  );

const updateVaultConfig = async (
  cm: CosmosWrapper,
  vault_contract: string,
  credits_contract_address: string,
  description: string,
  owner?: string,
  manager?: string,
): Promise<InlineResponse20075TxResponse> =>
  cm.executeContract(
    vault_contract,
    JSON.stringify({
      update_config: {
        credits_contract_address,
        description,
        owner: {
          address: {
            addr: owner,
          },
        },
        manager,
      },
    }),
  );
