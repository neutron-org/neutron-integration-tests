import axios, { AxiosResponse } from 'axios';
import { execSync } from 'child_process';
import { promises as fsPromise } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { CONTRACTS } from './constants';

export const CONTRACTS_PATH = process.env.CONTRACTS_PATH || './contracts';

const START_BLOCK_HEIGHT = process.env.START_BLOCK_HEIGHT
  ? +process.env.START_BLOCK_HEIGHT
  : 10;

let alreadySetUp = false;

export const getContractBinary = async (fileName: string): Promise<Buffer> =>
  fsPromise.readFile(path.resolve(CONTRACTS_PATH, fileName));

export const getContractsHashes = async (): Promise<Record<string, string>> => {
  const hashes = {};
  for (const key of Object.keys(CONTRACTS)) {
    const binary = await getContractBinary(CONTRACTS[key]);
    hashes[CONTRACTS[key]] = crypto
      .createHash('sha256')
      .update(binary)
      .digest('hex');
  }
  return hashes;
};

export const setup = async (host1: string, host2: string) => {
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
    // this is a hack to make sure everything (volumes, etc.) was deleted after the previous test run (very important in case of run-in-band tests)
    execSync(`cd setup && make clean`);
    // eslint-disable-next-line no-empty
  } catch (e) {}
  console.log('Starting container... it may take long');
  execSync(`cd setup && make start-cosmopark`);

  if (!process.env.NO_PRINT_VERSIONS) {
    await showContractsHashes();
    // disabling printing versions to stabilise tests
    // TODO: fix an issue with exclusive.lock file
    // showVersions();
  }
  await waitForHTTP(host1);
  !process.env.NO_WAIT_CHANNEL1 && (await waitForChannel(host1));
  !process.env.NO_WAIT_HTTP2 && (await waitForHTTP(host2));
  !process.env.NO_WAIT_CHANNEL2 && (await waitForChannel(host2));
  !process.env.NO_WAIT_DELAY && (await waitSeconds(20)); // FIXME: this hardcoded sleep is here to wait until hermes is fully initialized.
  //                        proper fix would be to monitor hermes status events.
  alreadySetUp = true;
};
const showContractsHashes = async () => {
  const hashes = await getContractsHashes();

  let result = 'Contracts hashes:\n';
  for (const key of Object.keys(hashes)) {
    result = result.concat(`${hashes[key]} ${key}\n`);
  }

  console.log(result);
};

const waitForHTTP = async (
  host = 'http://127.0.0.1:1317',
  path = `cosmos/base/tendermint/v1beta1/blocks/${START_BLOCK_HEIGHT}`,
  timeout = 280000,
) => {
  const start = Date.now();
  let r: AxiosResponse<any, any>;
  while (Date.now() < start + timeout) {
    try {
      r = await axios.get(`${host}/${path}`, {
        timeout: 1000,
      });
      if (r.status === 200) {
        return;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
    await waitSeconds(1);
  }
  if (r) {
    console.log('Response status code: ' + r.status);
  }
  throw new Error('Chain did not start');
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
        await waitSeconds(20);
        return;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
    await waitSeconds(1);
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

export type ChannelsList = {
  channels: {
    state: string;
    ordering: string;
    counterparty: {
      port_id: string;
      channel_id: string;
    };
    connection_hops: string[];
    version: string;
    port_id: string;
    channel_id: string;
  }[];
};
