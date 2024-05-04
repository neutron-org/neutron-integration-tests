import { IndexedTx } from '@cosmjs/cosmwasm-stargate';
import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from './../../helpers/cosmos_testnet';

import {
  Dao,
  DaoMember,
  deployNeutronDao,
  deploySubdao,
} from '@neutron-org/neutronjsplus/dist/dao';
import {
  WalletWrapper,
  createWalletWrapper,
} from '@neutron-org/neutronjsplus/dist/wallet_wrapper';

const config = require('../../config.json');

describe('Neutron / Subdao Overrule', () => {
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
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronAccount1 = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    neutronAccount2 = await createWalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronThree.genQaWal1,
    );

    const daoContracts = await deployNeutronDao(neutronAccount1);
    if (!daoContracts || !daoContracts.core || !daoContracts.proposals) {
      throw new Error('Failed to deploy dao');
    }
    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember1 = new DaoMember(neutronAccount1, mainDao);
    await mainDaoMember1.bondFunds('20000');

    mainDaoMember2 = new DaoMember(neutronAccount2, mainDao);
    await mainDaoMember2.bondFunds('10000');

    subDao = await deploySubdao(
      neutronAccount1,
      daoContracts.core.address,
      daoContracts.proposals.overrule?.pre_propose?.address || '',
      neutronAccount1.wallet.address.toString(),
      false, // do not close proposal on failure since otherwise we wont get an error exception from submsgs
    );

    subdaoMember1 = new DaoMember(neutronAccount1, subDao);

    await neutronChain.waitBlocks(2);

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

// this function isn't in the DaoMember class since it makes no sense in general but in a very specific test
async function voteAgainstOverrule(
  member: DaoMember,
  timelockAddress: string,
  proposalId: number,
): Promise<IndexedTx> {
  const propId = await member.dao.getOverruleProposalId(
    timelockAddress,
    proposalId,
  );
  return await member.user.executeContract(
    member.dao.contracts.proposals.overrule?.address || '',
    { vote: { proposal_id: propId, vote: 'no' } },
  );
}
