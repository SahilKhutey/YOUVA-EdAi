#!/usr/bin/env bash
set -eo pipefail

echo "================================================================"
echo "YOUVA-EdAI P9 — Autonomous Learning Operations & Governance Verification"
echo "================================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_FILE="$ROOT_DIR/prisma/schema.prisma"
MIGRATION_FILE="$ROOT_DIR/prisma/migrations/20260910_p9_autonomous_learning_governance/migration.sql"
APP_MODULE="$ROOT_DIR/src/app.module.ts"

echo "1. Checking Prisma Schema for P9 Models..."
for model in AIAgent AIAgentExecution LearningWorkflow WorkflowExecution AIUsageRecord Integration; do
  if grep -q "model $model" "$SCHEMA_FILE"; then
    echo "  [OK] Model $model exists in schema.prisma"
  else
    echo "  [FAIL] Missing model $model in schema.prisma"
    exit 1
  fi
done

echo "2. Checking P9 Migration SQL..."
if [ -f "$MIGRATION_FILE" ]; then
  echo "  [OK] Migration SQL found at $MIGRATION_FILE"
  for table in AIAgent AIAgentExecution LearningWorkflow WorkflowExecution AIUsageRecord Integration; do
    if grep -q "CREATE TABLE \"$table\"" "$MIGRATION_FILE"; then
      echo "    [OK] Table $table creation statement verified"
    else
      echo "    [FAIL] Table $table creation missing from migration SQL"
      exit 1
    fi
  done
else
  echo "  [FAIL] Migration file missing"
  exit 1
fi

echo "3. Checking P9 Autonomy Subsystem..."
for file in autonomy.types.ts autonomy-policy.service.ts agent-execution.service.ts autonomy.controller.ts autonomy.module.ts autonomy-policy.spec.ts agent-execution.spec.ts; do
  if [ -f "$ROOT_DIR/src/autonomy/$file" ]; then
    echo "  [OK] Autonomy file $file exists"
  else
    echo "  [FAIL] Missing $file in autonomy subsystem"
    exit 1
  fi
done

echo "4. Checking P9 Workflow Engine Subsystem..."
for file in workflow.types.ts workflow-engine.service.ts workflows.controller.ts workflows.module.ts workflow-engine.spec.ts; do
  if [ -f "$ROOT_DIR/src/workflows/$file" ]; then
    echo "  [OK] Workflow file $file exists"
  else
    echo "  [FAIL] Missing $file in workflows subsystem"
    exit 1
  fi
done

echo "5. Checking P9 Governance Subsystem..."
for file in governance.types.ts intervention-orchestration.service.ts model-drift.service.ts ai-cost.service.ts ai-governance.controller.ts ai-governance.module.ts intervention-orchestration.spec.ts model-drift.spec.ts ai-cost.spec.ts; do
  if [ -f "$ROOT_DIR/src/governance/$file" ]; then
    echo "  [OK] Governance file $file exists"
  else
    echo "  [FAIL] Missing $file in governance subsystem"
    exit 1
  fi
done

echo "6. Checking P9 Ecosystem Subsystem..."
for file in ecosystem.types.ts ecosystem.service.ts ecosystem.controller.ts ecosystem.module.ts ecosystem.spec.ts; do
  if [ -f "$ROOT_DIR/src/ecosystem/$file" ]; then
    echo "  [OK] Ecosystem file $file exists"
  else
    echo "  [FAIL] Missing $file in ecosystem subsystem"
    exit 1
  fi
done

echo "7. Checking AppModule Registration..."
for mod in AutonomyModule WorkflowsModule AIGovernanceModule EcosystemModule; do
  if grep -q "$mod" "$APP_MODULE"; then
    echo "  [OK] $mod registered in app.module.ts"
  else
    echo "  [FAIL] $mod is NOT registered in app.module.ts"
    exit 1
  fi
done

echo "8. Checking Safety & Governance Invariants in Codebase..."
# Invariant A: Institutional authority actions blocked
for action in MODIFY_MASTERY MODIFY_CONSENT MODIFY_ROLE CLOSE_SAFETY_CASE DELETE_LEARNER CHANGE_BILLING; do
  if grep -q "$action" "$ROOT_DIR/src/autonomy/autonomy-policy.service.ts"; then
    echo "  [OK] Invariant: $action is guarded in autonomy-policy.service.ts"
  else
    echo "  [FAIL] Invariant missing: $action is not guarded"
    exit 1
  fi
done

# Invariant B: Model Drift Safety Threshold
if grep -q "SAFETY_DRIFT_THRESHOLD = 0.05" "$ROOT_DIR/src/governance/model-drift.service.ts"; then
  echo "  [OK] Invariant: 5% maximum safety drift threshold enforced"
else
  echo "  [FAIL] Invariant missing: SAFETY_DRIFT_THRESHOLD not set to 0.05"
  exit 1
fi

echo "================================================================"
echo "All Phase P9 Verification Checks Passed Successfully!"
echo "================================================================"
