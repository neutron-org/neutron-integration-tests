import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  test: {
    sequence: {
      hooks: 'list',
    },
    maxConcurrency: 4,
    globals: true,
    globalSetup: ['./src/globalSetup.ts'],
    hookTimeout: 500_000,
    testTimeout: 500_000,
    watchExclude: ['**/node_modules/**', '**/*.yml'],
    setupFiles: ['./src/helpers/setupMatchers.ts'],
  },
});
