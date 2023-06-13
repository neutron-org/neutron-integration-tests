const { defaults } = require('jest-config');

const config = {
  reporters: ['default', 'jest-junit'],
  cacheDirectory: '.jest/cache',
  coverageDirectory: '.jest/coverage',
  bail: 1,
  verbose: true,
  globalSetup: './globalSetup.ts',
  globalTeardown: './globalTeardown.ts',
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

module.exports = () => config;
