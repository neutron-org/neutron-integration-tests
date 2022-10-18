import 'jest-extended';
import { cosmosclient, rest } from '@cosmos-client/core';
import { AccAddress } from '@cosmos-client/core/cjs/types';
import { COSMOS_DENOM, CosmosWrapper, NEUTRON_DENOM } from '../helpers/cosmos';
import { AcknowledgementResult } from '../helpers/contract_types';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { getWithAttempts } from '../helpers/wait';
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
    test('store contract', async () => {
      codeId = await cm1.storeWasm('neutron_interchain_txs.wasm');
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await cm1.instantiate(
        codeId,
        JSON.stringify({}),
        'interchaintx',
      );
      contractAddress = res;
      expect(res.toString()).toEqual(
        'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq',
      );
    });
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
        (channels) => channels.channels.length == 3,
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
      const ica1 = await getIca(cm1, contractAddress, icaId1, connectionId);
      expect(ica1.interchain_account_address).toStartWith('cosmos');
      expect(ica1.interchain_account_address.length).toEqual(66);
      icaAddress1 = ica1.interchain_account_address;

      const ica2 = await getIca(cm1, contractAddress, icaId2, connectionId);
      expect(ica2.interchain_account_address).toStartWith('cosmos');
      expect(ica2.interchain_account_address.length).toEqual(66);
      icaAddress2 = ica2.interchain_account_address;
    });
    test('before delegation ack storage should be empty for both accounts', async () => {
      const [res1, res2] = await Promise.all(
        [icaId1, icaId2].map((icaId) => getAck(cm1, contractAddress, icaId)),
      );
      expect(res1).toBe(null);
      expect(res2).toBe(null);
    });
    test('add some money to ICAs', async () => {
      const res1 = await cm2.msgSend(icaAddress1.toString(), '10000');
      expect(res1.code).toEqual(0);

      const res2 = await cm2.msgSend(icaAddress2.toString(), '10000');
      expect(res2.code).toEqual(0);
    });
    test('delegate from first ICA', async () => {
      await cleanAckResults(cm1, contractAddress);
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
    });
    test('check validator state', async () => {
      const res1 = await getWithAttempts(
        cm2.sdk,
        () =>
          rest.staking.delegatorDelegations(
            cm2.sdk as CosmosSDK,
            icaAddress1 as unknown as AccAddress,
          ),
        (delegations) => delegations.data.delegation_responses?.length == 1,
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
    test('check acknowledgement success', async () => {
      await waitForAck(cm1, contractAddress, icaId1);
      const res1 = await getAck(cm1, contractAddress, icaId1);
      expect(res1).toMatchObject<AcknowledgementResult>({
        success: ['/cosmos.staking.v1beta1.MsgDelegate'],
      });

      const res2 = await getAck(cm1, contractAddress, icaId2);
      expect(res2).toBe(null);
    });

    test('delegate for unknown validator from second ICA', async () => {
      await cleanAckResults(cm1, contractAddress);
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
    });
    test('check acknowledgement error', async () => {
      await waitForAck(cm1, contractAddress, icaId2);
      const res = await getAck(cm1, contractAddress, icaId2);
      expect(res).toMatchObject<AcknowledgementResult>({
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
    });

    test('check acknowledgements', async () => {
      await waitForAck(cm1, contractAddress, icaId1);
      const res1 = await getAck(cm1, contractAddress, icaId1);
      expect(res1).toMatchObject<AcknowledgementResult>({
        success: ['/cosmos.staking.v1beta1.MsgUndelegate'],
      });

      await waitForAck(cm1, contractAddress, icaId2);
      const res2 = await getAck(cm1, contractAddress, icaId2);
      expect(res2).toMatchObject<AcknowledgementResult>({
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
    });
    test('check acknowledgements after timeout', async () => {
      // timeout handling may be slow, hence we wait for up to 100 blocks here
      await waitForAck(cm1, contractAddress, icaId1, 100);
      const res1 = await getAck(cm1, contractAddress, icaId1);
      expect(res1).toMatchObject<AcknowledgementResult>({
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
        (channels) => channels.channels.length == 4,
      );
      await getWithAttempts(
        cm1.sdk,
        () => cm1.listIBCChannels(),
        (channels) =>
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
    });
    test('check acknowledgement success after ICA recreation', async () => {
      await waitForAck(cm1, contractAddress, icaId1);
      const res = await getAck(cm1, contractAddress, icaId1);
      expect(res).toMatchObject<AcknowledgementResult>({
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
  numAttempts = 20,
) =>
  getWithAttempts(
    cm.sdk,
    () =>
      cm.queryContract<AcknowledgementResult>(contractAddress, {
        acknowledgement_result: {
          interchain_account_id: icaId,
        },
      }),
    (ack) => ack != null,
    numAttempts,
  );

const getAck = (cm: CosmosWrapper, contractAddress: string, icaId: string) =>
  cm.queryContract<AcknowledgementResult>(contractAddress, {
    acknowledgement_result: { interchain_account_id: icaId },
  });
