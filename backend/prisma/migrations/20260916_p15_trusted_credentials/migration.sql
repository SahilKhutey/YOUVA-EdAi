-- ============================================================================
-- PHASE P15 MIGRATION: TRUSTED LEARNING IDENTITY, SKILLS PASSPORT & CREDENTIAL NETWORK
-- ============================================================================

-- CreateTable: LearningCredential
CREATE TABLE IF NOT EXISTS "LearningCredential" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "verificationLevel" TEXT NOT NULL,
    "issuerId" TEXT,
    "issuerName" TEXT,
    "evidenceIdsJson" TEXT NOT NULL,
    "skillIdsJson" TEXT NOT NULL,
    "curriculumJson" TEXT,
    "criteriaJson" TEXT NOT NULL,
    "metadataJson" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CredentialVerification
CREATE TABLE IF NOT EXISTS "CredentialVerification" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "verificationLevel" TEXT NOT NULL,
    "verifierType" TEXT NOT NULL,
    "verifierId" TEXT,
    "decision" TEXT NOT NULL,
    "evidenceJson" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CredentialEvent
CREATE TABLE IF NOT EXISTS "CredentialEvent" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CredentialShare
CREATE TABLE IF NOT EXISTS "CredentialShare" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CredentialVersion
CREATE TABLE IF NOT EXISTS "CredentialVersion" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "criteriaJson" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CredentialTemplate
CREATE TABLE IF NOT EXISTS "CredentialTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "credentialType" TEXT NOT NULL,
    "criteriaJson" TEXT NOT NULL,
    "skillIdsJson" TEXT NOT NULL,
    "curriculumJson" TEXT,
    "minimumMastery" DOUBLE PRECISION,
    "minimumEvidence" INTEGER,
    "requiresTeacher" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CredentialOperation
CREATE TABLE IF NOT EXISTS "CredentialOperation" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "operationKey" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CredentialOperation_pkey" PRIMARY KEY ("id")
);

-- Unique Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "CredentialShare_tokenHash_key" ON "CredentialShare"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "CredentialVersion_credentialId_version_key" ON "CredentialVersion"("credentialId", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "CredentialTemplate_tenantId_key_version_key" ON "CredentialTemplate"("tenantId", "key", "version");
CREATE UNIQUE INDEX IF NOT EXISTS "CredentialOperation_operationKey_key" ON "CredentialOperation"("operationKey");

-- Indexes
CREATE INDEX IF NOT EXISTS "LearningCredential_tenantId_learnerId_idx" ON "LearningCredential"("tenantId", "learnerId");
CREATE INDEX IF NOT EXISTS "LearningCredential_tenantId_status_idx" ON "LearningCredential"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "LearningCredential_issuerId_idx" ON "LearningCredential"("issuerId");

CREATE INDEX IF NOT EXISTS "CredentialVerification_credentialId_idx" ON "CredentialVerification"("credentialId");
CREATE INDEX IF NOT EXISTS "CredentialVerification_verifierType_verifierId_idx" ON "CredentialVerification"("verifierType", "verifierId");

CREATE INDEX IF NOT EXISTS "CredentialEvent_credentialId_createdAt_idx" ON "CredentialEvent"("credentialId", "createdAt");
CREATE INDEX IF NOT EXISTS "CredentialEvent_tenantId_createdAt_idx" ON "CredentialEvent"("tenantId", "createdAt");

CREATE INDEX IF NOT EXISTS "CredentialShare_credentialId_idx" ON "CredentialShare"("credentialId");

CREATE INDEX IF NOT EXISTS "CredentialTemplate_tenantId_active_idx" ON "CredentialTemplate"("tenantId", "active");

CREATE INDEX IF NOT EXISTS "CredentialOperation_credentialId_idx" ON "CredentialOperation"("credentialId");
