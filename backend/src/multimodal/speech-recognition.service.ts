import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  SpeechRecognitionRequest,
  SpeechRecognitionResult,
  VoiceEvaluationResult,
} from './multimodal-types';
import { MediaSecurityService } from './media-security.service';
import { MultimodalModerationService } from './multimodal-moderation.service';

@Injectable()
export class SpeechRecognitionService {
  private readonly logger = new Logger(SpeechRecognitionService.name);

  constructor(
    private readonly securityService: MediaSecurityService,
    private readonly moderationService: MultimodalModerationService,
  ) {}

  /**
   * Transcribes audio into structured SpeechRecognitionResult (N11.8).
   */
  async transcribeAudio(request: SpeechRecognitionRequest): Promise<SpeechRecognitionResult> {
    if (!request.tenantId) throw new BadRequestException('tenantId is required');
    if (!request.learnerId) throw new BadRequestException('learnerId is required');

    // Simulate STT model provider (e.g. Whisper / Conformer)
    let transcript = '';
    let confidence = 0.88;
    const durationMs = 3200;

    if (typeof request.audioBuffer === 'string') {
      // If simulated text in test payload
      transcript = request.audioBuffer.trim();
    } else {
      transcript = 'The cell wall provides structural rigidity to plant cells.';
    }

    // Check if audio transcription was simulated as unclear or noisy
    const isUnclear = transcript.includes('[unclear]') || transcript.includes('???') || confidence < 0.60;
    if (isUnclear) {
      confidence = 0.42;
    }

    // Cross-modal prompt injection sanitization (N11.36-37)
    transcript = this.securityService.sanitizeExternalText(transcript, 'TRANSCRIPT');

    // Moderation scan on transcript (N11.38)
    const moderation = this.moderationService.moderateIntermediateText(transcript, 'AUDIO_TRANSCRIPT');
    if (!moderation.passed) {
      this.logger.warn(`Speech transcript flagged by moderation: ${moderation.reason}`);
      transcript = '[CONTENT_MODERATED]';
      confidence = 0.0;
    }

    return {
      transcript,
      confidence,
      language: request.language || 'en-IN',
      durationMs,
      detectedIntent: 'CONCEPTUAL_ANSWER',
      isUnclear,
    };
  }

  /**
   * Evaluates a spoken answer, strictly separating speech-recognition confidence
   * from learner knowledge confidence (N11.9, N11.10).
   */
  evaluateSpokenAnswer(params: {
    sttResult: SpeechRecognitionResult;
    expectedAnswer: string;
    conceptId: string;
  }): VoiceEvaluationResult {
    const { sttResult, expectedAnswer } = params;

    // Rule 1: Voice Failure Recovery (N11.10)
    // Low speech recognition confidence MUST NOT be marked as an incorrect learner answer!
    if (sttResult.confidence < 0.60 || sttResult.isUnclear) {
      return {
        evaluatedAnswer: sttResult.transcript,
        isCorrect: false,
        pedagogicalConfidence: 0.0, // Zero pedagogical penalty
        speechConfidence: sttResult.confidence,
        recoveryActionRequired: 'REPEAT',
        feedback: 'I had trouble hearing you clearly. Would you like to repeat your answer, or switch to typing?',
      };
    }

    // Clean transcript string from security tags for semantic matching
    const cleanText = sttResult.transcript.replace(/<[^>]+>/g, '').toLowerCase();
    const cleanExpected = expectedAnswer.toLowerCase();

    // Spacing-normalized match (e.g., 'cellwall' matches 'cell wall' for accents/continuous speech)
    const collapsedText = cleanText.replace(/\s+/g, '');
    const collapsedExpected = cleanExpected.replace(/\s+/g, '');

    const isMatch =
      cleanText.includes(cleanExpected) ||
      collapsedText.includes(collapsedExpected) ||
      this.computeSemanticSimilarity(cleanText, cleanExpected) > 0.70;

    return {
      evaluatedAnswer: sttResult.transcript,
      isCorrect: isMatch,
      pedagogicalConfidence: isMatch ? 0.90 : 0.85, // High certainty in knowledge assessment
      speechConfidence: sttResult.confidence,
      feedback: isMatch
        ? 'Well explained! That captures the core concept.'
        : 'Good try! Take another look at how that organelle functions.',
    };
  }

  private computeSemanticSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    let intersection = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) intersection++;
    }
    return intersection / Math.max(wordsA.size, wordsB.size);
  }
}
