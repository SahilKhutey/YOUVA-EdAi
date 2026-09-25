import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AutomationPolicy } from '../policies/automation-policy';
import { ActionType } from '../domain/improvement-action';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the current automation policy configuration.
   */
  getPolicy() {
    return {
      currentLevel: AutomationPolicy.getAutomationLevel(),
      levels: [
        { level: 0, name: 'Observation', description: 'Safe background analysis, reporting, and metrics aggregation.' },
        { level: 1, name: 'Recommendation', description: 'Proposes improvement opportunities with evidence attached.' },
        { level: 2, name: 'Draft Generation', description: 'Generates draft examples and explanations requiring human review.' },
        { level: 3, name: 'Controlled Execution', description: 'Executes approved non-canonical tasks under strict guardrails.' },
      ],
      prohibitedActions: [
        'AUTOMATIC_MASTERY_MUTATION',
        'AUTOMATIC_GRADING_MUTATION',
        'SILENT_KNOWLEDGE_PUBLICATION',
      ],
    };
  }

  /**
   * Updates system automation level (Admin/Governance only).
   */
  updateAutomationLevel(level: number, approvedBy: string) {
    AutomationPolicy.setAutomationLevel(level);
    this.logger.log(`Automation level changed to ${level} by ${approvedBy}`);
    return this.getPolicy();
  }

  /**
   * Lists recent automated executions.
   */
  async getExecutions(tenantId = 'default-tenant', limit = 20) {
    return this.prisma.improvementExecution.findMany({
      where: {
        tenantId,
        actorType: { in: ['AI', 'SYSTEM'] },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}
