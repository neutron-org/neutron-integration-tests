import { MsgSendEncodeObject } from '@cosmjs/stargate';
import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import { DynamicFeesParams } from '@neutron-org/neutronjsplus/dist/feemarket';
import { LocalState, createWalletWrapper } from '../../helpers/localState';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import { Suite, inject } from 'vitest';
import { IBC_ATOM_DENOM, NEUTRON_DENOM } from '@neutron-org/neutronjsplus';

const config = require('../../config.json');

describe('Neutron / Fee Market', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let daoMember: DaoMember;
  let daoMain: Dao;

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics, suite);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );

    neutronAccount = await createWalletWrapper(
      neutronChain,
      await testState.walletWithOffset('neutron'),
    );

    const daoCoreAddress = await neutronChain.getNeutronDAOCore();
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    daoMain = new Dao(neutronChain, daoContracts);
    daoMember = new DaoMember(neutronAccount, daoMain);
    await daoMember.bondFunds('10000');
    await neutronChain.getWithAttempts(
      async () =>
        await daoMain.queryVotingPower(
          daoMember.user.wallet.address.toString(),
        ),
      async (response) => response.power >= 10000,
      20,
    );

    await daoMember.user.msgSend(daoMain.contracts.core.address, '1000', {
      gas: '200000',
      amount: [{ denom: daoMember.user.chain.denom, amount: '500' }],
    });
    await executeSwitchFeemarket(daoMember, 'enable feemarket', true);
  });

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
      gas: '4000000',
      amount: [{ denom: daoMember.user.chain.denom, amount: '100000' }],
    });
    await daoMain.checkPassedProposal(proposalId);
    await daoMember.executeProposalWithAttempts(proposalId, {
      gas: '4000000',
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
      gas: '4000000',
      amount: [{ denom: daoMember.user.chain.denom, amount: '100000' }],
    });
    await daoMain.checkPassedProposal(proposalId);
    await daoMember.executeProposalWithAttempts(proposalId, {
      gas: '4000000',
      amount: [{ denom: daoMember.user.chain.denom, amount: '100000' }],
    });

    counter++;
  };

  test('success tx', async () => {
    const res = await neutronAccount.msgSend(
      daoMain.contracts.core.address,
      '1000',
      {
        gas: '200000',
        amount: [{ denom: daoMember.user.chain.denom, amount: '500' }], // 0.0025
      },
    );

    await neutronChain.waitBlocks(2);

    expect(res.code).toEqual(0);
  });

  test('failed: insufficient fee', async () => {
    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas: '200000',
        amount: [{ denom: daoMember.user.chain.denom, amount: '200' }], // 0.001
      }),
    ).rejects.toThrowError(
      /error checking fee: got: 200untrn required: 500untrn, minGasPrice: 0.002500000000000000untrn/,
    );
  });

  test('additional ibc denom', async () => {
    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas: '200000',
        amount: [{ denom: IBC_ATOM_DENOM, amount: '200' }],
      }),
    ).rejects.toThrowError(
      /unable to get min gas price for denom uibcatom: unknown denom/,
    );

    // 5 ntrn per ATOM, gives atom gas price 5 times lower,  0.0005 IBC_ATOM_DENOM and 0.0025 NTRN

    await executeChangeGasPrices(daoMember, 'dynamicfees gasprices', {
      ntrn_prices: [{ denom: IBC_ATOM_DENOM, amount: '5' }],
    });

    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas: '200000',
        amount: [{ denom: IBC_ATOM_DENOM, amount: '50' }], // 0.00025
      }),
    ).rejects.toThrowError(
      /error checking fee: got: 50uibcatom required: 100uibcatom, minGasPrice: 0.000500000000000000uibcatom/,
    );

    const res = await neutronAccount.msgSend(
      daoMain.contracts.core.address,
      '1000',
      {
        gas: '200000',
        amount: [{ denom: IBC_ATOM_DENOM, amount: '100' }], // 0.0005
      },
    );

    await neutronChain.waitBlocks(2);

    expect(res.code).toEqual(0);
  });

  test('disable/enable feemarket module', async () => {
    await executeSwitchFeemarket(daoMember, 'disable feemarket', false);

    // feemarket disabled
    // with a zero fee we fail due to default cosmos ante handler check
    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas: '200000',
        amount: [{ denom: 'untrn', amount: '0' }],
      }),
    ).rejects.toThrowError(
      /Insufficient fees; got: 0untrn required: 500ibc\/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2,500untrn: insufficient fee/,
    );

    await neutronChain.waitBlocks(2);

    await executeSwitchFeemarket(daoMember, 'enable feemarket', true);

    // feemarket enabled
    // with a zero fee we fail due to feemarket ante handler check
    await expect(
      neutronAccount.msgSend(daoMain.contracts.core.address, '1000', {
        gas: '200000',
        amount: [{ denom: daoMember.user.chain.denom, amount: '0' }],
      }),
    ).rejects.toThrowError(
      /error checking fee: got: 0untrn required: 500untrn, minGasPrice: 0.002500000000000000untrn/,
    );
  });
  test('gas price gets up and down', async () => {
    const msgSend: MsgSendEncodeObject = {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: neutronAccount.wallet.address,
        toAddress: daoMain.contracts.core.address,
        amount: [{ denom: neutronAccount.chain.denom, amount: '1000' }],
      },
    };

    let ntrnGasPrice = Number(
      (await neutronChain.getGasPrice('untrn')).price.amount,
    );
    const requiredGas = '30000000';
    // due to rounding poor accuracy, it's recommended pay a little bit more fees
    const priceAdjustment = 1.05;
    for (let i = 0; i < 15; i++) {
      const fees = Math.floor(
        Number(requiredGas) * ntrnGasPrice * priceAdjustment,
      ).toString();
      // 1200msgs consume ~27m gas
      const res = await neutronAccount.execTx(
        {
          gas: requiredGas,
          amount: [{ denom: daoMember.user.chain.denom, amount: fees }],
        },
        new Array(1200).fill(msgSend),
      );
      expect(res?.code).toEqual(0);
      const currNtrnGasPrice = Number(
        (await neutronChain.getGasPrice('untrn')).price.amount,
      );
      // gas price constantly grows on 95% full blocks
      expect(currNtrnGasPrice).toBeGreaterThan(ntrnGasPrice);
      ntrnGasPrice = currNtrnGasPrice;
      const prices = await neutronChain.getGasPrices();
      console.log(prices);
    }
    console.log('------');
    for (;;) {
      await neutronChain.waitBlocks(1);
      const currNtrnGasPrice = Number(
        (await neutronChain.getGasPrice('untrn')).price.amount,
      );
      // gas price constantly get down when blocks are empty
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
