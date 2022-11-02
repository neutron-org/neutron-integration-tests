const ch = require('child_process');

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
      console.error('Stopping cosmopark');
      ch.execSync(`cd setup && make stop-cosmopark`);
    });
  return config;
};
