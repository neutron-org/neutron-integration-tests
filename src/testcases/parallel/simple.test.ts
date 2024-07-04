import { Registry } from '@cosmjs/proto-signing';
import { Suite, inject } from 'vitest';
import { createLocalState, LocalState } from '../../helpers/localState';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { WasmWrapper, wasm } from '../../helpers/wasmClient';
import { MsgTransfer } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/tx';
import {
  QueryClientImpl as ContractManagerQuery,
  QueryFailuresResponse,
} from '@neutron-org/neutronjs/neutron/contractmanager/query';
import { QueryClientImpl as BankQuery } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query';
import { QueryClientImpl as IbcQuery } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/query';
import { neutronTypes } from '@neutron-org/neutronjsplus/dist/neutronTypes';
import { getWithAttempts } from '../../helpers/getWithAttempts';
import {
  COSMOS_DENOM,
  IBC_RELAYER_NEUTRON_ADDRESS,
  NEUTRON_CONTRACT,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { getIBCDenom } from '@neutron-org/neutronjsplus/dist/cosmos';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';

const config = require('../../config.json');

const TRANSFER_CHANNEL = 'channel-0';

const IBC_TOKEN_DENOM =
  'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';

const UATOM_IBC_TO_NEUTRON_DENOM =
  'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';

describe('Neutron / Simple', () => {
  let testState: LocalState;

  let neutronClient: WasmWrapper;
  let gaiaClient: WasmWrapper;
  let gaiaAccount2: Wallet;

  let ibcContract: string;
  let receiverContract: string;

  let contractManagerQuery: ContractManagerQuery;
  let bankQuery: BankQuery;
  let ibcQuery: IbcQuery;

  beforeAll(async (suite: Suite) => {
    testState = await createLocalState(config, inject('mnemonics'), suite);

    const neutronAccount = await testState.nextWallet('neutron');
    neutronClient = await wasm(
      testState.rpcNeutron,
      neutronAccount,
      NEUTRON_DENOM,
      new Registry(neutronTypes),
    );
    const gaiaAccount = await testState.nextWallet('cosmos');
    gaiaAccount2 = await testState.nextWallet('cosmos');
    gaiaClient = await wasm(
      testState.rpcGaia,
      gaiaAccount,
      COSMOS_DENOM,
      new Registry(neutronTypes), // TODO: gaia types
    );

    const neutronRpcClient = await testState.rpcClient('neutron');
    contractManagerQuery = new ContractManagerQuery(neutronRpcClient);
    bankQuery = new BankQuery(neutronRpcClient);
    ibcQuery = new IbcQuery(neutronRpcClient);
  });

  describe('Contracts', () => {
    test('instantiate contract', async () => {
      const codeId = await neutronClient.upload(NEUTRON_CONTRACT.IBC_TRANSFER);
      expect(codeId).toBeGreaterThan(0);
      ibcContract = await neutronClient.instantiate(codeId, {});
    });
  });

  describe('Staking', () => {
    test('store and instantiate mgs receiver contract', async () => {
      const codeId = await neutronClient.upload(NEUTRON_CONTRACT.MSG_RECEIVER);
      expect(codeId).toBeGreaterThan(0);

      receiverContract = await neutronClient.instantiate(codeId, {});
    });
    test('staking queries must fail since we have no staking module in Neutron', async () => {
      let exceptionThrown = false;
      try {
        await neutronClient.execute(receiverContract, {
          call_staking: {},
        });
      } catch (err) {
        const error = err as Error;
        expect(error.message).toMatch(/Staking is not supported/i);
        exceptionThrown = true;
      }

      expect(exceptionThrown).toBeTruthy();
    });
  });

  describe('IBC', () => {
    describe('Correct way', () => {
      let relayerBalance = 0;
      beforeAll(async () => {
        await waitBlocks(10, neutronClient.client);
        const balance = await neutronClient.client.getBalance(
          IBC_RELAYER_NEUTRON_ADDRESS,
          NEUTRON_DENOM,
        );
        relayerBalance = parseInt(balance.amount || '0', 10);
      });
      test('transfer to contract', async () => {
        const res = await neutronClient.client.sendTokens(
          neutronClient.wallet.address,
          ibcContract,
          [{ denom: NEUTRON_DENOM, amount: '50000' }],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
        expect(res.code).toEqual(0);
      });
      test('check balance', async () => {
        const res = await bankQuery.AllBalances({
          address: ibcContract,
          resolveDenom: false,
        });
        expect(res.balances).toEqual([
          { amount: '50000', denom: NEUTRON_DENOM },
        ]);
      });
      test('IBC transfer from a usual account', async () => {
        const fee = {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        const res = await neutronClient.client.signAndBroadcast(
          neutronClient.wallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: NEUTRON_DENOM, amount: '1000' },
                sender: neutronClient.wallet.address,
                receiver: gaiaClient.wallet.address,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
              }),
            },
          ],
          fee,
        );
        expect(res.code).toEqual(0);
      });
      test('check IBC token balance', async () => {
        await waitBlocks(10, neutronClient.client);
        const balance = await gaiaClient.client.getBalance(
          gaiaClient.wallet.address,
          IBC_TOKEN_DENOM,
        );
        expect(balance.amount).toEqual('1000');
      });
      test('uatom IBC transfer from a remote chain to Neutron', async () => {
        const res = await gaiaClient.client.signAndBroadcast(
          gaiaClient.wallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: COSMOS_DENOM, amount: '1000' },
                sender: gaiaClient.wallet.address,
                receiver: neutronClient.wallet.address,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
              }),
            },
          ],
          {
            gas: '200000',
            amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
          },
        );
        expect(res.code).toEqual(0);
      });
      test('check uatom token balance transfered via IBC on Neutron', async () => {
        await waitBlocks(10, neutronClient.client);
        const balance = await neutronClient.client.getBalance(
          neutronClient.wallet.address,
          UATOM_IBC_TO_NEUTRON_DENOM,
        );
        expect(balance.amount).toEqual('1000');
      });
      test('check that weird IBC denom is uatom indeed', async () => {
        const res = await ibcQuery.DenomTrace({
          hash: '27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        });
        expect(res.denomTrace.baseDenom).toEqual(COSMOS_DENOM);
      });
      test('set payer fees', async () => {
        const res = await neutronClient.execute(ibcContract, {
          set_fees: {
            denom: NEUTRON_DENOM,
            ack_fee: '2333',
            recv_fee: '0',
            timeout_fee: '2666',
          },
        });
        expect(res.code).toEqual(0);
      });

      test('execute contract', async () => {
        const res = await neutronClient.execute(ibcContract, {
          send: {
            channel: TRANSFER_CHANNEL,
            to: gaiaClient.wallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });
        expect(res.code).toEqual(0);
      });

      test('check wallet balance', async () => {
        await waitBlocks(10, neutronClient.client);
        const balance = await gaiaClient.client.getBalance(
          gaiaClient.wallet.address,
          IBC_TOKEN_DENOM,
        );
        // we expect X4 balance because the contract sends 2 txs: first one = amount and the second one amount*2 + transfer from a usual account
        expect(balance.amount).toEqual('4000');
      });
      test('relayer must receive fee', async () => {
        await waitBlocks(10, neutronClient.client);
        const balance = await neutronClient.client.getBalance(
          IBC_RELAYER_NEUTRON_ADDRESS,
          NEUTRON_DENOM,
        );
        const resBalance =
          parseInt(balance.amount, 10) - 2333 * 2 - relayerBalance;
        expect(resBalance).toBeLessThan(5); // it may differ by about 1-2 because of the gas fee
      });
      test('contract should be refunded', async () => {
        await waitBlocks(10, neutronClient.client);
        const balance = await neutronClient.client.getBalance(
          ibcContract,
          NEUTRON_DENOM,
        );
        expect(parseInt(balance.amount, 10)).toBe(50000 - 3000 - 2333 * 2);
      });
    });
    describe('Missing fee', () => {
      beforeAll(async () => {
        await neutronClient.execute(ibcContract, {
          set_fees: {
            denom: NEUTRON_DENOM,
            ack_fee: '0',
            recv_fee: '0',
            timeout_fee: '0',
          },
        });
      });
      test('execute contract should fail', async () => {
        await expect(
          neutronClient.execute(ibcContract, {
            send: {
              channel: TRANSFER_CHANNEL,
              to: gaiaClient.wallet.address,
              denom: NEUTRON_DENOM,
              amount: '1000',
            },
          }),
        ).rejects.toThrow(/invalid coins/);
      });
    });
    describe('Multihops', () => {
      // 1. Check balance of Account 1 on Chain 1
      // 2. Check balance of Account 3 on Chain 2
      // 3. Check balance of Account 2 on Chain 1
      // 4. Account 1 on Chain 1 sends x tokens to Account 2 on Chain 1 via Account 3 on Chain 2
      // 5. Check Balance of Account 3 on Chain 2, confirm it stays the same
      // 6. Check Balance of Account 1 on Chain 1, confirm it is original minus x tokens
      // 7. Check Balance of Account 2 on Chain 1, confirm it is original plus x tokens
      test('IBC transfer from a usual account', async () => {
        const sender = gaiaClient.wallet.address;
        const middlehop = neutronClient.wallet.address;
        const receiver = gaiaAccount2.address;
        const senderNTRNBalanceBefore = await gaiaClient.client.getBalance(
          sender,
          COSMOS_DENOM,
        );

        const receiverNTRNBalanceBefore = await gaiaClient.client.getBalance(
          receiver,
          COSMOS_DENOM,
        );

        const transferAmount = 333333;

        const res = await gaiaClient.client.signAndBroadcast(
          gaiaClient.wallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: COSMOS_DENOM, amount: transferAmount + '' },
                sender: gaiaClient.wallet.address,
                receiver: middlehop,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
                memo: `{"forward": {"receiver": "${receiver}", "port": "transfer", "channel": "channel-0"}}`,
              }),
            },
          ],
          {
            gas: '200000',
            amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
          },
        );

        expect(res.code).toEqual(0);

        await waitBlocks(20, neutronClient.client);

        const middlehopNTRNBalanceAfter = await neutronClient.client.getBalance(
          middlehop,
          UATOM_IBC_TO_NEUTRON_DENOM,
        );
        expect(+middlehopNTRNBalanceAfter.amount).toEqual(1000);

        const senderNTRNBalanceAfter = await gaiaClient.client.getBalance(
          sender,
          COSMOS_DENOM,
        );
        expect(+senderNTRNBalanceAfter.amount).toEqual(
          +senderNTRNBalanceBefore.amount - transferAmount - 1000, // original balance - transfer amount - fee
        );

        const receiverNTRNBalanceAfter = await gaiaClient.client.getBalance(
          receiver,
          COSMOS_DENOM,
        );
        expect(+receiverNTRNBalanceAfter.amount).toEqual(
          +receiverNTRNBalanceBefore.amount + transferAmount,
        );
      });
    });
    describe('Fee in wrong denom', () => {
      const portName = 'transfer';
      const channelName = TRANSFER_CHANNEL;
      const uatomIBCDenom = getIBCDenom(portName, channelName, 'uatom');
      expect(uatomIBCDenom).toEqual(UATOM_IBC_TO_NEUTRON_DENOM);

      test('transfer some atoms to contract', async () => {
        const uatomAmount = '1000';

        const res = await gaiaClient.client.signAndBroadcast(
          gaiaClient.wallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: portName,
                sourceChannel: channelName,
                token: { denom: COSMOS_DENOM, amount: uatomAmount },
                sender: gaiaClient.wallet.address,
                receiver: ibcContract,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
              }),
            },
          ],
          {
            gas: '200000',
            amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
          },
        );
        expect(res.code).toEqual(0);

        await waitBlocks(10, neutronClient.client);
        const balance = await neutronClient.client.getBalance(
          ibcContract,
          uatomIBCDenom,
        );
        expect(balance.amount).toEqual(uatomAmount);
      });
      test('try to set fee in IBC transferred atoms', async () => {
        const res = await neutronClient.execute(ibcContract, {
          set_fees: {
            denom: uatomIBCDenom,
            ack_fee: '100',
            recv_fee: '0',
            timeout_fee: '100',
          },
        });
        expect(res.code).toEqual(0);

        await expect(
          neutronClient.execute(ibcContract, {
            send: {
              channel: TRANSFER_CHANNEL,
              to: gaiaClient.wallet.address,
              denom: NEUTRON_DENOM,
              amount: '1000',
            },
          }),
        ).rejects.toThrow(/insufficient fee/);
      });
    });
    describe('Not enough amount of tokens on contract to pay fee', () => {
      beforeAll(async () => {
        await neutronClient.execute(ibcContract, {
          set_fees: {
            denom: NEUTRON_DENOM,
            ack_fee: '1000000',
            recv_fee: '0',
            timeout_fee: '100000',
          },
        });
      });
      test('execute contract should fail', async () => {
        await expect(
          neutronClient.execute(ibcContract, {
            send: {
              channel: TRANSFER_CHANNEL,
              to: gaiaClient.wallet.address,
              denom: NEUTRON_DENOM,
              amount: '1000',
            },
          }),
        ).rejects.toThrow(/insufficient funds/);
      });
    });

    describe('Failing sudo handlers', () => {
      beforeAll(async () => {
        await neutronClient.execute(ibcContract, {
          set_fees: {
            denom: NEUTRON_DENOM,
            ack_fee: '1000',
            recv_fee: '0',
            timeout_fee: '1000',
          },
        });
      });
      test('execute contract with failing sudo', async () => {
        const failuresBeforeCall = await contractManagerQuery.AddressFailures({
          failureId: 0n, // bug: should not be in queny
          address: ibcContract,
        });
        expect(failuresBeforeCall.failures.length).toEqual(0);

        // Mock sudo handler to fail
        await neutronClient.execute(ibcContract, {
          integration_tests_set_sudo_failure_mock: {
            state: 'enabled',
          },
        });

        await neutronClient.execute(ibcContract, {
          send: {
            channel: TRANSFER_CHANNEL,
            to: gaiaClient.wallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });

        /*
        What is going on here. To test SudoTimeout handler functionality
        we have to make an IBC package delivery by hermes really slowly.
        But, actually there is no any activity on the IBC channel at this stage, as a result
        hermes does not send any UpdateClient messages from gaia to neuron.
        Gaia keeps building blocks and hermes knows nothing about it.
        We get the height =N of the gaia chain, wait 15 blocks.
        Send ibc package from neutron from gaia with timeout N+5
        current gaia block is actually N+15, but neutron knows nothing about it, and successfully sends package
        hermes checks height on remote chain and Timeout error occurs.
        */
        const currentHeight = (await gaiaClient.client.getBlock()).header
          .height;
        await waitBlocks(15, gaiaClient.client);

        await neutronClient.execute(ibcContract, {
          send: {
            channel: TRANSFER_CHANNEL,
            to: gaiaClient.wallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
            timeout_height: currentHeight + 5,
          },
        });

        const failuresAfterCall = await getWithAttempts<QueryFailuresResponse>(
          neutronClient.client,
          async () =>
            contractManagerQuery.AddressFailures({
              failureId: 0n, // bug: should not be in queny
              address: ibcContract,
            }),
          // Wait until there 4 failures in the list
          async (data) => data.failures.length == 4,
        );

        expect(failuresAfterCall.failures).toEqual([
          expect.objectContaining({
            address: ibcContract,
            id: 0n,
            error: 'codespace: wasm, code: 5',
          }),
          expect.objectContaining({
            address: ibcContract,
            id: 1n,
            error: 'codespace: wasm, code: 5',
          }),
          expect.objectContaining({
            address: ibcContract,
            id: 2n,
            error: 'codespace: wasm, code: 5',
          }),
          expect.objectContaining({
            address: ibcContract,
            id: 3n,
            error: 'codespace: wasm, code: 5',
          }),
        ]);

        expect(
          JSON.parse(
            Buffer.from(failuresAfterCall.failures[0].sudoPayload).toString(),
          ),
        ).toHaveProperty('response');
        expect(
          JSON.parse(
            Buffer.from(failuresAfterCall.failures[1].sudoPayload).toString(),
          ),
        ).toHaveProperty('response');
        expect(
          JSON.parse(
            Buffer.from(failuresAfterCall.failures[2].sudoPayload).toString(),
          ),
        ).toHaveProperty('timeout');
        expect(
          JSON.parse(
            Buffer.from(failuresAfterCall.failures[3].sudoPayload).toString(),
          ),
        ).toHaveProperty('timeout');

        // Restore sudo handler to state
        await neutronClient.execute(ibcContract, {
          integration_tests_unset_sudo_failure_mock: {},
        });
      });

      test('execute contract with sudo out of gas', async () => {
        // Mock sudo handler to fail
        await neutronClient.execute(ibcContract, {
          integration_tests_set_sudo_failure_mock: {
            state: 'enabled_infinite_loop',
          },
        });

        await neutronClient.execute(ibcContract, {
          send: {
            channel: TRANSFER_CHANNEL,
            to: gaiaClient.wallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });

        await waitBlocks(5, neutronClient.client);

        const res = await getWithAttempts<QueryFailuresResponse>(
          neutronClient.client,
          async () =>
            contractManagerQuery.AddressFailures({
              failureId: 0n, // bug: should not be in queny
              address: ibcContract,
            }),
          // Wait until there 6 failures in the list
          async (data) => data.failures.length == 6,
        );
        expect(res.failures.length).toEqual(6);
      });

      test('failed attempt to resubmit failure', async () => {
        // Mock sudo handler to fail
        await neutronClient.execute(ibcContract, {
          integration_tests_set_sudo_failure_mock: {
            state: 'enabled',
          },
        });

        await waitBlocks(2, neutronClient.client);

        // Try to resubmit failure
        const failuresResBefore = await contractManagerQuery.AddressFailures({
          failureId: 0n, // bug: should not be in queny
          address: ibcContract,
        });

        await expect(
          neutronClient.execute(ibcContract, {
            resubmit_failure: {
              failure_id: +failuresResBefore.failures[0].id.toString(),
            },
          }),
        ).rejects.toThrowError();

        await waitBlocks(5, neutronClient.client);

        // check that failures count is the same
        const failuresResAfter = await contractManagerQuery.AddressFailures({
          failureId: 0n, // bug: should not be in queny
          address: ibcContract,
        });
        expect(failuresResAfter.failures.length).toEqual(6);

        // Restore sudo handler's normal state
        await neutronClient.execute(ibcContract, {
          integration_tests_unset_sudo_failure_mock: {},
        });
        await waitBlocks(5, neutronClient.client);
      });

      test('successful resubmit failure', async () => {
        // Resubmit failure
        const failuresResBefore = await contractManagerQuery.AddressFailures({
          failureId: 0n, // bug: should not be in queny
          address: ibcContract,
        });
        const failure = failuresResBefore.failures[0];
        const res = await neutronClient.execute(ibcContract, {
          resubmit_failure: {
            failure_id: +failure.id.toString(),
          },
        });
        expect(res.code).toBe(0);

        await waitBlocks(5, neutronClient.client);

        // check that failures count is changed
        const failuresResAfter = await contractManagerQuery.AddressFailures({
          failureId: 0n, // bug: should not be in queny
          address: ibcContract,
        });
        expect(failuresResAfter.failures.length).toEqual(5);
      });
    });

    describe('Failures limit test', () => {
      it('failures with small limit does not return an error', async () => {
        const pagination = {
          limit: 1n,
          offset: 0n,
          key: new Uint8Array(),
          countTotal: false,
          reverse: false,
        };
        const res = await contractManagerQuery.AddressFailures({
          failureId: 0n, // bug: should not be in queny
          address: ibcContract,
          pagination,
        });
        expect(res.failures.length).toEqual(1);
      });
      test('failures with big limit returns an error', async () => {
        const pagination = {
          limit: 10000n,
          offset: 0n,
          key: new Uint8Array(),
          countTotal: false,
          reverse: false,
        };
        await expect(
          contractManagerQuery.AddressFailures({
            failureId: 0n, // bug: should not be in queny
            address: ibcContract,
            pagination,
          }),
        ).rejects.toThrow(/limit is more than maximum allowed/);
      });
    });
  });
});
