import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { waitBlocks } from './wait';
import { StargateClient } from '@cosmjs/stargate';

export const getWithAttempts = async <T>(
  client: StargateClient | CosmWasmClient,
  getFunc: () => Promise<T>,
  readyFunc: (t: T) => Promise<boolean>,
  numAttempts = 20,
): Promise<T> => {
  let error = null;
  let data: T;
  while (numAttempts > 0) {
    numAttempts--;
    try {
      data = await getFunc();
      if (await readyFunc(data)) {
        return data;
      }
    } catch (e) {
      error = e;
    }
    await waitBlocks(1, client);
  }
  throw error != null
    ? error
    : new Error(
        'getWithAttempts: no attempts left. Latest get response: ' +
          (data === Object(data) ? JSON.stringify(data) : data).toString(),
      );
};
