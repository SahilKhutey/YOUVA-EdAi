import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WorkflowDefinitionDto,
  OrchestrationScope,
} from '../domain/orchestration.types';

@Injectable()
export class WorkflowRegistryService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowRegistryService.name);

  private readonly builtInWorkflows: WorkflowDefinitionDto[] = [
    {
      workflowKey: 'prerequisite-remediation-v1',
      version: '1.0.0',
      name: 'Prerequisite Remediation & Practice Workflow',
      description: 'Identifies prerequisite gaps, triggers targeted diagnostic, assigns remediation, updates path, and alerts teacher.',
      status: 'ACTIVE',
      scope: 'LEARNER',
      autonomyLevel: 'SAFE_EXECUTE',
      policyVersion: '1.0.0',
      definition: {
        compensationPolicy: 'STRICT_ROLLBACK',
        steps: [
          {
            sequence: 1,
            actionType: 'TRIGGER_ASSESSMENT',
            targetType: 'CONCEPT_DIAGNOSTIC',
            targetIdPattern: '{{conceptId}}',
            compensationAction: 'CANCEL_ASSESSMENT',
          },
          {
            sequence: 2,
            actionType: 'ASSIGN_REMEDIATION',
            targetType: 'REMEDIATION_MODULE',
            targetIdPattern: '{{remediationModuleId}}',
            dependsOn: [1],
            compensationAction: 'UNASSIGN_MODULE',
          },
          {
            sequence: 3,
            actionType: 'UPDATE_LEARNING_PATH',
            targetType: 'LEARNING_PATH',
            targetIdPattern: '{{learnerId}}',
            dependsOn: [2],
            compensationAction: 'RESTORE_PREVIOUS_PATH',
          },
          {
            sequence: 4,
            actionType: 'NOTIFY_TEACHER',
            targetType: 'TEACHER_NOTIFICATION',
            targetIdPattern: '{{teacherId}}',
            dependsOn: [3],
          },
        ],
      },
    },
    {
      workflowKey: 'targeted-practice-v1',
      version: '1.0.0',
      name: 'Targeted Practice & Difficulty Adjustment',
      description: 'Adjusts practice difficulty for struggling subconcepts and schedules spaced retrieval checkpoints.',
      status: 'ACTIVE',
      scope: 'LEARNER',
      autonomyLevel: 'SAFE_EXECUTE',
      policyVersion: '1.0.0',
      definition: {
        compensationPolicy: 'BEST_EFFORT',
        steps: [
          {
            sequence: 1,
            actionType: 'ADJUST_DIFFICULTY',
            targetType: 'PRACTICE_SESSION',
            targetIdPattern: '{{sessionId}}',
            compensationAction: 'RESET_DIFFICULTY',
          },
          {
            sequence: 2,
            actionType: 'SCHEDULE_REVIEW',
            targetType: 'SPACED_REVIEW',
            targetIdPattern: '{{conceptId}}',
            dependsOn: [1],
            compensationAction: 'CANCEL_SCHEDULED_REVIEW',
          },
        ],
      },
    },
    {
      workflowKey: 'concept-review-v1',
      version: '1.0.0',
      name: 'Whole-Class Concept Review Proposal',
      description: 'Recommends whole-class concept review when multiple learners encounter systemic misconceptions.',
      status: 'ACTIVE',
      scope: 'CLASS',
      autonomyLevel: 'RECOMMEND',
      policyVersion: '1.0.0',
      definition: {
        compensationPolicy: 'BEST_EFFORT',
        steps: [
          {
            sequence: 1,
            actionType: 'SCHEDULE_REVIEW',
            targetType: 'CLASS_SESSION',
            targetIdPattern: '{{classId}}',
            compensationAction: 'CANCEL_CLASS_REVIEW',
          },
          {
            sequence: 2,
            actionType: 'NOTIFY_TEACHER',
            targetType: 'TEACHER_NOTIFICATION',
            targetIdPattern: '{{teacherId}}',
            dependsOn: [1],
          },
        ],
      },
    },
    {
      workflowKey: 'systemic-gap-review-v1',
      version: '1.0.0',
      name: 'Course-Wide Systemic Gap Coordination',
      description: 'Coordinates curriculum review across course modules following institutional gap discovery.',
      status: 'ACTIVE',
      scope: 'COURSE',
      autonomyLevel: 'RECOMMEND',
      policyVersion: '1.0.0',
      definition: {
        compensationPolicy: 'BEST_EFFORT',
        steps: [
          {
            sequence: 1,
            actionType: 'TRIGGER_ASSESSMENT',
            targetType: 'CURRICULUM_AUDIT',
            targetIdPattern: '{{courseId}}',
            compensationAction: 'DISMISS_AUDIT',
          },
          {
            sequence: 2,
            actionType: 'NOTIFY_TEACHER',
            targetType: 'COORDINATOR_NOTIFICATION',
            targetIdPattern: '{{coordinatorId}}',
            dependsOn: [1],
          },
        ],
      },
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedBuiltInWorkflows();
  }

  private async seedBuiltInWorkflows() {
    for (const wf of this.builtInWorkflows) {
      try {
        const existing = await this.prisma.workflowDefinition.findUnique({
          where: {
            workflowKey_version: {
              workflowKey: wf.workflowKey,
              version: wf.version,
            },
          },
        });

        if (!existing) {
          await this.prisma.workflowDefinition.create({
            data: {
              workflowKey: wf.workflowKey,
              version: wf.version,
              name: wf.name,
              description: wf.description,
              status: wf.status,
              scope: wf.scope,
              autonomyLevel: wf.autonomyLevel,
              definition: wf.definition as any,
              policyVersion: wf.policyVersion,
            },
          });
          this.logger.log(`Seeded workflow: ${wf.workflowKey}@${wf.version}`);
        }
      } catch (err) {
        this.logger.warn(`Could not seed workflow ${wf.workflowKey}: ${(err as Error).message}`);
      }
    }
  }

  async getWorkflow(workflowKey: string, version = '1.0.0'): Promise<WorkflowDefinitionDto | null> {
    try {
      const record = await this.prisma.workflowDefinition.findUnique({
        where: {
          workflowKey_version: {
            workflowKey,
            version,
          },
        },
      });

      if (record) {
        return {
          workflowKey: record.workflowKey,
          version: record.version,
          name: record.name,
          description: record.description ?? undefined,
          status: record.status as any,
          scope: record.scope as any,
          autonomyLevel: record.autonomyLevel as any,
          definition: record.definition as any,
          policyVersion: record.policyVersion,
        };
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch workflow from DB: ${(err as Error).message}. Falling back to memory.`);
    }

    const fallback = this.builtInWorkflows.find(
      (w) => w.workflowKey === workflowKey && w.version === version,
    );
    return fallback ?? null;
  }

  async listWorkflows(filter?: {
    scope?: OrchestrationScope;
    status?: string;
  }): Promise<WorkflowDefinitionDto[]> {
    try {
      const records = await this.prisma.workflowDefinition.findMany({
        where: {
          scope: filter?.scope,
          status: filter?.status,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (records.length > 0) {
        return records.map((r) => ({
          workflowKey: r.workflowKey,
          version: r.version,
          name: r.name,
          description: r.description ?? undefined,
          status: r.status as any,
          scope: r.scope as any,
          autonomyLevel: r.autonomyLevel as any,
          definition: r.definition as any,
          policyVersion: r.policyVersion,
        }));
      }
    } catch (err) {
      this.logger.warn(`Failed to list workflows from DB: ${(err as Error).message}. Returning built-in list.`);
    }

    return this.builtInWorkflows.filter((w) => {
      if (filter?.scope && w.scope !== filter.scope) return false;
      if (filter?.status && w.status !== filter.status) return false;
      return true;
    });
  }

  async registerWorkflow(dto: WorkflowDefinitionDto): Promise<WorkflowDefinitionDto> {
    const record = await this.prisma.workflowDefinition.upsert({
      where: {
        workflowKey_version: {
          workflowKey: dto.workflowKey,
          version: dto.version,
        },
      },
      update: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        scope: dto.scope,
        autonomyLevel: dto.autonomyLevel,
        definition: dto.definition as any,
        policyVersion: dto.policyVersion,
      },
      create: {
        workflowKey: dto.workflowKey,
        version: dto.version,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        scope: dto.scope,
        autonomyLevel: dto.autonomyLevel,
        definition: dto.definition as any,
        policyVersion: dto.policyVersion,
      },
    });

    return {
      workflowKey: record.workflowKey,
      version: record.version,
      name: record.name,
      description: record.description ?? undefined,
      status: record.status as any,
      scope: record.scope as any,
      autonomyLevel: record.autonomyLevel as any,
      definition: record.definition as any,
      policyVersion: record.policyVersion,
    };
  }
}
