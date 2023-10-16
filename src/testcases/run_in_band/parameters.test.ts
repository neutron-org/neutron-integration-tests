import {
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
  let daoMember2: DaoMember;
  let daoMember3: DaoMember;
  let dao: Dao;
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
    daoMember2 = new DaoMember(
      new WalletWrapper(
        neutronChain,
        testState.wallets.qaNeutronThree.genQaWal1,
      ),
      dao,
    );
    daoMember3 = new DaoMember(
      new WalletWrapper(
        neutronChain,
        testState.wallets.qaNeutronFour.genQaWal1,
      ),
      dao,
    );

    const contractCodeId = await neutronAccount.storeWasm(
      NeutronContract.IBC_TRANSFER,
    );
    expect(contractCodeId).toBeGreaterThan(0);
    const contractRes = await neutronAccount.instantiateContract(
      contractCodeId,
      '{}',
      'ibc_transfer',
      dao.contracts.core.address,
    );
    contractAddressForAdminMigration = contractRes[0]._contract_address;
    expect(contractAddressForAdminMigration).toBeDefined();
    expect(contractAddressForAdminMigration).not.toEqual('');
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
    test('bond from wallet 2', async () => {
      await daoMember2.bondFunds('1000');
      await getWithAttempts(
        neutronChain.blockWaiter,
        async () =>
          await dao.queryVotingPower(daoMember1.user.wallet.address.toString()),
        async (response) => response.power == 1000,
        20,
      );
    });
    test('bond from wallet 3 ', async () => {
      await daoMember3.bondFunds('1000');
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
        async (response) => response.power == 3000,
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

  describe('create several proposals', () => {
    test('create proposal #1, will pass', async () => {
      await daoMember1.submitUpdateParamsInterchainqueriesProposal(
        'Proposal #1',
        'Param change proposal. This one will pass',
        30,
        20,
        '1000',
      );
    });

    test('create proposal #2, will pass', async () => {
      await daoMember1.submitUpdateParamsTokenfactoryProposal(
        'Proposal #2',
        'This one will pass',
        100000,
        '1000',
      );
    });

    test('create proposal #3, will pass', async () => {
      await daoMember1.submitUpdateParamsFeeburnerProposal(
        'Proposal #3',
        'Software upgrade proposal. Will pass',
        dao.contracts.voting.address,
        '1000',
      );
    });

    test('create proposal #4, will pass', async () => {
      await daoMember1.submitUpdateParamsFeerefunderProposal(
        'Proposal #4',
        'Software upgrade proposal. Will pass',
        '1000',
      );
    });

    test('create proposal #5, will pass', async () => {
      await daoMember1.submitUpdateParamsCronProposal(
        'Proposal #5',
        'UpdateClient proposal. Will pass',
        dao.contracts.voting.address,
        10,
        '1000',
      );
    });

    test('create proposal #6, will pass', async () => {
      await daoMember1.submitUpdateParamsContractmanageProposal(
        'Proposal #6',
        'Pin codes proposal. Will pass',
        '1000',
        '1000',
      );
    });

    test('create proposal #7, will pass', async () => {
      await daoMember1.submitUpdateParamsInterchaintxsProposal(
        'Proposal #7',
        'Update interchaintxs params',
        11,
        '1000',
      );
    });
  });

  describe('vote for proposal #1 (no, yes, yes)', () => {
    const proposalId = 1;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #1', () => {
    const proposalId = 1;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      const host = await neutronChain.queryHostEnabled();
      expect(host).toEqual(true);
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check if params changed after proposal execution', async () => {
      const params = await neutronChain.queryInterchainqueriesParams();
      expect(params.params.query_submit_timeout).toEqual('30');
      expect(params.params.tx_query_removal_limit).toEqual('20');
    });
  });

  describe('vote for proposal #2 (no, yes, yes)', () => {
    const proposalId = 2;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote NO from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #2', () => {
    const proposalId = 2;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check if params changed after proposal execution', async () => {
      const params = await neutronChain.queryTokenfactoryParams();
      expect(params.params.denom_creation_fee).toHaveLength(0);
      expect(params.params.denom_creation_gas_consume).toEqual('100000');
    });
  });

  describe('vote for proposal #3 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await daoMember1.voteYes(3);
    });
    test('vote NO from wallet 2', async () => {
      await daoMember2.voteNo(3);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(3);
    });
  });

  describe('execute proposal #3', () => {
    const proposalId = 3;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check if params changed after proposal execution', async () => {
      const params = await neutronChain.queryFeeburnerParams();
      expect(params.params.treasury_address).toEqual(
        dao.contracts.voting.address,
      );
    });
  });

  describe('vote for proposal #4 (no, yes, yes)', () => {
    const proposalId = 4;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #4', () => {
    const proposalId = 4;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check if params changed after proposal execution', async () => {
      const params = await neutronChain.queryFeerefunderParams();
      // toHaveLength(0) equals fee struct is '[]'
      expect(params.params.min_fee.recv_fee).toHaveLength(0);
      expect(params.params.min_fee.ack_fee).toHaveLength(0);
      expect(params.params.min_fee.timeout_fee).toHaveLength(0);
    });
  });

  describe('vote for proposal #5 (no, yes, yes)', () => {
    const proposalId = 5;
    test('vote NO from wallet 1', async () => {
      await daoMember1.voteNo(proposalId);
    });
    test('vote YES from wallet 2', async () => {
      await daoMember2.voteYes(proposalId);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(proposalId);
    });
  });

  describe('execute proposal #5', () => {
    const proposalId = 5;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check if params changed after proposal execution', async () => {
      const params = await neutronChain.queryCronParams();
      expect(params.params.security_address).toEqual(
        dao.contracts.voting.address,
      );
    });
  });

  describe('vote for proposal #6 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await daoMember1.voteYes(6);
    });
    test('vote NO from wallet 2', async () => {
      await daoMember2.voteNo(6);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(6);
    });
  });

  describe('execute proposal #6', () => {
    const proposalId = 6;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check if params changed after proposal execution', async () => {
      const params = await neutronChain.queryContractmanagerParams();
      expect(params.params.sudo_call_gas_limit).toEqual('1000');
    });
  });

  describe('vote for proposal #7 (yes, no, yes)', () => {
    test('vote YES from wallet 1', async () => {
      await daoMember1.voteYes(7);
    });
    test('vote NO from wallet 2', async () => {
      await daoMember2.voteNo(7);
    });
    test('vote YES from wallet 3', async () => {
      await daoMember3.voteYes(7);
    });
  });

  describe('execute proposal #7', () => {
    const proposalId = 7;
    test('check if proposal is passed', async () => {
      await dao.checkPassedProposal(proposalId);
    });
    test('execute passed proposal', async () => {
      await daoMember1.executeProposalWithAttempts(proposalId);
    });
    test('check if params changed after proposal execution', async () => {
      const param = await neutronChain.queryMaxTxsAllowed();
      expect(param).toEqual('11');
    });
  });
});
