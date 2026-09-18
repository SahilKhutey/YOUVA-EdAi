import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { CredentialProof } from './credential-types';

export interface KeyRecord {
  keyId: string;
  algorithm: 'Ed25519' | 'HMAC-SHA256';
  publicKey: string;
  privateSecret: string; // Stored securely, never exposed via API
  createdAt: string;
  isActive: boolean;
  isCompromised: boolean;
  compromisedAt?: string;
}

@Injectable()
export class CryptoKeyService {
  private readonly logger = new Logger(CryptoKeyService.name);
  private readonly keys = new Map<string, KeyRecord>();
  private activeKeyId: string;

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys(): void {
    const initialKeyId = 'key-youva-2026-01';
    const secret = process.env.CREDENTIAL_SIGNING_KEY || 'youva-edai-secure-credential-signing-root-2026-salt';
    const publicKey = crypto.createHash('sha256').update(secret + '-public').digest('hex');

    const keyRecord: KeyRecord = {
      keyId: initialKeyId,
      algorithm: 'HMAC-SHA256',
      publicKey,
      privateSecret: secret,
      createdAt: new Date().toISOString(),
      isActive: true,
      isCompromised: false,
    };

    this.keys.set(initialKeyId, keyRecord);
    this.activeKeyId = initialKeyId;
    this.logger.log(`Initialized cryptographic key infrastructure. Active Key ID: ${initialKeyId}`);
  }

  getActiveKey(): KeyRecord {
    const key = this.keys.get(this.activeKeyId);
    if (!key || !key.isActive || key.isCompromised) {
      throw new BadRequestException('No active uncompromised cryptographic key available.');
    }
    return key;
  }

  getKey(keyId: string): KeyRecord {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new BadRequestException(`Cryptographic key '${keyId}' not found.`);
    }
    return key;
  }

  /**
   * Rotates signing keys, archiving the previous key while activating the new one (Clause N12.47, CRED-014).
   */
  rotateKey(): { newKeyId: string; rotatedAt: string } {
    const oldKey = this.keys.get(this.activeKeyId);
    if (oldKey) {
      oldKey.isActive = false;
    }

    const newKeyId = `key-youva-2026-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const newSecret = crypto.randomBytes(32).toString('hex');
    const publicKey = crypto.createHash('sha256').update(newSecret + '-public').digest('hex');

    const newKey: KeyRecord = {
      keyId: newKeyId,
      algorithm: 'HMAC-SHA256',
      publicKey,
      privateSecret: newSecret,
      createdAt: new Date().toISOString(),
      isActive: true,
      isCompromised: false,
    };

    this.keys.set(newKeyId, newKey);
    this.activeKeyId = newKeyId;
    this.logger.log(`Cryptographic key rotated successfully. New active key: ${newKeyId}`);

    return {
      newKeyId,
      rotatedAt: newKey.createdAt,
    };
  }

  /**
   * Marks a key as compromised with an effective timestamp.
   */
  compromiseKey(keyId: string, compromisedAt?: string): void {
    const key = this.getKey(keyId);
    key.isCompromised = true;
    key.isActive = false;
    key.compromisedAt = compromisedAt || new Date().toISOString();
    this.logger.warn(`Key ${keyId} marked as COMPROMISED as of ${key.compromisedAt}`);

    // If active key was compromised, trigger rotation immediately
    if (this.activeKeyId === keyId) {
      this.rotateKey();
    }
  }

  /**
   * Generates a cryptographic signature proof for a normalized payload.
   */
  signPayload(payloadString: string): CredentialProof {
    const activeKey = this.getActiveKey();
    const created = new Date().toISOString();

    const hmac = crypto.createHmac('sha256', activeKey.privateSecret);
    hmac.update(`${activeKey.keyId}:${created}:${payloadString}`);
    const proofValue = hmac.digest('hex');

    return {
      type: 'HmacSha256Signature2026',
      created,
      verificationMethod: `did:youva:issuer:delhi-01#${activeKey.keyId}`,
      proofPurpose: 'assertionMethod',
      proofValue,
      keyId: activeKey.keyId,
    };
  }

  /**
   * Verifies a cryptographic signature proof against normalized payload and key status.
   */
  verifySignature(payloadString: string, proof: CredentialProof): { valid: boolean; reason?: string } {
    const key = this.keys.get(proof.keyId);
    if (!key) {
      return { valid: false, reason: `Unknown signing key '${proof.keyId}'.` };
    }

    // Check if key is compromised and signature was created after compromise
    if (key.isCompromised && key.compromisedAt) {
      const proofTime = new Date(proof.created).getTime();
      const compTime = new Date(key.compromisedAt).getTime();
      if (proofTime >= compTime) {
        return { valid: false, reason: `Signing key was compromised prior to or at signature time.` };
      }
    }

    const hmac = crypto.createHmac('sha256', key.privateSecret);
    hmac.update(`${proof.keyId}:${proof.created}:${payloadString}`);
    const expectedProof = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expectedProof, 'utf8');
    const actualBuf = Buffer.from(proof.proofValue, 'utf8');

    if (expectedBuf.length !== actualBuf.length) {
      return { valid: false, reason: 'Signature length mismatch or corrupted proof.' };
    }

    if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return { valid: false, reason: 'Cryptographic signature verification failed (tampered payload or invalid secret).' };
    }

    return { valid: true };
  }
}
