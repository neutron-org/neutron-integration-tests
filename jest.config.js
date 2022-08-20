const ch = require('child_process');
const NEUTRON_DIR = process.env.NEUTRON_DIR || '../neutron';

const config = {
  cacheDirectory: '.jest/cache',
  coverageDirectory: '.jest/coverage',
  bail: true,
  testTimeout: 600000,
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  setupFilesAfterEnv: ['jest-extended/all'],
  transform: {
    '^.+\\.tsx?$': [
      'esbuild-jest',
      {
        target: 'node14',
        format: 'cjs',
        sourcemap: true,
        loaders: {
          '.test.ts': 'tsx',
        },
      },
    ],
  },
};

let oneStop = false;

module.exports = () => {
  !process.env.NO_DOCKER &&
    process.on('exit', () => {
      if (oneStop) return;
      oneStop = true;
      console.log('Stopping cosmopark');
      ch.execSync(`cd ${NEUTRON_DIR} && make stop-cosmopark`);
    });
  return config;
};
