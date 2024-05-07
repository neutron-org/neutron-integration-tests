import { Suite, inject } from 'vitest';
import {
  cosmosWrapper,
  COSMOS_DENOM,
  IBC_RELAYER_NEUTRON_ADDRESS,
  NEUTRON_DENOM,
  types,
} from '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  createWalletWrapper,
} from '@neutron-org/neutronjsplus/dist/wallet_wrapper';
import { LocalState, testOffset } from '../../helpers/localState';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';

const config = require('../../config.json');

describe('Neutron / Simple', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let gaiaChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let gaiaAccount: WalletWrapper;
  let gaiaAccount2: WalletWrapper;
  let contractAddress: string;
  let receiverContractAddress: string;

  beforeAll(async (s: Suite) => {
    const offset = await testOffset(s);
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics);
    await testState.init();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronAccount = await createWalletWrapper(
      neutronChain,
      await testState.walletWithOffset(offset, 'neutron'),
    );
    gaiaChain = new cosmosWrapper.CosmosWrapper(
      COSMOS_DENOM,
      testState.rest2,
      testState.rpc2,
    );
    gaiaAccount = await createWalletWrapper(
      gaiaChain,
      await testState.walletWithOffset(offset, 'cosmos'),
    );
    gaiaAccount2 = await createWalletWrapper(
      gaiaChain,
      await testState.walletWithOffset(offset, 'cosmos'),
    );
  });

  describe('Contracts', () => {
    let codeId: types.CodeId;
    it('store contract', async () => {
      codeId = await neutronAccount.storeWasm(
        types.NeutronContract.IBC_TRANSFER,
      );
      expect(codeId).toBeGreaterThan(0);
    });
    it('instantiate', async () => {
      contractAddress = await neutronAccount.instantiateContract(
        codeId,
        {},
        'ibc_transfer',
      );
    });
  });

  describe('Staking', () => {
    it('store and instantiate mgs receiver contract', async () => {
      const codeId = await neutronAccount.storeWasm(
        types.NeutronContract.MSG_RECEIVER,
      );
      expect(codeId).toBeGreaterThan(0);

      receiverContractAddress = await neutronAccount.instantiateContract(
        codeId,
        {},
        'msg_receiver',
      );
    });
    it('staking queries must fail since we have no staking module in Neutron', async () => {
      let exceptionThrown = false;
      try {
        await neutronAccount.executeContract(receiverContractAddress, {
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
        const balances = await neutronChain.queryBalances(
          IBC_RELAYER_NEUTRON_ADDRESS,
        );
        relayerBalance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
      });
      it('transfer to contract', async () => {
        const res = await neutronAccount.msgSend(contractAddress, '50000');
        expect(res.code).toEqual(0);
      });
      it('check balance', async () => {
        const balances = await neutronChain.queryBalances(contractAddress);
        expect(balances.balances).toEqual([
          { amount: '50000', denom: NEUTRON_DENOM },
        ]);
      });
      it('IBC transfer from a usual account', async () => {
        const res = await neutronAccount.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: NEUTRON_DENOM, amount: '1000' },
          gaiaAccount.wallet.address,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
        );
        expect(res.code).toEqual(0);
      });
      it('check IBC token balance', async () => {
        await neutronChain.waitBlocks(10);
        const balances = await gaiaChain.queryBalances(
          gaiaAccount.wallet.address,
        );
        expect(
          balances.balances.find(
            (bal): boolean =>
              bal.denom ==
              'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6',
          )?.amount,
        ).toEqual('1000');
      });
      it('uatom IBC transfer from a remote chain to Neutron', async () => {
        const res = await gaiaAccount.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: COSMOS_DENOM, amount: '1000' },
          neutronAccount.wallet.address,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
        );
        expect(res.code).toEqual(0);
      });
      it('check uatom token balance transfered  via IBC on Neutron', async () => {
        await neutronChain.waitBlocks(10);
        const balances = await neutronChain.queryBalances(
          neutronAccount.wallet.address,
        );
        expect(
          balances.balances.find(
            (bal): boolean =>
              bal.denom ==
              'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
          )?.amount,
        ).toEqual('1000');
      });
      it('check that weird IBC denom is uatom indeed', async () => {
        const denomTrace = await neutronChain.queryDenomTrace(
          '27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        );
        expect(denomTrace.base_denom).toEqual(COSMOS_DENOM);
      });
      it('set payer fees', async () => {
        const res = await neutronAccount.executeContract(contractAddress, {
          set_fees: {
            denom: neutronChain.denom,
            ack_fee: '2333',
            recv_fee: '0',
            timeout_fee: '2666',
          },
        });
        expect(res.code).toEqual(0);
      });

      it('execute contract', async () => {
        const res = await neutronAccount.executeContract(contractAddress, {
          send: {
            channel: 'channel-0',
            to: gaiaAccount.wallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });
        expect(res.code).toEqual(0);
      });

      it('check wallet balance', async () => {
        await neutronChain.waitBlocks(10);
        const balances = await gaiaChain.queryBalances(
          gaiaAccount.wallet.address,
        );
        // we expect X4 balance because the contract sends 2 txs: first one = amount and the second one amount*2 + transfer from a usual account
        expect(
          balances.balances.find(
            (bal): boolean =>
              bal.denom ==
              'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6',
          )?.amount,
        ).toEqual('4000');
      });
      it('relayer must receive fee', async () => {
        await neutronChain.waitBlocks(10);
        const balances = await neutronChain.queryBalances(
          IBC_RELAYER_NEUTRON_ADDRESS,
        );
        const balance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
        expect(balance - 2333 * 2 - relayerBalance).toBeLessThan(5); // it may differ by about 1-2 because of the gas fee
      });
      it('contract should be refunded', async () => {
        await neutronChain.waitBlocks(10);
        const balances = await neutronChain.queryBalances(contractAddress);
        const balance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
        expect(balance).toBe(50000 - 3000 - 2333 * 2);
      });
    });
    describe('Missing fee', () => {
      beforeAll(async () => {
        await neutronAccount.executeContract(contractAddress, {
          set_fees: {
            denom: neutronChain.denom,
            ack_fee: '0',
            recv_fee: '0',
            timeout_fee: '0',
          },
        });
      });
      it('execute contract should fail', async () => {
        await expect(
          neutronAccount.executeContract(contractAddress, {
            send: {
              channel: 'channel-0',
              to: gaiaAccount.wallet.address,
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
      it('IBC transfer from a usual account', async () => {
        const sender = gaiaAccount.wallet.address;
        const middlehop = neutronAccount.wallet.address;
        const receiver = gaiaAccount2.wallet.address;
        const senderNTRNBalanceBefore = await gaiaChain.queryDenomBalance(
          sender,
          COSMOS_DENOM,
        );

        const receiverNTRNBalanceBefore = await gaiaChain.queryDenomBalance(
          receiver,
          COSMOS_DENOM,
        );

        const transferAmount = 333333;

        const res = await gaiaAccount.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: COSMOS_DENOM, amount: transferAmount + '' },
          middlehop,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
          `{"forward": {"receiver": "${receiver}", "port": "transfer", "channel": "channel-0"}}`,
        );
        expect(res.code).toEqual(0);

        await neutronChain.waitBlocks(20);

        const middlehopNTRNBalanceAfter = await neutronChain.queryDenomBalance(
          middlehop,
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        );
        expect(middlehopNTRNBalanceAfter).toEqual(1000);

        const senderNTRNBalanceAfter = await gaiaChain.queryDenomBalance(
          sender,
          COSMOS_DENOM,
        );
        expect(senderNTRNBalanceAfter).toEqual(
          senderNTRNBalanceBefore - transferAmount - 1000, // original balance - transfer amount - fee
        );

        const receiverNTRNBalanceAfter = await gaiaChain.queryDenomBalance(
          receiver,
          COSMOS_DENOM,
        );
        expect(receiverNTRNBalanceAfter).toEqual(
          receiverNTRNBalanceBefore + transferAmount,
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
      expect(uatomIBCDenom).toEqual(
        'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
      );
      it('transfer some atoms to contract', async () => {
        const uatomAmount = '1000';
        const res = await gaiaAccount.msgIBCTransfer(
          portName,
          channelName,
          { denom: gaiaChain.denom, amount: uatomAmount },
          contractAddress,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
        );
        expect(res.code).toEqual(0);

        await neutronChain.waitBlocks(10);
        const balances = await neutronChain.queryBalances(contractAddress);
        expect(
          balances.balances.find((bal): boolean => bal.denom == uatomIBCDenom)
            ?.amount,
        ).toEqual(uatomAmount);
      });
      it('try to set fee in IBC transferred atoms', async () => {
        const res = await neutronAccount.executeContract(contractAddress, {
          set_fees: {
            denom: uatomIBCDenom,
            ack_fee: '100',
            recv_fee: '0',
            timeout_fee: '100',
          },
        });
        expect(res.code).toEqual(0);

        await expect(
          neutronAccount.executeContract(contractAddress, {
            send: {
              channel: 'channel-0',
              to: gaiaAccount.wallet.address,
              denom: NEUTRON_DENOM,
              amount: '1000',
            },
          }),
        ).rejects.toThrow(/insufficient fee/);
      });
    });
    describe('Not enough amount of tokens on contract to pay fee', () => {
      beforeAll(async () => {
        await neutronAccount.executeContract(contractAddress, {
          set_fees: {
            denom: neutronChain.denom,
            ack_fee: '1000000',
            recv_fee: '0',
            timeout_fee: '100000',
          },
        });
      });
      it('execute contract should fail', async () => {
        await expect(
          neutronAccount.executeContract(contractAddress, {
            send: {
              channel: 'channel-0',
              to: gaiaAccount.wallet.address,
              denom: NEUTRON_DENOM,
              amount: '1000',
            },
          }),
        ).rejects.toThrow(/insufficient funds/);
      });
    });

    describe('Failing sudo handlers', () => {
      beforeAll(async () => {
        await neutronAccount.executeContract(contractAddress, {
          set_fees: {
            denom: neutronChain.denom,
            ack_fee: '1000',
            recv_fee: '0',
            timeout_fee: '1000',
          },
        });
      });
      it('execute contract with failing sudo', async () => {
        const failuresBeforeCall = await neutronChain.queryAckFailures(
          contractAddress,
        );
        expect(failuresBeforeCall.failures.length).toEqual(0);

        // Mock sudo handler to fail
        await neutronAccount.executeContract(contractAddress, {
          integration_tests_set_sudo_failure_mock: {
            state: 'enabled',
          },
        });

        await neutronAccount.executeContract(contractAddress, {
          send: {
            channel: 'channel-0',
            to: gaiaAccount.wallet.address,
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

        await neutronAccount.executeContract(contractAddress, {
          send: {
            channel: 'channel-0',
            to: gaiaAccount.wallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
            timeout_height: currentHeight + 5,
          },
        });

        const failuresAfterCall =
          await neutronChain.getWithAttempts<types.AckFailuresResponse>(
            async () => neutronChain.queryAckFailures(contractAddress),
            // Wait until there 4 failures in the list
            async (data) => data.failures.length == 4,
          );

        expect(failuresAfterCall.failures).toEqual([
          expect.objectContaining({
            address: contractAddress,
            id: '0',
            error: 'codespace: wasm, code: 5',
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '1',
            error: 'codespace: wasm, code: 5',
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '2',
            error: 'codespace: wasm, code: 5',
          }),
          expect.objectContaining({
            address: contractAddress,
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
        await neutronAccount.executeContract(contractAddress, {
          integration_tests_unset_sudo_failure_mock: {},
        });
      });

      it('execute contract with sudo out of gas', async () => {
        // Mock sudo handler to fail
        await neutronAccount.executeContract(contractAddress, {
          integration_tests_set_sudo_failure_mock: {
            state: 'enabled_infinite_loop',
          },
        });

        await neutronAccount.executeContract(contractAddress, {
          send: {
            channel: 'channel-0',
            to: gaiaAccount.wallet.address,
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });

        await neutronChain.waitBlocks(5);

        const res =
          await neutronChain.getWithAttempts<types.AckFailuresResponse>(
            async () => neutronChain.queryAckFailures(contractAddress),
            // Wait until there 6 failures in the list
            async (data) => data.failures.length == 6,
          );
        expect(res.failures.length).toEqual(6);
      });

      it('failed attempt to resubmit failure', async () => {
        // Mock sudo handler to fail
        await neutronAccount.executeContract(contractAddress, {
          integration_tests_set_sudo_failure_mock: {
            state: 'enabled',
          },
        });

        await neutronChain.waitBlocks(2);

        // Try to resubmit failure
        const failuresResBefore = await neutronChain.queryAckFailures(
          contractAddress,
        );

        await expect(
          neutronAccount.executeContract(contractAddress, {
            resubmit_failure: {
              failure_id: +failuresResBefore.failures[0].id,
            },
          }),
        ).rejects.toThrowError();

        await neutronChain.waitBlocks(5);

        // check that failures count is the same
        const failuresResAfter = await neutronChain.queryAckFailures(
          contractAddress,
        );
        expect(failuresResAfter.failures.length).toEqual(6);

        // Restore sudo handler's normal state
        await neutronAccount.executeContract(contractAddress, {
          integration_tests_unset_sudo_failure_mock: {},
        });
        await neutronChain.waitBlocks(5);
      });

      it('successful resubmit failure', async () => {
        // Resubmit failure
        const failuresResBefore = await neutronChain.queryAckFailures(
          contractAddress,
        );
        const failure = failuresResBefore.failures[0];
        const failureId = +failure.id;
        const res = await neutronAccount.executeContract(contractAddress, {
          resubmit_failure: {
            failure_id: +failureId,
          },
        });
        expect(res.code).toBe(0);

        await neutronChain.waitBlocks(5);

        // check that failures count is changed
        const failuresResAfter = await neutronChain.queryAckFailures(
          contractAddress,
        );
        expect(failuresResAfter.failures.length).toEqual(5);
      });
    });

    describe('Failures limit test', () => {
      it("failures with small limit doesn't return an error", async () => {
        const pagination: types.PageRequest = {
          'pagination.limit': '1',
          'pagination.offset': '0',
        };
        const failures = await neutronChain.queryAckFailures(
          contractAddress,
          pagination,
        );
        expect(failures.failures.length).toEqual(1);
      });
      it('failures with big limit returns an error', async () => {
        const pagination: types.PageRequest = {
          'pagination.limit': '10000',
          'pagination.offset': '0',
        };
        await expect(
          neutronChain.queryAckFailures(contractAddress, pagination),
        ).rejects.toThrow(/limit is more than maximum allowed/);
      });
    });
  });
});
