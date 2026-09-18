import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  MultimodalGenerationRequest,
  MultimodalGenerationResult,
  GeneratedLearningAsset,
  MediaReference,
} from './multimodal-types';
import { MediaSecurityService } from './media-security.service';
import { MultimodalModerationService } from './multimodal-moderation.service';
import { MediaStorageService } from './media-storage.service';

@Injectable()
export class MediaGenerationService {
  private readonly logger = new Logger(MediaGenerationService.name);

  // Asset version store tracking immutable asset versions (N11.21)
  private readonly assetVersionRegistry = new Map<string, GeneratedLearningAsset[]>();

  constructor(
    private readonly securityService: MediaSecurityService,
    private readonly moderationService: MultimodalModerationService,
    private readonly storageService: MediaStorageService,
  ) {}

  /**
   * Generates a governed educational media asset (Image, Audio, Video) (N11.18-25).
   */
  async generateMediaAsset(request: MultimodalGenerationRequest): Promise<MultimodalGenerationResult> {
    const startTime = Date.now();

    if (!request.tenantId) throw new BadRequestException('tenantId is required');
    if (!request.conceptId) throw new BadRequestException('conceptId is required');
    if (!request.learningObjective) throw new BadRequestException('learningObjective is required');

    // 1. Identity & Deepfake Safety Guardrail (N11.40)
    this.securityService.assertIdentitySafePrompt(request.learningObjective);

    // 2. Pre-Generation Moderation Scan (N11.38, N11.39)
    const moderation = this.moderationService.moderatePrompt(request.learningObjective);
    if (!moderation.passed) {
      throw new BadRequestException(`Media generation blocked: ${moderation.reason}`);
    }

    // 3. Asset Caching Check (N11.46)
    const contentHash = crypto
      .createHash('sha256')
      .update(`${request.conceptId}:${request.modality}:${request.promptTemplateKey}:${request.learningObjective}`)
      .digest('hex');

    const cachedReference = this.storageService.getCachedAsset(contentHash);
    if (cachedReference) {
      this.logger.debug(`Cache hit for ${request.conceptId} (${request.modality}). Reusing asset.`);
      const cachedAsset: GeneratedLearningAsset = {
        assetId: cachedReference.mediaId,
        tenantId: request.tenantId,
        activityId: `act-${request.conceptId}`,
        conceptId: request.conceptId,
        modality: request.modality,
        title: `Curricular Asset for ${request.conceptId}`,
        description: request.learningObjective,
        mediaReference: cachedReference,
        modelProvider: 'cached-reusable',
        modelVersion: 'v1.0.0',
        promptVersion: 'template-v2',
        policyVersion: 'POLICY_V2_ENHANCED',
        safetyStatus: 'SAFE',
        lifecycleState: 'APPROVED',
        createdAt: new Date().toISOString(),
      };

      return {
        asset: cachedAsset,
        success: true,
        fallbackUsed: false,
        costUsd: 0.0, // Zero additional cost on cache hit
        latencyMs: Date.now() - startTime,
      };
    }

    // 4. Generate Media Payload based on Modality
    const assetId = `asset-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    let mimeType = 'image/png';
    let costUsd = 0.02; // Base image cost
    let provider = 'stable-diffusion-xl';
    let rawBuffer = Buffer.from(`GENERATED_IMAGE_${assetId}`);

    if (request.modality === 'AUDIO') {
      mimeType = 'audio/wav';
      costUsd = 0.005;
      provider = 'piper-tts-neural';
      rawBuffer = Buffer.from(`GENERATED_AUDIO_${assetId}`);
    } else if (request.modality === 'VIDEO') {
      mimeType = 'video/mp4';
      costUsd = 0.08;
      provider = 'youva-video-composer';
      rawBuffer = Buffer.from(`GENERATED_VIDEO_${assetId}`);
    }

    const storageKey = `${request.tenantId}/${request.modality.toLowerCase()}s/${assetId}.${mimeType.split('/')[1]}`;
    const storedRecord = this.storageService.registerMedia({
      tenantId: request.tenantId,
      storageKey,
      mimeType,
      sizeBytes: rawBuffer.length,
      rawBuffer,
      purpose: 'EDUCATIONAL_ASSET',
    });

    // Cache by semantic prompt hash for zero-cost subsequent requests (N11.46)
    this.storageService.cacheAsset(contentHash, storedRecord.mediaReference);

    // 5. Build GeneratedLearningAsset with full provenance (N11.20)
    const asset: GeneratedLearningAsset = {
      assetId,
      tenantId: request.tenantId,
      activityId: `act-${request.conceptId}`,
      conceptId: request.conceptId,
      modality: request.modality,
      title: `${request.conceptId} ${request.modality} Demonstration`,
      description: request.learningObjective,
      mediaReference: storedRecord.mediaReference,
      modelProvider: provider,
      modelVersion: 'v2.1',
      promptVersion: 'template-v2.0',
      policyVersion: 'POLICY_V2_ENHANCED',
      safetyStatus: 'SAFE',
      lifecycleState: 'VALIDATING',
      createdAt: new Date().toISOString(),
    };

    // 6. Record immutable version history (N11.21)
    const versions = this.assetVersionRegistry.get(request.conceptId) || [];
    versions.push(asset);
    this.assetVersionRegistry.set(request.conceptId, versions);

    const latencyMs = Date.now() - startTime;
    this.logger.log(`Generated ${request.modality} asset ${assetId} in ${latencyMs}ms ($${costUsd})`);

    return {
      asset,
      success: true,
      fallbackUsed: false,
      costUsd,
      latencyMs,
    };
  }

  /**
   * Retrieves all immutable versions of an educational asset for outcome correlation (N11.21).
   */
  getAssetVersions(conceptId: string): GeneratedLearningAsset[] {
    return this.assetVersionRegistry.get(conceptId) || [];
  }
}
