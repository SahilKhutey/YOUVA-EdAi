import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  MultimodalGateway,
  MultimodalUnderstandingRequest,
  MultimodalUnderstandingResult,
  MultimodalGenerationRequest,
  MultimodalGenerationResult,
  SpeechRecognitionRequest,
  SpeechRecognitionResult,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
} from './multimodal-types';
import { SpeechRecognitionService } from './speech-recognition.service';
import { SpeechSynthesisService } from './speech-synthesis.service';
import { VisionUnderstandingService } from './vision-understanding.service';
import { MediaGenerationService } from './media-generation.service';
import { MultimodalFinopsService } from './multimodal-finops.service';

@Injectable()
export class MultimodalGatewayService implements MultimodalGateway {
  private readonly logger = new Logger(MultimodalGatewayService.name);

  // Simulated provider availability flags for outage/fallback testing (N11.68)
  private speechProviderAvailable = true;
  private visionProviderAvailable = true;
  private generationProviderAvailable = true;

  constructor(
    private readonly speechRecognition: SpeechRecognitionService,
    private readonly speechSynthesis: SpeechSynthesisService,
    private readonly visionUnderstanding: VisionUnderstandingService,
    private readonly mediaGeneration: MediaGenerationService,
    private readonly finopsService: MultimodalFinopsService,
  ) {}

  /**
   * Multimodal Understanding: Routes speech or vision requests through safe abstraction (N11.4).
   */
  async understand(request: MultimodalUnderstandingRequest): Promise<MultimodalUnderstandingResult> {
    const startTime = Date.now();

    if (request.modality === 'SPEECH' && request.speechRequest) {
      if (!this.speechProviderAvailable) {
        // Graceful fallback on STT outage (N11.52)
        this.logger.warn('Speech provider unavailable: engaging fallback');
        return {
          modality: 'SPEECH',
          speechResult: {
            transcript: '',
            confidence: 0.0,
            language: 'en-IN',
            durationMs: 0,
            isUnclear: true,
          },
          success: false,
          latencyMs: Date.now() - startTime,
        };
      }

      const speechResult = await this.speechRecognition.transcribeAudio(request.speechRequest);
      return {
        modality: 'SPEECH',
        speechResult,
        success: true,
        latencyMs: Date.now() - startTime,
      };
    } else if (request.modality === 'VISION' && request.visionRequest) {
      if (!this.visionProviderAvailable) {
        // Graceful fallback on vision outage (N11.52)
        this.logger.warn('Vision provider unavailable: engaging fallback');
        return {
          modality: 'VISION',
          visionResult: {
            extractedText: '',
            handwritingDetected: false,
            equationsFound: [],
            diagramLabels: [],
            confidence: 0.0,
            misconceptionsDetected: [],
            evaluationApproved: false,
          },
          success: false,
          latencyMs: Date.now() - startTime,
        };
      }

      const visionResult = await this.visionUnderstanding.analyzeVision(request.visionRequest);
      return {
        modality: 'VISION',
        visionResult,
        success: true,
        latencyMs: Date.now() - startTime,
      };
    }

    throw new BadRequestException('Invalid MultimodalUnderstandingRequest');
  }

  /**
   * Multimodal Generation: Governed generation with FinOps budget checks (N11.4, N11.44).
   */
  async generate(request: MultimodalGenerationRequest): Promise<MultimodalGenerationResult> {
    const startTime = Date.now();

    // 1. FinOps budget check
    const estimatedCost = request.modality === 'VIDEO' ? 0.08 : request.modality === 'IMAGE' ? 0.02 : 0.005;
    const budgetCheck = this.finopsService.checkBudgetCeiling(request.tenantId, estimatedCost);
    if (!budgetCheck.allowed) {
      this.logger.warn(`Tenant budget exhausted: engaging deterministic fallback asset`);
      // Return fallback cached asset with zero cost
      return {
        asset: {
          assetId: `fallback-asset-${request.conceptId}`,
          tenantId: request.tenantId,
          activityId: `act-${request.conceptId}`,
          conceptId: request.conceptId,
          modality: 'IMAGE',
          title: `${request.conceptId} Standard Reference Diagram`,
          description: request.learningObjective,
          mediaReference: {
            mediaId: `med-fallback-${request.conceptId}`,
            storageKey: `${request.tenantId}/images/fallback.png`,
            mimeType: 'image/png',
            sizeBytes: 1024,
            checksumSha256: 'fallback-sha256',
          },
          modelProvider: 'deterministic-fallback',
          modelVersion: 'v1.0',
          promptVersion: 'fallback',
          policyVersion: 'POLICY_V2_ENHANCED',
          safetyStatus: 'SAFE',
          lifecycleState: 'APPROVED',
          createdAt: new Date().toISOString(),
        },
        success: true,
        fallbackUsed: true,
        costUsd: 0.0,
        latencyMs: Date.now() - startTime,
      };
    }

    // 2. Provider availability check
    if (!this.generationProviderAvailable) {
      return {
        asset: {
          assetId: `offline-fallback-${request.conceptId}`,
          tenantId: request.tenantId,
          activityId: `act-${request.conceptId}`,
          conceptId: request.conceptId,
          modality: 'IMAGE',
          title: `${request.conceptId} Offline Reference`,
          description: request.learningObjective,
          mediaReference: {
            mediaId: `med-offline-${request.conceptId}`,
            storageKey: `${request.tenantId}/images/offline.png`,
            mimeType: 'image/png',
            sizeBytes: 512,
            checksumSha256: 'offline-sha256',
          },
          modelProvider: 'offline-cache',
          modelVersion: 'v1.0',
          promptVersion: 'fallback',
          policyVersion: 'POLICY_V2_ENHANCED',
          safetyStatus: 'SAFE',
          lifecycleState: 'APPROVED',
          createdAt: new Date().toISOString(),
        },
        success: true,
        fallbackUsed: true,
        costUsd: 0.0,
        latencyMs: Date.now() - startTime,
      };
    }

    const genResult = await this.mediaGeneration.generateMediaAsset(request);

    // Record FinOps cost
    this.finopsService.recordCost({
      requestId: `gen-${Date.now()}`,
      tenantId: request.tenantId,
      modality: request.modality,
      provider: genResult.asset.modelProvider,
      model: genResult.asset.modelVersion,
      costUsd: genResult.costUsd,
    });

    return genResult;
  }

  /**
   * Direct Speech-to-text Transcription (N11.4).
   */
  async transcribe(request: SpeechRecognitionRequest): Promise<SpeechRecognitionResult> {
    return this.speechRecognition.transcribeAudio(request);
  }

  /**
   * Direct Speech Synthesis (N11.4).
   */
  async synthesize(request: SpeechSynthesisRequest): Promise<SpeechSynthesisResult> {
    return this.speechSynthesis.synthesizeSpeech(request);
  }

  /**
   * Testing hook to simulate provider outages for resilience verification (N11.68).
   */
  setProviderAvailability(provider: 'SPEECH' | 'VISION' | 'GENERATION', available: boolean): void {
    if (provider === 'SPEECH') this.speechProviderAvailable = available;
    if (provider === 'VISION') this.visionProviderAvailable = available;
    if (provider === 'GENERATION') this.generationProviderAvailable = available;
  }

  /**
   * Checks current availability status of provider abstraction.
   */
  isProviderAvailable(provider: 'SPEECH' | 'VISION' | 'GENERATION'): boolean {
    if (provider === 'SPEECH') return this.speechProviderAvailable;
    if (provider === 'VISION') return this.visionProviderAvailable;
    if (provider === 'GENERATION') return this.generationProviderAvailable;
    return false;
  }
}
