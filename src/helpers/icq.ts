import { CosmosWrapper } from './cosmos';
import { getWithAttempts } from './wait';

/**
 * getRegisteredQuery queries the contract for a registered query details registered by the given
 * queryId.
 */
export const getRegisteredQuery = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
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
      last_submitted_result_remote_height: number;
      deposit: { denom: string; amount: string }[];
    };
  }>(contractAddress, {
    get_registered_query: {
      query_id: queryId,
    },
  });

/**
 * waitForICQResultWithRemoteHeight waits until ICQ gets updated to
 * reflect data corresponding to remote height `>= targetHeight`
 */
export const waitForICQResultWithRemoteHeight = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
  targetHeight: number,
  numAttempts = 20,
) =>
  getWithAttempts(
    cm.sdk,
    () => getRegisteredQuery(cm, contractAddress, queryId),
    (query) =>
      query.registered_query.last_submitted_result_remote_height >=
      targetHeight,
    numAttempts,
  );

/**
 * queryTransfersNumber queries the contract for recorded transfers number.
 */
export const queryTransfersNumber = (
  cm: CosmosWrapper,
  contractAddress: string,
) =>
  cm.queryContract<{
    transfers_number: number;
  }>(contractAddress, {
    get_transfers_number: {},
  });

/**
 * waitForTransfersAmount waits until contract has `expectedTransfersAmount`
 * number of incoming transfers stored.
 */
export const waitForTransfersAmount = (
  cm: CosmosWrapper,
  contractAddress: string,
  expectedTransfersAmount: number,
  numAttempts = 50,
) =>
  getWithAttempts(
    cm.sdk,
    async () =>
      (await queryTransfersNumber(cm, contractAddress)).transfers_number,
    (amount) => amount == expectedTransfersAmount,
    numAttempts,
  );
