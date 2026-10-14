import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ERASED, MANUAL_CHECK, lowerFirst } from './erasure-map';

export interface ConsentInput {
  studentId: string;
  guardianName: string;
  guardianRelation: string;
  formVersion: string;
  signedAt: Date;
  notes?: string;
}

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  /** True when consent enforcement is on (default). Set REQUIRE_CONSENT=false only for local development. */
  enforcementEnabled(): boolean {
    return (process.env.REQUIRE_CONSENT ?? 'true').toLowerCase() !== 'false';
  }

  async record(recordedById: string, input: ConsentInput) {
    const student = await this.prisma.user.findUnique({ where: { id: input.studentId } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.role !== 'STUDENT') throw new BadRequestException('Consent can only be recorded for a student account.');
    if (input.signedAt.getTime() > Date.now() + 24 * 3600 * 1000) {
      throw new BadRequestException('The signing date cannot be in the future.');
    }
    return this.prisma.consentRecord.create({ data: { ...input, recordedById } });
  }

  async hasActiveConsent(studentId: string): Promise<boolean> {
    const rows = await this.prisma.consentRecord.findMany({ where: { studentId, revokedAt: null } });
    return rows.length > 0;
  }

  /** Throws 403 when the student has no active consent record (and enforcement is on). */
  async assertActiveConsent(studentId: string) {
    if (!this.enforcementEnabled()) return;
    if (!(await this.hasActiveConsent(studentId))) {
      throw new ForbiddenException('A parent/guardian consent record is required before this student can practise.');
    }
  }

  list(studentId: string) {
    return this.prisma.consentRecord.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
  }

  async revoke(revokedById: string, studentId: string) {
    const active = await this.prisma.consentRecord.findMany({ where: { studentId, revokedAt: null } });
    if (active.length === 0) throw new NotFoundException('No active consent to revoke.');
    const now = new Date();
    for (const r of active) {
      await this.prisma.consentRecord.update({ where: { id: r.id }, data: { revokedAt: now, revokedById } });
    }
    return { revoked: active.length };
  }

  /**
   * Withdrawal + erasure. Refuses (changing nothing) if the student has rows in tables the MVP does not use,
   * so nothing is silently left behind. Otherwise deletes the learning data, anonymises the account,
   * revokes consent, and keeps only the consent record as proof.
   */
  async eraseStudent(erasedById: string, studentId: string) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.role !== 'STUDENT') throw new BadRequestException('Only student accounts can be erased with this operation.');

    const blocking: { model: string; rows: number }[] = [];
    for (const rule of MANUAL_CHECK) {
      const rows = await (this.prisma as any)[lowerFirst(rule.model)].count({ where: { [rule.field]: studentId } });
      if (rows > 0) blocking.push({ model: rule.model, rows });
    }
    if (blocking.length > 0) {
      throw new ConflictException({
        message: 'Erasure stopped: this student has data in tables that need manual handling. Nothing was deleted.',
        tables: blocking,
      });
    }

    const now = new Date();
    const ops: any[] = [];
    const db = this.prisma as any;
    // Answers hang off the student's practice sessions.
    ops.push(db.userAnswer.deleteMany({ where: { session: { userId: studentId } } }));
    for (const rule of ERASED) ops.push(db[lowerFirst(rule.model)].deleteMany({ where: { [rule.field]: studentId } }));
    ops.push(
      db.user.update({
        where: { id: studentId },
        data: {
          name: 'Withdrawn student',
          email: `withdrawn-${studentId}@invalid.example`,
          password: 'ERASED',
          avatarUrl: null,
          gradeLevel: null,
        },
      }),
    );
    ops.push(db.consentRecord.updateMany({ where: { studentId, revokedAt: null }, data: { revokedAt: now, revokedById: erasedById } }));
    ops.push(db.consentRecord.updateMany({ where: { studentId }, data: { erasedAt: now } }));

    await this.prisma.$transaction(ops);
    return { studentId, erasedAt: now.toISOString(), deletedFrom: ['UserAnswer', ...ERASED.map((r) => r.model)] };
  }
}
