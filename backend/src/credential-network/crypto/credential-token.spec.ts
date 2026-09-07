import {
  generateShareToken,
  credentialIntegrityHash,
} from './credential-token';
import { createHash } from 'crypto';

describe('Credential Cryptography & Token Security', () => {
  it('generates random share token with matching SHA-256 hash', () => {
    const { token, hash } = generateShareToken();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(30);

    const recomputedHash = createHash('sha256').update(token).digest('hex');
    expect(hash).toBe(recomputedHash);
  });

  it('computes deterministic canonical credential integrity hash', () => {
    const input1 = {
      id: 'credential-1',
      title: 'Algebra',
      credentialType: 'SKILL',
      verificationLevel: 'TEACHER_VERIFIED',
      issuedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const input2 = {
      id: 'credential-1',
      title: 'Algebra',
      credentialType: 'SKILL',
      verificationLevel: 'TEACHER_VERIFIED',
      issuedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const hash1 = credentialIntegrityHash(input1);
    const hash2 = credentialIntegrityHash(input2);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('detects changes in credential integrity hash', () => {
    const original = {
      id: 'credential-1',
      title: 'Algebra',
      credentialType: 'SKILL',
      verificationLevel: 'TEACHER_VERIFIED',
      issuedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const tampered = {
      ...original,
      verificationLevel: 'INSTITUTION_VERIFIED',
    };

    expect(credentialIntegrityHash(original)).not.toBe(
      credentialIntegrityHash(tampered),
    );
  });
});
