import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeAuthorizationService } from '../../auth/services/scope-authorization.service';

/**
 * Lets a teacher set a student's target difficulty for a topic. The next quiz served to
 * the student reads this value, so the override is visible to the student. Every override
 * is recorded as a TeacherIntervention for audit. Later answers adjust the value again.
 */
@Injectable()
export class TeacherDifficultyOverrideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeAuth: ScopeAuthorizationService,
  ) {}

  async override(teacherId: string, studentId: string, topicId: string, value: number, reason: string) {
    if (!(value >= 0.1 && value <= 1.0)) {
      throw new BadRequestException('Difficulty must be between 0.1 and 1.0.');
    }
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is required.');
    }
    await this.scopeAuth.assertTeacherStudentScope(teacherId, studentId);

    const existing = await this.prisma.userTopicMastery.findUnique({
      where: { userId_topicId: { userId: studentId, topicId } },
    });
    const previous = existing ? existing.difficultyState : 0.5;

    if (existing) {
      await this.prisma.userTopicMastery.update({ where: { id: existing.id }, data: { difficultyState: value } });
    } else {
      await this.prisma.userTopicMastery.create({
        data: { userId: studentId, topicId, masteryProbability: 0.1, difficultyState: value },
      });
    }

    await this.prisma.teacherIntervention.create({
      data: {
        teacherId,
        studentId,
        action: 'OVERRIDE',
        overrideDetails: JSON.stringify({ type: 'DIFFICULTY', topicId, previous, forced: value }),
        feedback: reason.trim(),
        status: 'RESOLVED',
      },
    });

    return { studentId, topicId, previous, current: value };
  }
}
