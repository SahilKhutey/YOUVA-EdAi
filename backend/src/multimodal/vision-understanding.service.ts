import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { VisionAnalysisRequest, VisionAnalysisResult } from './multimodal-types';
import { MediaSecurityService } from './media-security.service';
import { MultimodalModerationService } from './multimodal-moderation.service';

@Injectable()
export class VisionUnderstandingService {
  private readonly logger = new Logger(VisionUnderstandingService.name);

  constructor(
    private readonly securityService: MediaSecurityService,
    private readonly moderationService: MultimodalModerationService,
  ) {}

  /**
   * Analyzes an educational image (worksheet photo, handwritten work, diagram) (N11.13-15).
   */
  async analyzeVision(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    if (!request.tenantId) throw new BadRequestException('tenantId is required');
    if (!request.learnerId) throw new BadRequestException('learnerId is required');
    if (!request.image || !request.image.mediaId) {
      throw new BadRequestException('Valid media reference is required');
    }

    // Verify tenant boundary isolation on storageKey (N11.16, N11.17)
    this.securityService.assertTenantMediaIsolation(request.image.storageKey, request.tenantId);

    // Simulated OCR extraction based on purpose
    let extractedText = '';
    let handwritingDetected = false;
    const equationsFound: string[] = [];
    const diagramLabels: string[] = [];
    let confidence = 0.85;
    const misconceptionsDetected: string[] = [];

    if (request.purpose === 'WORKSHEET' || request.purpose === 'ANSWER_REVIEW') {
      handwritingDetected = true;
      extractedText = 'Step 1: (3/4) * (2/5) = (3*2) / (4*5) = 6/20 = 3/10';
      equationsFound.push('(3/4) * (2/5) = 3/10');
      confidence = 0.88;
    } else if (request.purpose === 'DIAGRAM') {
      extractedText = 'Plant cell diagram showing Cell Wall, Cell Membrane, Chloroplast, and Nucleus';
      diagramLabels.push('Cell Wall', 'Cell Membrane', 'Chloroplast', 'Nucleus');
      confidence = 0.92;
    } else {
      extractedText = 'Standard Grade 8 science reference object';
      confidence = 0.70;
    }

    // Cross-modal prompt injection sanitization on extracted OCR text (N11.36-37)
    extractedText = this.securityService.sanitizeExternalText(extractedText, 'OCR');

    // Moderation scan on extracted text (N11.38)
    const moderation = this.moderationService.moderateIntermediateText(extractedText, 'VISION_OCR');
    if (!moderation.passed) {
      this.logger.warn(`Vision OCR flagged by moderation: ${moderation.reason}`);
      return {
        extractedText: '[CONTENT_MODERATED]',
        handwritingDetected,
        equationsFound: [],
        diagramLabels: [],
        confidence: 0.0,
        misconceptionsDetected: ['UNSAFE_IMAGE_CONTENT'],
        evaluationApproved: false,
      };
    }

    // Check confidence threshold: Vision extraction errors must NOT update mastery without validation (N11.15)
    const evaluationApproved = confidence >= 0.75;

    this.logger.debug(
      `Vision analysis complete for ${request.purpose}. Confidence: ${confidence}, Approved: ${evaluationApproved}`,
    );

    return {
      extractedText,
      handwritingDetected,
      equationsFound,
      diagramLabels,
      confidence,
      misconceptionsDetected,
      evaluationApproved,
    };
  }
}
