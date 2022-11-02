import { execSync, ExecSyncOptions } from 'child_process';

async function search_keyring_in_output(signal = {}, relayer_version) {
  try {
    while (true) {
      const container_id = execSync(
        `docker ps -q --filter ancestor=neutron-org/neutron-query-relayer:${relayer_version}`,
      )
        .toString()
        .trim();
      if (container_id) {
        const container_logs = execSync(
          `docker logs ${container_id} 2>&1`,
        ).toString();
        const regex =
          /['"]keyring_backend['"]\s*:\s*["'](?<keyring>[^'"]*)["']/g;
        const match = regex.exec(container_logs);
        if (match) {
          return match.groups['keyring'];
        }
      }
      await new Promise((f) => setTimeout(f, 1000, signal));
    }
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
  }
}

async function test_relayer(keyring_type) {
  const relayer_version = `${keyring_type}-test`;

  const jest_env = process.env;
  jest_env['RELAYER_VERSION'] = relayer_version;
  const exec_options: ExecSyncOptions = {
    env: jest_env,
  };

  const util = require('util');
  const exec = util.promisify(require('child_process').exec);

  const jest_promise = exec(
    'jest --runInBand -b --json src/testcases/interchain_kv_query',
    exec_options,
  );
  const controller = new AbortController();
  const signal = controller.signal;
  let detected_keyring = '';
  search_keyring_in_output(signal, relayer_version).then((val) => {
    detected_keyring = val;
  });

  const result: any = {};
  const jest_output = (await jest_promise).stdout;

  result.is_any_test_failed = JSON.parse(jest_output).numFailedTests != 0;

  result.detected_keyring = detected_keyring;
  controller.abort();
  return result;
}

describe('Neutron / Relayer keyrings', () => {
  test('memory backend', async () => {
    const keyring_type = 'memory';
    const tests_result = await test_relayer(keyring_type);
    expect(tests_result.is_any_test_failed).toBeFalsy();
    expect(tests_result.detected_keyring).toEqual(keyring_type);
  });

  test('os backend', async () => {
    const keyring_type = 'os';
    const tests_result = await test_relayer(keyring_type);
    expect(tests_result.is_any_test_failed).toBeFalsy();
    expect(tests_result.detected_keyring).toEqual(keyring_type);
  });

  test('test backend', async () => {
    const keyring_type = 'test';
    const tests_result = await test_relayer(keyring_type);
    expect(tests_result.is_any_test_failed).toBeFalsy();
    expect(tests_result.detected_keyring).toEqual(keyring_type);
  });

  test('pass backend', async () => {
    const keyring_type = 'pass';
    const tests_result = await test_relayer(keyring_type);
    expect(tests_result.is_any_test_failed).toBeFalsy();
    expect(tests_result.detected_keyring).toEqual(keyring_type);
  });

  test('file backend', async () => {
    const keyring_type = 'file';
    const tests_result = await test_relayer(keyring_type);
    expect(tests_result.is_any_test_failed).toBeFalsy();
    expect(tests_result.detected_keyring).toEqual(keyring_type);
  });
});
