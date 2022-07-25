import axios from 'axios';
import { execSync } from 'child_process';
import { wait } from './sleep';
export const setup = async (host: string, imageName = 'neutron') => {
  try {
    execSync(`docker stop neutron 2>&1`);
    // eslint-disable-next-line no-empty
  } catch (e) {}
  await wait(2000); //docker just don't allow to run at once it stopped with same name
  execSync(
    `docker run --rm --name neutron -d -p 1316:1316 -p 1317:1317 -p 26657:26657 -p 26656:26656 -p 16657:16657 -p 16656:16656 ${imageName}`,
  );
  await waitForHTTP(host);
};

export const teardown = () => {
  execSync(`docker stop neutron`);
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
