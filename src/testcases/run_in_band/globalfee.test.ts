import Long from 'long';
import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { getWithAttempts } from '@neutron-org/neutronjsplus/dist/wait';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';

const config = require('../../config.json');

describe('Neutron / Global Fee', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember: DaoMember;
  let daoMain: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
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
    const daoCoreAddress = await neutronChain.getNeutronDAOCore();
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    daoMain = new Dao(neutronChain, daoContracts);
    daoMember = new DaoMember(neutronAccount, daoMain);
    await daoMember.bondFunds('10000');
    await getWithAttempts(
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
    await daoMember.unbondFunds('10000');
  });

  let counter = 1;

  const executeParamChange = async (
    daoMember: DaoMember,
    kind: string,
    value: string,
  ) => {
    const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
    const proposalId = await daoMember.submitParameterChangeProposal(
      chainManagerAddress,
      'Change Proposal - ' + kind + ' #' + counter,
      'Param change proposal. It will change the bypass min fee msg types of the global fee module to use MsgSend.',
      'globalfee',
      kind,
      value,
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

    counter++;
  };

  test('check globalfee params before proposal execution', async () => {
    const params = await neutronChain.queryGlobalfeeParams();
    expect(params.minimum_gas_prices).toEqual([
      {
        denom:
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        amount: '0.000000000000000000',
      },
      { denom: 'untrn', amount: '0.000000000000000000' },
    ]);
    expect(params.bypass_min_fee_msg_types).toEqual([
      '/ibc.core.channel.v1.Msg/RecvPacket',
      '/ibc.core.channel.v1.Msg/Acknowledgement',
      '/ibc.core.client.v1.Msg/UpdateClient',
    ]);
    expect(params.max_total_bypass_min_fee_msg_gas_usage).toEqual('1000000');
  });

  test('change minimum gas price parameter', async () => {
    await executeParamChange(
      daoMember,
      'MinimumGasPricesParam',
      '[{"denom": "untrn", "amount": "0.01"}]',
    );
  });

  test('check globalfee minimum param changed', async () => {
    const params = await neutronChain.queryGlobalfeeParams();
    expect(params.minimum_gas_prices).toEqual([
      { denom: 'untrn', amount: '0.010000000000000000' },
    ]);
  });

  test('check minumum global fees with bank send command', async () => {
    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
      }),
    ).rejects.toThrowError(
      /Insufficient fees; got: 500untrn required: 2000untrn: insufficient fee/,
    );
  });

  test('set bypass_min_fee_msg_types to allow bypass for MsgSend', async () => {
    await executeParamChange(
      daoMember,
      'BypassMinFeeMsgTypes',
      '["/cosmos.bank.v1beta1.MsgSend"]',
    );
  });

  test('check globalfee params after setting bypass_min_fee_msg_types', async () => {
    const params = await neutronChain.queryGlobalfeeParams();
    expect(params.bypass_min_fee_msg_types).toEqual([
      '/cosmos.bank.v1beta1.MsgSend',
    ]);
  });

  test('check that MsgSend passes check for allowed messages - now works with only validator fees', async () => {
    const res = await neutronAccount.msgSend(
      daoMain.contracts.core.address,
      '1000',
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
      },
    );

    await neutronChain.blockWaiter.waitBlocks(2);

    expect(res.code).toEqual(0);
  });

  test('set max_total_bypass_min_fee_msg_gas_usage to very low value', async () => {
    await executeParamChange(
      daoMember,
      'MaxTotalBypassMinFeeMsgGasUsage',
      '"50"',
    );
  });

  test('check globalfee params after setting max_total_bypass_min_fee_msg_gas_usage', async () => {
    const params = await neutronChain.queryGlobalfeeParams();
    expect(params.max_total_bypass_min_fee_msg_gas_usage).toEqual('50');
  });

  test('check that MsgSend does not work without minimal fees now', async () => {
    await neutronChain.blockWaiter.waitBlocks(2);
    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
      }),
    ).rejects.toThrowError(
      /Insufficient fees; bypass-min-fee-msg-types with gas consumption 200000 exceeds the maximum allowed gas value of 50.: insufficient fee/,
    );
  });

  test('revert minimum gas price parameter to zero values', async () => {
    await executeParamChange(
      daoMember,
      'MinimumGasPricesParam',
      '[{"denom":"ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2","amount":"0"},{"denom":"untrn","amount":"0"}]',
    );
  });

  test('revert bypass_min_fee_msg_types to defaults', async () => {
    await executeParamChange(
      daoMember,
      'BypassMinFeeMsgTypes',
      '["/ibc.core.channel.v1.Msg/RecvPacket", "/ibc.core.channel.v1.Msg/Acknowledgement", "/ibc.core.client.v1.Msg/UpdateClient"]',
    );
  });

  test('check minumum global fees with bank send command after revert with zero value (only validator min fee settings applied)', async () => {
    const res = await neutronAccount.msgSend(
      daoMain.contracts.core.address,
      '1000',
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
      },
    );

    await neutronChain.blockWaiter.waitBlocks(2);

    expect(res.code).toEqual(0);
  });
});
