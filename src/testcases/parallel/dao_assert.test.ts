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
  let cm_dao: CosmosWrapper;
  let daoContracts: DaoContracts;
  let proposalSingleAddress: string;
  let preProposalSingleAddress: string;
  let proposalMultipleAddress: string;
  let preProposalMultipleAddress: string;
  let proposalOverruleAddress: string;
  let preProposalOverruleAddress: string;
  let votingModuleAddress: string;
  let votingVaultsNtrnAddress: string;
  let votingVaultsLockdropAddress: string;
  let reserveContract: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();

    cm_dao = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    const daoCoreAddress = (await cm_dao.getChainAdmins())[0]; //add assert for some addresses
    daoContracts = await getDaoContracts(cm_dao, daoCoreAddress);
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
    votingVaultsLockdropAddress = (
      daoContracts.voting_module as VotingVaultsModule
    ).voting_vaults.lockdrop_vault.address;
    reserveContract = await getReserveContract(cm_dao);
  });

  describe('Checking the association of proposal & preproposal modules with the Dao', () => {
    test('Proposal dao single', async () => {
      await checkDaoAddress(
        cm_dao,
        proposalSingleAddress,
        daoContracts.core.address,
      );
    });

    test('Preproposal dao single', async () => {
      await checkDaoAddress(
        cm_dao,
        preProposalSingleAddress,
        daoContracts.core.address,
      );

      const propContract = await cm_dao.queryContract(
        preProposalSingleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalSingleAddress);
    });

    test('Proposal dao multiple', async () => {
      await checkDaoAddress(
        cm_dao,
        proposalMultipleAddress,
        daoContracts.core.address,
      );
    });

    test('Preproposal dao multiple', async () => {
      await checkDaoAddress(
        cm_dao,
        preProposalMultipleAddress,
        daoContracts.core.address,
      );

      const propContract = await cm_dao.queryContract(
        preProposalMultipleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalMultipleAddress);
    });

    test('Proposal dao overrule', async () => {
      await checkDaoAddress(
        cm_dao,
        proposalOverruleAddress,
        daoContracts.core.address,
      );
    });

    test('Preproposal dao overrule', async () => {
      await checkDaoAddress(
        cm_dao,
        preProposalOverruleAddress,
        daoContracts.core.address,
      );

      const propContract = await cm_dao.queryContract(
        preProposalOverruleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalOverruleAddress);
    });
    test('Reserve is correct', async () => {
      const reserveAddress = await getReserveContract(cm_dao);
      expect(reserveAddress.length).toBeGreaterThan(0);
    });
  });

  describe('Checking the association of voting modules with the Dao', () => {
    let res;
    test('voting module', async () => {
      await checkDaoAddress(
        cm_dao,
        votingModuleAddress,
        daoContracts.core.address,
      );
    });

    test('voting ntrn vaults', async () => {
      res = await cm_dao.getContractInfo(votingVaultsNtrnAddress);
      expect(res.contract_info.admin).toEqual(daoContracts.core.address);
    });

    test('voting lockdrop vaults', async () => {
      res = await cm_dao.getContractInfo(votingVaultsLockdropAddress);
      expect(res.contract_info.admin).toEqual(daoContracts.core.address);
    });

    test('Dao is the admin of himself', async () => {
      res = await cm_dao.getContractInfo(daoContracts.core.address);
      expect(res.contract_info.admin).toEqual(daoContracts.core.address);
    });
  });

  describe('Checking the validity of binary files', () => {
    test('Dao proposal single hash assert', async () => {
      await checkContractHash(
        cm_dao,
        proposalSingleAddress,
        NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao proposal multiple hash assert', async () => {
      await checkContractHash(
        cm_dao,
        proposalMultipleAddress,
        NeutronContract.DAO_PROPOSAL_MULTI,
      );
    });

    test('Dao preproposal single hash assert', async () => {
      await checkContractHash(
        cm_dao,
        preProposalSingleAddress,
        NeutronContract.DAO_PREPROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal multiple hash assert', async () => {
      await checkContractHash(
        cm_dao,
        preProposalMultipleAddress,
        NeutronContract.DAO_PREPROPOSAL_MULTI,
      );
    });

    test('Dao core hash assert', async () => {
      await checkContractHash(
        cm_dao,
        daoContracts.core.address,
        NeutronContract.DAO_CORE,
      );
    });

    test('Dao proposal overrule hash assert', async () => {
      await checkContractHash(
        cm_dao,
        proposalOverruleAddress,
        NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal overrule hash assert', async () => {
      await checkContractHash(
        cm_dao,
        preProposalOverruleAddress,
        NeutronContract.DAO_PREPROPOSAL_OVERRULE,
      );
    });

    test('Reserve hash assert', async () => {
      await checkContractHash(cm_dao, reserveContract, NeutronContract.RESERVE);
    });
    test('Dao neutron vault hash assert', async () => {
      await checkContractHash(
        cm_dao,
        votingVaultsNtrnAddress,
        NeutronContract.NEUTRON_VAULT,
      );
    });
    test('Dao lockdrop vault hash assert', async () => {
      await checkContractHash(
        cm_dao,
        votingVaultsLockdropAddress,
        NeutronContract.LOCKDROP_VAULT,
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
