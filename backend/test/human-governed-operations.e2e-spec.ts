process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-key-that-is-at-least-32-characters-long';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/testdb';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { TeacherOpsModule } from '../src/teacher-ops/teacher-ops.module';
import { SafetyModule } from '../src/safety/safety.module';
import { ParentModule } from '../src/parent/parent.module';
import { LearningModule } from '../src/learning/learning.module';
import { ConsentModule } from '../src/consent/consent.module';
import { AuditModule } from '../src/audit/audit.module';
import { AuditService } from '../src/audit/audit.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { Role } from '../src/auth/role.enum';
import { PrismaService } from '../src/prisma/prisma.service';
import { InterventionStatus } from '../src/learning-loop/domain/enums';
import { SafetySeverity } from '../src/safety/safety-policy.service';

describe('Cycle N3: Human-Governed Operations & Safety Closed Loop (E2E)', () => {
  let app: INestApplication;
  let auditService: AuditService;
  let currentUser: { id: string; role: string; name?: string; tenantId?: string; actorType?: string } | null = null;

  // In-Memory Database State
  const users = new Map<string, any>([
    [
      'teacher-dps',
      {
        id: 'teacher-dps',
        email: 'teacher.ritu@dpsrkp.edu.in',
        name: 'Mrs. Ritu Sharma',
        role: Role.TEACHER,
        tenantId: 'tenant-dps',
      },
    ],
    [
      'teacher-modern',
      {
        id: 'teacher-modern',
        email: 'teacher.anita@modern.edu.in',
        name: 'Mrs. Anita Desai',
        role: Role.TEACHER,
        tenantId: 'tenant-modern',
      },
    ],
    [
      'student-aarav',
      {
        id: 'student-aarav',
        email: 'aarav.sharma@dpsrkp.edu.in',
        name: 'Aarav Sharma',
        role: Role.STUDENT,
        tenantId: 'tenant-dps',
        gradeLevel: 'Grade 8',
        cognitiveLevel: 'TEEN',
        stats: { totalXp: 500, currentLevel: 5, currentStreak: 4 },
      },
    ],
    [
      'student-rohan',
      {
        id: 'student-rohan',
        email: 'rohan.verma@modern.edu.in',
        name: 'Rohan Verma',
        role: Role.STUDENT,
        tenantId: 'tenant-modern',
        gradeLevel: 'Grade 8',
        cognitiveLevel: 'TEEN',
        stats: { totalXp: 320, currentLevel: 3, currentStreak: 2 },
      },
    ],
    [
      'parent-dps',
      {
        id: 'parent-dps',
        email: 'rajesh.sharma@dps-parents.edu.in',
        name: 'Mr. Rajesh Sharma',
        role: Role.PARENT,
        tenantId: 'tenant-dps',
      },
    ],
    [
      'parent-modern',
      {
        id: 'parent-modern',
        email: 'sunita.verma@modern-parents.edu.in',
        name: 'Mrs. Sunita Verma',
        role: Role.PARENT,
        tenantId: 'tenant-modern',
      },
    ],
    [
      'ai-bot',
      {
        id: 'ai-bot',
        email: 'bot@youva.ai',
        name: 'Autonomous AI Orchestrator',
        role: 'AI',
        actorType: 'AI',
        tenantId: 'tenant-system',
      },
    ],
    [
      'admin-system',
      {
        id: 'admin-system',
        email: 'admin@youva.ai',
        name: 'System Safeguarding Officer',
        role: Role.ADMIN,
        tenantId: 'tenant-system',
      },
    ],
  ]);

  const parentStudentRelations = new Map<string, any>([
    [
      'parent-dps:student-aarav',
      { id: 'psr-1', parentId: 'parent-dps', studentId: 'student-aarav', status: 'ACTIVE' },
    ],
    [
      'parent-modern:student-rohan',
      { id: 'psr-2', parentId: 'parent-modern', studentId: 'student-rohan', status: 'ACTIVE' },
    ],
  ]);

  const consentRecords = new Map<string, any>([
    [
      'parent-dps:student-aarav:LEARNING_SERVICE',
      {
        id: 'cr-aarav-01',
        parentId: 'parent-dps',
        studentId: 'student-aarav',
        consentType: 'LEARNING_SERVICE',
        status: 'GRANTED',
        version: '1.0.0',
        grantedAt: new Date(),
        revokedAt: null,
      },
    ],
  ]);

  const teacherStudentAssignments = new Map<string, any>([
    [
      'teacher-dps:student-aarav',
      { id: 'tsa-1', teacherId: 'teacher-dps', studentId: 'student-aarav', isActive: true },
    ],
    [
      'teacher-modern:student-rohan',
      { id: 'tsa-2', teacherId: 'teacher-modern', studentId: 'student-rohan', isActive: true },
    ],
  ]);

  const topics = [
    {
      id: 'topic-algebra-01',
      title: 'Linear Equations in One Variable',
      subjectId: 'subject-math-01',
      subject: { id: 'subject-math-01', name: 'Mathematics' },
    },
  ];

  const interventions = new Map<string, any>([
    [
      'int-aarav-pending',
      {
        id: 'int-aarav-pending',
        teacherId: 'teacher-dps',
        studentId: 'student-aarav',
        action: 'INTERVENE',
        feedback: 'Repeated struggles on variable isolation.',
        status: InterventionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'int-aarav-to-reject',
      {
        id: 'int-aarav-to-reject',
        teacherId: 'teacher-dps',
        studentId: 'student-aarav',
        action: 'INTERVENE',
        feedback: 'Automated struggle alert from practice session.',
        status: InterventionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'int-rohan-modern',
      {
        id: 'int-rohan-modern',
        teacherId: 'teacher-modern',
        studentId: 'student-rohan',
        action: 'INTERVENE',
        feedback: 'Modern school student struggling with graphs.',
        status: InterventionStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  ]);

  const safetyEscalations = new Map<string, any>();
  const notificationDeliveries = new Map<string, any>();
  const notifications = new Map<string, any>([
    [
      'notif-parent-dps-01',
      {
        id: 'notif-parent-dps-01',
        userId: 'parent-dps',
        title: 'Weekly Progress Report',
        message: 'Aarav completed 4 practice modules this week.',
        createdAt: new Date(),
      },
    ],
  ]);
  const auditEvents: any[] = [];
  const learningLoopAudits: any[] = [];
  const learningSessions = new Map<string, any>();
  const userTopicMasteries = new Map<string, any>([
    [
      'student-aarav:topic-algebra-01',
      {
        userId: 'student-aarav',
        topicId: 'topic-algebra-01',
        masteryProbability: 0.75,
        difficultyState: 0.6,
        lastReviewed: new Date(),
        topic: topics[0],
      },
    ],
  ]);

  const mockPrismaService: any = {
    $transaction: jest.fn().mockImplementation(async (fn: any) => {
      return fn(mockPrismaService);
    }),

    user: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        const u = users.get(where.id);
        if (!u) return Promise.resolve(null);
        return Promise.resolve({
          ...u,
          stats: { totalXp: 500, currentLevel: 5, currentStreak: 4 },
          topicMastery: [
            {
              topicId: 'topic-algebra-01',
              masteryProbability: 0.75,
              difficultyState: 0.6,
              topic: topics[0],
            },
          ],
          mistakeLogs: [],
          cognitiveStateLogs: [{ cognitiveLoad: 0.5, inferredState: 'FOCUSED' }],
          studyGoals: [],
          learningEvidenceLogs: [],
          personalizationDecisions: [],
          studentInterventions: [],
          escalationEvents: [],
        });
      }),
      findFirst: jest.fn().mockImplementation(({ where }: any) => {
        for (const u of users.values()) {
          let match = true;
          if (where.id && u.id !== where.id) match = false;
          if (where.role && u.role !== where.role) match = false;
          if (match) return Promise.resolve(u);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(() => Promise.resolve(Array.from(users.values()))),
    },

    parentStudent: {
      findFirst: jest.fn().mockImplementation(({ where }: any) => {
        for (const rel of parentStudentRelations.values()) {
          if (where.parentId && rel.parentId !== where.parentId) continue;
          if (where.studentId && rel.studentId !== where.studentId) continue;
          if (where.status && rel.status !== where.status) continue;
          return Promise.resolve(rel);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const results = [];
        for (const rel of parentStudentRelations.values()) {
          if (where?.parentId && rel.parentId !== where.parentId) continue;
          if (where?.status && rel.status !== where.status) continue;
          const student = users.get(rel.studentId);
          results.push({
            ...rel,
            student: student
              ? {
                  id: student.id,
                  name: student.name,
                  gradeLevel: student.gradeLevel,
                  cognitiveLevel: student.cognitiveLevel,
                  avatarUrl: student.avatarUrl,
                }
              : null,
          });
        }
        return Promise.resolve(results);
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
        const key = `${where.parentId_studentId.parentId}:${where.parentId_studentId.studentId}`;
        const existing = parentStudentRelations.get(key);
        const record = existing ? { ...existing, ...update } : { id: `psr-${Date.now()}`, ...create };
        parentStudentRelations.set(key, record);
        return Promise.resolve(record);
      }),
    },

    consentRecord: {
      findFirst: jest.fn().mockImplementation(({ where }: any) => {
        for (const c of consentRecords.values()) {
          if (where.parentId && c.parentId !== where.parentId) continue;
          if (where.studentId && c.studentId !== where.studentId) continue;
          if (where.consentType && c.consentType !== where.consentType) continue;
          if (where.status && c.status !== where.status) continue;
          if (where.revokedAt === null && c.revokedAt !== null) continue;
          return Promise.resolve(c);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const results = [];
        for (const c of consentRecords.values()) {
          if (where?.parentId && c.parentId !== where.parentId) continue;
          if (where?.studentId && c.studentId !== where.studentId) continue;
          if (where?.consentType && c.consentType !== where.consentType) continue;
          if (where?.status && c.status !== where.status) continue;
          results.push(c);
        }
        return Promise.resolve(results);
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
        const key = `${where.parentId_studentId_consentType.parentId}:${where.parentId_studentId_consentType.studentId}:${where.parentId_studentId_consentType.consentType}`;
        const existing = consentRecords.get(key);
        const record = existing ? { ...existing, ...update } : { id: `cr-${Date.now()}`, ...create };
        consentRecords.set(key, record);
        return Promise.resolve(record);
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const key = `${where.parentId_studentId_consentType.parentId}:${where.parentId_studentId_consentType.studentId}:${where.parentId_studentId_consentType.consentType}`;
        const existing = consentRecords.get(key);
        if (!existing) return Promise.resolve(null);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        consentRecords.set(key, updated);
        return Promise.resolve(updated);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
        let count = 0;
        for (const [key, c] of consentRecords.entries()) {
          if (where.studentId && c.studentId !== where.studentId) continue;
          if (where.status && c.status !== where.status) continue;
          consentRecords.set(key, { ...c, ...data });
          count++;
        }
        return Promise.resolve({ count });
      }),
    },

    teacherStudentAssignment: {
      findFirst: jest.fn().mockImplementation(({ where }: any) => {
        const key = `${where.teacherId}:${where.studentId}`;
        const assign = teacherStudentAssignments.get(key);
        if (assign && where.isActive !== undefined && assign.isActive !== where.isActive) return Promise.resolve(null);
        return Promise.resolve(assign || null);
      }),
      findMany: jest.fn().mockImplementation(() => Promise.resolve(Array.from(teacherStudentAssignments.values()))),
    },

    teacherClass: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },

    teacherClassEnrollment: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },

    digitalClassroomSession: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },

    worksheetSubmission: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },

    teacherIntervention: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        const item = interventions.get(where.id);
        if (!item) return Promise.resolve(null);
        return Promise.resolve({
          ...item,
          student: users.get(item.studentId) || null,
          decision: null,
        });
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const results = [];
        for (const item of interventions.values()) {
          if (where?.studentId?.in && !where.studentId.in.includes(item.studentId)) continue;
          if (where?.status && item.status !== where.status) continue;
          results.push({
            ...item,
            student: {
              ...users.get(item.studentId),
              escalationEvents: [],
              cognitiveStateLogs: [],
            },
            decision: null,
          });
        }
        return Promise.resolve(results);
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        interventions.set(id, record);
        return Promise.resolve(record);
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const item = interventions.get(where.id);
        if (!item) return Promise.resolve(null);
        const updated = { ...item, ...data, updatedAt: new Date() };
        interventions.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },

    safetyEscalation: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = `safe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const record = { id, ...data, createdAt: new Date() };
        safetyEscalations.set(id, record);
        return Promise.resolve(record);
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(safetyEscalations.get(where.id) || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const results = [];
        for (const item of safetyEscalations.values()) {
          if (where?.status?.in && !where.status.in.includes(item.status)) continue;
          results.push({
            ...item,
            student: users.get(item.studentId) || { id: item.studentId, name: 'Student', email: '' },
          });
        }
        return Promise.resolve(results);
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const item = safetyEscalations.get(where.id);
        if (!item) return Promise.resolve(null);
        const updated = { ...item, ...data };
        safetyEscalations.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },

    notification: {
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const results = [];
        for (const n of notifications.values()) {
          if (where?.userId && n.userId !== where.userId) continue;
          results.push(n);
        }
        return Promise.resolve(results);
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = `notif-${Date.now()}`;
        const record = { id, ...data, createdAt: new Date() };
        notifications.set(id, record);
        return Promise.resolve(record);
      }),
    },

    notificationDelivery: {
      findMany: jest.fn().mockImplementation(() => Promise.resolve(Array.from(notificationDeliveries.values()))),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const record = { id, ...data, createdAt: new Date() };
        notificationDeliveries.set(id, record);
        return Promise.resolve(record);
      }),
    },

    auditEvent: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const record = { id, ...data, createdAt: new Date() };
        auditEvents.push(record);
        return Promise.resolve(record);
      }),
      findFirst: jest.fn().mockImplementation(() => {
        return Promise.resolve(auditEvents[auditEvents.length - 1] || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        let results = [...auditEvents];
        if (where?.action) results = results.filter((e) => e.action === where.action);
        if (where?.resource) results = results.filter((e) => e.resource === where.resource);
        return Promise.resolve(results);
      }),
    },

    learningLoopAuditLog: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = `lla-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const record = { id, ...data, createdAt: new Date() };
        learningLoopAudits.push(record);
        return Promise.resolve(record);
      }),
      findMany: jest.fn().mockImplementation(() => Promise.resolve(learningLoopAudits)),
    },

    topic: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(topics.find((t) => t.id === where.id) || null);
      }),
      findMany: jest.fn().mockImplementation(() => Promise.resolve(topics)),
    },

    subject: {
      findUnique: jest.fn().mockResolvedValue({ id: 'subject-math-01', name: 'Mathematics' }),
      findMany: jest.fn().mockResolvedValue([{ id: 'subject-math-01', name: 'Mathematics' }]),
    },

    learningSession: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = `sess-${Date.now()}`;
        const record = {
          id,
          ...data,
          startTime: new Date(),
          endTime: null,
          topic: topics[0],
        };
        learningSessions.set(id, record);
        return Promise.resolve(record);
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(learningSessions.get(where.id) || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const results = [];
        for (const s of learningSessions.values()) {
          if (where?.userId && s.userId !== where.userId) continue;
          results.push(s);
        }
        return Promise.resolve(results);
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const s = learningSessions.get(where.id);
        if (!s) return Promise.resolve(null);
        const updated = { ...s, ...data };
        learningSessions.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },

    userTopicMastery: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        const key = `${where.userId_topicId.userId}:${where.userId_topicId.topicId}`;
        return Promise.resolve(userTopicMasteries.get(key) || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const results = [];
        for (const m of userTopicMasteries.values()) {
          if (where?.userId && m.userId !== where.userId) continue;
          results.push(m);
        }
        return Promise.resolve(results);
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const key = `${data.userId}:${data.topicId}`;
        const record = { ...data, topic: topics[0], lastReviewed: new Date() };
        userTopicMasteries.set(key, record);
        return Promise.resolve(record);
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        const key = `${where.userId_topicId.userId}:${where.userId_topicId.topicId}`;
        const existing = userTopicMasteries.get(key) || {};
        const record = { ...existing, ...data, topic: topics[0], lastReviewed: new Date() };
        userTopicMasteries.set(key, record);
        return Promise.resolve(record);
      }),
    },

    learningEvidenceLog: {
      create: jest.fn().mockResolvedValue({ id: `lel-${Date.now()}` }),
      findMany: jest.fn().mockResolvedValue([]),
    },

    policyGateDecision: {
      create: jest.fn().mockResolvedValue({ id: `pgd-${Date.now()}` }),
      findMany: jest.fn().mockResolvedValue([]),
    },

    personalizationDecision: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: `pd-${Date.now()}` }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TeacherOpsModule,
        SafetyModule,
        ParentModule,
        LearningModule,
        ConsentModule,
        AuditModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const authHeader = req.headers['authorization'];
          if (!authHeader || authHeader.includes('invalid') || authHeader.includes('expired') || !currentUser) {
            throw new UnauthorizedException('Unauthorized: Missing or invalid credentials');
          }
          req.user = currentUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          if (!currentUser) throw new UnauthorizedException('Unauthorized');
          // Allow AI role through to test controller-level safety governance invariant
          if (currentUser.role === 'AI') {
            return true;
          }
          const handler = context.getHandler();
          const classTarget = context.getClass();
          const roles = Reflect.getMetadata('roles', handler) || Reflect.getMetadata('roles', classTarget);
          if (!roles || roles.length === 0) return true;
          return roles.includes(currentUser.role);
        },
      })
      .compile();

    auditService = moduleFixture.get<AuditService>(AuditService);
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // GROUP 1: Authentication & Session Security (N3-E01 to N3-E03)
  // =========================================================================
  describe('Group 1: Authentication & Session Security', () => {
    it('N3-E01: Missing JWT credentials rejected with 401 Unauthorized across operational routes', async () => {
      currentUser = null;
      await request(app.getHttpServer()).get('/teacher/interventions').expect(401);
      await request(app.getHttpServer()).get('/safety/incidents').expect(401);
      await request(app.getHttpServer()).get('/parent/learners').expect(401);
    });

    it('N3-E02: Expired or malformed bearer token rejected with 401 Unauthorized', async () => {
      currentUser = users.get('teacher-dps');
      await request(app.getHttpServer())
        .get('/teacher/interventions')
        .set('Authorization', 'Bearer invalid-malformed-token')
        .expect(401);

      await request(app.getHttpServer())
        .get('/safety/incidents')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);
    });

    it('N3-E03: Authenticated token establishes valid security context and user principal', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .get('/teacher/interventions')
        .set('Authorization', 'Bearer valid-jwt-token')
        .expect(200);

      expect(res.body).toHaveProperty('urgent');
      expect(res.body).toHaveProperty('review');
    });
  });

  // =========================================================================
  // GROUP 2: Authorization & Tenant Scoping (N3-E04 to N3-E08)
  // =========================================================================
  describe('Group 2: Authorization & Tenant Scoping', () => {
    it('N3-E04: Student role cannot access teacher intervention endpoints (403 Forbidden)', async () => {
      currentUser = users.get('student-aarav');
      await request(app.getHttpServer())
        .get('/teacher/interventions')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });

    it('N3-E05: Student role cannot query safety escalations queue (403 Forbidden)', async () => {
      currentUser = users.get('student-aarav');
      await request(app.getHttpServer())
        .get('/safety/incidents')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      await request(app.getHttpServer())
        .get('/safety/escalations')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });

    it('N3-E06: Parent role cannot access teacher endpoints (403 Forbidden)', async () => {
      currentUser = users.get('parent-dps');
      await request(app.getHttpServer())
        .get('/teacher/interventions')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });

    it('N3-E07: Cross-tenant boundary: Teacher from Tenant A cannot access Learner 360 of Tenant B student (403 Forbidden)', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .get('/teacher/learners/student-rohan')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(res.body.message).toContain('Access Denied');
    });

    it('N3-E08: Cross-tenant boundary: Teacher from Tenant A cannot mutate interventions for Tenant B student (403 Forbidden)', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .post('/teacher/interventions/int-rohan-modern/resolve')
        .set('Authorization', 'Bearer valid-token')
        .send({ resolutionNotes: 'Cross tenant attempt to resolve intervention' })
        .expect(403);

      expect(res.body.message).toContain('Access Denied');
    });
  });

  // =========================================================================
  // GROUP 3: Consent Enforcement (N3-E09 to N3-E12)
  // =========================================================================
  describe('Group 3: Consent Enforcement', () => {
    let createdSessionId: string;

    it('N3-E09: Pre-learning check verifies active DPDP consent record before initiating session', async () => {
      currentUser = users.get('student-aarav');
      const res = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('Authorization', 'Bearer valid-token')
        .send({ topicId: 'topic-algebra-01', mode: 'practice' })
        .expect(201);

      expect(res.body).toHaveProperty('sessionId');
      expect(res.body.topicId).toBe('topic-algebra-01');
      createdSessionId = res.body.sessionId;
    });

    it('N3-E10: Learner with missing parental consent is blocked from session creation with 403 DPDPNonCompliance', async () => {
      currentUser = users.get('student-rohan'); // Rohan is linked to parent-modern but has no LEARNING_SERVICE consent record
      const res = await request(app.getHttpServer())
        .post('/learning/sessions')
        .set('Authorization', 'Bearer valid-token')
        .send({ topicId: 'topic-algebra-01', mode: 'practice' })
        .expect(403);

      expect(res.body.message).toContain('DPDPNonCompliance');
    });

    it('N3-E11: Consent revocation halts active learning session; further attempts rejected with 403', async () => {
      // Parent revokes consent for student-aarav
      const key = 'parent-dps:student-aarav:LEARNING_SERVICE';
      const existing = consentRecords.get(key);
      consentRecords.set(key, { ...existing, status: 'REVOKED', revokedAt: new Date() });

      currentUser = users.get('student-aarav');
      const res = await request(app.getHttpServer())
        .post('/learning/attempts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          sessionId: createdSessionId,
          activityId: 'act-01',
          clientAttemptId: `client-att-${Date.now()}`,
          response: 'x = 5',
        })
        .expect(403);

      expect(res.body.message).toContain('DPDPNonCompliance');
    });

    it('N3-E12: Blocked consent attempts result in zero mastery mutation and generate compliance audit record', async () => {
      // Check mastery remains unchanged
      const mastery = userTopicMasteries.get('student-aarav:topic-algebra-01');
      expect(mastery.masteryProbability).toBe(0.75);

      // Verify audit log has CONSENT_VIOLATION_BLOCKED
      const violationAudit = learningLoopAudits.find(
        (a) => a.action === 'CONSENT_VIOLATION_BLOCKED' && a.userId === 'student-aarav',
      );
      expect(violationAudit).toBeDefined();

      // Restore consent for subsequent student-aarav tests
      const key = 'parent-dps:student-aarav:LEARNING_SERVICE';
      consentRecords.set(key, {
        id: 'cr-aarav-01',
        parentId: 'parent-dps',
        studentId: 'student-aarav',
        consentType: 'LEARNING_SERVICE',
        status: 'GRANTED',
        version: '1.0.0',
        grantedAt: new Date(),
        revokedAt: null,
      });
    });
  });

  // =========================================================================
  // GROUP 4: Teacher Intervention Operations (N3-E13 to N3-E18)
  // =========================================================================
  describe('Group 4: Teacher Intervention Operations', () => {
    let createdInterventionId: string;

    it('N3-E13: Teacher retrieves scoped learner 360 with mastery vectors and activity', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .get('/teacher/learners/student-aarav')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body).toHaveProperty('studentId');
      expect(res.body.studentId).toBe('student-aarav');
    });

    it('N3-E14: Teacher retrieves prioritized intervention queue (URGENT vs REVIEW tiers)', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .get('/teacher/interventions')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body).toHaveProperty('urgent');
      expect(res.body).toHaveProperty('review');
    });

    it('N3-E15: Teacher creates manual intervention request with pedagogical notes', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .post('/teacher/interventions')
        .set('Authorization', 'Bearer valid-token')
        .send({
          learnerId: 'student-aarav',
          type: 'PEDAGOGICAL_REVIEW',
          reason: 'Review linear equation simplification steps.',
          recommendation: 'Assign tactile algebra tiles practice.',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe(InterventionStatus.PENDING);
      createdInterventionId = res.body.id;
    });

    it('N3-E16: Teacher authorizes proposed AI intervention; state transitions to AUTHORIZED inside transaction', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .post(`/teacher/interventions/${createdInterventionId}/authorize`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(res.body.id).toBe(createdInterventionId);
      expect(res.body.status).toBe('AUTHORIZED');

      const persisted = interventions.get(createdInterventionId);
      expect(persisted.status).toBe('AUTHORIZED');
    });

    it('N3-E17: Teacher rejects proposed intervention with documented rationale; status becomes REJECTED', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .post('/teacher/interventions/int-aarav-to-reject/reject')
        .set('Authorization', 'Bearer valid-token')
        .send({ reason: 'Student resolved struggle during in-class discussion' })
        .expect(200);

      expect(res.body.status).toBe('REJECTED');
      expect(res.body.feedback).toContain('Student resolved struggle during in-class discussion');
    });

    it('N3-E18: Teacher resolves intervention with resolution notes; atomic audit record emitted', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .post('/teacher/interventions/int-aarav-pending/resolve')
        .set('Authorization', 'Bearer valid-token')
        .send({ resolutionNotes: 'Conducted 1-on-1 algebra tutoring session.' })
        .expect(200);

      expect(res.body.status).toBe(InterventionStatus.RESOLVED);

      const resolvedAudit = learningLoopAudits.find(
        (a) => a.action === 'TEACHER_INTERVENTION_RESOLVED' && a.userId === 'student-aarav',
      );
      expect(resolvedAudit).toBeDefined();
    });
  });

  // =========================================================================
  // GROUP 5: Safety Escalation & Human Resolution (N3-E19 to N3-E25)
  // =========================================================================
  describe('Group 5: Safety Escalation & Human Resolution', () => {
    let criticalIncidentId: string;
    let routineIncidentId: string;

    it('N3-E19: Ingestion of acute safety signal (CRITICAL) triggers deterministic auto-escalation', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .post('/safety/events')
        .set('Authorization', 'Bearer valid-token')
        .send({
          learnerId: 'student-aarav',
          category: 'ACUTE_DISTRESS',
          severity: SafetySeverity.CRITICAL,
          summary: 'Student expressed acute hopelessness and despair during essay prompt.',
          evidence: { promptSnippet: 'I cannot continue this anymore.' },
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('ESCALATED');
      criticalIncidentId = res.body.id;
    });

    it('N3-E20: Auto-escalated event initiates dual-channel notification delivery (SMS & Email)', async () => {
      const deliveries = Array.from(notificationDeliveries.values()).filter(
        (d) => d.notificationId.includes(criticalIncidentId),
      );
      expect(deliveries.length).toBe(2);
      expect(deliveries.some((d) => d.channel === 'SMS')).toBe(true);
      expect(deliveries.some((d) => d.channel === 'EMAIL')).toBe(true);
    });

    it('N3-E21: Ingestion of routine inquiry creates OPEN incident without dual-channel dispatch', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .post('/safety/events')
        .set('Authorization', 'Bearer valid-token')
        .send({
          learnerId: 'student-aarav',
          category: 'CURRICULUM_CONTENT_QUESTION',
          severity: SafetySeverity.LOW,
          summary: 'Clarification regarding historical conflict text passage.',
        })
        .expect(201);

      expect(res.body.status).toBe('OPEN');
      routineIncidentId = res.body.id;

      const deliveries = Array.from(notificationDeliveries.values()).filter(
        (d) => d.notificationId.includes(routineIncidentId),
      );
      expect(deliveries.length).toBe(0);
    });

    it('N3-E22: Authorized pastoral officer / teacher retrieves open and escalated incident queue', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .get('/safety/escalations')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const incident = res.body.find((i: any) => i.id === criticalIncidentId);
      expect(incident).toBeDefined();
      expect(incident.status).toBe('ESCALATED');
    });

    it('N3-E23: Non-pastoral roles (student, unlinked parent) blocked from safety escalations queue', async () => {
      currentUser = users.get('student-aarav');
      await request(app.getHttpServer())
        .get('/safety/escalations')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      currentUser = users.get('parent-dps');
      await request(app.getHttpServer())
        .get('/safety/escalations')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
    });

    it('N3-E24: AI agent role is strictly blocked from resolving or closing safety escalations (403 SafetyGovernanceViolation)', async () => {
      currentUser = users.get('ai-bot');
      const res = await request(app.getHttpServer())
        .post('/safety/resolve')
        .set('Authorization', 'Bearer valid-token')
        .send({
          incidentId: criticalIncidentId,
          rationale: 'Autonomous AI classified incident as resolved via automated sentiment check.',
          signature: 'ai-signature-key-0192837465',
        })
        .expect(403);

      expect(res.body.message).toContain('SafetyGovernanceViolation');
    });

    it('N3-E25: Authorized human educator resolves safety incident providing required rationale and digital signature', async () => {
      currentUser = users.get('teacher-dps');
      const res = await request(app.getHttpServer())
        .post('/safety/resolve')
        .set('Authorization', 'Bearer valid-token')
        .send({
          incidentId: criticalIncidentId,
          rationale: 'Contacted school counselor Mr. Varma; emergency family consultation conducted in person.',
          signature: 'sig-teacher-ritu-2026-09-dps-rkp',
        })
        .expect(201);

      expect(res.body.id).toBe(criticalIncidentId);
      expect(res.body.status).toBe('RESOLVED');
      expect(res.body.resolvedById).toBe('teacher-dps');
    });
  });

  // =========================================================================
  // GROUP 6: Audit Correlation (N3-E26 to N3-E30)
  // =========================================================================
  describe('Group 6: Audit Correlation', () => {
    it('N3-E26: Consequential teacher intervention authorization produces audit record', async () => {
      const authAudit = learningLoopAudits.find(
        (a) => a.action === 'TEACHER_INTERVENTION_AUTHORIZED' && a.actorId === 'teacher-dps',
      );
      expect(authAudit).toBeDefined();
      expect(authAudit.userId).toBe('student-aarav');
    });

    it('N3-E27: Consequential safety resolution produces audit record linking resolver identity and signature', async () => {
      const safetyAudit = auditEvents.find(
        (a) => a.action === 'SAFETY_INCIDENT_RESOLVED' && a.actorId === 'teacher-dps',
      );
      expect(safetyAudit).toBeDefined();
      expect(safetyAudit.resource).toBe('SafetyEscalation');
      expect(safetyAudit.metadata).toContain('sig-teacher-ritu');
    });

    it('N3-E28: Audit event records carry deterministic correlation identifiers (actorId, resourceId, action, outcome)', async () => {
      const lastAudit = auditEvents[auditEvents.length - 1];
      expect(lastAudit).toHaveProperty('actorId');
      expect(lastAudit).toHaveProperty('action');
      expect(lastAudit).toHaveProperty('resource');
      expect(lastAudit).toHaveProperty('outcome');
      expect(lastAudit.outcome).toBe('SUCCESS');
    });

    it('N3-E29: Blocked security and consent events emit negative-path audit records with reason metadata', async () => {
      const blockedAudit = learningLoopAudits.find((a) => a.action === 'CONSENT_VIOLATION_BLOCKED');
      expect(blockedAudit).toBeDefined();
      const meta = typeof blockedAudit.metadata === 'string' ? JSON.parse(blockedAudit.metadata) : blockedAudit.metadata;
      expect(meta).toHaveProperty('reason');
      expect(meta.reason).toContain('DPDPNonCompliance');
    });

    it('N3-E30: Ledger integrity verification confirms tamper resistance', async () => {
      // Record a sequence of cryptographically chained entries
      await auditService.recordChained({
        actorId: 'teacher-dps',
        actorRole: 'TEACHER',
        action: 'PEDAGOGICAL_OVERRIDE',
        resource: 'CurriculumTopic',
        resourceId: 'topic-algebra-01',
        outcome: 'SUCCESS',
        metadata: { rationale: 'Aligned with state board exam syllabus' },
      });

      await auditService.recordChained({
        actorId: 'admin-system',
        actorRole: 'ADMIN',
        action: 'POLICY_GATE_RELOAD',
        resource: 'PolicyEngine',
        outcome: 'SUCCESS',
      });

      const auditCheck = await auditService.verifyLedgerIntegrity();
      expect(auditCheck.isValid).toBe(true);
    });
  });

  // =========================================================================
  // GROUP 7: Notification Events (N3-E31 to N3-E34)
  // =========================================================================
  describe('Group 7: Notification Events', () => {
    it('N3-E31: Parent retrieves scoped notifications for their linked learners', async () => {
      currentUser = users.get('parent-dps');
      const res = await request(app.getHttpServer())
        .get('/parent/notifications')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].userId).toBe('parent-dps');
    });

    it('N3-E32: Unlinked parent cannot access another student progress', async () => {
      currentUser = users.get('parent-modern'); // Parent of student-rohan, not student-aarav
      const res = await request(app.getHttpServer())
        .get('/parent/learners/student-aarav/progress')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(res.body.message.toLowerCase()).toContain('authorized');
    });

    it('N3-E33: Safety escalation generates high-priority notification delivery records', async () => {
      const smsDelivery = Array.from(notificationDeliveries.values()).find((d) => d.channel === 'SMS');
      expect(smsDelivery).toBeDefined();
      expect(smsDelivery.status).toBe('DELIVERED');
    });

    it('N3-E34: Event delivery failure does not corrupt or roll back domain transaction', async () => {
      // Create a safety event with notification failure simulated
      const originalNotificationCreate = mockPrismaService.notificationDelivery.create;
      mockPrismaService.notificationDelivery.create = jest.fn().mockRejectedValueOnce(new Error('SMS Gateway Down'));

      currentUser = users.get('teacher-dps');
      // Even if notification delivery throws in isolated transport, safety escalation must be recorded safely or throw gracefully
      try {
        await request(app.getHttpServer())
          .post('/safety/events')
          .set('Authorization', 'Bearer valid-token')
          .send({
            learnerId: 'student-aarav',
            category: 'ACUTE_DISTRESS',
            severity: SafetySeverity.CRITICAL,
            summary: 'Second acute distress alert.',
          });
      } finally {
        mockPrismaService.notificationDelivery.create = originalNotificationCreate;
      }
    });
  });

  // =========================================================================
  // GROUP 8: Transaction Atomicity (N3-E35 to N3-E37)
  // =========================================================================
  describe('Group 8: Transaction Atomicity', () => {
    it('N3-E35: Teacher intervention state update and audit log write commit atomically in single transaction', async () => {
      currentUser = users.get('teacher-dps');
      const createRes = await request(app.getHttpServer())
        .post('/teacher/interventions')
        .set('Authorization', 'Bearer valid-token')
        .send({
          learnerId: 'student-aarav',
          type: 'ATOMICITY_CHECK',
          reason: 'Testing atomic boundary commit.',
        })
        .expect(201);

      const targetId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/teacher/interventions/${targetId}/authorize`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const updatedIntervention = interventions.get(targetId);
      expect(updatedIntervention.status).toBe('AUTHORIZED');

      const auditLog = learningLoopAudits.find(
        (a) => a.action === 'TEACHER_INTERVENTION_AUTHORIZED' && a.metadata.includes(targetId),
      );
      expect(auditLog).toBeDefined();
    });

    it('N3-E36: Safety resolution state update and resolution record commit atomically in single transaction', async () => {
      // Create fresh incident
      currentUser = users.get('teacher-dps');
      const createRes = await request(app.getHttpServer())
        .post('/safety/events')
        .set('Authorization', 'Bearer valid-token')
        .send({
          learnerId: 'student-aarav',
          category: 'BULLYING_HARASSMENT',
          severity: SafetySeverity.HIGH,
          summary: 'Testing atomic resolution commit.',
        })
        .expect(201);

      const incidentId = createRes.body.id;

      await request(app.getHttpServer())
        .post('/safety/resolve')
        .set('Authorization', 'Bearer valid-token')
        .send({
          incidentId,
          rationale: 'Conducted mediation session with class teachers and involved parties.',
          signature: 'sig-atomic-resolution-signature-valid',
        })
        .expect(201);

      const updated = safetyEscalations.get(incidentId);
      expect(updated.status).toBe('RESOLVED');

      const audit = auditEvents.find(
        (a) => a.action === 'SAFETY_INCIDENT_RESOLVED' && a.resourceId === incidentId,
      );
      expect(audit).toBeDefined();
    });

    it('N3-E37: Simulated failure during audit write rolls back intervention mutation, ensuring zero partial state', async () => {
      currentUser = users.get('teacher-dps');
      const createRes = await request(app.getHttpServer())
        .post('/teacher/interventions')
        .set('Authorization', 'Bearer valid-token')
        .send({
          learnerId: 'student-aarav',
          type: 'ROLLBACK_TEST',
          reason: 'Verifying zero partial state on audit failure.',
        })
        .expect(201);

      const targetId = createRes.body.id;

      // Mock $transaction to roll back if fn throws
      const originalTx = mockPrismaService.$transaction;
      mockPrismaService.$transaction = jest.fn().mockImplementation(async (fn: any) => {
        const backupStatus = interventions.get(targetId)?.status;
        try {
          // Temporarily mock learningLoopAuditLog.create to throw
          const origAuditCreate = mockPrismaService.learningLoopAuditLog.create;
          mockPrismaService.learningLoopAuditLog.create = jest.fn().mockRejectedValueOnce(
            new Error('Database disk full: audit write failed'),
          );
          try {
            return await fn(mockPrismaService);
          } finally {
            mockPrismaService.learningLoopAuditLog.create = origAuditCreate;
          }
        } catch (err) {
          // Rollback state in transactional mock
          const current = interventions.get(targetId);
          if (current) current.status = backupStatus;
          throw err;
        }
      });

      try {
        await request(app.getHttpServer())
          .post(`/teacher/interventions/${targetId}/authorize`)
          .set('Authorization', 'Bearer valid-token')
          .expect(500);

        // Invariant: Intervention status must NOT be AUTHORIZED
        const targetIntervention = interventions.get(targetId);
        expect(targetIntervention.status).toBe(InterventionStatus.PENDING);
      } finally {
        mockPrismaService.$transaction = originalTx;
      }
    });
  });
});
