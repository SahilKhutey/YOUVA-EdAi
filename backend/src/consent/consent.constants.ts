export enum ConsentType {
  LEARNING_SERVICE = 'LEARNING_SERVICE',
  AI_ASSISTANCE = 'AI_ASSISTANCE',
  PERSONALIZATION = 'PERSONALIZATION',
  PARENT_PROGRESS_VISIBILITY = 'PARENT_PROGRESS_VISIBILITY',
  COMMUNICATION = 'COMMUNICATION',
  OPTIONAL_ANALYTICS = 'OPTIONAL_ANALYTICS',
}

export const VALID_CONSENT_TYPES = Object.values(ConsentType);

export const CONSENT_DESCRIPTIONS: Record<ConsentType, { title: string; description: string; required: boolean }> = {
  [ConsentType.LEARNING_SERVICE]: {
    title: 'Core Learning Service',
    description: 'Enables child profile creation, curriculum tracking, and course progress logging.',
    required: true,
  },
  [ConsentType.AI_ASSISTANCE]: {
    title: 'AI Tutoring & Guidance',
    description: 'Allows our safety-gated AI mentor to generate age-appropriate explanations and hints.',
    required: false,
  },
  [ConsentType.PERSONALIZATION]: {
    title: 'Adaptive Learning Path',
    description: 'Adjusts question difficulty, pacing, and review intervals based on Bayesian Knowledge Tracing.',
    required: false,
  },
  [ConsentType.PARENT_PROGRESS_VISIBILITY]: {
    title: 'Parent Progress Dashboard',
    description: 'Gives verified parents and guardians real-time visibility into streaks, mastery, and milestones.',
    required: true,
  },
  [ConsentType.COMMUNICATION]: {
    title: 'Teacher & School Messaging',
    description: 'Enables moderated parent-teacher communications and milestone announcements.',
    required: false,
  },
  [ConsentType.OPTIONAL_ANALYTICS]: {
    title: 'Aggregated Learning Research',
    description: 'Allows anonymized learning telemetry to help our educational researchers improve curriculum models.',
    required: false,
  },
};
