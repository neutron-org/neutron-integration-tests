import { LocalState } from '../../helpers/local_state';
import { RunnerTestSuite, inject } from 'vitest';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import config from '../../config.json';
import { Wallet } from '../../helpers/wallet';
import { CONTRACTS } from '../../helpers/constants';

// general contract keys used across the tests
const VOTING_REGISTRY_CONTRACT_KEY = 'VOTING_REGISTRY';
const NEUTRON_VAULT_CONTRACT_KEY = 'NEUTRON_VAULT';
// specific contract keys used across the tests
const NEUTRON_VAULT_1_CONTRACT_KEY = 'NEUTRON_VAULT_1';
const NEUTRON_VAULT_2_CONTRACT_KEY = 'NEUTRON_VAULT_2';
const NEUTRON_VAULT_3_CONTRACT_KEY = 'NEUTRON_VAULT_3';

describe('Neutron / Voting Registry', () => {
  let testState: LocalState;
  let neutronClient: NeutronTestClient;
  let neutronWallet: Wallet;
  let daoMemberWallet: Wallet;
  let neutronDaoMemberClient: NeutronTestClient;
  let contractAddresses: Record<string, string> = {};
  let votingRegistryAddr: string;
  let vault1Addr: string;
  let vault2Addr: string;
  let vault3Addr: string;

  let vpHistory: VotingPowerInfoHistory;
  // initial bondings
  const vault1Bonding = 1_000_000;
  const vault2Bonding = 500_000;
  // additional bonding amount
  const vault1AddBonding = 10_000;
  // partial unbonding amount
  const vault1Unbonding = 100_000;
  // bonding to an additional vault
  const vault3Bonding = 5_000_000;

  beforeAll(async (suite: RunnerTestSuite) => {
    const mnemonics = inject('mnemonics');
    testState = await LocalState.create(config, mnemonics, suite);
    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);

    daoMemberWallet = await testState.nextNeutronWallet();
    neutronDaoMemberClient = await NeutronTestClient.connectWithSigner(
      daoMemberWallet,
    );

    contractAddresses = await deployContracts(neutronClient);
    votingRegistryAddr = contractAddresses[VOTING_REGISTRY_CONTRACT_KEY];
    vault1Addr = contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY];
    vault2Addr = contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY];
    vault3Addr = contractAddresses[NEUTRON_VAULT_3_CONTRACT_KEY];

    vpHistory = initVotingPowerInfoHistory();
  });

  describe('assert init state', () => {
    test('check voting vaults', async () => {
      const votingVaults = await getVotingVaults(
        neutronClient,
        votingRegistryAddr,
      );
      // initially there are only vault1 and vault2 in the registry, vault3 is to be added later
      expect(votingVaults.length).toBe(2);
      expect(votingVaults).toContainEqual({
        address: vault1Addr,
        description: NEUTRON_VAULT_1_CONTRACT_KEY,
        name: NEUTRON_VAULT_1_CONTRACT_KEY,
        state: 'Active',
      });
      expect(votingVaults).toContainEqual({
        address: vault2Addr,
        description: NEUTRON_VAULT_2_CONTRACT_KEY,
        name: NEUTRON_VAULT_2_CONTRACT_KEY,
        state: 'Active',
      });
    });
    test('check voting power', async () => {
      const vpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
      );
      expect(vpInfo.vault1Power).toBe(0);
      expect(vpInfo.vault1TotalPower).toBe(0);
      expect(vpInfo.vault2Power).toBe(0);
      expect(vpInfo.vault2TotalPower).toBe(0);
      expect(vpInfo.vault3Power).toBe(0);
      expect(vpInfo.vault3TotalPower).toBe(0);
      expect(vpInfo.votingRegistryPower).toBe(0);
      expect(vpInfo.votingRegistryTotalPower).toBe(0);
    });
  });

  describe('accrue init voting power', () => {
    test('bond funds', async () => {
      await bondFunds(
        neutronDaoMemberClient,
        vault1Addr,
        vault1Bonding.toString(),
      );
      await bondFunds(
        neutronDaoMemberClient,
        vault2Addr,
        vault2Bonding.toString(),
      );
      // we bond to vault3 in advance regardless of this is not in the registry yet
      await bondFunds(
        neutronDaoMemberClient,
        vault3Addr,
        vault3Bonding.toString(),
      );
      await waitBlocks(2, neutronClient);
    });

    test('check accrued voting power', async () => {
      const vpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
      );
      expect(vpInfo.vault1Power).toEqual(vault1Bonding);
      expect(vpInfo.vault1TotalPower).toEqual(vault1Bonding);
      expect(vpInfo.vault2Power).toEqual(vault2Bonding);
      expect(vpInfo.vault2TotalPower).toEqual(vault2Bonding);
      expect(vpInfo.vault3Power).toEqual(vault3Bonding);
      expect(vpInfo.vault3TotalPower).toEqual(vault3Bonding);
      // no vault3 in the registry yet
      expect(vpInfo.votingRegistryPower).toEqual(vault1Bonding + vault2Bonding);
      expect(vpInfo.votingRegistryTotalPower).toEqual(
        vault1Bonding + vault2Bonding,
      );
      vpHistory.init = vpInfo;
    });
  });

  describe('VP on bond and unbond', () => {
    test('bond funds', async () => {
      await bondFunds(
        neutronDaoMemberClient,
        vault1Addr,
        vault1AddBonding.toString(),
      );
      await waitBlocks(1, neutronClient);
    });
    test('check voting power after bonding', async () => {
      const vpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
      );

      // compare the new values to the prev state ones
      // expect the vault1 VP to increase by bonding amount
      expect(vpInfo.vault1Power).toEqual(
        vpHistory.init.vault1Power + vault1AddBonding,
      );
      expect(vpInfo.vault1TotalPower).toEqual(
        vpHistory.init.vault1TotalPower + vault1AddBonding,
      );

      // expect the vault2 VP to remain the same
      expect(vpInfo.vault2Power).toEqual(vpHistory.init.vault2Power);
      expect(vpInfo.vault2TotalPower).toEqual(vpHistory.init.vault2TotalPower);

      // expect the vault3 VP to remain the same
      expect(vpInfo.vault3Power).toEqual(vpHistory.init.vault3Power);
      expect(vpInfo.vault3TotalPower).toEqual(vpHistory.init.vault3TotalPower);

      // expect the registry VP to increase by bonding amount
      expect(vpInfo.votingRegistryPower).toEqual(
        vpHistory.init.vault1TotalPower +
          vault1AddBonding +
          vpHistory.init.vault2TotalPower,
      );
      expect(vpInfo.votingRegistryTotalPower).toEqual(
        vpHistory.init.vault1TotalPower +
          vault1AddBonding +
          vpHistory.init.vault2TotalPower,
      );
      vpHistory.additionalBonding = vpInfo;
    });

    test('unbond funds', async () => {
      await unbondFunds(
        neutronDaoMemberClient,
        vault1Addr,
        vault1Unbonding.toString(),
      );
      await waitBlocks(1, neutronClient);
    });
    test('check voting power after unbonding', async () => {
      const vpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
      );

      // compare the new values to the prev state ones
      // expect the vault1 VP to decrease by bonding amount
      expect(vpInfo.vault1Power).toEqual(
        vpHistory.additionalBonding.vault1Power - vault1Unbonding,
      );
      expect(vpInfo.vault1TotalPower).toEqual(
        vpHistory.additionalBonding.vault1TotalPower - vault1Unbonding,
      );

      // expect the vault2 VP to remain the same
      expect(vpInfo.vault2Power).toEqual(
        vpHistory.additionalBonding.vault2Power,
      );
      expect(vpInfo.vault2TotalPower).toEqual(
        vpHistory.additionalBonding.vault2TotalPower,
      );

      // expect the vault3 VP to remain the same
      expect(vpInfo.vault3Power).toEqual(
        vpHistory.additionalBonding.vault3Power,
      );
      expect(vpInfo.vault3TotalPower).toEqual(
        vpHistory.additionalBonding.vault3TotalPower,
      );

      // expect the registry VP to decrease by unbonding amount
      expect(vpInfo.votingRegistryPower).toEqual(
        vpHistory.additionalBonding.vault1TotalPower -
          vault1Unbonding +
          vpHistory.additionalBonding.vault2TotalPower,
      );
      expect(vpInfo.votingRegistryTotalPower).toEqual(
        vpHistory.additionalBonding.vault1TotalPower -
          vault1Unbonding +
          vpHistory.additionalBonding.vault2TotalPower,
      );
      vpHistory.unbonding = vpInfo;
    });

    // expect VP infos taken from heights in the past to be the same as they were at that points
    test('check historical voting power', async () => {
      const initVpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
        vpHistory.init.height,
      );
      expect(initVpInfo).toMatchObject(vpHistory.init);

      const atAdditionalBondingVpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
        vpHistory.additionalBonding.height,
      );
      expect(atAdditionalBondingVpInfo).toMatchObject(
        vpHistory.additionalBonding,
      );

      const atUnbondingVpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
        vpHistory.unbonding.height,
      );
      expect(atUnbondingVpInfo).toMatchObject(vpHistory.unbonding);
    });
  });

  describe('VP on vaults list mutation', () => {
    test('deactivate vault', async () => {
      await deactivateVotingVault(
        neutronClient,
        votingRegistryAddr,
        vault2Addr,
      );
      await waitBlocks(1, neutronClient);

      const votingVaults = await getVotingVaults(
        neutronClient,
        votingRegistryAddr,
      );
      expect(votingVaults.length).toBe(2);
      expect(votingVaults).toContainEqual({
        address: vault1Addr,
        description: NEUTRON_VAULT_1_CONTRACT_KEY,
        name: NEUTRON_VAULT_1_CONTRACT_KEY,
        state: 'Active',
      });
      expect(votingVaults).toContainEqual({
        address: vault2Addr,
        description: NEUTRON_VAULT_2_CONTRACT_KEY,
        name: NEUTRON_VAULT_2_CONTRACT_KEY,
        state: 'Inactive',
      });
    });
    test('check voting power after deactivation', async () => {
      const vpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
      );

      // compare the new values to the prev state ones
      // expect the vault1 VP to remain the same
      expect(vpInfo.vault1Power).toEqual(vpHistory.unbonding.vault1Power);
      expect(vpInfo.vault1TotalPower).toEqual(
        vpHistory.unbonding.vault1TotalPower,
      );

      // expect the vault2 VP to remain the same
      expect(vpInfo.vault2Power).toEqual(vpHistory.unbonding.vault2Power);
      expect(vpInfo.vault2TotalPower).toEqual(
        vpHistory.unbonding.vault2TotalPower,
      );

      // expect the vault3 VP to remain the same
      expect(vpInfo.vault3Power).toEqual(vpHistory.unbonding.vault3Power);
      expect(vpInfo.vault3TotalPower).toEqual(
        vpHistory.unbonding.vault3TotalPower,
      );

      // expect the registry VP to decrease by deactivated vault's power
      expect(vpInfo.votingRegistryPower).toEqual(
        vpHistory.unbonding.votingRegistryPower -
          vpHistory.unbonding.vault2Power,
      );
      expect(vpInfo.votingRegistryTotalPower).toEqual(
        vpHistory.unbonding.votingRegistryTotalPower -
          vpHistory.unbonding.vault2TotalPower,
      );
      vpHistory.vaultDeactivation = vpInfo;
    });

    test('add another vault', async () => {
      await addVotingVault(neutronClient, votingRegistryAddr, vault3Addr);
      await waitBlocks(1, neutronClient);

      const votingVaults = await getVotingVaults(
        neutronClient,
        votingRegistryAddr,
      );
      expect(votingVaults.length).toBe(3);
      expect(votingVaults).toContainEqual({
        address: vault1Addr,
        description: NEUTRON_VAULT_1_CONTRACT_KEY,
        name: NEUTRON_VAULT_1_CONTRACT_KEY,
        state: 'Active',
      });
      expect(votingVaults).toContainEqual({
        address: vault2Addr,
        description: NEUTRON_VAULT_2_CONTRACT_KEY,
        name: NEUTRON_VAULT_2_CONTRACT_KEY,
        state: 'Inactive',
      });
      expect(votingVaults).toContainEqual({
        address: vault3Addr,
        description: NEUTRON_VAULT_3_CONTRACT_KEY,
        name: NEUTRON_VAULT_3_CONTRACT_KEY,
        state: 'Active',
      });
    });
    test('check voting power after vault addition', async () => {
      const vpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
      );

      // compare the new values to the prev state ones
      // expect the vault1 VP to remain the same
      expect(vpInfo.vault1Power).toEqual(
        vpHistory.vaultDeactivation.vault1Power,
      );
      expect(vpInfo.vault1TotalPower).toEqual(
        vpHistory.vaultDeactivation.vault1TotalPower,
      );

      // expect the vault2 VP to remain the same
      expect(vpInfo.vault2Power).toEqual(
        vpHistory.vaultDeactivation.vault2Power,
      );
      expect(vpInfo.vault2TotalPower).toEqual(
        vpHistory.vaultDeactivation.vault2TotalPower,
      );

      // expect the vault3 VP to remain the same
      expect(vpInfo.vault3Power).toEqual(
        vpHistory.vaultDeactivation.vault3Power,
      );
      expect(vpInfo.vault3TotalPower).toEqual(
        vpHistory.vaultDeactivation.vault3TotalPower,
      );

      // expect the registry VP to increase by added vault's power
      expect(vpInfo.votingRegistryPower).toEqual(
        vpHistory.vaultDeactivation.votingRegistryPower +
          vpHistory.vaultDeactivation.vault3Power,
      );
      expect(vpInfo.votingRegistryTotalPower).toEqual(
        vpHistory.vaultDeactivation.votingRegistryTotalPower +
          vpHistory.vaultDeactivation.vault3TotalPower,
      );
      vpHistory.vaultAdded = vpInfo;
    });

    test('activate vault', async () => {
      await activateVotingVault(neutronClient, votingRegistryAddr, vault2Addr);
      await waitBlocks(1, neutronClient);

      const votingVaults = await getVotingVaults(
        neutronClient,
        votingRegistryAddr,
      );
      expect(votingVaults.length).toBe(3);
      expect(votingVaults).toContainEqual({
        address: vault1Addr,
        description: NEUTRON_VAULT_1_CONTRACT_KEY,
        name: NEUTRON_VAULT_1_CONTRACT_KEY,
        state: 'Active',
      });
      expect(votingVaults).toContainEqual({
        address: vault2Addr,
        description: NEUTRON_VAULT_2_CONTRACT_KEY,
        name: NEUTRON_VAULT_2_CONTRACT_KEY,
        state: 'Active',
      });
      expect(votingVaults).toContainEqual({
        address: vault3Addr,
        description: NEUTRON_VAULT_3_CONTRACT_KEY,
        name: NEUTRON_VAULT_3_CONTRACT_KEY,
        state: 'Active',
      });
    });
    test('check voting power after activation', async () => {
      const vpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
      );

      // compare the new values to the prev state ones
      // expect the vault1 VP to remain the same
      expect(vpInfo.vault1Power).toEqual(vpHistory.vaultAdded.vault1Power);
      expect(vpInfo.vault1TotalPower).toEqual(
        vpHistory.vaultAdded.vault1TotalPower,
      );

      // expect the vault2 VP to remain the same
      expect(vpInfo.vault2Power).toEqual(vpHistory.vaultAdded.vault2Power);
      expect(vpInfo.vault2TotalPower).toEqual(
        vpHistory.vaultAdded.vault2TotalPower,
      );

      // expect the vault3 VP to remain the same
      expect(vpInfo.vault3Power).toEqual(vpHistory.vaultAdded.vault3Power);
      expect(vpInfo.vault3TotalPower).toEqual(
        vpHistory.vaultAdded.vault3TotalPower,
      );

      // expect the registry VP to increase by activated vault's power
      expect(vpInfo.votingRegistryPower).toEqual(
        vpHistory.vaultAdded.votingRegistryPower +
          vpHistory.vaultAdded.vault2Power,
      );
      expect(vpInfo.votingRegistryTotalPower).toEqual(
        vpHistory.vaultAdded.votingRegistryTotalPower +
          vpHistory.vaultAdded.vault2TotalPower,
      );
      vpHistory.vaultActivation = vpInfo;
    });

    // expect VP infos taken from heights in the past to be the same as they were at that points
    test('check historical voting power', async () => {
      const initVpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
        vpHistory.init.height,
      );
      expect(initVpInfo).toMatchObject(vpHistory.init);

      const atAdditionalBondingVpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
        vpHistory.additionalBonding.height,
      );
      expect(atAdditionalBondingVpInfo).toMatchObject(
        vpHistory.additionalBonding,
      );
      expect(atAdditionalBondingVpInfo.height).toBeGreaterThan(
        initVpInfo.height,
      );

      const atUnbondingVpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
        vpHistory.unbonding.height,
      );
      expect(atUnbondingVpInfo).toMatchObject(vpHistory.unbonding);
      expect(atUnbondingVpInfo.height).toBeGreaterThan(
        atAdditionalBondingVpInfo.height,
      );

      const atVaultDeactivationVpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
        vpHistory.vaultDeactivation.height,
      );
      expect(atVaultDeactivationVpInfo).toMatchObject(
        vpHistory.vaultDeactivation,
      );
      expect(atVaultDeactivationVpInfo.height).toBeGreaterThan(
        atUnbondingVpInfo.height,
      );

      const atVaultAddedVpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
        vpHistory.vaultAdded.height,
      );
      expect(atVaultAddedVpInfo).toMatchObject(vpHistory.vaultAdded);
      expect(atVaultAddedVpInfo.height).toBeGreaterThan(
        atVaultDeactivationVpInfo.height,
      );

      const atVaultActivationVpInfo = await getVotingPowerInfo(
        neutronClient,
        daoMemberWallet.address,
        contractAddresses,
        vpHistory.vaultActivation.height,
      );
      expect(atVaultActivationVpInfo).toMatchObject(vpHistory.vaultActivation);
      expect(atVaultActivationVpInfo.height).toBeGreaterThan(
        atVaultAddedVpInfo.height,
      );
    });
  });
});

const deployContracts = async (
  neutronClient: NeutronTestClient,
): Promise<Record<string, string>> => {
  const codeIds: Record<string, number> = {};
  for (const contract of [
    VOTING_REGISTRY_CONTRACT_KEY,
    NEUTRON_VAULT_CONTRACT_KEY,
  ]) {
    const codeId = await neutronClient.upload(CONTRACTS[contract]);
    expect(codeId).toBeGreaterThan(0);
    codeIds[contract] = codeId;
  }

  const contractAddresses: Record<string, string> = {};
  await deployNeutronVault(
    neutronClient,
    NEUTRON_VAULT_1_CONTRACT_KEY,
    codeIds,
    contractAddresses,
  );
  await deployNeutronVault(
    neutronClient,
    NEUTRON_VAULT_2_CONTRACT_KEY,
    codeIds,
    contractAddresses,
  );
  await deployVotingRegistry(
    neutronClient,
    [
      contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY],
      contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY],
    ],
    codeIds,
    contractAddresses,
  );

  // just deploy for later use
  await deployNeutronVault(
    neutronClient,
    NEUTRON_VAULT_3_CONTRACT_KEY,
    codeIds,
    contractAddresses,
  );
  return contractAddresses;
};

const deployVotingRegistry = async (
  instantiator: NeutronTestClient,
  vaults: string[],
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.instantiate(
    codeIds[VOTING_REGISTRY_CONTRACT_KEY],
    {
      owner: instantiator.sender,
      voting_vaults: vaults,
    },
    'voting_registry',
  );
  expect(res).toBeTruthy();
  contractAddresses[VOTING_REGISTRY_CONTRACT_KEY] = res;
};

const deployNeutronVault = async (
  client: NeutronTestClient,
  vaultKey: string,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await client.instantiate(
    codeIds[NEUTRON_VAULT_CONTRACT_KEY],
    {
      owner: client.sender,
      name: vaultKey,
      description: vaultKey,
      denom: NEUTRON_DENOM,
    },
    'neutron_vault',
  );
  expect(res).toBeTruthy();
  contractAddresses[vaultKey] = res;
};

const bondFunds = async (
  client: NeutronTestClient,
  vault: string,
  amount: string,
) =>
  client.execute(
    vault,
    {
      bond: {},
    },
    [{ denom: NEUTRON_DENOM, amount: amount }],
  );

const unbondFunds = async (
  client: NeutronTestClient,
  vault: string,
  amount: string,
) =>
  client.execute(
    vault,
    {
      unbond: { amount: amount },
    },
    [],
  );

const activateVotingVault = async (
  client: NeutronTestClient,
  registry: string,
  vault: string,
) =>
  client.execute(
    registry,
    {
      activate_voting_vault: {
        voting_vault_contract: vault,
      },
    },
    [],
  );

const deactivateVotingVault = async (
  client: NeutronTestClient,
  registry: string,
  vault: string,
) =>
  client.execute(
    registry,
    {
      deactivate_voting_vault: {
        voting_vault_contract: vault,
      },
    },
    [],
  );

const addVotingVault = async (
  client: NeutronTestClient,
  registry: string,
  vault: string,
) =>
  client.execute(
    registry,
    {
      add_voting_vault: {
        new_voting_vault_contract: vault,
      },
    },
    [],
  );

/**
 * Retrieves voting power data for a given address from both vaults and voting registry. Also
 * retrieves total voting powerdata  from the same contracts.
 */
const getVotingPowerInfo = async (
  client: NeutronTestClient,
  address: string,
  contractAddresses: Record<string, string>,
  height?: number,
): Promise<VotingPowerInfo> => {
  if (typeof height === 'undefined') {
    height = await client.getHeight();
  }
  const vault1Power = getVotingPowerAtHeight(
    client,
    contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY],
    address,
    height,
  );
  const vault1TotalPower = getTotalPowerAtHeight(
    client,
    contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY],
    height,
  );
  const vault2Power = getVotingPowerAtHeight(
    client,
    contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY],
    address,
    height,
  );
  const vault2TotalPower = getTotalPowerAtHeight(
    client,
    contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY],
    height,
  );
  const vault3Power = getVotingPowerAtHeight(
    client,
    contractAddresses[NEUTRON_VAULT_3_CONTRACT_KEY],
    address,
    height,
  );
  const vault3TotalPower = getTotalPowerAtHeight(
    client,
    contractAddresses[NEUTRON_VAULT_3_CONTRACT_KEY],
    height,
  );
  const registryPower = getVotingPowerAtHeight(
    client,
    contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
    address,
    height,
  );
  const registryTotalPower = getTotalPowerAtHeight(
    client,
    contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
    height,
  );

  return {
    height: height,
    vault1Power: +(await vault1Power).power,
    vault1TotalPower: +(await vault1TotalPower).power,
    vault2Power: +(await vault2Power).power,
    vault2TotalPower: +(await vault2TotalPower).power,
    vault3Power: +(await vault3Power).power,
    vault3TotalPower: +(await vault3TotalPower).power,
    votingRegistryPower: +(await registryPower).power,
    votingRegistryTotalPower: +(await registryTotalPower).power,
  };
};

const getTotalPowerAtHeight = async (
  client: NeutronTestClient,
  contract: string,
  height?: number,
): Promise<VotingPowerResponse> =>
  client.queryContractSmart(contract, {
    total_power_at_height:
      typeof height === 'undefined' ? {} : { height: height },
  });

const getVotingPowerAtHeight = async (
  chain: NeutronTestClient,
  contract: string,
  address: string,
  height?: number,
): Promise<VotingPowerResponse> =>
  chain.queryContractSmart(contract, {
    voting_power_at_height:
      typeof height === 'undefined'
        ? {
            address: address,
          }
        : {
            address: address,
            height: height,
          },
  });

const getVotingVaults = async (
  client: NeutronTestClient,
  registry: string,
  height?: number,
): Promise<VotingVault[]> =>
  client.queryContractSmart(registry, {
    voting_vaults: typeof height === 'undefined' ? {} : { height: height },
  });

type VotingPowerResponse = {
  power: string;
  height: number;
};

type VotingPowerInfo = {
  height: number;
  vault1Power: number;
  vault1TotalPower: number;
  vault2Power: number;
  vault2TotalPower: number;
  vault3Power: number;
  vault3TotalPower: number;
  votingRegistryPower: number;
  votingRegistryTotalPower: number;
};

/**
 * Contains voting power info for each important point in the test history. Used to make sure
 * historical voting power queries are correct. Fields are placed in order of their occurrence
 * in the test.
 */
type VotingPowerInfoHistory = {
  /** initial voting power info */
  init: VotingPowerInfo;
  /** voting power info after making an additional bonding */
  additionalBonding: VotingPowerInfo;
  /** voting power info after making a partial unbonding */
  unbonding: VotingPowerInfo;
  /** voting power info after a vault deactivation */
  vaultDeactivation: VotingPowerInfo;
  /** voting power info after vault addition */
  vaultAdded: VotingPowerInfo;
  /** voting power info after the deactivated vault activation */
  vaultActivation: VotingPowerInfo;
};

const initVotingPowerInfoHistory = (): VotingPowerInfoHistory => ({
  init: initVotingPowerInfo(),
  additionalBonding: initVotingPowerInfo(),
  unbonding: initVotingPowerInfo(),
  vaultDeactivation: initVotingPowerInfo(),
  vaultAdded: initVotingPowerInfo(),
  vaultActivation: initVotingPowerInfo(),
});

const initVotingPowerInfo = (): VotingPowerInfo => ({
  height: 0,
  vault1Power: 0,
  vault1TotalPower: 0,
  vault2Power: 0,
  vault2TotalPower: 0,
  vault3Power: 0,
  vault3TotalPower: 0,
  votingRegistryPower: 0,
  votingRegistryTotalPower: 0,
});

type VotingVault = {
  address: string;
  name: string;
  description: string;
  state: string;
};
