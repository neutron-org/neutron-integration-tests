import { LockdropVaultConfig, VaultBondingStatus } from '../../helpers/dao';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { NeutronContract } from '../../helpers/types';

describe.skip('Neutron / Lockdrop', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let ownerAddr: AccAddress | ValAddress;
  let holderAddr: AccAddress | ValAddress;
  let daoMockWalet: WalletWrapper;
  let ownerMockWalet: WalletWrapper;
  let holderMockWalet: WalletWrapper;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();

    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    daoMockWalet = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    ownerMockWalet = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronThree.genQaWal1,
    );
    holderMockWalet = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFive.genQaWal1,
    );

    ownerAddr = ownerMockWalet.wallet.address;
    holderAddr = holderMockWalet.wallet.address;
  });

  const originalName = 'Lockdrop Vault';
  const originalDescription = 'A lockdrop vault for test purposes.';
  describe('Lockdrop vault', () => {
    let lockdropContractAddr: AccAddress | ValAddress;
    let lockdropVaultAddr: string;
    test('Instantiate', async () => {
      // TODO: add a real lockdrop contract when it's implemented
      lockdropContractAddr = testState.wallets.neutron.rly2.address;

      lockdropVaultAddr = await setupLockdropVault(
        daoMockWalet,
        originalName,
        originalDescription,
        lockdropContractAddr.toString(),
        ownerAddr.toString(),
      );
    });

    test('Get config', async () => {
      expect(
        await getLockdropVaultConfig(neutronChain, lockdropVaultAddr),
      ).toMatchObject({
        name: originalName,
        description: originalDescription,
        lockdrop_contract: lockdropContractAddr.toString(),
        owner: ownerAddr.toString(),
      });
    });

    const newDescription = 'A new description for the lockdrop vault.';
    test('Update config by a holder: permission denied', async () => {
      // change owner to the holder
      await expect(
        updateLockdropVaultConfig(
          holderMockWalet,
          lockdropVaultAddr,
          holderAddr.toString(),
          lockdropContractAddr.toString(),
          originalName,
          originalDescription,
        ),
      ).rejects.toThrow(/Only owner can change owner/);

      expect(
        await getLockdropVaultConfig(neutronChain, lockdropVaultAddr),
      ).toMatchObject({
        name: originalName,
        description: newDescription,
        lockdrop_contract: lockdropContractAddr.toString(),
        owner: ownerAddr.toString(),
      });
    });

    test('Update config by owner', async () => {
      // change owner to the holder
      let res = await updateLockdropVaultConfig(
        ownerMockWalet,
        lockdropVaultAddr,
        holderAddr.toString(),
        lockdropContractAddr.toString(),
        originalName,
        originalDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await getLockdropVaultConfig(neutronChain, lockdropVaultAddr),
      ).toMatchObject({
        name: originalName,
        description: originalDescription,
        lockdrop_contract: lockdropContractAddr.toString(),
        owner: holderAddr.toString(),
      });

      // make sure new owner is promoted and get back to original lockdrop vault settings
      res = await updateLockdropVaultConfig(
        holderMockWalet,
        lockdropVaultAddr,
        ownerAddr.toString(),
        lockdropContractAddr.toString(),
        originalName,
        originalDescription,
      );
      expect(res.code).toEqual(0);

      expect(
        await getLockdropVaultConfig(neutronChain, lockdropVaultAddr),
      ).toMatchObject({
        name: originalName,
        description: originalDescription,
        lockdrop_contract: lockdropContractAddr.toString(),
        owner: ownerAddr.toString(),
      });
    });

    test('Bonding and Unbonding', async () => {
      await expect(
        holderMockWalet.executeContract(
          lockdropVaultAddr,
          JSON.stringify({
            bond: {},
          }),
          [{ denom: NEUTRON_DENOM, amount: '1000' }],
        ),
      ).rejects.toThrow(/Bonding is not available for this contract/);
      await expect(
        holderMockWalet.executeContract(
          lockdropVaultAddr,
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
        neutronChain,
        lockdropVaultAddr,
        holderAddr.toString(),
      );
      expect(status.bonding_enabled).toEqual(false);
      expect(status.unbondable_abount).toEqual('0');
      expect(status.height).toBeGreaterThan(0);
    });
  });
});

const setupLockdropVault = async (
  cm: WalletWrapper,
  name: string,
  description: string,
  lockdropContract: string,
  owner?: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.LOCKDROP_VAULT);
  return (
    await cm.instantiateContract(
      codeId,
      JSON.stringify({
        name: name,
        description: description,
        lockdrop_contract: lockdropContract,
        owner: {
          address: {
            addr: owner,
          },
        },
      }),
      'lockdrop_vault',
    )
  )[0]._contract_address;
};

const getLockdropVaultConfig = async (
  cm: CosmosWrapper,
  lockdropVaultContract: string,
): Promise<LockdropVaultConfig> =>
  cm.queryContract<LockdropVaultConfig>(lockdropVaultContract, {
    get_config: {},
  });

const getVaultBondingStatus = async (
  cm: CosmosWrapper,
  lockdropVaultContract: string,
  address: string,
  height?: number,
): Promise<VaultBondingStatus> =>
  cm.queryContract<VaultBondingStatus>(lockdropVaultContract, {
    bonding_status: {
      height: height,
      address: address,
    },
  });

const updateLockdropVaultConfig = async (
  cm: WalletWrapper,
  lockdropVaultContract: string,
  owner: string,
  lockdropContract: string,
  name: string,
  description: string,
): Promise<InlineResponse20075TxResponse> =>
  cm.executeContract(
    lockdropVaultContract,
    JSON.stringify({
      update_config: {
        owner: owner,
        lockdrop_contract: lockdropContract,
        name: name,
        description: description,
      },
    }),
  );
