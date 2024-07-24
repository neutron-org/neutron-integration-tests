import { Coin } from '@cosmjs/proto-signing';
import '@neutron-org/neutronjsplus';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { updateGlobalFeeParamsProposal } from '@neutron-org/neutronjsplus/dist/proposal';
import { inject } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { QueryClientImpl as GlobalfeeQueryClient } from '@neutron-org/neutronjs/gaia/globalfee/v1beta1/query.rpc.Query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';

import config from '../../config.json';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { NEUTRON_DENOM } from '../../helpers/constants';

describe('Neutron / Global Fee', () => {
  let testState: LocalState;
  let daoMember: DaoMember;
  let mainDao: Dao;
  let neutronWallet: Wallet;
  let neutronClient: SigningNeutronClient;
  let globalfeeQuerier: GlobalfeeQueryClient;
  let chainManagerAddress: string;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    const neutronRpcClient = await testState.rpcClient('neutron');

    const adminQuery = new AdminQueryClient(neutronRpcClient);
    const admins = await adminQuery.admins();
    chainManagerAddress = admins.admins[0];

    globalfeeQuerier = new GlobalfeeQueryClient(neutronRpcClient);

    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );

    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    ); //add assert for some addresses
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);
    mainDao = new Dao(neutronClient, daoContracts);
    daoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );

    await daoMember.bondFunds('10000');
    await neutronClient.getWithAttempts(
      async () => await mainDao.queryVotingPower(daoMember.user),
      async (response) => response.power == 10000,
      20,
    );

    await neutronClient.sendTokens(
      mainDao.contracts.core.address,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
      },
    );
  });

  afterAll(async () => {
    await daoMember.unbondFunds('10000');
  });

  let counter = 1;

  const executeParamChange = async (
    daoMember: DaoMember,
    kind: string,
    bypassMinFeeMsgTypes: string[] | null,
    minimumGasPrices: Coin[] | null,
    maxTotalBypassMinFeesgGasUsage: bigint | null,
  ) => {
    const res = await globalfeeQuerier.params();
    if (bypassMinFeeMsgTypes == null) {
      bypassMinFeeMsgTypes = res.params.bypassMinFeeMsgTypes;
    }
    if (minimumGasPrices == null) {
      minimumGasPrices = res.params.minimumGasPrices.map((p) => ({
        denom: p.denom,
        amount: p.amount,
      }));
    }
    if (maxTotalBypassMinFeesgGasUsage == null) {
      maxTotalBypassMinFeesgGasUsage =
        res.params.maxTotalBypassMinFeeMsgGasUsage;
    }

    const proposalId = await daoMember.submitUpdateParamsGlobalfeeProposal(
      chainManagerAddress,
      'Change Proposal - ' + kind + ' #' + counter,
      'Param change proposal. It will change the bypass min fee msg types of the global fee module to use MsgSend.',
      updateGlobalFeeParamsProposal({
        bypass_min_fee_msg_types: bypassMinFeeMsgTypes,
        max_total_bypass_min_fee_msg_gas_usage:
          maxTotalBypassMinFeesgGasUsage.toString(),
        minimum_gas_prices: minimumGasPrices,
      }),
      '1000',
      {
        gas: '4000000',
        amount: [{ denom: NEUTRON_DENOM, amount: '100000' }],
      },
    );

    await daoMember.voteYes(proposalId, 'single', {
      gas: '4000000',
      amount: [{ denom: NEUTRON_DENOM, amount: '100000' }],
    });
    await mainDao.checkPassedProposal(proposalId);
    await daoMember.executeProposalWithAttempts(proposalId, {
      gas: '4000000',
      amount: [{ denom: NEUTRON_DENOM, amount: '100000' }],
    });

    counter++;
  };

  test('check globalfee params before proposal execution', async () => {
    const res = await globalfeeQuerier.params();
    expect(res.params.minimumGasPrices).toEqual([
      {
        denom:
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        amount: '0',
      },
      { denom: 'untrn', amount: '0' },
    ]);
    expect(res.params.bypassMinFeeMsgTypes).toEqual([
      '/ibc.core.channel.v1.Msg/RecvPacket',
      '/ibc.core.channel.v1.Msg/Acknowledgement',
      '/ibc.core.client.v1.Msg/UpdateClient',
    ]);
    expect(res.params.maxTotalBypassMinFeeMsgGasUsage).toEqual(1000000n);
  });

  test('change minimum gas price parameter', async () => {
    await executeParamChange(
      daoMember,
      'MinimumGasPricesParam',
      null,
      [{ denom: 'untrn', amount: '0.01' }],
      null,
    );
  });

  test('check globalfee minimum param changed', async () => {
    const res = await globalfeeQuerier.params();
    expect(res.params.minimumGasPrices).toEqual([
      { denom: 'untrn', amount: '0.01' },
    ]);
  });

  test('check minumum global fees with bank send command', async () => {
    await expect(
      neutronClient.sendTokens(
        mainDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
        },
      ),
    ).rejects.toThrowError(
      /Insufficient fees; got: 500untrn required: 2000untrn: insufficient fee/,
    );
  });

  test('set bypass_min_fee_msg_types to allow bypass for MsgSend', async () => {
    await executeParamChange(
      daoMember,
      'BypassMinFeeMsgTypes',
      ['/cosmos.bank.v1beta1.MsgSend'],
      null,
      null,
    );
  });

  test('check globalfee params after setting bypass_min_fee_msg_types', async () => {
    const res = await globalfeeQuerier.params();
    expect(res.params.bypassMinFeeMsgTypes).toEqual([
      '/cosmos.bank.v1beta1.MsgSend',
    ]);
  });

  test('check that MsgSend passes check for allowed messages - now works with only validator fees', async () => {
    const res = await neutronClient.sendTokens(
      mainDao.contracts.core.address,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
      },
    );

    await neutronClient.waitBlocks(2);

    expect(res.code).toEqual(0);
  });

  test('set max_total_bypass_min_fee_msg_gas_usage to very low value', async () => {
    await executeParamChange(
      daoMember,
      'MaxTotalBypassMinFeeMsgGasUsage',
      null,
      null,
      50n,
    );
  });

  test('check globalfee params after setting max_total_bypass_min_fee_msg_gas_usage', async () => {
    const res = await globalfeeQuerier.params();
    expect(res.params.maxTotalBypassMinFeeMsgGasUsage).toEqual(50n);
  });

  test('check that MsgSend does not work without minimal fees now', async () => {
    await neutronClient.waitBlocks(2);
    await expect(
      neutronClient.sendTokens(
        mainDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
        },
      ),
    ).rejects.toThrowError(
      /Insufficient fees; bypass-min-fee-msg-types with gas consumption 200000 exceeds the maximum allowed gas value of 50.: insufficient fee/,
    );
  });

  test('revert minimum gas price parameter to zero values', async () => {
    await executeParamChange(
      daoMember,
      'MinimumGasPricesParam',
      null,
      [
        {
          denom:
            'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
          amount: '0',
        },
        { denom: 'untrn', amount: '0' },
      ],
      null,
    );
  });

  test('revert bypass_min_fee_msg_types to defaults', async () => {
    await executeParamChange(
      daoMember,
      'BypassMinFeeMsgTypes',
      [
        '/ibc.core.channel.v1.Msg/RecvPacket',
        '/ibc.core.channel.v1.Msg/Acknowledgement',
        '/ibc.core.client.v1.Msg/UpdateClient',
      ],
      null,
      null,
    );
  });

  test('check minumum global fees with bank send command after revert with zero value (only validator min fee settings applied)', async () => {
    const res = await neutronClient.sendTokens(
      mainDao.contracts.core.address,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
      },
    );

    await neutronClient.waitBlocks(2);

    expect(res.code).toEqual(0);
  });
});
