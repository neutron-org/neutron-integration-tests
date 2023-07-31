import {
  cosmosWrapper,
  dao,
  env,
  NEUTRON_DENOM,
  TestStateLocalCosmosTestNet,
  types,
} from 'neutronjs';

const config = require('../../config.json');

describe('DAO / Check', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: cosmosWrapper.CosmosWrapper;
  let daoContracts: dao.DaoContracts;
  let proposalSingleAddress: string;
  let preProposalSingleAddress: string;
  let proposalMultipleAddress: string;
  let preProposalMultipleAddress: string;
  let proposalOverruleAddress: string;
  let preProposalOverruleAddress: string;
  let votingModuleAddress: string;
  let votingVaultsNtrnAddress: string;
  let treasuryContract: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();

    neutronChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0]; //add assert for some addresses
    daoContracts = await dao.getDaoContracts(neutronChain, daoCoreAddress);
    proposalSingleAddress = daoContracts.proposals.single.address;
    preProposalSingleAddress =
      daoContracts.proposals.single.pre_propose.address;
    proposalMultipleAddress = daoContracts.proposals.multiple.address;
    preProposalMultipleAddress =
      daoContracts.proposals.multiple.pre_propose.address;
    proposalOverruleAddress = daoContracts.proposals.overrule.address;
    preProposalOverruleAddress =
      daoContracts.proposals.overrule.pre_propose.address;
    votingModuleAddress = daoContracts.voting.address;
    votingVaultsNtrnAddress = (daoContracts.voting as dao.VotingVaultsModule)
      .vaults.neutron.address;
    treasuryContract = await dao.getTreasuryContract(neutronChain);
  });

  describe('Checking the association of proposal & preproposal modules with the Dao', () => {
    test('Proposal dao single', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        proposalSingleAddress,
      );
    });

    test('Preproposal dao single', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        preProposalSingleAddress,
      );

      const propContract = await neutronChain.queryContract(
        preProposalSingleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalSingleAddress);
    });

    test('Proposal dao multiple', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        proposalMultipleAddress,
      );
    });

    test('Preproposal dao multiple', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        preProposalMultipleAddress,
      );

      const propContract = await neutronChain.queryContract(
        preProposalMultipleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalMultipleAddress);
    });

    test('Proposal dao overrule', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        proposalOverruleAddress,
      );
    });

    test('Preproposal dao overrule', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        preProposalOverruleAddress,
      );

      const propContract = await neutronChain.queryContract(
        preProposalOverruleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalOverruleAddress);
    });
    test('Treasury is correct', async () => {
      const treasuryAddress = await dao.getTreasuryContract(neutronChain);
      expect(treasuryAddress.length).toBeGreaterThan(0);
    });
  });

  describe('Checking the association of voting modules with the Dao', () => {
    test('voting module', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        votingModuleAddress,
      );
    });

    test('Neutron voting vault', async () => {
      await verifyAdmin(
        neutronChain,
        votingVaultsNtrnAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, votingVaultsNtrnAddress);
    });

    test('Dao is the admin of himself', async () => {
      await verifyAdmin(
        neutronChain,
        daoContracts.core.address,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, daoContracts.core.address);
    });
  });

  describe('Checking the validity of binary files', () => {
    test('Dao proposal single hash assert', async () => {
      await checkContractHash(
        neutronChain,
        proposalSingleAddress,
        types.NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao proposal multiple hash assert', async () => {
      await checkContractHash(
        neutronChain,
        proposalMultipleAddress,
        types.NeutronContract.DAO_PROPOSAL_MULTI,
      );
    });

    test('Dao preproposal single hash assert', async () => {
      await checkContractHash(
        neutronChain,
        preProposalSingleAddress,
        types.NeutronContract.DAO_PREPROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal multiple hash assert', async () => {
      await checkContractHash(
        neutronChain,
        preProposalMultipleAddress,
        types.NeutronContract.DAO_PREPROPOSAL_MULTI,
      );
    });

    test('Dao core hash assert', async () => {
      await checkContractHash(
        neutronChain,
        daoContracts.core.address,
        types.NeutronContract.DAO_CORE,
      );
    });

    test('Dao proposal overrule hash assert', async () => {
      await checkContractHash(
        neutronChain,
        proposalOverruleAddress,
        types.NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal overrule hash assert', async () => {
      await checkContractHash(
        neutronChain,
        preProposalOverruleAddress,
        types.NeutronContract.DAO_PREPROPOSAL_OVERRULE,
      );
    });

    test('Treasury hash assert', async () => {
      await checkContractHash(
        neutronChain,
        treasuryContract,
        types.NeutronContract.DAO_CORE,
      );
    });
    test('Dao neutron vault hash assert', async () => {
      await checkContractHash(
        neutronChain,
        votingVaultsNtrnAddress,
        types.NeutronContract.NEUTRON_VAULT,
      );
    });
  });

  describe('Test subdaos', () => {
    test('Check subdaos contracts admins and labels', async () => {
      for (const subdaoIndex in daoContracts.subdaos) {
        const sudao = daoContracts.subdaos[subdaoIndex];
        const contractsList = [
          sudao.core.address,
          sudao.proposals.single.address,
          sudao.proposals.single.pre_propose.address,
          sudao.voting.address,
          // (sudao.voting as VotingCw4Module).cw4group.address, //  todo fix this
        ];
        if (sudao.proposals.single.pre_propose.timelock) {
          contractsList.push(
            sudao.proposals.single.pre_propose.timelock.address,
          );
        }
        for (const contractAddress of contractsList) {
          await verifyAdmin(
            neutronChain,
            contractAddress,
            daoContracts.core.address,
          );
          await verifyLabel(neutronChain, daoContracts, contractAddress);
        }
      }
    });
  });
});

const performCommonChecks = async (
  netronChain: cosmosWrapper.CosmosWrapper,
  daoContracts: dao.DaoContracts,
  contractAddress: string,
) => {
  await checkDaoAddress(
    netronChain,
    contractAddress,
    daoContracts.core.address,
  );
  await verifyAdmin(netronChain, contractAddress, daoContracts.core.address);
  await verifyLabel(netronChain, daoContracts, contractAddress);
};

const verifyAdmin = async (
  neutronChain: cosmosWrapper.CosmosWrapper,
  contractAddress: string,
  expectedAdmin: string,
) => {
  const res = await neutronChain.getContractInfo(contractAddress);
  expect(res.contract_info.admin).toEqual(expectedAdmin);
};

const checkContractHash = async (
  cm: cosmosWrapper.CosmosWrapper,
  contractAddress: string,
  binaryName: string,
) => {
  const contractInfo = await cm.getContractInfo(contractAddress);
  const hashFromChain = (
    await cm.getCodeDataHash(contractInfo.contract_info.code_id)
  ).toLowerCase();
  const hashFromBinary = (await env.getContractsHashes())[
    binaryName
  ].toLowerCase();
  expect(hashFromChain).toEqual(hashFromBinary);
};

const checkDaoAddress = async (
  cm: cosmosWrapper.CosmosWrapper,
  contractAddress: string,
  expectedDao: string,
) => {
  const daoFromContract = await cm.queryContract(contractAddress, {
    dao: {},
  });
  expect(daoFromContract).toEqual(expectedDao);
};

const verifyLabel = async (
  neutronChain: cosmosWrapper.CosmosWrapper,
  daoContracts: dao.DaoContracts,
  address: string,
) => {
  const label = (await neutronChain.getContractInfo(address))['contract_info'][
    'label'
  ];
  const path = label.split('.');
  expect(path.length).toBeGreaterThan(1);
  expect(path[0]).toEqual('neutron');
  let current = daoContracts;
  for (const i of path.slice(1)) {
    current = current[i];
    expect(current).toBeDefined();
  }
  expect(current['address']).toEqual(address);
};
