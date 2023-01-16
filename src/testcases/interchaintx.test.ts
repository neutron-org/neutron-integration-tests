import 'jest-extended';
import { cosmosclient, rest } from '@cosmos-client/core';
import { AccAddress } from '@cosmos-client/core/cjs/types';
import {
  AckFailuresResponse,
  COSMOS_DENOM,
  CosmosWrapper,
  getSequenceId,
  NEUTRON_DENOM,
  NeutronContract,
} from '../helpers/cosmos';
import { AcknowledgementResult } from '../helpers/contract_types';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { getWithAttempts, waitBlocks } from '../helpers/wait';
import { CosmosSDK } from '@cosmos-client/core/cjs/sdk';
import { getIca } from '../helpers/ica';

describe('Neutron / Interchain TXs', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm1: CosmosWrapper;
  let cm2: CosmosWrapper;
  let contractAddress: string;
  let icaAddress1: string;
  let icaAddress2: string;
  const icaId1 = 'test1';
  const icaId2 = 'test2';
  const connectionId = 'connection-0';

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm1 = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cm2 = new CosmosWrapper(
      testState.sdk2,
      testState.wallets.cosmos.demo2,
      COSMOS_DENOM,
    );
  });

  describe('Interchain Tx with multiple ICAs', () => {
    let codeId: string;
    describe('Setup', () => {
      test('store contract', async () => {
        codeId = await cm1.storeWasm(NeutronContract.INTERCHAIN_TXS);
        expect(parseInt(codeId)).toBeGreaterThan(0);
      });
      test('instantiate', async () => {
        const res = (
          await cm1.instantiate(codeId, JSON.stringify({}), 'interchaintx')
        )[0]._contract_address;

        contractAddress = res;
      });
    });
    describe('Create ICAs and setup contract', () => {
      test('create ICA1', async () => {
        const res = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            register: {
              connection_id: connectionId,
              interchain_account_id: icaId1,
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('create ICA2', async () => {
        const res = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            register: {
              connection_id: connectionId,
              interchain_account_id: icaId2,
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('multiple IBC accounts created', async () => {
        const channels = await getWithAttempts(
          cm1.sdk,
          () => cm1.listIBCChannels(),
          // Wait until there are 3 channels:
          // - one exists already, it is open for IBC transfers;
          // - two more should appear soon since we are opening them implicitly
          //   through ICA creation.
          async (channels) => channels.channels.length == 3,
        );
        expect(channels.channels).toBeArray();
        expect(channels.channels).toIncludeAllPartialMembers([
          {
            port_id: `icacontroller-${contractAddress}.test1`,
          },
          {
            port_id: `icacontroller-${contractAddress}.test2`,
          },
        ]);
      });

      test('get ica address', async () => {
        const ica1 = await getIca(
          cm1,
          contractAddress,
          icaId1,
          connectionId,
          50,
        );
        expect(ica1.interchain_account_address).toStartWith('cosmos');
        expect(ica1.interchain_account_address.length).toEqual(65);
        icaAddress1 = ica1.interchain_account_address;

        const ica2 = await getIca(
          cm1,
          contractAddress,
          icaId2,
          connectionId,
          50,
        );
        expect(ica2.interchain_account_address).toStartWith('cosmos');
        expect(ica2.interchain_account_address.length).toEqual(65);
        icaAddress2 = ica2.interchain_account_address;
      });

      test('set payer fees', async () => {
        const res = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: cm1.denom,
              ack_fee: '2000',
              recv_fee: '0',
              timeout_fee: '2000',
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('fund contract to pay fees', async () => {
        const res = await cm1.msgSend(contractAddress, '100000');
        expect(res.code).toEqual(0);
      });
      test('add some money to ICAs', async () => {
        const res1 = await cm2.msgSend(icaAddress1.toString(), '10000');
        expect(res1.code).toEqual(0);
        const res2 = await cm2.msgSend(icaAddress2.toString(), '10000');
        expect(res2.code).toEqual(0);
      });
    });
    describe('Send Interchain TX', () => {
      test('delegate from first ICA', async () => {
        const res = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: (
                testState.wallets.cosmos.val1.address as cosmosclient.ValAddress
              ).toString(),
              amount: '2000',
              denom: cm2.denom,
            },
          }),
        );
        expect(res.code).toEqual(0);
        const sequenceId = getSequenceId(res.raw_log);

        await waitForAck(cm1, contractAddress, icaId1, sequenceId);
        const qres = await getAck(cm1, contractAddress, icaId1, sequenceId);
        expect(qres).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegate'],
        });
      });
      test('check validator state', async () => {
        const res1 = await getWithAttempts(
          cm2.sdk,
          () =>
            rest.staking.delegatorDelegations(
              cm2.sdk as CosmosSDK,
              icaAddress1 as unknown as AccAddress,
            ),
          async (delegations) =>
            delegations.data.delegation_responses?.length == 1,
        );
        expect(res1.data.delegation_responses).toEqual([
          {
            balance: { amount: '2000', denom: cm2.denom },
            delegation: {
              delegator_address: icaAddress1,
              shares: '2000.000000000000000000',
              validator_address:
                'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
            },
          },
        ]);
        const res2 = await rest.staking.delegatorDelegations(
          cm2.sdk as CosmosSDK,
          icaAddress2 as unknown as AccAddress,
        );
        expect(res2.data.delegation_responses).toEqual([]);
      });
      test('check contract balance', async () => {
        const res = await cm1.queryBalances(contractAddress);
        const balance = res.balances.find((b) => b.denom === cm1.denom)?.amount;
        expect(balance).toEqual('98000');
      });
    });
    describe('Error cases', () => {
      test('delegate for unknown validator from second ICA', async () => {
        const res = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId2,
              validator: 'nonexistent_address',
              amount: '2000',
              denom: cm2.denom,
            },
          }),
        );
        expect(res.code).toEqual(0);

        const sequenceId = getSequenceId(res.raw_log);

        await waitForAck(cm1, contractAddress, icaId2, sequenceId);
        const qres = await getAck(cm1, contractAddress, icaId2, sequenceId);
        expect(qres).toMatchObject<AcknowledgementResult>({
          error: [
            'message',
            'ABCI code: 1: error handling packet on host chain: see events for details',
          ],
        });
      });
      test('undelegate from first ICA, delegate from second ICA', async () => {
        await cleanAckResults(cm1, contractAddress);
        const res1 = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            undelegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '1000',
              denom: cm2.denom,
            },
          }),
        );
        expect(res1.code).toEqual(0);

        const sequenceId1 = getSequenceId(res1.raw_log);

        const res2 = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId2,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '2000',
              denom: cm2.denom,
            },
          }),
        );
        expect(res2.code).toEqual(0);

        const sequenceId2 = getSequenceId(res2.raw_log);

        const qres1 = await waitForAck(
          cm1,
          contractAddress,
          icaId1,
          sequenceId1,
        );
        expect(qres1).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgUndelegate'],
        });

        const qres2 = await waitForAck(
          cm1,
          contractAddress,
          icaId2,
          sequenceId2,
        );
        expect(qres2).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegate'],
        });
      });
      test('delegate with timeout', async () => {
        await cleanAckResults(cm1, contractAddress);
        const res = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '10',
              denom: cm2.denom,
              timeout: 1,
            },
          }),
        );
        expect(res.code).toEqual(0);

        const sequenceId = getSequenceId(res.raw_log);

        // timeout handling may be slow, hence we wait for up to 100 blocks here
        await waitForAck(cm1, contractAddress, icaId1, sequenceId, 100);
        const qres1 = await getAck(cm1, contractAddress, icaId1, sequenceId);
        expect(qres1).toMatchObject<AcknowledgementResult>({
          timeout: 'message',
        });
      });
      test('delegate after the ICA channel was closed', async () => {
        let rawLog: any;
        try {
          rawLog = (
            await cm1.executeContract(
              contractAddress,
              JSON.stringify({
                delegate: {
                  interchain_account_id: icaId1,
                  validator: testState.wallets.cosmos.val1.address.toString(),
                  amount: '10',
                  denom: cm2.denom,
                  timeout: 1,
                },
              }),
            )
          ).raw_log;
        } catch (e) {
          rawLog = e.message;
        }
        expect(rawLog.includes('no active channel for this owner'));
      });
      describe('zero fee', () => {
        beforeAll(async () => {
          await cm1.executeContract(
            contractAddress,
            JSON.stringify({
              set_fees: {
                denom: cm1.denom,
                ack_fee: '0',
                recv_fee: '0',
                timeout_fee: '0',
              },
            }),
          );
        });
        test('delegate with zero fee', async () => {
          await expect(
            cm1.executeContract(
              contractAddress,
              JSON.stringify({
                delegate: {
                  interchain_account_id: icaId1,
                  validator: (
                    testState.wallets.cosmos.val1
                      .address as cosmosclient.ValAddress
                  ).toString(),
                  amount: '2000',
                  denom: cm2.denom,
                },
              }),
            ),
          ).rejects.toThrow(/invalid coins/);
        });
      });
      describe('insufficient funds for fee', () => {
        beforeAll(async () => {
          await cm1.executeContract(
            contractAddress,
            JSON.stringify({
              set_fees: {
                denom: cm1.denom,
                ack_fee: '9999999999',
                recv_fee: '0',
                timeout_fee: '9999999999',
              },
            }),
          );
        });
        afterAll(async () => {
          await cm1.executeContract(
            contractAddress,
            JSON.stringify({
              set_fees: {
                denom: cm1.denom,
                ack_fee: '2000',
                recv_fee: '0',
                timeout_fee: '2000',
              },
            }),
          );
        });
        test('delegate with zero fee', async () => {
          await expect(
            cm1.executeContract(
              contractAddress,
              JSON.stringify({
                delegate: {
                  interchain_account_id: icaId1,
                  validator: (
                    testState.wallets.cosmos.val1
                      .address as cosmosclient.ValAddress
                  ).toString(),
                  amount: '2000',
                  denom: cm2.denom,
                },
              }),
            ),
          ).rejects.toThrow(/insufficient funds/);
        });
      });
    });
    describe('Recreation', () => {
      test('recreate ICA1', async () => {
        const res = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            register: {
              connection_id: connectionId,
              interchain_account_id: icaId1,
            },
          }),
        );
        expect(res.code).toEqual(0);
        await getWithAttempts(
          cm1.sdk,
          async () => cm1.listIBCChannels(),
          // Wait until there are 4 channels:
          // - one exists already, it is open for IBC transfers;
          // - two channels are already opened via ICA registration before
          // - one more, we are opening it right now
          async (channels) => channels.channels.length == 4,
        );
        await getWithAttempts(
          cm1.sdk,
          () => cm1.listIBCChannels(),
          async (channels) =>
            channels.channels.find((c) => c.channel_id == 'channel-3').state ==
            'STATE_OPEN',
        );
      });
      test('delegate from first ICA after ICA recreation', async () => {
        await cleanAckResults(cm1, contractAddress);
        const res = await cm1.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              denom: cm2.denom,
              amount: '20',
            },
          }),
        );
        expect(res.code).toEqual(0);
        const sequenceId = getSequenceId(res.raw_log);

        const qres = await waitForAck(cm1, contractAddress, icaId1, sequenceId);
        expect(qres).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegate'],
        });
      });
      test('check validator state after ICA recreation', async () => {
        const res = await rest.staking.delegatorDelegations(
          cm2.sdk as CosmosSDK,
          icaAddress1 as unknown as AccAddress,
        );
        expect(res.data.delegation_responses).toEqual([
          {
            balance: { amount: '1020', denom: cm2.denom },
            delegation: {
              delegator_address: icaAddress1,
              shares: '1020.000000000000000000',
              validator_address:
                'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
            },
          },
        ]);
      });
    });

    test('delegate with sudo failure', async () => {
      await cleanAckResults(cm1, contractAddress);

      const failuresBeforeCall = await cm1.queryAckFailures(contractAddress);
      expect(failuresBeforeCall.failures.length).toEqual(0);

      // Mock sudo handler to fail
      await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_set_sudo_failure_mock: {},
        }),
      );

      // Testing ACK failure
      await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.address.toString(),
            amount: '10',
            denom: cm2.denom,
          },
        }),
      );

      await waitBlocks(cm1.sdk, 10);

      // Testing ACK timeout failure
      await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.address.toString(),
            amount: '10',
            denom: cm2.denom,
            timeout: 1,
          },
        }),
      );

      const failuresAfterCall = await getWithAttempts<AckFailuresResponse>(
        cm1.sdk,
        async () => cm1.queryAckFailures(contractAddress),
        // Wait until there 2 failure in the list
        async (data) => data.failures.length == 2,
        100,
      );

      expect(failuresAfterCall.failures).toEqual([
        expect.objectContaining({
          channel_id: 'channel-3',
          address: contractAddress,
          id: '0',
          response_type: 'ack',
        }),
        expect.objectContaining({
          address: contractAddress,
          id: '1',
          response_type: 'timeout',
        }),
      ]);

      // Restore sudo handler to state
      await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          integration_tests_unset_sudo_failure_mock: {},
        }),
      );
    });
  });
});

/**
 * cleanAckResults clears all ACK's from contract storage
 */
const cleanAckResults = (cm: CosmosWrapper, contractAddress: string) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({ clean_ack_results: {} }),
  );

/**
 * waitForAck waits until ACK appears in contract storage
 */
const waitForAck = (
  cm: CosmosWrapper,
  contractAddress: string,
  icaId: string,
  sequenceId: number,
  numAttempts = 20,
) =>
  getWithAttempts(
    cm.sdk,
    () =>
      cm.queryContract<AcknowledgementResult>(contractAddress, {
        acknowledgement_result: {
          interchain_account_id: icaId,
          sequence_id: sequenceId,
        },
      }),
    async (ack) => ack != null,
    numAttempts,
  );

const getAck = (
  cm: CosmosWrapper,
  contractAddress: string,
  icaId: string,
  sequenceId: number,
) =>
  cm.queryContract<AcknowledgementResult>(contractAddress, {
    acknowledgement_result: {
      interchain_account_id: icaId,
      sequence_id: sequenceId,
    },
  });
