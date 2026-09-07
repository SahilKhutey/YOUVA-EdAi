import { canCertifyCompetency } from './competency.types';
import { CompetencyService } from './competency.service';
import { ForbiddenException } from '@nestjs/common';

describe('Competency Certification Rule & Service', () => {
  let service: CompetencyService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      learningCompetency: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      learnerCompetency: {
        upsert: jest.fn(),
      },
    };
    service = new CompetencyService(prisma);
  });

  it('does not allow AI to certify competency', () => {
    expect(
      canCertifyCompetency({
        competencyId: 'c1',
        evidenceIds: ['e1'],
        requiredLevel: 'PROFICIENT',
        achievedLevel: 'PROFICIENT',
        confidence: 0.99,
        teacherVerified: false,
      }),
    ).toBe(false);
  });

  it('rejects certification when confidence is below 0.8', () => {
    expect(
      canCertifyCompetency({
        competencyId: 'c1',
        evidenceIds: ['e1'],
        requiredLevel: 'PROFICIENT',
        achievedLevel: 'PROFICIENT',
        confidence: 0.79,
        teacherVerified: true,
      }),
    ).toBe(false);
  });

  it('rejects certification when evidence is missing', () => {
    expect(
      canCertifyCompetency({
        competencyId: 'c1',
        evidenceIds: [],
        requiredLevel: 'PROFICIENT',
        achievedLevel: 'PROFICIENT',
        confidence: 0.95,
        teacherVerified: true,
      }),
    ).toBe(false);
  });

  it('approves certification when teacher verified, high confidence, and evidence provided', () => {
    expect(
      canCertifyCompetency({
        competencyId: 'c1',
        evidenceIds: ['ev-101'],
        requiredLevel: 'PROFICIENT',
        achievedLevel: 'PROFICIENT',
        confidence: 0.92,
        teacherVerified: true,
      }),
    ).toBe(true);
  });

  it('service throws ForbiddenException when certification check fails', async () => {
    await expect(
      service.certify('learner-1', {
        competencyId: 'c1',
        evidenceIds: ['e1'],
        requiredLevel: 'PROFICIENT',
        achievedLevel: 'PROFICIENT',
        confidence: 0.99,
        teacherVerified: false,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
