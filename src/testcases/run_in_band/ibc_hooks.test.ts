import '@neutron-org/neutronjsplus';
import {COSMOS_DENOM, NEUTRON_DENOM, wait} from '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import {NeutronContract, CodeId, Wallet} from '@neutron-org/neutronjsplus/dist/types';
import {inject, Suite} from 'vitest';
import {SigningNeutronClient} from "../../helpers/signing_neutron_client";
import {defaultRegistryTypes, SigningStargateClient} from "@cosmjs/stargate";
import {Registry} from "@cosmjs/proto-signing";
import {MsgTransfer} from "cosmjs-types/ibc/applications/transfer/v1/tx";

const config = require('../../config.json');

describe('Neutron / IBC hooks', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: Wallet;
  let contractAddress: string;
  let fee: any;
  const transferDenom =
    'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';

  beforeAll(async (suite: Suite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    gaiaWallet = await testState.nextWallet('cosmos');
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.directwallet,
      { registry: new Registry(defaultRegistryTypes) },
    );

    fee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
    };
  });

  describe('Wallets', () => {
    test('Addresses', () => {
      expect(testState.wallets.neutron.demo1.address).toEqual(
        'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
      );
      expect(testState.wallets.cosmos.demo2.address).toEqual(
        'cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw',
      );
    });
  });

  describe('Instantiate hooks ibc transfer contract', () => {
    let codeId: CodeId;
    test('store contract', async () => {
      codeId = await neutronClient.upload(NeutronContract.MSG_RECEIVER);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate contract', async () => {
      contractAddress = await neutronClient.instantiate(
        codeId,
        {},
        'msg_receiver',
      );
    });
  });

  describe('IBC Hooks', () => {
    describe('Receive on neutron with memo wasm hook', () => {
      const transferAmount = 1000000;
      test('IBC transfer from a usual account', async () => {
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: { denom: transferDenom, amount: transferAmount.toString()},
                sender: neutronWallet.address,
                receiver: testState.wallets.cosmos.demo2.address,
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
        await neutronClient.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await gaiaClient.waitBlocks(10);
        const res = parseInt((await gaiaClient.getBalance(
          testState.wallets.cosmos.demo2.address,
          transferDenom,
        )).amount, 10);
        expect(res).toEqual(transferAmount);
      });

      test('IBC transfer of Neutrons from a remote chain to Neutron with wasm hook', async () => {
        const msg = '{"test_msg": {"return_err": false, "arg": "test"}}';
        // const res = await gaiaWallet.msgIBCTransfer(
        //   'transfer',
        //   'channel-0',
        //   {
        //     denom: transferDenom,
        //     amount: transferAmount.toString(),
        //   },
        //   contractAddress,
        //   {
        //     revisionNumber: 2n,
        //     revisionHeight: 100000000n,
        //   },
        //   `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
        // );

        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: { denom: transferDenom, amount: transferAmount.toString() },
                sender: neutronWallet.address,
                receiver: contractAddress,
                timeoutHeight: {
                  revisionNumber: BigInt(2),
                  revisionHeight: BigInt(100000000),
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
        const queryResult = await neutronClient.client.queryContractSmart<TestArg>(
          contractAddress,
          {
            test_msg: { arg: 'test' },
          },
        );
        // TODO: check that sender is Bech32(Hash("ibc-wasm-hook-intermediaryg" || channelID || sender))
        expect(queryResult.sender).toEqual(
          'neutron1a6j9ylg9le3hq4873t7p54rkvx0nf7kn9etmvqel8cn8apn8844sd2esqj',
        );
        expect(queryResult.funds).toEqual([
          { denom: 'untrn', amount: '1000000' },
        ]);
        expect(queryResult.count).toEqual(1);
      });

      test('check contract token balance', async () => {
        await neutronClient.waitBlocks(10);

        const res = parseInt((await neutronClient.client.getBalance(
          contractAddress,
          NEUTRON_DENOM,
        )).amount, 10);
        expect(res).toEqual(transferAmount);
      });
    });

    describe('Receive on neutron with incorrectly formatted message', () => {
      const transferAmount = '300000';
      test('IBC transfer from a usual account', async () => {

        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: { denom: NEUTRON_DENOM, amount: '1000' },
                sender: neutronWallet.address,
                receiver: testState.wallets.cosmos.demo2.address,
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
        await neutronClient.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await gaiaClient.waitBlocks(10);
        const balance = await gaiaClient.getBalance(
          testState.wallets.cosmos.demo2.address,
          transferDenom,
        );
        expect(balance).toEqual(transferAmount);
      });

      test('IBC transfer of Neutrons from a remote chain to Neutron with incorrect wasm hook message', async () => {
        const msg =
          '{"incorrect_msg_kind": {"return_err": false, "arg": "incorrect_msg_arg"}}';
        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: { denom: transferDenom, amount: transferAmount },
                sender: gaiaWallet.address,
                receiver: contractAddress,
                timeoutHeight: {
                  revisionNumber: BigInt(2),
                  revisionHeight: BigInt(100000000),
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
        const queryResult = await neutronClient.client.queryContractSmart<TestArg>(
          contractAddress,
          {
            test_msg: { arg: 'incorrect_msg_arg' },
          },
        );
        expect(queryResult).toEqual(null);
      });

      test('check contract token balance - it still has previous balance', async () => {
        await neutronClient.waitBlocks(10);

        const res = await neutronClient.client.queryContractSmart(
          contractAddress,
          COSMOS_DENOM,
        );
        expect(res).toEqual(1000000);
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
                token: { denom: COSMOS_DENOM, amount: transferAmount.toString() },
                sender: gaiaWallet.address,
                receiver: contractAddress,
                timeoutHeight: {
                  revisionNumber: BigInt(2),
                  revisionHeight: BigInt(100000000),
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
        expect(res).toEqual(transferAmount);
      });
    });

    describe('Receive on neutron with memo with wasm hook contract returning error', () => {
      const transferAmount = 500000;

      test('IBC transfer of atom from a remote chain to Neutron with wasm hook', async () => {
        const msg = '{"test_msg": {"return_err": true, "arg": ""}}';
        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: MsgTransfer.typeUrl,
              value: MsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: 'channel-0',
                token: { denom: COSMOS_DENOM, amount: transferAmount.toString() },
                sender: gaiaWallet.address,
                receiver: contractAddress,
                timeoutHeight: {
                  revisionNumber: BigInt(2),
                  revisionHeight: BigInt(100000000),
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

      test('check contract token balance', async () => {
        await neutronClient.waitBlocks(10);
        const res = parseInt((await neutronClient.getBalance(
          contractAddress,
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        )).amount, 10);
        expect(res).toEqual(transferAmount); // should equal to old balance since we returned error from the contract
      });
    });
  });
});

type TestArg = {
  sender: string | null;
  funds: { denom: string; amount: string }[];
  count: number;
};
