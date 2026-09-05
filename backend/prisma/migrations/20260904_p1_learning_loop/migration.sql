-- CreateTable: LearningEvidenceLog
CREATE TABLE "LearningEvidenceLog" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "hintCount" INTEGER NOT NULL DEFAULT 0,
    "misconception" TEXT,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvidenceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PersonalizationDecision
CREATE TABLE "PersonalizationDecision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "modality" TEXT NOT NULL,
    "pacing" TEXT NOT NULL,
    "recommendationRationale" TEXT NOT NULL,
    "isCertifiedMastery" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalizationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PolicyGateDecision
CREATE TABLE "PolicyGateDecision" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT,
    "userId" TEXT NOT NULL,
    "gateState" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredRules" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyGateDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TeacherIntervention
CREATE TABLE "TeacherIntervention" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "decisionId" TEXT,
    "action" TEXT NOT NULL,
    "overrideDetails" TEXT,
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EscalationEvent
CREATE TABLE "EscalationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningLoopAuditLog
CREATE TABLE "LearningLoopAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "stateBefore" TEXT,
    "stateAfter" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningLoopAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "LearningEvidenceLog_idempotencyKey_key" ON "LearningEvidenceLog"("idempotencyKey");
CREATE INDEX "LearningEvidenceLog_userId_topicId_idx" ON "LearningEvidenceLog"("userId", "topicId");

CREATE INDEX "PersonalizationDecision_userId_topicId_idx" ON "PersonalizationDecision"("userId", "topicId");

CREATE INDEX "PolicyGateDecision_userId_gateState_idx" ON "PolicyGateDecision"("userId", "gateState");

CREATE INDEX "TeacherIntervention_teacherId_studentId_status_idx" ON "TeacherIntervention"("teacherId", "studentId", "status");

CREATE INDEX "EscalationEvent_userId_status_idx" ON "EscalationEvent"("userId", "status");

CREATE INDEX "LearningLoopAuditLog_userId_timestamp_idx" ON "LearningLoopAuditLog"("userId", "timestamp");
CREATE INDEX "LearningLoopAuditLog_actorType_action_idx" ON "LearningLoopAuditLog"("actorType", "action");

-- AddForeignKeys
ALTER TABLE "LearningEvidenceLog" ADD CONSTRAINT "LearningEvidenceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningEvidenceLog" ADD CONSTRAINT "LearningEvidenceLog_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonalizationDecision" ADD CONSTRAINT "PersonalizationDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonalizationDecision" ADD CONSTRAINT "PersonalizationDecision_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PolicyGateDecision" ADD CONSTRAINT "PolicyGateDecision_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "PersonalizationDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PolicyGateDecision" ADD CONSTRAINT "PolicyGateDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeacherIntervention" ADD CONSTRAINT "TeacherIntervention_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherIntervention" ADD CONSTRAINT "TeacherIntervention_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherIntervention" ADD CONSTRAINT "TeacherIntervention_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "PersonalizationDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscalationEvent" ADD CONSTRAINT "EscalationEvent_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LearningLoopAuditLog" ADD CONSTRAINT "LearningLoopAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
