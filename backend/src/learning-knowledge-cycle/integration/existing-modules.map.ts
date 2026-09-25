/**
 * YOUVA-EdAI: Existing Module Integration Map (LKC-0)
 * 
 * Provides concrete mappings between the canonical LKC-0 contracts and
 * the existing repository modules in SahilKhutey/YOUVA-EdAi.
 */

export interface ModuleIntegrationMapping {
  existingModulePath: string;
  existingModelsOrServices: string[];
  canonicalContractRole: string;
  lkc0Touchpoint: string;
  futureMigrationAction: string;
}

export const EXISTING_MODULES_INTEGRATION_MAP: Record<string, ModuleIntegrationMapping> = {
  KNOWLEDGE_GRAPH: {
    existingModulePath: 'backend/src/knowledge-graph/',
    existingModelsOrServices: ['KnowledgeGraphService', 'SkillNode', 'SkillEdge'],
    canonicalContractRole: 'Graph Representation & Topological Sort',
    lkc0Touchpoint: 'Consumes KnowledgeRelationship (PREREQUISITE, BUILDS_ON, RELATED_TO)',
    futureMigrationAction: 'Map SkillNode.name to KnowledgeObject.slug and canonical ID in LKC-1.',
  },
  VERIFIED_LEARNING_KNOWLEDGE: {
    existingModulePath: 'backend/src/verified-learning/knowledge/',
    existingModelsOrServices: ['KnowledgeService', 'VerifiedLearningKnowledge', 'KnowledgeContribution'],
    canonicalContractRole: 'Empirical Pedagogical Claims & Cross-Tenant Findings',
    lkc0Touchpoint: 'Distinct: Stores verified research claims (e.g. effect size), not curriculum content.',
    futureMigrationAction: 'Retain as research claims engine; link claims to KnowledgeObject.id as evidence.',
  },
  LEARNING_LOOP: {
    existingModulePath: 'backend/src/learning-loop/',
    existingModelsOrServices: [
      'EvidenceProcessorService',
      'LearningEvidenceLog',
      'PersonalizationDecision',
      'PolicyGateDecision',
      'TeacherInterventionService',
    ],
    canonicalContractRole: 'Evidence Ingestion, Policy Gating & Human-in-the-Loop Interventions',
    lkc0Touchpoint: 'Consumes KnowledgeLearningEvent from EvidenceBoundary',
    futureMigrationAction: 'Ensure LearningEvidenceLog.knowledgeId maps directly to KnowledgeObject.id.',
  },
  LEARNER_STATE: {
    existingModulePath: 'backend/src/learner-state/',
    existingModelsOrServices: ['LearnerStateService', 'UserTopicMastery', 'CognitiveStateLog'],
    canonicalContractRole: 'Probabilistic Mastery Modeling (BKT) & Cognitive State Vectors',
    lkc0Touchpoint: 'Consumes evidence to update Layer B mastery state without mutating Layer A knowledge.',
    futureMigrationAction: 'Introduce LearnerKnowledgeMastery keyed by (learnerId, knowledgeObjectId).',
  },
  CONTENT_INTELLIGENCE: {
    existingModulePath: 'backend/src/content-intelligence/',
    existingModelsOrServices: ['ContentIntelligenceService', 'SearchService', 'VectorEmbeddings'],
    canonicalContractRole: 'Semantic Search, Indexing & Readability Analysis',
    lkc0Touchpoint: 'Implements ISearchBoundary, returning canonical Knowledge IDs.',
    futureMigrationAction: 'Index KnowledgeVersion.content alongside KnowledgeObject metadata.',
  },
  TEACHER_OPS: {
    existingModulePath: 'backend/src/teacher-ops/',
    existingModelsOrServices: ['TeacherClass', 'ContentAssignment', 'TeacherStudentAssignment'],
    canonicalContractRole: 'Classroom Delivery, Assignments & Cohort Monitoring',
    lkc0Touchpoint: 'Consumes Teacher API contracts (/teacher/knowledge/*) for curriculum assignment.',
    futureMigrationAction: 'Map ContentAssignment.contentId to KnowledgeObject.id.',
  },
};
