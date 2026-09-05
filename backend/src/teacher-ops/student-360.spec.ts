import { Test, TestingModule } from '@nestjs/testing';
import { Student360Service } from './services/student-360.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('P2 Student 360 View Diagnostics', () => {
  let service: Student360Service;
  let prisma: any;
  let scopeAuth: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
    };

    scopeAuth = {
      assertTeacherStudentScope: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Student360Service,
        { provide: PrismaService, useValue: prisma },
        { provide: ScopeAuthorizationService, useValue: scopeAuth },
      ],
    }).compile();

    service = module.get<Student360Service>(Student360Service);
  });

  describe('Student 360 Aggregation', () => {
    it('✓ accurately partitions concept strengths and weaknesses and includes cognitive telemetry', async () => {
      scopeAuth.assertTeacherStudentScope.mockResolvedValue(true);

      prisma.user.findUnique.mockResolvedValue({
        id: 'student-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        gradeLevel: '10',
        cognitiveLevel: 'TEEN',
        onboardingComplete: true,
        stats: { streakDays: 5, totalXp: 1200 },
        cognitiveProfile: { learningVelocityIndex: 1.2 },
        topicMastery: [
          {
            topicId: 'top-1',
            masteryProbability: 0.85,
            difficultyState: 0.8,
            topic: { title: 'Algebraic Linear Systems', subject: { name: 'Mathematics' } },
          },
          {
            topicId: 'top-2',
            masteryProbability: 0.25,
            difficultyState: 0.3,
            topic: { title: 'Polynomial Factoring', subject: { name: 'Mathematics' } },
          },
        ],
        mistakeLogs: [{ id: 'm-1', description: 'Sign inversion', topicId: 'top-2', createdAt: new Date() }],
        cognitiveStateLogs: [
          {
            cognitiveLoad: 0.85,
            errorClusterScore: 0.7,
            inferredState: 'confusion',
            retrievalStrength: 0.4,
            attentionSwitching: 0.3,
            timestamp: new Date(),
          },
        ],
        studyGoals: [{ id: 'g-1', title: 'Complete Algebra Module', targetScore: 90 }],
        learningEvidenceLogs: [],
        personalizationDecisions: [],
        studentInterventions: [],
        escalationEvents: [],
      });

      const profile = await service.getStudent360('teacher-1', 'student-1');

      expect(profile.studentId).toBe('student-1');
      expect(profile.conceptStrengths).toHaveLength(1);
      expect(profile.conceptStrengths[0].topic).toBe('Algebraic Linear Systems');
      expect(profile.conceptWeaknesses).toHaveLength(1);
      expect(profile.conceptWeaknesses[0].topic).toBe('Polynomial Factoring');
      expect(profile.cognitiveState?.inferredState).toBe('confusion');
      expect(profile.recommendedIntervention).toContain('High cognitive strain detected');
    });

    it('✓ blocks access if student is outside teacher scope', async () => {
      scopeAuth.assertTeacherStudentScope.mockRejectedValue(
        new ForbiddenException('Scope denied'),
      );

      await expect(service.getStudent360('teacher-1', 'student-unauthorized')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
