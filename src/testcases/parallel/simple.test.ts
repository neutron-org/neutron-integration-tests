import { Suite, inject } from 'vitest';
import {
  cosmosWrapper,
  COSMOS_DENOM,
  IBC_RELAYER_NEUTRON_ADDRESS,
  NEUTRON_DENOM,
  types,
} from '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/localState';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { WasmClient, wasm } from '../../helpers/wasmClient';
import { MsgTransfer } from '@neutron-org/cosmjs-types/ibc/applications/transfer/v1/tx';
import { QueryClientImpl, QueryFailuresRequest } from '@neutron-org/cosmjs-types/neutron/contractmanager/query';
import { connectComet } from '@cosmjs/tendermint-rpc';
import { QueryClient, createProtobufRpcClient } from '@cosmjs/stargate';

const config = require('../../config.json');

const IBC_TOKEN_DENOM =
  'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';

const UATOM_IBC_TO_NEUTRON_DENOM =
  'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';

describe('Neutron / Simple', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let neutronClient: WasmClient;
  let gaiaChain: CosmosWrapper;
  let neutronAccount: Wallet;
  let gaiaAccount: Wallet;
  let gaiaAccount2: Wallet;
  let gaiaClient: WasmClient;
  let ibcContract: string;
  let receiverContract: string;
  let contractManagerQuery: QueryClientImpl;

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics, suite);
    await testState.init();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronClient = await wasm(
      testState.rpc1,
      await testState.walletWithOffset('neutron'),
      NEUTRON_DENOM,
    );
    gaiaChain = new cosmosWrapper.CosmosWrapper(
      COSMOS_DENOM,
      testState.rest2,
      testState.rpc2,
    );
    gaiaAccount = await testState.walletWithOffset('cosmos');
    gaiaAccount2 = await testState.walletWithOffset('cosmos');
    gaiaClient = await wasm(testState.rpc2, gaiaAccount, COSMOS_DENOM);

    const client = await connectComet(testState.rpc1);
    const queryClient = new QueryClient(client);
    const rpcClient = createProtobufRpcClient(queryClient);
    contractManagerQuery = new QueryClientImpl(rpcClient);
  });

  describe('Contracts', () => {
    test('instantiate contract', async () => {
      const codeId = await neutronClient.upload(
        types.NeutronContract.IBC_TRANSFER,
      );
      expect(codeId).toBeGreaterThan(0);
      ibcContract = await neutronClient.instantiate(codeId, {});
    });
  });

  describe('Staking', () => {
    test('store and instantiate mgs receiver contract', async () => {
      const codeId = await neutronClient.upload(
        types.NeutronContract.MSG_RECEIVER,
      );
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
        await neutronChain.waitBlocks(10);
        const balance = await neutronClient.cosm.getBalance(
          IBC_RELAYER_NEUTRON_ADDRESS,
          NEUTRON_DENOM,
        );
        relayerBalance = parseInt(balance.amount || '0', 10);
      });
      test('transfer to contract', async () => {
        const res = await neutronClient.cosm.sendTokens(
          neutronAccount.address,
          ibcContract,
          [{ denom: NEUTRON_DENOM, amount: '50000' }],
          'auto',
        );
        expect(res.code).toEqual(0);
      });
      test('check balance', async () => {
        // TODO: fix
        const balances = await neutronChain.queryBalances(ibcContract);
        expect(balances).toEqual([{ amount: '50000', denom: NEUTRON_DENOM }]);
      });
      test('IBC transfer from a usual account', async () => {
        const fee = {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        const res = await neutronClient.cosm.signAndBroadcast(
          neutronAccount.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: { denom: NEUTRON_DENOM, amount: '1000' },
                sender: neutronAccount.address,
                receiver: gaiaAccount.address,
                timeoutHeight: {
                  revisionNumber: BigInt(2),
                  revisionHeight: BigInt(100000000),
                },
              }),
            },
          ],
          fee,
        );
        expect(res.code).toEqual(0);
      });
      test('check IBC token balance', async () => {
        await neutronChain.waitBlocks(10);
        const balance = await gaiaClient.cosm.getBalance(
          gaiaAccount.address,
          IBC_TOKEN_DENOM,
        );
        expect(balance.amount).toEqual('1000');
      });
      test('uatom IBC transfer from a remote chain to Neutron', async () => {
        const res = await gaiaClient.cosm.signAndBroadcast(
          gaiaAccount.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: { denom: COSMOS_DENOM, amount: '1000' },
                sender: gaiaAccount.address,
                receiver: neutronAccount.address,
                timeoutHeight: {
                  revisionNumber: BigInt(2),
                  revisionHeight: BigInt(100000000),
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
        await neutronChain.waitBlocks(10);
        const balance = await neutronClient.cosm.getBalance(
          neutronAccount.address,
          UATOM_IBC_TO_NEUTRON_DENOM,
        );
        expect(balance.amount).toEqual('1000');
      });
      test('check that weird IBC denom is uatom indeed', async () => {
        const denomTrace = await neutronChain.queryDenomTrace(
          '27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        );
        expect(denomTrace.base_denom).toEqual(COSMOS_DENOM);
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
            channel: 'channel-0',
            to: gaiaAccount.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });
        expect(res.code).toEqual(0);
      });

      test('check wallet balance', async () => {
        await neutronChain.waitBlocks(10);
        const balance = await gaiaClient.cosm.getBalance(
          gaiaAccount.address,
          IBC_TOKEN_DENOM,
        );
        // we expect X4 balance because the contract sends 2 txs: first one = amount and the second one amount*2 + transfer from a usual account
        expect(balance.amount).toEqual('4000');
      });
      test('relayer must receive fee', async () => {
        await neutronChain.waitBlocks(10);
        const balance = await neutronClient.cosm.getBalance(
          IBC_RELAYER_NEUTRON_ADDRESS,
          NEUTRON_DENOM,
        );
        const resBalance =
          parseInt(balance.amount, 10) - 2333 * 2 - relayerBalance;
        expect(resBalance).toBeLessThan(5); // it may differ by about 1-2 because of the gas fee
      });
      test('contract should be refunded', async () => {
        await neutronChain.waitBlocks(10);
        const balance = await neutronClient.cosm.getBalance(
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
              channel: 'channel-0',
              to: gaiaAccount.address,
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
        const sender = gaiaAccount.address;
        const middlehop = neutronAccount.address;
        const receiver = gaiaAccount2.address;
        const senderNTRNBalanceBefore = await gaiaClient.cosm.getBalance(
          sender,
          COSMOS_DENOM,
        );

        const receiverNTRNBalanceBefore = await gaiaClient.cosm.getBalance(
          receiver,
          COSMOS_DENOM,
        );

        const transferAmount = 333333;

        const res = await gaiaClient.cosm.signAndBroadcast(
          gaiaAccount.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: { denom: COSMOS_DENOM, amount: transferAmount + '' },
                sender: gaiaAccount.address,
                receiver: middlehop,
                timeoutHeight: {
                  revisionNumber: BigInt(2),
                  revisionHeight: BigInt(100000000),
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

        await neutronChain.waitBlocks(20);

        const middlehopNTRNBalanceAfter = await neutronClient.cosm.getBalance(
          middlehop,
          UATOM_IBC_TO_NEUTRON_DENOM,
        );
        expect(+middlehopNTRNBalanceAfter.amount).toEqual(1000);

        const senderNTRNBalanceAfter = await gaiaClient.cosm.getBalance(
          sender,
          COSMOS_DENOM,
        );
        expect(senderNTRNBalanceAfter.amount).toEqual(
          +senderNTRNBalanceBefore.amount - transferAmount - 1000, // original balance - transfer amount - fee
        );

        const receiverNTRNBalanceAfter = await gaiaChain.queryDenomBalance(
          receiver,
          COSMOS_DENOM,
        );
        expect(receiverNTRNBalanceAfter).toEqual(
          +receiverNTRNBalanceBefore.amount + transferAmount,
        );
      });
    });
    describe('Fee in wrong denom', () => {
      const portName = 'transfer';
      const channelName = 'channel-0';
      const uatomIBCDenom = cosmosWrapper.getIBCDenom(
        portName,
        channelName,
        'uatom',
      );
      expect(uatomIBCDenom).toEqual(UATOM_IBC_TO_NEUTRON_DENOM);

      test('transfer some atoms to contract', async () => {
        const uatomAmount = '1000';

        const res = await gaiaClient.cosm.signAndBroadcast(
          gaiaAccount.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: portName,
                sourceChannel: channelName,
                token: { denom: COSMOS_DENOM, amount: uatomAmount },
                sender: gaiaAccount.address,
                receiver: ibcContract,
                timeoutHeight: {
                  revisionNumber: BigInt(2),
                  revisionHeight: BigInt(100000000),
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

        await neutronChain.waitBlocks(10);
        const balance = await neutronClient.cosm.getBalance(
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
              channel: 'channel-0',
              to: gaiaAccount.address,
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
              channel: 'channel-0',
              to: gaiaAccount.address,
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
          failureId: BigInt(0), // bug
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
            channel: 'channel-0',
            to: gaiaAccount.address,
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
        const currentHeight = await gaiaChain.getHeight();
        await gaiaChain.waitBlocks(15);

        await neutronClient.execute(ibcContract, {
          send: {
            channel: 'channel-0',
            to: gaiaAccount.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
            timeout_height: currentHeight + 5,
          },
        });

        const failuresAfterCall =
          await neutronChain.getWithAttempts<types.AckFailuresResponse>(
            async () =>
              contractManagerQuery.AddressFailures({
                failureId: BigInt(0), // bug
                address: ibcContract,
              }),
            // Wait until there 4 failures in the list
            async (data) => data.failures.length == 4,
          );

        expect(failuresAfterCall.failures).toEqual([
          expect.objectContaining({
            address: ibcContract,
            id: '0',
            error: 'codespace: wasm, code: 5',
          }),
          expect.objectContaining({
            address: ibcContract,
            id: '1',
            error: 'codespace: wasm, code: 5',
          }),
          expect.objectContaining({
            address: ibcContract,
            id: '2',
            error: 'codespace: wasm, code: 5',
          }),
          expect.objectContaining({
            address: ibcContract,
            id: '3',
            error: 'codespace: wasm, code: 5',
          }),
        ]);

        expect(
          JSON.parse(
            Buffer.from(
              failuresAfterCall.failures[0].sudo_payload,
              'base64',
            ).toString(),
          ),
        ).toHaveProperty('response');
        expect(
          JSON.parse(
            Buffer.from(
              failuresAfterCall.failures[1].sudo_payload,
              'base64',
            ).toString(),
          ),
        ).toHaveProperty('response');
        expect(
          JSON.parse(
            Buffer.from(
              failuresAfterCall.failures[2].sudo_payload,
              'base64',
            ).toString(),
          ),
        ).toHaveProperty('timeout');
        expect(
          JSON.parse(
            Buffer.from(
              failuresAfterCall.failures[3].sudo_payload,
              'base64',
            ).toString(),
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
            channel: 'channel-0',
            to: gaiaAccount.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });

        await neutronChain.waitBlocks(5);

        const res =
          await neutronChain.getWithAttempts<types.AckFailuresResponse>(
            async () =>
              contractManagerQuery.AddressFailures({
                failureId: BigInt(0), // bug
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

        await neutronChain.waitBlocks(2);

        // Try to resubmit failure
        const failuresResBefore = await contractManagerQuery.AddressFailures({
          failureId: BigInt(0), // bug
          address: ibcContract,
        });

        await expect(
          neutronClient.execute(ibcContract, {
            resubmit_failure: {
              failure_id: failuresResBefore.failures[0].id,
            },
          }),
        ).rejects.toThrowError();

        await neutronChain.waitBlocks(5);

        // check that failures count is the same
        const failuresResAfter = await contractManagerQuery.AddressFailures({
          failureId: BigInt(0), // bug
          address: ibcContract,
        });
        expect(failuresResAfter.failures.length).toEqual(6);

        // Restore sudo handler's normal state
        await neutronClient.execute(ibcContract, {
          integration_tests_unset_sudo_failure_mock: {},
        });
        await neutronChain.waitBlocks(5);
      });

      test('successful resubmit failure', async () => {
        // Resubmit failure
        const failuresResBefore = await contractManagerQuery.AddressFailures({
          failureId: BigInt(0), // bug
          address: ibcContract,
        });
        const failure = failuresResBefore.failures[0];
        const res = await neutronClient.execute(ibcContract, {
          resubmit_failure: {
            failure_id: failure.id,
          },
        });
        expect(res.code).toBe(0);

        await neutronChain.waitBlocks(5);

        // check that failures count is changed
        const failuresResAfter = await contractManagerQuery.AddressFailures({
          failureId: BigInt(0), // bug
          address: ibcContract,
        });
        expect(failuresResAfter.failures.length).toEqual(5);
      });
    });

    describe('Failures limit test', () => {
      it("failures with small limit doesn't return an error", async () => {
        const pagination: types.PageRequest = {
          'pagination.limit': '1',
          'pagination.offset': '0',
        };
        const failures = await contractManagerQuery.AddressFailures({
          failureId: BigInt(0), // bug
          address: ibcContract,
          pagination,
        });
        expect(failures.failures.length).toEqual(1);
      });
      test('failures with big limit returns an error', async () => {
        const pagination: types.PageRequest = {
          'pagination.limit': '10000',
          'pagination.offset': '0',
        };
        await expect(
          contractManagerQuery.AddressFailures({
            failureId: BigInt(0), // bug
            address: ibcContract,
            pagination,
          }),
        ).rejects.toThrow(/limit is more than maximum allowed/);
      });
    });
  });
});
