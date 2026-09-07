import { transitionCredential } from './credential-state';

describe('Credential State Machine', () => {
  it('allows valid forward transitions', () => {
    expect(transitionCredential('DRAFT', 'PENDING_REVIEW')).toBe('PENDING_REVIEW');
    expect(transitionCredential('PENDING_REVIEW', 'APPROVED')).toBe('APPROVED');
    expect(transitionCredential('APPROVED', 'ISSUED')).toBe('ISSUED');
    expect(transitionCredential('ISSUED', 'ACTIVE')).toBe('ACTIVE');
    expect(transitionCredential('ACTIVE', 'SUSPENDED')).toBe('SUSPENDED');
    expect(transitionCredential('SUSPENDED', 'ACTIVE')).toBe('ACTIVE');
    expect(transitionCredential('ACTIVE', 'REVOKED')).toBe('REVOKED');
  });

  it('allows rejection from PENDING_REVIEW back to DRAFT', () => {
    expect(transitionCredential('PENDING_REVIEW', 'DRAFT')).toBe('DRAFT');
  });

  it('rejects direct issuance from draft', () => {
    expect(() => transitionCredential('DRAFT', 'ISSUED')).toThrow(
      'Invalid credential transition: DRAFT -> ISSUED',
    );
  });

  it('does not allow revoked credentials to reactivate (terminal state)', () => {
    expect(() => transitionCredential('REVOKED', 'ACTIVE')).toThrow(
      'Invalid credential transition: REVOKED -> ACTIVE',
    );
  });

  it('does not allow expired credentials to reactivate (terminal state)', () => {
    expect(() => transitionCredential('EXPIRED', 'ACTIVE')).toThrow(
      'Invalid credential transition: EXPIRED -> ACTIVE',
    );
  });
});
