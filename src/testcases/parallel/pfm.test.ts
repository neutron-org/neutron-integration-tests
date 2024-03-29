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
  let neutronAccount2: cosmosWrapper.WalletWrapper;
  let depositor: cosmosWrapper.WalletWrapper;
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
    neutronAccount2 = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFive.genQaWal1,
    );
    depositor = new cosmosWrapper.WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronThree.genQaWal1,
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
      test.skip('IBC transfer from a usual account', async () => {
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

  describe('IBC transfer with Swap', () => {
    let uatomIBCDenom: string;

    test('setup pool on chain B (neutron) for swap', async () => {
      const portName = 'transfer';
      const channelName = 'channel-0';
      uatomIBCDenom = cosmosWrapper.getIBCDenom(portName, channelName, 'uatom');
      const depositMsg = new MsgDeposit({
        creator: depositor.wallet.address.toString(),
        receiver: depositor.wallet.address.toString(),
        tokenA: uatomIBCDenom,
        tokenB: 'untrn',
        amountsA: ['0'],
        amountsB: ['1000000000'],
        tickIndexesAToB: [BigInt(15000)], // 22000 -> around 1 to 9 ratio (9.0240208687)
        fees: [BigInt(100)],
        options: [{ disableAutoswap: true }],
      });

      const fee = {
        gas_limit: Long.fromString('4000000'),
        amount: [{ denom: neutronAccount.chain.denom, amount: '10000' }],
      };

      const res = await depositor.execTx(
        fee,
        [packAnyMsg('/neutron.dex.MsgDeposit', depositMsg)],
        10,
        cosmosclient.rest.tx.BroadcastTxMode.Sync,
      );
      console.log('deposit res: ' + JSON.stringify(res.tx_response?.raw_log));

      expect(res.tx_response?.code).toEqual(0);
    });

    // A -> B (swap) | no PFM used
    test('IBC swap', async () => {

      // const sender = gaiaAccount.wallet.address.toString();
      const receiver = neutronAccount2.wallet.address.toString();

      const receiverNTRNBalanceBefore = await neutronChain.queryDenomBalance(
        receiver,
        'untrn',
      );

      console.log('receiver: ' + receiver);
      console.log('receiverNTRNBalanceBefore: ' + receiverNTRNBalanceBefore);

      const transferAmount = 500000;
      // gaia -> neutron SWAP
      const memo = JSON.stringify({
        swap: {
          // If a value is provided for NeutronRefundAddress and the swap fails
          // the Transfer.Amount will be moved to this address for later recovery.
          // If no NeutronRefundAddress is provided and a swap fails
          // we will fail the ibc transfer and tokens will be refunded on the source chain.
          // neutron_refund_account: '',
          creator: receiver,
          receiver: receiver,
          token_in: uatomIBCDenom,
          token_out: 'untrn',
          tick_index_in_to_out: 16000,
          amount_in: transferAmount.toString(),
          order_type: 1, // FillOrKill
          // expiration_time: { seconds: 1, nanos: 1 },
          // max_amount_out: '1000000',
        },
      });

      // console.log('before swap');

      const res = await gaiaAccount.msgIBCTransfer(
        'transfer',
        'channel-0',
        { denom: COSMOS_DENOM, amount: transferAmount.toString() },
        receiver,
        {
          revision_number: new Long(2),
          revision_height: new Long(100000000),
        },
        memo,
      );
      expect(res.code).toEqual(0);
      console.log('multihop with ibc swap: \n' + JSON.stringify(res.raw_log));
      // console.log('after swap');

      // const portName = 'transfer';
      // const channelName = 'channel-0';
      // const untrnIBCDenom = cosmosWrapper.getIBCDenom(
      //   portName,
      //   channelName,
      //   'untrn',
      // );

      // const receiverBalances = await gaiaChain.queryBalances(
      //   receiver,
      //   // untrnIBCDenom,
      // );

      await neutronChain.blockWaiter.waitBlocks(15);

      const receiverNTRNBalanceAfter = await neutronChain.queryDenomBalance(
        receiver,
        'untrn',
      );
      console.log('receiverNTRNBalanceBefore: ' + receiverNTRNBalanceBefore);
      console.log('receiverNTRNBalanceAfter: ' + receiverNTRNBalanceAfter);

      // console.log('receiverIBCNeutron: ' + receiverIBCNeutron.toString());
      // console.log('receiverBalances: ' + JSON.stringify(receiverBalances));
      // console.log('expected receiver: ' + receiver);
    });

    // A -> B (swap) -> C
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

      const transferAmount = 500000;
      // gaia -> neutron SWAP -> gaia
      const memo = JSON.stringify({
        swap: {
          // If a value is provided for NeutronRefundAddress and the swap fails
          // the Transfer.Amount will be moved to this address for later recovery.
          // If no NeutronRefundAddress is provided and a swap fails
          // we will fail the ibc transfer and tokens will be refunded on the source chain.
          // neutron_refund_account: '',
          creator: middlehop,
          receiver: middlehop,
          token_in: uatomIBCDenom,
          token_out: 'untrn',
          tick_index_in_to_out: 16000,
          amount_in: transferAmount.toString(),
          order_type: 1, // FillOrKill
          // expiration_time: { seconds: 1, nanos: 1 },
          // max_amount_out: '1000000',

          next: {
            forward: {
              receiver: receiver,
              port: 'transfer',
              channel: 'channel-0',
              // timeout: '',
              // retries: '',
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
      console.log('multihop with ibc swap: \n' + JSON.stringify(res.raw_log));

      // const portName = 'transfer';
      // const channelName = 'channel-0';
      // const untrnIBCDenom = cosmosWrapper.getIBCDenom(
      //   portName,
      //   channelName,
      //   'untrn',
      // );

      const receiverBalances = await gaiaChain.queryBalances(
        receiver,
        // untrnIBCDenom,
      );

      await neutronChain.blockWaiter.waitBlocks(15);

      // console.log('receiverIBCNeutron: ' + receiverIBCNeutron.toString());
      console.log('receiverBalances: ' + JSON.stringify(receiverBalances));
      console.log('expected receiver: ' + receiver);
    });
  });

  // TODO: test neutron_refund_account works
});
