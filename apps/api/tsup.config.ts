import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: [
    'dotenv',
    'express',
    'express-async-errors',
    'cors',
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    'pino',
    'zod',
  ],
});
