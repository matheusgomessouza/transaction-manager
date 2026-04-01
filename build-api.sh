#!/bin/bash
set -e

npm install
npx prisma generate --schema apps/api/prisma/schema.prisma
