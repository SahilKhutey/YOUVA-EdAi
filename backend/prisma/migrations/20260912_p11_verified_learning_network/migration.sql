-- ============================================================================
-- Phase P11 Migration: Global Education Intelligence & Verified Learning Network
-- ============================================================================

-- CreateTable: EvidenceProvenance
CREATE TABLE "EvidenceProvenance" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "conceptId" TEXT,
    "contentId" TEXT,
    "curriculumId" TEXT,
    "modelVersion" TEXT,
    "agentVersion" TEXT,
    "policyVersion" TEXT,
    "teacherId" TEXT,
    "interventionId" TEXT,
    "experimentId" TEXT,
    "source" TEXT NOT NULL,
    "integrityHash" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceProvenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EvidenceCorrection
CREATE TABLE "EvidenceCorrection" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "replacementId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "EvidenceCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningClaim
CREATE TABLE "LearningClaim" (
    "id" TEXT NOT NULL,
    "claimType" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "scopeJson" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "LearningClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClaimEvidence
CREATE TABLE "ClaimEvidence" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VerifiedLearningKnowledge
CREATE TABLE "VerifiedLearningKnowledge" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "knowledgeType" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "replicationCount" INTEGER NOT NULL,
    "scopeJson" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerifiedLearningKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CausalStudy
CREATE TABLE "CausalStudy" (
    "id" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "treatment" TEXT NOT NULL,
    "control" TEXT,
    "outcome" TEXT NOT NULL,
    "populationJson" TEXT NOT NULL,
    "confoundersJson" TEXT NOT NULL,
    "design" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CausalStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InterventionEffectiveness
CREATE TABLE "InterventionEffectiveness" (
    "id" TEXT NOT NULL,
    "interventionType" TEXT NOT NULL,
    "conceptId" TEXT,
    "sampleSize" INTEGER NOT NULL,
    "baselineMastery" DOUBLE PRECISION NOT NULL,
    "postMastery" DOUBLE PRECISION NOT NULL,
    "retention" DOUBLE PRECISION,
    "transfer" DOUBLE PRECISION,
    "effectSize" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionEffectiveness_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AIDecisionTrace
CREATE TABLE "AIDecisionTrace" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "learnerId" TEXT,
    "modelVersion" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "outputHash" TEXT NOT NULL,
    "contextRefsJson" TEXT NOT NULL,
    "toolCallsJson" TEXT,
    "action" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDecisionTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AIPromptVersion
CREATE TABLE "AIPromptVersion" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "templateHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIPromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: KnowledgeContribution
CREATE TABLE "KnowledgeContribution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "contributionType" TEXT NOT NULL,
    "evidenceCount" INTEGER NOT NULL,
    "privacyMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VerifiedContent
CREATE TABLE "VerifiedContent" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "curriculumScore" DOUBLE PRECISION NOT NULL,
    "safetyScore" DOUBLE PRECISION NOT NULL,
    "accessibilityScore" DOUBLE PRECISION NOT NULL,
    "teacherScore" DOUBLE PRECISION NOT NULL,
    "effectivenessScore" DOUBLE PRECISION NOT NULL,
    "provenanceScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "VerifiedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ResearchStudyVersion
CREATE TABLE "ResearchStudyVersion" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "protocolHash" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "analysisHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchStudyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ResearchResult
CREATE TABLE "ResearchResult" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "estimate" DOUBLE PRECISION NOT NULL,
    "lowerBound" DOUBLE PRECISION,
    "upperBound" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL,
    "interpretation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GovernanceDecision
CREATE TABLE "GovernanceDecision" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceDecision_pkey" PRIMARY KEY ("id")
);

-- Unique Indexes
CREATE UNIQUE INDEX "EvidenceProvenance_evidenceId_key" ON "EvidenceProvenance"("evidenceId");
CREATE UNIQUE INDEX "ClaimEvidence_claimId_evidenceId_key" ON "ClaimEvidence"("claimId", "evidenceId");
CREATE UNIQUE INDEX "VerifiedLearningKnowledge_claimId_key" ON "VerifiedLearningKnowledge"("claimId");
CREATE UNIQUE INDEX "AIDecisionTrace_requestId_key" ON "AIDecisionTrace"("requestId");
CREATE UNIQUE INDEX "AIPromptVersion_key_version_key" ON "AIPromptVersion"("key", "version");
CREATE UNIQUE INDEX "VerifiedContent_contentId_key" ON "VerifiedContent"("contentId");
CREATE UNIQUE INDEX "ResearchStudyVersion_studyId_version_key" ON "ResearchStudyVersion"("studyId", "version");

-- Regular Indexes
CREATE INDEX "EvidenceProvenance_tenantId_occurredAt_idx" ON "EvidenceProvenance"("tenantId", "occurredAt");
CREATE INDEX "EvidenceProvenance_learnerId_occurredAt_idx" ON "EvidenceProvenance"("learnerId", "occurredAt");
CREATE INDEX "EvidenceProvenance_conceptId_occurredAt_idx" ON "EvidenceProvenance"("conceptId", "occurredAt");

CREATE INDEX "EvidenceCorrection_evidenceId_idx" ON "EvidenceCorrection"("evidenceId");
CREATE INDEX "EvidenceCorrection_status_idx" ON "EvidenceCorrection"("status");

CREATE INDEX "LearningClaim_claimType_status_idx" ON "LearningClaim"("claimType", "status");
CREATE INDEX "LearningClaim_status_confidence_idx" ON "LearningClaim"("status", "confidence");

CREATE INDEX "ClaimEvidence_claimId_idx" ON "ClaimEvidence"("claimId");
CREATE INDEX "ClaimEvidence_evidenceId_idx" ON "ClaimEvidence"("evidenceId");

CREATE INDEX "VerifiedLearningKnowledge_knowledgeType_status_idx" ON "VerifiedLearningKnowledge"("knowledgeType", "status");
CREATE INDEX "CausalStudy_status_idx" ON "CausalStudy"("status");

CREATE INDEX "InterventionEffectiveness_interventionType_idx" ON "InterventionEffectiveness"("interventionType");
CREATE INDEX "InterventionEffectiveness_conceptId_idx" ON "InterventionEffectiveness"("conceptId");

CREATE INDEX "AIDecisionTrace_tenantId_createdAt_idx" ON "AIDecisionTrace"("tenantId", "createdAt");
CREATE INDEX "AIDecisionTrace_learnerId_createdAt_idx" ON "AIDecisionTrace"("learnerId", "createdAt");
CREATE INDEX "AIDecisionTrace_modelVersion_createdAt_idx" ON "AIDecisionTrace"("modelVersion", "createdAt");

CREATE INDEX "AIPromptVersion_key_status_idx" ON "AIPromptVersion"("key", "status");

CREATE INDEX "KnowledgeContribution_tenantId_idx" ON "KnowledgeContribution"("tenantId");
CREATE INDEX "KnowledgeContribution_claimId_idx" ON "KnowledgeContribution"("claimId");
CREATE INDEX "KnowledgeContribution_status_idx" ON "KnowledgeContribution"("status");

CREATE INDEX "VerifiedContent_status_idx" ON "VerifiedContent"("status");
CREATE INDEX "ResearchResult_studyId_idx" ON "ResearchResult"("studyId");
CREATE INDEX "GovernanceDecision_resourceType_resourceId_idx" ON "GovernanceDecision"("resourceType", "resourceId");
