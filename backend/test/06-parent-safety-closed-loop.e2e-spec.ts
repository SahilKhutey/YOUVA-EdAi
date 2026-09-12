process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { SafetyModule } from '../src/safety/safety.module';
import { ParentModule } from '../src/parent/parent.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { Role } from '../src/auth/role.enum';
import { PrismaService } from '../src/prisma/prisma.service';
import { SafetySeverity } from '../src/safety/safety-policy.service';

describe('N6: Parent Access & Safety Escalation Closed-Loop (E2E HTTP Invariants)', () => {
  let app: INestApplication;
  let currentUser: { id: string; role: string; name?: string } | null = null;

  // In-Memory Database Simulation
  const users = new Map<string, any>([
    [
      'parent-dps-01',
      {
        id: 'parent-dps-01',
        email: 'rajesh.sharma@dpsrkp-parents.edu.in',
        name: 'Mr. Rajesh Sharma',
        role: Role.PARENT,
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
        cognitiveLevel: 'PROFICIENT',
        avatarUrl: '/avatars/aarav.png',
        stats: {
          totalXp: 450,
          currentLevel: 4,
          currentStreak: 5,
        },
        topicMastery: [
          {
            masteryProbability: 0.85,
            difficultyState: 'INTERMEDIATE',
            lastReviewed: new Date(),
            topic: {
              id: 'topic-lineq',
              title: 'Linear Equations in One Variable',
              subject: { name: 'Mathematics' },
            },
          },
        ],
      },
    ],
    [
      'parent-modern-01',
      {
        id: 'parent-modern-01',
        email: 'sunita.verma@modern-parents.edu.in',
        name: 'Mrs. Sunita Verma',
        role: Role.PARENT,
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
        cognitiveLevel: 'INTERMEDIATE',
        avatarUrl: '/avatars/rohan.png',
        stats: {
          totalXp: 310,
          currentLevel: 3,
          currentStreak: 2,
        },
        topicMastery: [],
      },
    ],
    [
      'teacher-ritu',
      {
        id: 'teacher-ritu',
        email: 'ritu.sharma@dpsrkp.edu.in',
        name: 'Mrs. Ritu Sharma',
        role: Role.TEACHER,
      },
    ],
    [
      'ai-safety-bot',
      {
        id: 'ai-safety-bot',
        email: 'bot@youva.ai',
        name: 'Automated Safeguarding Bot',
        role: 'AI',
      },
    ],
  ]);

  const parentStudentRelations = new Map<string, any>([
    [
      'parent-dps-01:student-aarav',
      { id: 'rel-1', parentId: 'parent-dps-01', studentId: 'student-aarav', status: 'ACTIVE' },
    ],
    [
      'parent-modern-01:student-rohan',
      { id: 'rel-2', parentId: 'parent-modern-01', studentId: 'student-rohan', status: 'ACTIVE' },
    ],
  ]);

  const incidents = new Map<string, any>();
  const deliveries = new Map<string, any>();

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
    parentStudent: {
      findFirst: jest.fn().mockImplementation(({ where }: { where: any }) => {
        for (const rel of parentStudentRelations.values()) {
          let match = true;
          if (where.parentId && rel.parentId !== where.parentId) match = false;
          if (where.studentId && rel.studentId !== where.studentId) match = false;
          if (where.status && rel.status !== where.status) match = false;
          if (match) return Promise.resolve(rel);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: { where: any }) => {
        const results = [];
        for (const rel of parentStudentRelations.values()) {
          if (where.parentId && rel.parentId !== where.parentId) continue;
          if (where.status && rel.status !== where.status) continue;
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
    },
    safetyEscalation: {
      create: jest.fn().mockImplementation(({ data }: { data: any }) => {
        const id = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const record = { id, ...data, createdAt: new Date() };
        incidents.set(id, record);
        return Promise.resolve(record);
      }),
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        return Promise.resolve(incidents.get(where.id) || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: { where?: any }) => {
        const results = [];
        for (const inc of incidents.values()) {
          if (where?.status?.in && !where.status.in.includes(inc.status)) continue;
          results.push({
            ...inc,
            student: users.get(inc.studentId) || { id: inc.studentId, name: 'Unknown', email: '' },
          });
        }
        return Promise.resolve(results);
      }),
      update: jest.fn().mockImplementation(({ where, data }: { where: { id: string }; data: any }) => {
        const inc = incidents.get(where.id);
        if (!inc) return Promise.resolve(null);
        const updated = { ...inc, ...data };
        incidents.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    notificationDelivery: {
      create: jest.fn().mockImplementation(({ data }: { data: any }) => {
        const id = `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const record = { id, ...data };
        deliveries.set(id, record);
        return Promise.resolve(record);
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        SafetyModule,
        ParentModule,
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
          const handler = context.getHandler();
          const classTarget = context.getClass();
          // Reflect metadata for roles
          const roles = Reflect.getMetadata('roles', handler) || Reflect.getMetadata('roles', classTarget);
          if (!roles || roles.length === 0) return true;
          return roles.includes(currentUser.role);
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

  let criticalIncidentId: string;
  let routineIncidentId: string;

  // =========================================================================
  // Step 1: Critical Safety Incident Ingestion with Dual-Channel Dispatch
  // =========================================================================
  it('Step 1: Report acute distress incident and verify automated SMS & Email dual dispatch', async () => {
    currentUser = users.get('teacher-ritu');

    const res = await request(app.getHttpServer())
      .post('/safety/report')
      .send({
        studentId: 'student-aarav',
        category: 'SELF_HARM',
        summary: 'Student expressed acute feelings of hopelessness in reflective notes.',
        severity: SafetySeverity.CRITICAL,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.severity).toBe('CRITICAL');
    expect(res.body.status).toBe('ESCALATED');
    criticalIncidentId = res.body.id;

    // Verify dual-channel dispatch delivery records created
    const deliveryList = Array.from(deliveries.values());
    const sms = deliveryList.find(
      (d) => d.notificationId === `notif-sms-${criticalIncidentId}` && d.channel === 'SMS',
    );
    const email = deliveryList.find(
      (d) => d.notificationId === `notif-email-${criticalIncidentId}` && d.channel === 'EMAIL',
    );

    expect(sms).toBeDefined();
    expect(sms.status).toBe('DELIVERED');
    expect(email).toBeDefined();
    expect(email.status).toBe('DELIVERED');
  });

  // =========================================================================
  // Step 2: Routine Safety Incident (No Dual Emergency Dispatch)
  // =========================================================================
  it('Step 2: Report routine academic inquiry without triggering emergency multi-channel dispatch', async () => {
    currentUser = users.get('teacher-ritu');
    deliveries.clear();

    const res = await request(app.getHttpServer())
      .post('/safety/report')
      .send({
        studentId: 'student-aarav',
        category: 'ACADEMIC_ANXIETY',
        summary: 'Student feeling nervous before upcoming mid-term math assessment.',
        severity: SafetySeverity.LOW,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('OPEN');
    routineIncidentId = res.body.id;

    // Confirm NO emergency SMS/email dual dispatch was triggered
    expect(deliveries.size).toBe(0);
  });

  // =========================================================================
  // Step 3: Pastoral Incident Queue Query (Educator Access)
  // =========================================================================
  it('Step 3: Authorized teacher/pastoral lead retrieves open and escalated incident queue', async () => {
    currentUser = users.get('teacher-ritu');

    const res = await request(app.getHttpServer())
      .get('/safety/incidents')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const target = res.body.find((i: any) => i.id === criticalIncidentId);
    expect(target).toBeDefined();
    expect(target.studentId).toBe('student-aarav');
    expect(target.student.name).toBe('Aarav Sharma');
  });

  // =========================================================================
  // Step 4: Access Barrier — Student blocked from safety queue (403 Forbidden)
  // =========================================================================
  it('Step 4: Student attempting to query pastoral safety queue is rejected with 403', async () => {
    currentUser = users.get('student-aarav');

    await request(app.getHttpServer())
      .get('/safety/incidents')
      .expect(403);
  });

  // =========================================================================
  // Step 5: Access Barrier — Parent blocked from safety queue (403 Forbidden)
  // =========================================================================
  it('Step 5: Parent attempting to query full school incident queue is rejected with 403', async () => {
    currentUser = users.get('parent-dps-01');

    await request(app.getHttpServer())
      .get('/safety/incidents')
      .expect(403);
  });

  // =========================================================================
  // Step 6: Parent Portal Progress & Privacy (200 OK)
  // =========================================================================
  it('Step 6: Authorized Parent accesses child overview without leaking raw AI prompt telemetry', async () => {
    currentUser = users.get('parent-dps-01');

    const res = await request(app.getHttpServer())
      .get('/parent/children/student-aarav')
      .expect(200);

    expect(res.body.id).toBe('student-aarav');
    expect(res.body.name).toBe('Aarav Sharma');
    expect(res.body.stats.totalXp).toBe(450);
    expect(res.body.topicMastery.length).toBeGreaterThan(0);

    // Verify privacy: No internal safety incident records or classifier scores exposed in child view
    expect(res.body).not.toHaveProperty('escalationEvents');
    expect(res.body).not.toHaveProperty('rawClassifierScore');
  });

  // =========================================================================
  // Step 7: Cross-Parent Isolation Barrier (403 Forbidden)
  // =========================================================================
  it('Step 7: Parent B is strictly blocked from accessing Parent A child progress', async () => {
    currentUser = users.get('parent-modern-01'); // Parent of Rohan, not Aarav

    await request(app.getHttpServer())
      .get('/parent/children/student-aarav')
      .expect(403);
  });

  // =========================================================================
  // Step 8: Safety Governance Invariant — AI Bot Blocked from Resolution (403)
  // =========================================================================
  it('Step 8: AI system is strictly prohibited from resolving safety incidents (SafetyGovernanceViolation)', async () => {
    currentUser = users.get('ai-safety-bot');

    await request(app.getHttpServer())
      .post('/safety/resolve')
      .send({
        incidentId: criticalIncidentId,
        rationale: 'Automated AI closing: distress markers dropped below threshold.',
        signature: 'AI_AGENT_AUTONOMOUS_KEY_SIGNATURE_2026',
      })
      .expect(403);
  });

  // =========================================================================
  // Step 9: Rejection on Insufficient Rationale (< 10 chars) (400 Bad Request)
  // =========================================================================
  it('Step 9: Reject incident resolution when safeguarding rationale is under 10 characters', async () => {
    currentUser = users.get('teacher-ritu');

    await request(app.getHttpServer())
      .post('/safety/resolve')
      .send({
        incidentId: criticalIncidentId,
        rationale: 'Resolved', // < 10 chars
        signature: 'CRYPTO_SIG_HUMAN_EDUCATOR_RITU_12345',
      })
      .expect(400);
  });

  // =========================================================================
  // Step 10: Rejection on Short Signature (< 16 chars) (400 Bad Request)
  // =========================================================================
  it('Step 10: Reject incident resolution when digital signature is under 16 characters', async () => {
    currentUser = users.get('teacher-ritu');

    await request(app.getHttpServer())
      .post('/safety/resolve')
      .send({
        incidentId: criticalIncidentId,
        rationale: 'Met with student and pastoral team; student is stable and supported.',
        signature: 'short-sig', // < 16 chars
      })
      .expect(400);
  });

  // =========================================================================
  // Step 11: Authorized Human Educator Resolves Incident (200 OK)
  // =========================================================================
  it('Step 11: Authorized human educator resolves incident with rationale & cryptographic signature', async () => {
    currentUser = users.get('teacher-ritu');

    const res = await request(app.getHttpServer())
      .post('/safety/resolve')
      .send({
        incidentId: criticalIncidentId,
        rationale: 'Completed 1-on-1 counseling session with parents present; support plan active.',
        signature: 'ED_SIG_RITU_SHARMA_DPS_RKP_2026_VERIFIED',
      })
      .expect(201);

    expect(res.body.id).toBe(criticalIncidentId);
    expect(res.body.status).toBe('RESOLVED');
    expect(res.body.resolvedById).toBe('teacher-ritu');

    const resolutionDetails = JSON.parse(res.body.resolution);
    expect(resolutionDetails.signature).toBe('ED_SIG_RITU_SHARMA_DPS_RKP_2026_VERIFIED');
    expect(resolutionDetails.rationale).toContain('Completed 1-on-1 counseling session');
  });
});
