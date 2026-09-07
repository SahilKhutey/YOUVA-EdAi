-- CreateTable: IdempotencyRecord
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT,
    "requestHash" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SystemAuditEvent
CREATE TABLE "SystemAuditEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AIExecutionRecord
CREATE TABLE "AIExecutionRecord" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "userId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "modelVersion" TEXT,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "inputHash" TEXT,
    "outputHash" TEXT,
    "safetyStatus" TEXT NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIExecutionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: IdempotencyRecord
CREATE UNIQUE INDEX "IdempotencyRecord_key_key" ON "IdempotencyRecord"("key");
CREATE INDEX "IdempotencyRecord_userId_idx" ON "IdempotencyRecord"("userId");
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex: SystemAuditEvent
CREATE INDEX "SystemAuditEvent_actorId_idx" ON "SystemAuditEvent"("actorId");
CREATE INDEX "SystemAuditEvent_resourceType_resourceId_idx" ON "SystemAuditEvent"("resourceType", "resourceId");
CREATE INDEX "SystemAuditEvent_createdAt_idx" ON "SystemAuditEvent"("createdAt");
CREATE INDEX "SystemAuditEvent_requestId_idx" ON "SystemAuditEvent"("requestId");

-- CreateIndex: AIExecutionRecord
CREATE INDEX "AIExecutionRecord_userId_idx" ON "AIExecutionRecord"("userId");
CREATE INDEX "AIExecutionRecord_createdAt_idx" ON "AIExecutionRecord"("createdAt");
CREATE INDEX "AIExecutionRecord_provider_model_idx" ON "AIExecutionRecord"("provider", "model");
