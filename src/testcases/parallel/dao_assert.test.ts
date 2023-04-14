import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import {
  getDaoContracts,
  DaoContracts,
  getReserveContract,
  VotingVaultsModule,
} from '../../helpers/dao';
import { getContractsHashes } from '../../helpers/env';
import { NeutronContract } from '../../helpers/types';

describe('DAO / Check', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cmDao: CosmosWrapper;
  let daoContracts: DaoContracts;
  let proposalSingleAddress: string;
  let preProposalSingleAddress: string;
  let proposalMultipleAddress: string;
  let preProposalMultipleAddress: string;
  let proposalOverruleAddress: string;
  let preProposalOverruleAddress: string;
  let votingModuleAddress: string;
  let votingVaultsNtrnAddress: string;
  let reserveContract: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();

    cmDao = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    const daoCoreAddress = (await cmDao.getChainAdmins())[0]; //add assert for some addresses
    daoContracts = await getDaoContracts(cmDao, daoCoreAddress);
    proposalSingleAddress = daoContracts.proposal_modules.single.address;
    preProposalSingleAddress =
      daoContracts.proposal_modules.single.pre_proposal_module.address;
    proposalMultipleAddress = daoContracts.proposal_modules.multiple.address;
    preProposalMultipleAddress =
      daoContracts.proposal_modules.multiple.pre_proposal_module.address;
    proposalOverruleAddress = daoContracts.proposal_modules.overrule.address;
    preProposalOverruleAddress =
      daoContracts.proposal_modules.overrule.pre_proposal_module.address;
    votingModuleAddress = daoContracts.voting_module.address;
    votingVaultsNtrnAddress = (daoContracts.voting_module as VotingVaultsModule)
      .voting_vaults.ntrn_vault.address;
    reserveContract = await getReserveContract(cmDao);
  });

  describe('Checking the association of proposal & preproposal modules with the Dao', () => {
    test('Proposal dao single', async () => {
      await checkDaoAddress(
        cmDao,
        proposalSingleAddress,
        daoContracts.core.address,
      );
    });

    test('Preproposal dao single', async () => {
      await checkDaoAddress(
        cmDao,
        preProposalSingleAddress,
        daoContracts.core.address,
      );

      const propContract = await cmDao.queryContract(preProposalSingleAddress, {
        proposal_module: {},
      });
      expect(propContract).toEqual(proposalSingleAddress);
    });

    test('Proposal dao multiple', async () => {
      await checkDaoAddress(
        cmDao,
        proposalMultipleAddress,
        daoContracts.core.address,
      );
    });

    test('Preproposal dao multiple', async () => {
      await checkDaoAddress(
        cmDao,
        preProposalMultipleAddress,
        daoContracts.core.address,
      );

      const propContract = await cmDao.queryContract(
        preProposalMultipleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalMultipleAddress);
    });

    test('Proposal dao overrule', async () => {
      await checkDaoAddress(
        cmDao,
        proposalOverruleAddress,
        daoContracts.core.address,
      );
    });

    test('Preproposal dao overrule', async () => {
      await checkDaoAddress(
        cmDao,
        preProposalOverruleAddress,
        daoContracts.core.address,
      );

      const propContract = await cmDao.queryContract(
        preProposalOverruleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalOverruleAddress);
    });
    test('Reserve is correct', async () => {
      const reserveAddress = await getReserveContract(cmDao);
      expect(reserveAddress.length).toBeGreaterThan(0);
    });
  });

  describe('Checking the association of voting modules with the Dao', () => {
    let res;
    test('voting module', async () => {
      await checkDaoAddress(
        cmDao,
        votingModuleAddress,
        daoContracts.core.address,
      );
    });

    test('voting ntrn vaults', async () => {
      res = await cmDao.getContractInfo(votingVaultsNtrnAddress);
      expect(res.contract_info.admin).toEqual(daoContracts.core.address);
    });

    test('Dao is the admin of himself', async () => {
      res = await cmDao.getContractInfo(daoContracts.core.address);
      expect(res.contract_info.admin).toEqual(daoContracts.core.address);
    });
  });

  describe('Checking the validity of binary files', () => {
    test('Dao proposal single hash assert', async () => {
      await checkContractHash(
        cmDao,
        proposalSingleAddress,
        NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao proposal multiple hash assert', async () => {
      await checkContractHash(
        cmDao,
        proposalMultipleAddress,
        NeutronContract.DAO_PROPOSAL_MULTI,
      );
    });

    test('Dao preproposal single hash assert', async () => {
      await checkContractHash(
        cmDao,
        preProposalSingleAddress,
        NeutronContract.DAO_PREPROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal multiple hash assert', async () => {
      await checkContractHash(
        cmDao,
        preProposalMultipleAddress,
        NeutronContract.DAO_PREPROPOSAL_MULTI,
      );
    });

    test('Dao core hash assert', async () => {
      await checkContractHash(
        cmDao,
        daoContracts.core.address,
        NeutronContract.DAO_CORE,
      );
    });

    test('Dao proposal overrule hash assert', async () => {
      await checkContractHash(
        cmDao,
        proposalOverruleAddress,
        NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal overrule hash assert', async () => {
      await checkContractHash(
        cmDao,
        preProposalOverruleAddress,
        NeutronContract.DAO_PREPROPOSAL_OVERRULE,
      );
    });

    test('Reserve hash assert', async () => {
      await checkContractHash(cmDao, reserveContract, NeutronContract.RESERVE);
    });
    test('Dao neutron vault hash assert', async () => {
      await checkContractHash(
        cmDao,
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
