import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import {
  cosmosWrapper,
  dao,
  NEUTRON_DENOM,
  TestStateLocalCosmosTestNet,
} from 'neutronjs';

const config = require('../../config.json');

describe('Neutron / Subdao', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: cosmosWrapper.CosmosWrapper;
  let neutronAccount1: cosmosWrapper.WalletWrapper;
  let neutronAccount2: cosmosWrapper.WalletWrapper;
  let subdaoMember1: dao.DaoMember;
  let mainDaoMember1: dao.DaoMember;
  let mainDaoMember2: dao.DaoMember;
  let subDao: dao.Dao;
  let mainDao: dao.Dao;

  beforeAll(async () => {
    cosmosWrapper.registerCodecs();

    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount1 = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    neutronAccount2 = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronThree.genQaWal1,
    );

    const daoContracts = await dao.deployNeutronDao(neutronAccount1);
    if (!daoContracts || !daoContracts.core || !daoContracts.proposals) {
      throw new Error('Failed to deploy dao');
    }
    mainDao = new dao.Dao(neutronChain, daoContracts);
    mainDaoMember1 = new dao.DaoMember(neutronAccount1, mainDao);
    await mainDaoMember1.bondFunds('2000');

    mainDaoMember2 = new dao.DaoMember(neutronAccount2, mainDao);
    await mainDaoMember2.bondFunds('1000');

    subDao = await dao.deploySubdao(
      neutronAccount1,
      daoContracts.core.address,
      daoContracts.proposals.overrule?.pre_propose?.address || '',
      neutronAccount1.wallet.address.toString(),
    );

    subdaoMember1 = new dao.DaoMember(neutronAccount1, subDao);

    const votingPower = await subdaoMember1.queryVotingPower();
    expect(votingPower.power).toEqual('1');
  });

  describe('Overrule timelocked', () => {
    let timelockedPropId: number;
    test('timelock fails since subdao is not in list', async () => {
      const proposalId = await subdaoMember1.submitSendProposal(
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
        subdaoMember1.supportAndExecuteProposal(proposalId),
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
      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        timelockedPropId,
      );
      expect(timelockedProp.id).toEqual(timelockedPropId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('create duplicate overrule', async () => {
      const timelockAddress =
        subDao.contracts.proposals.single.pre_propose.timelock?.address || '';
      await expect(
        mainDaoMember1.submitOverruleProposal(
          timelockAddress,
          timelockedPropId,
        ),
      ).rejects.toThrow(/already created/);
    });

    test('overrule timelocked(Timelocked): Success', async () => {
      const timelockAddress =
        subDao.contracts.proposals.single.pre_propose.timelock?.address || '';
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
      const timelockedProp = await subDao.getTimelockedProposal(
        timelockedPropId,
      );
      expect(timelockedProp.id).toEqual(timelockedPropId);
      expect(timelockedProp.status).toEqual('overruled');
      expect(timelockedProp.msgs).toHaveLength(1);
    });
  });
});

// this function isn't in the dao.DaoMember class since it makes no sense in general but in a very specific test
async function voteAgainstOverrule(
  member: dao.DaoMember,
  timelockAddress: string,
  proposalId: number,
): Promise<InlineResponse20075TxResponse> {
  const propId = await member.dao.getOverruleProposalId(
    timelockAddress,
    proposalId,
  );
  return await member.user.executeContract(
    member.dao.contracts.proposals.overrule?.address || '',
    JSON.stringify({ vote: { proposal_id: propId, vote: 'no' } }),
  );
}
