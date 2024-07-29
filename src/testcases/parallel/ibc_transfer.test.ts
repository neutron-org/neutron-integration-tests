import { Registry } from '@cosmjs/proto-signing';
import { Suite, inject } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { MsgTransfer as GaiaMsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { MsgTransfer as NeutronMsgTransfer } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/tx';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import {
  QueryClientImpl as ContractManagerQuery,
  QueryFailuresResponse,
} from '@neutron-org/cosmjs-types/neutron/contractmanager/query';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/cosmjs-types/cosmos/bank/v1beta1/query';
import { QueryClientImpl as IbcQueryClient } from '@neutron-org/cosmjs-types/ibc/applications/transfer/v1/query';
import {
  COSMOS_DENOM,
  IBC_RELAYER_NEUTRON_ADDRESS,
  CONTRACTS,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { getIBCDenom } from '../../helpers/cosmos';

import config from '../../config.json';
import { SigningStargateClient } from '@cosmjs/stargate';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';

const TRANSFER_CHANNEL = 'channel-0';
const IBC_TOKEN_DENOM =
  'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';
const UATOM_IBC_TO_NEUTRON_DENOM =
  'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';

describe('Neutron / IBC transfer', () => {
  let testState: LocalState;

  let neutronClient: SigningNeutronClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: Wallet;
  let gaiaWallet2: Wallet;

  let ibcContract: string;
  let receiverContract: string;

  let contractManagerQuerier: ContractManagerQuery;
  let bankQuerier: BankQueryClient;
  let ibcQuerier: IbcQueryClient;

  beforeAll(async (suite: Suite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    gaiaWallet = await testState.nextWallet('cosmos');
    gaiaWallet2 = await testState.nextWallet('cosmos');
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.directwallet,
      { registry: new Registry(defaultRegistryTypes) },
    );

    const neutronRpcClient = await testState.neutronRpcClient();
    contractManagerQuerier = new ContractManagerQuery(neutronRpcClient);
    bankQuerier = new BankQueryClient(neutronRpcClient);
    ibcQuerier = new IbcQueryClient(neutronRpcClient);
  });

  describe('Contracts', () => {
    test('instantiate contract', async () => {
      ibcContract = await neutronClient.create(CONTRACTS.IBC_TRANSFER, {});
    });
  });

  describe('Staking', () => {
    test('store and instantiate mgs receiver contract', async () => {
      receiverContract = await neutronClient.create(CONTRACTS.MSG_RECEIVER, {});
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
        await neutronClient.waitBlocks(10);
        const balance = await neutronClient.getBalance(
          IBC_RELAYER_NEUTRON_ADDRESS,
          NEUTRON_DENOM,
        );
        relayerBalance = parseInt(balance.amount || '0', 10);
      });
      test('transfer to contract', async () => {
        const res = await neutronClient.sendTokens(
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
        const res = await bankQuerier.AllBalances({ address: ibcContract });
        expect(res.balances).toEqual([
          { amount: '50000', denom: NEUTRON_DENOM },
        ]);
      });
      test('IBC transfer from a usual account', async () => {
        const fee = {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: NEUTRON_DENOM, amount: '1000' },
                sender: neutronWallet.address,
                receiver: gaiaWallet.address,
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
        await neutronClient.waitBlocks(10);
        const balance = await gaiaClient.getBalance(
          gaiaWallet.address,
          IBC_TOKEN_DENOM,
        );
        expect(balance.amount).toEqual('1000');
      });
      test('uatom IBC transfer from a remote chain to Neutron', async () => {
        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: GaiaMsgTransfer.typeUrl,
              value: GaiaMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: COSMOS_DENOM, amount: '1000' },
                sender: gaiaWallet.address,
                receiver: neutronWallet.address,
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
      test('check uatom token balance transferred via IBC on Neutron', async () => {
        await neutronClient.waitBlocks(10);
        const balance = await neutronClient.getBalance(
          neutronWallet.address,
          UATOM_IBC_TO_NEUTRON_DENOM,
        );
        expect(balance.amount).toEqual('1000');
      });
      test('check that weird IBC denom is uatom indeed', async () => {
        const res = await ibcQuerier.DenomTrace({
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
            to: gaiaWallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });
        expect(res.code).toEqual(0);
      });

      test('check wallet balance', async () => {
        await neutronClient.waitBlocks(10);
        const balance = await gaiaClient.getBalance(
          gaiaWallet.address,
          IBC_TOKEN_DENOM,
        );
        // we expect X4 balance because the contract sends 2 txs: first one = amount and the second one amount*2 + transfer from a usual account
        expect(balance.amount).toEqual('4000');
      });
      test('relayer must receive fee', async () => {
        await neutronClient.waitBlocks(10);
        const balance = await neutronClient.getBalance(
          IBC_RELAYER_NEUTRON_ADDRESS,
          NEUTRON_DENOM,
        );
        const resBalance =
          parseInt(balance.amount, 10) - 2333 * 2 - relayerBalance;
        expect(resBalance).toBeLessThan(5); // it may differ by about 1-2 because of the gas fee
      });
      test('contract should be refunded', async () => {
        await neutronClient.waitBlocks(10);
        const balance = await neutronClient.getBalance(
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
              to: gaiaWallet.address,
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
        const sender = gaiaWallet.address;
        const middlehop = neutronWallet.address;
        const receiver = gaiaWallet2.address;
        const senderNTRNBalanceBefore = await gaiaClient.getBalance(
          sender,
          COSMOS_DENOM,
        );

        const receiverNTRNBalanceBefore = await gaiaClient.getBalance(
          receiver,
          COSMOS_DENOM,
        );

        const transferAmount = 333333;

        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: GaiaMsgTransfer.typeUrl,
              value: GaiaMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: COSMOS_DENOM, amount: transferAmount + '' },
                sender: gaiaWallet.address,
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

        await neutronClient.waitBlocks(20);

        const middlehopNTRNBalanceAfter = await neutronClient.getBalance(
          middlehop,
          UATOM_IBC_TO_NEUTRON_DENOM,
        );
        expect(+middlehopNTRNBalanceAfter.amount).toEqual(1000);

        const senderNTRNBalanceAfter = await gaiaClient.getBalance(
          sender,
          COSMOS_DENOM,
        );
        expect(+senderNTRNBalanceAfter.amount).toEqual(
          +senderNTRNBalanceBefore.amount - transferAmount - 1000, // original balance - transfer amount - fee
        );

        const receiverNTRNBalanceAfter = await gaiaClient.getBalance(
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

        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: GaiaMsgTransfer.typeUrl,
              value: GaiaMsgTransfer.fromPartial({
                sourcePort: portName,
                sourceChannel: channelName,
                token: { denom: COSMOS_DENOM, amount: uatomAmount },
                sender: gaiaWallet.address,
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

        await neutronClient.waitBlocks(10);
        const balance = await neutronClient.getBalance(
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
              to: gaiaWallet.address,
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
              to: gaiaWallet.address,
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
        const failuresBeforeCall = await contractManagerQuerier.AddressFailures(
          {
            failureId: 0n, // bug: should not be in query
            address: ibcContract,
          },
        );
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
            to: gaiaWallet.address,
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
        const currentHeight = await gaiaClient.getHeight();
        await waitBlocks(15, gaiaClient);

        await neutronClient.execute(ibcContract, {
          send: {
            channel: TRANSFER_CHANNEL,
            to: gaiaWallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
            timeout_height: currentHeight + 5,
          },
        });

        const failuresAfterCall =
          await neutronClient.getWithAttempts<QueryFailuresResponse>(
            async () =>
              contractManagerQuerier.AddressFailures({
                failureId: 0n, // bug: should not be in query
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
            to: gaiaWallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });

        await neutronClient.waitBlocks(5);

        const res = await neutronClient.getWithAttempts<QueryFailuresResponse>(
          async () =>
            contractManagerQuerier.AddressFailures({
              failureId: 0n, // bug: should not be in query
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

        await neutronClient.waitBlocks(2);

        // Try to resubmit failure
        const failuresResBefore = await contractManagerQuerier.AddressFailures({
          failureId: 0n, // bug: should not be in query
          address: ibcContract,
        });

        await expect(
          neutronClient.execute(ibcContract, {
            resubmit_failure: {
              failure_id: +failuresResBefore.failures[0].id.toString(),
            },
          }),
        ).rejects.toThrowError();

        await neutronClient.waitBlocks(5);

        // check that failures count is the same
        const failuresResAfter = await contractManagerQuerier.AddressFailures({
          failureId: 0n, // bug: should not be in query
          address: ibcContract,
        });
        expect(failuresResAfter.failures.length).toEqual(6);

        // Restore sudo handler's normal state
        await neutronClient.execute(ibcContract, {
          integration_tests_unset_sudo_failure_mock: {},
        });
        await neutronClient.waitBlocks(5);
      });

      test('successful resubmit failure', async () => {
        // Resubmit failure
        const failuresResBefore = await contractManagerQuerier.AddressFailures({
          failureId: 0n, // bug: should not be in query
          address: ibcContract,
        });
        const failure = failuresResBefore.failures[0];
        const res = await neutronClient.execute(ibcContract, {
          resubmit_failure: {
            failure_id: +failure.id.toString(),
          },
        });
        expect(res.code).toBe(0);

        await neutronClient.waitBlocks(5);

        // check that failures count is changed
        const failuresResAfter = await contractManagerQuerier.AddressFailures({
          failureId: 0n, // bug: should not be in query
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
        const res = await contractManagerQuerier.AddressFailures({
          failureId: 0n, // bug: should not be in query
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
          contractManagerQuerier.AddressFailures({
            failureId: 0n, // bug: should not be in query
            address: ibcContract,
            pagination,
          }),
        ).rejects.toThrow(/limit is more than maximum allowed/);
      });
    });
  });
});