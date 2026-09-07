import { SkillsPassportService } from './skills-passport.service';

describe('SkillsPassportService', () => {
  it('returns verified credentials and maps demonstrated skills', async () => {
    const mockPrisma = {
      learningCredential: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'cred-1',
            title: 'Algebra Fundamentals',
            credentialType: 'SKILL',
            verificationLevel: 'TEACHER_VERIFIED',
            skillIdsJson: JSON.stringify(['algebra-basics', 'linear-equations']),
            status: 'ACTIVE',
            issuedAt: new Date(),
          },
          {
            id: 'cred-2',
            title: 'Advanced Algebra',
            credentialType: 'COMPETENCY',
            verificationLevel: 'INSTITUTION_VERIFIED',
            skillIdsJson: JSON.stringify(['linear-equations', 'quadratic-equations']),
            status: 'ISSUED',
            issuedAt: new Date(),
          },
        ]),
      },
    };

    const service = new SkillsPassportService(mockPrisma as any);
    const passport = await service.generate('student-1', 'tenant-1');

    expect(passport.learnerId).toBe('student-1');
    expect(passport.credentials).toHaveLength(2);
    expect(passport.skills).toHaveLength(3);

    const linearEquations = passport.skills.find(s => s.skillId === 'linear-equations');
    expect(linearEquations).toBeDefined();
    expect(linearEquations?.credentialIds).toContain('cred-1');
    expect(linearEquations?.credentialIds).toContain('cred-2');
  });
});
