export interface EvidenceTrust {
  provenance: number;
  integrity: number;
  completeness: number;
  consistency: number;
}

export interface ContentTrust {
  curriculumAlignment: number;
  safety: number;
  accessibility: number;
  teacherReview: number;
  effectiveness: number;
  provenance: number;
}
