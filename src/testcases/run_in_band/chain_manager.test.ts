/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import {
  Dao,
  DaoMember,
  deployNeutronDao,
  setupSubDaoTimelockSet,
} from '@neutron-org/neutronjsplus/dist/dao';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import cosmosclient from '@cosmos-client/core';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import {
  paramChangeProposal,
  sendProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';

import config from '../../config.json';

describe('Neutron / Subdao', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: WalletWrapper;
  let neutronAccount2: WalletWrapper;
  let subdaoMember1: DaoMember;
  let mainDaoMember: DaoMember;
  let demo1Wallet: Wallet;
  let securityDaoWallet: Wallet;
  let demo2Wallet: Wallet;
  let securityDaoAddr: cosmosclient.AccAddress | cosmosclient.ValAddress;
  let subDao: Dao;
  let mainDao: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    demo1Wallet = testState.wallets.qaNeutron.genQaWal1;
    securityDaoWallet = testState.wallets.qaNeutronThree.genQaWal1;
    demo2Wallet = testState.wallets.qaNeutronFour.genQaWal1;
    securityDaoAddr = securityDaoWallet.address;
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount1 = new WalletWrapper(neutronChain, demo1Wallet);
    neutronAccount2 = new WalletWrapper(neutronChain, demo2Wallet);

    const daoContracts = await deployNeutronDao(neutronAccount1);
    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember = new DaoMember(neutronAccount1, mainDao);
    await mainDaoMember.bondFunds('10000');

    subDao = await setupSubDaoTimelockSet(
      neutronAccount1,
      mainDao.contracts.core.address,
      securityDaoAddr.toString(),
      true,
    );

    subdaoMember1 = new DaoMember(neutronAccount1, subDao);

    const subDaosList = await mainDao.getSubDaoList();
    expect(subDaosList).toContain(subDao.contracts.core.address);

    const votingPower = await subdaoMember1.queryVotingPower();
    expect(votingPower.power).toEqual('1');
  });

  describe('Timelock: Succeed execution', () => {
    let proposalId: number;
    beforeAll(async () => {
      const coinsForDemo2 = 2000;
      proposalId = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: neutronAccount2.wallet.address.toString(),
          amount: coinsForDemo2,
          denom: NEUTRON_DENOM,
        },
      ]);

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked: success', async () => {
      await neutronAccount1.msgSend(subDao.contracts.core.address, '20000'); // fund the subdao treasury
      const balance2 = await neutronAccount2.queryDenomBalance(NEUTRON_DENOM);
      await waitSeconds(20);
      await subdaoMember1.executeTimelockedProposal(proposalId);
      const balance2After = await neutronAccount2.queryDenomBalance(
        NEUTRON_DENOM,
      );
      expect(balance2After).toEqual(balance2 + 2000);

      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);
    });
  });
});
