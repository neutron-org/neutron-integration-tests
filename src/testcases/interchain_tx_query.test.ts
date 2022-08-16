import { rest } from '@cosmos-client/core';
import { BLOCK_TIME, CosmosWrapper, getEventAttributesFromTx } from "../helpers/cosmos";
import { AccAddress } from '@cosmos-client/core/cjs/types';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { wait } from "../helpers/sleep";

describe('Neutron / Interchain TX Query', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let contractAddress: string;
  let connectionId: string = "connection-0";

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(testState.sdk_1, testState.wallets.demo1);
    cm2 = new CosmosWrapper(testState.sdk_2, testState.wallets.demo2);
  });

  describe("Instantiate contract", () => {
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

  const watchedAddr: string = "neutron1fj6yqrkpw6fmp7f7jhj57dujfpwal4m25dafzx";
  describe("Register interchain query", () => {
    test("register transfers query", async () => {
      await registerTransfersQuery(
        cm,
        contractAddress,
        testState.sdk_2.chainID,
        connectionId,
        5,
        watchedAddr,
      );
    });

    test("get registered transfers query", async () => {
      let queryResult = await getRegisteredQueryResult(cm, contractAddress, 1);
      expect(queryResult.registered_query.id).toEqual(1);
      expect(queryResult.registered_query.owner).toEqual(contractAddress);
      expect(queryResult.registered_query.keys.length).toEqual(0);
      expect(queryResult.registered_query.query_type).toEqual("tx");
      expect(queryResult.registered_query.transactions_filter).toEqual("{\"transfer.recipient\":\"" + watchedAddr + "\"}");
      expect(queryResult.registered_query.zone_id).toEqual(testState.sdk_2.chainID);
      expect(queryResult.registered_query.connection_id).toEqual(connectionId);
      expect(queryResult.registered_query.update_period).toEqual(5);
    });

    test("get recipient txs query", async () => {
      let balances = await cm2.queryBalances(watchedAddr);
      expect(balances.balances).toEqual([]);
      const res = await cm2.msgSend(watchedAddr, '10000');
      expect(res.length).toBeGreaterThan(0);
      await wait(BLOCK_TIME);
      balances = await cm2.queryBalances(watchedAddr);
      expect(balances.balances).toEqual([
        { amount: '10000', denom: 'stake' },
      ]);

      await wait(BLOCK_TIME);
      let deposits = await queryRecipientTxs(cm, contractAddress, watchedAddr);
      expect(deposits.transfers).toEqual([
        {
          recipient: watchedAddr,
          sender: cm2.wallet.address.toString(),
          denom: "stake",
          amount: "10000",
        },
      ]);
    });
  });
});

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

const getRegisteredQueryResult =
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
