-- ============================================================================
-- PHASE P14 MIGRATION: TRUSTWORTHY AUTONOMOUS LEARNING OS
-- ============================================================================

-- CreateTable: LearningAction
CREATE TABLE IF NOT EXISTS "LearningAction" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parametersJson" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "evidenceIdsJson" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "reversible" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PolicyDecision
CREATE TABLE IF NOT EXISTS "PolicyDecision" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "reasonsJson" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ActionExecution
CREATE TABLE IF NOT EXISTS "ActionExecution" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "resultJson" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable: HumanApproval
CREATE TABLE IF NOT EXISTS "HumanApproval" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reviewerId" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "rationale" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "HumanApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningTwinSnapshot
CREATE TABLE IF NOT EXISTS "LearningTwinSnapshot" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "stateJson" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningTwinSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DecisionProvenance
CREATE TABLE IF NOT EXISTS "DecisionProvenance" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "modelVersion" TEXT,
    "policyVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "decisionJson" TEXT NOT NULL,
    "evidenceIdsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionProvenance_pkey" PRIMARY KEY ("id")
);

-- Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "LearningTwinSnapshot_learnerId_version_key" ON "LearningTwinSnapshot"("learnerId", "version");

-- Indexes
CREATE INDEX IF NOT EXISTS "LearningAction_tenantId_learnerId_status_idx" ON "LearningAction"("tenantId", "learnerId", "status");
CREATE INDEX IF NOT EXISTS "LearningAction_tenantId_type_idx" ON "LearningAction"("tenantId", "type");

CREATE INDEX IF NOT EXISTS "PolicyDecision_actionId_idx" ON "PolicyDecision"("actionId");
CREATE INDEX IF NOT EXISTS "PolicyDecision_decision_decidedAt_idx" ON "PolicyDecision"("decision", "decidedAt");

CREATE INDEX IF NOT EXISTS "ActionExecution_actionId_idx" ON "ActionExecution"("actionId");
CREATE INDEX IF NOT EXISTS "ActionExecution_status_startedAt_idx" ON "ActionExecution"("status", "startedAt");

CREATE INDEX IF NOT EXISTS "HumanApproval_tenantId_decision_idx" ON "HumanApproval"("tenantId", "decision");
CREATE INDEX IF NOT EXISTS "HumanApproval_actionId_idx" ON "HumanApproval"("actionId");

CREATE INDEX IF NOT EXISTS "LearningTwinSnapshot_tenantId_learnerId_createdAt_idx" ON "LearningTwinSnapshot"("tenantId", "learnerId", "createdAt");

CREATE INDEX IF NOT EXISTS "DecisionProvenance_tenantId_createdAt_idx" ON "DecisionProvenance"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "DecisionProvenance_decisionId_idx" ON "DecisionProvenance"("decisionId");
