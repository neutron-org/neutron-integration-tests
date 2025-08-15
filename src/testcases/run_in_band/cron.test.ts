import '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import { Wallet } from '../../helpers/wallet';
import { CONTRACTS } from '../../helpers/constants';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { RunnerTestSuite, inject } from 'vitest';
import { NEUTRON_DENOM } from '../../helpers/constants';
import { QueryClientImpl as CronQueryClient } from '@neutron-org/neutronjs/neutron/cron/query.rpc.Query';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import config from '../../config.json';

describe('Neutron / Cron', () => {
  let testState: LocalState;
  let neutronWallet: Wallet;
  let neutronClient: NeutronTestClient;
  let mainDao: Dao;
  let daoMember: DaoMember;

  let chainManagerAddress: string;
  let contractAddress: string;
  let proposalId: number;

  let cronQuerier: CronQueryClient;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);
    const neutronRpcClient = await testState.neutronRpcClient();
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    ); // add assert for some addresses
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);
    mainDao = new Dao(neutronClient, daoContracts);
    daoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );

    const queryClient = new AdminQueryClient(neutronRpcClient);
    const admins = await queryClient.admins();
    chainManagerAddress = admins.admins[0];

    cronQuerier = new CronQueryClient(neutronRpcClient);
  });

  describe('Contracts', () => {
    let codeId: number;
    test('store contract', async () => {
      codeId = await neutronClient.upload(CONTRACTS.CRON);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      contractAddress = await neutronClient.instantiate(codeId, {});
    });
  });

  describe('prepare: bond funds', () => {
    test('bond from wallet', async () => {
      await daoMember.bondFunds('1000000000');
      await neutronClient.getWithAttempts(
        async () => await mainDao.queryVotingPower(daoMember.user),
        async (response) => response.power == 1000000000,
        20,
      );
    });
  });

  describe('send a bit funds to core contracts', () => {
    test('send funds from wallet', async () => {
      const res = await neutronClient.sendTokens(
        mainDao.contracts.core.address,
        [
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        ],
        {
          gas: '4000000',
          amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
        },
      );
      expect(res.code).toEqual(0);
    });
  });

  describe('create proposal #1', () => {
    test('add schedule #1', async () => {
      proposalId = await daoMember.submitAddSchedule(
        chainManagerAddress,
        'Proposal #1',
        '',
        '1000',
        {
          name: 'schedule1',
          period: 5,
          msgs: [
            {
              contract: contractAddress,
              msg: '{"add_begin_blocker_schedule": {"name": "schedule1"}}',
            },
          ],
          execution_stage: 'EXECUTION_STAGE_BEGIN_BLOCKER',
        },
      );

      await daoMember.voteYes(proposalId);
      await mainDao.checkPassedProposal(proposalId);
      await daoMember.executeProposalWithAttempts(proposalId);
    });

    test('check that schedule was added', async () => {
      const res = await cronQuerier.schedules();
      expect(res.schedules.length).toEqual(1);
    });

    test('check that msg from schedule was executed', async () => {
      await neutronClient.waitBlocks(15);

      const queryResult: number = await neutronClient.queryContractSmart(
        contractAddress,
        {
          get_begin_blocker_schedule_counter: {
            name: 'schedule1',
          },
        },
      );
      expect(queryResult).toBeGreaterThanOrEqual(2);
    });
  });

  describe('create proposal #2', () => {
    test('remove schedule #1', async () => {
      proposalId = await daoMember.submitRemoveSchedule(
        chainManagerAddress,
        'Proposal #2',
        '',
        '1000',
        {
          name: 'schedule1',
        },
      );

      await daoMember.voteYes(proposalId);
      await mainDao.checkPassedProposal(proposalId);
      await daoMember.executeProposalWithAttempts(proposalId);
    });

    test('check that schedule was removed', async () => {
      const res = await cronQuerier.schedules();
      expect(res.schedules.length).toEqual(0);
    });

    test('check that msg from schedule was not executed because schedule was removed', async () => {
      const oldQueryResult: number = await neutronClient.queryContractSmart(
        contractAddress,
        {
          get_begin_blocker_schedule_counter: {
            name: 'schedule1',
          },
        },
      );

      await neutronClient.waitBlocks(10);

      const newQueryResult: number = await neutronClient.queryContractSmart(
        contractAddress,
        {
          get_begin_blocker_schedule_counter: {
            name: 'schedule1',
          },
        },
      );

      expect(newQueryResult).toEqual(oldQueryResult);
    });
  });

  describe('create proposal #3', () => {
    test('add schedule #2', async () => {
      proposalId = await daoMember.submitAddSchedule(
        chainManagerAddress,
        'Proposal #3',
        '',
        '1000',
        {
          name: 'schedule2',
          period: 5,
          msgs: [
            {
              contract: contractAddress,
              msg: '{"add_begin_blocker_schedule": {"name": "schedule2"}}',
            },
            {
              contract: contractAddress,
              msg: '{"unknown_msg": {"name": "schedule2"}}',
            },
            {
              contract: contractAddress,
              msg: '{"add_begin_blocker_schedule": {"name": "schedule2"}}',
            },
          ],
          execution_stage: 'EXECUTION_STAGE_BEGIN_BLOCKER',
        },
      );

      await daoMember.voteYes(proposalId);
      await mainDao.checkPassedProposal(proposalId);
      await daoMember.executeProposalWithAttempts(proposalId);
    });

    test('check that schedule was added', async () => {
      const res = await cronQuerier.schedules();
      expect(res.schedules.length).toEqual(1);
    });

    test('check that no msgs from schedule were executed because there is an error in the second msg', async () => {
      await neutronClient.waitBlocks(10);

      const queryResult: number = await neutronClient.queryContractSmart(
        contractAddress,
        {
          get_end_blocker_schedule_counter: {
            name: 'schedule2',
          },
        },
      );

      expect(queryResult).toEqual(null);
    });
  });

  describe('create proposal #4', () => {
    test('add schedule #3', async () => {
      proposalId = await daoMember.submitAddSchedule(
        chainManagerAddress,
        'Proposal #4',
        '',
        '1000',
        {
          name: 'shedule3',
          period: 5,
          msgs: [
            {
              contract: contractAddress,
              msg: '{"add_end_blocker_schedule": {"name": "schedule3"}}',
            },
            {
              contract: contractAddress,
              msg: '{"add_end_blocker_schedule": {"name": "schedule3"}}',
            },
            {
              contract: contractAddress,
              msg: '{"add_end_blocker_schedule": {"name": "schedule3"}}',
            },
          ],
          execution_stage: 'EXECUTION_STAGE_END_BLOCKER',
        },
      );

      await daoMember.voteYes(proposalId);
      await mainDao.checkPassedProposal(proposalId);
      await daoMember.executeProposalWithAttempts(proposalId);
    });

    test('check that schedule was added', async () => {
      const res = await cronQuerier.schedules();
      expect(res.schedules.length).toEqual(2);
    });

    test('check that msgs from schedule was executed', async () => {
      await neutronClient.waitBlocks(15);

      const queryResult: number = await neutronClient.queryContractSmart(
        contractAddress,
        {
          get_end_blocker_schedule_counter: {
            name: 'schedule3',
          },
        },
      );

      expect(queryResult).toBeGreaterThanOrEqual(6);
    });
  });
});
