export const P8EventTypes = {
  CONCEPT_MASTERY_CONFIRMED: 'learning.concept.mastery.confirmed',
  CURRICULUM_ALIGNMENT_CREATED: 'curriculum.alignment.created',
  AI_MODEL_EVALUATED: 'ai.model.evaluated',
  AI_MODEL_PROMOTED: 'ai.model.promoted',
  AI_MODEL_ROLLED_BACK: 'ai.model.rolled_back',
  EXPERIMENT_ASSIGNED: 'experiment.assigned',
  EXPERIMENT_OBSERVATION_RECORDED: 'experiment.observation.recorded',
  CONTENT_VERSION_PUBLISHED: 'content.version.published',
  OFFLINE_PACKAGE_CREATED: 'offline.package.created',
  OFFLINE_EVIDENCE_SYNCED: 'offline.evidence.synced',
} as const;

export enum ConceptRelationType {
  PREREQUISITE = 'PREREQUISITE',
  RELATED = 'RELATED',
  PART_OF = 'PART_OF',
  COMMON_MISCONCEPTION = 'COMMON_MISCONCEPTION',
  EXTENSION = 'EXTENSION',
  REMEDIATION = 'REMEDIATION',
}

export type AgeTier = 'KIDS' | 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL';
