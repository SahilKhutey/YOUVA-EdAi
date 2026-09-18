import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TeacherMediaReviewRecord } from './multimodal-types';
import { MediaStorageService } from './media-storage.service';

@Injectable()
export class TeacherContentReviewService {
  private readonly logger = new Logger(TeacherContentReviewService.name);

  // In-memory review ledger (assetId -> reviews)
  private readonly reviewLedger = new Map<string, TeacherMediaReviewRecord[]>();

  constructor(private readonly storageService: MediaStorageService) {}

  /**
   * Submits a teacher review decision for a generated educational asset (N11.56-57).
   */
  submitReview(params: {
    assetId: string;
    tenantId: string;
    teacherId: string;
    action: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
    notes?: string;
  }): TeacherMediaReviewRecord {
    const record: TeacherMediaReviewRecord = {
      id: `rev-${Date.now()}`,
      assetId: params.assetId,
      tenantId: params.tenantId,
      teacherId: params.teacherId,
      status: params.action,
      notes: params.notes,
      reviewedAt: new Date().toISOString(),
    };

    const history = this.reviewLedger.get(params.assetId) || [];
    history.push(record);
    this.reviewLedger.set(params.assetId, history);

    // Update media storage lifecycle state accordingly (N11.48)
    const mediaRecord = this.storageService.getMediaById(params.assetId);
    if (mediaRecord) {
      if (params.action === 'APPROVED') {
        this.storageService.transitionState(params.assetId, 'APPROVED');
      } else if (params.action === 'REJECTED') {
        this.storageService.transitionState(params.assetId, 'QUARANTINED', params.notes || 'Teacher rejected');
      }
    }

    this.logger.log(`Teacher ${params.teacherId} reviewed asset ${params.assetId}: ${params.action}`);
    return record;
  }

  /**
   * Retrieves review history for an asset.
   */
  getReviewHistory(assetId: string): TeacherMediaReviewRecord[] {
    return this.reviewLedger.get(assetId) || [];
  }

  /**
   * Asserts SME review requirement based on risk tier (N11.59).
   */
  isSmeReviewRequired(riskTier: 'LOW' | 'MEDIUM' | 'HIGH'): boolean {
    return riskTier === 'HIGH';
  }
}
