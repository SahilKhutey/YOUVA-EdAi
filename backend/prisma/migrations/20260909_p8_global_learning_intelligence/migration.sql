-- ============================================================================
-- Phase P8 Migration: Global AI Learning Network
-- ============================================================================

-- CreateTable: LearningConcept
CREATE TABLE "LearningConcept" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "domain" TEXT,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "metadataJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningConceptRelation
CREATE TABLE "LearningConceptRelation" (
    "id" TEXT NOT NULL,
    "fromConceptId" TEXT NOT NULL,
    "toConceptId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningConceptRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CurriculumAlignment
CREATE TABLE "CurriculumAlignment" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "curriculum" TEXT NOT NULL,
    "region" TEXT,
    "grade" TEXT,
    "code" TEXT,
    "source" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumAlignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LearningExperiment
CREATE TABLE "LearningExperiment" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "allocationJson" TEXT NOT NULL,
    "metricsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExperimentAssignment
CREATE TABLE "ExperimentAssignment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ExperimentObservation
CREATE TABLE "ExperimentObservation" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AIInteractionEvaluation
CREATE TABLE "AIInteractionEvaluation" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "evaluatorType" TEXT NOT NULL,
    "evaluatorId" TEXT,
    "correctness" DOUBLE PRECISION,
    "helpfulness" DOUBLE PRECISION,
    "safety" DOUBLE PRECISION,
    "ageAppropriate" DOUBLE PRECISION,
    "teacherAlignment" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInteractionEvaluation_pkey" PRIMARY KEY ("id")
);

-- Indexes & Unique Constraints: LearningConcept
CREATE UNIQUE INDEX "LearningConcept_canonicalKey_key" ON "LearningConcept"("canonicalKey");
CREATE INDEX "LearningConcept_subject_idx" ON "LearningConcept"("subject");
CREATE INDEX "LearningConcept_domain_idx" ON "LearningConcept"("domain");

-- Indexes & Unique Constraints: LearningConceptRelation
CREATE UNIQUE INDEX "LearningConceptRelation_fromConceptId_toConceptId_relationType_key" ON "LearningConceptRelation"("fromConceptId", "toConceptId", "relationType");
CREATE INDEX "LearningConceptRelation_fromConceptId_idx" ON "LearningConceptRelation"("fromConceptId");
CREATE INDEX "LearningConceptRelation_toConceptId_idx" ON "LearningConceptRelation"("toConceptId");

-- Indexes: CurriculumAlignment
CREATE INDEX "CurriculumAlignment_conceptId_idx" ON "CurriculumAlignment"("conceptId");
CREATE INDEX "CurriculumAlignment_curriculum_grade_idx" ON "CurriculumAlignment"("curriculum", "grade");

-- Indexes & Unique Constraints: LearningExperiment
CREATE UNIQUE INDEX "LearningExperiment_key_key" ON "LearningExperiment"("key");
CREATE INDEX "LearningExperiment_status_idx" ON "LearningExperiment"("status");

-- Indexes & Unique Constraints: ExperimentAssignment
CREATE UNIQUE INDEX "ExperimentAssignment_experimentId_subjectId_key" ON "ExperimentAssignment"("experimentId", "subjectId");
CREATE INDEX "ExperimentAssignment_subjectId_idx" ON "ExperimentAssignment"("subjectId");

-- Indexes: ExperimentObservation
CREATE INDEX "ExperimentObservation_experimentId_metric_idx" ON "ExperimentObservation"("experimentId", "metric");
CREATE INDEX "ExperimentObservation_subjectId_occurredAt_idx" ON "ExperimentObservation"("subjectId", "occurredAt");

-- Indexes: AIInteractionEvaluation
CREATE INDEX "AIInteractionEvaluation_interactionId_idx" ON "AIInteractionEvaluation"("interactionId");
CREATE INDEX "AIInteractionEvaluation_evaluatorType_idx" ON "AIInteractionEvaluation"("evaluatorType");

-- Foreign Key Constraints: LearningConceptRelation
ALTER TABLE "LearningConceptRelation" ADD CONSTRAINT "LearningConceptRelation_fromConceptId_fkey" FOREIGN KEY ("fromConceptId") REFERENCES "LearningConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningConceptRelation" ADD CONSTRAINT "LearningConceptRelation_toConceptId_fkey" FOREIGN KEY ("toConceptId") REFERENCES "LearningConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Key Constraints: CurriculumAlignment
ALTER TABLE "CurriculumAlignment" ADD CONSTRAINT "CurriculumAlignment_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "LearningConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Key Constraints: ExperimentAssignment
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "LearningExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Key Constraints: ExperimentObservation
ALTER TABLE "ExperimentObservation" ADD CONSTRAINT "ExperimentObservation_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "LearningExperiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
