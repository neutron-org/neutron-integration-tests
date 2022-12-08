import { execSync } from 'child_process';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import {
  COSMOS_DENOM,
  CosmosWrapper,
  NEUTRON_DENOM,
  NeutronContract,
} from '../helpers/cosmos';
import {
  registerBalanceQuery,
  validateBalanceQuery,
  waitForICQResultWithRemoteHeight,
} from '../helpers/icq';
import { getRemoteHeight } from '../helpers/wait';

const lookForKeyringInContainerLogs = async (
  realayerImageName: string,
  signal: AbortSignal,
) => {
  try {
    while (!signal.aborted) {
      const containerID = execSync(
        `docker ps -q --filter ancestor=${realayerImageName}`,
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
  const realayerImageName = `neutron-org/neutron-query-relayer:${keyringType}-test`;

  process.env['RELAYER_IMAGE_NAME'] = realayerImageName;

  const testState = new TestStateLocalCosmosTestNet();
  await testState.restart();

  const ralayerContainerId = execSync(
    `docker ps -q --filter ancestor=${realayerImageName}`,
  ).toString();
  expect(ralayerContainerId.length).toBeGreaterThan(0);

  const cm = {
    neutron: new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    ),
    gaia: new CosmosWrapper(
      testState.sdk2,
      testState.wallets.cosmos.demo2,
      COSMOS_DENOM,
    ),
  };

  const keyringLookupAbortController = new AbortController();
  const keyringLookupAbortSignal = keyringLookupAbortController.signal;
  let keyringFromContainerLogs = '';
  lookForKeyringInContainerLogs(
    realayerImageName,
    keyringLookupAbortSignal,
  ).then((result) => {
    keyringFromContainerLogs = result;
  });

  await performKVQuery(cm, testState);

  expect(keyringFromContainerLogs).toEqual(keyringType);

  keyringLookupAbortController.abort();
};

const performKVQuery = async (cm, testState) => {
  const connectionId = 'connection-0';
  const updatePeriods: { [key: number]: number } = {
    2: 2,
    3: 4,
    4: 3,
  };

  const codeId = await cm.neutron.storeWasm(NeutronContract.INTERCHAIN_QUERIES);

  expect(parseInt(codeId)).toBeGreaterThan(0);

  const contractAddress = await cm.neutron.instantiate(
    codeId,
    '{}',
    'neutron_interchain_queries',
  );
  // Top up contract address before running query
  await cm.neutron.msgSend(contractAddress, '1000000');
  let balances = await cm.neutron.queryBalances(contractAddress);
  expect(balances.balances[0].amount).toEqual('1000000');

  await registerBalanceQuery(
    cm.neutron,
    contractAddress,
    connectionId,
    10,
    cm.gaia.denom,
    testState.wallets.cosmos.demo2.address,
  );
  balances = await cm.neutron.queryBalances(contractAddress);
  expect(balances.balances.length).toEqual(0);
  // Top up contract address before running query
  await cm.neutron.msgSend(contractAddress, '1000000');
  await registerBalanceQuery(
    cm.neutron,
    contractAddress,
    connectionId,
    updatePeriods[2],
    cm.gaia.denom,
    testState.wallets.cosmos.demo2.address,
  );
  // reduce balance of demo2 wallet
  const queryId = 2;
  const res = await cm.gaia.msgSend(
    testState.wallets.cosmos.rly2.address.toString(),
    '9000',
  );
  expect(res.code).toEqual(0);
  await waitForICQResultWithRemoteHeight(
    cm.neutron,
    contractAddress,
    queryId,
    await getRemoteHeight(cm.gaia.sdk),
  );
  await validateBalanceQuery(
    cm.neutron,
    cm.gaia,
    contractAddress,
    queryId,
    cm.gaia.wallet.address,
  );
};

const describeDockerOnly = process.env.NO_DOCKER ? describe.skip : describe;

describeDockerOnly('Neutron / Relayer keyrings', () => {
  beforeAll(async () => {
    const testState = new TestStateLocalCosmosTestNet();
    await testState.init();
  });

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
    process.env['RELAYER_IMAGE_NAME'] = 'neutron-org/neutron-query-relayer';
    const testState = new TestStateLocalCosmosTestNet();
    await testState.restart();
  });
});
