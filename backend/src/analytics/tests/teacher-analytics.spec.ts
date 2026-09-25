import { Test, TestingModule } from '@nestjs/testing';
import { TeacherAnalyticsService } from '../teacher/teacher-analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TeacherAnalyticsService (LKC-8)', () => {
  let service: TeacherAnalyticsService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      teacherClassEnrollment: {
        findMany: jest.fn(),
      },
      learnerKnowledgeState: {
        findMany: jest.fn(),
      },
      teacherIntervention: {
        count: jest.fn(),
      },
      learningEvidenceLog: {
        findMany: jest.fn(),
      },
      adaptiveSession: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherAnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TeacherAnalyticsService>(TeacherAnalyticsService);
  });

  it('should compute class overview, mastery distribution, and top learning signals', async () => {
    mockPrisma.teacherClassEnrollment.findMany.mockResolvedValue([
      { studentId: 'student-1' },
      { studentId: 'student-2' },
    ]);

    mockPrisma.learnerKnowledgeState.findMany.mockResolvedValue([
      {
        learnerId: 'student-1',
        knowledgeObjectId: 'k-1',
        masteryLevel: 0.9,
        confidence: 0.85,
        status: 'MASTERED',
        knowledgeObject: { title: 'Algebra Fundamentals' },
      },
      {
        learnerId: 'student-2',
        knowledgeObjectId: 'k-1',
        masteryLevel: 0.35,
        confidence: 0.4,
        status: 'STRUGGLING',
        struggleScore: 0.8,
        knowledgeObject: { title: 'Algebra Fundamentals' },
      },
    ]);

    mockPrisma.teacherIntervention.count.mockResolvedValue(1);

    const overview = await service.getClassOverview('class-1', 'teacher-1', 'tenant-1');

    expect(overview.totalStudents).toBe(2);
    expect(overview.masteryDistribution.mastered).toBe(1);
    expect(overview.masteryDistribution.struggling).toBe(1);
    expect(overview.remediationCount).toBe(1);
    expect(overview.teacherInterventionCount).toBe(1);
    expect(overview.topLearningSignals.length).toBe(1);
    expect(overview.topLearningSignals[0].title).toBe('Algebra Fundamentals');
  });

  it('should provide purpose-limited learner drilldown', async () => {
    mockPrisma.learnerKnowledgeState.findMany.mockResolvedValue([
      {
        knowledgeObjectId: 'k-1',
        masteryLevel: 0.85,
        confidence: 0.9,
        status: 'MASTERED',
        attempts: 4,
        correctAttempts: 4,
        knowledgeObject: { title: 'Geometry Basics', type: 'CONCEPT' },
      },
    ]);

    mockPrisma.learningEvidenceLog.findMany.mockResolvedValue([
      { id: 'ev-1', accuracy: 1.0, attemptNumber: 1, hintCount: 0, createdAt: new Date() },
    ]);

    mockPrisma.adaptiveSession.findUnique.mockResolvedValue({
      currentAction: 'PRACTICE',
      interventionLevel: 0,
    });

    const drilldown = await service.getLearnerDrilldown('student-1', 'teacher-1', 'tenant-1');

    expect(drilldown.learnerId).toBe('student-1');
    expect(drilldown.currentAction).toBe('PRACTICE');
    expect(drilldown.concepts.length).toBe(1);
    expect(drilldown.recentEvidence.length).toBe(1);
  });
});
