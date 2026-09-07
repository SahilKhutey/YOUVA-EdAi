-- ============================================================================
-- PHASE P12 MIGRATION: LEARNING INTEROPERABILITY, ULR & PASSPORT
-- ============================================================================

-- CreateTable: UnifiedLearnerSnapshot
CREATE TABLE IF NOT EXISTS "UnifiedLearnerSnapshot" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnifiedLearnerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningPassport
CREATE TABLE IF NOT EXISTS "LearningPassport" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PassportAchievement
CREATE TABLE IF NOT EXISTS "PassportAchievement" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "achievementType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "conceptId" TEXT,
    "competencyId" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "evidenceRefJson" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassportAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningCompetency
CREATE TABLE IF NOT EXISTS "LearningCompetency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL,
    "metadataJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningCompetency_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearnerCompetency
CREATE TABLE IF NOT EXISTS "LearnerCompetency" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3),

    CONSTRAINT "LearnerCompetency_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExternalLearningEvent
CREATE TABLE IF NOT EXISTS "ExternalLearningEvent" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "learnerReference" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalLearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningDataShare
CREATE TABLE IF NOT EXISTS "LearningDataShare" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scopeJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "LearningDataShare_pkey" PRIMARY KEY ("id")
);

-- Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "UnifiedLearnerSnapshot_learnerId_version_key" ON "UnifiedLearnerSnapshot"("learnerId", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "LearningPassport_learnerId_key" ON "LearningPassport"("learnerId");
CREATE UNIQUE INDEX IF NOT EXISTS "LearningCompetency_key_key" ON "LearningCompetency"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "LearnerCompetency_learnerId_competencyId_key" ON "LearnerCompetency"("learnerId", "competencyId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalLearningEvent_providerId_externalEventId_key" ON "ExternalLearningEvent"("providerId", "externalEventId");

-- Indexes
CREATE INDEX IF NOT EXISTS "UnifiedLearnerSnapshot_tenantId_learnerId_idx" ON "UnifiedLearnerSnapshot"("tenantId", "learnerId");
CREATE INDEX IF NOT EXISTS "LearningPassport_learnerId_idx" ON "LearningPassport"("learnerId");
CREATE INDEX IF NOT EXISTS "PassportAchievement_passportId_idx" ON "PassportAchievement"("passportId");
CREATE INDEX IF NOT EXISTS "PassportAchievement_verificationStatus_idx" ON "PassportAchievement"("verificationStatus");
CREATE INDEX IF NOT EXISTS "LearnerCompetency_learnerId_idx" ON "LearnerCompetency"("learnerId");
CREATE INDEX IF NOT EXISTS "LearnerCompetency_competencyId_idx" ON "LearnerCompetency"("competencyId");
CREATE INDEX IF NOT EXISTS "ExternalLearningEvent_tenantId_learnerReference_idx" ON "ExternalLearningEvent"("tenantId", "learnerReference");
CREATE INDEX IF NOT EXISTS "LearningDataShare_learnerId_idx" ON "LearningDataShare"("learnerId");
CREATE INDEX IF NOT EXISTS "LearningDataShare_tenantId_status_idx" ON "LearningDataShare"("tenantId", "status");

-- Foreign Keys
ALTER TABLE "PassportAchievement" 
    DROP CONSTRAINT IF EXISTS "PassportAchievement_passportId_fkey",
    ADD CONSTRAINT "PassportAchievement_passportId_fkey" 
    FOREIGN KEY ("passportId") REFERENCES "LearningPassport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearnerCompetency" 
    DROP CONSTRAINT IF EXISTS "LearnerCompetency_competencyId_fkey",
    ADD CONSTRAINT "LearnerCompetency_competencyId_fkey" 
    FOREIGN KEY ("competencyId") REFERENCES "LearningCompetency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
