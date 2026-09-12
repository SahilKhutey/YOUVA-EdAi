process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { HealthModule } from '../src/health/health.module';
import { AiModule } from '../src/ai/ai.module';
import { LearningLoopController } from '../src/learning-loop/learning-loop.controller';
import { LearningLoopService } from '../src/learning-loop/learning-loop.service';
import { TeacherInterventionService } from '../src/learning-loop/intervention/teacher-intervention.service';
import { EscalationStateMachineService } from '../src/learning-loop/escalation/escalation-state-machine.service';
import { LearningLoopAuditService } from '../src/learning-loop/audit/learning-loop-audit.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { Role } from '../src/auth/role.enum';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Learning Loop & AI Gateway (E2E Integration)', () => {
  let app: INestApplication;
  let currentUser: { id: string; role: Role };

  const mockLearningLoopService = {
    getContext: jest.fn().mockImplementation((studentId, topicId) => ({
      studentId,
      topicId,
      currentMastery: 0.45,
      zone: 'PROXIMAL_DEVELOPMENT',
    })),
    personalize: jest.fn().mockImplementation((studentId, topicId) => ({
      recommendedAction: 'PRACTICE_SCAFFOLDED_ITEM',
      topicId,
      confidence: 0.88,
    })),
    processEvidenceAndAdvance: jest.fn().mockImplementation((studentId, dto) => ({
      evidenceId: 'ev-12345',
      idempotent: false,
      newMastery: 0.65,
      delta: 0.20,
      timestamp: new Date().toISOString(),
    })),
  };

  const mockTeacherInterventionService = {
    executeIntervention: jest.fn().mockImplementation((teacherId, dto) => ({
      interventionId: 'int-999',
      teacherId,
      studentId: dto.studentId,
      action: dto.action,
      authorized: true,
      status: 'APPLIED',
    })),
  };

  const mockEscalationStateMachine = {
    transitionState: jest.fn(),
  };

  const mockAuditService = {
    getStudentAuditTrail: jest.fn().mockReturnValue([]),
  };

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
  };

  beforeAll(async () => {
    // Custom Mock Guard to simulate authenticated JWT user
    const mockJwtGuard = {
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        req.user = currentUser;
        return true;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule, AiModule],
      controllers: [LearningLoopController],
      providers: [
        { provide: LearningLoopService, useValue: mockLearningLoopService },
        { provide: TeacherInterventionService, useValue: mockTeacherInterventionService },
        { provide: EscalationStateMachineService, useValue: mockEscalationStateMachine },
        { provide: LearningLoopAuditService, useValue: mockAuditService },
        RolesGuard,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('1. Health & Resilience Subsystem', () => {
    it('GET /health/live should return 200 with alive status', async () => {
      const res = await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'alive');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('GET /health/ready should return 200 with database readiness', async () => {
      const res = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ready');
    });
  });

  describe('2. Multi-Provider AI Gateway Subsystem', () => {
    it('POST /ai/generate should return valid pedagogical text via gateway', async () => {
      const res = await request(app.getHttpServer())
        .post('/ai/generate')
        .send({ prompt: 'MATH-G8-LINEQ-01 definition' })
        .expect(201);

      expect(typeof res.text).toBe('string');
      expect(res.text.length).toBeGreaterThan(10);
    });

    it('POST /ai/generate should reject empty prompts with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/ai/generate')
        .send({})
        .expect(400);
    });
  });

  describe('3. Core Learning Loop Evidence & BKT Progression', () => {
    beforeEach(() => {
      currentUser = { id: 'student-std-001', role: Role.STUDENT };
    });

    it('POST /learning-loop/context should return proximal development context', async () => {
      const res = await request(app.getHttpServer())
        .post('/learning-loop/context')
        .send({ topicId: 'topic-linear-eq-01' })
        .expect(200);

      expect(res.body).toHaveProperty('currentMastery', 0.45);
      expect(res.body).toHaveProperty('zone', 'PROXIMAL_DEVELOPMENT');
    });

    it('POST /learning-loop/evidence should submit evidence and update BKT mastery', async () => {
      const payload = {
        evidenceId: 'ev-attempt-001',
        topicId: 'topic-linear-eq-01',
        isCorrect: true,
        timeSpentSeconds: 42,
      };

      const res = await request(app.getHttpServer())
        .post('/learning-loop/evidence')
        .send(payload)
        .expect(200);

      expect(res.body).toHaveProperty('evidenceId', 'ev-12345');
      expect(res.body).toHaveProperty('newMastery', 0.65);
      expect(res.body).toHaveProperty('delta', 0.20);
    });
  });

  describe('4. Human Oversight & Teacher Authorization Invariant', () => {
    it('POST /learning-loop/teacher/intervention should be FORBIDDEN for students', async () => {
      currentUser = { id: 'student-std-001', role: Role.STUDENT };

      const interventionPayload = {
        studentId: 'student-std-001',
        action: 'OVERRIDE_DIFFICULTY',
        notes: 'Trying to self-promote difficulty',
      };

      await request(app.getHttpServer())
        .post('/learning-loop/teacher/intervention')
        .send(interventionPayload)
        .expect(403);
    });

    it('POST /learning-loop/teacher/intervention should SUCCEED for verified teachers', async () => {
      currentUser = { id: 'teacher-tch-901', role: Role.TEACHER };

      const interventionPayload = {
        studentId: 'student-std-001',
        action: 'CERTIFY_MASTERY',
        notes: 'Verified linear equations worksheet in class',
      };

      const res = await request(app.getHttpServer())
        .post('/learning-loop/teacher/intervention')
        .send(interventionPayload)
        .expect(200);

      expect(res.body).toHaveProperty('authorized', true);
      expect(res.body).toHaveProperty('status', 'APPLIED');
      expect(res.body).toHaveProperty('teacherId', 'teacher-tch-901');
    });
  });
});
