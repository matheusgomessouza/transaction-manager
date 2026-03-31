#!/bin/bash
set -e

# Install root deps
npm ci

# Generate Prisma client (from root)
npx prisma generate --schema apps/api/prisma/schema.prisma

# Build API using tsup directly (bypass workspace PATH issues)
./node_modules/.bin/tsup apps/api/src/server.ts --format cjs --minify --outDir apps/api/dist --clean
