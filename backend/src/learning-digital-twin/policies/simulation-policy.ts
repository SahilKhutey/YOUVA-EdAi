import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { TwinSnapshotDto } from '../domain/twin.types';

export interface FreshnessValidationResult {
  isStale: boolean;
  reason?: string;
}

@Injectable()
export class SimulationPolicy {
  private readonly logger = new Logger(SimulationPolicy.name);
  public static readonly MAX_SCENARIO_CHANGES = 20;

  validateNoMutation(action: string): void {
    const prohibitedActions = [
      'MUTATE_CANONICAL_KNOWLEDGE',
      'MUTATE_CANONICAL_MASTERY',
      'MUTATE_CANONICAL_CURRICULUM',
      'CREATE_REAL_ASSIGNMENT',
      'SEND_REAL_MESSAGE',
    ];

    if (prohibitedActions.includes(action)) {
      const reason = `No-Mutation Invariant Violation: Digital twin simulation prohibited from executing canonical action '${action}'.`;
      this.logger.error(reason);
      throw new ForbiddenException(reason);
    }
  }

  validateSnapshotFreshness(
    snapshot: TwinSnapshotDto,
    currentVersions: { knowledge: string; curriculum: string; policy: string },
  ): FreshnessValidationResult {
    if (snapshot.knowledgeVersionSet !== currentVersions.knowledge) {
      return {
        isStale: true,
        reason: `SNAPSHOT_STALE: Snapshot knowledge version (${snapshot.knowledgeVersionSet}) differs from production current version (${currentVersions.knowledge}).`,
      };
    }

    if (snapshot.curriculumVersionSet !== currentVersions.curriculum) {
      return {
        isStale: true,
        reason: `SNAPSHOT_STALE: Snapshot curriculum version (${snapshot.curriculumVersionSet}) differs from production current version (${currentVersions.curriculum}).`,
      };
    }

    return { isStale: false };
  }

  validateScopeAuthorization(actorRole: string, requestedScope: 'CLASS' | 'COURSE' | 'TENANT'): void {
    if (actorRole === 'STUDENT') {
      throw new ForbiddenException('Students are not authorized to access or execute digital twin scenario simulations.');
    }

    if (actorRole === 'TEACHER' && requestedScope === 'TENANT') {
      throw new ForbiddenException('Teachers are restricted to course and class level scenarios. Institution-wide simulation requires administrator permissions.');
    }
  }
}
