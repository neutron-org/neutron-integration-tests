import '@neutron-org/neutronjsplus';
import {
  COSMOS_DENOM,
  IBC_ATOM_DENOM,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { inject } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { QueryClientImpl as FeeburnerQueryClient } from '@neutron-org/neutronjs/neutron/feeburner/query.rpc.Query';
import { Registry } from '@cosmjs/proto-signing';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query.rpc.Query';
import { QueryTotalBurnedNeutronsAmountResponse } from '@neutron-org/neutronjs/neutron/feeburner/query';
import { QuerySupplyOfResponse } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { MsgTransfer } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/tx';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';
import { QueryClientImpl as FeemarketQueryClient } from '@neutron-org/neutronjs/feemarket/feemarket/v1/query.rpc.Query';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { DynamicFeesParams } from '@neutron-org/neutronjsplus/dist/proposal';

describe('Neutron / Tokenomics', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: Wallet;
  let treasuryContractAddress: string;

  let bankQuerier: BankQueryClient;
  let feeburnerQuerier: FeeburnerQueryClient;
  let mainDao: Dao;
  let chainManagerAddress: string;
  let feemarketQuerier: FeemarketQueryClient;
  let daoMember: DaoMember;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );

    gaiaWallet = await testState.nextWallet('cosmos');
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.directwallet,
      { registry: new Registry(defaultRegistryTypes) },
    );

    const neutronRpcClient = await testState.rpcClient('neutron');
    const feeburnerQuery = new FeeburnerQueryClient(neutronRpcClient);
    treasuryContractAddress = (await feeburnerQuery.params()).params
      .treasuryAddress;

    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);
    mainDao = new Dao(neutronClient, daoContracts);
    daoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );
    await daoMember.bondFunds('1000000000');
    await neutronClient.getWithAttempts(
      async () => await mainDao.queryVotingPower(daoMember.user),
      async (response) => response.power >= 1000000000,
      20,
    );

    bankQuerier = new BankQueryClient(neutronRpcClient);
    feeburnerQuerier = new FeeburnerQueryClient(neutronRpcClient);

    feemarketQuerier = new FeemarketQueryClient(neutronRpcClient);
    const adminQuery = new AdminQueryClient(neutronRpcClient);
    const admins = await adminQuery.admins();
    chainManagerAddress = admins.admins[0];

    await executeSwitchFeemarket(
      feemarketQuerier,
      daoMember,
      'enable feemarket',
      true,
    );

    await executeChangeGasPrices(daoMember, 'dynamicfees gasprices', {
      ntrn_prices: [
        {
          denom:
            'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
          amount: '5',
        },
      ],
    });
  });

  const executeSwitchFeemarket = async (
    feemarketQuery: FeemarketQueryClient,
    daoMember: DaoMember,
    kind: string,
    enabled: boolean,
    window = 1n,
  ) => {
    const params = (await feemarketQuery.params()).params;
    params.enabled = enabled;
    params.window = window;

    const proposalId = await daoMember.submitFeeMarketChangeParamsProposal(
      chainManagerAddress,
      'Change Proposal - ' + kind + ' #',
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
  };

  const executeChangeGasPrices = async (
    daoMember: DaoMember,
    kind: string,
    params: DynamicFeesParams,
  ) => {
    const proposalId = await daoMember.submitDynamicfeesChangeParamsProposal(
      chainManagerAddress,
      'Change Proposal - ' + kind + ' #',
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
  };

  describe('100% of Neutron fees are burned', () => {
    const bigFee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let burnedBefore: QueryTotalBurnedNeutronsAmountResponse;

    test('Read total burned neutrons amount', async () => {
      burnedBefore = await feeburnerQuerier.totalBurnedNeutronsAmount();
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronClient.sendTokens(
        testState.wallets.neutron.rly1.address,
        [
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        ],
        bigFee,
      );
    });

    test('Total burned neutrons amount has increased', async () => {
      const burnedAfter = await feeburnerQuerier.totalBurnedNeutronsAmount();
      const diff =
        +(burnedAfter.totalBurnedNeutronsAmount.coin.amount || 0) -
        +(burnedBefore.totalBurnedNeutronsAmount.coin.amount || 0);
      expect(diff).toBeGreaterThanOrEqual(10e8);
    });
  });

  describe('Total supply of neutrons decreases after fee processing', () => {
    const bigFee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let totalSupplyBefore: QuerySupplyOfResponse;

    test('Read total supply', async () => {
      totalSupplyBefore = await bankQuerier.supplyOf({ denom: NEUTRON_DENOM });
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronClient.sendTokens(
        testState.wallets.neutron.rly1.address,
        [
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        ],
        bigFee,
      );
    });

    test('Total supply of neutrons has decreased', async () => {
      const totalSupplyAfter = await bankQuerier.supplyOf({
        denom: NEUTRON_DENOM,
      });
      const diff =
        +(totalSupplyBefore.amount.amount || 0) -
        +(totalSupplyAfter.amount.amount || 0);
      expect(diff).toBeGreaterThanOrEqual(10e8 * 0.75);
    });
  });

  describe('NTRN fees are not sent to Treasury', () => {
    let balanceBefore: number;
    const fee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: '5000' }],
    };

    test('Read Treasury balance', async () => {
      balanceBefore = parseInt(
        (await neutronClient.getBalance(treasuryContractAddress, NEUTRON_DENOM))
          .amount,
        10,
      );
    });

    test('Perform any tx and pay with neutron fee', async () => {
      await neutronClient.sendTokens(
        testState.wallets.neutron.rly1.address,
        [
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        ],
        fee,
      );
    });

    test("Balance of Treasury in NTRNs hasn't increased", async () => {
      await neutronClient.waitBlocks(1);
      const balanceAfter = parseInt(
        (await neutronClient.getBalance(treasuryContractAddress, NEUTRON_DENOM))
          .amount,
        10,
      );
      const diff = balanceAfter - balanceBefore;
      expect(diff).toEqual(0);
    });
  });

  describe('75% of non-Neutron fees are sent to Treasury', () => {
    let balanceBefore: number;
    const ibcUatomDenom =
      'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';
    const fee = {
      gas: '200000',
      amount: [
        {
          denom: ibcUatomDenom,
          amount: '5000',
        },
      ],
    };

    test('obtain uatom tokens', async () => {
      await gaiaClient.signAndBroadcast(
        gaiaWallet.address,
        [
          {
            typeUrl: MsgTransfer.typeUrl,
            value: MsgTransfer.fromPartial({
              sourcePort: 'transfer',
              sourceChannel: 'channel-0',
              token: { denom: COSMOS_DENOM, amount: '100000' },
              sender: gaiaWallet.address,
              receiver: neutronWallet.address,
              timeoutHeight: {
                revisionNumber: 2n,
                revisionHeight: 100000000n,
              },
            }),
          },
        ],
        {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        },
      );
      await neutronClient.getWithAttempts(
        async () =>
          neutronClient.getBalance(neutronWallet.address, ibcUatomDenom),
        async (balance) => balance !== undefined,
      );
    });

    test('Read Treasury balance', async () => {
      balanceBefore = parseInt(
        (await neutronClient.getBalance(treasuryContractAddress, ibcUatomDenom))
          .amount,
        10,
      );
    });

    test('Perform any tx and pay with uatom fee', async () => {
      await neutronClient.sendTokens(
        testState.wallets.neutron.rly1.address,
        [
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        ],
        fee,
      );
    });

    test('Balance of Treasury in uatoms has been increased', async () => {
      const balanceAfter = parseInt(
        (await neutronClient.getBalance(treasuryContractAddress, ibcUatomDenom))
          .amount,
        10,
      );
      const diff = balanceAfter - balanceBefore;
      expect(diff).toBeGreaterThanOrEqual(+fee.amount[0].amount * 0.75);
    });
  });
});
