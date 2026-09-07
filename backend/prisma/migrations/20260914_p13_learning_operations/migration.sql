-- ============================================================================
-- PHASE P13 MIGRATION: ADAPTIVE LEARNING OPERATIONS & INSTITUTIONAL INTELLIGENCE
-- ============================================================================

-- CreateTable: LearningSignal
CREATE TABLE IF NOT EXISTS "LearningSignal" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "conceptId" TEXT,
    "evidenceIdsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningIntervention
CREATE TABLE IF NOT EXISTS "LearningIntervention" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetConceptId" TEXT,
    "priority" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "requiresTeacherApproval" BOOLEAN NOT NULL DEFAULT true,
    "plannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outcomeJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InterventionEvaluation
CREATE TABLE IF NOT EXISTS "InterventionEvaluation" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "baselineValue" DOUBLE PRECISION,
    "outcomeValue" DOUBLE PRECISION,
    "effectSize" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "methodology" TEXT NOT NULL,
    "evaluatorType" TEXT NOT NULL,
    "notes" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PolicyRecommendation
CREATE TABLE IF NOT EXISTS "PolicyRecommendation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "scope" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "evidenceIdsJson" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "requiresHumanApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "PolicyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OperationsEventProcessing
CREATE TABLE IF NOT EXISTS "OperationsEventProcessing" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationsEventProcessing_pkey" PRIMARY KEY ("id")
);

-- Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "OperationsEventProcessing_eventId_key" ON "OperationsEventProcessing"("eventId");

-- Indexes
CREATE INDEX IF NOT EXISTS "LearningSignal_tenantId_learnerId_idx" ON "LearningSignal"("tenantId", "learnerId");
CREATE INDEX IF NOT EXISTS "LearningSignal_tenantId_type_status_idx" ON "LearningSignal"("tenantId", "type", "status");
CREATE INDEX IF NOT EXISTS "LearningSignal_conceptId_idx" ON "LearningSignal"("conceptId");

CREATE INDEX IF NOT EXISTS "LearningIntervention_tenantId_learnerId_status_idx" ON "LearningIntervention"("tenantId", "learnerId", "status");
CREATE INDEX IF NOT EXISTS "LearningIntervention_signalId_idx" ON "LearningIntervention"("signalId");

CREATE INDEX IF NOT EXISTS "InterventionEvaluation_interventionId_idx" ON "InterventionEvaluation"("interventionId");

CREATE INDEX IF NOT EXISTS "PolicyRecommendation_tenantId_status_idx" ON "PolicyRecommendation"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "PolicyRecommendation_category_idx" ON "PolicyRecommendation"("category");
