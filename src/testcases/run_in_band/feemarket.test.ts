import { Registry } from '@cosmjs/proto-signing';
import { MsgSendEncodeObject } from '@cosmjs/stargate';
import '@neutron-org/neutronjsplus';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { DynamicFeesParams } from '@neutron-org/neutronjsplus/dist/feemarket';
import { LocalState } from '../../helpers/localState';
import { Suite, inject } from 'vitest';
import { IBC_ATOM_DENOM, NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { WasmWrapper, wasm } from '../../helpers/wasmClient';
import { neutronTypes } from '@neutron-org/neutronjsplus/dist/neutronTypes';
import {
  getWithAttempts,
  waitBlocks,
} from '@neutron-org/neutronjsplus/dist/wait';
import { QueryClientImpl as FeemarketQuery } from '@neutron-org/neutronjs/feemarket/feemarket/v1/query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query';

const config = require('../../config.json');

describe('Neutron / Fee Market', () => {
  let testState: LocalState;
  let neutronAccount: Wallet;
  let neutronClient: WasmWrapper;
  let daoMember: DaoMember;
  let mainDao: Dao;
  let feemarketQuery: FeemarketQuery;
  let chainManagerAddress: string;

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics, suite);
    await testState.init();

    neutronAccount = testState.wallets.neutron.demo1;
    neutronClient = await wasm(
      testState.rpcNeutron,
      neutronAccount,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );
    const neutronRpcClient = await testState.rpcClient('neutron');

    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient.client,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(
      neutronClient.client,
      daoCoreAddress,
    );
    mainDao = new Dao(neutronClient.client, daoContracts);
    daoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronAccount.address,
      NEUTRON_DENOM,
    );
    await daoMember.bondFunds('10000');
    await getWithAttempts(
      neutronClient.client,
      async () => await mainDao.queryVotingPower(daoMember.user),
      async (response) => response.power >= 10000,
      20,
    );

    await neutronClient.client.sendTokens(
      neutronAccount.address,
      mainDao.contracts.core.address,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '500' }],
      },
    );

    feemarketQuery = new FeemarketQuery(neutronRpcClient);
    const adminQuery = new AdminQueryClient(neutronRpcClient);
    const admins = await adminQuery.Admins();
    chainManagerAddress = admins.admins[0];

    await executeSwitchFeemarket(
      feemarketQuery,
      daoMember,
      'enable feemarket',
      true,
    );
  });

  let counter = 1;

  const executeSwitchFeemarket = async (
    feemarketQuery: FeemarketQuery,
    daoMember: DaoMember,
    kind: string,
    enabled: boolean,
    window = 1n,
  ) => {
    const params = (await feemarketQuery.Params()).params;
    params.enabled = enabled;
    params.window = window;

    const proposalId = await daoMember.submitFeeMarketChangeParamsProposal(
      chainManagerAddress,
      'Change Proposal - ' + kind + ' #' + counter,
      'Param change proposal. It will change enabled params of feemarket module.',
      '1000',
      {
        alpha: params.alpha,
        beta: params.beta,
        delta: params.delta,
        min_base_gas_price: params.minBaseGasPrice,
        min_learning_rate: params.minLearningRate,
        max_learning_rate: params.maxLearningRate,
        max_block_utilization: Number(params.maxBlockUtilization),
        window: Number(params.window),
        fee_denom: params.feeDenom,
        enabled: params.enabled,
        distribute_fees: params.distributeFees,
      },
    );

    await daoMember.voteYes(proposalId, 'single', {
      gas: '4000000',
      amount: [{ denom: NEUTRON_DENOM, amount: '100000' }],
    });
    await mainDao.checkPassedProposal(proposalId);
    await daoMember.executeProposalWithAttempts(proposalId);

    counter++;
  };

  const executeChangeGasPrices = async (
    daoMember: DaoMember,
    kind: string,
    params: DynamicFeesParams,
  ) => {
    const proposalId = await daoMember.submitDynamicfeesChangeParamsProposal(
      chainManagerAddress,
      'Change Proposal - ' + kind + ' #' + counter,
      'Param change proposal. It will change gas price list of dynamicfees/feemarket module.',
      '1000',
      params,
    );

    await daoMember.voteYes(proposalId, 'single', {
      gas: '4000000',
      amount: [{ denom: NEUTRON_DENOM, amount: '100000' }],
    });
    await mainDao.checkPassedProposal(proposalId);
    await daoMember.executeProposalWithAttempts(proposalId);

    counter++;
  };

  test('success tx', async () => {
    const res = await neutronClient.client.sendTokens(
      neutronAccount.address,
      mainDao.contracts.core.address,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '500' }], // 0.0025
      },
    );

    await waitBlocks(2, neutronClient.client);

    expect(res.code).toEqual(0);
  });

  test('failed: insufficient fee', async () => {
    await expect(
      neutronClient.client.sendTokens(
        neutronAccount.address,
        mainDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '200' }], // 0.001
        },
      ),
    ).rejects.toThrowError(
      /error checking fee: got: 200untrn required: 500untrn, minGasPrice: 0.002500000000000000untrn/,
    );
  });

  test('additional ibc denom', async () => {
    await expect(
      neutronClient.client.sendTokens(
        neutronAccount.address,
        mainDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: IBC_ATOM_DENOM, amount: '200' }],
        },
      ),
    ).rejects.toThrowError(
      /unable to get min gas price for denom uibcatom: unknown denom/,
    );

    // 5 ntrn per ATOM, gives atom gas price 5 times lower,  0.0005 IBC_ATOM_DENOM and 0.0025 NTRN

    await executeChangeGasPrices(daoMember, 'dynamicfees gasprices', {
      ntrn_prices: [{ denom: IBC_ATOM_DENOM, amount: '5' }],
    });

    await expect(
      neutronClient.client.sendTokens(
        neutronAccount.address,
        mainDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: IBC_ATOM_DENOM, amount: '50' }], // 0.00025
        },
      ),
    ).rejects.toThrowError(
      /error checking fee: got: 50uibcatom required: 100uibcatom, minGasPrice: 0.000500000000000000uibcatom/,
    );

    const res = await neutronClient.client.sendTokens(
      neutronAccount.address,
      mainDao.contracts.core.address,
      [{ denom: NEUTRON_DENOM, amount: '1000' }],
      {
        gas: '200000',
        amount: [{ denom: IBC_ATOM_DENOM, amount: '100' }], // 0.0005
      },
    );

    await waitBlocks(2, neutronClient.client);

    expect(res.code).toEqual(0);
  });

  test('disable/enable feemarket module', async () => {
    await executeSwitchFeemarket(
      feemarketQuery,
      daoMember,
      'disable feemarket',
      false,
    );

    // feemarket disabled
    // with a zero fee we fail due to default cosmos ante handler check
    await expect(
      neutronClient.client.sendTokens(
        neutronAccount.address,
        mainDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '0' }],
        },
      ),
    ).rejects.toThrowError(
      /Insufficient fees; got: 0untrn required: 500ibc\/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2,500untrn: insufficient fee/,
    );

    await waitBlocks(2, neutronClient.client);

    await executeSwitchFeemarket(
      feemarketQuery,
      daoMember,
      'enable feemarket',
      true,
    );

    // feemarket enabled
    // with a zero fee we fail due to feemarket ante handler check
    await expect(
      neutronClient.client.sendTokens(
        neutronAccount.address,
        mainDao.contracts.core.address,
        [{ denom: NEUTRON_DENOM, amount: '1000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '0' }],
        },
      ),
    ).rejects.toThrowError(
      /error checking fee: got: 0untrn required: 500untrn, minGasPrice: 0.002500000000000000untrn/,
    );
  });

  test('gas price gets up and down', async () => {
    await executeSwitchFeemarket(
      feemarketQuery,
      daoMember,
      'enable feemarket',
      true,
      1n,
    );

    const msgSend: MsgSendEncodeObject = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: neutronAccount.address,
        toAddress: mainDao.contracts.core.address,
        amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
      },
    };

    const baseGasPrice = +(await feemarketQuery.GasPrice({ denom: NEUTRON_DENOM })).price.amount;
    const requiredGas = '30000000';
    // due to rounding poor accuracy, it's recommended pay a little bit more fees
    const priceAdjustment = 1.55;
    for (let i = 0; i < 5; i++) {
      const fees = Math.floor(
        +requiredGas * baseGasPrice * priceAdjustment,
      ).toString();
      // 1200msgs consume ~27m gas
      try {
        await neutronClient.client.signAndBroadcastSync(
          neutronAccount.address,
          new Array(1200).fill(msgSend),
          {
            gas: requiredGas,
            amount: [{ denom: NEUTRON_DENOM, amount: fees }],
          },
        );
      } catch (e) {
        // do nothing if called with same sequence
      }
      await waitBlocks(1, neutronClient.client);
    }

    const inflatedGasPrice =
      +(await feemarketQuery.GasPrice({ denom: NEUTRON_DENOM })).price.amount;
    // gas price should be higher after big transactions
    expect(inflatedGasPrice).toBeGreaterThan(baseGasPrice);

    await waitBlocks(10, neutronClient.client);

    const newNtrnGasPrice =
      +(
        await feemarketQuery.GasPrice({
          denom: NEUTRON_DENOM,
        })
      ).price.amount;
    expect(newNtrnGasPrice).toBeLessThan(inflatedGasPrice);
    // expect gas price to fall to the base after some amount of blocks passed
    expect(newNtrnGasPrice).toBe(0.0025);
  });
});
