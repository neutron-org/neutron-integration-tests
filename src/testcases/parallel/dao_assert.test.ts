import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import { Wallet } from '../../types';
import {
  getDaoContracts,
  DaoContracts,
  getTreasuryContract,
} from '../../helpers/dao';
import { getContractsHashes } from '../../helpers/env';

describe('DAO / Check', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm_dao: CosmosWrapper;
  let dao_wallet: Wallet;
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
  let treasuryContract: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    dao_wallet = testState.wallets.qaNeutron.genQaWal1;

    cm_dao = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      dao_wallet,
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
    votingVaultsNtrnAddress =
      daoContracts.voting_module.voting_vaults.ntrn_vault.address;
    votingVaultsLockdropAddress =
      daoContracts.voting_module.voting_vaults.lockdrop_vault.address;
    treasuryContract = await getTreasuryContract(cm_dao);
  });

  describe('Checking the association of proposal & preproposal modules with the Dao', () => {
    test('Proposal dao single', async () => {
      await checkDaoAddress(cm_dao, proposalSingleAddress, daoContracts.core.address);
    });

    test('Preproposal dao single', async () => {
      await checkDaoAddress(cm_dao, preProposalSingleAddress, daoContracts.core.address);

      const propContract = await cm_dao.queryContract(preProposalSingleAddress, {
        proposal_module: {},
      });
      expect(propContract).toEqual(proposalSingleAddress);
    });

    test('Proposal dao multiple', async () => {
      await checkDaoAddress(cm_dao, proposalMultipleAddress, daoContracts.core.address);
    });

    test('Preproposal dao multiple', async () => {
      await checkDaoAddress(cm_dao, preProposalMultipleAddress, daoContracts.core.address);

      const propContract = await cm_dao.queryContract(preProposalMultipleAddress, {
        proposal_module: {},
      });
      expect(propContract).toEqual(proposalMultipleAddress);
    });

    test('Proposal dao overrule', async () => {
      await checkDaoAddress(cm_dao, proposalOverruleAddress, daoContracts.core.address);
    });

    test('Preproposal dao overrule', async () => {
      await checkDaoAddress(cm_dao, preProposalOverruleAddress, daoContracts.core.address);

      const propContract = await cm_dao.queryContract(preProposalOverruleAddress, {
        proposal_module: {},
      });
      expect(propContract).toEqual(proposalOverruleAddress);
    });
    test('Treasury is correct', async () => {
      const trasuryAddress = await getTreasuryContract(cm_dao);
      expect(trasuryAddress.length).toBeGreaterThan(0);
    });
  });

  describe('Checking the association of voting modules with the Dao', () => {
    let res;
    test('voting module', async () => {
      await checkDaoAddress(cm_dao, votingModuleAddress, daoContracts.core.address);
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
      await checkContractHash(cm_dao, proposalSingleAddress, 'proposalSingleAddress.wasm');
    });

    test('Dao proposal multiple hash assert', async () => {
      await checkContractHash(cm_dao, proposalMultipleAddress, 'cwd_proposal_multiple.wasm');
    });

    test('Dao preproposal single hash assert', async () => {
      await checkContractHash(cm_dao, preProposalSingleAddress, 'cwd_pre_propose_single.wasm');
    });

    test('Dao preproposal multiple hash assert', async () => {
      await checkContractHash(cm_dao, preProposalMultipleAddress, 'preProposalSingleAddress.wasm');
    });

    test('Dao core hash assert', async () => {
      await checkContractHash(cm_dao, daoContracts.core.address, 'cwd_core.wasm');
    });

    test('Dao proposal overrule hash assert', async () => {
      await checkContractHash(cm_dao, proposalOverruleAddress, 'cwd_proposal_single.wasm');
    });

    test('Dao preproposal overrule hash assert', async () => {
      await checkContractHash(cm_dao, preProposalOverruleAddress, 'cwd_pre_propose_overrule.wasm');
    });

    test('Treasury hash assert', async () => {
      await checkContractHash(cm_dao, treasuryContract, 'neutron_treasury.wasm');
    });
    test('Treasury hash assert', async () => {
      await checkContractHash(cm_dao, treasuryContract, 'neutron_treasury.wasm');
    });
    test('Dao neutron vauld hash assert', async () => {
      await checkContractHash(cm_dao, votingVaultsNtrnAddress, 'neutron_vault.wasm');
    });
    test('Dao lockdrop vauld hash assert', async () => {
      await checkContractHash(cm_dao, votingVaultsLockdropAddress, 'lockdrop_vault.wasm');
    });
  });
});

const checkContractHash = async(cm: CosmosWrapper, contractAddress: string, binaryName: string) => {
  const contractInfo = await cm.getContractInfo(contractAddress);
  const hashFromChain = (await cm.getCodeDataHash(contractInfo.contract_info.code_id)).toLowerCase();
  const hashFromBinary = (await getContractsHashes())[binaryName].toLowerCase();
  expect(hashFromChain).toEqual(hashFromBinary);
}

const checkDaoAddress = async(cm: CosmosWrapper, contractAddress: string, expectedDao: string) => {
  const daoFromContract = await cm.queryContract(contractAddress, {
    dao: {},
  });
  expect(daoFromContract).toEqual(expectedDao);
}
