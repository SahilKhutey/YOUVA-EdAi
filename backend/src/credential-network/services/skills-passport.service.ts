import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SkillsPassport,
  PassportSkill,
  P15EventTypes,
} from '../types/credential.types';

@Injectable()
export class SkillsPassportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a portable Learner Skills Passport aggregating verified achievements.
   * Invariant: Only credentials in ISSUED or ACTIVE status populate the verified passport.
   */
  async generate(
    learnerId: string,
    tenantId: string,
  ): Promise<SkillsPassport> {
    const prismaClient = this.prisma as any;

    const credentials = await prismaClient.learningCredential.findMany({
      where: {
        learnerId,
        tenantId,
        status: {
          in: ['ISSUED', 'ACTIVE'],
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    const skillsMap = new Map<string, PassportSkill>();

    for (const credential of credentials) {
      let skillIds: string[] = [];
      try {
        skillIds = JSON.parse(credential.skillIdsJson || '[]');
      } catch {
        skillIds = [];
      }

      for (const skillId of skillIds) {
        const existing = skillsMap.get(skillId);

        if (existing) {
          if (!existing.credentialIds.includes(credential.id)) {
            existing.credentialIds.push(credential.id);
          }
        } else {
          skillsMap.set(skillId, {
            skillId,
            skillName: skillId,
            status: 'DEMONSTRATED',
            verificationLevel: credential.verificationLevel,
            credentialIds: [credential.id],
          });
        }
      }
    }

    const passport: SkillsPassport = {
      learnerId,
      generatedAt: new Date().toISOString(),
      version: 1,
      skills: [...skillsMap.values()],
      credentials: credentials.map((credential: any) => ({
        id: credential.id,
        title: credential.title,
        type: credential.credentialType,
        verificationLevel: credential.verificationLevel,
        issuedAt: credential.issuedAt ? new Date(credential.issuedAt).toISOString() : undefined,
        status: credential.status,
      })),
    };

    return passport;
  }
}
