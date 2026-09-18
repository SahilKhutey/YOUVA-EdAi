import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  LearningModality,
  MultimodalFeatureFlags,
  LearningExperience,
  LearningActivity,
} from './multimodal-types';
import { ModalityRouterService } from './modality-router.service';
import { MultimodalGatewayService } from './multimodal-gateway.service';

export interface MultimodalTutorSession {
  sessionId: string;
  learnerId: string;
  tenantId: string;
  conceptId: string;
  learningObjective: string;
  activeModality: LearningModality;
  masteryScore: number;
  recentAttempts: Array<{ attemptId: string; correct: boolean; modality: LearningModality; timestamp: string }>;
  experience: LearningExperience;
  createdAt: string;
}

@Injectable()
export class MultimodalTutorService {
  private readonly logger = new Logger(MultimodalTutorService.name);

  // Active in-memory tutor sessions
  private readonly activeSessions = new Map<string, MultimodalTutorSession>();

  // Global & tenant feature flags (N11.70)
  private featureFlags: MultimodalFeatureFlags = {
    VOICE_ENABLED: true,
    VISION_ENABLED: true,
    IMAGE_GENERATION_ENABLED: true,
    AUDIO_GENERATION_ENABLED: true,
    VIDEO_GENERATION_ENABLED: true,
    MULTIMODAL_TUTOR_ENABLED: true,
  };

  constructor(
    private readonly modalityRouter: ModalityRouterService,
    private readonly gateway: MultimodalGatewayService,
  ) {}

  /**
   * Initializes a new multimodal tutor session for a learner (N11.7, N11.27).
   */
  startTutorSession(params: {
    learnerId: string;
    tenantId: string;
    conceptId: string;
    learningObjective: string;
    initialMastery: number;
    preferredModality?: LearningModality;
  }): MultimodalTutorSession {
    if (!this.featureFlags.MULTIMODAL_TUTOR_ENABLED) {
      throw new ForbiddenException('Multimodal Tutor is currently disabled by operational feature flag.');
    }

    const sessionId = `mm-sess-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Determine initial recommended modality
    const rec = this.modalityRouter.recommendModality({
      learnerId: params.learnerId,
      tenantId: params.tenantId,
      conceptId: params.conceptId,
      learningObjective: params.learningObjective,
      learnerMastery: params.initialMastery,
    });

    const activeModality = params.preferredModality || rec.recommendedModality;

    const activity: LearningActivity = {
      id: `act-${params.conceptId}-01`,
      conceptId: params.conceptId,
      title: `${params.conceptId} Interactive Study`,
      objective: params.learningObjective,
      primaryModality: activeModality,
      difficulty: 0.5,
      equivalentOptions: rec.equivalentPaths,
      requiresTeacherApproval: false,
    };

    const experience: LearningExperience = {
      id: `exp-${params.conceptId}`,
      conceptId: params.conceptId,
      objective: params.learningObjective,
      activities: [activity],
      modalities: ['TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'VOICE', 'INTERACTIVE'],
    };

    const session: MultimodalTutorSession = {
      sessionId,
      learnerId: params.learnerId,
      tenantId: params.tenantId,
      conceptId: params.conceptId,
      learningObjective: params.learningObjective,
      activeModality,
      masteryScore: params.initialMastery,
      recentAttempts: [],
      experience,
      createdAt: new Date().toISOString(),
    };

    this.activeSessions.set(sessionId, session);
    this.logger.log(`Initialized Multimodal Tutor session ${sessionId} for ${params.learnerId} in modality ${activeModality}`);

    return session;
  }

  /**
   * Switches learner's active modality mid-session while strictly preserving
   * the learning objective and authoritative session state (N11.55).
   */
  switchModality(sessionId: string, newModality: LearningModality): MultimodalTutorSession {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new BadRequestException(`Session [${sessionId}] not found`);

    // Verify feature flag for requested modality (N11.70)
    if (newModality === 'VOICE' && !this.featureFlags.VOICE_ENABLED) {
      throw new ForbiddenException('Voice modality is currently disabled.');
    }
    if (newModality === 'VIDEO' && !this.featureFlags.VIDEO_GENERATION_ENABLED) {
      throw new ForbiddenException('Video modality is currently disabled.');
    }

    const previousModality = session.activeModality;
    session.activeModality = newModality;

    this.logger.log(`Switched session ${sessionId} modality: ${previousModality} -> ${newModality}`);
    return session;
  }

  /**
   * Records learner attempt in multimodal session with context minimization (N11.34-35).
   */
  recordAttempt(sessionId: string, correct: boolean): MultimodalTutorSession {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new BadRequestException(`Session [${sessionId}] not found`);

    session.recentAttempts.push({
      attemptId: `att-${Date.now()}`,
      correct,
      modality: session.activeModality,
      timestamp: new Date().toISOString(),
    });

    // Context minimization: keep only the last 5 attempts in session memory (N11.35)
    if (session.recentAttempts.length > 5) {
      session.recentAttempts = session.recentAttempts.slice(-5);
    }

    // Update session mastery
    if (correct) {
      session.masteryScore = Math.min(1.0, Math.round((session.masteryScore + 0.10) * 100) / 100);
    } else {
      session.masteryScore = Math.max(0.0, Math.round((session.masteryScore - 0.05) * 100) / 100);
    }

    return session;
  }

  /**
   * Retrieves active session by ID.
   */
  getSession(sessionId: string): MultimodalTutorSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Updates feature flags (N11.70).
   */
  setFeatureFlags(flags: Partial<MultimodalFeatureFlags>): MultimodalFeatureFlags {
    this.featureFlags = { ...this.featureFlags, ...flags };
    this.logger.log(`Updated multimodal feature flags: ${JSON.stringify(this.featureFlags)}`);
    return this.featureFlags;
  }

  getFeatureFlags(): MultimodalFeatureFlags {
    return { ...this.featureFlags };
  }
}
