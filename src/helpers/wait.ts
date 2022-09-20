import { rest } from '@cosmos-client/core';

export const wait = async (n: number) =>
  new Promise((r) => {
    setTimeout(() => r(true), n);
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
  for (; ;) {
    await wait(10);
    const currentHeight = await getRemoteHeight(sdk);
    if (currentHeight >= targetHeight) {
      break;
    }
  }
};

export const waitWithAttempts = async (
  sdk: any,
  f: () => Promise<boolean>,
  numAttempts = 20,
) => {
  while (numAttempts > 0) {
    try {
      if (await f()) {
        return;
      }
      // eslint-disable-next-line no-empty
    } catch (e) { }
    numAttempts--;
    await waitBlocks(sdk, 1);
  }
  throw new Error('waitWithAttempts: no attempts left');
};
