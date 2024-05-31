import Long from 'long';
import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  NEUTRON_DENOM,
  IBC_ATOM_DENOM,
  packAnyMsg,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { getWithAttempts } from '@neutron-org/neutronjsplus/dist/wait';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import { DynamicFeesParams } from '@neutron-org/neutronjsplus/dist/feemarket';
import cosmosclient from '@cosmos-client/core';
import { DecCoin } from '@neutron-org/neutronjsplus/dist/proto/neutron/cosmos/base/v1beta1/coin_pb';
import { MsgSend } from '@neutron-org/neutronjsplus/dist/proto/cosmos_sdk/cosmos/bank/v1beta1/tx_pb';

const config = require('../../config.json');

describe('Neutron / Fee Market', () => {
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
      async (response) => response.power == 10000,
      20,
    );

    await daoMember.user.msgSend(daoMain.contracts.core.address, '1000', {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
    });
  });

  // afterAll(async () => {
  //   await daoMember.unbondFunds('10000');
  // });

  let counter = 1;

  const executeSwitchFeemarket = async (
    daoMember: DaoMember,
    kind: string,
    enabled: boolean,
  ) => {
    const params = (await neutronChain.getFeemarketParams()).params;
    params.enabled = enabled;

    const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
    const proposalId = await daoMember.submitFeeMarketChangeParamsProposal(
      chainManagerAddress,
      'Change Proposal - ' + kind + ' #' + counter,
      'Param change proposal. It will change enabled params of feemarket module.',
      '1000',
      params,
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

  const executeChangeGasPrices = async (
    daoMember: DaoMember,
    kind: string,
    params: DynamicFeesParams,
  ) => {
    const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
    const proposalId = await daoMember.submitDynamicfeesChangeParamsProposal(
      chainManagerAddress,
      'Change Proposal - ' + kind + ' #' + counter,
      'Param change proposal. It will change gas price list of dynamicfees/feemarket module.',
      '1000',
      params,
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
    /* Делаем тарнзакцию с gasprice из query (0.0025untrn) */
    const res = await neutronAccount.msgSend(
      daoMain.contracts.core.address,
      '1000',
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '500' }], // 0.0025
      },
    );

    await neutronChain.blockWaiter.waitBlocks(2);

    expect(res.code).toEqual(0);
  });

  test('change minimum gas price parameter', async () => {
    // Делаем неудачную транзакцию с gas price < query (0.001untrn)
    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '200' }], // 0.001
      }),
    ).rejects.toThrowError(
      /error checking fee: got: 200untrn required: 500untrn, minGasPrice: 0.002500000000000000untrn/,
    );
  });

  test('check globalfee minimum param changed', async () => {
    // добавляем uibcatom как fee, в 5 раз дороже untrn, проряем через квери
    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: IBC_ATOM_DENOM, amount: '200' }],
      }),
    ).rejects.toThrowError(
      /unable to get min gas price for denom uibcatom: unknown denom/,
    );

    // // 5 ntrn per ATOM, gives gas price 5 times lower,  0.0005 IBC_ATOM_DENOM and 0.0025 NTRN

    await executeChangeGasPrices(daoMember, 'dynamicfees gasprices', {
      ntrn_prices: [DecCoin.fromJson({ denom: IBC_ATOM_DENOM, amount: '5' })],
    });

    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: IBC_ATOM_DENOM, amount: '50' }], // 0.00025
      }),
    ).rejects.toThrowError(
      /error checking fee: got: 50uibcatom required: 100uibcatom, minGasPrice: 0.000500000000000000uibcatom/,
    );

    const res = await neutronAccount.msgSend(
      daoMain.contracts.core.address,
      '1000',
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: IBC_ATOM_DENOM, amount: '100' }], // 0.0005
      },
    );

    await neutronChain.blockWaiter.waitBlocks(2);

    expect(res.code).toEqual(0);
  });

  test('check minumum global fees with bank send command', async () => {
    // Делаем транзакцию с 0.0125uibcatom
    await executeSwitchFeemarket(daoMember, 'disable feemarket', false);

    const res = await neutronAccount.msgSend(
      daoMain.contracts.core.address,
      '1000',
      {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: IBC_ATOM_DENOM, amount: '0' }],
      },
    );

    await neutronChain.blockWaiter.waitBlocks(2);

    // works with zero fee
    expect(res.code).toEqual(0);

    await executeSwitchFeemarket(daoMember, 'enable feemarket', true);

    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: daoMember.user.chain.denom, amount: '0' }],
      }),
    ).rejects.toThrowError(
      /error checking fee: got: 0untrn required: 500untrn, minGasPrice: 0.002500000000000000untrn/,
    );
  });
  test('change minimum gas price parameter', async () => {
    // Делаем неудачную транзакцию с gas price < query (0.001untrn)
    const msgSend = new MsgSend({
      fromAddress: neutronAccount.wallet.address.toString(),
      toAddress: daoMain.contracts.core.address,
      amount: [{ denom: neutronAccount.chain.denom, amount: '1000' }],
    });
    let ntrnGasPrice = Number(
      (await neutronChain.getGasPrice('untrn')).price.amount,
    );
    const requiredGas = '30000000';
    const priceAdjustment = 1.05;
    for (let i = 0; i < 15; i++) {
      const fees = Math.floor(
        Number(requiredGas) * ntrnGasPrice * priceAdjustment,
      ).toString();
      const res = await neutronAccount.execTx(
        {
          gas_limit: Long.fromString(requiredGas),
          amount: [{ denom: daoMember.user.chain.denom, amount: fees }],
        },
        new Array(1200).fill(
          packAnyMsg('/cosmos.bank.v1beta1.MsgSend', msgSend),
        ),
      );
      expect(res?.tx_response.code).toEqual(0);
      const currNtrnGasPrice = Number(
        (await neutronChain.getGasPrice('untrn')).price.amount,
      );
      expect(currNtrnGasPrice).toBeGreaterThan(ntrnGasPrice);
      ntrnGasPrice = currNtrnGasPrice;
      const prices = await neutronChain.getGasPrices();
      console.log(prices);
    }
    console.log('------');
    for (;;) {
      await neutronChain.blockWaiter.waitBlocks(1);
      const currNtrnGasPrice = Number(
        (await neutronChain.getGasPrice('untrn')).price.amount,
      );
      expect(currNtrnGasPrice).toBeLessThan(ntrnGasPrice);
      ntrnGasPrice = currNtrnGasPrice;
      const prices = await neutronChain.getGasPrices();
      console.log(prices);
      if (currNtrnGasPrice == 0.0025) {
        break;
      }
    }
  });
});
