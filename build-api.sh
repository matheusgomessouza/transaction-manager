#!/bin/bash
set -e

npm ci

# Debug: check if tsup exists
ls -la node_modules/.bin/tsup 2>&1 || echo "tsup bin not found in root"
ls -la apps/api/node_modules/.bin/tsup 2>&1 || echo "tsup bin not found in apps/api"

npx prisma generate --schema apps/api/prisma/schema.prisma
./node_modules/.bin/tsup apps/api/src/server.ts --format cjs --minify --outDir apps/api/dist --clean
