-- ============================================================================
-- Phase P9 Migration: Autonomous Learning Operations, AI Governance & Global Ecosystem
-- ============================================================================

-- CreateTable: AIAgent
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "autonomyLevel" TEXT NOT NULL DEFAULT 'SUPERVISED',
    "policyVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AIAgentExecution
CREATE TABLE "AIAgentExecution" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "tenantId" TEXT,
    "learnerId" TEXT,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inputHash" TEXT NOT NULL,
    "outputHash" TEXT,
    "policyVersion" TEXT NOT NULL,
    "humanApprovedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorDetails" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AIAgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningWorkflow
CREATE TABLE "LearningWorkflow" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WorkflowExecution
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "tenantId" TEXT,
    "learnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "state" TEXT NOT NULL,
    "contextJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AIUsageRecord
CREATE TABLE "AIUsageRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "learnerId" TEXT,
    "agentId" TEXT,
    "modelVersionId" TEXT,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "latencyMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Integration
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "provider" TEXT NOT NULL,
    "integrationKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "configJson" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- Unique Indexes
CREATE UNIQUE INDEX "AIAgent_key_key" ON "AIAgent"("key");
CREATE UNIQUE INDEX "AIAgentExecution_requestId_key" ON "AIAgentExecution"("requestId");
CREATE UNIQUE INDEX "LearningWorkflow_key_key" ON "LearningWorkflow"("key");

-- Regular Indexes
CREATE INDEX "AIAgent_status_idx" ON "AIAgent"("status");
CREATE INDEX "AIAgent_autonomyLevel_idx" ON "AIAgent"("autonomyLevel");

CREATE INDEX "AIAgentExecution_agentId_status_idx" ON "AIAgentExecution"("agentId", "status");
CREATE INDEX "AIAgentExecution_learnerId_createdAt_idx" ON "AIAgentExecution"("learnerId", "createdAt");
CREATE INDEX "AIAgentExecution_tenantId_idx" ON "AIAgentExecution"("tenantId");
CREATE INDEX "AIAgentExecution_action_idx" ON "AIAgentExecution"("action");

CREATE INDEX "LearningWorkflow_status_idx" ON "LearningWorkflow"("status");

CREATE INDEX "WorkflowExecution_workflowId_status_idx" ON "WorkflowExecution"("workflowId", "status");
CREATE INDEX "WorkflowExecution_learnerId_idx" ON "WorkflowExecution"("learnerId");
CREATE INDEX "WorkflowExecution_tenantId_idx" ON "WorkflowExecution"("tenantId");

CREATE INDEX "AIUsageRecord_tenantId_createdAt_idx" ON "AIUsageRecord"("tenantId", "createdAt");
CREATE INDEX "AIUsageRecord_agentId_idx" ON "AIUsageRecord"("agentId");
CREATE INDEX "AIUsageRecord_learnerId_idx" ON "AIUsageRecord"("learnerId");

CREATE INDEX "Integration_tenantId_provider_idx" ON "Integration"("tenantId", "provider");
CREATE INDEX "Integration_integrationKey_idx" ON "Integration"("integrationKey");

-- Foreign Keys
ALTER TABLE "AIAgentExecution" ADD CONSTRAINT "AIAgentExecution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "LearningWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
