import { rest, proto } from '@cosmos-client/core';
import { BLOCK_TIME, CosmosWrapper, getEventAttributesFromTx } from "../helpers/cosmos";
import { AccAddress } from '@cosmos-client/core/cjs/types';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { wait } from "../helpers/sleep";
import Long from 'long';

// TODO: decrease update periods for all queries once relayer is done with sync mode or a stateful
// relayer is implemented to speed up the test.
describe("Neutron / Interchain TX Query", () => {
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
  let addr1ExpectedBalance: number = 0;
  let addr2ExpectedBalance: number = 0;
  let addr3ExpectedBalance: number = 0;
  const sendingToAddr1_1: number = 10000;
  const sendingToAddr2_1: number = 5000;
  const watchedAddr1: string = addr1;
  const query1UpdatePeriod: number = 10;
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
      addr1ExpectedBalance += sendingToAddr1_1;
      let balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(watchedAddr1, sendingToAddr1_1.toString());
      expect(res.length).toBeGreaterThan(0);
      balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: addr1ExpectedBalance.toString(), denom: cm2.denom },
      ]);

      await wait(query1UpdatePeriod * BLOCK_TIME);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr1);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });

    test("handle callback on a sending to a different address", async () => {
      const differentAddr = addr2;
      addr2ExpectedBalance += sendingToAddr2_1;
      let balances = await cm2.queryBalances(differentAddr);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(differentAddr, sendingToAddr2_1.toString());
      expect(res.length).toBeGreaterThan(0);
      balances = await cm2.queryBalances(differentAddr);
      expect(balances.balances).toEqual([
        { amount: addr2ExpectedBalance.toString(), denom: cm2.denom },
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
          denom: cm2.denom,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });

    test("handle failed transfer", async () => {
      const res = await cm2.msgSend(watchedAddr1, "99999999999999"); // the amount is greater than the sender has
      expect(res.length).toBeGreaterThan(0); // hash is not empty thus tx executed
      const balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: addr1ExpectedBalance.toString(), denom: cm2.denom }, // balance hasn't changed thus tx failed
      ]);
      await wait(query1UpdatePeriod * BLOCK_TIME);

      // the watched address receivings are not changed
      const deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr1);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr1ExpectedBalance.toString(),
        },
      ]);
    });
  });

  const watchedAddr2 = addr2;
  const query2UpdatePeriod: number = 6;
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
        { amount: addr2ExpectedBalance.toString(), denom: cm2.denom },
      ]);

      await wait(query2UpdatePeriod * BLOCK_TIME);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr2);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr2ExpectedBalance.toString(),
        },
      ]);
    });
  });

  const watchedAddr3: string = addr3;
  const query3UpdatePeriod: number = 10;
  const sendingToAddr3_1: number = 3000;
  const sendingToAddr3_2: number = 4000;
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
      addr3ExpectedBalance += sendingToAddr3_1;
      let balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(watchedAddr3, sendingToAddr3_1.toString());
      expect(res.length).toBeGreaterThan(0);
      balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: addr3ExpectedBalance.toString(), denom: cm2.denom },
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
          denom: cm2.denom,
          amount: addr3ExpectedBalance.toString(),
        },
      ]);
    });

    test("check second sending handling", async () => {
      addr3ExpectedBalance += sendingToAddr3_2;
      const res = await cm2.msgSend(watchedAddr3, sendingToAddr3_2.toString());
      expect(res.length).toBeGreaterThan(0);
      const balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: addr3ExpectedBalance.toString(), denom: cm2.denom },
      ]);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      // update time hasn't come yet despite the fact the sent funds are already on the account
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: (addr3ExpectedBalance - sendingToAddr3_2).toString(),
        },
      ]);

      await wait(query3UpdatePeriod * BLOCK_TIME);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: sendingToAddr3_1.toString(),
        },
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: sendingToAddr3_2.toString(),
        },
      ]);
    });
  });

  const sendingToAddr1_2: number = 2000;
  const sendingToAddr2_2: number = 3000;
  describe("handle multiple transfers", () => {
    test("exec tx with two transfers", async () => {
      addr1ExpectedBalance += sendingToAddr1_2;
      addr2ExpectedBalance += sendingToAddr2_2;
      const res = await cm2.execTx(
        {
          gas_limit: Long.fromString("200000"),
          amount: [{ denom: cm2.denom, amount: "1000" }],
        },
        new Array<proto.cosmos.bank.v1beta1.MsgSend>(
          new proto.cosmos.bank.v1beta1.MsgSend({
            from_address: cm2.wallet.address.toString(),
            to_address: watchedAddr1,
            amount: [{ denom: cm2.denom, amount: sendingToAddr1_2.toString() }],
          }),
          new proto.cosmos.bank.v1beta1.MsgSend({
            from_address: cm2.wallet.address.toString(),
            to_address: watchedAddr2,
            amount: [{ denom: cm2.denom, amount: sendingToAddr2_2.toString() }],
          }),
        )
      );
      expect(res?.tx_response?.txhash?.length).toBeGreaterThan(0);
      let balances = await cm2.queryBalances(watchedAddr1);
      expect(balances.balances).toEqual([
        { amount: addr1ExpectedBalance.toString(), denom: cm2.denom },
      ]);
      balances = await cm2.queryBalances(watchedAddr2);
      expect(balances.balances).toEqual([
        { amount: addr2ExpectedBalance.toString(), denom: cm2.denom },
      ]);
      balances = await cm2.queryBalances(watchedAddr3);
      expect(balances.balances).toEqual([
        { amount: addr3ExpectedBalance.toString(), denom: cm2.denom },
      ]);
    });

    test("check transfers handled", async () => {
      await wait(Math.max(query1UpdatePeriod, query2UpdatePeriod, query3UpdatePeriod) * BLOCK_TIME);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr1);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: sendingToAddr1_1.toString(),
        },
        {
          recipient: watchedAddr1,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: sendingToAddr1_2.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr2);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr2,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: sendingToAddr2_1.toString(),
        },
        {
          recipient: watchedAddr2,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: sendingToAddr2_2.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr3);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: sendingToAddr3_1.toString(),
        },
        {
          recipient: watchedAddr3,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: sendingToAddr3_2.toString(),
        },
      ]);
    });
  });

  // this case tests the following scenario:
  // there is a tx of a remote height 10, and a tx of a remote height 20
  // we submit the second one, and then submit the first one, and want to make sure there is
  // no problem with submitting an older height after a younger one submitted
  describe("submit older height after younger one", () => {
    const addr4: string = "neutron1p0qgeqgardg73apsrc2k5efm5dcwhnvkusdh38";
    const addr5: string = "neutron1szkcj46xg65ux8t8ge9jl79azj4qltdqvavatz";
    let addr4ExpectedBalance: number = 0;
    let addr5ExpectedBalance: number = 0;
    const sendingToAddr4_1: number = 4000;
    const sendingToAddr5_1: number = 5000;
    const watchedAddr4: string = addr4;
    const watchedAddr5: string = addr5;
    const query4UpdatePeriod: number = 5;
    const query5UpdatePeriod: number = 15;

    // by this checks we ensure the transactions will be processed in the desired order
    test("validate update periods", async () => {
      expect(query5UpdatePeriod).toBeGreaterThanOrEqual(15);
      expect(query5UpdatePeriod).toBeGreaterThanOrEqual(query4UpdatePeriod * 3);
    });

    test("register transfers queries", async () => {
      await registerTransfersQuery(
        cm,
        contractAddress,
        testState.sdk_2.chainID,
        connectionId,
        query4UpdatePeriod,
        watchedAddr4,
      );
      await registerTransfersQuery(
        cm,
        contractAddress,
        testState.sdk_2.chainID,
        connectionId,
        query5UpdatePeriod,
        watchedAddr5,
      );
    });

    test("make older sending", async () => {
      addr5ExpectedBalance += sendingToAddr5_1;
      let balances = await cm2.queryBalances(watchedAddr5);
      expect(balances.balances).toEqual([]);
      let res = await cm2.msgSend(watchedAddr5, sendingToAddr5_1.toString());
      expect(res.length).toBeGreaterThan(0);
      balances = await cm2.queryBalances(watchedAddr5);
      expect(balances.balances).toEqual([
        { amount: addr5ExpectedBalance.toString(), denom: cm2.denom },
      ]);
    });

    test("check registered transfers query", async () => {
      let query = await getRegisteredQuery(cm, contractAddress, 4);
      expect(query.registered_query.id).toEqual(4);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual("tx");
      expect(query.registered_query.transactions_filter).toEqual("{\"transfer.recipient\":\"" + watchedAddr4 + "\"}");
      expect(query.registered_query.zone_id).toEqual(testState.sdk_2.chainID);
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query4UpdatePeriod);

      query = await getRegisteredQuery(cm, contractAddress, 5);
      expect(query.registered_query.id).toEqual(5);
      expect(query.registered_query.owner).toEqual(contractAddress);
      expect(query.registered_query.keys.length).toEqual(0);
      expect(query.registered_query.query_type).toEqual("tx");
      expect(query.registered_query.transactions_filter).toEqual("{\"transfer.recipient\":\"" + watchedAddr5 + "\"}");
      expect(query.registered_query.zone_id).toEqual(testState.sdk_2.chainID);
      expect(query.registered_query.connection_id).toEqual(connectionId);
      expect(query.registered_query.update_period).toEqual(query5UpdatePeriod);
    });

    test("make younger sending and check", async () => {
      await wait(BLOCK_TIME);
      addr4ExpectedBalance += sendingToAddr4_1;
      let balances = await cm2.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([]);
      let res = await cm2.msgSend(watchedAddr4, sendingToAddr4_1.toString());
      expect(res.length).toBeGreaterThan(0);
      balances = await cm2.queryBalances(watchedAddr4);
      expect(balances.balances).toEqual([
        { amount: addr4ExpectedBalance.toString(), denom: cm2.denom },
      ]);

      await wait(query4UpdatePeriod * BLOCK_TIME);
      // make sure the query4 result is submitted before the query5 one
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr4);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr4,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr4ExpectedBalance.toString(),
        },
      ]);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr5);
      expect(deposits.transfers).toEqual([]);

      await wait(query5UpdatePeriod * BLOCK_TIME);
      deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr5);
      // despite query4 tx result was of a greater remote height and was submitted before,
      // query5 tx should be submitted successfully
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr5,
          sender: cm2.wallet.address.toString(),
          denom: cm2.denom,
          amount: addr5ExpectedBalance.toString(),
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
