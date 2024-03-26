import Long from 'long';
import cosmosclient from '@cosmos-client/core';
import {
  cosmosWrapper,
  COSMOS_DENOM,
  NEUTRON_DENOM,
  TestStateLocalCosmosTestNet,
} from '@neutron-org/neutronjsplus';
import { MsgDeposit } from '@neutron-org/neutronjsplus/dist/proto/neutron/neutron/dex/tx_pb';
import { packAnyMsg } from '@neutron-org/neutronjsplus/dist/cosmos';

const config = require('../../config.json');

describe('Neutron / PFM', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: cosmosWrapper.CosmosWrapper;
  let gaiaChain: cosmosWrapper.CosmosWrapper;
  let neutronAccount: cosmosWrapper.WalletWrapper;
  let gaiaAccount: cosmosWrapper.WalletWrapper;
  let gaiaAccount2: cosmosWrapper.WalletWrapper;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    gaiaChain = new cosmosWrapper.CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      COSMOS_DENOM,
    );
    gaiaAccount = new cosmosWrapper.WalletWrapper(
      gaiaChain,
      testState.wallets.qaCosmos.genQaWal1,
    );
    gaiaAccount2 = new cosmosWrapper.WalletWrapper(
      gaiaChain,
      testState.wallets.qaCosmosTwo.genQaWal1,
    );
  });

  describe('IBC transfer', () => {
    describe('Multihops', () => {
      // 1. Check balance of Account 1 on Chain 1
      // 2. Check balance of Account 3 on Chain 2
      // 3. Check balance of Account 2 on Chain 1
      // 4. Account 1 on Chain 1 sends x tokens to Account 2 on Chain 1 via Account 3 on Chain 2
      // 5. Check Balance of Account 3 on Chain 2, confirm it stays the same
      // 6. Check Balance of Account 1 on Chain 1, confirm it is original minus x tokens
      // 7. Check Balance of Account 2 on Chain 1, confirm it is original plus x tokens
      test('IBC transfer from a usual account', async () => {
        const sender = gaiaAccount.wallet.address.toString();
        const middlehop = neutronAccount.wallet.address.toString();
        const receiver = gaiaAccount2.wallet.address.toString();
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
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
          `{"forward": {"receiver": "${receiver}", "port": "transfer", "channel": "channel-0"}}`,
        );
        expect(res.code).toEqual(0);

        await neutronChain.blockWaiter.waitBlocks(20);

        const middlehopNTRNBalanceAfter = await neutronChain.queryDenomBalance(
          middlehop,
          'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        );
        expect(middlehopNTRNBalanceAfter).toEqual(0);

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
  });

  // A -> B (swap) -> C
  describe('IBC transfer with Swap', () => {
    test('setup pool on chain B (neutron) for swap', async () => {
      const portName = 'transfer';
      const channelName = 'channel-0';
      const uatomIBCDenom = cosmosWrapper.getIBCDenom(
        portName,
        channelName,
        'uatom',
      );

      const depositMsg = new MsgDeposit({
        creator: neutronAccount.wallet.address.toString(),
        receiver: neutronAccount.wallet.address.toString(),
        tokenA: 'untrn',
        tokenB: uatomIBCDenom,
        amountsA: ['1000000'],
        amountsB: ['0'],
        tickIndexesAToB: [BigInt(22000)], // around 1 to 9 ratio (9.0240208687)
        fees: [BigInt(1)],
        options: [{ disableAutoswap: true }],
      });

      const fee = {
        gas_limit: Long.fromString('4000000'),
        amount: [{ denom: neutronAccount.chain.denom, amount: '10000' }],
      };

      const res = await neutronAccount.execTx(
        fee,
        [packAnyMsg('/neutron.dex.MsgDeposit', depositMsg)],
        10,
        cosmosclient.rest.tx.BroadcastTxMode.Sync,
      );
      console.log('deposit res: ' + JSON.stringify(res.tx_response?.raw_log));

      expect(res.tx_response?.code).toEqual(0);
    });

    test.skip('IBC swap with multihop', async () => {
      const sender = gaiaAccount.wallet.address.toString();
      const middlehop = neutronAccount.wallet.address.toString();
      const receiver = gaiaAccount2.wallet.address.toString();
      const senderNTRNBalanceBefore = await gaiaChain.queryDenomBalance(
        sender,
        COSMOS_DENOM,
      );
      console.log('senderNTRNBalanceBefore: ' + senderNTRNBalanceBefore);

      const receiverNTRNBalanceBefore = await gaiaChain.queryDenomBalance(
        receiver,
        COSMOS_DENOM,
      );
      console.log('receiverNTRNBalanceBefore: ' + receiverNTRNBalanceBefore);

      const transferAmount = 333333;

      // this memo will be handled on chain B (neutron)
      const memo = JSON.stringify({
        // TODO: memo for swap
        swap: {
          // If a value is provided for NeutronRefundAddress and the swap fails the Transfer.Amount will be moved to this address for later recovery.
          // If no NeutronRefundAddress is provided and a swap fails we will fail the ibc transfer and tokens will be refunded on the source chain.
          // neutron_refund_account: '',
          // TODO
          creator: '',
          receiver: '',
          token_in: '',
          token_out: '',
          tick_index_in_to_out: 1,
          amount_in: '',
          order_type: 1, // FillOrKill
          // expiration_time: { seconds: 1, nanos: 1 },
          // max_amount_out: '1000000',

          next: {
            forward: {
              receiver: receiver,
              port: 'transfer',
              channel: 'channel-0',
            },
          },
        },
      });

      const res = await gaiaAccount.msgIBCTransfer(
        'transfer',
        'channel-0',
        { denom: COSMOS_DENOM, amount: transferAmount.toString() },
        middlehop,
        {
          revision_number: new Long(2),
          revision_height: new Long(100000000),
        },
        memo,
      );
      expect(res.code).toEqual(0);
    });
  });
});
