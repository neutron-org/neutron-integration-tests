import { rest, websocket } from '@cosmos-client/core';

(global as any).WebSocket = require('ws');

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

export class BlockWaiter {
  url;

  constructor(url: string) {
    this.url = url;
  }

  waitBlocks(n: number, timeout = 120000): Promise<void> {
    return new Promise((resolve, reject) => {
      let ws = null;
      const x = setTimeout(() => {
        if (ws != null) {
          ws.unsubscribe();
        }
        reject(new Error('waitBlocks: timeout'));
      }, timeout);
      ws = websocket.connect(this.url);
      ws.next({
        id: '1',
        jsonrpc: '2.0',
        method: 'subscribe',
        params: ["tm.event='NewBlock'"],
      });
      ws.subscribe((res) => {
        if (Object.entries((res as any).result).length !== 0) {
          n--;
          if (n == 0) {
            ws.unsubscribe();
            clearTimeout(x);
            resolve();
          }
        }
      });
    });
  }
}

/**
 * getWithAttempts waits until readyFunc(getFunc()) returns true
 * and only then returns result of getFunc()
 */
export const getWithAttempts = async <T>(
  cm: any,
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
    await cm.blockWaiter.waitBlocks(1);
  }
  throw error != null ? error : new Error('getWithAttempts: no attempts left');
};
