import { Injectable } from '@nestjs/common';
import {
  InterventionCluster,
  TeacherPriorityInput,
  calculateTeacherPriority,
} from './teacher-priority.types';

@Injectable()
export class TeacherPriorityService {
  /**
   * Computes priority score for a queued teacher task.
   */
  evaluatePriority(input: TeacherPriorityInput): number {
    return calculateTeacherPriority(input);
  }

  /**
   * Clusters individual interventions into actionable group summaries.
   * Avoids flooding teachers with dozens of individual atomic alerts.
   */
  clusterInterventions(interventions: Array<{
    targetConceptId?: string | null;
    type: string;
    priority: number;
  }>): InterventionCluster[] {
    const clusterMap = new Map<string, {
      conceptId?: string;
      signalType: string;
      count: number;
      totalPriority: number;
    }>();

    for (const item of interventions) {
      const key = `${item.targetConceptId ?? 'general'}:${item.type}`;
      const existing = clusterMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalPriority += item.priority;
      } else {
        clusterMap.set(key, {
          conceptId: item.targetConceptId ?? undefined,
          signalType: item.type,
          count: 1,
          totalPriority: item.priority,
        });
      }
    }

    return Array.from(clusterMap.values()).map((c) => ({
      conceptId: c.conceptId,
      signalType: c.signalType,
      learnerCount: c.count,
      averageSeverity: c.totalPriority / c.count,
      recommendedAction: `Review group remediation for ${c.count} students on ${c.conceptId ?? c.signalType}`,
    }));
  }
}
