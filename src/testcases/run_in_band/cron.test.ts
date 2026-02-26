import '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import { Wallet } from '../../helpers/wallet';
import { CONTRACTS } from '../../helpers/constants';
import { RunnerTestSuite, inject } from 'vitest';
import { NEUTRON_DENOM } from '../../helpers/constants';
import { QueryClientImpl as CronQueryClient } from '@neutron-org/neutronjs/neutron/cron/query.rpc.Query';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import config from '../../config.json';
import { delegateTokens } from '../../helpers/staking';
import { executeMsgSubmitProposalV1, executeMsgVoteNeutron } from '../../helpers/gov';
import { MsgAddSchedule, MsgRemoveSchedule } from '@neutron-org/neutronjs/neutron/cron/tx';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';

const GOV_MODULE_ADDRESS = "neutron10d07y265gmmuvt4z0w9aw880jnsr700j7a68v5"

describe('Neutron / Cron', () => {
  let testState: LocalState;
  let neutronWallet: Wallet;
  let neutronClient: NeutronTestClient;
  let govWallet: Wallet;
  let govClient: NeutronTestClient;

  let contractAddress: string;
  let proposalId: number;

  let cronQuerier: CronQueryClient;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);
    govWallet = await testState.nextSecp256k1SignNeutronWallet();
    govClient = await NeutronTestClient.connectWithSigner(govWallet);
    const neutronRpcClient = await testState.neutronRpcClient();

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

  describe('prepare: delegate funds', () => {
    test('delegate from wallet', async () => {
      const govRes = await delegateTokens(govClient, govWallet.address, testState.wallets.neutron.val1.valAddress, '5000000000');
      expect(govRes.code).toEqual(0);
    });
  });

  describe('create proposal #1', () => {
    test('add schedule #1', async () => {
      const res = await executeMsgSubmitProposalV1(govClient, govWallet, 'Proposal #1', 'Proposal summary #1', '', [
        {
          typeUrl: '/neutron.cron.MsgAddSchedule',
          value: MsgAddSchedule.encode(
            MsgAddSchedule.fromJSON({
              authority: GOV_MODULE_ADDRESS,
              name: 'schedule1',
              period: 5,
              msgs: [
                {
                  contract: contractAddress,
                  msg: '{"add_begin_blocker_schedule": {"name": "schedule1"}}',
                },
              ],
              executionStage: 'EXECUTION_STAGE_BEGIN_BLOCKER',
            }),
          ).finish(),
        },
      ],
        [{ denom: NEUTRON_DENOM, amount: '60000000' }],
        true,
        { gas: '4000000', amount: [{ denom: NEUTRON_DENOM, amount: '10000' }] },
      );
      expect(res.code).toEqual(0);
      proposalId = 1;
      const res1 = await executeMsgVoteNeutron(govClient, govWallet, proposalId);
      expect(res1.code).toEqual(0);
      // wait 15 seconds to allow the proposal to be processed
      await waitSeconds(15);
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
      const res = await executeMsgSubmitProposalV1(govClient, govWallet, 'Proposal #2', 'Proposal summary #2', '', [
        {
          typeUrl: '/neutron.cron.MsgRemoveSchedule',
          value: MsgRemoveSchedule.encode(
            MsgRemoveSchedule.fromJSON({
              authority: GOV_MODULE_ADDRESS,
              name: 'schedule1',
            }),
          ).finish(),
        },
      ],
        [{ denom: NEUTRON_DENOM, amount: '60000000' }],
        true,
        { gas: '4000000', amount: [{ denom: NEUTRON_DENOM, amount: '10000' }] },
      );
      expect(res.code).toEqual(0);
      proposalId = 2;
      const res1 = await executeMsgVoteNeutron(govClient, govWallet, proposalId);
      expect(res1.code).toEqual(0);
      // wait 15 seconds to allow the proposal to be processed
      await waitSeconds(15);
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
      const res = await executeMsgSubmitProposalV1(govClient, govWallet, 'Proposal #3', 'Proposal summary #3', '', [
        {
          typeUrl: '/neutron.cron.MsgAddSchedule',
          value: MsgAddSchedule.encode(
            MsgAddSchedule.fromJSON({
              authority: GOV_MODULE_ADDRESS,
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
              executionStage: 'EXECUTION_STAGE_BEGIN_BLOCKER',
            }),
          ).finish(),
        },
      ],
        [{ denom: NEUTRON_DENOM, amount: '60000000' }],
        true,
        { gas: '4000000', amount: [{ denom: NEUTRON_DENOM, amount: '10000' }] },
      );
      expect(res.code).toEqual(0);
      proposalId = 3;
      const res1 = await executeMsgVoteNeutron(govClient, govWallet, proposalId);
      expect(res1.code).toEqual(0);
      // wait 15 seconds to allow the proposal to be processed
      await waitSeconds(15);
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
      const res = await executeMsgSubmitProposalV1(govClient, govWallet, 'Proposal #4', 'Proposal summary #4', '', [
        {
          typeUrl: '/neutron.cron.MsgAddSchedule',
          value: MsgAddSchedule.encode(
            MsgAddSchedule.fromJSON({
              authority: GOV_MODULE_ADDRESS,
              name: 'schedule3',
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
              executionStage: 'EXECUTION_STAGE_END_BLOCKER',
            }),
          ).finish(),
        },
      ],
        [{ denom: NEUTRON_DENOM, amount: '60000000' }],
        true,
        { gas: '4000000', amount: [{ denom: NEUTRON_DENOM, amount: '10000' }] },
      );
      expect(res.code).toEqual(0);
      proposalId = 4;
      const res1 = await executeMsgVoteNeutron(govClient, govWallet, proposalId);
      expect(res1.code).toEqual(0);
      // wait 15 seconds to allow the proposal to be processed
      await waitSeconds(15);
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
