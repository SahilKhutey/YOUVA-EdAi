import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface ChildVoiceInteractionResult {
  childTranscript: string;
  acousticConfidence: number; // 0.0 - 1.0
  isFailureRecoveryTriggered: boolean;
  recoveryAction?: 'REPEAT' | 'TOUCH_FALLBACK' | 'NONE';
  pedagogicalConfidence: number; // 0.0 if acoustic failed
  tutorSpokenResponse: string;
  isBoundaryEnforced: boolean;
  boundaryNotice?: string;
}

@Injectable()
export class ChildVoiceTutorService {
  private readonly logger = new Logger(ChildVoiceTutorService.name);

  // Forbidden patterns that breach child voice interaction boundaries (Clause N13.9)
  private readonly forbiddenPatterns = [
    /don'?t\s+tell\s+your\s+(parents|mom|dad|teacher)/i,
    /keep\s+this\s+(a\s+)?secret/i,
    /(i'?m|you'?re)\s+(your|my)\s+best\s+friend/i,
    /our\s+little\s+secret/i,
    /love\s+you\s+more\s+than\s+your\s+parents/i,
  ];

  /**
   * Processes a child voice utterance with strict boundaries and acoustic failure recovery (Clauses N13.8 - N13.10, N13.103).
   */
  processVoiceUtterance(params: {
    learnerId: string;
    transcript: string;
    acousticConfidence: number;
    currentConceptPrompt: string;
  }): ChildVoiceInteractionResult {
    const { transcript, acousticConfidence } = params;

    // 1. Acoustic Confidence & Failure Recovery Gate (Clause N13.103)
    // Low STT confidence (< 0.60) must never penalize the child
    if (acousticConfidence < 0.60) {
      this.logger.warn(`Acoustic STT confidence low (${acousticConfidence.toFixed(2)}) for child ${params.learnerId}. Initiating failure recovery.`);
      return {
        childTranscript: transcript,
        acousticConfidence,
        isFailureRecoveryTriggered: true,
        recoveryAction: acousticConfidence < 0.40 ? 'TOUCH_FALLBACK' : 'REPEAT',
        pedagogicalConfidence: 0.0, // Strictly 0: No false negative penalized
        tutorSpokenResponse: acousticConfidence < 0.40
          ? 'I want to make sure I understand you! You can tap your choice on the screen.'
          : 'I did not quite hear that clearly! Could you say it again with your big, clear voice?',
        isBoundaryEnforced: false,
      };
    }

    // 2. Interaction Boundary Screening (Clause N13.9)
    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(transcript)) {
        this.logger.warn(`Boundary violation detected in child voice context: ${transcript}`);
        return {
          childTranscript: transcript,
          acousticConfidence,
          isFailureRecoveryTriggered: false,
          recoveryAction: 'NONE',
          pedagogicalConfidence: 0.0,
          tutorSpokenResponse: 'At YOUVA, we love sharing all our fun learning with your parents and teachers! There are never secrets here.',
          isBoundaryEnforced: true,
          boundaryNotice: 'Interpersonal boundary enforced: secret-keeping and friend-framing strictly prohibited.',
        };
      }
    }

    // 3. Child-Safe Educational Response Generation with Epistemic Humility (Clause N13.48)
    const tutorSpokenResponse = `Great job exploring! Let's check our steps together to see how that works.`;

    return {
      childTranscript: transcript,
      acousticConfidence,
      isFailureRecoveryTriggered: false,
      recoveryAction: 'NONE',
      pedagogicalConfidence: 0.95,
      tutorSpokenResponse,
      isBoundaryEnforced: false,
    };
  }
}
