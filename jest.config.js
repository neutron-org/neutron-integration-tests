module.exports = {
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
