import 'jest-extended';
import { cosmosclient, rest } from '@cosmos-client/core';
import { AccAddress } from '@cosmos-client/core/cjs/types';
import { CosmosSDK } from '@cosmos-client/core/cjs/sdk';
import {
  cosmosWrapper,
  COSMOS_DENOM,
  ica,
  NEUTRON_DENOM,
  TestStateLocalCosmosTestNet,
  types,
  wait,
} from 'neutronjs';

const config = require('../../config.json');

describe('Neutron / Interchain TXs', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: cosmosWrapper.CosmosWrapper;
  let gaiaChain: cosmosWrapper.CosmosWrapper;
  let neutronAccount: cosmosWrapper.WalletWrapper;
  let gaiaAccount: cosmosWrapper.WalletWrapper;
  let contractAddress: string;
  let icaAddress1: string;
  let icaAddress2: string;
  const icaId1 = 'test1';
  const icaId2 = 'test2';
  const connectionId = 'connection-0';

  beforeAll(async () => {
    cosmosWrapper.registerCodecs();

    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    gaiaChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      COSMOS_DENOM,
    );
    gaiaAccount = new cosmosWrapper.WalletWrapper(
      gaiaChain,
      testState.wallets.qaCosmos.genQaWal1,
    );
  });

  describe('Interchain Tx with multiple ICAs', () => {
    let codeId: number;
    describe('Setup', () => {
      test('store contract', async () => {
        codeId = await neutronAccount.storeWasm(
          types.NeutronContract.INTERCHAIN_TXS,
        );
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
      test('multiple IBC accounts created', async () => {
        const channels = await wait.getWithAttempts(
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
        const ica1 = await ica.getIca(
          neutronChain,
          contractAddress,
          icaId1,
          connectionId,
          50,
        );
        expect(ica1.interchain_account_address).toStartWith('cosmos');
        expect(ica1.interchain_account_address.length).toEqual(65);
        icaAddress1 = ica1.interchain_account_address;

        const ica2 = await ica.getIca(
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
      test('fund contract to pay fees', async () => {
        const res = await neutronAccount.msgSend(contractAddress, '100000');
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
        const sequenceId = cosmosWrapper.getSequenceId(res.raw_log);

        await waitForAck(neutronChain, contractAddress, icaId1, sequenceId);
        const qres = await getAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(qres).toMatchObject<types.AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegate'],
        });
      });
      test('check validator state', async () => {
        const res1 = await wait.getWithAttempts(
          gaiaChain.blockWaiter,
          () =>
            rest.staking.delegatorDelegations(
              gaiaChain.sdk as CosmosSDK,
              icaAddress1 as unknown as AccAddress,
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
        const res2 = await rest.staking.delegatorDelegations(
          gaiaChain.sdk as CosmosSDK,
          icaAddress2 as unknown as AccAddress,
        );
        expect(res2.data.delegation_responses).toEqual([]);
      });
      test('check contract balance', async () => {
        const res = await neutronChain.queryBalances(contractAddress);
        const balance = res.balances.find(
          (b) => b.denom === neutronChain.denom,
        )?.amount;
        expect(balance).toEqual('98000');
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
        const sequenceId = getSequenceId(res.raw_log);

        await waitForAck(neutronChain, contractAddress, icaId1, sequenceId);
        const qres = await getAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(qres).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegate'],
        });

        const ackSequenceId = sequenceId + 1;
        await waitForAck(neutronChain, contractAddress, icaId1, ackSequenceId);
        expect(qres).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegate'],
        });
      });
      test('check validator state', async () => {
        const res1 = await getWithAttempts(
          gaiaChain.blockWaiter,
          () =>
            rest.staking.delegatorDelegations(
              gaiaChain.sdk as CosmosSDK,
              icaAddress1 as unknown as AccAddress,
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
        const res2 = await rest.staking.delegatorDelegations(
          gaiaChain.sdk as CosmosSDK,
          icaAddress2 as unknown as AccAddress,
        );
        expect(res2.data.delegation_responses).toEqual([]);
      });
      test('check contract balance', async () => {
        const res = await neutronChain.queryBalances(contractAddress);
        const balance = res.balances.find(
          (b) => b.denom === neutronChain.denom,
        )?.amount;
        // two interchain txs inside (2000 * 2 = 4000)
        expect(balance).toEqual('94000');
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

        const sequenceId = cosmosWrapper.getSequenceId(res.raw_log);

        await waitForAck(neutronChain, contractAddress, icaId2, sequenceId);
        const qres = await getAck(
          neutronChain,
          contractAddress,
          icaId2,
          sequenceId,
        );
        expect(qres).toMatchObject<types.AcknowledgementResult>({
          error: [
            'message',
            'ABCI code: 1: error handling packet: see events for details',
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

        const sequenceId1 = cosmosWrapper.getSequenceId(res1.raw_log);

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

        const sequenceId2 = cosmosWrapper.getSequenceId(res2.raw_log);

        const qres1 = await waitForAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId1,
        );
        expect(qres1).toMatchObject<types.AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgUndelegate'],
        });

        const qres2 = await waitForAck(
          neutronChain,
          contractAddress,
          icaId2,
          sequenceId2,
        );
        expect(qres2).toMatchObject<types.AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegate'],
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

        const sequenceId = cosmosWrapper.getSequenceId(res.raw_log);

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
        expect(qres1).toMatchObject<types.AcknowledgementResult>({
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
        await wait.getWithAttempts(
          neutronChain.blockWaiter,
          async () => neutronChain.listIBCChannels(),
          // Wait until there are 4 channels:
          // - one exists already, it is open for IBC transfers;
          // - two channels are already opened via ICA registration before
          // - one more, we are opening it right now
          async (channels) => channels.channels.length == 4,
        );
        await wait.getWithAttempts(
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
        const sequenceId = cosmosWrapper.getSequenceId(res.raw_log);

        const qres = await waitForAck(
          neutronChain,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(qres).toMatchObject<types.AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegate'],
        });
      });
      test('check validator state after ICA recreation', async () => {
        const res = await rest.staking.delegatorDelegations(
          gaiaChain.sdk as CosmosSDK,
          icaAddress1 as unknown as AccAddress,
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
            integration_tests_set_sudo_failure_mock: {},
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

      test('timeout failure during sudo', async () => {
        // Mock sudo handler to fail
        await neutronAccount.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_failure_mock: {},
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

      test('check stored failures and acks', async () => {
        const failures = await neutronChain.queryAckFailures(contractAddress);
        // 3 ack failures, 1 timeout failure, just as described in the tests above
        expect(failures.failures).toEqual([
          {
            channel_id: 'channel-3',
            address:
              'neutron1m0z0kk0qqug74n9u9ul23e28x5fszr628h20xwt6jywjpp64xn4qatgvm0',
            id: '0',
            ack_id: '2',
            ack_type: 'ack',
          },
          {
            channel_id: 'channel-3',
            address:
              'neutron1m0z0kk0qqug74n9u9ul23e28x5fszr628h20xwt6jywjpp64xn4qatgvm0',
            id: '1',
            ack_id: '3',
            ack_type: 'ack',
          },
          {
            channel_id: 'channel-3',
            address:
              'neutron1m0z0kk0qqug74n9u9ul23e28x5fszr628h20xwt6jywjpp64xn4qatgvm0',
            id: '2',
            ack_id: '4',
            ack_type: 'ack',
          },
          {
            channel_id: 'channel-3',
            address:
              'neutron1m0z0kk0qqug74n9u9ul23e28x5fszr628h20xwt6jywjpp64xn4qatgvm0',
            id: '3',
            ack_id: '5',
            ack_type: 'timeout',
          },
        ]);

        const acks = await getAcks(neutronChain, contractAddress);
        // no acks at all because all sudo handling cases resulted in an error
        expect(acks).toEqual([]);
      });
    });
  });
});

/**
 * cleanAckResults clears all ACK's from contract storage
 */
const cleanAckResults = (
  cm: cosmosWrapper.WalletWrapper,
  contractAddress: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({ clean_ack_results: {} }),
  );

/**
 * waitForAck waits until ACK appears in contract storage
 */
const waitForAck = (
  cm: cosmosWrapper.CosmosWrapper,
  contractAddress: string,
  icaId: string,
  sequenceId: number,
  numAttempts = 20,
) =>
  wait.getWithAttempts(
    cm.blockWaiter,
    () =>
      cm.queryContract<types.AcknowledgementResult>(contractAddress, {
        acknowledgement_result: {
          interchain_account_id: icaId,
          sequence_id: sequenceId,
        },
      }),
    async (ack) => ack != null,
    numAttempts,
  );

const getAck = (
  cm: cosmosWrapper.CosmosWrapper,
  contractAddress: string,
  icaId: string,
  sequenceId: number,
) =>
  cm.queryContract<types.AcknowledgementResult>(contractAddress, {
    acknowledgement_result: {
      interchain_account_id: icaId,
      sequence_id: sequenceId,
    },
  });

const getAcks = (cm: cosmosWrapper.CosmosWrapper, contractAddress: string) =>
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
