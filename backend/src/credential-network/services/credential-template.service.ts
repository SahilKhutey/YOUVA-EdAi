import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { meetsTemplateCriteria } from '../domain/credential-eligibility';

@Injectable()
export class CredentialTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates or updates an institutional credential template.
   */
  async createTemplate(data: {
    tenantId?: string;
    key: string;
    title: string;
    description?: string;
    credentialType: string;
    criteria: Record<string, any>;
    skillIds: string[];
    curriculum?: Record<string, any>;
    minimumMastery?: number;
    minimumEvidence?: number;
    requiresTeacher?: boolean;
  }) {
    const prismaClient = this.prisma as any;

    return prismaClient.credentialTemplate.create({
      data: {
        tenantId: data.tenantId ?? null,
        key: data.key,
        title: data.title,
        description: data.description ?? null,
        credentialType: data.credentialType,
        criteriaJson: JSON.stringify(data.criteria),
        skillIdsJson: JSON.stringify(data.skillIds),
        curriculumJson: data.curriculum ? JSON.stringify(data.curriculum) : null,
        minimumMastery: data.minimumMastery ?? null,
        minimumEvidence: data.minimumEvidence ?? null,
        requiresTeacher: data.requiresTeacher ?? true,
        active: true,
        version: 1,
      },
    });
  }

  /**
   * Retrieves active templates for a tenant.
   */
  async getTemplates(tenantId?: string) {
    const prismaClient = this.prisma as any;
    const where: any = { active: true };
    if (tenantId) {
      where.OR = [{ tenantId }, { tenantId: null }];
    }

    return prismaClient.credentialTemplate.findMany({
      where,
      orderBy: { title: 'asc' },
    });
  }

  /**
   * Checks if student mastery and evidence meet a specific template's requirements.
   */
  async evaluateCandidate(
    templateId: string,
    mastery: number,
    evidenceCount: number,
  ): Promise<{ eligible: boolean; template: any }> {
    const prismaClient = this.prisma as any;
    const template = await prismaClient.credentialTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Credential template not found.');
    }

    const eligible = meetsTemplateCriteria({
      mastery,
      evidenceCount,
      minimumMastery: template.minimumMastery ?? undefined,
      minimumEvidence: template.minimumEvidence ?? undefined,
    });

    return { eligible, template };
  }
}
