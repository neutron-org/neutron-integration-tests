import '@neutron-org/neutronjsplus';
import { COSMOS_DENOM, NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { inject } from 'vitest';
import { LocalState, createWalletWrapper } from '../../helpers/localState';
import { QueryClientImpl as FeeburnerQueryClient } from '@neutron-org/neutronjs/neutron/feeburner/query.rpc.Query';
import {wasm, WasmWrapper} from "../../helpers/wasmClient";
import {Registry} from "@cosmjs/proto-signing";
import {neutronTypes} from "@neutron-org/neutronjsplus/dist/neutronTypes";
import {defaultRegistryTypes, SigningStargateClient} from "@cosmjs/stargate";
import {getWithAttempts} from "../../helpers/getWithAttempts";
import {QueryClientImpl as ContractManagerQuery} from "@neutron-org/cosmjs-types/neutron/contractmanager/query";
import {QueryClientImpl as BankQueryClient} from "@neutron-org/cosmjs-types/cosmos/bank/v1beta1/query";
import {QueryClientImpl as IbcQueryClient} from "@neutron-org/cosmjs-types/ibc/applications/transfer/v1/query";
import {Wallet} from "@neutron-org/neutronjsplus/dist/types";
import {QueryTotalBurnedNeutronsAmountResponse} from "@neutron-org/neutronjs/neutron/feeburner/query";
import {QueryTotalSupplyResponse} from "@neutron-org/neutronjs/cosmos/bank/v1beta1/query";
import {waitBlocks} from "@neutron-org/neutronjsplus/dist/wait";

const config = require('../../config.json');

describe('Neutron / Tokenomics', () => {
  let testState: LocalState;
  let neutronClient: WasmWrapper;
  let neutronSigningClient: SigningStargateClient;
  let gaiaClient: SigningStargateClient;
  let neutronAccount: Wallet;
  let gaiaAccount: Wallet;
  let treasuryContractAddress: string;

  let contractManagerQuery: ContractManagerQuery;
  let bankQuerier: BankQueryClient;
  let ibcQuerier: IbcQueryClient;
  let feeburnerQuerier: FeeburnerQueryClient;

  beforeAll(async () => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics);
    await testState.init();
    neutronAccount = await testState.nextWallet('neutron');
    neutronClient = await wasm(
      testState.rpcNeutron,
      neutronAccount,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );

    neutronSigningClient = await SigningStargateClient.connectWithSigner(
      testState.rpcNeutron,
      neutronAccount.directwallet,
      { registry:new Registry(neutronTypes)},
    );


    gaiaAccount = await testState.nextWallet('cosmos');
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaAccount.directwallet,
      { registry: new Registry(defaultRegistryTypes) },
    );


    const neutronRpcClient = await testState.rpcClient('neutron');
    const feeburnerQuery = new FeeburnerQueryClient(neutronRpcClient);
    treasuryContractAddress = (await feeburnerQuery.params()).params
      .treasuryAddress;


    contractManagerQuery = new ContractManagerQuery(neutronRpcClient);
    bankQuerier = new BankQueryClient(neutronRpcClient);
    ibcQuerier = new IbcQueryClient(neutronRpcClient);
  });

  describe('75% of Neutron fees are burned', () => {
    const bigFee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let burnedBefore: QueryTotalBurnedNeutronsAmountResponse;

    test('Read total burned neutrons amount', async () => {
      burnedBefore = await feeburnerQuerier.totalBurnedNeutronsAmount();
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address,
        '1000',
        bigFee,
      );
    });

    test('Total burned neutrons amount has increased', async () => {
      const burnedAfter = await feeburnerQuerier.totalBurnedNeutronsAmount();
      const diff =
        +(burnedAfter.totalBurnedNeutronsAmount.coin.amount || 0) -
        +(burnedBefore.totalBurnedNeutronsAmount.coin.amount || 0);
      expect(diff).toBeGreaterThanOrEqual(10e8 * 0.75);
    });
  });

  describe('Total supply of neutrons decreases after fee processing', () => {
    const bigFee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: (10e8).toString() }],
    };
    let totalSupplyBefore: QueryTotalSupplyResponse;

    test('Read total supply', async () => {
      totalSupplyBefore = await bankQuerier.TotalSupply(
      );
    });

    test('Perform tx with a very big neutron fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address,
        '1000',
        bigFee,
      );
    });

    test('Total supply of neutrons has decreased', async () => {
      const totalSupplyAfter = await bankQuerier.TotalSupply();
      // TODO types
      const diff =
        +(totalSupplyBefore.supply[0].amount || 0) -
        +(totalSupplyAfter.supply[0].amount || 0);
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
      balanceBefore = parseInt((await neutronClient.client.getBalance(
        treasuryContractAddress,
        NEUTRON_DENOM,
      )).amount, 10);
    });

    test('Perform any tx and pay with neutron fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address,
        '1000',
        fee,
      );
    });

    test("Balance of Treasury in NTRNs hasn't increased", async () => {
      await waitBlocks(1, neutronClient.client);
      const balanceAfter = parseInt((await neutronClient.client.getBalance(
        treasuryContractAddress,
        NEUTRON_DENOM,
      )).amount, 10);
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
      await gaiaAccount.msgIBCTransfer(
        'transfer',
        'channel-0',
        {
          denom: COSMOS_DENOM,
          amount: '100000',
        },
        testState.wallets.qaNeutron.qa.address,
        { revisionNumber: 2n, revisionHeight: 100000000n },
      );
      await getWithAttempts(
        neutronSigningClient,
        async () =>
          neutronClient.client.getBalance(testState.wallets.qaNeutron.qa.address, ibcUatomDenom),
        async (balance) =>
          balance !== undefined ,
      );
    });

    test('Read Treasury balance', async () => {
      balanceBefore = parseInt((await neutronClient.client.getBalance(
        treasuryContractAddress,
        ibcUatomDenom,
      )).amount, 10);
    });

    test('Perform any tx and pay with uatom fee', async () => {
      await neutronAccount.msgSend(
        testState.wallets.neutron.rly1.address,
        '1000',
        fee,
      );
    });

    test('Balance of Treasury in uatoms has been increased', async () => {
      const balanceAfter = parseInt((await neutronClient.client.getBalance(
        treasuryContractAddress,
        ibcUatomDenom,
      )).amount, 10);
      const diff = balanceAfter - balanceBefore;
      expect(diff).toBeGreaterThanOrEqual(+fee.amount[0].amount * 0.75);
    });
  });
});
