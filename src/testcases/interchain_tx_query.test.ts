import { rest, proto } from '@cosmos-client/core';
import { BLOCK_TIME, CosmosWrapper, getEventAttributesFromTx } from "../helpers/cosmos";
import { AccAddress } from '@cosmos-client/core/cjs/types';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { wait } from "../helpers/sleep";
import Long from 'long';

describe('Neutron / Interchain TX Query', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let contractAddress: string;
  const connectionId: string = "connection-0";

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(testState.sdk_1, testState.wallets.demo1);
    cm2 = new CosmosWrapper(testState.sdk_2, testState.wallets.demo2);
  });

  describe("deploy contract", () => {
    let codeId: string;
    test("store contract", async () => {
      codeId = await cm.storeWasm("neutron_interchain_queries.wasm");
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test("instantiate contract", async () => {
      contractAddress = await cm.instantiate(codeId, "{}", "neutron_interchain_queries");
      expect(contractAddress).toEqual(
        "neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s5c2epq"
      );
    });
  });

  const addr1: string = "neutron1fj6yqrkpw6fmp7f7jhj57dujfpwal4m25dafzx";
  const addr2: string = "neutron14uxvu22lhrazyxadaqv5d6lswu0p276ll7hrkl";
  const addr3: string = "neutron1m4n7gt76c4edkcpg698pwy56jkxqsre4gpgg26";
  const watchedAddr1: string = addr1;
  const query1UpdatePeriod: number = 5;
  describe("utilise single transfers query", () => {
    test("register transfers query", async () => {
      await registerTransfersQuery(
        cm,
        contractAddress,
        testState.sdk_2.chainID,
        connectionId,
        query1UpdatePeriod,
        watchedAddr1,
      );
    });

    test("check registered transfers query", async () => {
      let query = await getRegisteredQuery(cm, contractAddress, 1);
      expect(query.registered_query.id).toEqual(1);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual("tx");
      expect(query.registered_query.transactions_filter).toEqual("{\"transfer.recipient\":\"" + watchedAddr1 + "\"}");
      expect(query.registered_query.zone_id).toEqual(testState.sdk_2.chainID);
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query1UpdatePeriod);
    });

    test("handle callback on a sending", async () => {
      let balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(watchedAddr1, '10000');
      expect(res.length).toBeGreaterThan(0);
      balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: '10000', denom: 'stake' },
      ]);

      await wait(query1UpdatePeriod * BLOCK_TIME);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr1);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "10000",
        },
      ]);
    });

    test("handle callback on a sending to a different address", async () => {
      const differentAddr = addr2;
      let balances = await cm2.queryBalances(differentAddr);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(differentAddr, '5000');
      expect(res.length).toBeGreaterThan(0);
      balances = await cm2.queryBalances(differentAddr);
      expect(balances.balances).toEqual([
        { amount: '5000', denom: 'stake' },
      ]);
      await wait(query1UpdatePeriod * BLOCK_TIME);

      // the different address is not registered by the contract, so its receivings aren't tracked
      let deposits = await queryRecipientTxs(cm, contractAddress, differentAddr);
      expect(deposits.transfers).toEqual([]);
      // the watched address receivings are not changed
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr1);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "10000",
        },
      ]);
    });
  });

  const watchedAddr2 = addr2;
  const query2UpdatePeriod: number = 3;
  describe("utilise multiple transfers queries", () => {
    test("register the second transfers query", async () => {
      await registerTransfersQuery(
        cm,
        contractAddress,
        testState.sdk_2.chainID,
        connectionId,
        query2UpdatePeriod,
        watchedAddr2,
      );
    });

    test("check registered transfers query", async () => {
      let query = await getRegisteredQuery(cm, contractAddress, 2);
      expect(query.registered_query.id).toEqual(2);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual("tx");
      expect(query.registered_query.transactions_filter).toEqual("{\"transfer.recipient\":\"" + watchedAddr2 + "\"}");
      expect(query.registered_query.zone_id).toEqual(testState.sdk_2.chainID);
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query2UpdatePeriod);
    });

    // TODO: refine when the min height thingy is implemented
    test("handle callback on a past sending", async () => {
      const balances = await cm2.queryBalances(watchedAddr2);
      expect(balances.balances).toEqual([
        { amount: '5000', denom: 'stake' },
      ]);

      await wait(query2UpdatePeriod * BLOCK_TIME);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr2);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "5000",
        },
      ]);
    });
  });

  const watchedAddr3: string = addr3;
  const query3UpdatePeriod: number = 5;
  describe("check update period", () => {
    test("register transfers query", async () => {
      await registerTransfersQuery(
        cm,
        contractAddress,
        testState.sdk_2.chainID,
        connectionId,
        query3UpdatePeriod,
        watchedAddr3,
      );
    });

    test("check registered transfers query", async () => {
      let query = await getRegisteredQuery(cm, contractAddress, 3);
      expect(query.registered_query.id).toEqual(3);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual("tx");
      expect(query.registered_query.transactions_filter).toEqual("{\"transfer.recipient\":\"" + watchedAddr3 + "\"}");
      expect(query.registered_query.zone_id).toEqual(testState.sdk_2.chainID);
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query3UpdatePeriod);
    });

    test("check first sending handling", async () => {
      let balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(watchedAddr3, '3000');
      expect(res.length).toBeGreaterThan(0);
      balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: '3000', denom: 'stake' },
      ]);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      // update time hasn't come yet despite the fact the sent funds are already on the account
      expect(deposits.transfers).toEqual([]);

      await wait(query3UpdatePeriod * BLOCK_TIME);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "3000",
        },
      ]);
    });

    test("check second sending handling", async () => {
      const res = await cm2.msgSend(watchedAddr3, '4000');
      expect(res.length).toBeGreaterThan(0);
      const balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: '7000', denom: 'stake' },
      ]);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      // update time hasn't come yet despite the fact the sent funds are already on the account
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "3000",
        },
      ]);

      await wait(query3UpdatePeriod * BLOCK_TIME);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "3000",
        },
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "4000",
        },
      ]);
    });
  });

  describe("handle multiple transfers", () => {
    test("exec tx with two transfers", async () => {
      const res = await cm2.execTxMultipleMessages(new Array<proto.cosmos.bank.v1beta1.MsgSend>(
        new proto.cosmos.bank.v1beta1.MsgSend({
          from_address: cm2.wallet.address.toString(),
          to_address: addr1,
          amount: [{ denom: cm2.denom, amount: "2000" }],
        }),
        new proto.cosmos.bank.v1beta1.MsgSend({
          from_address: cm2.wallet.address.toString(),
          to_address: addr2,
          amount: [{ denom: cm2.denom, amount: "3000" }],
        }),
      ), {
        gas_limit: Long.fromString('200000'),
        amount: [{ denom: cm2.denom, amount: '1000' }],
      });
      expect(res?.tx_response?.txhash?.length).toBeGreaterThan(0);
      let balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: '12000', denom: 'stake' },
      ]);
      balances = await cm2.queryBalances(watchedAddr2);
      expect(balances.balances).toEqual([
        { amount: '8000', denom: 'stake' },
      ]);
      balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: '7000', denom: 'stake' },
      ]);
    });

    test("check transfers handled", async () => {
      await wait(query3UpdatePeriod * BLOCK_TIME);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr1);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "10000",
        },
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "2000",
        },
      ]);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr2);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "5000",
        },
        {
          recipient: watchedAddr2,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "3000",
        },
      ]);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "3000",
        },
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "4000",
        },
      ]);
    });
  });
});

/**
 * registerTransfersQuery sends a register_transfers_query execute msg to the contractAddress with
 * the given parameters and checks the tx result to be successful.
 */
const registerTransfersQuery =
  async (cm: CosmosWrapper, contractAddress: string, zoneId: string,
    connectionId: string, updatePeriod: number, recipient: string) => {
    const txHash = await cm.executeContract(
      contractAddress,
      JSON.stringify({
        register_transfers_query: {
          zone_id: zoneId,
          connection_id: connectionId,
          update_period: updatePeriod,
          recipient: recipient,
        }
      })
    );
    expect(txHash.length).toBeGreaterThan(0);
    const tx = await rest.tx.getTx(cm.sdk, txHash);
    expect(tx?.data.tx_response?.code).toEqual(0);

    const attributes = getEventAttributesFromTx(tx?.data, "wasm", [
      "action", "connection_id", "zone_id", "query_type", "update_period"
    ]);
    expect(attributes.action).toEqual("register_interchain_query");
    expect(attributes.connection_id).toEqual(connectionId);
    expect(attributes.zone_id).toEqual(zoneId);
    expect(attributes.query_type).toEqual("tx");
    expect(attributes.update_period).toEqual(updatePeriod.toString());
  };

/**
 * getRegisteredQuery queries the contract for a registered query details registered by the given
 * queryId.
 */
const getRegisteredQuery =
  (cm: CosmosWrapper, contractAddress: string, queryId: number) =>
    cm.queryContract<{
      registered_query: {
        id: number,
        owner: string,
        keys: {
          path: string,
          key: string,
        }[],
        query_type: string,
        transactions_filter: string,
        zone_id: string,
        connection_id: string,
        update_period: number,
        last_emitted_height: number,
        last_submitted_result_local_height: number,
        last_submitted_result_remote_height: number,
      }
    }>(contractAddress, {
      get_registered_query: {
        query_id: queryId
      }
    }
    );

/**
 * queryRecipientTxs queries the contract for recorded transfers to the given recipient address.
 */
const queryRecipientTxs =
  (cm: CosmosWrapper, contractAddress: string, recipient: string) =>
    cm.queryContract<{
      transfers: [
        recipient: string,
        sender: string,
        denom: string,
        amount: string,
      ]
    }>(contractAddress, {
      get_recipient_txs: {
        recipient: recipient
      }
    }
    );
