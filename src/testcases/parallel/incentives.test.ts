import {
  ADMIN_MODULE_ADDRESS,
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { getWithAttempts } from '../../helpers/wait';
import { NeutronContract } from '../../helpers/types';
import { Dao, DaoMember, getDaoContracts } from '../../helpers/dao';

describe('Neutron / Governance', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember1: DaoMember;
  let dao: Dao;

  let contractAddress: string;
  let contractAddressForAdminMigration: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    dao = new Dao(neutronChain, daoContracts);
    daoMember1 = new DaoMember(neutronAccount, dao);
  });

  describe('Contracts', () => {
    let codeId: number;
    test('store contract', async () => {
      codeId = await neutronAccount.storeWasm(NeutronContract.INCENTIVES);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await neutronAccount.instantiateContract(
        codeId,
        '{}',
        'neutron_incentives',
      );
      contractAddress = res[0]._contract_address;
    });
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('1000');
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () =>
          await dao.queryVotingPower(daoMember1.user.wallet.address.toString()),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('check voting power', async () => {
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () => await dao.queryTotalVotingPower(),
        async (response) => response.power == 1000,
        20,
      );
    });
  });

  describe('send a bit funds to core contracts', () => {
    test('send funds from wallet 1', async () => {
      const res = await daoMember1.user.msgSend(
        dao.contracts.core.address,
        '1000',
      );
      expect(res.code).toEqual(0);
    });
  });

  // TODO: test updateParams?

  describe('create gauge through proposal', () => {
    const proposalId = 1;

    test('create create gauge proposal', async () => {
      // await daoMember1.submitClearAdminProposal(
      //   'Proposal #1',
      //   'Param change proposal. This one will pass',
      //   'icahost',
      //   'HostEnabled',
      //   'false',
      //   '1000',
      // );

      await daoMember1.voteYes(proposalId);
      await dao.checkPassedProposal(proposalId);

      const host = await neutronChain.queryHostEnabled();
      expect(host).toEqual(true);
      await daoMember1.executeProposalWithAttempts(proposalId);
    });

    test('check gauge is created', async () => {
      const host = await neutronChain.queryHostEnabled();
      expect(host).toEqual(false);
    });
  });
});
