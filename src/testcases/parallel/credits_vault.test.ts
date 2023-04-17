import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
// import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { Wallet } from '../../types';
import { CreditsVaultConfig } from '../../helpers/dao';
import { NeutronContract } from '../../helpers/types';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { getHeight } from '../../helpers/wait';

describe('Neutron / Credits Vault', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let daoWallet: Wallet;
  let managerWallet: Wallet;
  let airdropWallet: Wallet;
  let lockdropWallet: Wallet;

  let daoAccount: WalletWrapper;
  let managerAccount: WalletWrapper;

  let daoAddr: AccAddress | ValAddress;
  let airdropAddr: AccAddress | ValAddress;
  let lockdropAddr: AccAddress | ValAddress;
  let managerAddr: AccAddress | ValAddress;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    daoWallet = testState.wallets.qaNeutron.genQaWal1;
    managerWallet = testState.wallets.qaNeutronThree.genQaWal1;
    airdropWallet = testState.wallets.qaNeutronFour.genQaWal1;
    lockdropWallet = testState.wallets.qaNeutronFive.genQaWal1;

    airdropAddr = airdropWallet.address;
    lockdropAddr = lockdropWallet.address;
    managerAddr = managerWallet.address;

    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );

    daoAccount = new WalletWrapper(neutronChain, daoWallet);
    daoAddr = daoAccount.wallet.address;

    managerAccount = new WalletWrapper(neutronChain, managerWallet);
    managerAddr = managerAccount.wallet.address;
  });

  const original_description = 'A credtis vault for test purposes.';
  describe('Credits vault', () => {
    let creditsContractAddr: string;
    let creditsVaultAddr: string;

    beforeEach(async () => {
      creditsContractAddr = await setupCreditsContract(
        daoAccount,
        daoAddr.toString(),
        airdropAddr.toString(),
        lockdropAddr.toString(),
        1676016745597000,
      );

      creditsVaultAddr = await setupCreditsVault(
        daoAccount,
        creditsContractAddr,
        original_description,
        daoAddr.toString(),
        managerAddr.toString(),
      );
    });

    test('Get config', async () => {
      expect(
        await getVaultConfig(neutronChain, creditsVaultAddr),
      ).toMatchObject({
        description: original_description,
        credits_contract_address: creditsContractAddr,
        owner: daoAddr.toString(),
        manager: managerAddr.toString(),
      });
    });

    const new_description = 'A new description for the credits vault.';
    test('Update config by manager: success', async () => {
      const res = await updateVaultConfig(
        managerAccount,
        creditsVaultAddr,
        creditsContractAddr,
        new_description,
        daoAddr.toString(),
        managerAddr.toString(),
      );
      expect(res.code).toEqual(0);

      expect(
        await getVaultConfig(neutronChain, creditsVaultAddr),
      ).toMatchObject({
        description: new_description,
        credits_contract_address: creditsContractAddr,
        owner: daoAddr.toString(),
        manager: managerAddr.toString(),
      });
    });

    test('Update config by manager: permission denied', async () => {
      // change owner to manager
      await expect(
        updateVaultConfig(
          managerAccount,
          creditsVaultAddr,
          creditsContractAddr,
          new_description,
          managerAddr.toString(),
          managerAddr.toString(),
        ),
      ).rejects.toThrow(/Only owner can change owner/);

      expect(
        await getVaultConfig(neutronChain, creditsVaultAddr),
      ).toMatchObject({
        description: original_description,
        credits_contract_address: creditsContractAddr,
        owner: daoAddr.toString(),
        manager: managerAddr.toString(),
      });
    });

    test('Update config by owner', async () => {
      // change owner to manager
      let res = await updateVaultConfig(
        daoAccount,
        creditsVaultAddr,
        creditsContractAddr,
        original_description,
        managerAddr.toString(),
        managerAddr.toString(),
      );
      expect(res.code).toEqual(0);

      expect(
        await getVaultConfig(neutronChain, creditsVaultAddr),
      ).toMatchObject({
        description: original_description,
        credits_contract_address: creditsContractAddr,
        owner: managerAddr.toString(),
        manager: managerAddr.toString(),
      });

      // make sure new owner is promoted and get back to original lockdrop vault settings
      res = await updateVaultConfig(
        managerAccount,
        creditsVaultAddr,
        creditsContractAddr,
        original_description,
        daoAddr.toString(),
        managerAddr.toString(),
      );
      expect(res.code).toEqual(0);

      expect(
        await getVaultConfig(neutronChain, creditsVaultAddr),
      ).toMatchObject({
        description: original_description,
        credits_contract_address: creditsContractAddr,
        owner: daoAddr.toString(),
        manager: managerAddr.toString(),
      });
    });

    test('Query total voting power at height', async () => {
      const currentHeight = await getHeight(neutronChain.sdk);
      expect(
        await getTotalPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          currentHeight,
        ),
      ).toMatchObject({
        height: currentHeight,
        power: '0',
      });
    });

    test('Query airdrop address voting power at height', async () => {
      const currentHeight = await getHeight(neutronChain.sdk);
      expect(
        await getVotingPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          airdropAddr.toString(),
          currentHeight,
        ),
      ).toMatchObject({
        height: currentHeight,
        power: '0',
      });
    });

    test('Query voting power at different heights', async () => {
      const firstHeight = await getHeight(neutronChain.sdk);

      await mintTokens(daoAccount, creditsContractAddr, '1000');
      await neutronChain.blockWaiter.waitBlocks(1);
      const secondHeight = await getHeight(neutronChain.sdk);

      await mintTokens(daoAccount, creditsContractAddr, '1000');
      await neutronChain.blockWaiter.waitBlocks(1);
      const thirdHeight = await getHeight(neutronChain.sdk);

      expect(
        await getTotalPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          secondHeight,
        ),
      ).toMatchObject({
        height: secondHeight,
        power: '1000',
      });
      expect(
        await getVotingPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          airdropAddr.toString(),
          secondHeight,
        ),
      ).toMatchObject({
        height: secondHeight,
        power: '1000',
      });

      expect(
        await getTotalPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          firstHeight,
        ),
      ).toMatchObject({
        height: firstHeight,
        power: '0',
      });
      expect(
        await getVotingPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          airdropAddr.toString(),
          firstHeight,
        ),
      ).toMatchObject({
        height: firstHeight,
        power: '0',
      });

      expect(
        await getTotalPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          thirdHeight,
        ),
      ).toMatchObject({
        height: thirdHeight,
        power: '2000',
      });
      expect(
        await getVotingPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          airdropAddr.toString(),
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
  wallet: WalletWrapper,
  creditsContractAddress: string,
  description: string,
  owner?: string,
  manager?: string,
) => {
  const codeId = await wallet.storeWasm(NeutronContract.CREDITS_VAULT);
  return (
    await wallet.instantiateContract(
      codeId,
      JSON.stringify({
        credits_contract_address: creditsContractAddress,
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
  wallet: WalletWrapper,
  daoAddress: string,
  airdropAddress: string,
  lockdropAddress: string,
  whenWithdrawable: number,
) => {
  const codeId = await wallet.storeWasm(NeutronContract.TGE_CREDITS);
  const creditsContractAddress = (
    await wallet.instantiateContract(
      codeId,
      JSON.stringify({
        dao_address: daoAddress,
      }),
      'credits',
    )
  )[0]._contract_address;

  await updateCreditsContractConfig(
    wallet,
    creditsContractAddress,
    airdropAddress,
    lockdropAddress,
    whenWithdrawable,
  );

  return creditsContractAddress;
};

const updateCreditsContractConfig = async (
  wallet: WalletWrapper,
  creditsContractAddress: string,
  airdropAddress: string,
  lockdropAddress: string,
  whenWithdrawable: number,
): Promise<InlineResponse20075TxResponse> =>
  wallet.executeContract(
    creditsContractAddress,
    JSON.stringify({
      update_config: {
        config: {
          airdrop_address: airdropAddress,
          lockdrop_address: lockdropAddress,
          when_withdrawable: whenWithdrawable,
        },
      },
    }),
  );

const getVaultConfig = async (
  cm: CosmosWrapper,
  creditsVaultContract: string,
): Promise<CreditsVaultConfig> =>
  cm.queryContract<CreditsVaultConfig>(creditsVaultContract, {
    get_config: {},
  });

const getTotalPowerAtHeight = async (
  cm: CosmosWrapper,
  creditsVaultContract: string,
  height: number,
): Promise<CreditsVaultConfig> =>
  cm.queryContract<CreditsVaultConfig>(creditsVaultContract, {
    total_power_at_height: {
      height,
    },
  });

const getVotingPowerAtHeight = async (
  cm: CosmosWrapper,
  creditsVaultContract: string,
  address: string,
  height: number,
): Promise<CreditsVaultConfig> =>
  cm.queryContract<CreditsVaultConfig>(creditsVaultContract, {
    voting_power_at_height: {
      address,
      height,
    },
  });

const mintTokens = async (
  wallet: WalletWrapper,
  creditsContractAddress: string,
  amount: string,
): Promise<InlineResponse20075TxResponse> =>
  wallet.executeContract(
    creditsContractAddress,
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
  wallet: WalletWrapper,
  vault_contract: string,
  creditsContractAddress: string,
  description: string,
  owner?: string,
  manager?: string,
): Promise<InlineResponse20075TxResponse> =>
  wallet.executeContract(
    vault_contract,
    JSON.stringify({
      update_config: {
        credits_contract_address: creditsContractAddress,
        description,
        owner,
        manager,
      },
    }),
  );
