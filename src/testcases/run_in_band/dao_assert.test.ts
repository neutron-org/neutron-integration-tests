import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { CosmosWrapper, NEUTRON_DENOM } from '../../helpers/cosmos';
import { Wallet } from '../../types';
import { getDaoContracts, DaoContracts } from '../../helpers/dao';

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
  });

  describe('proposal modules', () => {
    test('proposal dao single', async () => {
      const res = await cm_dao.queryContract(proposalSingleAddress, {
        dao: {},
      });
      expect(res).toEqual(
        daoContracts.core.address,
        `Error in proposal dao single test. Expected ${daoContracts.core.address}, but got ${res}`,
      );
    });

    test('preproposal dao single', async () => {
      const preRes = await cm_dao.queryContract(preProposalSingleAddress, {
        proposal_module: {},
      });
      const res = await cm_dao.queryContract(preProposalSingleAddress, {
        dao: {},
      });
      expect(preRes).toEqual(proposalSingleAddress);
      expect(res).toEqual(daoContracts.core.address);
    });

    test('proposal dao multiple', async () => {
      const res = await cm_dao.queryContract(proposalMultipleAddress, {
        dao: {},
      });
      expect(res).toEqual(
        daoContracts.core.address,
        `Error in proposal dao multiple test. Expected ${daoContracts.core.address}, but got ${res}`,
      );
    });

    test('preproposal dao multiple', async () => {
      const preRes = await cm_dao.queryContract(preProposalMultipleAddress, {
        proposal_module: {},
      });
      const res = await cm_dao.queryContract(preProposalMultipleAddress, {
        dao: {},
      });
      expect(preRes).toEqual(proposalMultipleAddress);
      expect(res).toEqual(daoContracts.core.address);
    });

    test('proposal dao overrule', async () => {
      const res = await cm_dao.queryContract(proposalOverruleAddress, {
        dao: {},
      });
      expect(res).toEqual(
        daoContracts.core.address,
        `Error in proposal dao overrule test. Expected ${daoContracts.core.address}, but got ${res}`,
      );
    });

    test('preproposal dao overrule', async () => {
      const preRes = await cm_dao.queryContract(preProposalOverruleAddress, {
        proposal_module: {},
      });
      const res = await cm_dao.queryContract(preProposalOverruleAddress, {
        dao: {},
      });
      expect(preRes).toEqual(proposalOverruleAddress);
      expect(res).toEqual(daoContracts.core.address);
    });
  });

  describe('voting module', () => {
    test('voting module', async () => {
      const res = await cm_dao.queryContract(votingModuleAddress, {
        dao: {},
      });
      expect(res).toEqual(
        daoContracts.core.address,
        `Error in voting module test. Expected ${daoContracts.core.address}, but got ${res}`,
      );
    });
  });
  test('voting ntrn vaults', async () => {
    const res = await cm_dao.queryContract(votingVaultsNtrnAddress, {
      dao: {},
    });
    console.log('voting ntrn vaults');
    console.log(res);
    console.log(daoContracts.core.address);
  });
  test('voting lockdrop vaults', async () => {
    const res = await cm_dao.queryContract(votingVaultsLockdropAddress, {
      dao: {},
    });
    console.log('voting lockdrop vaults');
    console.log(res);
    console.log(daoContracts.core.address);
  });
});
