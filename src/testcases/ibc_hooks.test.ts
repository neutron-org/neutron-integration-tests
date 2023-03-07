import Long from 'long';
import {
  COSMOS_DENOM,
  CosmosWrapper,
  NEUTRON_DENOM,
  NeutronContract,
} from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';

describe('Neutron / IBC hooks', () => {
  let testState: TestStateLocalCosmosTestNet;
  let ntrnDemo1: CosmosWrapper;
  let cosmosDemo2: CosmosWrapper;
  let contractAddress: string;
  const transferDenom =
    'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    ntrnDemo1 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cosmosDemo2 = new CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      testState.wallets.cosmos.demo2,
      COSMOS_DENOM,
    );
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

  describe('Instantiate interchain queries contract', () => {
    let codeId: string;
    test('store contract', async () => {
      codeId = await ntrnDemo1.storeWasm(NeutronContract.HOOK_IBC_TRANSFER);
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test('instantiate contract', async () => {
      contractAddress = (
        await ntrnDemo1.instantiate(codeId, '{}', 'hook_ibc_transfer')
      )[0]._contract_address;
    });
  });

  describe('IBC Hooks', () => {
    // TODO: receive on neutron without memo - works normally
    // TODO: receive on neutron without memo with 'wasm' json in it - works normally
    describe('Receive on neutron with memo wasm hook', () => {
      const transferAmount = '1000000';
      test('IBC transfer from a usual account', async () => {
        const res = await ntrnDemo1.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: NEUTRON_DENOM, amount: transferAmount },
          testState.wallets.cosmos.demo2.address.toString(),
          {
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
        );
        expect(res.code).toEqual(0);
        await ntrnDemo1.blockWaiter.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await cosmosDemo2.blockWaiter.waitBlocks(10);
        const balances = await cosmosDemo2.queryBalances(
          testState.wallets.cosmos.demo2.address.toString(),
        );
        expect(
          balances.balances.find((bal): boolean => bal.denom == transferDenom)
            ?.amount,
        ).toEqual(transferAmount);
      });

      test('IBC transfer of Neutrons from a remote chain to Neutron with wasm hook', async () => {
        const msg = '{"test_msg": {"return_err": false, "arg": "test"}}';
        const res = await cosmosDemo2.msgIBCTransfer(
          'transfer',
          'channel-0',
          {
            denom: transferDenom,
            amount: transferAmount,
          },
          contractAddress,
          {
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
          `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
        );
        expect(res.code).toEqual(0);
        await cosmosDemo2.blockWaiter.waitBlocks(15);
      });

      test('check hook was executed successfully', async () => {
        await ntrnDemo1.blockWaiter.waitBlocks(15);
        const queryResult = await ntrnDemo1.queryContract<{
          sender: string | null;
          funds: { denom: string; amount: string }[];
        }>(contractAddress, {
          test_msg: { arg: 'test' },
        });
        // TODO: check that sender is Bech32(Hash("ibc-wasm-hook-intermediaryg" || channelID || sender))
        expect(queryResult.sender).toEqual(
          'neutron1a6j9ylg9le3hq4873t7p54rkvx0nf7kn9etmvqel8cn8apn8844sd2esqj',
        );
        expect(queryResult.funds).toEqual([
          { denom: 'untrn', amount: '1000000' },
        ]);
      });

      test('check contract token balance', async () => {
        await ntrnDemo1.blockWaiter.waitBlocks(10);

        const res = await ntrnDemo1.queryBalances(contractAddress);
        expect(
          res.balances.find((b): boolean => b.denom == ntrnDemo1.denom)?.amount,
        ).toEqual(transferAmount);
      });
    });

    describe('Receive on neutron with incorrectly formatted message', () => {
      const transferAmount = '1000000';
      test('IBC transfer from a usual account', async () => {
        const res = await ntrnDemo1.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: NEUTRON_DENOM, amount: transferAmount },
          testState.wallets.cosmos.demo2.address.toString(),
          {
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
        );
        expect(res.code).toEqual(0);
        await ntrnDemo1.blockWaiter.waitBlocks(10);
      });

      test('check IBC token balance', async () => {
        await cosmosDemo2.blockWaiter.waitBlocks(10);
        const balances = await cosmosDemo2.queryBalances(
          testState.wallets.cosmos.demo2.address.toString(),
        );
        expect(
          balances.balances.find((bal): boolean => bal.denom == transferDenom)
            ?.amount,
        ).toEqual(transferAmount);
      });

      test('IBC transfer of Neutrons from a remote chain to Neutron with incorrect wasm hook message', async () => {
        const msg =
          '{"incorrect_msg_kind": {"return_err": false, "arg": "incorrect_msg"}}';
        const res = await cosmosDemo2.msgIBCTransfer(
          'transfer',
          'channel-0',
          {
            denom: transferDenom,
            amount: transferAmount,
          },
          contractAddress,
          {
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
          `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
        );
        expect(res.code).toEqual(0);
        await cosmosDemo2.blockWaiter.waitBlocks(15);
      });

      // TODO: check as well, also it requires previous call to fail IBC transfer funds
      // test('IBC transfer of Neutrons from a remote chain to Neutron with wasm hook error returned from contract', async () => {
      //   const msg = '{"test_msg": {"return_err": true, "arg": ""}}';
      //   const res = await cosmosDemo2.msgIBCTransfer(
      //     'transfer',
      //     'channel-0',
      //     {
      //       denom: transferDenom,
      //       amount: transferAmount,
      //     },
      //     contractAddress,
      //     {
      //       revision_number: new Long(2),
      //       revision_height: new Long(100000000),
      //     },
      //     `{"wasm": {"contract": "${contractAddress}", "msg": ${msg}}}`,
      //   );
      //   expect(res.code).toEqual(0);
      //   await cosmosDemo2.blockWaiter.waitBlocks(15);
      // });

      test('check hook was not executed successfully', async () => {
        await ntrnDemo1.blockWaiter.waitBlocks(15);
        const queryResult = await ntrnDemo1.queryContract<{
          sender: string;
          funds: { denom: string; amount: string }[];
        }>(contractAddress, {
          test_msg: { arg: 'incorrect_msg' },
        });
        expect(queryResult.sender).toEqual('');
        expect(queryResult.funds).toEqual([]);
      });

      // TODO: check why
      test('check contract token balance - it still received tokens', async () => {
        await ntrnDemo1.blockWaiter.waitBlocks(10);

        const res = await ntrnDemo1.queryBalances(contractAddress);
        expect(
          res.balances.find((b): boolean => b.denom == ntrnDemo1.denom)?.amount,
        ).toEqual(transferAmount);
      });
    });

    // TODO: without IBC_callback works as normal

    describe('Send from neutron with ibc_callback in memo', () => {
      test('set fees', async () => {
        const res = await ntrnDemo1.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: ntrnDemo1.denom,
              ack_fee: '2333',
              recv_fee: '0',
              timeout_fee: '2333',
            },
          }),
        );
        expect(res.code).toEqual(0);
      });

      test('send fees amount to contract', async () => {
        await ntrnDemo1.msgSend(contractAddress, (2333 * 2).toString());
      });

      test('execute ibc send using contract', async () => {
        const msg = {
          send: {
            channel: 'channel-0',
            to: testState.wallets.cosmos.demo2.address.toString(),
            denom: ntrnDemo1.denom,
            amount: '1000000',
            timeout_height: null,
            memo: `{"ibc_callback": "${contractAddress}"}`,
          },
        };
        const res = await ntrnDemo1.executeContract(
          contractAddress,
          JSON.stringify(msg),
        );
        expect(res.code).toEqual(0);
        await ntrnDemo1.blockWaiter.waitBlocks(15);
      });

      // OPTIONAL
      test('balance on cosmos and neutron sides updated', async () => {
        // TODO
      });

      test('ibc callback on contract called', async () => {
        await ntrnDemo1.blockWaiter.waitBlocks(15);
        const queryResult = await ntrnDemo1.queryContract<{
          ack: {
            response: boolean;
            timeout: any;
          };
        }>(contractAddress, {
          test_ack: {},
        });
        expect(queryResult.ack).toEqual({ response: true });
      });
    });

    // TODO: bad cases: invalid address, no callback defined, error returned from callback

    // TODO: timeout?

    // TODO: send with ibc_callback using MsgTransfer
  });
});
