import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeAuthorizationService } from '../../auth/services/scope-authorization.service';
import { AssignContentDto } from '../dto/assign-content.dto';

@Injectable()
export class TeacherContentOpsService {
  private readonly logger = new Logger(TeacherContentOpsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scopeAuth: ScopeAuthorizationService,
  ) {}

  /**
   * Retrieves all content units authored by or available to teacher.
   */
  async getTeacherContent(teacherId: string) {
    return this.prisma.generatedContent.findMany({
      where: { teacherId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        assignments: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Publishes content and snapshots the first formal version.
   */
  async publishContent(teacherId: string, contentId: string) {
    const content = await this.prisma.generatedContent.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found.`);
    }

    if (content.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to publish content created by another author.');
    }

    // Create Version 1 snapshot
    await this.prisma.contentVersion.create({
      data: {
        contentId,
        versionNumber: 1,
        data: JSON.stringify({
          learningObjective: content.learningObjective,
          content: content.content,
          bloomsLevel: content.bloomsTaxonomyLevel,
          difficulty: content.difficulty,
        }),
        authorId: teacherId,
      },
    });

    return this.prisma.generatedContent.update({
      where: { id: contentId },
      data: { status: 'PUBLISHED' },
    });
  }

  /**
   * Updates content and preserves audit version history.
   * Hard Invariant: Published content cannot be silently mutated without a version snapshot!
   */
  async updateContentWithVersion(teacherId: string, contentId: string, updatedContentText: string) {
    const content = await this.prisma.generatedContent.findUnique({
      where: { id: contentId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found.`);
    }

    if (content.teacherId !== teacherId) {
      throw new ForbiddenException('Unauthorized: You cannot modify content you did not author.');
    }

    const nextVersionNumber = (content.versions[0]?.versionNumber || 0) + 1;

    // Snapshot existing version
    await this.prisma.contentVersion.create({
      data: {
        contentId,
        versionNumber: nextVersionNumber,
        data: JSON.stringify({ content: updatedContentText }),
        authorId: teacherId,
      },
    });

    return this.prisma.generatedContent.update({
      where: { id: contentId },
      data: {
        content: updatedContentText,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Assigns content to a student or class cohort.
   * Strict Rule: Draft content CANNOT be assigned! Must be PUBLISHED.
   */
  async assignContent(teacherId: string, dto: AssignContentDto) {
    const content = await this.prisma.generatedContent.findUnique({
      where: { id: dto.contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content ${dto.contentId} not found.`);
    }

    if (content.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Cannot assign content in '${content.status}' status. Content must be reviewed and PUBLISHED before assignment.`,
      );
    }

    // Verify Scope
    if (dto.studentId) {
      await this.scopeAuth.assertTeacherStudentScope(teacherId, dto.studentId);
    }

    if (dto.classId) {
      await this.scopeAuth.assertTeacherClassScope(teacherId, dto.classId);
    }

    if (!dto.studentId && !dto.classId) {
      throw new BadRequestException('Either studentId or classId must be provided for content assignment.');
    }

    const assignment = await this.prisma.contentAssignment.create({
      data: {
        contentId: dto.contentId,
        studentId: dto.studentId || null,
        classId: dto.classId || null,
        teacherId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: 'ASSIGNED',
      },
    });

    this.logger.log(`Teacher ${teacherId} assigned content ${dto.contentId} to student=${dto.studentId || 'N/A'}, class=${dto.classId || 'N/A'}`);

    return assignment;
  }
}
