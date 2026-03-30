import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/setupTests.ts'],
    globalSetup: ['./vitest.globalSetup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
  },
});
