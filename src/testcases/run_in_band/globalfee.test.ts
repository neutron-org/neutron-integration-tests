import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { getWithAttempts } from '../../helpers/wait';
import { Dao, DaoMember, getDaoContracts } from '../../helpers/dao';
import Long from 'long';
import cosmosclient from '@cosmos-client/core';

describe('Neutron / Global Fee', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember: DaoMember;
  let dao: Dao;

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
      testState.wallets.neutron.demo1,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress); // breaks here!
    dao = new Dao(neutronChain, daoContracts);
    daoMember = new DaoMember(neutronAccount, dao);
    await daoMember.bondFunds('1000');
    await getWithAttempts(
      neutronChain.blockWaiter,
      async () =>
        await dao.queryVotingPower(daoMember.user.wallet.address.toString()),
      async (response) => response.power == 1000,
      20,
    );

    await daoMember.user.msgSend(dao.contracts.core.address, '1000', {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
    });
  });

  afterAll(async () => {
    await daoMember.unbondFunds('1000');
  });

  test('check minumum global fees param before proposal execution', async () => {
    const params = await neutronChain.queryGlobalfeeParams();
    const minGasPrices = params.minimum_gas_prices;
    expect(minGasPrices).toEqual([
      {
        denom:
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        amount: '0.000000000000000000',
      },
      { denom: 'untrn', amount: '0.000000000000000000' },
    ]);
  });

  // TODO: check other params

  test('change minimum gas price parameter', async () => {
    const proposalId = await daoMember.submitParameterChangeProposal(
      'Minimum Gas Price Change Proposal',
      'Param change proposal. It will change the minimum gas price of the global fee module.',
      'globalfee',
      'MinimumGasPricesParam',
      '[{"denom": "untrn", "amount": "0.01"}]',
      '1000',
    );

    await daoMember.voteYes(proposalId);
    await dao.checkPassedProposal(proposalId);
    await daoMember.executeProposalWithAttempts(proposalId);
  });

  test('check minumum global fees with bank send command', async () => {
    const fee = {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
    };
    neutronChain.blockWaiter.waitBlocks(2);
    await expect(
      neutronAccount.msgSend(dao.contracts.core.address, '1000', fee),
    ).rejects.toThrowError(
      /Insufficient fees; got: 500untrn required: 2000untrn: insufficient fee/,
    );
  });

  test('revert minimum gas price parameter to zero values', async () => {
    const proposalId = await daoMember.submitParameterChangeProposal(
      'Minimum Gas Price Change Proposal',
      'Param change proposal. It will change the minimum gas price of the global fee module to zero values.',
      'globalfee',
      'MinimumGasPricesParam',
      '[{"denom":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","amount":"0"},{"denom":"untrn","amount":"0"}]',
      '1000',
      {
        gas_limit: Long.fromString('4000000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '100000' }],
      },
    );

    await daoMember.voteYes(proposalId, 'single', {
      gas_limit: Long.fromString('4000000'),
      amount: [{ denom: daoMember.user.chain.denom, amount: '100000' }],
    });
    await dao.checkPassedProposal(proposalId);
    await daoMember.executeProposalWithAttempts(proposalId, {
      gas_limit: Long.fromString('4000000'),
      amount: [{ denom: daoMember.user.chain.denom, amount: '100000' }],
    });
  });

  test('check minumum global fees with bank send command after revert with zero value (only validator settings applied)', async () => {
    const res = await neutronAccount.msgSend(
      dao.contracts.core.address,
      '1000',
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
      },
    );

    neutronChain.blockWaiter.waitBlocks(2);

    expect(res.code).toEqual(0);
  });
});
