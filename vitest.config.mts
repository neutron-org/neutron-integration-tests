import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  test: {
    sequence: {
      hooks: 'list',
    },
    // maxConcurrency: 1,
    globals: true,
    globalSetup: ['./src/globalSetup.ts'],
    hookTimeout: 500_000,
    testTimeout: 500_000,
    watchExclude: ['**/node_modules/**', '**/*.yml'],
  },
});
