import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface AuditableRecord {
  id: string;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: string;
  createdAt: Date | string;
  hash?: string | null;
  previousHash?: string | null;
}

export interface TamperVerificationResult {
  valid: boolean;
  totalVerified: number;
  tamperedRecordId?: string;
  error?: string;
}

@Injectable()
export class AuditTamperService {
  private readonly logger = new Logger(AuditTamperService.name);
  private readonly hmacSecret =
    process.env.AUDIT_HMAC_SECRET ||
    process.env.JWT_SECRET ||
    'youva-audit-ledger-tamper-resistance-key-production';

  /**
   * Computes a deterministic SHA-256 HMAC digest for an audit entry,
   * binding it to the previous record's hash to form a tamper-evident blockchain-like ledger.
   */
  computeRecordHash(record: AuditableRecord, previousHash: string = 'GENESIS_BLOCK'): string {
    const payload = [
      record.id,
      record.actorId || 'SYSTEM',
      record.action,
      record.resourceType,
      record.resourceId || '',
      record.outcome,
      typeof record.createdAt === 'string'
        ? record.createdAt
        : record.createdAt.toISOString(),
      previousHash,
    ].join('|');

    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verifies the cryptographic integrity of an audit chain.
   * Ensures that no record has had its content altered and that no records
   * have been deleted, inserted, or reordered.
   */
  verifyAuditChain(records: AuditableRecord[]): TamperVerificationResult {
    if (!records || records.length === 0) {
      return { valid: true, totalVerified: 0 };
    }

    let expectedPreviousHash = 'GENESIS_BLOCK';

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      // Verify link to previous node
      if (record.previousHash && record.previousHash !== expectedPreviousHash) {
        this.logger.warn(
          `Audit tamper detected at record ${record.id}: previousHash mismatch. Expected '${expectedPreviousHash}', found '${record.previousHash}'`,
        );
        return {
          valid: false,
          totalVerified: i,
          tamperedRecordId: record.id,
          error: `Audit chain broken: previousHash mismatch at record index ${i} (ID: ${record.id})`,
        };
      }

      // Verify node's own cryptographic hash
      const computedHash = this.computeRecordHash(
        record,
        record.previousHash || expectedPreviousHash,
      );

      if (record.hash && record.hash !== computedHash) {
        this.logger.warn(
          `Audit tamper detected at record ${record.id}: content hash mismatch. Record content has been modified.`,
        );
        return {
          valid: false,
          totalVerified: i,
          tamperedRecordId: record.id,
          error: `Audit tamper detected: content altered at record index ${i} (ID: ${record.id})`,
        };
      }

      expectedPreviousHash = record.hash || computedHash;
    }

    return {
      valid: true,
      totalVerified: records.length,
    };
  }
}
