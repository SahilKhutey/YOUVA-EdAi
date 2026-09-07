export interface LearningSystemTwin {
  generatedAt: string;

  platform: {
    activeLearners: number;
    activeTeachers: number;
    activeInstitutions: number;
  };

  learning: {
    averageMastery: number;
    completionRate: number;
    interventionRate: number;
  };

  ai: {
    activeModels: number;
    safetyScore: number;
    averageLatencyMs: number;
  };

  operations: {
    failedJobs: number;
    queueLagSeconds: number;
    errorRate: number;
  };

  experiments: {
    active: number;
    blocked: number;
  };
}
