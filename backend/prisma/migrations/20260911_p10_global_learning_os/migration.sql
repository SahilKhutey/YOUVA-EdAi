-- ============================================================================
-- Phase P10 Migration: Global Learning OS & Continuous Governed Evolution
-- ============================================================================

-- CreateTable: LearningSystemSnapshot
CREATE TABLE "LearningSystemSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "snapshotType" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "stateJson" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSystemSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ImprovementProposal
CREATE TABLE "ImprovementProposal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DETECTED',
    "affectedSystems" TEXT NOT NULL,
    "rollbackPlan" TEXT NOT NULL,
    "proposedBy" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImprovementProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningOutcome
CREATE TABLE "LearningOutcome" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "interventionId" TEXT,
    "experimentId" TEXT,
    "baselineMastery" DOUBLE PRECISION NOT NULL,
    "finalMastery" DOUBLE PRECISION NOT NULL,
    "retentionScore" DOUBLE PRECISION,
    "transferScore" DOUBLE PRECISION,
    "independence" DOUBLE PRECISION,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExperimentGovernance
CREATE TABLE "ExperimentGovernance" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "safetyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "teacherReviewed" BOOLEAN NOT NULL DEFAULT false,
    "privacyReviewed" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "decision" TEXT,
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentGovernance_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ReleaseArtifact
CREATE TABLE "ReleaseArtifact" (
    "id" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "artifactKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "riskLevel" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "validationJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "ReleaseArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ResearchDataset
CREATE TABLE "ResearchDataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "sourceScope" TEXT NOT NULL,
    "privacyMethod" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningPattern
CREATE TABLE "LearningPattern" (
    "id" TEXT NOT NULL,
    "patternKey" TEXT NOT NULL,
    "conceptScope" TEXT NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "effectiveness" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "sourceVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PolicyVersion
CREATE TABLE "PolicyVersion" (
    "id" TEXT NOT NULL,
    "policyKey" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyVersion_pkey" PRIMARY KEY ("id")
);

-- Unique Indexes
CREATE UNIQUE INDEX "ExperimentGovernance_experimentId_key" ON "ExperimentGovernance"("experimentId");
CREATE UNIQUE INDEX "ReleaseArtifact_artifactType_artifactKey_version_key" ON "ReleaseArtifact"("artifactType", "artifactKey", "version");
CREATE UNIQUE INDEX "LearningPattern_patternKey_key" ON "LearningPattern"("patternKey");
CREATE UNIQUE INDEX "PolicyVersion_policyKey_version_key" ON "PolicyVersion"("policyKey", "version");

-- Regular Indexes
CREATE INDEX "LearningSystemSnapshot_tenantId_generatedAt_idx" ON "LearningSystemSnapshot"("tenantId", "generatedAt");
CREATE INDEX "LearningSystemSnapshot_snapshotType_generatedAt_idx" ON "LearningSystemSnapshot"("snapshotType", "generatedAt");

CREATE INDEX "ImprovementProposal_status_createdAt_idx" ON "ImprovementProposal"("status", "createdAt");
CREATE INDEX "ImprovementProposal_tenantId_status_idx" ON "ImprovementProposal"("tenantId", "status");

CREATE INDEX "LearningOutcome_tenantId_measuredAt_idx" ON "LearningOutcome"("tenantId", "measuredAt");
CREATE INDEX "LearningOutcome_learnerId_conceptId_idx" ON "LearningOutcome"("learnerId", "conceptId");
CREATE INDEX "LearningOutcome_experimentId_idx" ON "LearningOutcome"("experimentId");

CREATE INDEX "ReleaseArtifact_status_idx" ON "ReleaseArtifact"("status");
CREATE INDEX "ResearchDataset_status_idx" ON "ResearchDataset"("status");
CREATE INDEX "PolicyVersion_policyKey_status_idx" ON "PolicyVersion"("policyKey", "status");
