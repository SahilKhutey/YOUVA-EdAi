process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
process.env.TELEMETRY_SALT = 'youva-student-journey-salt-2026';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { ConsentModule } from '../src/consent/consent.module';
import { PracticeModule } from '../src/practice/practice.module';
import { RevisionModule } from '../src/revision/revision.module';
import { TelemetryModule } from '../src/telemetry/telemetry.module';
import { TelemetryService } from '../src/telemetry/telemetry.service';
import { TelemetryEventType } from '../src/telemetry/telemetry.constants';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { Role } from '../src/auth/role.enum';
import { PrismaService } from '../src/prisma/prisma.service';

describe('N4: Complete Student Learning Journey & Adaptive Loop (E2E)', () => {
  let app: INestApplication;
  let telemetryService: TelemetryService;
  let currentUser: { id: string; role: Role; name?: string } | null = null;

  // In-memory state for end-to-end journey
  const studentUser = {
    id: 'student-ishaan-101',
    email: 'ishaan.gupta@dpsrkp.edu.in',
    name: 'Ishaan Gupta',
    role: 'STUDENT',
    gradeLevel: 'Grade 8',
    cognitiveLevel: 'TEEN',
  };

  const parentUser = {
    id: 'parent-deepak-01',
    email: 'deepak.gupta@gmail.com',
    name: 'Mr. Deepak Gupta',
    role: 'PARENT',
  };

  const parentStudentRelations = new Map<string, any>([
    [
      `${parentUser.id}:${studentUser.id}`,
      {
        id: 'rel-ishaan-1',
        parentId: parentUser.id,
        studentId: studentUser.id,
        status: 'ACTIVE',
      },
    ],
  ]);

  const consentRecords = new Map<string, any>();
  const practiceSessions = new Map<string, any>();
  const userTopicMasteries = new Map<string, any>();
  let sessionCounter = 1;

  const topics = [
    {
      id: 'topic-linear-eq-g8',
      title: 'Linear Equations in One Variable',
      subject: { name: 'Mathematics' },
    },
    {
      id: 'topic-rational-numbers-g8',
      title: 'Rational Numbers',
      subject: { name: 'Mathematics' },
    },
  ];

  const questions = [
    {
      id: 'q-eq-001',
      topicId: 'topic-linear-eq-g8',
      content: 'Solve for x: 2x + 7 = 19',
      difficulty: 0.4,
      options: JSON.stringify(['x = 4', 'x = 6', 'x = 8', 'x = 12']),
      hints: JSON.stringify({
        tier1_socratic: 'What inverse operation isolates 2x?',
        tier2_operational: 'Subtract 7 from both sides: 2x = 12.',
        tier3_solution: 'Divide 12 by 2 to obtain x = 6.',
      }),
      correctAnswer: 'x = 6',
      explanation: 'Subtract 7 from both sides: 2x = 12. Divide by 2: x = 6.',
    },
    {
      id: 'q-eq-002',
      topicId: 'topic-linear-eq-g8',
      content: 'Solve for y: 5y - 3 = 2y + 9',
      difficulty: 0.55,
      options: JSON.stringify(['y = 2', 'y = 4', 'y = 6', 'y = 3']),
      hints: JSON.stringify({
        tier1_socratic: 'How can you collect like terms on one side?',
        tier2_operational: 'Subtract 2y from both sides and add 3.',
        tier3_solution: '3y = 12 -> y = 4.',
      }),
      correctAnswer: 'y = 4',
      explanation: 'Transposing gives 3y = 12, hence y = 4.',
    },
  ];

  let userStatsRecord = {
    id: 'stats-ishaan',
    userId: studentUser.id,
    totalXp: 50,
    currentLevel: 1,
    currentStreak: 1,
    bestStreak: 1,
    lastActivityDate: new Date(),
  };

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),

    user: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        if (where.id === studentUser.id) return studentUser;
        if (where.id === parentUser.id) return parentUser;
        return null;
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        if (where.id === studentUser.id) return studentUser;
        if (where.id === parentUser.id) return parentUser;
        return null;
      }),
    },

    parentStudent: {
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        if (where.parentId && where.studentId) {
          return parentStudentRelations.get(`${where.parentId}:${where.studentId}`) || null;
        }
        if (where.studentId) {
          return (
            Array.from(parentStudentRelations.values()).find(
              (r) => r.studentId === where.studentId,
            ) || null
          );
        }
        return null;
      }),
    },

    consentRecord: {
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        const all = Array.from(consentRecords.values());
        return (
          all.find((c) => {
            if (where.studentId && c.studentId !== where.studentId) return false;
            if (where.consentType && c.consentType !== where.consentType) return false;
            if (where.status && c.status !== where.status) return false;
            return true;
          }) || null
        );
      }),
      upsert: jest.fn().mockImplementation(async ({ where, create, update }) => {
        const key = `${where.parentId_studentId_consentType.parentId}:${where.parentId_studentId_consentType.studentId}:${where.parentId_studentId_consentType.consentType}`;
        const existing = consentRecords.get(key);
        const record = existing ? { ...existing, ...update } : { id: `cr-${Date.now()}`, ...create };
        consentRecords.set(key, record);
        return record;
      }),
    },

    topic: {
      findMany: jest.fn().mockImplementation(async () => {
        return topics.map((t) => ({
          ...t,
          practiceSessions: Array.from(practiceSessions.values()).filter(
            (s) => s.topicId === t.id && s.userId === studentUser.id,
          ),
          questions: questions.filter((q) => q.topicId === t.id),
        }));
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return topics.find((t) => t.id === where.id) || null;
      }),
    },

    question: {
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        return questions.filter((q) => q.topicId === where.topicId);
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return questions.find((q) => q.id === where.id) || null;
      }),
    },

    practiceSession: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const id = `sess-journey-${sessionCounter++}`;
        const record = { id, ...data, startTime: new Date() };
        practiceSessions.set(id, record);
        return record;
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return practiceSessions.get(where.id) || null;
      }),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const s = practiceSessions.get(where.id);
        const updated = { ...s, ...data };
        practiceSessions.set(where.id, updated);
        return updated;
      }),
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        return Array.from(practiceSessions.values()).filter((s) => s.userId === where.userId);
      }),
    },

    userAnswer: {
      create: jest.fn().mockImplementation(async ({ data }) => ({ id: `ans-${Date.now()}`, ...data })),
    },

    userTopicMastery: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        const key = `${where.userId_topicId.userId}:${where.userId_topicId.topicId}`;
        return userTopicMasteries.get(key) || null;
      }),
      create: jest.fn().mockImplementation(async ({ data }) => {
        const key = `${data.userId}:${data.topicId}`;
        const record = { id: `utm-${Date.now()}`, ...data };
        userTopicMasteries.set(key, record);
        return record;
      }),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const all = Array.from(userTopicMasteries.values());
        const found = all.find((m) => m.id === where.id);
        if (found) {
          Object.assign(found, data);
          return found;
        }
        return { id: where.id, ...data };
      }),
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        return Array.from(userTopicMasteries.values())
          .filter((m) => m.userId === where.userId)
          .map((m) => ({
            ...m,
            topic: topics.find((t) => t.id === m.topicId) || { id: m.topicId, title: 'Linear Equations' },
          }));
      }),
    },

    userStats: {
      findUnique: jest.fn().mockImplementation(async () => userStatsRecord),
      update: jest.fn().mockImplementation(async ({ data }) => {
        userStatsRecord = { ...userStatsRecord, ...data };
        return userStatsRecord;
      }),
    },

    badge: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    userBadge: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'ub-1' }),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    studySession: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'ss-1' }),
    },
  };

  beforeAll(async () => {
    const mockJwtGuard = {
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        req.user = currentUser
          ? {
              ...currentUser,
              userId: currentUser.id,
            }
          : undefined;
        return true;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ConsentModule,
        PracticeModule,
        RevisionModule,
        TelemetryModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    telemetryService = moduleFixture.get<TelemetryService>(TelemetryService);
    telemetryService.clearEvents();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // REAL STUDENT LEARNING JOURNEY STAGES
  // =========================================================================
  describe('Full Student Journey Progression', () => {
    let generatedOtp: string;
    let activeSessionId: string;

    it('Step 1: Parent requests out-of-band DPDP consent OTP challenge for learner', async () => {
      currentUser = { id: parentUser.id, role: Role.PARENT, name: parentUser.name };

      const res = await request(app.getHttpServer())
        .post('/consent/request-otp')
        .send({
          studentId: studentUser.id,
          consentType: 'LEARNING_SERVICE',
        })
        .expect(201);

      expect(res.body).toHaveProperty('otpPreview');
      generatedOtp = res.body.otpPreview;
    });

    it('Step 2: Parent verifies OTP, establishing statutory consent and minting HMAC evidence token', async () => {
      currentUser = { id: parentUser.id, role: Role.PARENT, name: parentUser.name };

      const res = await request(app.getHttpServer())
        .post('/consent/verify-otp')
        .send({
          studentId: studentUser.id,
          consentType: 'LEARNING_SERVICE',
          otp: generatedOtp,
        })
        .expect(201);

      expect(res.body.status).toBe('GRANTED');
      expect(res.body).toHaveProperty('evidence');
      expect(res.body.evidence.length).toBeGreaterThanOrEqual(32);
    });

    it('Step 3: Learner queries diagnostic test catalog (200 OK)', async () => {
      currentUser = { id: studentUser.id, role: Role.STUDENT, name: studentUser.name };

      const res = await request(app.getHttpServer())
        .get('/practice/tests')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].title).toBe('Linear Equations in One Variable Practice');
    });

    it('Step 4: Learner initiates ZPD-adapted practice session, emitting PRACTICE_ITEM_PRESENTED', async () => {
      currentUser = { id: studentUser.id, role: Role.STUDENT, name: studentUser.name };

      const res = await request(app.getHttpServer())
        .post('/practice/generate')
        .send({ topicId: 'topic-linear-eq-g8' })
        .expect(201);

      expect(res.body).toHaveProperty('sessionId');
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions.length).toBeGreaterThan(0);
      activeSessionId = res.body.sessionId;

      const events = telemetryService.getAllEvents();
      expect(events.some((e) => e.eventType === TelemetryEventType.PRACTICE_ITEM_PRESENTED)).toBe(true);
    });

    it('Step 5: Learner submits correct answer, triggering real-time BKT mastery increase, difficulty update, and XP award', async () => {
      currentUser = { id: studentUser.id, role: Role.STUDENT, name: studentUser.name };

      const res = await request(app.getHttpServer())
        .post('/practice/submit')
        .send({
          sessionId: activeSessionId,
          answers: [
            { questionId: 'q-eq-001', answer: 'x = 6' },
            { questionId: 'q-eq-002', answer: 'y = 4' },
          ],
        })
        .expect(201);

      expect(res.body.score).toBe(100);
      expect(res.body.correctCount).toBe(2);
      expect(res.body.xpEarned).toBeGreaterThanOrEqual(10);
      expect(res.body.masteryProbability).toBeGreaterThan(0.5);

      // Verify streak and XP incremented in UserStats
      expect(userStatsRecord.totalXp).toBeGreaterThan(50);

      // Verify telemetry events emitted
      const events = telemetryService.getAllEvents();
      expect(events.some((e) => e.eventType === TelemetryEventType.PRACTICE_ITEM_ANSWERED)).toBe(true);
      expect(events.some((e) => e.eventType === TelemetryEventType.SESSION_COMPLETED)).toBe(true);
    });

    it('Step 6: Learner views updated mastery history in completed tests overview', async () => {
      currentUser = { id: studentUser.id, role: Role.STUDENT, name: studentUser.name };

      const res = await request(app.getHttpServer())
        .get('/practice/tests')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const linearEqTopic = res.body.find((t: any) => t.id === 'topic-linear-eq-g8');
      expect(linearEqTopic).toBeDefined();
      expect(linearEqTopic.status).toBe('Completed');
      expect(linearEqTopic.score).toBe(100);
    });

    it('Step 7: Learning system derives prioritized revision suggestions based on spaced-repetition decay', async () => {
      currentUser = { id: studentUser.id, role: Role.STUDENT, name: studentUser.name };

      const res = await request(app.getHttpServer())
        .get('/revision/suggestions')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('topicId');
        expect(res.body[0]).toHaveProperty('masteryScore');
        expect(res.body[0]).toHaveProperty('reason');
      }
    });

    it('Step 8: Verification of zero-PII privacy preservation across full student journey telemetry', async () => {
      const cohortTelemetry = telemetryService.exportCohortTelemetry();
      expect(cohortTelemetry.totalEvents).toBeGreaterThan(0);

      for (const event of cohortTelemetry.events) {
        expect(event.pseudonymizedStudentId).toMatch(/^anon_[a-f0-9]{8}$/);
        expect(event.payload.email).toBeUndefined();
        expect(event.payload.name).toBeUndefined();
      }
    });
  });
});
