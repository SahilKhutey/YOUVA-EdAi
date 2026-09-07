export interface RecordAITraceDto {
  requestId: string;
  tenantId: string;
  learnerId?: string;
  modelVersion: string;
  promptVersion: string;
  policyVersion: string;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
  contextRefs: string[];
  toolCalls?: Array<Record<string, unknown>>;
  action: string;
  decision: string;
}

export interface DecisionComparison {
  originalDecision: string;
  candidateDecision: string;
  actionChanged: boolean;
  safetyChanged: boolean;
  policyChanged: boolean;
  outcomePredictionChanged: boolean;
}
