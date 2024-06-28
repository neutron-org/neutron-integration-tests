import { IndexedTx } from '@cosmjs/cosmwasm-stargate';
import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { LocalState, createWalletWrapper } from '../../helpers/localState';
import { NeutronContract, Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { CreditsVaultConfig } from '@neutron-org/neutronjsplus/dist/dao';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import { Suite, inject } from 'vitest';

const config = require('../../config.json');

describe('Neutron / Credits Vault', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let daoWallet: Wallet;
  let airdropWallet: Wallet;
  let lockdropWallet: Wallet;

  let daoAccount: WalletWrapper;
  let airdropAccount: WalletWrapper;

  let daoAddr: string;
  let airdropAddr: string;
  let lockdropAddr: string;

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics, suite);
    await testState.init();
    daoWallet = await testState.nextWallet('neutron');
    airdropWallet = await testState.nextWallet('neutron');
    lockdropWallet = await testState.nextWallet('neutron');

    lockdropAddr = lockdropWallet.address;

    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.restNeutron,
      testState.rpcNeutron,
    );

    daoAccount = await createWalletWrapper(neutronChain, daoWallet);
    daoAddr = daoAccount.wallet.address;
    airdropAccount = await createWalletWrapper(neutronChain, airdropWallet);
    airdropAddr = airdropAccount.wallet.address;
  });

  const originalName = 'credits_vault';
  const originalDescription = 'A credits vault for test purposes.';
  describe('Credits vault', () => {
    let creditsContractAddr: string;
    let creditsVaultAddr: string;

    beforeEach(async () => {
      creditsContractAddr = await setupCreditsContract(
        daoAccount,
        daoAddr,
        airdropAddr,
        lockdropAddr,
        1676016745597000,
      );

      creditsVaultAddr = await setupCreditsVault(
        daoAccount,
        originalName,
        originalDescription,
        creditsContractAddr,
        daoAddr,
        airdropAddr,
      );
    });

    test('Get config', async () => {
      expect(
        await getVaultConfig(neutronChain, creditsVaultAddr),
      ).toMatchObject({
        name: originalName,
        description: originalDescription,
        credits_contract_address: creditsContractAddr,
        owner: daoAddr,
        airdrop_contract_address: airdropAddr,
      });
    });

    const newName = 'new_credits_vault';
    const newDescription = 'A new description for the credits vault.';
    test('Update config', async () => {
      const res = await updateVaultConfig(
        daoAccount,
        creditsVaultAddr,
        creditsContractAddr,
        newName,
        newDescription,
        daoAddr,
      );
      expect(res.code).toEqual(0);

      expect(
        await getVaultConfig(neutronChain, creditsVaultAddr),
      ).toMatchObject({
        name: newName,
        description: newDescription,
        credits_contract_address: creditsContractAddr,
        owner: daoAddr,
        airdrop_contract_address: airdropAddr,
      });
    });

    test('Airdrop always has zero voting power', async () => {
      const currentHeight = await neutronChain.getHeight();
      expect(
        await getVotingPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          airdropAddr,
          currentHeight,
        ),
      ).toMatchObject({
        height: currentHeight,
        power: '0',
      });
    });

    test('Airdrop is never included in total voting power', async () => {
      let currentHeight = await neutronChain.getHeight();
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

      await mintTokens(daoAccount, creditsContractAddr, '1000');
      await neutronChain.waitBlocks(1);

      currentHeight = await neutronChain.getHeight();
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

      await sendTokens(airdropAccount, creditsContractAddr, daoAddr, '500');
      await neutronChain.waitBlocks(1);

      currentHeight = await neutronChain.getHeight();
      expect(
        await getVotingPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          daoAddr,
          currentHeight,
        ),
      ).toMatchObject({
        height: currentHeight,
        power: '500',
      });
      expect(
        await getTotalPowerAtHeight(
          neutronChain,
          creditsVaultAddr,
          currentHeight,
        ),
      ).toMatchObject({
        height: currentHeight,
        power: '500',
      });
    });

    test('Query voting power at different heights', async () => {
      const firstHeight = await neutronChain.getHeight();

      await mintTokens(daoAccount, creditsContractAddr, '1000');
      await sendTokens(airdropAccount, creditsContractAddr, daoAddr, '1000');
      await neutronChain.waitBlocks(1);
      const secondHeight = await neutronChain.getHeight();

      await mintTokens(daoAccount, creditsContractAddr, '1000');
      await sendTokens(airdropAccount, creditsContractAddr, daoAddr, '1000');
      await neutronChain.waitBlocks(1);
      const thirdHeight = await neutronChain.getHeight();

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
          daoAddr,
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
          daoAddr,
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
          daoAddr,
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
  name: string,
  description: string,
  creditsContractAddress: string,
  owner: string,
  airdropContractAddress: string,
) => {
  const codeId = await wallet.storeWasm(NeutronContract.CREDITS_VAULT);
  return await wallet.instantiateContract(
    codeId,
    {
      name,
      description,
      credits_contract_address: creditsContractAddress,
      owner,
      airdrop_contract_address: airdropContractAddress,
    },
    'credits_vault',
  );
};

const setupCreditsContract = async (
  wallet: WalletWrapper,
  daoAddress: string,
  airdropAddress: string,
  lockdropAddress: string,
  whenWithdrawable: number,
) => {
  const codeId = await wallet.storeWasm(NeutronContract.TGE_CREDITS);
  const creditsContractAddress = await wallet.instantiateContract(
    codeId,
    {
      dao_address: daoAddress,
    },
    'credits',
  );

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
): Promise<IndexedTx> =>
  wallet.executeContract(creditsContractAddress, {
    update_config: {
      config: {
        airdrop_address: airdropAddress,
        lockdrop_address: lockdropAddress,
        when_withdrawable: whenWithdrawable,
      },
    },
  });

const getVaultConfig = async (
  cm: CosmosWrapper,
  creditsVaultContract: string,
): Promise<CreditsVaultConfig> =>
  cm.queryContract<CreditsVaultConfig>(creditsVaultContract, {
    config: {},
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
): Promise<IndexedTx> =>
  wallet.executeContract(
    creditsContractAddress,
    {
      mint: {},
    },
    [
      {
        amount,
        denom: NEUTRON_DENOM,
      },
    ],
  );

const sendTokens = async (
  wallet: WalletWrapper,
  creditsContractAddress: string,
  recipient: string,
  amount: string,
): Promise<IndexedTx> =>
  wallet.executeContract(creditsContractAddress, {
    transfer: {
      recipient,
      amount,
    },
  });

const updateVaultConfig = async (
  wallet: WalletWrapper,
  vaultContract: string,
  creditsContractAddress: string,
  name: string,
  description: string,
  owner?: string,
): Promise<IndexedTx> =>
  wallet.executeContract(vaultContract, {
    update_config: {
      credits_contract_address: creditsContractAddress,
      owner,
      name,
      description,
    },
  });
