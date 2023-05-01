import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import {
  getDaoContracts,
  DaoContracts,
  VotingVaultsModule,
  getTreasuryContract,
} from '../../helpers/dao';
import { getContractsHashes } from '../../helpers/env';
import { NeutronContract } from '../../helpers/types';

describe('DAO / Check', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let daoContracts: DaoContracts;
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
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();

    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0]; //add assert for some addresses
    daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
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
    votingVaultsNtrnAddress = (daoContracts.voting as VotingVaultsModule).vaults
      .neutron.address;
    treasuryContract = await getTreasuryContract(neutronChain);
    console.log(JSON.stringify(daoContracts));
  });

  describe('Checking the association of proposal & preproposal modules with the Dao', () => {
    test('Proposal dao single', async () => {
      await checkDaoAddress(
        neutronChain,
        proposalSingleAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, proposalSingleAddress);
    });

    test('Preproposal dao single', async () => {
      await checkDaoAddress(
        neutronChain,
        preProposalSingleAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, preProposalSingleAddress);

      const propContract = await neutronChain.queryContract(
        preProposalSingleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalSingleAddress);
    });

    test('Proposal dao multiple', async () => {
      await checkDaoAddress(
        neutronChain,
        proposalMultipleAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, proposalMultipleAddress);
    });

    test('Preproposal dao multiple', async () => {
      await checkDaoAddress(
        neutronChain,
        preProposalMultipleAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, preProposalMultipleAddress);

      const propContract = await neutronChain.queryContract(
        preProposalMultipleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalMultipleAddress);
    });

    test('Proposal dao overrule', async () => {
      await checkDaoAddress(
        neutronChain,
        proposalOverruleAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, proposalOverruleAddress);
    });

    test('Preproposal dao overrule', async () => {
      await checkDaoAddress(
        neutronChain,
        preProposalOverruleAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, preProposalOverruleAddress);

      const propContract = await neutronChain.queryContract(
        preProposalOverruleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalOverruleAddress);
    });
    test('Treasury is correct', async () => {
      const treasuryAddress = await getTreasuryContract(neutronChain);
      expect(treasuryAddress.length).toBeGreaterThan(0);
    });
  });

  describe('Checking the association of voting modules with the Dao', () => {
    let res;
    test('voting module', async () => {
      await checkDaoAddress(
        neutronChain,
        votingModuleAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, votingModuleAddress);
    });

    test('Neutron voting vault', async () => {
      res = await neutronChain.getContractInfo(votingVaultsNtrnAddress);
      expect(res.contract_info.admin).toEqual(daoContracts.core.address);
      await verifyLabel(neutronChain, daoContracts, votingVaultsNtrnAddress);
    });

    test('Dao is the admin of himself', async () => {
      res = await neutronChain.getContractInfo(daoContracts.core.address);
      expect(res.contract_info.admin).toEqual(daoContracts.core.address);
      await verifyLabel(neutronChain, daoContracts, daoContracts.core.address);
    });
  });

  describe('Checking the validity of binary files', () => {
    test('Dao proposal single hash assert', async () => {
      await checkContractHash(
        neutronChain,
        proposalSingleAddress,
        NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao proposal multiple hash assert', async () => {
      await checkContractHash(
        neutronChain,
        proposalMultipleAddress,
        NeutronContract.DAO_PROPOSAL_MULTI,
      );
    });

    test('Dao preproposal single hash assert', async () => {
      await checkContractHash(
        neutronChain,
        preProposalSingleAddress,
        NeutronContract.DAO_PREPROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal multiple hash assert', async () => {
      await checkContractHash(
        neutronChain,
        preProposalMultipleAddress,
        NeutronContract.DAO_PREPROPOSAL_MULTI,
      );
    });

    test('Dao core hash assert', async () => {
      await checkContractHash(
        neutronChain,
        daoContracts.core.address,
        NeutronContract.DAO_CORE,
      );
    });

    test('Dao proposal overrule hash assert', async () => {
      await checkContractHash(
        neutronChain,
        proposalOverruleAddress,
        NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal overrule hash assert', async () => {
      await checkContractHash(
        neutronChain,
        preProposalOverruleAddress,
        NeutronContract.DAO_PREPROPOSAL_OVERRULE,
      );
    });

    test('Treasury hash assert', async () => {
      await checkContractHash(
        neutronChain,
        treasuryContract,
        NeutronContract.TREASURY,
      );
    });
    test('Dao neutron vault hash assert', async () => {
      await checkContractHash(
        neutronChain,
        votingVaultsNtrnAddress,
        NeutronContract.NEUTRON_VAULT,
      );
    });
  });
});

const checkContractHash = async (
  cm: CosmosWrapper,
  contractAddress: string,
  binaryName: string,
) => {
  const contractInfo = await cm.getContractInfo(contractAddress);
  const hashFromChain = (
    await cm.getCodeDataHash(contractInfo.contract_info.code_id)
  ).toLowerCase();
  const hashFromBinary = (await getContractsHashes())[binaryName].toLowerCase();
  expect(hashFromChain).toEqual(hashFromBinary);
};

const checkDaoAddress = async (
  cm: CosmosWrapper,
  contractAddress: string,
  expectedDao: string,
) => {
  const daoFromContract = await cm.queryContract(contractAddress, {
    dao: {},
  });
  expect(daoFromContract).toEqual(expectedDao);
};

const verifyLabel = async (
  neutronChain: CosmosWrapper,
  daoContracts: DaoContracts,
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
