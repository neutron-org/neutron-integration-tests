import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  test: {
    sequence: {
      hooks: 'list',
    },
    maxConcurrency: 4,
    globals: true,
    globalSetup: ['./src/global_setup.ts'],
    hookTimeout: 500_000,
    testTimeout: 500_000,
    exclude: ['**/node_modules/**', '**/*.yml'],
    setupFiles: ['./src/helpers/setup_matchers.ts'],
  },
});
