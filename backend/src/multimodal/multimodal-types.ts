/**
 * YOUVA-EdAI — Cycle N11 Multimodal Learning & Generation Types
 * Authoritative TypeScript data contracts for Multimodal Gateway, Modality Router,
 * Speech Recognition, Speech Synthesis, Vision Analysis, and Media Governance.
 */

export type LearningModality =
  | 'TEXT'
  | 'IMAGE'
  | 'AUDIO'
  | 'VIDEO'
  | 'VOICE'
  | 'INTERACTIVE';

export type MediaLifecycleState =
  | 'CREATED'
  | 'VALIDATING'
  | 'MODERATING'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'DELETED'
  | 'QUARANTINED';

export type MultimodalFailureTaxonomy =
  | 'MEDIA_GENERATION_FAILURE'
  | 'MEDIA_VALIDATION_FAILURE'
  | 'MODERATION_FAILURE'
  | 'TRANSCRIPTION_FAILURE'
  | 'VISION_EXTRACTION_FAILURE'
  | 'ASSESSMENT_FAILURE'
  | 'PERSONALIZATION_FAILURE'
  | 'PROVIDER_FAILURE'
  | 'STORAGE_FAILURE'
  | 'DELIVERY_FAILURE';

export interface MediaReference {
  mediaId: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  signedUrl?: string;
  checksumSha256: string;
}

export interface MediaUploadValidationResult {
  valid: boolean;
  sanitizedKey: string;
  mimeType: string;
  sizeBytes: number;
  quarantined: boolean;
  rejectionReason?: string;
}

export interface SpeechRecognitionRequest {
  audioBuffer?: Buffer | string; // Base64 or binary
  mimeType: string;
  language?: string;
  learnerId: string;
  tenantId: string;
  activityId?: string;
  correlationId: string;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number; // 0.0 to 1.0 (acoustic speech certainty)
  language: string;
  durationMs: number;
  detectedIntent?: string;
  isUnclear: boolean;
}

export interface VoiceEvaluationResult {
  evaluatedAnswer: string;
  isCorrect: boolean;
  pedagogicalConfidence: number; // Distinct from speech-recognition confidence!
  speechConfidence: number;
  recoveryActionRequired?: 'REPEAT' | 'TEXT_FALLBACK' | 'SELECTABLE_OPTIONS';
  feedback: string;
}

export interface SpeechSynthesisRequest {
  text: string;
  language?: string;
  speed?: number; // 0.5 to 2.0
  voiceStyle?: 'NEUTRAL' | 'EXPLANATORY' | 'ENCOURAGING';
  learnerId?: string;
  tenantId: string;
  correlationId: string;
}

export interface SpeechSynthesisResult {
  audioBase64: string;
  mimeType: string;
  durationMs: number;
  captions: Array<{ startMs: number; endMs: number; text: string }>;
  transcript: string;
  sampleRate: number;
}

export interface VisionAnalysisRequest {
  learnerId: string;
  activityId: string;
  tenantId: string;
  purpose: 'WORKSHEET' | 'DIAGRAM' | 'LEARNING_OBJECT' | 'ANSWER_REVIEW';
  image: MediaReference;
  correlationId: string;
}

export interface VisionAnalysisResult {
  extractedText: string;
  handwritingDetected: boolean;
  equationsFound: string[];
  diagramLabels: string[];
  confidence: number; // 0.0 to 1.0
  misconceptionsDetected: string[];
  evaluationApproved: boolean; // Must be >= 0.75 confidence to update authoritative state
}

export interface GeneratedLearningAsset {
  assetId: string;
  tenantId: string;
  activityId: string;
  conceptId: string;
  modality: 'IMAGE' | 'AUDIO' | 'VIDEO';
  title: string;
  description: string;
  mediaReference: MediaReference;
  modelProvider: string;
  modelVersion: string;
  promptVersion: string;
  policyVersion: string;
  safetyStatus: 'SAFE' | 'FLAGGED' | 'MODERATED';
  lifecycleState: MediaLifecycleState;
  createdAt: string;
}

export interface MultimodalUnderstandingRequest {
  modality: 'VISION' | 'SPEECH';
  visionRequest?: VisionAnalysisRequest;
  speechRequest?: SpeechRecognitionRequest;
  correlationId: string;
}

export interface MultimodalUnderstandingResult {
  modality: 'VISION' | 'SPEECH';
  visionResult?: VisionAnalysisResult;
  speechResult?: SpeechRecognitionResult;
  success: boolean;
  latencyMs: number;
}

export interface MultimodalGenerationRequest {
  modality: 'IMAGE' | 'AUDIO' | 'VIDEO';
  conceptId: string;
  learningObjective: string;
  promptTemplateKey: string;
  learnerContext?: {
    masteryScore?: number;
    preferredModality?: LearningModality;
    errorPatterns?: string[];
  };
  tenantId: string;
  actorId: string;
  correlationId: string;
}

export interface MultimodalGenerationResult {
  asset: GeneratedLearningAsset;
  success: boolean;
  fallbackUsed: boolean;
  costUsd: number;
  latencyMs: number;
}

export interface ModalityEquivalenceOption {
  modality: LearningModality;
  title: string;
  description: string;
  estimatedDurationMin: number;
  assetReference?: MediaReference;
  accessibilityFeatures: string[]; // e.g. ['CAPTIONS', 'SCREEN_READER_SEMANTICS', 'REDUCED_MOTION']
}

export interface LearningActivity {
  id: string;
  conceptId: string;
  title: string;
  objective: string;
  primaryModality: LearningModality;
  difficulty: number; // 0.1 to 0.9
  equivalentOptions: ModalityEquivalenceOption[];
  requiresTeacherApproval: boolean;
}

export interface LearningExperience {
  id: string;
  conceptId: string;
  objective: string;
  activities: LearningActivity[];
  modalities: LearningModality[];
}

export interface ModalityRecommendationRequest {
  learnerId: string;
  tenantId: string;
  conceptId: string;
  learningObjective: string;
  learnerMastery: number;
  recentModalitySuccess?: Record<LearningModality, number>;
  accessibilityRequirements?: string[];
  isLowBandwidth?: boolean;
}

export interface ModalityRecommendationResponse {
  recommendedModality: LearningModality;
  confidence: number;
  rationale: string[];
  equivalentPaths: ModalityEquivalenceOption[];
  offlineCachedAvailable: boolean;
}

export interface TeacherMediaReviewRecord {
  id: string;
  assetId: string;
  tenantId: string;
  teacherId: string;
  status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  notes?: string;
  reviewedAt: string;
}

export interface MultimodalCostRecord {
  requestId: string;
  tenantId: string;
  modality: LearningModality;
  provider: string;
  model: string;
  costUsd: number;
  timestamp: string;
}

export interface TenantMediaBudget {
  tenantId: string;
  dailySpendLimitUsd: number;
  currentDailySpendUsd: number;
  monthlySpendLimitUsd: number;
  currentMonthlySpendUsd: number;
  generationAllowed: boolean;
}

export interface MultimodalFeatureFlags {
  VOICE_ENABLED: boolean;
  VISION_ENABLED: boolean;
  IMAGE_GENERATION_ENABLED: boolean;
  AUDIO_GENERATION_ENABLED: boolean;
  VIDEO_GENERATION_ENABLED: boolean;
  MULTIMODAL_TUTOR_ENABLED: boolean;
}

export interface MultimodalGateway {
  understand(request: MultimodalUnderstandingRequest): Promise<MultimodalUnderstandingResult>;
  generate(request: MultimodalGenerationRequest): Promise<MultimodalGenerationResult>;
  transcribe(request: SpeechRecognitionRequest): Promise<SpeechRecognitionResult>;
  synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResult>;
}
