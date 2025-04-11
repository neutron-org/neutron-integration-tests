import '@neutron-org/neutronjsplus';
import {
  CONTRACTS,
  COSMOS_DENOM,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { LocalState } from '../../helpers/local_state';
import { RunnerTestSuite, inject } from 'vitest';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { defaultRegistryTypes, SigningStargateClient } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { MsgTransfer } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/tx';

import config from '../../config.json';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { GaiaWallet, Wallet } from '../../helpers/wallet';

describe('Neutron / IBC hooks', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: GaiaWallet;
  let contractAddress: string;
  let fee: any;
  const transferDenom =
    'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.signer,
      neutronWallet.address,
    );
    gaiaWallet = testState.wallets.cosmos.demo2;
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.signer,
      { registry: new Registry(defaultRegistryTypes) },
    );
  });

  describe('Wallets', () => {
    test('Addresses', () => {
      expect(testState.wallets.neutron.demo1.address).toEqual(
        'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
      );
    });
  });

  describe('Instantiate hooks ibc transfer contract', () => {
    test('instantiate contract', async () => {
      contractAddress = await neutronClient.create(
        CONTRACTS.MSG_RECEIVER,
        {},
        'msg_receiver',
      );
    });
  });

  describe('IBC Hooks', () => {
    describe('Receive on neutron with memo wasm hook', () => {
      const transferAmount = 1000000;
      fee = {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
      };
      test('IBC transfer from a usual account', async () => {
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: {
                  denom: NEUTRON_DENOM,
                  amount: transferAmount.toString(),
                },
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
        await neutronClient.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await neutronClient.waitBlocks(10);
        const res = parseInt(
          (await gaiaClient.getBalance(gaiaWallet.address, transferDenom))
            .amount,
          10,
        );
        expect(res).toEqual(transferAmount);
      });

      test('IBC transfer of Neutrons from a remote chain to Neutron with wasm hook', async () => {
        const msg = '{"test_msg": {"return_err": false, "arg": "test"}}';
        fee = {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        };

        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: {
                  denom: transferDenom,
                  amount: transferAmount.toString(),
                },
                sender: gaiaWallet.address,
                receiver: contractAddress,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
                memo: `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
              }),
            },
          ],
          fee,
        );
        expect(res.code).toEqual(0);
        await neutronClient.waitBlocks(15);
      });

      test('check hook was executed successfully', async () => {
        await neutronClient.waitBlocks(15);
        const queryResult = await neutronClient.queryContractSmart(
          contractAddress,
          {
            test_msg: { arg: 'test' },
          },
        );
        // TODO: check that sender is Bech32(Hash("ibc-wasm-hook-intermediaryg" || channelID || sender))
        //  non-determined?
        // expect(queryResult.sender).toEqual(
        //   'neutron1y5j50gv2zw24e3xrkx3t06qdxknt9j0ev0aeh4dsqh4eggkc2r2q0hgm2v',
        // );
        expect(queryResult.funds).toEqual([
          { denom: 'untrn', amount: '1000000' },
        ]);
        expect(queryResult.count).toEqual(1);
      });

      test('check contract token balance', async () => {
        await neutronClient.waitBlocks(10);

        const res = parseInt(
          (await neutronClient.getBalance(contractAddress, NEUTRON_DENOM))
            .amount,
          10,
        );
        expect(res).toEqual(transferAmount);
      });
    });

    describe('Receive on neutron with incorrectly formatted message', () => {
      const transferAmount = 300000;
      test('IBC transfer from a usual account', async () => {
        const fee = {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: {
                  denom: NEUTRON_DENOM,
                  amount: transferAmount.toString(),
                },
                sender: neutronWallet.address,
                receiver: testState.wallets.cosmos.demo2.address,
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
        await neutronClient.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await neutronClient.waitBlocks(10);
        const balance = await gaiaClient.getBalance(
          testState.wallets.cosmos.demo2.address,
          transferDenom,
        );
        expect(+balance.amount).toEqual(transferAmount);
      });

      test('IBC transfer of Neutrons from a remote chain to Neutron with incorrect wasm hook message', async () => {
        const msg =
          '{"incorrect_msg_kind": {"return_err": false, "arg": "incorrect_msg_arg"}}';
        fee = {
          gas: '400000',
          amount: [{ denom: COSMOS_DENOM, amount: '2000' }],
        };
        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: {
                  denom: transferDenom,
                  amount: transferAmount.toString(),
                },
                sender: gaiaWallet.address,
                receiver: contractAddress,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
                memo: `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
              }),
            },
          ],
          fee,
        );

        expect(res.code).toEqual(0);
        await neutronClient.waitBlocks(15);
      });

      test('check hook was not executed successfully', async () => {
        await neutronClient.waitBlocks(15);
        const queryResult = await neutronClient.queryContractSmart(
          contractAddress,
          {
            test_msg: { arg: 'incorrect_msg_arg' },
          },
        );
        expect(queryResult).toEqual(null);
      });

      test('check contract token balance - it still has previous balance', async () => {
        await neutronClient.waitBlocks(10);

        const res = await neutronClient.getBalance(
          contractAddress,
          NEUTRON_DENOM,
        );
        expect(+res.amount).toEqual(1000000);
      });
    });

    describe('Receive on neutron with memo without wasm hook in it', () => {
      const transferAmount = 500000;

      test('IBC transfer of atom from a remote chain to Neutron with wasm hook', async () => {
        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: {
                  denom: COSMOS_DENOM,
                  amount: transferAmount.toString(),
                },
                sender: gaiaWallet.address,
                receiver: contractAddress,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
              }),
            },
          ],
          fee,
          `{"othermemohook": {}}`,
        );
        expect(res.code).toEqual(0);
        await neutronClient.waitBlocks(15);
      });

      test('check contract token balance', async () => {
        await neutronClient.waitBlocks(10);
        const res = await neutronClient.getBalance(
          contractAddress,
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        );
        expect(+res.amount).toEqual(transferAmount);
      });
    });

    describe('Receive on neutron with memo with wasm hook contract returning error', () => {
      const transferAmount = 500000;

      test('IBC transfer of atom from a remote chain to Neutron with wasm hook', async () => {
        const msg = '{"test_msg": {"return_err": true, "arg": ""}}';
        fee = {
          gas: '200000',
          amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
        };
        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: {
                  denom: COSMOS_DENOM,
                  amount: transferAmount.toString(),
                },
                sender: gaiaWallet.address,
                receiver: contractAddress,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
                memo: `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
              }),
            },
          ],
          fee,
        );

        expect(res.code).toEqual(0);
        await waitBlocks(15, gaiaClient);
      });

      test('check contract token balance', async () => {
        await neutronClient.waitBlocks(10);
        const res = await neutronClient.getBalance(
          contractAddress,
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        );
        expect(+res.amount).toEqual(transferAmount); // should equal to old balance since we returned error from the contract
      });
    });
  });
});
