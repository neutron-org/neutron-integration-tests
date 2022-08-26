import 'jest-extended';
import { rest } from '@cosmos-client/core';
import { AccAddress } from '@cosmos-client/core/cjs/types';
import { CosmosWrapper } from '../helpers/cosmos';
import { AcknowledgementResult } from '../helpers/contract_types';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { wait } from '../helpers/sleep';

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
    cm1 = new CosmosWrapper(testState.sdk1, testState.wallets.demo1);
    cm2 = new CosmosWrapper(testState.sdk2, testState.wallets.demo2);
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
      const channels = await cm1.listIBCChannels();
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
      const ica1 = await cm1.queryContractWithWait<{
        interchain_account_address: string;
      }>(contractAddress, {
        interchain_account_address: {
          interchain_account_id: icaId1,
          connection_id: connectionId,
        },
      });
      expect(ica1.interchain_account_address).toStartWith('neutron');
      expect(ica1.interchain_account_address.length).toEqual(66);
      icaAddress1 = ica1.interchain_account_address;

      const ica2 = await cm1.queryContractWithWait<{
        interchain_account_address: string;
      }>(contractAddress, {
        interchain_account_address: {
          interchain_account_id: icaId2,
          connection_id: connectionId,
        },
      });
      expect(ica2.interchain_account_address).toStartWith('neutron');
      expect(ica2.interchain_account_address.length).toEqual(66);
      icaAddress2 = ica2.interchain_account_address;
    });
    test('before delegation ack storage should be empty for both accounts', async () => {
      const res1 = await cm1.queryContract<AcknowledgementResult>(
        contractAddress,
        {
          acknowledgement_result: { interchain_account_id: icaId1 },
        },
      );
      expect(res1).toBe(null);
      const res2 = await cm1.queryContract<AcknowledgementResult>(
        contractAddress,
        {
          acknowledgement_result: { interchain_account_id: icaId2 },
        },
      );
      expect(res2).toBe(null);
    });
    test('add some money to ICAs', async () => {
      const res1 = await cm2.msgSend(icaAddress1.toString(), '10000');
      expect(res1.code).toEqual(0);

      const res2 = await cm2.msgSend(icaAddress2.toString(), '10000');
      expect(res2.code).toEqual(0);
    });
    test('delegate from first ICA', async () => {
      const res = await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.val2.address.toString(),
            amount: '2000',
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
    test('check validator state', async () => {
      const res1 = await rest.staking.delegatorDelegations(
        cm2.sdk,
        icaAddress1 as unknown as AccAddress,
      );
      expect(res1.data.delegation_responses).toEqual([
        {
          // FIXME: 'stake'
          balance: { amount: '2000', denom: 'stake' },
          delegation: {
            delegator_address: icaAddress1,
            shares: '2000.000000000000000000',
            validator_address:
              'neutronvaloper1qnk2n4nlkpw9xfqntladh74w6ujtulwnqshepx',
          },
        },
      ]);
      const res2 = await rest.staking.delegatorDelegations(
        cm2.sdk,
        icaAddress2 as unknown as AccAddress,
      );
      expect(res2.data.delegation_responses).toEqual([]);
    });
    test('check acknowledgement success', async () => {
      const res1 = await cm1.queryContractWithWait<AcknowledgementResult>(
        contractAddress,
        {
          acknowledgement_result: { interchain_account_id: icaId1 },
        },
      );
      expect(res1).toMatchObject<AcknowledgementResult>({
        success: ['/cosmos.staking.v1beta1.MsgDelegate'],
      });
      const res2 = await cm1.queryContract<AcknowledgementResult>(
        contractAddress,
        {
          acknowledgement_result: { interchain_account_id: icaId2 },
        },
      );
      expect(res2).toBe(null);
    });

    test('delegate for unknown validator from second ICA', async () => {
      const res = await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          delegate: {
            interchain_account_id: icaId2,
            validator: 'nonexistent_address',
            amount: '2000',
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
    test('check acknowledgement error', async () => {
      const res = await cm1.queryContractWithWait<AcknowledgementResult>(
        contractAddress,
        {
          acknowledgement_result: {
            interchain_account_id: icaId2,
          },
        },
      );
      expect(res).toMatchObject<AcknowledgementResult>({
        error: [
          'message',
          'ABCI code: 1: error handling packet on host chain: see events for details',
        ],
      });
    });

    test('undelegate from first ICA, delegate from second ICA', async () => {
      const res1 = await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          undelegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.val2.address.toString(),
            amount: '1000',
          },
        }),
      );
      expect(res1.code).toEqual(0);

      const res2 = await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          delegate: {
            interchain_account_id: icaId2,
            validator: testState.wallets.val2.address.toString(),
            amount: '2000',
          },
        }),
      );
      expect(res2.code).toEqual(0);
    });

    test('check acknowledgements', async () => {
      const res1 = await cm1.queryContractWithWait<AcknowledgementResult>(
        contractAddress,
        {
          acknowledgement_result: { interchain_account_id: icaId1 },
        },
      );
      expect(res1).toMatchObject<AcknowledgementResult>({
        success: ['/cosmos.staking.v1beta1.MsgUndelegate'],
      });
      const res2 = await cm1.queryContractWithWait<AcknowledgementResult>(
        contractAddress,
        {
          acknowledgement_result: { interchain_account_id: icaId2 },
        },
      );
      expect(res2).toMatchObject<AcknowledgementResult>({
        success: ['/cosmos.staking.v1beta1.MsgDelegate'],
      });
    });
    test('delegate with timeout', async () => {
      const res = await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.val2.address.toString(),
            amount: '10',
            timeout: 1,
          },
        }),
      );
      expect(res.code).toEqual(0);
      await wait(20000); // we need to wait some time to make sure the hermes started timeout logic
    });
    test('check acknowledgements after timeout', async () => {
      const res1 = await cm1.queryContractWithWait<AcknowledgementResult>(
        contractAddress,
        {
          acknowledgement_result: { interchain_account_id: icaId1 },
        },
      );
      expect(res1).toMatchObject<AcknowledgementResult>({
        timeout: 'message',
      });
    });
    test('delegate after the ICA channel was closed', async () => {
      const res = await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.val2.address.toString(),
            amount: '10',
            timeout: 1,
          },
        }),
      );
      expect(res.raw_log.includes('no active channel for this owner'));
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
      await wait(20000);
    });
    test('delegate from first ICA after ICA recreation', async () => {
      const res = await cm1.executeContract(
        contractAddress,
        JSON.stringify({
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.val2.address.toString(),
            amount: '20',
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
    test('check acknowledgement success after ICA recreation', async () => {
      const res1 = await cm1.queryContractWithWait<AcknowledgementResult>(
        contractAddress,
        {
          acknowledgement_result: { interchain_account_id: icaId1 },
        },
      );
      expect(res1).toMatchObject<AcknowledgementResult>({
        success: ['/cosmos.staking.v1beta1.MsgDelegate'],
      });
    });
    test('check validator state after ICA recreation', async () => {
      const res1 = await rest.staking.delegatorDelegations(
        cm2.sdk,
        icaAddress1 as unknown as AccAddress,
      );
      expect(res1.data.delegation_responses).toEqual([
        {
          // FIXME: 'stake'
          balance: { amount: '1020', denom: 'stake' },
          delegation: {
            delegator_address: icaAddress1,
            shares: '1020.000000000000000000',
            validator_address:
              'neutronvaloper1qnk2n4nlkpw9xfqntladh74w6ujtulwnqshepx',
          },
        },
      ]);
    });
  });
});
