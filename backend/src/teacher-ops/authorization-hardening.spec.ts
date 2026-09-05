import { Test, TestingModule } from '@nestjs/testing';
import { ScopeAuthorizationService } from '../auth/services/scope-authorization.service';
import { ResourceScopeGuard } from '../auth/guards/resource-scope.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('P2 Authorization Hardening & Resource Scoping', () => {
  let scopeAuthService: ScopeAuthorizationService;
  let resourceScopeGuard: ResourceScopeGuard;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      teacherStudentAssignment: { findFirst: jest.fn(), findMany: jest.fn() },
      teacherClassEnrollment: { findFirst: jest.fn(), findMany: jest.fn() },
      digitalClassroomSession: { findFirst: jest.fn(), findMany: jest.fn() },
      worksheetSubmission: { findFirst: jest.fn(), findMany: jest.fn() },
      teacherClass: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScopeAuthorizationService,
        ResourceScopeGuard,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    scopeAuthService = module.get<ScopeAuthorizationService>(ScopeAuthorizationService);
    resourceScopeGuard = module.get<ResourceScopeGuard>(ResourceScopeGuard);
  });

  describe('Teacher-Student Scoping', () => {
    it('✓ teacher cannot access unrelated student (returns 403 Forbidden)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'teacher-a', role: 'TEACHER' });
      prisma.teacherStudentAssignment.findFirst.mockResolvedValue(null);
      prisma.teacherClassEnrollment.findFirst.mockResolvedValue(null);
      prisma.digitalClassroomSession.findFirst.mockResolvedValue(null);
      prisma.worksheetSubmission.findFirst.mockResolvedValue(null);

      await expect(
        scopeAuthService.assertTeacherStudentScope('teacher-a', 'student-z'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('✓ teacher CAN access student linked by direct assignment', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'teacher-a', role: 'TEACHER' });
      prisma.teacherStudentAssignment.findFirst.mockResolvedValue({ id: 'assign-1', isActive: true });

      await expect(
        scopeAuthService.assertTeacherStudentScope('teacher-a', 'student-x'),
      ).resolves.toBe(true);
    });

    it('✓ teacher CAN access student enrolled in teacher class cohort', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'teacher-a', role: 'TEACHER' });
      prisma.teacherStudentAssignment.findFirst.mockResolvedValue(null);
      prisma.teacherClassEnrollment.findFirst.mockResolvedValue({ id: 'enroll-1' });

      await expect(
        scopeAuthService.assertTeacherStudentScope('teacher-a', 'student-y'),
      ).resolves.toBe(true);
    });

    it('✓ admin can access authorized administration resources organization-wide', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

      await expect(
        scopeAuthService.assertTeacherStudentScope('admin-1', 'any-student'),
      ).resolves.toBe(true);
    });

    it('✓ missing teacher throws NotFoundException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        scopeAuthService.assertTeacherStudentScope('teacher-ghost', 'student-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('ResourceScopeGuard Execution', () => {
    it('✓ student cannot access resources belonging to another student', async () => {
      const mockExecutionContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'student-1', role: 'STUDENT' },
            params: { id: 'student-2' },
          }),
        }),
      };

      await expect(resourceScopeGuard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('✓ student CAN access their own student resources', async () => {
      const mockExecutionContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'student-1', role: 'STUDENT' },
            params: { id: 'student-1' },
          }),
        }),
      };

      await expect(resourceScopeGuard.canActivate(mockExecutionContext)).resolves.toBe(true);
    });
  });
});
