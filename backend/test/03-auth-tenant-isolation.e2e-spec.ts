process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { TenantsModule } from '../src/tenants/tenants.module';
import { TeacherOpsModule } from '../src/teacher-ops/teacher-ops.module';
import { ParentModule } from '../src/parent/parent.module';
import { PracticeModule } from '../src/practice/practice.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { Role } from '../src/auth/role.enum';
import { PrismaService } from '../src/prisma/prisma.service';

describe('N3: Authentication & Multi-Tenant Isolation (E2E HTTP Invariants)', () => {
  let app: INestApplication;
  let currentUser: { id: string; role: Role; name?: string } | null = null;

  // Multi-Tenant Hierarchy State
  const tenants = new Map<string, any>([
    [
      'tenant-dps-rkp',
      {
        id: 'tenant-dps-rkp',
        name: 'Delhi Public School R.K. Puram',
        slug: 'dps-rkp',
        status: 'ACTIVE',
        subscriptionTier: 'ENTERPRISE',
        allowedDomains: JSON.stringify(['dpsrkp.edu.in']),
      },
    ],
    [
      'tenant-modern-vv',
      {
        id: 'tenant-modern-vv',
        name: 'Modern School Vasant Vihar',
        slug: 'modern-vv',
        status: 'ACTIVE',
        subscriptionTier: 'ENTERPRISE',
        allowedDomains: JSON.stringify(['modernschool.edu.in']),
      },
    ],
  ]);

  const tenantMemberships = new Map<string, any>([
    // Tenant A: DPS RKP
    [
      'tenant-dps-rkp:admin-dps',
      {
        id: 'mem-1',
        tenantId: 'tenant-dps-rkp',
        userId: 'admin-dps',
        role: 'TENANT_ADMIN',
        status: 'ACTIVE',
      },
    ],
    [
      'tenant-dps-rkp:teacher-ritu',
      {
        id: 'mem-2',
        tenantId: 'tenant-dps-rkp',
        userId: 'teacher-ritu',
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    ],
    [
      'tenant-dps-rkp:student-aarav',
      {
        id: 'mem-3',
        tenantId: 'tenant-dps-rkp',
        userId: 'student-aarav',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    ],
    // Tenant B: Modern School Vasant Vihar
    [
      'tenant-modern-vv:admin-modern',
      {
        id: 'mem-4',
        tenantId: 'tenant-modern-vv',
        userId: 'admin-modern',
        role: 'TENANT_ADMIN',
        status: 'ACTIVE',
      },
    ],
    [
      'tenant-modern-vv:teacher-anita',
      {
        id: 'mem-5',
        tenantId: 'tenant-modern-vv',
        userId: 'teacher-anita',
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    ],
    [
      'tenant-modern-vv:student-rohan',
      {
        id: 'mem-6',
        tenantId: 'tenant-modern-vv',
        userId: 'student-rohan',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    ],
  ]);

  const users = new Map<string, any>([
    // Tenant A
    [
      'admin-dps',
      { id: 'admin-dps', email: 'admin@dpsrkp.edu.in', role: 'TEACHER', name: 'DPS Admin' },
    ],
    [
      'teacher-ritu',
      { id: 'teacher-ritu', email: 'ritu.sharma@dpsrkp.edu.in', role: 'TEACHER', name: 'Mrs. Ritu Sharma' },
    ],
    [
      'student-aarav',
      { id: 'student-aarav', email: 'aarav@dpsrkp.edu.in', role: 'STUDENT', name: 'Aarav Sharma' },
    ],
    [
      'parent-rajesh',
      { id: 'parent-rajesh', email: 'rajesh.sharma@gmail.com', role: 'PARENT', name: 'Mr. Rajesh Sharma' },
    ],
    // Tenant B
    [
      'admin-modern',
      { id: 'admin-modern', email: 'admin@modernschool.edu.in', role: 'TEACHER', name: 'Modern Admin' },
    ],
    [
      'teacher-anita',
      { id: 'teacher-anita', email: 'anita.verma@modernschool.edu.in', role: 'TEACHER', name: 'Mrs. Anita Verma' },
    ],
    [
      'student-rohan',
      { id: 'student-rohan', email: 'rohan@modernschool.edu.in', role: 'STUDENT', name: 'Rohan Verma' },
    ],
    [
      'parent-sunita',
      { id: 'parent-sunita', email: 'sunita.verma@gmail.com', role: 'PARENT', name: 'Mrs. Sunita Verma' },
    ],
  ]);

  const parentStudentRelations = new Map<string, any>([
    [
      'parent-rajesh:student-aarav',
      { id: 'rel-a', parentId: 'parent-rajesh', studentId: 'student-aarav', status: 'ACTIVE' },
    ],
    [
      'parent-sunita:student-rohan',
      { id: 'rel-b', parentId: 'parent-sunita', studentId: 'student-rohan', status: 'ACTIVE' },
    ],
  ]);

  const teacherClassEnrollments = new Map<string, any>([
    [
      'class-dps-8a:student-aarav',
      { classId: 'class-dps-8a', studentId: 'student-aarav', class: { teacherId: 'teacher-ritu' } },
    ],
    [
      'class-modern-8b:student-rohan',
      { classId: 'class-modern-8b', studentId: 'student-rohan', class: { teacherId: 'teacher-anita' } },
    ],
  ]);

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),

    tenant: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return tenants.get(where.id) || null;
      }),
    },

    tenantMembership: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        const key = `${where.tenantId_userId.tenantId}:${where.tenantId_userId.userId}`;
        return tenantMemberships.get(key) || null;
      }),
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        return Array.from(tenantMemberships.values()).filter((m) => m.userId === where.userId);
      }),
    },

    user: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        const u = users.get(where.id);
        if (!u) return null;
        return {
          ...u,
          stats: { totalXp: 150, currentLevel: 2, currentStreak: 3 },
          topicMastery: [],
          practiceSessions: [],
          mistakeLogs: [],
          cognitiveStateLogs: [],
          studyGoals: [],
          learningEvidenceLogs: [],
          personalizationDecisions: [],
          studentInterventions: [],
          escalationEvents: [],
        };
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        const u = users.get(where.id);
        if (!u) return null;
        return {
          ...u,
          stats: { totalXp: 150, currentLevel: 2, currentStreak: 3 },
          topicMastery: [],
          practiceSessions: [],
          mistakeLogs: [],
          cognitiveStateLogs: [],
          studyGoals: [],
          learningEvidenceLogs: [],
          personalizationDecisions: [],
          studentInterventions: [],
          escalationEvents: [],
        };
      }),
    },

    topic: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'topic-1',
          title: 'Linear Equations in One Variable',
          subject: { name: 'Mathematics' },
          practiceSessions: [{ id: 'sess-1', userId: 'student-aarav', score: 90 }],
          questions: [{ id: 'q1' }],
        },
      ]),
    },

    parentStudent: {
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        if (where.parentId && where.studentId) {
          return parentStudentRelations.get(`${where.parentId}:${where.studentId}`) || null;
        }
        return null;
      }),
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        return Array.from(parentStudentRelations.values()).filter((r) => r.parentId === where.parentId);
      }),
    },

    teacherClassEnrollment: {
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        const all = Array.from(teacherClassEnrollments.values());
        return (
          all.find((e) => {
            if (e.studentId !== where.studentId) return false;
            if (where.class?.teacherId && e.class.teacherId !== where.class.teacherId) return false;
            return true;
          }) || null
        );
      }),
    },

    teacherStudentAssignment: {
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

    practiceSession: {
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        return [{ id: 'sess-1', userId: where.userId, score: 90 }];
      }),
    },

    userTopicMastery: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    mistakeLog: {
      count: jest.fn().mockResolvedValue(0),
    },
    consentRecord: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
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
        TenantsModule,
        TeacherOpsModule,
        ParentModule,
        PracticeModule,
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
    await app.close();
  });

  // =========================================================================
  // 1. STUDENT RESOURCE OWNERSHIP & CROSS-STUDENT BOUNDARIES
  // =========================================================================
  describe('Student Isolation Barrier', () => {
    it('Step 1: Student A successfully accesses own practice tests (200 OK)', async () => {
      currentUser = { id: 'student-aarav', role: Role.STUDENT, name: 'Aarav Sharma' };

      const res = await request(app.getHttpServer())
        .get('/practice/tests')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].id).toBe('topic-1');
    });

    it('Step 2: Student A is strictly forbidden from accessing Teacher Ops endpoints (403 Forbidden)', async () => {
      currentUser = { id: 'student-aarav', role: Role.STUDENT, name: 'Aarav Sharma' };

      await request(app.getHttpServer())
        .get('/teacher/students/student-rohan')
        .expect(403);
    });

    it('Step 3: Student A is strictly forbidden from accessing Parent child endpoints (403 Forbidden)', async () => {
      currentUser = { id: 'student-aarav', role: Role.STUDENT, name: 'Aarav Sharma' };

      await request(app.getHttpServer())
        .get('/parent/children/student-rohan')
        .expect(403);
    });
  });

  // =========================================================================
  // 2. TEACHER INSTRUCTIONAL SCOPE & CROSS-CLASSROOM BOUNDARIES
  // =========================================================================
  describe('Teacher Instructional Scope Barrier', () => {
    it('Step 4: Teacher A (DPS RKP) accesses scoped student Aarav (200 OK)', async () => {
      currentUser = { id: 'teacher-ritu', role: Role.TEACHER, name: 'Mrs. Ritu Sharma' };

      const res = await request(app.getHttpServer())
        .get('/teacher/students/student-aarav')
        .expect(200);

      expect(res.body.studentId).toBe('student-aarav');
      expect(res.body.profile.name).toBe('Aarav Sharma');
    });

    it('Step 5: Teacher A (DPS RKP) is blocked when attempting to access Student B (Modern School) (403 Forbidden)', async () => {
      currentUser = { id: 'teacher-ritu', role: Role.TEACHER, name: 'Mrs. Ritu Sharma' };

      const res = await request(app.getHttpServer())
        .get('/teacher/students/student-rohan')
        .expect(403);

      expect(res.body.message).toContain('Access Denied: Student is outside your authorized instructional scope');
    });
  });

  // =========================================================================
  // 3. MULTI-TENANT INSTITUTIONAL BOUNDARIES
  // =========================================================================
  describe('Tenant Institutional Scope Barrier', () => {
    it('Step 6: Admin A (DPS RKP) accesses own Tenant A metadata (200 OK)', async () => {
      currentUser = { id: 'admin-dps', role: Role.TEACHER, name: 'DPS Admin' };

      const res = await request(app.getHttpServer())
        .get('/tenants/tenant-dps-rkp')
        .set('x-tenant-id', 'tenant-dps-rkp')
        .expect(200);

      expect(res.body.id).toBe('tenant-dps-rkp');
      expect(res.body.name).toBe('Delhi Public School R.K. Puram');
    });

    it('Step 7: Admin A (DPS RKP) is blocked from accessing Tenant B (Modern School) (403 Forbidden)', async () => {
      currentUser = { id: 'admin-dps', role: Role.TEACHER, name: 'DPS Admin' };

      const res = await request(app.getHttpServer())
        .get('/tenants/tenant-modern-vv')
        .set('x-tenant-id', 'tenant-modern-vv')
        .expect(403);

      expect(res.body.message).toContain('User does not hold an active membership in tenant [tenant-modern-vv]');
    });
  });

  // =========================================================================
  // 4. PARENT-CHILD AUTHORIZATION BOUNDARIES
  // =========================================================================
  describe('Parent-Child Authorization Scope Barrier', () => {
    it('Step 8: Parent A accesses authorized child Student A (200 OK)', async () => {
      currentUser = { id: 'parent-rajesh', role: Role.PARENT, name: 'Mr. Rajesh Sharma' };

      const res = await request(app.getHttpServer())
        .get('/parent/children/student-aarav')
        .expect(200);

      expect(res.body.id).toBe('student-aarav');
      expect(res.body.name).toBe('Aarav Sharma');
    });

    it('Step 9: Parent A is blocked from accessing unrelated child Student B (403 Forbidden)', async () => {
      currentUser = { id: 'parent-rajesh', role: Role.PARENT, name: 'Mr. Rajesh Sharma' };

      const res = await request(app.getHttpServer())
        .get('/parent/children/student-rohan')
        .expect(403);

      expect(res.body.message).toContain('Parent is not authorized to access this student');
    });
  });
});
