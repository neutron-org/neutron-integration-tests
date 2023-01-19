const ch = require('child_process');
const { defaults } = require('jest-config');

const config = {
  reporters: ['default', 'jest-junit'],
  cacheDirectory: '.jest/cache',
  coverageDirectory: '.jest/coverage',
  bail: true,
  testTimeout: 600000,
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'cjs'],
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
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
};

let oneStop = false;

module.exports = () => {
  !process.env.NO_DOCKER &&
    process.on('exit', () => {
      if (oneStop) return;
      oneStop = true;
      console.log('Stopping cosmopark');
      ch.execSync(`cd setup && make stop-cosmopark`);
    });
  return config;
};
