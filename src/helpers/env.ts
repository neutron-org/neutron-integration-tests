import axios from 'axios';
import { execSync, ExecSyncOptions } from 'child_process';
import { wait } from './wait';

const BLOCKS_COUNT_BEFORE_START = process.env.BLOCKS_COUNT_BEFORE_START
  ? parseInt(process.env.BLOCKS_COUNT_BEFORE_START, 10)
  : 10;

let alreadySetUp = false;

export const setup = async (host: string, noRebuild = false) => {
  if (alreadySetUp && !noRebuild) {
    console.log('already set up');
    return;
  }
  if (process.env.NO_DOCKER) {
    console.log('NO_DOCKER ENV provided');
    return;
  }
  try {
    execSync(`cd setup && make stop-cosmopark`);
    // eslint-disable-next-line no-empty
  } catch (e) {}
  console.log('Starting container... it may take long');
  const execOptions: ExecSyncOptions = {
    env: process.env,
  };
  if (noRebuild) {
    console.log('Rebuilding and starting...');
    execSync(`cd setup && make start-cosmopark-no-rebuild`, execOptions);
  } else {
    console.log('Starting without rebuilding');
    execSync(`cd setup && make start-cosmopark`, execOptions);
  }
  showVersions();
  await waitForHTTP(host);
  await waitForChannel(host);
  alreadySetUp = true;
};

export const waitForHTTP = async (
  host = 'http://127.0.0.1:1317',
  path = `blocks/${BLOCKS_COUNT_BEFORE_START}`,
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
    await wait(10);
  }
  throw new Error('No port opened');
};

export const waitForChannel = async (
  host = 'http://127.0.0.1:1317',
  timeout = 100000,
) => {
  const start = Date.now();

  while (Date.now() < start + timeout) {
    try {
      const r = await axios.get(`${host}/ibc/core/channel/v1/channels`, {
        timeout: 1000,
      });
      if (r.data.channels.length > 0) {
        return;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
    await wait(10);
  }
  throw new Error('No channel opened');
};

export const showVersions = () => {
  if (process.env.NO_DOCKER) {
    console.log('Cannot get versions since NO_DOCKER ENV provided');
    return;
  }
  const servicesAndGetVersionCommandsText = [
    [
      'ICQ relayer',
      'cd setup && docker compose exec relayer neutron_query_relayer version',
    ],
    ['hermes', 'cd setup && docker compose exec hermes hermes version'],
    ['Integration tests', "git log -1 --format='%H'"],
  ];
  for (const service of servicesAndGetVersionCommandsText) {
    try {
      const version = execSync(service[1]).toString().trim();
      console.log(`${service[0]} version:\n${version}`);
    } catch (err) {
      console.log(`Cannot get ${service[0]} version:\n${err}`);
    }
  }
  const servicesAndGetVersionCommandsJson = [
    [
      'neutrond',
      'cd setup && docker compose exec neutron-node /go/bin/neutrond version --long -o json',
    ],
    [
      'gaiad',
      'cd setup && docker compose exec gaia-node gaiad version --long 2>&1 -o json',
    ],
  ];
  for (const service of servicesAndGetVersionCommandsJson) {
    try {
      const versionLong = JSON.parse(execSync(service[1]).toString().trim());
      console.log(
        `${service[0]} version:\nversion: ${versionLong['version']}\ncommit: ${versionLong['commit']}`,
      );
    } catch (err) {
      console.log(`Cannot get ${service[0]} version:\n${err}`);
    }
  }
};
