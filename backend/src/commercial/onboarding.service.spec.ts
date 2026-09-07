import { BadRequestException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      commercialProfile: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => callback(mockPrisma)),
    };

    service = new OnboardingService(mockPrisma);
  });

  it('completes onboarding and updates learner profile and commercial profile', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      onboardingComplete: false,
    });

    mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });
    mockPrisma.commercialProfile.upsert.mockResolvedValue({
      userId: 'user-1',
      onboardingStatus: 'COMPLETED',
      acquisitionSource: 'ORGANIC_SEARCH',
      referralCode: 'REF123',
    });

    const result = await service.complete('user-1', {
      cognitiveLevel: 'TEEN',
      gradeLevel: '8',
      acquisitionSource: 'ORGANIC_SEARCH',
      referralCode: 'REF123',
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        cognitiveLevel: 'TEEN',
        gradeLevel: '8',
        onboardingComplete: true,
      },
    });

    expect(mockPrisma.commercialProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: {
        userId: 'user-1',
        onboardingStatus: 'COMPLETED',
        acquisitionSource: 'ORGANIC_SEARCH',
        referralCode: 'REF123',
      },
      update: {
        onboardingStatus: 'COMPLETED',
        acquisitionSource: 'ORGANIC_SEARCH',
        referralCode: 'REF123',
      },
    });

    expect(result.onboardingStatus).toBe('COMPLETED');
  });

  it('rejects nonexistent user with BadRequestException', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.complete('non-existent-user', {
        cognitiveLevel: 'CHILD',
        gradeLevel: '3',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
