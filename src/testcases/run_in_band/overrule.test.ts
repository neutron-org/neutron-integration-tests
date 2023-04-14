/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import {
  Dao,
  DaoMember,
  deployNeutronDao,
  deploySubdao,
} from '../../helpers/dao';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';

describe('Neutron / Subdao', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: WalletWrapper;
  let neutronAccount2: WalletWrapper;
  let subdaoMember1: DaoMember;
  let mainDaoMember1: DaoMember;
  let mainDaoMember2: DaoMember;
  let subDao: Dao;
  let mainDao: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount1 = new WalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
    neutronAccount2 = new WalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo2,
    );

    const daoContracts = await deployNeutronDao(neutronAccount1);
    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember1 = new DaoMember(neutronAccount1, mainDao);
    await mainDaoMember1.bondFunds('2000');

    mainDaoMember2 = new DaoMember(neutronAccount2, mainDao);
    await mainDaoMember2.bondFunds('1000');

    subDao = await deploySubdao(
      neutronAccount1,
      daoContracts.core.address,
      daoContracts.proposal_modules.overrule.pre_proposal_module.address,
      neutronAccount1.wallet.address.toString(),
    );

    subdaoMember1 = new DaoMember(neutronAccount1, subDao);

    const votingPower = await subdaoMember1.queryVotingPower();
    expect(votingPower.power).toEqual('1');
  });

  describe('Overrule timelocked', () => {
    let timelockedPropId: number;
    test('timelock fails since subdao is not in list', async () => {
      const proposal_id = await subdaoMember1.submitSendProposal(
        'send',
        'send',
        [
          {
            recipient: neutronAccount2.wallet.address.toString(),
            amount: 2000,
            denom: neutronChain.denom,
          },
        ],
      );

      await expect(
        subdaoMember1.supportAndExecuteProposal(proposal_id),
      ).rejects.toThrow(/Subdao isn't in the list./);
    });

    test('dao has no subdaos', async () => {
      const subDaosList = await mainDao.getSubDaoList();
      expect(subDaosList).toHaveLength(0);

      await expect(
        mainDao.querySubDao(subDao.contracts.core.address),
      ).rejects.toThrow(/SubDao not found/);
    });

    test('add subdao to list', async () => {
      await mainDaoMember1.addSubdaoToDao(subDao.contracts.core.address);

      const subDaosList = await mainDao.getSubDaoList();
      expect(subDaosList).toContain(subDao.contracts.core.address);

      const subDaoResponse = await mainDao.querySubDao(
        subDao.contracts.core.address,
      );
      expect(subDaoResponse).toEqual({
        addr: subDao.contracts.core.address,
        charter: null,
      });
    });

    test('successfully timelocked', async () => {
      timelockedPropId = await subdaoMember1.submitSendProposal(
        'send',
        'send',
        [
          {
            recipient: neutronAccount2.wallet.address.toString(),
            amount: 2000,
            denom: neutronChain.denom,
          },
        ],
      );
      const timelocked_prop = await subdaoMember1.supportAndExecuteProposal(
        timelockedPropId,
      );
      expect(timelocked_prop.id).toEqual(timelockedPropId);
      expect(timelocked_prop.status).toEqual('timelocked');
      expect(timelocked_prop.msgs).toHaveLength(1);
    });

    test('create duplicate overrule', async () => {
      const timelockAddress =
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address;
      await expect(
        mainDaoMember1.submitOverruleProposal(
          timelockAddress,
          timelockedPropId,
        ),
      ).rejects.toThrow(/already created/);
    });

    test('overrule timelocked(Timelocked): Success', async () => {
      const timelockAddress =
        subDao.contracts.proposal_modules.single.pre_proposal_module
          .timelock_module.address;
      // we vote No from user with significant voting power to test if proposal is executed anyway
      await voteAgainstOverrule(
        mainDaoMember1,
        timelockAddress,
        timelockedPropId,
      );
      await mainDaoMember2.overruleTimelockedProposal(
        timelockAddress,
        timelockedPropId,
      );
      const prop = await mainDao.queryOverruleProposal(
        await mainDao.getOverruleProposalId(timelockAddress, timelockedPropId),
      );
      // let's check that proposal passed even while the majority is against it
      expect(parseInt(prop.proposal.votes.yes)).toBeLessThan(
        parseInt(prop.proposal.votes.no),
      );
      const timelocked_prop = await subDao.getTimelockedProposal(
        timelockedPropId,
      );
      expect(timelocked_prop.id).toEqual(timelockedPropId);
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
  );
}
