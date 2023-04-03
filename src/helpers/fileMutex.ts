import fs from 'fs';
import { wait } from './wait';

export const lock = async (path = './lock.tmp', timeout = 60000) => {
  const start = Date.now();
  console.log('Locking: ', path, process.env.JEST_WORKER_ID);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const f = fs.statSync(path);
      if (f.isFile() && f.ctimeMs < start - timeout) {
        console.log('Remove: ', process.env.JEST_WORKER_ID);
        fs.rmSync(path);
        fs.writeFileSync(path, JSON.stringify(process.env));
        console.log('Created: ', process.env.JEST_WORKER_ID);
        break;
      }
      if (Date.now() - start > timeout) {
        throw new Error(`Timeout waiting for others: ${path}`);
      } else {
        console.log('wait', process.env.JEST_WORKER_ID);
        await wait(1 + Math.random());
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        try {
          fs.writeFileSync(path, JSON.stringify(process.env));
          console.log('Created: ', process.env.JEST_WORKER_ID);
          break;
        } catch (e) {
          throw new Error(`Failed to write lock file: ${path}`);
        }
      } else {
        throw new Error(`Failed to stat lock file: ${path}, ${e}`);
      }
    }
  }
};

export const unlock = (path = './lock.tmp') => {
  fs.rmSync(path);
  console.log('Unlocked: ', process.env.JEST_WORKER_ID);
};
