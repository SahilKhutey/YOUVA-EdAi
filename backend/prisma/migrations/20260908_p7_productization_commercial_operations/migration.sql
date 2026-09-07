-- ============================================================================
-- Phase P7 Migration: Productization, Commercialization & Launch Operations
-- ============================================================================

-- CreateTable: CommercialProfile
CREATE TABLE "CommercialProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "onboardingVersion" TEXT NOT NULL DEFAULT 'v1',
    "onboardingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "acquisitionSource" TEXT,
    "referralCode" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BillingAccount
CREATE TABLE "BillingAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BillingEvent
CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "payload" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductEvent
CREATE TABLE "ProductEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "sessionId" TEXT,
    "eventName" TEXT NOT NULL,
    "properties" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SupportTicket
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductFeedback
CREATE TABLE "ProductFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "contextJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFeedback_pkey" PRIMARY KEY ("id")
);

-- Indexes & Unique Constraints: CommercialProfile
CREATE UNIQUE INDEX "CommercialProfile_userId_key" ON "CommercialProfile"("userId");
CREATE INDEX "CommercialProfile_onboardingStatus_idx" ON "CommercialProfile"("onboardingStatus");

-- Indexes & Unique Constraints: BillingAccount
CREATE UNIQUE INDEX "BillingAccount_userId_key" ON "BillingAccount"("userId");
CREATE UNIQUE INDEX "BillingAccount_stripeCustomerId_key" ON "BillingAccount"("stripeCustomerId");
CREATE UNIQUE INDEX "BillingAccount_stripeSubscriptionId_key" ON "BillingAccount"("stripeSubscriptionId");
CREATE INDEX "BillingAccount_userId_idx" ON "BillingAccount"("userId");

-- Indexes & Unique Constraints: BillingEvent
CREATE UNIQUE INDEX "BillingEvent_providerEventId_key" ON "BillingEvent"("providerEventId");
CREATE INDEX "BillingEvent_userId_idx" ON "BillingEvent"("userId");
CREATE INDEX "BillingEvent_eventType_idx" ON "BillingEvent"("eventType");
CREATE INDEX "BillingEvent_processed_idx" ON "BillingEvent"("processed");

-- Indexes: ProductEvent
CREATE INDEX "ProductEvent_userId_occurredAt_idx" ON "ProductEvent"("userId", "occurredAt");
CREATE INDEX "ProductEvent_tenantId_occurredAt_idx" ON "ProductEvent"("tenantId", "occurredAt");
CREATE INDEX "ProductEvent_eventName_occurredAt_idx" ON "ProductEvent"("eventName", "occurredAt");

-- Indexes: SupportTicket
CREATE INDEX "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");
CREATE INDEX "SupportTicket_priority_status_idx" ON "SupportTicket"("priority", "status");

-- Indexes: ProductFeedback
CREATE INDEX "ProductFeedback_userId_createdAt_idx" ON "ProductFeedback"("userId", "createdAt");
CREATE INDEX "ProductFeedback_category_createdAt_idx" ON "ProductFeedback"("category", "createdAt");
