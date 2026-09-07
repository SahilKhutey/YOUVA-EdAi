import { CredentialVerificationService } from './credential-verification.service';

describe('CredentialVerificationService', () => {
  let service: CredentialVerificationService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      passportAchievement: {
        findUnique: jest.fn(),
      },
    };
    service = new CredentialVerificationService(prisma);
  });

  it('accepts an active credential', () => {
    expect(
      service.isValid({
        status: 'ACTIVE',
      }),
    ).toBe(true);
  });

  it('rejects revoked credentials', () => {
    expect(
      service.isValid({
        status: 'REVOKED',
      }),
    ).toBe(false);
  });

  it('rejects expired credentials', () => {
    expect(
      service.isValid({
        status: 'EXPIRED',
      }),
    ).toBe(false);
  });
});
