import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import { Wallet } from '../../types';
import {
  getDaoContracts,
  DaoContracts,
  getTreasuryContract,
} from '../../helpers/dao';
import { getContractsHashes, fetchDataHash } from '../../helpers/env';

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
    let res, preRes;
    test('Proposal dao single', async () => {
      res = await cm_dao.queryContract(proposalSingleAddress, {
        dao: {},
      });
      expect(res).toEqual(daoContracts.core.address);
    });

    test('Preproposal dao single', async () => {
      preRes = await cm_dao.queryContract(preProposalSingleAddress, {
        proposal_module: {},
      });
      const res = await cm_dao.queryContract(preProposalSingleAddress, {
        dao: {},
      });
      expect(preRes).toEqual(proposalSingleAddress);
      expect(res).toEqual(daoContracts.core.address);
    });

    test('Proposal dao multiple', async () => {
      res = await cm_dao.queryContract(proposalMultipleAddress, {
        dao: {},
      });
      expect(res).toEqual(daoContracts.core.address);
    });

    test('Preproposal dao multiple', async () => {
      preRes = await cm_dao.queryContract(preProposalMultipleAddress, {
        proposal_module: {},
      });
      res = await cm_dao.queryContract(preProposalMultipleAddress, {
        dao: {},
      });
      expect(preRes).toEqual(proposalMultipleAddress);
      expect(res).toEqual(daoContracts.core.address);
    });

    test('Proposal dao overrule', async () => {
      res = await cm_dao.queryContract(proposalOverruleAddress, {
        dao: {},
      });
      expect(res).toEqual(daoContracts.core.address);
    });

    test('Preproposal dao overrule', async () => {
      preRes = await cm_dao.queryContract(preProposalOverruleAddress, {
        proposal_module: {},
      });
      res = await cm_dao.queryContract(preProposalOverruleAddress, {
        dao: {},
      });
      expect(preRes).toEqual(proposalOverruleAddress);
      expect(res).toEqual(daoContracts.core.address);
    });
    test('Treasury is correct', async () => {
      res = await getTreasuryContract(cm_dao);
      expect(res).toBeTruthy();
    });
  });

  describe('Checking the association of voting modules with the Dao', () => {
    let res;
    test('voting module', async () => {
      res = await cm_dao.queryContract(votingModuleAddress, {
        dao: {},
      });
      expect(res).toEqual(daoContracts.core.address);
    });

    test.skip('voting ntrn vaults', async () => {
      //We're waiting for a bug to be fixed about the DAO being revealed on the basis of the creator
      res = await cm_dao.queryContract(votingVaultsNtrnAddress, {
        dao: {},
      });
      console.log('ntrn');
      console.log(res);
      console.log(daoContracts);
      const res2 = await cm_dao.getContractInfo(votingVaultsNtrnAddress);
      console.log(res2);
    });

    test.skip('voting lockdrop vaults', async () => {
      //We're waiting for a bug to be fixed about the DAO being revealed on the basis of the creator
      res = await cm_dao.queryContract(votingVaultsLockdropAddress, {
        dao: {},
      });
    });

    test('Dao is the admin of himself', async () => {
      res = await cm_dao.getContractInfo(daoContracts.core.address);
      expect(res.contract_info.admin).toEqual(daoContracts.core.address);
    });
  });

  describe('Checking the validity of binary files', () => {
    let res, hash, hashFromContract;
    test('Dao proposal single hash assert', async () => {
      res = await cm_dao.getContractInfo(proposalSingleAddress);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['cwd_proposal_single.wasm'],
      );
    });

    test('Dao proposal multiple hash assert', async () => {
      res = await cm_dao.getContractInfo(proposalMultipleAddress);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['cwd_proposal_multiple.wasm'],
      );
    });

    test('Dao preproposal single hash assert', async () => {
      res = await cm_dao.getContractInfo(preProposalSingleAddress);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['cwd_pre_propose_single.wasm'],
      );
    });

    test('Dao preproposal multiple hash assert', async () => {
      res = await cm_dao.getContractInfo(preProposalMultipleAddress);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['cwd_pre_propose_multiple.wasm'],
      );
    });

    test('Dao core hash assert', async () => {
      res = await cm_dao.getContractInfo(daoContracts.core.address);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(hashFromContract['cwd_core.wasm']);
    });

    test('Dao proposal overrule hash assert', async () => {
      res = await cm_dao.getContractInfo(proposalOverruleAddress);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['cwd_proposal_single.wasm'],
      );
    });

    test('Dao preproposal overrule hash assert', async () => {
      res = await cm_dao.getContractInfo(preProposalOverruleAddress);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['cwd_pre_propose_overrule.wasm'],
      );
    });

    test('Treasury hash assert', async () => {
      res = await cm_dao.getContractInfo(treasuryContract);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['neutron_treasury.wasm'],
      );
    });
    test('Treasury hash assert', async () => {
      res = await cm_dao.getContractInfo(treasuryContract);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['neutron_treasury.wasm'],
      );
    });
    test('Dao neutron vauld hash assert', async () => {
      res = await cm_dao.getContractInfo(votingVaultsNtrnAddress);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['neutron_vault.wasm'],
      );
    });
    test('Dao lockdrop vauld hash assert', async () => {
      res = await cm_dao.getContractInfo(votingVaultsLockdropAddress);
      hash = await fetchDataHash(res.contract_info.code_id);
      hashFromContract = await getContractsHashes();
      expect(hash?.toLowerCase()).toEqual(
        hashFromContract['lockdrop_vault.wasm'],
      );
    });
  });
});
