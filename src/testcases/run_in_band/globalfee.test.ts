import Long from 'long';
import { rest } from '@cosmos-client/core';
import {
  cosmosWrapper,
  dao,
  NEUTRON_DENOM,
  TestStateLocalCosmosTestNet,
  wait,
} from 'neutronjs';

const config = require('../../config.json');

describe('Neutron / Global Fee', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: cosmosWrapper.CosmosWrapper;
  let neutronAccount: cosmosWrapper.WalletWrapper;
  let daoMember: dao.DaoMember;
  let daoMain: dao.Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    const daoCoreAddress = (await neutronChain.getChainAdmins())[0];
    const daoContracts = await dao.getDaoContracts(
      neutronChain,
      daoCoreAddress,
    );
    daoMain = new dao.Dao(neutronChain, daoContracts);
    daoMember = new dao.DaoMember(neutronAccount, daoMain);
    await daoMember.bondFunds('1000');
    await wait.getWithAttempts(
      neutronChain.blockWaiter,
      async () =>
        await daoMain.queryVotingPower(
          daoMember.user.wallet.address.toString(),
        ),
      async (response) => response.power == 1000,
      20,
    );

    await daoMember.user.msgSend(daoMain.contracts.core.address, '1000', {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
    });
  });

  afterAll(async () => {
    await daoMember.unbondFunds('1000');
  });

  test('check minumum global fees before proposal execution', async () => {
    const minGasPrices = await neutronChain.queryMinGasPrices();
    expect(minGasPrices).toEqual([
      {
        denom:
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        amount: '0.000000000000000000',
      },
      { denom: 'untrn', amount: '0.000000000000000000' },
    ]);
  });

  test('change minimum gas price parameter', async () => {
    const proposalId = await daoMember.submitParameterChangeProposal(
      'Minimumm Gas Price Change Proposal',
      'Param change proposal. It will change the minimum gas price of the global fee module.',
      'globalfee',
      'MinimumGasPricesParam',
      '[{"denom": "untrn", "amount": "0.01"}]',
      '1000',
    );

    await daoMember.voteYes(proposalId);
    await daoMain.checkPassedProposal(proposalId);
    await daoMember.executeProposalWithAttempts(proposalId);
  });

  test('check minumum global fees with bank send command', async () => {
    await expect(
      daoMember.user.msgSend(
        daoMain.contracts.core.address,
        '1000',
        {
          gas_limit: Long.fromString('200000'),
          amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
        },
        undefined,
        rest.tx.BroadcastTxMode.Block,
      ),
    ).rejects.toThrowError(
      /insufficient fees; got: 500untrn required: 2000untrn: insufficient fee/,
    );
  });

  test('revert minimum gas price parameter to zero values', async () => {
    const proposalId = await daoMember.submitParameterChangeProposal(
      'Minimumm Gas Price Change Proposal',
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
    await daoMain.checkPassedProposal(proposalId);
    await daoMember.executeProposalWithAttempts(proposalId, {
      gas_limit: Long.fromString('4000000'),
      amount: [{ denom: daoMember.user.chain.denom, amount: '100000' }],
    });
  });

  test('check minumum global fees with bank send command after revert with zero value (only validator settings applied)', async () => {
    const res = await daoMember.user.msgSend(
      daoMain.contracts.core.address,
      '1000',
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
      },
      undefined,
      rest.tx.BroadcastTxMode.Block,
    );

    expect(res.code).toEqual(0);
  });
});
