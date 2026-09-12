process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-key-that-is-at-least-32-characters-long';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/testdb';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { TeacherOpsModule } from '../src/teacher-ops/teacher-ops.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { Role } from '../src/auth/role.enum';
import { PrismaService } from '../src/prisma/prisma.service';
import { ActorType, DecisionStatus, InterventionStatus } from '../src/learning-loop/domain/enums';

describe('N5: Teacher-Student Operations Closed-Loop (E2E HTTP Invariants)', () => {
  let app: INestApplication;
  let currentUser: { id: string; role: string; name?: string; actorType?: string } | null = null;

  // In-Memory Database Simulation for Test Isolation
  const users = new Map<string, any>([
    [
      'teacher-ritu',
      {
        id: 'teacher-ritu',
        email: 'ritu.sharma@dpsrkp.edu.in',
        name: 'Mrs. Ritu Sharma',
        role: Role.TEACHER,
        tenantId: 'tenant-dps-rkp',
      },
    ],
    [
      'student-aarav',
      {
        id: 'student-aarav',
        email: 'aarav.sharma@dpsrkp.edu.in',
        name: 'Aarav Sharma',
        role: Role.STUDENT,
        gradeLevel: 'Grade 8',
        tenantId: 'tenant-dps-rkp',
      },
    ],
    [
      'teacher-anita',
      {
        id: 'teacher-anita',
        email: 'anita.desai@modernschool.edu.in',
        name: 'Mrs. Anita Desai',
        role: Role.TEACHER,
        tenantId: 'tenant-modern-vv',
      },
    ],
    [
      'student-rohan',
      {
        id: 'student-rohan',
        email: 'rohan.verma@modernschool.edu.in',
        name: 'Rohan Verma',
        role: Role.STUDENT,
        gradeLevel: 'Grade 8',
        tenantId: 'tenant-modern-vv',
      },
    ],
    [
      'ai-bot-agent',
      {
        id: 'ai-bot-agent',
        email: 'bot@youva.ai',
        name: 'Autonomous AI Orchestrator',
        role: 'AI',
        actorType: 'AI',
      },
    ],
  ]);

  // Classes & Enrollments
  const classes = new Map<string, any>([
    [
      'class-dps-8a',
      {
        id: 'class-dps-8a',
        teacherId: 'teacher-ritu',
        name: 'Grade 8-A Mathematics',
        subject: 'Mathematics',
        gradeLevel: 'Grade 8',
      },
    ],
  ]);

  const enrollments = new Map<string, any>([
    [
      'class-dps-8a:student-aarav',
      { classId: 'class-dps-8a', studentId: 'student-aarav' },
    ],
  ]);

  // Personalization Decisions (AI Recommendations)
  const decisions = new Map<string, any>([
    [
      'dec-aarav-01',
      {
        id: 'dec-aarav-01',
        userId: 'student-aarav',
        activityType: 'REMEDIATION',
        difficulty: 0.45,
        modality: 'INTERACTIVE',
        pacing: 'STANDARD',
        status: DecisionStatus.PROPOSED,
        recommendationRationale: 'BKT mastery decay detected on multi-step linear equations.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'dec-aarav-02',
      {
        id: 'dec-aarav-02',
        userId: 'student-aarav',
        activityType: 'PRACTICE',
        difficulty: 0.50,
        modality: 'VISUAL',
        pacing: 'STANDARD',
        status: DecisionStatus.PROPOSED,
        recommendationRationale: 'Reinforce inverse operations with pictorial balancing.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  ]);

  // Teacher Interventions
  const interventions = new Map<string, any>([
    [
      'int-aarav-01',
      {
        id: 'int-aarav-01',
        teacherId: 'teacher-ritu',
        studentId: 'student-aarav',
        decisionId: 'dec-aarav-01',
        action: 'REVIEW',
        feedback: 'Student requested 3 consecutive hints on distributive law question.',
        status: InterventionStatus.PENDING,
        overrideDetails: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  ]);

  // Audit Logs
  const auditLogs: any[] = [];

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        return Promise.resolve(users.get(where.id) || null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }: { where: any }) => {
        for (const u of users.values()) {
          let match = true;
          if (where.id && u.id !== where.id) match = false;
          if (where.role && u.role !== where.role) match = false;
          if (match) return Promise.resolve(u);
        }
        return Promise.resolve(null);
      }),
    },
    teacherStudentAssignment: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    teacherClass: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        return Promise.resolve(classes.get(where.id) || null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }: { where: any }) => {
        for (const c of classes.values()) {
          let match = true;
          if (where.id && c.id !== where.id) match = false;
          if (where.teacherId && c.teacherId !== where.teacherId) match = false;
          if (match) return Promise.resolve(c);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockResolvedValue(Array.from(classes.values())),
    },
    teacherClassEnrollment: {
      findFirst: jest.fn().mockImplementation(({ where }: { where: any }) => {
        for (const e of enrollments.values()) {
          if (where.classId && e.classId !== where.classId) continue;
          if (where.studentId && e.studentId !== where.studentId) continue;
          if (where.class?.teacherId) {
            const cls = classes.get(e.classId);
            if (!cls || cls.teacherId !== where.class.teacherId) continue;
          }
          return Promise.resolve(e);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: { where: any }) => {
        const results = [];
        for (const e of enrollments.values()) {
          if (where?.class?.teacherId) {
            const cls = classes.get(e.classId);
            if (cls && cls.teacherId === where.class.teacherId) {
              results.push(e);
            }
          }
        }
        return Promise.resolve(results);
      }),
    },
    digitalClassroomSession: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    worksheetSubmission: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    personalizationDecision: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        return Promise.resolve(decisions.get(where.id) || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: { where: any }) => {
        const results = [];
        for (const d of decisions.values()) {
          if (where?.userId?.in && !where.userId.in.includes(d.userId)) continue;
          results.push({
            ...d,
            user: users.get(d.userId),
            topic: { id: 'topic-linear-eq', title: 'Linear Equations in One Variable' },
          });
        }
        return Promise.resolve(results);
      }),
      update: jest.fn().mockImplementation(({ where, data }: { where: { id: string }; data: any }) => {
        const dec = decisions.get(where.id);
        if (!dec) return Promise.resolve(null);
        const updated = { ...dec, ...data, updatedAt: new Date() };
        decisions.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    teacherIntervention: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        return Promise.resolve(interventions.get(where.id) || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: { where: any }) => {
        const results = [];
        for (const it of interventions.values()) {
          if (where?.studentId?.in && !where.studentId.in.includes(it.studentId)) continue;
          if (where?.status && it.status !== where.status) continue;
          results.push({
            ...it,
            student: {
              ...users.get(it.studentId),
              escalationEvents: [],
              cognitiveStateLogs: [{ cognitiveLoad: 0.72, inferredState: 'MILD_STRUGGLE' }],
            },
            decision: decisions.get(it.decisionId) || null,
          });
        }
        return Promise.resolve(results);
      }),
      create: jest.fn().mockImplementation(({ data }: { data: any }) => {
        const id = `int-${Date.now()}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        interventions.set(id, record);
        return Promise.resolve(record);
      }),
      update: jest.fn().mockImplementation(({ where, data }: { where: { id: string }; data: any }) => {
        const it = interventions.get(where.id);
        if (!it) return Promise.resolve(null);
        const updated = { ...it, ...data, updatedAt: new Date() };
        interventions.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    learningLoopAuditLog: {
      create: jest.fn().mockImplementation(({ data }: { data: any }) => {
        const log = { id: `log-${Date.now()}`, ...data, createdAt: new Date() };
        auditLogs.push(log);
        return Promise.resolve(log);
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TeacherOpsModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          if (!currentUser) return false;
          req.user = currentUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          if (!currentUser) return false;
          // Teachers and Admins are allowed in TeacherOpsController
          return currentUser.role === Role.TEACHER || currentUser.role === Role.ADMIN;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // Step 1: Teacher Queue Inspection (GET /teacher/interventions)
  // =========================================================================
  it('Step 1: Scoped Teacher A retrieves intervention queue with diagnostic telemetry', async () => {
    currentUser = users.get('teacher-ritu');

    const res = await request(app.getHttpServer())
      .get('/teacher/interventions')
      .expect(200);

    expect(res.body).toHaveProperty('urgent');
    expect(res.body).toHaveProperty('review');
    expect(Array.isArray(res.body.review)).toBe(true);
    expect(res.body.review.length).toBeGreaterThan(0);

    const targetItem = res.body.review.find((i: any) => i.id === 'int-aarav-01');
    expect(targetItem).toBeDefined();
    expect(targetItem.studentId).toBe('student-aarav');
    expect(targetItem.status).toBe(InterventionStatus.PENDING);
    expect(targetItem.priority).toBe('REVIEW');
    expect(targetItem.latestCognitiveState.cognitiveLoad).toBe(0.72);
  });

  // =========================================================================
  // Step 2: Recommendations Queue Inspection (GET /teacher/recommendations)
  // =========================================================================
  it('Step 2: Scoped Teacher A inspects pending AI recommendations for classroom', async () => {
    currentUser = users.get('teacher-ritu');

    const res = await request(app.getHttpServer())
      .get('/teacher/recommendations')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const rec = res.body.find((r: any) => r.id === 'dec-aarav-01');
    expect(rec).toBeDefined();
    expect(rec.userId).toBe('student-aarav');
    expect(rec.status).toBe(DecisionStatus.PROPOSED);
    expect(rec.activityType).toBe('REMEDIATION');
    expect(rec.difficulty).toBe(0.45);
  });

  // =========================================================================
  // Step 3: Teacher Approves AI Recommendation (POST /teacher/recommendations/:id/approve)
  // =========================================================================
  it('Step 3: Teacher A approves AI recommendation with immutable audit trail', async () => {
    currentUser = users.get('teacher-ritu');

    const res = await request(app.getHttpServer())
      .post('/teacher/recommendations/dec-aarav-01/approve')
      .expect(200);

    expect(res.body.id).toBe('dec-aarav-01');
    expect(res.body.status).toBe(DecisionStatus.ACCEPTED);

    // Verify stored state in decisions map
    const stored = decisions.get('dec-aarav-01');
    expect(stored.status).toBe(DecisionStatus.ACCEPTED);

    // Verify Audit Trail
    const lastAudit = auditLogs[auditLogs.length - 1];
    expect(lastAudit).toBeDefined();
    expect(lastAudit.actorType).toBe(ActorType.TEACHER);
    expect(lastAudit.actorId).toBe('teacher-ritu');
    expect(lastAudit.action).toBe('TEACHER_RECOMMENDATION_APPROVED');
    expect(lastAudit.userId).toBe('student-aarav');
  });

  // =========================================================================
  // Step 4: Teacher Authoritatively Overrides AI (POST /teacher/recommendations/:id/override)
  // =========================================================================
  it('Step 4: Teacher A authoritatively overrides AI recommendation with pedagogical rationale', async () => {
    currentUser = users.get('teacher-ritu');

    const overridePayload = {
      forcedActivityType: 'CHALLENGE',
      forcedDifficulty: 0.85,
      forcedModality: 'INTERACTIVE',
      forcedPacing: 'ACCELERATED',
      reason: 'Student demonstrated conceptual mastery during in-class board demonstration.',
      teacherNotes: 'Advance directly to fractional cross-multiplication linear equations.',
    };

    const res = await request(app.getHttpServer())
      .post('/teacher/recommendations/dec-aarav-02/override')
      .send(overridePayload)
      .expect(200);

    expect(res.body.id).toBe('dec-aarav-02');
    expect(res.body.status).toBe(DecisionStatus.OVERRIDDEN);
    expect(res.body.activityType).toBe('CHALLENGE');
    expect(res.body.difficulty).toBe(0.85);
    expect(res.body.recommendationRationale).toContain('Teacher Override');

    // Verify stored decision state
    const stored = decisions.get('dec-aarav-02');
    expect(stored.status).toBe(DecisionStatus.OVERRIDDEN);
    expect(stored.difficulty).toBe(0.85);

    // Verify Audit Trail recorded
    const lastAudit = auditLogs[auditLogs.length - 1];
    expect(lastAudit.actorType).toBe(ActorType.TEACHER);
    expect(lastAudit.action).toBe('TEACHER_RECOMMENDATION_OVERRIDDEN');
  });

  // =========================================================================
  // Step 5: Teacher Resolves Intervention (POST /teacher/interventions/:id/resolve)
  // =========================================================================
  it('Step 5: Teacher A resolves pending intervention with pedagogical notes', async () => {
    currentUser = users.get('teacher-ritu');

    const resolutionPayload = {
      resolutionNotes: 'Conducted 1-on-1 Socratic conference on bracket distribution; student confident.',
    };

    const res = await request(app.getHttpServer())
      .post('/teacher/interventions/int-aarav-01/resolve')
      .send(resolutionPayload)
      .expect(200);

    expect(res.body.id).toBe('int-aarav-01');
    expect(res.body.status).toBe(InterventionStatus.RESOLVED);
    expect(res.body.feedback).toContain('[Resolved by Teacher]');

    // Verify stored intervention state
    const stored = interventions.get('int-aarav-01');
    expect(stored.status).toBe(InterventionStatus.RESOLVED);
  });

  // =========================================================================
  // Step 6: Empty Resolution Notes Validation (400 Bad Request)
  // =========================================================================
  it('Step 6: Reject intervention resolution when pedagogical rationale is missing', async () => {
    currentUser = users.get('teacher-ritu');

    // Create a new pending intervention
    const tempInt = {
      id: 'int-temp-01',
      teacherId: 'teacher-ritu',
      studentId: 'student-aarav',
      action: 'REVIEW',
      feedback: 'Struggle on fraction arithmetic',
      status: InterventionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    interventions.set('int-temp-01', tempInt);

    await request(app.getHttpServer())
      .post('/teacher/interventions/int-temp-01/resolve')
      .send({ resolutionNotes: '   ' })
      .expect(400);
  });

  // =========================================================================
  // Step 7: Scope Barrier — Teacher B blocked from Student A (403 Forbidden)
  // =========================================================================
  it('Step 7: Teacher B (Modern School) is blocked from resolving Teacher A (DPS RKP) student intervention', async () => {
    currentUser = users.get('teacher-anita'); // Out of scope for student-aarav

    await request(app.getHttpServer())
      .post('/teacher/interventions/int-temp-01/resolve')
      .send({ resolutionNotes: 'Attempting cross-school unauthorized resolution' })
      .expect(403);
  });

  // =========================================================================
  // Step 8: Scope Barrier — Teacher B blocked from approving Teacher A recommendation
  // =========================================================================
  it('Step 8: Teacher B is blocked from approving AI recommendations for out-of-scope student', async () => {
    currentUser = users.get('teacher-anita'); // Out of scope for student-aarav

    await request(app.getHttpServer())
      .post('/teacher/recommendations/dec-aarav-01/approve')
      .expect(403);
  });

  // =========================================================================
  // Step 9: Student Access Barrier (403 Forbidden)
  // =========================================================================
  it('Step 9: Student is strictly blocked from accessing teacher intervention operations', async () => {
    currentUser = users.get('student-aarav'); // STUDENT role

    await request(app.getHttpServer())
      .get('/teacher/interventions')
      .expect(403);
  });

  // =========================================================================
  // Step 10: Invariant — AI bot strictly blocked from closing interventions
  // =========================================================================
  it('Step 10: AI actor is strictly blocked from closing or resolving teacher interventions (AI Recommends, Humans Authorize)', async () => {
    currentUser = users.get('ai-bot-agent'); // AI role

    await request(app.getHttpServer())
      .post('/teacher/interventions/int-temp-01/resolve')
      .send({ resolutionNotes: 'Automated AI bot resolution attempt.' })
      .expect(403);
  });
});
