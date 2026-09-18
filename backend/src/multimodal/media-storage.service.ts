import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { MediaReference, MediaLifecycleState } from './multimodal-types';

export interface StoredMediaRecord {
  mediaReference: MediaReference;
  tenantId: string;
  learnerId?: string;
  lifecycleState: MediaLifecycleState;
  purpose: 'WORKSHEET' | 'LEARNER_RECORDING' | 'EDUCATIONAL_ASSET' | 'MODERATION_SAMPLE';
  expiresAt?: string; // ISO string for automated retention cleanup
  createdAt: string;
  quarantineReason?: string;
}

@Injectable()
export class MediaStorageService {
  private readonly logger = new Logger(MediaStorageService.name);

  // In-memory media store (abstracted object storage)
  private readonly mediaStore = new Map<string, StoredMediaRecord>();

  // Content-addressable cache for reusable educational assets (SHA-256 -> MediaReference)
  private readonly assetCache = new Map<string, MediaReference>();

  /**
   * Registers a newly uploaded or generated media asset in the CREATED state (N11.48).
   */
  registerMedia(params: {
    tenantId: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    rawBuffer: Buffer;
    purpose: 'WORKSHEET' | 'LEARNER_RECORDING' | 'EDUCATIONAL_ASSET' | 'MODERATION_SAMPLE';
    learnerId?: string;
  }): StoredMediaRecord {
    const checksumSha256 = crypto.createHash('sha256').update(params.rawBuffer).digest('hex');
    const mediaId = `med-${crypto.randomUUID()}`;

    // Retention duration assignment (N11.49)
    let expiresAt: string | undefined;
    const now = Date.now();
    if (params.purpose === 'WORKSHEET') {
      expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    } else if (params.purpose === 'LEARNER_RECORDING') {
      expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    }

    const mediaReference: MediaReference = {
      mediaId,
      storageKey: params.storageKey,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      checksumSha256,
      signedUrl: this.generateSignedUrl(params.storageKey, 900), // Default 15 min expiration
    };

    const record: StoredMediaRecord = {
      mediaReference,
      tenantId: params.tenantId,
      learnerId: params.learnerId,
      lifecycleState: 'CREATED',
      purpose: params.purpose,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    this.mediaStore.set(mediaId, record);

    // Cache reusable educational assets
    if (params.purpose === 'EDUCATIONAL_ASSET') {
      this.assetCache.set(checksumSha256, mediaReference);
    }

    this.logger.debug(`Registered media ${mediaId} (${params.mimeType}) for tenant ${params.tenantId}`);
    return record;
  }

  /**
   * Transitions the media lifecycle state according to strict operational workflow.
   */
  transitionState(
    mediaId: string,
    nextState: MediaLifecycleState,
    quarantineReason?: string,
  ): StoredMediaRecord {
    const record = this.mediaStore.get(mediaId);
    if (!record) {
      throw new NotFoundException(`Media record [${mediaId}] not found.`);
    }

    record.lifecycleState = nextState;
    if (nextState === 'QUARANTINED') {
      record.quarantineReason = quarantineReason || 'Automated safety/security flag';
      this.logger.warn(`Media [${mediaId}] quarantined: ${record.quarantineReason}`);
    }

    this.mediaStore.set(mediaId, record);
    return record;
  }

  /**
   * Generates a time-bound cryptographically signed access URL (N11.47).
   */
  generateSignedUrl(storageKey: string, ttlSeconds = 900): string {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const signature = crypto
      .createHmac('sha256', 'youva-storage-secret-key-salt')
      .update(`${storageKey}:${expires}`)
      .digest('hex');

    return `https://media.youva-edai.internal/${storageKey}?expires=${expires}&signature=${signature}`;
  }

  /**
   * Verifies signed URL validity and expiration (N11.47).
   */
  verifySignedUrl(storageKey: string, expires: number, signature: string): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (now > expires) return false;

    const expectedSig = crypto
      .createHmac('sha256', 'youva-storage-secret-key-salt')
      .update(`${storageKey}:${expires}`)
      .digest('hex');

    const bufSig = Buffer.from(signature);
    const bufExp = Buffer.from(expectedSig);
    if (bufSig.length !== bufExp.length) return false;

    return crypto.timingSafeEqual(bufSig, bufExp);
  }

  /**
   * Explicitly sets cached asset reference by custom key/hash.
   */
  cacheAsset(key: string, ref: MediaReference): void {
    this.assetCache.set(key, ref);
  }

  /**
   * Retrieves reusable cached educational asset by content hash (N11.46).
   */
  getCachedAsset(checksumSha256: string): MediaReference | null {
    return this.assetCache.get(checksumSha256) || null;
  }

  /**
   * Retrieves media record by ID.
   */
  getMediaById(mediaId: string): StoredMediaRecord | null {
    return this.mediaStore.get(mediaId) || null;
  }

  /**
   * Executes automated retention sweep: purges expired temporary media (N11.49).
   */
  sweepExpiredMedia(): number {
    const now = new Date().toISOString();
    let purgedCount = 0;

    for (const [id, record] of this.mediaStore.entries()) {
      if (record.expiresAt && record.expiresAt < now) {
        record.lifecycleState = 'DELETED';
        this.mediaStore.delete(id);
        purgedCount++;
      }
    }

    if (purgedCount > 0) {
      this.logger.log(`Retention sweep complete: purged ${purgedCount} expired media records.`);
    }
    return purgedCount;
  }
}
