#!/usr/bin/env bash
set -u; cd backend
npm ci --no-audit --no-fund >/dev/null 2>&1; npx prisma generate >/dev/null 2>&1
echo "date: $(date -u +%FT%TZ) commit: $(git rev-parse --short HEAD)"
echo "models: $(grep -c '^model ' prisma/schema.prisma)  migrations: $(ls prisma/migrations | grep -vc lock)"
echo "tsc errors: $(npx tsc --noEmit 2>&1 | grep -c 'error TS')"
npx jest --testPathIgnorePatterns=e2e 2>&1 | grep -E "^(Tests|Test Suites):"
