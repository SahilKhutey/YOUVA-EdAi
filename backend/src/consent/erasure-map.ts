/**
 * Every table that stores a student/user/teacher id must be classified here. A test reads the
 * Prisma schema and fails if a new such table is added without being classified, so that
 * "withdraw and erase" cannot silently miss new student data.
 */
export type Field = 'userId' | 'studentId';
export interface TableRule { model: string; field: Field }

/** Deleted on erasure (rows for the student). Order matters: children before parents. */
export const ERASED: TableRule[] = [
  { model: 'TeacherIntervention', field: 'studentId' },
  { model: 'TeacherStudentAssignment', field: 'studentId' },
  { model: 'TeacherClassEnrollment', field: 'studentId' },
  { model: 'UserTopicMastery', field: 'userId' },
  { model: 'MistakeLog', field: 'userId' },
  { model: 'StudyGoal', field: 'userId' },
  { model: 'UserBadge', field: 'userId' },
  { model: 'UserStats', field: 'userId' },
  { model: 'Notification', field: 'userId' },
  // UserAnswer rows are deleted through the student's PracticeSessions, then the sessions themselves:
  { model: 'PracticeSession', field: 'userId' },
];

/** Not written by the MVP flows. If any rows exist for the student, erasure STOPS and lists them for manual handling. */
export const MANUAL_CHECK: TableRule[] = [
  { model: 'PostVote', field: 'userId' }, { model: 'LearningSession', field: 'userId' },
  { model: 'Subscription', field: 'userId' }, { model: 'AssessmentSession', field: 'userId' },
  { model: 'EngagementLog', field: 'userId' }, { model: 'StudySession', field: 'userId' },
  { model: 'CognitiveProfile', field: 'userId' }, { model: 'SkillCredential', field: 'userId' },
  { model: 'AssessmentProject', field: 'userId' }, { model: 'UserSkillNode', field: 'userId' },
  { model: 'UserSkillEdge', field: 'userId' }, { model: 'CognitiveStateLog', field: 'userId' },
  { model: 'DigitalClassroomSession', field: 'studentId' }, { model: 'WorksheetSubmission', field: 'studentId' },
  { model: 'Feedback', field: 'userId' }, { model: 'LearningEvidenceLog', field: 'userId' },
  { model: 'PersonalizationDecision', field: 'userId' }, { model: 'PolicyGateDecision', field: 'userId' },
  { model: 'EscalationEvent', field: 'userId' }, { model: 'LearningLoopAuditLog', field: 'userId' },
  { model: 'ContentAssignment', field: 'studentId' },
];

/** Kept on purpose: proof of consent/withdrawal, with no link to the erased learning data. */
export const RETAINED = ['ConsentRecord'];

/** Authored by teachers (their id is a teacher id), not student data. */
export const TEACHER_OWNED = ['GeneratedContent', 'LessonPlan', 'Worksheet', 'TeacherClass'];

export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
