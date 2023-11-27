import Long from 'long';
import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  COSMOS_DENOM,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import {
  NeutronContract,
  CodeId,
} from '@neutron-org/neutronjsplus/dist/types';

const config = require('../../config.json');

describe('Neutron / IBC hooks', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let gaiaChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let gaiaAccount: WalletWrapper;
  let contractAddress: string;
  const transferDenom =
    'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
    gaiaChain = new CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      COSMOS_DENOM,
    );
    gaiaAccount = new WalletWrapper(gaiaChain, testState.wallets.cosmos.demo2);
  });

  describe('Wallets', () => {
    test('Addresses', () => {
      expect(testState.wallets.neutron.demo1.address.toString()).toEqual(
        'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
      );
      expect(testState.wallets.cosmos.demo2.address.toString()).toEqual(
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
      contractAddress = (
        await neutronAccount.instantiateContract(codeId, '{}', 'msg_receiver')
      )[0]._contract_address;
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
          testState.wallets.cosmos.demo2.address.toString(),
          {
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
        );
        expect(res.code).toEqual(0);
        await neutronChain.blockWaiter.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await gaiaChain.blockWaiter.waitBlocks(10);
        const res = await gaiaChain.queryDenomBalance(
          testState.wallets.cosmos.demo2.address.toString(),
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
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
          `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
        );
        expect(res.code).toEqual(0);
        await gaiaChain.blockWaiter.waitBlocks(15);
      });

      test('check hook was executed successfully', async () => {
        await neutronChain.blockWaiter.waitBlocks(15);
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
        await neutronChain.blockWaiter.waitBlocks(10);

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
          testState.wallets.cosmos.demo2.address.toString(),
          {
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
        );
        expect(res.code).toEqual(0);
        await neutronChain.blockWaiter.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await gaiaChain.blockWaiter.waitBlocks(10);
        const balance = await gaiaChain.queryDenomBalance(
          testState.wallets.cosmos.demo2.address.toString(),
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
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
          `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
        );
        expect(res.code).toEqual(0);
        await gaiaChain.blockWaiter.waitBlocks(15);
      });

      test('check hook was not executed successfully', async () => {
        await neutronChain.blockWaiter.waitBlocks(15);
        const queryResult = await neutronChain.queryContract<TestArg>(
          contractAddress,
          {
            test_msg: { arg: 'incorrect_msg_arg' },
          },
        );
        expect(queryResult).toEqual(null);
      });

      test('check contract token balance - it still has previous balance', async () => {
        await neutronChain.blockWaiter.waitBlocks(10);

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
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
          `{"othermemohook": {}}`,
        );
        expect(res.code).toEqual(0);
        await gaiaChain.blockWaiter.waitBlocks(15);
      });

      test('check contract token balance', async () => {
        await neutronChain.blockWaiter.waitBlocks(10);
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
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
          `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
        );
        expect(res.code).toEqual(0);
        await gaiaChain.blockWaiter.waitBlocks(15);
      });

      test('check contract token balance', async () => {
        await neutronChain.blockWaiter.waitBlocks(10);
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
