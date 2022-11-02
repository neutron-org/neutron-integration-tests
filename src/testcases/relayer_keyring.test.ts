import { execSync, ExecSyncOptions } from 'child_process';
const util = require('util');
const exec = util.promisify(require('child_process').exec);

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

interface RelayerTestResult {
  didAnyTestFailed: boolean;
  detectedKeyring: string;
}

const testRelayer = async (keyringType: string) => {
  const relayerVersion = `${keyringType}-test`;

  const jestEnvironment = process.env;
  jestEnvironment['RELAYER_VERSION'] = relayerVersion;
  const jestExecOptions: ExecSyncOptions = {
    env: jestEnvironment,
  };

  const jestPromise = exec(
    'jest --runInBand -b --json src/testcases/interchain_kv_query',
    jestExecOptions,
  );

  const keyringLookupAbortController = new AbortController();
  const keyringLookupAbortSignal = keyringLookupAbortController.signal;
  let keyringFromContainerLogs = '';
  lookForKeyringInContainerLogs(relayerVersion, keyringLookupAbortSignal).then(
    (result) => {
      keyringFromContainerLogs = result;
    },
  );

  const jestOutput = (await jestPromise).stdout;

  const result: RelayerTestResult = {
    didAnyTestFailed: JSON.parse(jestOutput).numFailedTests != 0,
    detectedKeyring: keyringFromContainerLogs,
  };

  keyringLookupAbortController.abort();
  return result;
};

describe('Neutron / Relayer keyrings', () => {
  test('memory backend', async () => {
    const keyringBackend = 'memory';
    const testsResult = await testRelayer(keyringBackend);
    expect(testsResult.didAnyTestFailed).toBeFalsy();
    expect(testsResult.detectedKeyring).toEqual(keyringBackend);
  });

  test('os backend', async () => {
    const keyringBackend = 'os';
    const testsResult = await testRelayer(keyringBackend);
    expect(testsResult.didAnyTestFailed).toBeFalsy();
    expect(testsResult.detectedKeyring).toEqual(keyringBackend);
  });

  test('test backend', async () => {
    const keyringBackend = 'test';
    const testsResult = await testRelayer(keyringBackend);
    expect(testsResult.didAnyTestFailed).toBeFalsy();
    expect(testsResult.detectedKeyring).toEqual(keyringBackend);
  });

  test('pass backend', async () => {
    const keyringBackend = 'pass';
    const testsResult = await testRelayer(keyringBackend);
    expect(testsResult.didAnyTestFailed).toBeFalsy();
    expect(testsResult.detectedKeyring).toEqual(keyringBackend);
  });

  test('file backend', async () => {
    const keyringBackend = 'file';
    const testsResult = await testRelayer(keyringBackend);
    expect(testsResult.didAnyTestFailed).toBeFalsy();
    expect(testsResult.detectedKeyring).toEqual(keyringBackend);
  });
});
