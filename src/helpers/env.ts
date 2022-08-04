import axios from 'axios';
import { execSync } from 'child_process';
import { wait } from './sleep';

const NEUTRON_DIR = process.env.NEUTRON_DIR || '../neutron';

let alreadySetUp = false;

export const setup = async (host: string) => {
  if (alreadySetUp) {
    console.log('already set up');
    return;
  }
  try {
    execSync(`cd ${NEUTRON_DIR} && make stop-cosmopark`);
    // eslint-disable-next-line no-empty
  } catch (e) {}
  await wait(2000);
  console.log('Starting container... it may take long');
  execSync(`cd ${NEUTRON_DIR} && make start-cosmopark`);
  await waitForHTTP(host);
  alreadySetUp = true;
};

export const teardown = () => {
  console.log('Stopping cosmopark');
  execSync(`cd ${NEUTRON_DIR} && make stop-cosmopark`);
};

export const waitForHTTP = async (
  host = 'http://127.0.0.1:1316',
  path = 'blocks/5',
  timeout = 280000,
) => {
  const start = Date.now();
  while (Date.now() < start + timeout) {
    try {
      const r = await axios.get(`${host}/${path}`, {
        timeout: 1000,
      });
      if (r.status === 200) {
        return;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
    await wait(1000);
  }
  throw new Error('No port opened');
};
