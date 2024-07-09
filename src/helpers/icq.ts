import axios, { AxiosResponse } from 'axios';
import {WasmWrapper} from "./wasmClient";
import {CosmWasmClient} from "@cosmjs/cosmwasm-stargate";
import {getWithAttempts} from "./getWithAttempts";

/**
 * getRegisteredQuery queries the contract for a registered query details registered by the given
 * queryId.
 */
export const getRegisteredQuery = (
  ww: WasmWrapper,
  contractAddress: string,
  queryId: number,
) =>
  ww.client.queryContractSmart<{
    registered_query: {
      id: number;
      owner: string;
      keys: {
        path: string;
        key: string;
      }[];
      query_type: string;
      transactions_filter: string;
      connection_id: string;
      update_period: number;
      last_submitted_result_local_height: number;
      last_submitted_result_remote_height: {
        revision_number: number;
        revision_height: number;
      };
      deposit: { denom: string; amount: string }[];
      submit_timeout: number;
      registered_at_height: number;
    };
  }>(contractAddress, {
    get_registered_query: {
      query_id: queryId,
    },
  });

// TODO: move to helpers for neutron_interchain_queries contract
/**
 * @deprecated since version 0.5.0
 *
 * waitForICQResultWithRemoteHeight waits until ICQ gets updated to
 * reflect data corresponding to remote height `>= targetHeight`
 */
export const waitForICQResultWithRemoteHeight = (
  ww: WasmWrapper,
  contractAddress: string,
  queryId: number,
  targetHeight: number,
  numAttempts = 20,
) =>
  getWithAttempts(
    ww.client,
    () => getRegisteredQuery(ww, contractAddress, queryId),
    async (query) =>
      query.registered_query.last_submitted_result_remote_height
        .revision_height >= targetHeight,
    numAttempts,
  );

/**
 * queryTransfersNumber queries the contract for recorded transfers number.
 */
export const queryTransfersNumber = (
  ww: WasmWrapper,
  contractAddress: string,
) =>
  ww.client.queryContractSmart<{
    transfers_number: number;
  }>(contractAddress, {
    get_transfers_number: {},
  });

/**
 * waitForTransfersAmount waits until contract has `expectedTransfersAmount`
 * number of incoming transfers stored.
 */
export const waitForTransfersAmount = (
  ww: WasmWrapper,
  contractAddress: string,
  expectedTransfersAmount: number,
  numAttempts = 50,
) =>
  getWithAttempts(
    ww.client,
    async () =>
      (await queryTransfersNumber(ww, contractAddress)).transfers_number,
    async (amount) => amount == expectedTransfersAmount,
    numAttempts,
  );

// TODO: description
type UnsuccessfulSubmitIcqTx = {
  // QueryID is the query_id transactions was submitted for
  query_id: number;
  // SubmittedTxHash is the hash of the *remote fetched transaction* was submitted
  submitted_tx_hash: string;
  // NeutronHash is the hash of the *neutron chain transaction* which is responsible for delivering remote transaction to neutron
  neutron_hash: string;
  // ErrorTime is the time when the error was added
  error_time: string;
  // Status is the status of unsuccessful tx
  status: string;
  // Message is the more descriptive message for the error
  message: string;
};

// TODO: description
export type ResubmitQuery = {
  query_id: number;
  hash: string;
};

// TODO: description
export const getUnsuccessfulTxs = async (
  icqWebHost: string,
): Promise<Array<UnsuccessfulSubmitIcqTx>> => {
  const url = `${icqWebHost}/unsuccessful-txs`;
  const req = await axios.get<Array<UnsuccessfulSubmitIcqTx>>(url);
  return req.data;
};

// TODO: description
export const postResubmitTxs = async (
  icqWebHost: string,
  txs: Array<ResubmitQuery>,
): Promise<AxiosResponse> => {
  const url = `${icqWebHost}/resubmit-txs`;
  const data = { txs: txs };
  return await axios.post(url, data);
};

/**
 * registerTransfersQuery sends a register_transfers_query execute msg to the contractAddress with
 * the given parameters and checks the tx result to be successful.
 */
export const registerTransfersQuery = async (
  cm: WasmWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  recipient: string,
) => {
  const res = await cm.execute(contractAddress, {
    register_transfers_query: {
      connection_id: connectionId,
      update_period: updatePeriod,
      recipient: recipient,
    },
  });

  if (res.code != 0) {
    throw new Error('res.code != 0');
  }
};

/**
 * queryRecipientTxs queries the contract for recorded transfers to the given recipient address.
 */
export const queryRecipientTxs = (
  cm: WasmWrapper,
  contractAddress: string,
  recipient: string,
) =>
  cm.client.queryContractSmart<{
    transfers: [
      recipient: string,
      sender: string,
      denom: string,
      amount: string,
    ];
  }>(contractAddress, {
    get_recipient_txs: {
      recipient: recipient,
    },
  });
