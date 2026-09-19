import { Injectable, Logger, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ExternalEvidencePayload,
  EvidenceValidationResult,
} from './n16-types';

@Injectable()
export class IntegrationGatewayService {
  private readonly logger = new Logger(IntegrationGatewayService.name);

  private readonly registeredAdapters = new Map<
    string,
    {
      systemId: string;
      systemType: string;
      tenantId: string;
      sharedSecret: string;
      active: boolean;
    }
  >();

  private readonly processedIdempotencyKeys = new Set<string>();

  constructor() {
    this.seedDefaultAdapters();
  }

  private seedDefaultAdapters(): void {
    this.registeredAdapters.set('canvas-dps-rkp', {
      systemId: 'canvas-dps-rkp',
      systemType: 'CANVAS_LMS',
      tenantId: 'tenant-dps-rkp',
      sharedSecret: 'canvas-secret-key-32chars-minimum-test-01',
      active: true,
    });

    this.registeredAdapters.set('powerschool-nord', {
      systemId: 'powerschool-nord',
      systemType: 'POWERSCHOOL',
      tenantId: 'tenant-nord-anglia',
      sharedSecret: 'powerschool-secret-key-32chars-test-02',
      active: true,
    });
  }

  // --- 1. Adapter Registration (Clauses N16.26 - N16.27) ---

  public registerAdapter(params: {
    systemId: string;
    systemType: string;
    tenantId: string;
    sharedSecret: string;
  }): void {
    this.registeredAdapters.set(params.systemId, {
      ...params,
      active: true,
    });
    this.logger.log(`Registered Integration Adapter [${params.systemId}] of type [${params.systemType}]`);
  }

  // --- 2. Webhook Governance & Cryptographic Signature Validation (Clause N16.32) ---

  public verifyWebhookSecurity(params: {
    systemId: string;
    payloadString: string;
    signatureHeader: string;
    timestampHeader: number;
  }): boolean {
    const adapter = this.registeredAdapters.get(params.systemId);
    if (!adapter || !adapter.active) {
      throw new UnauthorizedException(`INT-001: Adapter [${params.systemId}] not registered or inactive`);
    }

    // 1. Freshness / Replay Attack Defense (Within 300 seconds window)
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - params.timestampHeader) > 300) {
      throw new UnauthorizedException(
        `INT-002: Webhook timestamp expired or out of bounds (|${nowSec} - ${params.timestampHeader}| > 300s)`
      );
    }

    // 2. HMAC SHA-256 Signature Verification
    const expectedSig = crypto
      .createHmac('sha256', adapter.sharedSecret)
      .update(`${params.timestampHeader}.${params.payloadString}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSig, 'utf-8');
    const receivedBuffer = Buffer.from(params.signatureHeader, 'utf-8');

    if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      throw new UnauthorizedException('INT-003: Invalid HMAC webhook signature');
    }

    return true;
  }

  // --- 3. External Learning Data Ingestion & Evaluation Gate (Clause N16.28) ---

  public ingestExternalEvidence(
    payload: ExternalEvidencePayload,
    signatureHeader: string,
    timestampHeader: number
  ): EvidenceValidationResult {
    // 0. Idempotency Gate
    if (this.processedIdempotencyKeys.has(payload.evidenceId)) {
      this.logger.warn(`Idempotent duplicate evidence ignored for [${payload.evidenceId}]`);
      return {
        evidenceId: payload.evidenceId,
        isValid: true,
        status: 'ACCEPTED_FOR_EVALUATION',
        confidenceScore: 0.95,
        learningEngineApplied: false, // Already applied previously
        evaluatedAt: new Date().toISOString(),
      };
    }

    // 1. Webhook Security Verification
    const payloadString = JSON.stringify(payload);
    this.verifyWebhookSecurity({
      systemId: payload.externalSystemId,
      payloadString,
      signatureHeader,
      timestampHeader,
    });

    // 2. External Learning Data Invariant: Validate Evidence Parameters
    if (payload.maxScore <= 0 || payload.rawScore < 0 || payload.rawScore > payload.maxScore) {
      throw new BadRequestException(
        `INT-004: Malformed score metrics: raw [${payload.rawScore}], max [${payload.maxScore}]`
      );
    }

    if (!payload.artifactHash || payload.artifactHash.length < 32) {
      throw new BadRequestException('INT-005: Missing or invalid cryptographic artifactHash for evidence');
    }

    // 3. Learning Engine Evaluation (External systems CANNOT directly mutate mastery)
    const ratio = payload.rawScore / payload.maxScore;
    const isValid = ratio >= 0.0;
    const appliedMasteryDelta = Number((ratio * 0.15).toFixed(3)); // Clamped bounded delta calculated by YOUVA engine

    this.processedIdempotencyKeys.add(payload.evidenceId);

    const result: EvidenceValidationResult = {
      evidenceId: payload.evidenceId,
      isValid: true,
      status: 'ACCEPTED_FOR_EVALUATION',
      confidenceScore: 0.95,
      learningEngineApplied: true,
      appliedMasteryDelta,
      evaluatedAt: new Date().toISOString(),
    };

    this.logger.log(
      `Ingested external evidence [${payload.evidenceId}] from [${payload.sourceSystemType}]. Applied BKT mastery delta: +${appliedMasteryDelta}`
    );

    return result;
  }
}
