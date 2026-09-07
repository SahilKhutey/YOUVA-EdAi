import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteOnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async complete(userId: string, dto: CompleteOnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        onboardingComplete: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          cognitiveLevel: dto.cognitiveLevel,
          gradeLevel: dto.gradeLevel,
          onboardingComplete: true,
        },
      });

      return tx.commercialProfile.upsert({
        where: { userId },
        create: {
          userId,
          onboardingStatus: 'COMPLETED',
          acquisitionSource: dto.acquisitionSource,
          referralCode: dto.referralCode,
        },
        update: {
          onboardingStatus: 'COMPLETED',
          acquisitionSource: dto.acquisitionSource,
          referralCode: dto.referralCode,
        },
      });
    });

    return result;
  }
}
