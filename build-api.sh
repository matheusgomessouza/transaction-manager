#!/bin/bash
set -e

# Force dev deps (NODE_ENV=production skips tsup/typescript)
export NODE_ENV=development
npm install

npx prisma generate --schema apps/api/prisma/schema.prisma
./node_modules/.bin/tsup apps/api/src/server.ts --format cjs --minify --outDir apps/api/dist --clean
