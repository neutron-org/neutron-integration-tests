/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import {
  Dao,
  DaoMember,
  setupSubDaoTimelockSet,
  deployNeutronDao,
} from '../../helpers/dao';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { Wallet } from '../../types';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';

describe('Neutron / Subdao', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: WalletWrapper;
  let neutronAccount2: WalletWrapper;
  let subdaoMember1: DaoMember;
  let mainDaoMember1: DaoMember;
  let mainDaoMember2: DaoMember;
  let demo1_wallet: Wallet;
  let security_dao_wallet: Wallet;
  let demo2_wallet: Wallet;
  let security_dao_addr: AccAddress | ValAddress;
  let demo2_addr: AccAddress | ValAddress;
  let subDao: Dao;
  let mainDao: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    demo1_wallet = testState.wallets.neutron.demo1;
    security_dao_wallet = testState.wallets.neutron.icq;
    demo2_wallet = testState.wallets.neutron.demo2;
    security_dao_addr = security_dao_wallet.address;
    demo2_addr = demo2_wallet.address;
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount1 = new WalletWrapper(neutronChain, demo1_wallet);
    neutronAccount2 = new WalletWrapper(neutronChain, demo2_wallet);

    const daoContracts = await deployNeutronDao(neutronAccount1);
    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember1 = new DaoMember(neutronAccount1, mainDao);
    await mainDaoMember1.bondFunds('2000');

    mainDaoMember2 = new DaoMember(neutronAccount2, mainDao);
    await mainDaoMember2.bondFunds('1000');

    subDao = await setupSubDaoTimelockSet(
      neutronAccount1,
      mainDao.contracts.core.address,
      security_dao_addr.toString(),
      false,
    );

    subdaoMember1 = new DaoMember(neutronAccount1, subDao);

    const subDaosList = await mainDao.getSubDaoList();
    expect(subDaosList).toContain(subDao.contracts.core.address);

    await neutronChain.getWithAttempts(
      async () =>
        await subDao.queryVotingPower(
          neutronAccount1.wallet.address.toString(),
        ),
      async (response) => response.power == 1,
    );
  });

  describe('Overrule timelocked', () => {
    let proposal_id: number;
    beforeAll(async () => {
      proposal_id = await subdaoMember1.submitSendProposal('send', 'send', [
        {
          recipient: demo2_addr.toString(),
          amount: 2000,
          denom: neutronChain.denom,
        },
      ]);

      const timelocked_prop = await subdaoMember1.supportAndExecuteProposal(
        proposal_id,
      );

      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(1);
    });

    test('create duplicate overrule', async () => {
      const timelockAddress =
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address;
      await expect(
        mainDaoMember1.submitOverruleProposal(timelockAddress, proposal_id),
      ).rejects.toThrow(/already created/);
    });

    test('overrule timelocked(Timelocked): Success', async () => {
      const timelockAddress =
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address;
      // we vote No from user with significant voting power to test if proposal is executed anyway
      await voteAgainstOverrule(mainDaoMember1, timelockAddress, proposal_id);
      await mainDaoMember2.overruleTimelockedProposal(
        timelockAddress,
        proposal_id,
      );
      // todo check vote distribution on overrule proposal
      const timelocked_prop = await subDao.getTimelockedProposal(proposal_id);
      expect(timelocked_prop.id).toEqual(proposal_id);
      expect(timelocked_prop.status).toEqual('overruled');
      expect(timelocked_prop.msgs).toHaveLength(1);
    });
  });
});

// this function isn't in the DaoMember class since it makes no sense in general but in a very specific test
async function voteAgainstOverrule(
  member: DaoMember,
  timelock_address: string,
  proposal_id: number,
): Promise<InlineResponse20075TxResponse> {
  const prop_id = await member.dao.getOverruleProposalId(
    timelock_address,
    proposal_id,
  );
  return await member.user.executeContract(
    member.dao.contracts.proposal_modules.overrule.address,
    JSON.stringify({ vote: { proposal_id: prop_id, vote: 'no' } }),
    [],
    member.user.wallet.address.toString(),
  );
}
