#!/bin/bash
set -e

export NODE_ENV=development
npm install

npx prisma generate --schema apps/api/prisma/schema.prisma
./node_modules/.bin/tsup --config apps/api/tsup.config.ts apps/api/src/server.ts --outDir apps/api/dist
