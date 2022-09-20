import { CosmosWrapper } from './cosmos';
import { waitBlocks } from './wait';

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
export const waitForICQResultWithRemoteHeight = async (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
  targetHeight: number,
  numAttempts = 100,
) => {
  while (numAttempts > 0) {
    numAttempts--;
    try {
      const queryResult = await getRegisteredQuery(
        cm,
        contractAddress,
        queryId,
      );
      if (
        queryResult.registered_query.last_submitted_result_remote_height >=
        targetHeight
      ) {
        return;
      }
    } catch (e) {
      console.log(`Warning: waitForICQResultWithRemoteHeight: ${e}`);
    }
    await waitBlocks(cm.sdk, 1);
  }
  expect(numAttempts).toBeGreaterThan(0);
};

/**
 * queryTransfersAmount queries the contract for recorded transfers amount.
 */
export const queryTransfersAmount = (
  cm: CosmosWrapper,
  contractAddress: string,
) =>
  cm.queryContract<{
    amount: number;
  }>(contractAddress, {
    get_transfers_amount: {},
  });

export const waitForTransfersAmount = async (
  cm: CosmosWrapper,
  contractAddress: string,
  expectedTransfersAmount: number,
  numAttempts = 50,
) => {
  while (numAttempts > 0) {
    numAttempts--;
    await waitBlocks(cm.sdk, 1);
    const amount = (await queryTransfersAmount(cm, contractAddress)).amount;
    if (amount == expectedTransfersAmount) {
      return;
    }
    if (amount > expectedTransfersAmount) {
      throw new Error(
        `Amount of incoming transfers ${amount} is greater than ` +
        `expected ${expectedTransfersAmount}`,
      );
    }
  }
  expect(numAttempts).toBeGreaterThan(0);
};
