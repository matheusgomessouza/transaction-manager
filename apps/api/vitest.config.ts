import { defineConfig } from 'vitest/config';
import { tmpdir } from 'os';
import { join } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['src/__tests__/**'],
    cache: false,
  },
});
