import { neutronTypes } from './../../helpers/registryTypes';
import { Registry } from '@cosmjs/proto-signing';
import { ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import '@neutron-org/neutronjsplus';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/localState';
import { Dao, DaoMember } from '@neutron-org/neutronjsplus/dist/dao';
import { Suite, inject } from 'vitest';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { wasm, WasmWrapper } from '../../helpers/wasmClient';
import {
  addSubdaoToDao,
  deployNeutronDao,
  deploySubdao,
} from '../../helpers/dao';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';

const config = require('../../config.json');

describe('Neutron / Subdao Overrule', () => {
  let testState: LocalState;
  let neutronAccount1: Wallet;
  let neutronAccount2: Wallet;
  let subdaoMember1: DaoMember;
  let mainDaoMember1: DaoMember;
  let mainDaoMember2: DaoMember;
  let subDao: Dao;
  let mainDao: Dao;
  let neutronClient1: WasmWrapper;
  let neutronClient2: WasmWrapper;

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics, suite);
    await testState.init();
    neutronAccount1 = await testState.nextWallet('neutron');
    neutronAccount2 = await testState.nextWallet('neutron');
    neutronClient1 = await wasm(
      testState.rpcNeutron,
      neutronAccount1,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );
    neutronClient2 = await wasm(
      testState.rpcNeutron,
      neutronAccount2,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );

    const daoContracts = await deployNeutronDao(
      neutronAccount1.address,
      neutronClient1,
    );
    if (!daoContracts || !daoContracts.core || !daoContracts.proposals) {
      throw new Error('Failed to deploy dao');
    }
    mainDao = new Dao(neutronClient1.client, daoContracts);
    mainDaoMember1 = new DaoMember(
      mainDao,
      neutronClient1.client,
      neutronAccount1.address,
      NEUTRON_DENOM,
    );
    await mainDaoMember1.bondFunds('20000');

    mainDaoMember2 = new DaoMember(
      mainDao,
      neutronClient2.client,
      neutronAccount2.address,
      NEUTRON_DENOM,
    );
    await mainDaoMember2.bondFunds('10000');

    subDao = await deploySubdao(
      neutronClient1,
      daoContracts.core.address,
      daoContracts.proposals.overrule?.pre_propose?.address || '',
      neutronAccount1.address,
      false, // do not close proposal on failure since otherwise we wont get an error exception from submsgs
    );

    subdaoMember1 = new DaoMember(
      subDao,
      neutronClient1.client,
      neutronAccount1.address,
      NEUTRON_DENOM,
    );

    await waitBlocks(2, neutronClient1.client);

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
            recipient: neutronAccount2.address,
            amount: 2000,
            denom: NEUTRON_DENOM,
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
      await addSubdaoToDao(mainDaoMember1, subDao.contracts.core.address); // mainDaoMember1

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
            recipient: neutronAccount2.address,
            amount: 2000,
            denom: NEUTRON_DENOM,
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
        neutronClient1,
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
  wasm: WasmWrapper,
  member: DaoMember,
  timelockAddress: string,
  proposalId: number,
): Promise<ExecuteResult> {
  const propId = await member.dao.getOverruleProposalId(
    timelockAddress,
    proposalId,
  );
  return await wasm.client.execute(
    wasm.wallet.address,
    member.dao.contracts.proposals.overrule?.address || '',
    { vote: { proposal_id: propId, vote: 'no' } },
    {
      gas: '4000000',
      amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
    },
  );
}
