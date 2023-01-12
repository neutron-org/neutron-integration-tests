import axios from 'axios';
import { execSync } from 'child_process';
import { wait } from './wait';
import { ChannelsList, getContractsHashes } from './cosmos';

const BLOCKS_COUNT_BEFORE_START = process.env.BLOCKS_COUNT_BEFORE_START
  ? parseInt(process.env.BLOCKS_COUNT_BEFORE_START, 10)
  : 10;

let alreadySetUp = false;

export const setup = async (host: string) => {
  if (alreadySetUp) {
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
  if (process.env.NO_REBUILD) {
    console.log('NO_REBUILD ENV provided. do not rebuild docker images');
    execSync(`cd setup && make start-cosmopark-no-rebuild`);
  } else {
    execSync(`cd setup && make start-cosmopark`);
  }
  showVersions();
  await showContractsHashes();

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
      const r = await axios.get<ChannelsList>(
        `${host}/ibc/core/channel/v1/channels`,
        {
          timeout: 1000,
        },
      );
      if (
        r.data.channels.length > 0 &&
        r.data.channels.every(
          (channel) => channel.counterparty.channel_id !== '',
        )
      ) {
        await wait(20);
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

const showContractsHashes = async () => {
  const hashes = await getContractsHashes();

  let result = 'Contracts hashes:\n';
  for (const key of Object.keys(hashes)) {
    result = result.concat(`${hashes[key]} ${key}\n`);
  }

  console.log(result);
};
