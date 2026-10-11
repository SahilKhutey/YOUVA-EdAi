#!/usr/bin/env bash
# Regenerates the real, reproducible numbers. Run from repo root on a machine with normal network access.
set -u
cd backend
npm ci --no-audit --no-fund >/dev/null 2>&1
npx prisma generate >/dev/null 2>&1
echo "date: $(date -u +%FT%TZ)  commit: $(git rev-parse --short HEAD)"
echo "models in schema.prisma: $(grep -c '^model ' prisma/schema.prisma)"
echo "CREATE TABLE in migrations: $(cat prisma/migrations/*/migration.sql | grep -c 'CREATE TABLE')"
echo "--- typecheck ---"; npx tsc --noEmit 2>&1 | tail -5; echo "tsc errors: $(npx tsc --noEmit 2>&1 | grep -c 'error TS')"
echo "--- unit tests (non-e2e) ---"; npx jest --testPathIgnorePatterns="e2e" 2>&1 | grep -E "^(Tests|Test Suites):"
echo "--- spec files importing no app code ---"
grep -LE "from '\.\.?/" $(find src -name '*.spec.ts') | head -30
