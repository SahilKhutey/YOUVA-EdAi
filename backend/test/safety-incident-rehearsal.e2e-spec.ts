process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { SafetyModule } from '../src/safety/safety.module';
import { SafetyEscalationService } from '../src/safety/safety-escalation.service';
import { SafetyPolicyService, SafetySeverity } from '../src/safety/safety-policy.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { RolesGuard } from '../src/auth/roles.guard';
import { Role } from '../src/auth/role.enum';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Safety Incident Rehearsal (E2E Integration & Governance)', () => {
  let app: INestApplication;
  let safetyEscalationService: SafetyEscalationService;
  let currentUser: { id: string; role: Role; name?: string };

  // In-memory mock database state for rehearsal simulation
  const incidents: Map<string, any> = new Map();
  const deliveryRecords: any[] = [];
  let incidentCounter = 1;

  const mockPrisma = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
    safetyEscalation: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const id = `inc-${incidentCounter++}`;
        const record = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        incidents.set(id, record);
        return record;
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return incidents.get(where.id) || null;
      }),
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        const all = Array.from(incidents.values());
        if (!where || !where.status) return all;
        const allowedStatuses = where.status.in || [where.status];
        return all.filter((inc) => allowedStatuses.includes(inc.status));
      }),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const existing = incidents.get(where.id);
        if (!existing) return null;
        const updated = { ...existing, ...data };
        incidents.set(where.id, updated);
        return updated;
      }),
    },
    notificationDelivery: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const record = { id: `deliv-${deliveryRecords.length + 1}`, ...data };
        deliveryRecords.push(record);
        return record;
      }),
    },
  };

  beforeAll(async () => {
    const mockJwtGuard = {
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        req.user = currentUser;
        return true;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SafetyModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    safetyEscalationService = moduleFixture.get<SafetyEscalationService>(SafetyEscalationService);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Default user: Teacher
    currentUser = {
      id: 'teacher-user-1',
      role: Role.TEACHER,
      name: 'Ms. Sharma (Safeguarding Lead)',
    };
  });

  // =========================================================================
  // 1. DISTRESS INCIDENT INGESTION & AUTOMATED MULTI-CHANNEL DISPATCH
  // =========================================================================
  describe('Phase 1: Distress Incident Ingestion & Escalation Dispatch', () => {
    it('should report acute self-harm distress, escalate status, and trigger dual-channel notifications (SMS + Email)', async () => {
      const initialDeliveryCount = deliveryRecords.length;

      const res = await request(app.getHttpServer())
        .post('/safety/report')
        .send({
          studentId: 'student-cbse-101',
          category: 'SUICIDE_SELF_HARM',
          summary: 'Student expressed acute feelings of despair during revision chat session.',
          metadata: { sessionId: 'sess-math-linear-8' },
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.category).toBe('SUICIDE_SELF_HARM');
      expect(res.body.severity).toBe(SafetySeverity.CRITICAL);
      expect(res.body.status).toBe('ESCALATED');

      // Verify that dual-channel delivery records (SMS + Email) were generated
      const createdDeliveries = deliveryRecords.slice(initialDeliveryCount);
      expect(createdDeliveries).toHaveLength(2);
      const channels = createdDeliveries.map((d) => d.channel);
      expect(channels).toContain('SMS');
      expect(channels).toContain('EMAIL');
      expect(createdDeliveries[0].status).toBe('DELIVERED');
    });

    it('should report high-severity bullying incident and trigger dual dispatch', async () => {
      const initialDeliveryCount = deliveryRecords.length;

      const res = await request(app.getHttpServer())
        .post('/safety/report')
        .send({
          studentId: 'student-cbse-102',
          category: 'CYBER_BULLYING',
          summary: 'Targeted harassment detected in discussion forum thread.',
        })
        .expect(201);

      expect(res.body.severity).toBe(SafetySeverity.HIGH);
      expect(res.body.status).toBe('ESCALATED');

      const createdDeliveries = deliveryRecords.slice(initialDeliveryCount);
      expect(createdDeliveries).toHaveLength(2);
      expect(createdDeliveries.map((d) => d.channel)).toEqual(
        expect.arrayContaining(['SMS', 'EMAIL']),
      );
    });

    it('should report low-severity general inquiry with OPEN status and NO automated dual dispatch', async () => {
      const initialDeliveryCount = deliveryRecords.length;

      const res = await request(app.getHttpServer())
        .post('/safety/report')
        .send({
          studentId: 'student-cbse-103',
          category: 'GENERAL_SYSTEM_FEEDBACK',
          summary: 'Student asked about holiday schedule.',
        })
        .expect(201);

      expect(res.body.severity).toBe(SafetySeverity.LOW);
      expect(res.body.status).toBe('OPEN');

      // No SMS/Email dispatch for routine low-severity tickets
      const newDeliveries = deliveryRecords.slice(initialDeliveryCount);
      expect(newDeliveries).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. INCIDENT QUEUE REVIEW & ACCESS CONTROL
  // =========================================================================
  describe('Phase 2: Incident Queue Review & Role Guards', () => {
    it('should allow authorized TEACHER to view open safety incidents', async () => {
      currentUser = { id: 'teacher-1', role: Role.TEACHER };

      const res = await request(app.getHttpServer())
        .get('/safety/incidents')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body.some((i: any) => i.status === 'ESCALATED')).toBe(true);
    });

    it('should allow authorized ADMIN to view open safety incidents', async () => {
      currentUser = { id: 'admin-1', role: Role.ADMIN };

      const res = await request(app.getHttpServer())
        .get('/safety/incidents')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should strictly BLOCK unprivileged STUDENT from reading incident queues (403 Forbidden)', async () => {
      currentUser = { id: 'student-attacker', role: Role.STUDENT };

      await request(app.getHttpServer())
        .get('/safety/incidents')
        .expect(403);
    });
  });

  // =========================================================================
  // 3. STRICT GOVERNANCE INVARIANT: HUMAN-AUTHORIZED RESOLUTION ONLY
  // =========================================================================
  describe('Phase 3: Strict Governance Invariant — Incident Resolution', () => {
    let testIncidentId: string;

    beforeEach(async () => {
      // Create a fresh incident for resolution tests
      const created = await safetyEscalationService.reportIncident({
        studentId: 'student-rehearsal-99',
        category: 'ACUTE_DISTRESS',
        summary: 'Critical rehearsal incident for resolution testing',
        severity: SafetySeverity.CRITICAL,
      });
      testIncidentId = created.id;
    });

    it('INVARIANT: AI systems, bots, and background daemons are STRICTLY PROHIBITED from closing safety incidents', async () => {
      // Attempt 1: role = 'AI'
      await expect(
        safetyEscalationService.resolveIncident({
          incidentId: testIncidentId,
          actor: { userId: 'ai-mentor-agent-01', role: 'AI', name: 'Youva Autonomous Socratic Agent' },
          rationale: 'AI analyzed student sentiment and classified distress as resolved.',
          signature: 'AI_SIG_CANNOT_AUTHORIZE_HUMAN_SAFETY_9999',
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'SafetyGovernanceViolation: AI systems are strictly prohibited from closing safety incidents',
        ),
      );

      // Attempt 2: role = 'BOT'
      await expect(
        safetyEscalationService.resolveIncident({
          incidentId: testIncidentId,
          actor: { userId: 'bot-daemon-01', role: 'BOT', name: 'Auto-Closer Bot' },
          rationale: 'Automated 24h timeout auto-resolution trigger.',
          signature: 'BOT_SIG_AUTO_RESOLUTION_INVALID_0000',
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'SafetyGovernanceViolation: AI systems are strictly prohibited from closing safety incidents',
        ),
      );

      // Attempt 3: role = 'SYSTEM'
      await expect(
        safetyEscalationService.resolveIncident({
          incidentId: testIncidentId,
          actor: { userId: 'system-cron', role: 'SYSTEM' },
          rationale: 'System auto-maintenance script triggered closure.',
          signature: 'SYS_SIG_DAEMON_OVERRIDE_PREVENTED_1111',
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'SafetyGovernanceViolation: AI systems are strictly prohibited from closing safety incidents',
        ),
      );
    });

    it('should reject resolution attempt by STUDENT via HTTP endpoint with 403 Forbidden', async () => {
      currentUser = { id: 'student-malicious', role: Role.STUDENT };

      await request(app.getHttpServer())
        .post('/safety/resolve')
        .send({
          incidentId: testIncidentId,
          rationale: 'I feel fine now, please close this incident.',
          signature: 'STUDENT_SIG_ATTEMPTED_BYPASS_123456',
        })
        .expect(403);
    });

    it('should reject resolution with short rationale (< 10 characters) with 400 Bad Request', async () => {
      currentUser = { id: 'teacher-1', role: Role.TEACHER, name: 'Teacher Sharma' };

      const res = await request(app.getHttpServer())
        .post('/safety/resolve')
        .send({
          incidentId: testIncidentId,
          rationale: 'Resolved', // 8 chars (< 10)
          signature: 'TEACHER_VALID_SIGNATURE_2026_ABCD',
        })
        .expect(400);

      expect(res.body.message).toContain('minimum 10 characters');
    });

    it('should reject resolution with short digital signature (< 16 characters) with 400 Bad Request', async () => {
      currentUser = { id: 'teacher-1', role: Role.TEACHER, name: 'Teacher Sharma' };

      const res = await request(app.getHttpServer())
        .post('/safety/resolve')
        .send({
          incidentId: testIncidentId,
          rationale: 'Spoke directly with parents and school counselor; student is safe and in class.',
          signature: 'short-sig-123', // 13 chars (< 16)
        })
        .expect(400);

      expect(res.body.message).toContain('minimum 16 characters');
    });

    it('should successfully authorize and resolve incident when verified human educator provides compliant rationale and signature', async () => {
      currentUser = {
        id: 'teacher-safeguard-lead',
        role: Role.TEACHER,
        name: 'Mrs. Ananya Sen (Head of Pastoral Care)',
      };

      const rationaleText = 'In-person meeting conducted with student and parents. Counselor plan active.';
      const signatureText = 'DPS_RKP_SAFEGUARD_AUTH_2026_AS_9841';

      const res = await request(app.getHttpServer())
        .post('/safety/resolve')
        .send({
          incidentId: testIncidentId,
          rationale: rationaleText,
          signature: signatureText,
        })
        .expect(201);

      expect(res.body.status).toBe('RESOLVED');
      expect(res.body.resolvedById).toBe('teacher-safeguard-lead');

      const parsedResolution = JSON.parse(res.body.resolution);
      expect(parsedResolution.rationale).toBe(rationaleText);
      expect(parsedResolution.signature).toBe(signatureText);
      expect(parsedResolution.resolvedByName).toBe('Mrs. Ananya Sen (Head of Pastoral Care)');
      expect(parsedResolution).toHaveProperty('resolvedAt');

      // Verify state in mock database was actually updated
      const persisted = incidents.get(testIncidentId);
      expect(persisted.status).toBe('RESOLVED');
      expect(persisted.resolvedById).toBe('teacher-safeguard-lead');
    });

    it('should return 404 Not Found when attempting to resolve a non-existent incident', async () => {
      currentUser = { id: 'teacher-1', role: Role.TEACHER };

      await request(app.getHttpServer())
        .post('/safety/resolve')
        .send({
          incidentId: 'non-existent-uuid-999999',
          rationale: 'Valid rationale for missing incident',
          signature: 'VALID_CRYPTOGRAPHIC_SIGNATURE_2026_XYZ',
        })
        .expect(404);
    });
  });
});
