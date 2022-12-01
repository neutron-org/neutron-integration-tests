import { execSync } from 'child_process';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { COSMOS_DENOM, CosmosWrapper, NEUTRON_DENOM } from '../helpers/cosmos';
import {
  registerBalanceQuery,
  validateBalanceQuery,
  waitForICQResultWithRemoteHeight,
} from '../helpers/icq';
import { getRemoteHeight } from '../helpers/wait';

const lookForKeyringInContainerLogs = async (
  relayerVersion: string,
  signal: AbortSignal,
) => {
  try {
    while (!signal.aborted) {
      const containerID = execSync(
        `docker ps -q --filter ancestor=neutron-org/neutron-query-relayer:${relayerVersion}`,
      )
        .toString()
        .trim();
      if (containerID) {
        const relayerContainerLogs = execSync(
          `docker logs ${containerID} 2>&1`,
        ).toString();
        const regex =
          /['"]keyring_backend['"]\s*:\s*["'](?<keyring>[^'"]*)["']/g;
        const match = regex.exec(relayerContainerLogs);
        if (match) {
          return match.groups['keyring'];
        }
      }
      await new Promise((f) => setTimeout(f, 1000, signal));
    }
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
  }
};

const testRelayer = async (keyringType: string) => {
  const relayerVersion = `${keyringType}-test`;

  process.env['RELAYER_VERSION'] = relayerVersion;
  process.env['RELAYER_IMAGE_NAME'] = `:${relayerVersion}`;
  const testState = new TestStateLocalCosmosTestNet();
  await testState.restart();

  const keyringLookupAbortController = new AbortController();
  const keyringLookupAbortSignal = keyringLookupAbortController.signal;
  let keyringFromContainerLogs = '';
  lookForKeyringInContainerLogs(relayerVersion, keyringLookupAbortSignal).then(
    (result) => {
      keyringFromContainerLogs = result;
    },
  );

  await performKVQuery(testState);

  expect(keyringFromContainerLogs).toEqual(keyringType);

  keyringLookupAbortController.abort();
};

const performKVQuery = async (testState) => {
  const cm = {
    1: new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    ),
    2: new CosmosWrapper(
      testState.sdk2,
      testState.wallets.cosmos.demo2,
      COSMOS_DENOM,
    ),
  };

  const connectionId = 'connection-0';
  const updatePeriods: { [key: number]: number } = {
    2: 2,
    3: 4,
    4: 3,
  };

  const codeId = await cm[1].storeWasm('neutron_interchain_queries.wasm');
  expect(parseInt(codeId)).toBeGreaterThan(0);
  const contractAddress = await cm[1].instantiate(
    codeId,
    '{}',
    'neutron_interchain_queries',
  );
  // Top up contract address before running query
  await cm[1].msgSend(contractAddress, '1000000');

  let balances = await cm[1].queryBalances(contractAddress);
  expect(balances.balances[0].amount).toEqual('1000000');

  await registerBalanceQuery(
    cm[1],
    contractAddress,
    connectionId,
    10,
    cm[2].denom,
    testState.wallets.cosmos.demo2.address,
  );

  balances = await cm[1].queryBalances(contractAddress);
  expect(balances.balances.length).toEqual(0);
  // Top up contract address before running query
  await cm[1].msgSend(contractAddress, '1000000');
  await registerBalanceQuery(
    cm[1],
    contractAddress,
    connectionId,
    updatePeriods[2],
    cm[2].denom,
    testState.wallets.cosmos.demo2.address,
  );
  // reduce balance of demo2 wallet
  const queryId = 2;
  const res = await cm[2].msgSend(
    testState.wallets.cosmos.rly2.address.toString(),
    '9000',
  );
  expect(res.code).toEqual(0);
  await waitForICQResultWithRemoteHeight(
    cm[1],
    contractAddress,
    queryId,
    await getRemoteHeight(cm[2].sdk),
  );
  await validateBalanceQuery(
    cm[1],
    cm[2],
    contractAddress,
    queryId,
    cm[2].wallet.address,
  );
};

const describeDockerOnly = process.env.NO_DOCKER ? describe.skip : describe;

describeDockerOnly('Neutron / Relayer keyrings', () => {
  test('memory backend', async () => {
    await testRelayer('memory');
  });

  test('os backend', async () => {
    await testRelayer('os');
  });

  test('test backend', async () => {
    await testRelayer('test');
  });

  test('pass backend', async () => {
    await testRelayer('pass');
  });

  test('file backend', async () => {
    await testRelayer('file');
  });

  afterAll(async () => {
    const testState = new TestStateLocalCosmosTestNet();
    process.env['RELAYER_VERSION'] = 'base';
    await testState.restart();
  });
});
