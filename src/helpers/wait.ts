import { rest } from '@cosmos-client/core';

export const wait = async (seconds: number) =>
  new Promise((r) => {
    setTimeout(() => r(true), 1000 * seconds);
  });

/*
 * Following functions accepts `sdk` as `any` instead of `CosmosSDK`.
 * That's because otherwise the script wouldn't even run due to some
 * weird babel issues.
 */

export const getRemoteHeight = async (sdk: any) => {
  const block = await rest.tendermint.getLatestBlock(sdk);
  return +block.data.block.header.height;
};

export const waitBlocks = async (sdk: any, n: number) => {
  const targetHeight = (await getRemoteHeight(sdk)) + n;
  for (;;) {
    await wait(1);
    const currentHeight = await getRemoteHeight(sdk);
    if (currentHeight >= targetHeight) {
      break;
    }
  }
};

/**
 * getWithAttempts waits until readyFunc(getFunc()) returns true
 * and only then returns result of getFunc()
 */
export const getWithAttempts = async <T>(
  sdk: any,
  getFunc: () => Promise<T>,
  readyFunc: (t: T) => Promise<boolean>,
  numAttempts = 20,
): Promise<T> => {
  let error = null;
  while (numAttempts > 0) {
    numAttempts--;
    try {
      const data = await getFunc();
      if (await readyFunc(data)) {
        return data;
      }
    } catch (e) {
      error = e;
    }
    await waitBlocks(sdk, 1);
  }
  throw error != null ? error : new Error('getWithAttempts: no attempts left');
};
