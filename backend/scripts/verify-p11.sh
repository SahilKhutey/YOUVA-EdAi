#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "YOUVA-EdAI P11 VERIFICATION"
echo "========================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/6] Checking Prisma Schema P11 Models..."
for model in EvidenceProvenance EvidenceCorrection LearningClaim ClaimEvidence VerifiedLearningKnowledge CausalStudy InterventionEffectiveness AIDecisionTrace AIPromptVersion KnowledgeContribution VerifiedContent ResearchStudyVersion ResearchResult GovernanceDecision; do
  if grep -q "model $model" "$ROOT_DIR/prisma/schema.prisma"; then
    echo "  [OK] Model $model in schema.prisma"
  else
    echo "  [FAIL] Missing $model in schema.prisma"
    exit 1
  fi
done

echo "[2/6] Checking P11 Migration SQL..."
MIGRATION_FILE="$ROOT_DIR/prisma/migrations/20260912_p11_verified_learning_network/migration.sql"
if [ -f "$MIGRATION_FILE" ]; then
  echo "  [OK] Migration SQL exists"
else
  echo "  [FAIL] Missing migration SQL"
  exit 1
fi

echo "[3/6] Checking Verified Learning Subsystems..."
for dir in evidence claims causal knowledge ai-trace trust governance; do
  if [ -d "$ROOT_DIR/src/verified-learning/$dir" ]; then
    echo "  [OK] Subsystem $dir exists"
  else
    echo "  [FAIL] Subsystem $dir missing"
    exit 1
  fi
done

echo "[4/6] Checking AppModule Registration..."
if grep -q "VerifiedLearningModule" "$ROOT_DIR/src/app.module.ts"; then
  echo "  [OK] VerifiedLearningModule registered in app.module.ts"
else
  echo "  [FAIL] VerifiedLearningModule not registered"
  exit 1
fi

echo "[5/6] Running Node Verification Logic..."
node "$ROOT_DIR/scripts/verify-p11.js"

echo "========================================"
echo "P11 verification complete."
echo "========================================"
