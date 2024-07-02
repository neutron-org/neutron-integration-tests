import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { COSMOS_DENOM, NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { LocalState, createWalletWrapper } from '../../helpers/localState';
import { NeutronContract, CodeId } from '@neutron-org/neutronjsplus/dist/types';
import { inject } from 'vitest';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';

const config = require('../../config.json');

describe('Neutron / IBC hooks', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let gaiaChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let gaiaAccount: WalletWrapper;
  let contractAddress: string;
  const transferDenom =
    'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';

  beforeAll(async () => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronAccount = await createWalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
    gaiaChain = new CosmosWrapper(
      COSMOS_DENOM,
      testState.rest2,
      testState.rpc2,
    );
    gaiaAccount = await createWalletWrapper(
      gaiaChain,
      testState.wallets.cosmos.demo2,
    );
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
      codeId = await neutronAccount.storeWasm(NeutronContract.MSG_RECEIVER);
      expect(codeId).toBeGreaterThan(0);
    });
    test('instantiate contract', async () => {
      contractAddress = await neutronAccount.instantiateContract(
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
        const res = await neutronAccount.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: NEUTRON_DENOM, amount: transferAmount.toString() },
          testState.wallets.cosmos.demo2.address,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
        );
        expect(res.code).toEqual(0);
        await neutronChain.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await gaiaChain.waitBlocks(10);
        const res = await gaiaChain.queryDenomBalance(
          testState.wallets.cosmos.demo2.address,
          transferDenom,
        );
        expect(res).toEqual(transferAmount);
      });

      test('IBC transfer of Neutrons from a remote chain to Neutron with wasm hook', async () => {
        const msg = '{"test_msg": {"return_err": false, "arg": "test"}}';
        const res = await gaiaAccount.msgIBCTransfer(
          'transfer',
          'channel-0',
          {
            denom: transferDenom,
            amount: transferAmount.toString(),
          },
          contractAddress,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
          `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
        );
        expect(res.code).toEqual(0);
        await gaiaChain.waitBlocks(15);
      });

      test('check hook was executed successfully', async () => {
        await neutronChain.waitBlocks(15);
        const queryResult = await neutronChain.queryContract<TestArg>(
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
        await neutronChain.waitBlocks(10);

        const res = await neutronChain.queryDenomBalance(
          contractAddress,
          neutronChain.denom,
        );
        expect(res).toEqual(transferAmount);
      });
    });

    describe('Receive on neutron with incorrectly formatted message', () => {
      const transferAmount = 300000;
      test('IBC transfer from a usual account', async () => {
        const res = await neutronAccount.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: NEUTRON_DENOM, amount: transferAmount.toString() },
          testState.wallets.cosmos.demo2.address,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
        );
        expect(res.code).toEqual(0);
        await neutronChain.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await gaiaChain.waitBlocks(10);
        const balance = await gaiaChain.queryDenomBalance(
          testState.wallets.cosmos.demo2.address,
          transferDenom,
        );
        expect(balance).toEqual(transferAmount);
      });

      test('IBC transfer of Neutrons from a remote chain to Neutron with incorrect wasm hook message', async () => {
        const msg =
          '{"incorrect_msg_kind": {"return_err": false, "arg": "incorrect_msg_arg"}}';
        const res = await gaiaAccount.msgIBCTransfer(
          'transfer',
          'channel-0',
          {
            denom: transferDenom,
            amount: transferAmount.toString(),
          },
          contractAddress,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
          `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
        );
        expect(res.code).toEqual(0);
        await gaiaChain.waitBlocks(15);
      });

      test('check hook was not executed successfully', async () => {
        await neutronChain.waitBlocks(15);
        const queryResult = await neutronChain.queryContract<TestArg>(
          contractAddress,
          {
            test_msg: { arg: 'incorrect_msg_arg' },
          },
        );
        expect(queryResult).toEqual(null);
      });

      test('check contract token balance - it still has previous balance', async () => {
        await neutronChain.waitBlocks(10);

        const res = await neutronChain.queryDenomBalance(
          contractAddress,
          neutronChain.denom,
        );
        expect(res).toEqual(1000000);
      });
    });

    describe('Receive on neutron with memo without wasm hook in it', () => {
      const transferAmount = 500000;

      test('IBC transfer of atom from a remote chain to Neutron with wasm hook', async () => {
        const res = await gaiaAccount.msgIBCTransfer(
          'transfer',
          'channel-0',
          {
            denom: gaiaChain.denom,
            amount: transferAmount.toString(),
          },
          contractAddress,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
          `{"othermemohook": {}}`,
        );
        expect(res.code).toEqual(0);
        await gaiaChain.waitBlocks(15);
      });

      test('check contract token balance', async () => {
        await neutronChain.waitBlocks(10);
        const res = await neutronChain.queryDenomBalance(
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
        const res = await gaiaAccount.msgIBCTransfer(
          'transfer',
          'channel-0',
          {
            denom: gaiaChain.denom,
            amount: transferAmount.toString(),
          },
          contractAddress,
          {
            revisionNumber: BigInt(2),
            revisionHeight: BigInt(100000000),
          },
          `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
        );
        expect(res.code).toEqual(0);
        await gaiaChain.waitBlocks(15);
      });

      test('check contract token balance', async () => {
        await neutronChain.waitBlocks(10);
        const res = await neutronChain.queryDenomBalance(
          contractAddress,
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        );
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
