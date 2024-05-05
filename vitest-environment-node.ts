// TODO: remove?

import { setup } from './src/helpers/setup';
import type { Environment } from 'vitest';

export default <Environment>{
  name: 'node',
  transformMode: 'ssr',
  setup() {
    return new Promise((resolve) => {
      (async () => {
        // custom setup
        // TODO
        const host1 = process.env.NODE1_URL || 'http://localhost:1317';
        const host2 = process.env.NODE2_URL || 'http://localhost:1316';
        !process.env.NO_DOCKER && (await setup(host1, host2));

        const res = {
          teardown() {
            // called after all tests with this env have been run
          },
        };
        resolve(res);
      })();
    });
  },
};
