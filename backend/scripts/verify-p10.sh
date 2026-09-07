#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "YOUVA-EdAI P10 VERIFICATION"
echo "========================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/8] Checking Prisma Schema P10 Models..."
for model in LearningSystemSnapshot ImprovementProposal LearningOutcome ExperimentGovernance ReleaseArtifact ResearchDataset LearningPattern PolicyVersion; do
  if grep -q "model $model" "$ROOT_DIR/prisma/schema.prisma"; then
    echo "  [OK] Model $model in schema.prisma"
  else
    echo "  [FAIL] Missing $model in schema.prisma"
    exit 1
  fi
done

echo "[2/8] Checking P10 Migration SQL..."
MIGRATION_FILE="$ROOT_DIR/prisma/migrations/20260911_p10_global_learning_os/migration.sql"
if [ -f "$MIGRATION_FILE" ]; then
  echo "  [OK] Migration SQL exists"
else
  echo "  [FAIL] Missing migration SQL"
  exit 1
fi

echo "[3/8] Checking Learning OS Subsystems..."
for dir in digital-twin improvement outcomes release policy research reliability; do
  if [ -d "$ROOT_DIR/src/learning-os/$dir" ]; then
    echo "  [OK] Subsystem $dir exists"
  else
    echo "  [FAIL] Subsystem $dir missing"
    exit 1
  fi
done

echo "[4/8] Checking AppModule Registration..."
if grep -q "LearningOSModule" "$ROOT_DIR/src/app.module.ts"; then
  echo "  [OK] LearningOSModule registered in app.module.ts"
else
  echo "  [FAIL] LearningOSModule not registered"
  exit 1
fi

echo "[5/8] Running Node Verification Logic..."
node "$ROOT_DIR/scripts/verify-p10.js"

echo "========================================"
echo "P10 verification complete."
echo "========================================"
