import { CosmosWrapper } from './cosmos';
import { getWithAttempts } from './wait';

export const getIca = (
  cm: CosmosWrapper,
  contractAddress: string,
  icaId: string,
  connectionId: string,
  numAttempts = 20,
) =>
  getWithAttempts(
    cm.sdk,
    () =>
      cm.queryContract<{
        interchain_account_address: string;
      }>(contractAddress, {
        interchain_account_address: {
          interchain_account_id: icaId,
          connection_id: connectionId,
        },
      }),
    (response) => response != null,
    numAttempts,
  );
