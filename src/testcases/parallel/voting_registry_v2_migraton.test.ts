import {
  NeutronContract,
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from '../../helpers/types';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { getHeight } from '../../helpers/wait';

// general contract keys used across the tests
const VOTING_REGISTRY_V2_CONTRACT_KEY = 'VOTING_REGISTRY';
const VOTING_REGISTRY_CONTRACT_KEY = 'VOTING_REGISTRY_CURRENT';
const NEUTRON_VAULT_CONTRACT_KEY = 'NEUTRON_VAULT';

// specific contract keys used across the tests
const NEUTRON_VAULT_1_CONTRACT_KEY = 'NEUTRON_VAULT_1';
const NEUTRON_VAULT_2_CONTRACT_KEY = 'NEUTRON_VAULT_2';

const NEUTRON_VAULT_1_NAME = 'Neutron vault 1';
const NEUTRON_VAULT_1_DESC = 'Neutron vault 1 description';
const NEUTRON_VAULT_2_NAME = 'Neutron vault 2';
const NEUTRON_VAULT_2_DESC = 'Neutron vault 2 description';

const NEUTRON_VAULT_1_BOND_AMOUNT = 100000;
const NEUTRON_VAULT_2_BOND_AMOUNT = 60000;

describe('Neutron / Voting registry migration', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let contractAddresses: Record<string, string> = {};
  let codeIds: Record<string, number>;
  let cmInstantiator: WalletWrapper;
  let cmDaoMember: WalletWrapper;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    cmInstantiator = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    cmDaoMember = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.genQaWal1,
    );
  });

  let preMigrationVpQueryHeight: number;
  describe('prepare env to migration', () => {
    test('deploy contracts', async () => {
      const deployResp = await deployContracts(cmInstantiator);
      contractAddresses = deployResp.contractAddresses;
      codeIds = deployResp.codeIds;
    });
    test('accrue voting power', async () => {
      await cmDaoMember.executeContract(
        contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY],
        JSON.stringify({
          bond: {},
        }),
        [
          {
            denom: NEUTRON_DENOM,
            amount: NEUTRON_VAULT_1_BOND_AMOUNT.toString(),
          },
        ],
      );
      await cmDaoMember.executeContract(
        contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY],
        JSON.stringify({
          bond: {},
        }),
        [
          {
            denom: NEUTRON_DENOM,
            amount: NEUTRON_VAULT_2_BOND_AMOUNT.toString(),
          },
        ],
      );
      await neutronChain.blockWaiter.waitBlocks(1);
      preMigrationVpQueryHeight = await getHeight(neutronChain.sdk);

      expect(
        await queryOldVotingRegistryConfig(
          neutronChain,
          contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
        ),
      ).toMatchObject({
        owner: cmInstantiator.wallet.address.toString(),
        voting_vaults: [
          contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY],
          contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY],
        ],
      });
      expect(
        +(
          await queryVotingPower(
            neutronChain,
            contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
            cmDaoMember.wallet.address.toString(),
          )
        ).power,
      ).toBe(NEUTRON_VAULT_1_BOND_AMOUNT + NEUTRON_VAULT_2_BOND_AMOUNT);
      expect(
        +(
          await queryTotalVotingPower(
            neutronChain,
            contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
          )
        ).power,
      ).toBe(NEUTRON_VAULT_1_BOND_AMOUNT + NEUTRON_VAULT_2_BOND_AMOUNT);
    });
  });

  describe('migrate voting registry contract', () => {
    test('execute migration', async () => {
      const res = await cmInstantiator.migrateContract(
        contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
        codeIds[VOTING_REGISTRY_V2_CONTRACT_KEY],
        JSON.stringify({}),
      );
      expect(res.code).toBe(0);
    });
    test('check state after migration', async () => {
      expect(
        await queryNewVotingRegistryConfig(
          neutronChain,
          contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
        ),
      ).toMatchObject({
        owner: cmInstantiator.wallet.address.toString(),
      });

      expect(
        await queryNewVotingRegistryVaults(
          neutronChain,
          contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
        ),
      ).toEqual([
        {
          address: contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY],
          name: NEUTRON_VAULT_1_NAME,
          description: NEUTRON_VAULT_1_DESC,
          state: 'Active',
        },
        {
          address: contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY],
          name: NEUTRON_VAULT_2_NAME,
          description: NEUTRON_VAULT_2_DESC,
          state: 'Active',
        },
      ]);

      expect(
        await queryNewVotingRegistryVaults(
          neutronChain,
          contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
          2, // beginning of the chain +1
        ),
      ).toEqual([
        {
          address: contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY],
          name: NEUTRON_VAULT_1_NAME,
          description: NEUTRON_VAULT_1_DESC,
          state: 'Active',
        },
        {
          address: contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY],
          name: NEUTRON_VAULT_2_NAME,
          description: NEUTRON_VAULT_2_DESC,
          state: 'Active',
        },
      ]);
    });
  });

  describe('check voting power after migration', () => {
    describe('current voting power', () => {
      test('mutate voting power', async () => {
        await cmDaoMember.executeContract(
          contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY],
          JSON.stringify({
            unbond: { amount: NEUTRON_VAULT_1_BOND_AMOUNT.toString() },
          }),
        );
        await neutronChain.blockWaiter.waitBlocks(1);
      });
      test('check voting power mutation', async () => {
        const currentHeigt = await getHeight(neutronChain.sdk);

        const vp = await queryVotingPower(
          neutronChain,
          contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
          cmDaoMember.wallet.address.toString(),
        );
        expect(+vp.height).toBeGreaterThanOrEqual(currentHeigt);
        expect(+vp.power).toEqual(NEUTRON_VAULT_2_BOND_AMOUNT);

        const total_vp = await queryTotalVotingPower(
          neutronChain,
          contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
        );
        expect(+total_vp.height).toBeGreaterThanOrEqual(currentHeigt);
        expect(+total_vp.power).toEqual(NEUTRON_VAULT_2_BOND_AMOUNT);
      });
    });

    describe('historical voting power', () => {
      test('voting power before migration', async () => {
        const vp = await queryVotingPower(
          neutronChain,
          contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
          cmDaoMember.wallet.address.toString(),
          preMigrationVpQueryHeight,
        );
        expect(+vp.height).toEqual(preMigrationVpQueryHeight);
        expect(+vp.power).toEqual(
          NEUTRON_VAULT_1_BOND_AMOUNT + NEUTRON_VAULT_2_BOND_AMOUNT,
        );

        const total_vp = await queryTotalVotingPower(
          neutronChain,
          contractAddresses[VOTING_REGISTRY_CONTRACT_KEY],
          preMigrationVpQueryHeight,
        );
        expect(+total_vp.height).toEqual(preMigrationVpQueryHeight);
        expect(+total_vp.power).toEqual(
          NEUTRON_VAULT_1_BOND_AMOUNT + NEUTRON_VAULT_2_BOND_AMOUNT,
        );
      });
    });
  });
});

const deployContracts = async (
  instantiator: WalletWrapper,
): Promise<{
  contractAddresses: Record<string, string>;
  codeIds: Record<string, number>;
}> => {
  const codeIds: Record<string, number> = {};
  for (const contract of [
    VOTING_REGISTRY_V2_CONTRACT_KEY,
    VOTING_REGISTRY_CONTRACT_KEY,
    NEUTRON_VAULT_CONTRACT_KEY,
  ]) {
    const codeId = await instantiator.storeWasm(NeutronContract[contract]);
    expect(codeId).toBeGreaterThan(0);
    codeIds[contract] = codeId;
  }

  const contractAddresses: Record<string, string> = {};
  await deployVotingVault1(instantiator, codeIds, contractAddresses);
  await deployVotingVault2(instantiator, codeIds, contractAddresses);
  await deployVotingRegistry(
    instantiator,
    [
      contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY],
      contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY],
    ],
    codeIds,
    contractAddresses,
  );
  return { contractAddresses, codeIds };
};

const deployVotingVault1 = async (
  instantiator: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.instantiateContract(
    codeIds[NEUTRON_VAULT_CONTRACT_KEY],
    JSON.stringify({
      name: NEUTRON_VAULT_1_NAME,
      description: NEUTRON_VAULT_1_DESC,
      owner: instantiator.wallet.address.toString(),
      denom: NEUTRON_DENOM,
    }),
    'voting_vault_1',
  );
  expect(res).toBeTruthy();
  contractAddresses[NEUTRON_VAULT_1_CONTRACT_KEY] = res[0]._contract_address;
};

const deployVotingVault2 = async (
  instantiator: WalletWrapper,
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.instantiateContract(
    codeIds[NEUTRON_VAULT_CONTRACT_KEY],
    JSON.stringify({
      name: NEUTRON_VAULT_2_NAME,
      description: NEUTRON_VAULT_2_DESC,
      owner: instantiator.wallet.address.toString(),
      denom: NEUTRON_DENOM,
    }),
    'voting_vault_2',
  );
  expect(res).toBeTruthy();
  contractAddresses[NEUTRON_VAULT_2_CONTRACT_KEY] = res[0]._contract_address;
};

const deployVotingRegistry = async (
  instantiator: WalletWrapper,
  vaults: string[],
  codeIds: Record<string, number>,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.instantiateContract(
    codeIds[VOTING_REGISTRY_CONTRACT_KEY],
    JSON.stringify({
      owner: instantiator.wallet.address.toString(),
      voting_vaults: vaults,
    }),
    'voting_registry',
  );
  expect(res).toBeTruthy();
  contractAddresses[VOTING_REGISTRY_CONTRACT_KEY] = res[0]._contract_address;
};

const queryTotalVotingPower = (
  chain: CosmosWrapper,
  registry: string,
  height?: number,
): Promise<TotalPowerAtHeightResponse> => {
  if (typeof height !== 'undefined') {
    return chain.queryContract<TotalPowerAtHeightResponse>(registry, {
      total_power_at_height: {
        height: height,
      },
    });
  } else {
    return chain.queryContract<TotalPowerAtHeightResponse>(registry, {
      total_power_at_height: {},
    });
  }
};

const queryVotingPower = (
  chain: CosmosWrapper,
  registry: string,
  member: string,
  height?: number,
): Promise<VotingPowerAtHeightResponse> => {
  if (typeof height !== 'undefined') {
    return chain.queryContract<VotingPowerAtHeightResponse>(registry, {
      voting_power_at_height: {
        address: member,
        height: height,
      },
    });
  } else {
    return chain.queryContract<VotingPowerAtHeightResponse>(registry, {
      voting_power_at_height: {
        address: member,
      },
    });
  }
};

const queryOldVotingRegistryConfig = (
  chain: CosmosWrapper,
  registry: string,
): Promise<OldVotingRegistryConfig> =>
  chain.queryContract<OldVotingRegistryConfig>(registry, {
    config: {},
  });

const queryNewVotingRegistryConfig = (
  chain: CosmosWrapper,
  registry: string,
): Promise<NewVotingRegistryConfig> =>
  chain.queryContract<NewVotingRegistryConfig>(registry, {
    config: {},
  });

const queryNewVotingRegistryVaults = (
  chain: CosmosWrapper,
  registry: string,
  height?: number,
): Promise<VotingVault[]> => {
  if (typeof height !== 'undefined') {
    return chain.queryContract<VotingVault[]>(registry, {
      voting_vaults: { height: height },
    });
  } else {
    return chain.queryContract<VotingVault[]>(registry, {
      voting_vaults: {},
    });
  }
};

type OldVotingRegistryConfig = {
  owner: string;
  voting_vaults: string[];
};

type NewVotingRegistryConfig = {
  owner: string;
};

type VotingVault = {
  address: string;
  name: string;
  description: string;
  state: string;
};
