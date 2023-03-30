import fs from 'fs';
import { wait } from './wait';

export const lock = async (path = './lock.tmp', timeout = 60000) => {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const f = fs.statSync(path);
      if (f.isFile() && f.ctimeMs < start - timeout) {
        fs.rmSync(path);
        fs.writeFileSync(path, JSON.stringify(process.env));
        break;
      }
      if (Date.now() - start > timeout) {
        throw new Error(`Timeout waiting for others: ${path}`);
      } else {
        await wait(1 + Math.random());
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        try {
          fs.writeFileSync(path, JSON.stringify(process.env));
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
};
