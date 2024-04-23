import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  COSMOS_DENOM,
  NEUTRON_DENOM,
  getSequenceId,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import cosmosclient from '@cosmos-client/core';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { getWithAttempts } from '@neutron-org/neutronjsplus/dist/wait';
import {
  AckFailuresResponse,
  AcknowledgementResult,
  NeutronContract,
} from '@neutron-org/neutronjsplus/dist/types';
import { getIca } from '@neutron-org/neutronjsplus/dist/ica';

const config = require('../../config.json');

describe('Neutron / Interchain TXs', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let gaiaChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let gaiaAccount: WalletWrapper;
  let contractAddress: string;
  let icaAddress1: string;
  let icaAddress2: string;

  const icaId1 = 'test1';
  const icaId2 = 'test2';
  const connectionId = 'connection-0';

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    gaiaChain = new CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      COSMOS_DENOM,
    );
    gaiaAccount = new WalletWrapper(
      gaiaChain,
      testState.wallets.qaCosmos.genQaWal1,
    );
  });

  describe('Interchain Tx with multiple ICAs', () => {
    let codeId: number;
    describe('Setup', () => {
      test('store contract', async () => {
        codeId = await neutronAccount.storeWasm(NeutronContract.INTERCHAIN_TXS);
        expect(codeId).toBeGreaterThan(0);
      });
      test('instantiate', async () => {
        const res = (
          await neutronAccount.instantiateContract(
            codeId,
            JSON.stringify({}),
            'interchaintx',
          )
        )[0]._contract_address;

        contractAddress = res;
      });
    });
    describe('Create ICAs and setup contract', () => {
      test('fund contract to pay fees', async () => {
        const res = await neutronAccount.msgSend(contractAddress, '10000000');
        expect(res.code).toEqual(0);
      });
      test('create ICA1', async () => {
        const res = await neutronAccount.executeContract(
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
        const res = await neutronAccount.executeContract(
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
      test('check contract balance', async () => {
        const res = await neutronChain.queryBalances(contractAddress);
        const balance = res.balances.find(
          (b) => b.denom === neutronChain.denom,
        )?.amount;
        expect(balance).toEqual('8000000');
      });
      test('multiple IBC accounts created', async () => {
        const channels = await getWithAttempts(
          neutronChain.blockWaiter,
          () => neutronChain.listIBCChannels(),
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
          neutronChain,
          contractAddress,
          icaId1,
          connectionId,
          50,
        );
        expect(ica1.interchain_account_address).toStartWith('cosmos');
        expect(ica1.interchain_account_address.length).toEqual(65);
        icaAddress1 = ica1.interchain_account_address;

        const ica2 = await getIca(
          neutronChain,
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
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: neutronChain.denom,
              ack_fee: '2000',
              recv_fee: '0',
              timeout_fee: '2000',
            },
          }),
        );
        expect(res.code).toEqual(0);
      });

      test('add some money to ICAs', async () => {
        const res1 = await gaiaAccount.msgSend(icaAddress1.toString(), '10000');
        expect(res1.code).toEqual(0);
        const res2 = await gaiaAccount.msgSend(icaAddress2.toString(), '10000');
        expect(res2.code).toEqual(0);
      });
    });
    describe('Send Interchain TX', () => {
      test('delegate from first ICA', async () => {
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: (
                testState.wallets.cosmos.val1.address as cosmosclient.ValAddress
              ).toString(),
              amount: '1000',
              denom: gaiaChain.denom,
            },
          }),
        );
        expect(res.code).toEqual(0);
        console.log(JSON.stringify(res.events));
        const sequenceId = getSequenceId(res);
        await waitForAck(neutronChain, contractAddress, icaId1, sequenceId);
        const qres = await getAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId,
        );
        const ares = await getAcks(neutronChain, contractAddress);
        expect(qres).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });
      });
      test('check validator state', async () => {
        const res1 = await getWithAttempts(
          gaiaChain.blockWaiter,
          () =>
            cosmosclient.rest.staking.delegatorDelegations(
              gaiaChain.sdk as cosmosclient.CosmosSDK,
              icaAddress1 as unknown as cosmosclient.AccAddress,
            ),
          async (delegations) =>
            delegations.data.delegation_responses?.length == 1,
        );
        expect(res1.data.delegation_responses).toEqual([
          {
            balance: { amount: '1000', denom: gaiaChain.denom },
            delegation: {
              delegator_address: icaAddress1,
              shares: '1000.000000000000000000',
              validator_address:
                'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
            },
          },
        ]);
        const res2 = await cosmosclient.rest.staking.delegatorDelegations(
          gaiaChain.sdk as cosmosclient.CosmosSDK,
          icaAddress2 as unknown as cosmosclient.AccAddress,
        );
        expect(res2.data.delegation_responses).toEqual([]);
      });
      test('check contract balance', async () => {
        const res = await neutronChain.queryBalances(contractAddress);
        const balance = res.balances.find(
          (b) => b.denom === neutronChain.denom,
        )?.amount;
        expect(balance).toEqual('7998000');
      });
    });

    describe('DOUBLE ACK - Send Interchain TX', () => {
      test('delegate from first ICA', async () => {
        // it will delegate two times of passed amount - first from contract call, and second from successful sudo IBC response
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate_double_ack: {
              interchain_account_id: icaId1,
              validator: (
                testState.wallets.cosmos.val1.address as cosmosclient.ValAddress
              ).toString(),
              amount: '500',
              denom: gaiaChain.denom,
            },
          }),
        );
        expect(res.code).toEqual(0);
        const sequenceId = getSequenceId(res);

        await waitForAck(neutronChain, contractAddress, icaId1, sequenceId);
        const qres = await getAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(qres).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });

        const ackSequenceId = sequenceId + 1;
        await waitForAck(neutronChain, contractAddress, icaId1, ackSequenceId);
        expect(qres).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });
      });
      test('check validator state', async () => {
        const res1 = await getWithAttempts(
          gaiaChain.blockWaiter,
          () =>
            cosmosclient.rest.staking.delegatorDelegations(
              gaiaChain.sdk as cosmosclient.CosmosSDK,
              icaAddress1 as unknown as cosmosclient.AccAddress,
            ),
          async (delegations) =>
            delegations.data.delegation_responses?.length === 1,
        );
        expect(res1.data.delegation_responses).toEqual([
          {
            balance: { amount: '2000', denom: gaiaChain.denom },
            delegation: {
              delegator_address: icaAddress1,
              shares: '2000.000000000000000000',
              validator_address:
                'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
            },
          },
        ]);
        const res2 = await cosmosclient.rest.staking.delegatorDelegations(
          gaiaChain.sdk as cosmosclient.CosmosSDK,
          icaAddress2 as unknown as cosmosclient.AccAddress,
        );
        expect(res2.data.delegation_responses).toEqual([]);
      });
      test('check contract balance', async () => {
        const res = await neutronChain.queryBalances(contractAddress);
        const balance = res.balances.find(
          (b) => b.denom === neutronChain.denom,
        )?.amount;
        // two interchain txs inside (2000 * 2 = 4000)
        expect(balance).toEqual('7994000');
      });
    });

    describe('Error cases', () => {
      test('delegate for unknown validator from second ICA', async () => {
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId2,
              validator: 'nonexistent_address',
              amount: '2000',
              denom: gaiaChain.denom,
            },
          }),
        );
        expect(res.code).toEqual(0);

        const sequenceId = getSequenceId(res);

        await waitForAck(neutronChain, contractAddress, icaId2, sequenceId);
        const qres = await getAck(
          neutronChain,
          contractAddress,
          icaId2,
          sequenceId,
        );
        expect(qres).toMatchObject<AcknowledgementResult>({
          error: [
            'message',
            'ABCI code: 7: error handling packet: see events for details',
          ],
        });
      });
      test('undelegate from first ICA, delegate from second ICA', async () => {
        await cleanAckResults(neutronAccount, contractAddress);
        const res1 = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            undelegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '1000',
              denom: gaiaChain.denom,
            },
          }),
        );
        expect(res1.code).toEqual(0);

        const sequenceId1 = getSequenceId(res1);

        const res2 = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId2,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '2000',
              denom: gaiaChain.denom,
            },
          }),
        );
        expect(res2.code).toEqual(0);

        const sequenceId2 = getSequenceId(res2);

        const qres1 = await waitForAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId1,
        );
        expect(qres1).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgUndelegateResponse'],
        });

        const qres2 = await waitForAck(
          neutronChain,
          contractAddress,
          icaId2,
          sequenceId2,
        );
        expect(qres2).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });
      });
      test('delegate with timeout', async () => {
        await cleanAckResults(neutronAccount, contractAddress);
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '10',
              denom: gaiaChain.denom,
              timeout: 1,
            },
          }),
        );
        expect(res.code).toEqual(0);

        const sequenceId = getSequenceId(res);

        // timeout handling may be slow, hence we wait for up to 100 blocks here
        await waitForAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId,
          100,
        );
        const qres1 = await getAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(qres1).toMatchObject<AcknowledgementResult>({
          timeout: 'message',
        });
      });
      test('delegate after the ICA channel was closed', async () => {
        let rawLog: string;
        try {
          rawLog =
            (
              await neutronAccount.executeContract(
                contractAddress,
                JSON.stringify({
                  delegate: {
                    interchain_account_id: icaId1,
                    validator: testState.wallets.cosmos.val1.address.toString(),
                    amount: '10',
                    denom: gaiaChain.denom,
                    timeout: 1,
                  },
                }),
              )
            ).raw_log || '';
        } catch (e) {
          rawLog = e.message;
        }
        expect(rawLog.includes('no active channel for this owner'));
      });
      describe('zero fee', () => {
        beforeAll(async () => {
          await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              set_fees: {
                denom: neutronChain.denom,
                ack_fee: '0',
                recv_fee: '0',
                timeout_fee: '0',
              },
            }),
          );
        });
        test('delegate with zero fee', async () => {
          await expect(
            neutronAccount.executeContract(
              contractAddress,
              JSON.stringify({
                delegate: {
                  interchain_account_id: icaId1,
                  validator: (
                    testState.wallets.cosmos.val1
                      .address as cosmosclient.ValAddress
                  ).toString(),
                  amount: '2000',
                  denom: gaiaChain.denom,
                },
              }),
            ),
          ).rejects.toThrow(/invalid coins/);
        });
      });
      describe('insufficient funds for fee', () => {
        beforeAll(async () => {
          await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              set_fees: {
                denom: neutronChain.denom,
                ack_fee: '9999999999',
                recv_fee: '0',
                timeout_fee: '9999999999',
              },
            }),
          );
        });
        afterAll(async () => {
          await neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              set_fees: {
                denom: neutronChain.denom,
                ack_fee: '2000',
                recv_fee: '0',
                timeout_fee: '2000',
              },
            }),
          );
        });
        test('delegate with zero fee', async () => {
          await expect(
            neutronAccount.executeContract(
              contractAddress,
              JSON.stringify({
                delegate: {
                  interchain_account_id: icaId1,
                  validator: (
                    testState.wallets.cosmos.val1
                      .address as cosmosclient.ValAddress
                  ).toString(),
                  amount: '2000',
                  denom: gaiaChain.denom,
                },
              }),
            ),
          ).rejects.toThrow(/insufficient funds/);
        });
      });
    });
    describe('Recreation', () => {
      test('recreate ICA1', async () => {
        const res = await neutronAccount.executeContract(
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
          neutronChain.blockWaiter,
          async () => neutronChain.listIBCChannels(),
          // Wait until there are 4 channels:
          // - one exists already, it is open for IBC transfers;
          // - two channels are already opened via ICA registration before
          // - one more, we are opening it right now
          async (channels) => channels.channels.length == 4,
        );
        await getWithAttempts(
          neutronChain.blockWaiter,
          () => neutronChain.listIBCChannels(),
          async (channels) =>
            channels.channels.find((c) => c.channel_id == 'channel-3')?.state ==
            'STATE_OPEN',
        );
      });
      test('delegate from first ICA after ICA recreation', async () => {
        await cleanAckResults(neutronAccount, contractAddress);
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              denom: gaiaChain.denom,
              amount: '20',
            },
          }),
        );
        expect(res.code).toEqual(0);
        const sequenceId = getSequenceId(res);

        const qres = await waitForAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(qres).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });
      });
      test('check validator state after ICA recreation', async () => {
        const res = await cosmosclient.rest.staking.delegatorDelegations(
          gaiaChain.sdk as cosmosclient.CosmosSDK,
          icaAddress1 as unknown as cosmosclient.AccAddress,
        );
        expect(res.data.delegation_responses).toEqual([
          {
            balance: { amount: '1020', denom: gaiaChain.denom },
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

    describe('delegate with sudo failure', () => {
      beforeAll(async () => {
        await cleanAckResults(neutronAccount, contractAddress);

        const failures = await neutronChain.queryAckFailures(contractAddress);
        expect(failures.failures.length).toEqual(0);

        const acks = await getAcks(neutronChain, contractAddress);
        expect(acks.length).toEqual(0);
      });

      test('ack failure during sudo', async () => {
        // Mock sudo handler to fail
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_failure_mock: { state: 'enabled' },
          }),
        );

        // Testing ACK failure
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '10',
              denom: gaiaChain.denom,
            },
          }),
        );

        // wait until sudo is called and processed and failure is recorder
        await getWithAttempts<AckFailuresResponse>(
          neutronChain.blockWaiter,
          async () => neutronChain.queryAckFailures(contractAddress),
          async (data) => data.failures.length == 1,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronChain, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_unset_sudo_failure_mock: {},
          }),
        );
      });

      test('ack failure during sudo submsg', async () => {
        // Mock sudo handler to fail on submsg
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_submsg_failure_mock: {},
          }),
        );

        // Testing ACK failure
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '10',
              denom: gaiaChain.denom,
            },
          }),
        );

        // wait until sudo is called and processed and failure is recorder
        await getWithAttempts<AckFailuresResponse>(
          neutronChain.blockWaiter,
          async () => neutronChain.queryAckFailures(contractAddress),
          async (data) => data.failures.length == 2,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronChain, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_unset_sudo_failure_mock: {},
          }),
        );
      });

      test('ack failure during sudo submsg reply', async () => {
        // Mock sudo handler to fail on submsg reply
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_submsg_reply_failure_mock: {},
          }),
        );

        // Testing ACK failure
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '10',
              denom: gaiaChain.denom,
            },
          }),
        );

        // wait until sudo is called and processed and failure is recorder
        await getWithAttempts<AckFailuresResponse>(
          neutronChain.blockWaiter,
          async () => neutronChain.queryAckFailures(contractAddress),
          async (data) => data.failures.length == 3,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronChain, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_unset_sudo_failure_mock: {},
          }),
        );
      });

      test('ack failure during sudo out of gas', async () => {
        // Mock sudo handler to fail
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_failure_mock: {
              state: 'enabled_infinite_loop',
            },
          }),
        );

        // Testing ACK failure
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '10',
              denom: gaiaChain.denom,
            },
          }),
        );

        // wait until sudo is called and processed and failure is recorder
        await getWithAttempts<AckFailuresResponse>(
          neutronChain.blockWaiter,
          async () => neutronChain.queryAckFailures(contractAddress),
          async (data) => data.failures.length == 4,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronChain, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_unset_sudo_failure_mock: {},
          }),
        );
      });

      test('timeout failure during sudo', async () => {
        // Mock sudo handler to fail
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_failure_mock: { state: 'enabled' },
          }),
        );

        // Testing timeout failure
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '10',
              denom: gaiaChain.denom,
              timeout: 1,
            },
          }),
        );

        // wait until sudo is called and processed and failure is recorder
        await getWithAttempts<AckFailuresResponse>(
          neutronChain.blockWaiter,
          async () => neutronChain.queryAckFailures(contractAddress),
          async (data) => data.failures.length == 5,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronChain, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_unset_sudo_failure_mock: {},
          }),
        );
      });

      test('out of gas failure during sudo timeout', async () => {
        // Mock sudo handler to fail
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_failure_mock: {
              state: 'enabled_infinite_loop',
            },
          }),
        );

        // Testing timeout failure
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            delegate: {
              interchain_account_id: icaId2,
              validator: testState.wallets.cosmos.val1.address.toString(),
              amount: '10',
              denom: gaiaChain.denom,
              timeout: 1,
            },
          }),
        );

        // wait until sudo is called and processed and failure is recorder
        await getWithAttempts<AckFailuresResponse>(
          neutronChain.blockWaiter,
          async () => neutronChain.queryAckFailures(contractAddress),
          async (data) => data.failures.length == 6,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronChain, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_unset_sudo_failure_mock: {},
          }),
        );
      });

      test('check stored failures and acks', async () => {
        const failures = await neutronChain.queryAckFailures(contractAddress);
        // 4 ack failures, 2 timeout failure, just as described in the tests above
        expect(failures.failures).toEqual([
          expect.objectContaining({
            address: contractAddress,
            id: '0',
            error: 'codespace: wasm, code: 5', // execute wasm contract failer
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '1',
            error: 'codespace: wasm, code: 5', // execute wasm contract failer
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '2',
            error: 'codespace: wasm, code: 5', // execute wasm contract failer
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '3',
            error: 'codespace: contractmanager, code: 1103', // contractmanager sudo limit exceeded
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '4',
            error: 'codespace: wasm, code: 5', // execute wasm contract failer
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '5',
            error: 'codespace: contractmanager, code: 1103', // contractmanager sudo limit exceeded
          }),
        ]);

        const acks = await getAcks(neutronChain, contractAddress);
        // no acks at all because all sudo handling cases resulted in an error
        expect(acks).toEqual([]);
      });

      test('failed attempt to resubmit failure', async () => {
        // Mock sudo handler to fail
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_failure_mock: {
              state: 'enabled',
            },
          }),
        );

        await neutronChain.blockWaiter.waitBlocks(5);

        // Try to resubmit failure
        const failuresResBefore = await neutronChain.queryAckFailures(
          contractAddress,
        );
        await expect(
          neutronAccount.executeContract(
            contractAddress,
            JSON.stringify({
              resubmit_failure: {
                failure_id: +failuresResBefore.failures[0].id,
              },
            }),
          ),
        ).rejects.toThrowError();

        await neutronChain.blockWaiter.waitBlocks(5);

        // check that failures count is the same
        const failuresResAfter = await neutronChain.queryAckFailures(
          contractAddress,
        );
        expect(failuresResAfter.failures.length).toEqual(6);

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronChain, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_unset_sudo_failure_mock: {},
          }),
        );
        await neutronChain.blockWaiter.waitBlocks(5);
      });

      test('successful resubmit failure', async () => {
        // Resubmit failure
        const failuresResBefore = await neutronChain.queryAckFailures(
          contractAddress,
        );
        const failure = failuresResBefore.failures[0];
        const failureId = failure.id;
        const res = await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            resubmit_failure: {
              failure_id: +failureId,
            },
          }),
        );
        expect(res.code).toBe(0);

        await neutronChain.blockWaiter.waitBlocks(5);

        // check that failures count is changed
        const failuresResAfter = await neutronChain.queryAckFailures(
          contractAddress,
        );
        expect(failuresResAfter.failures.length).toEqual(5);

        // make sure contract's state has been changed
        const acks = await getAcks(neutronChain, contractAddress);
        expect(acks.length).toEqual(1);
        expect(acks[0].sequence_id).toEqual(
          +JSON.parse(Buffer.from(failure.sudo_payload, 'base64').toString())
            .response.request.sequence,
        );
      });
    });
  });
});

/**
 * cleanAckResults clears all ACK's from contract storage
 */
const cleanAckResults = (cm: WalletWrapper, contractAddress: string) =>
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
    cm.blockWaiter,
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

const getAcks = (cm: CosmosWrapper, contractAddress: string) =>
  cm.queryContract<AcksResponse[]>(contractAddress, {
    acknowledgement_results: {},
  });

type AcksResponse = {
  ack_result: {
    success: any[];
    error: any[];
    timeout: any[];
  };
  port_id: string;
  sequence_id: number;
};
