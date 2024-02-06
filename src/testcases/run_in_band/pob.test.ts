import '@neutron-org/neutronjsplus';
import Long from 'long';
import { MsgSend } from '@neutron-org/neutronjsplus/dist/proto/cosmos_sdk/cosmos/bank/v1beta1/tx_pb';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  packAnyMsg,
  WalletWrapper,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { InlineResponse20071TxResponseEvents } from '@cosmos-client/ibc/cjs/openapi/api';
import { getHeight } from '@neutron-org/neutronjsplus/dist/env';
const fee = {
  gas_limit: Long.fromString('200000'),
  amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
};

const config = require('../../config.json');

describe('Neutron / IBC hooks', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let n1: WalletWrapper;
  let TreasuryAddress: string;

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
    n1 = new WalletWrapper(neutronChain, testState.wallets.qaNeutron.genQaWal1);

    TreasuryAddress = (await neutronChain.getChainAdmins())[0];
  });

  describe('POB', () => {
    test('single pob tx', async () => {
      await neutronChain.blockWaiter.waitBlocks(1);
      const amount = '1000000';
      const to = n1.wallet.address.toString();
      const msgSend = new MsgSend({
        fromAddress: neutronAccount.wallet.address.toString(),
        toAddress: to,
        amount: [{ denom: NEUTRON_DENOM, amount }],
      });
      const txBuilder = neutronAccount.buildTx(
        fee,
        [packAnyMsg('/cosmos.bank.v1beta1.MsgSend', msgSend)],
        Number(neutronAccount.wallet.account.sequence) + 1,
        (await getHeight(neutronChain.sdk)) + 1,
      );
      const d = Buffer.from(txBuilder.txBytes(), 'base64');
      await neutronAccount.msgSendAuction(
        neutronAccount.wallet.address.toString(),
        {
          denom: NEUTRON_DENOM,
          amount: '1000',
        },
        [d],
      );
      neutronAccount.wallet.account.sequence++;
    });

    test('single pob tx(zero tx fee)', async () => {
      // zero tx only works works if no globalfee module configured
      const amount = '1000000';
      const to = n1.wallet.address.toString();
      const msgSend = new MsgSend({
        fromAddress: neutronAccount.wallet.address.toString(),
        toAddress: to,
        amount: [{ denom: NEUTRON_DENOM, amount }],
      });
      const txBuilder = neutronAccount.buildTx(
        {
          gas_limit: Long.fromString('1000000'),
          amount: [{ denom: NEUTRON_DENOM, amount: '0' }],
        },
        [packAnyMsg('/cosmos.bank.v1beta1.MsgSend', msgSend)],
        Number(neutronAccount.wallet.account.sequence) + 1,
        (await getHeight(neutronChain.sdk)) + 1,
      );
      const d = Buffer.from(txBuilder.txBytes(), 'base64');
      await neutronAccount.msgSendAuction(
        neutronAccount.wallet.address.toString(),
        {
          denom: NEUTRON_DENOM,
          amount: '1000',
        },
        [d],
      );
      neutronAccount.wallet.account.sequence++;
    });

    test('backrun tx + decreased fee', async () => {
      const amount = '1000000';
      const to = n1.wallet.address.toString();
      const backrunnedMsgSend = new MsgSend({
        fromAddress: neutronAccount.wallet.address.toString(),
        toAddress: to,
        amount: [{ denom: NEUTRON_DENOM, amount }],
      });
      const backrunnerTxBuilder = neutronAccount.buildTx(
        fee,
        [packAnyMsg('/cosmos.bank.v1beta1.MsgSend', backrunnedMsgSend)],
        +neutronAccount.wallet.account.sequence,
        (await getHeight(neutronChain.sdk)) + 2,
      );
      // wait for new block, to be sured the next txs are sent within a single block
      await neutronChain.blockWaiter.waitBlocks(1);
      await neutronAccount.broadcastTx(backrunnerTxBuilder);
      // tx broadcasted with origHash in Sync mode, we want to "rebroadcast it" by another user with POB
      const msgSendN1 = new MsgSend({
        fromAddress: n1.wallet.address.toString(),
        toAddress: to,
        amount: [{ denom: NEUTRON_DENOM, amount }],
      });
      const txBuilderN1 = n1.buildTx(
        fee,
        [packAnyMsg('/cosmos.bank.v1beta1.MsgSend', msgSendN1)],
        Number(n1.wallet.account.sequence) + 1,
        (await getHeight(neutronChain.sdk)) + 1,
      );
      const overriderMsgSend = new MsgSend({
        fromAddress: neutronAccount.wallet.address.toString(),
        toAddress: to,
        amount: [{ denom: NEUTRON_DENOM, amount }],
      });
      const overriderTxBuilder = neutronAccount.buildTx(
        {
          gas_limit: Long.fromString('200000'),
          amount: [{ denom: NEUTRON_DENOM, amount: '0' }],
        },
        [packAnyMsg('/cosmos.bank.v1beta1.MsgSend', overriderMsgSend)],
        // a previous broadcast event has increased seq_number, but we want to override it
        Number(neutronAccount.wallet.account.sequence) - 1,
        (await getHeight(neutronChain.sdk)) + 1,
      );
      const overriderTxData = Buffer.from(
        overriderTxBuilder.txBytes(),
        'base64',
      );
      const txData = Buffer.from(txBuilderN1.txBytes(), 'base64');
      const balBeforeAuction = await n1.chain.queryDenomBalance(
        TreasuryAddress,
        'untrn',
      );
      const res = await n1.msgSendAuction(
        n1.wallet.address.toString(),
        {
          denom: NEUTRON_DENOM,
          amount: '1000',
        },
        [overriderTxData, txData],
      );
      expect(res.code).toEqual(0);
      const [{ events }] = JSON.parse(res.raw_log || '[]') as {
        events: InlineResponse20071TxResponseEvents[];
      }[];
      const attrs = events.find((e) => e.type === 'auction_bid')?.attributes;
      expect(attrs).toEqual(
        expect.arrayContaining([
          {
            key: 'bid',
            value: `1000${NEUTRON_DENOM}`,
          },
        ]),
      );
      const balAfterAuction = await n1.chain.queryDenomBalance(
        TreasuryAddress,
        'untrn',
      );
      expect(balAfterAuction - balBeforeAuction).toBe(750);
      n1.wallet.account.sequence++;
    });

    test('frontrun should fail', async () => {
      const amount = '1000000';
      const to = n1.wallet.address.toString();
      const frontrunnedMsgSend = new MsgSend({
        fromAddress: neutronAccount.wallet.address.toString(),
        toAddress: to,
        amount: [{ denom: NEUTRON_DENOM, amount }],
      });
      const frontrunnedTxBuilder = neutronAccount.buildTx(fee, [
        packAnyMsg('/cosmos.bank.v1beta1.MsgSend', frontrunnedMsgSend),
      ]);
      // wait for new block, to be sured the next txs are sent within one block
      await neutronChain.blockWaiter.waitBlocks(1);
      await neutronAccount.broadcastTx(frontrunnedTxBuilder);
      // tx broadcasted with origHash in Sync mode, we want to "rebroadcast it" by another user with POB
      const maliciousMsgSend = new MsgSend({
        fromAddress: n1.wallet.address.toString(),
        toAddress: to,
        amount: [{ denom: NEUTRON_DENOM, amount }],
      });
      const maliciousTxBuilder = n1.buildTx(
        fee,
        [packAnyMsg('/cosmos.bank.v1beta1.MsgSend', maliciousMsgSend)],
        Number(n1.wallet.account.sequence) + 1,
      );
      const maliciousTxData = Buffer.from(
        maliciousTxBuilder.txBytes(),
        'base64',
      );
      const frontrunnedTxData = Buffer.from(
        frontrunnedTxBuilder.txBytes(),
        'base64',
      );
      await expect(
        n1.msgSendAuction(
          n1.wallet.address.toString(),
          {
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
          [maliciousTxData, frontrunnedTxData],
        ),
      ).rejects.toThrow(/possible front-running or sandwich attack/);
      n1.wallet.account.sequence++;
    });
  });
});
