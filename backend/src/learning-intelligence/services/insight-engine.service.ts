import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  InsightType,
  InsightScope,
  InsightSeverity,
  InsightStatus,
} from '../domain/intelligence.types';

export interface InsightCandidate {
  type: InsightType;
  scope: InsightScope;
  entityId?: string;
  title: string;
  summary: string;
  evidenceIds: string[];
  confidence: number;
  severity: InsightSeverity;
  ruleVersion: string;
}

@Injectable()
export class InsightEngineService {
  private readonly logger = new Logger(InsightEngineService.name);
  public static readonly MINIMUM_SAMPLE_SIZE = 5;
  public static readonly CURRENT_RULE_VERSION = 'lkc10-rules-v1';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates knowledge consumption and evidence to generate deterministic insights.
   */
  async detectKnowledgeInsights(
    knowledgeId: string,
    tenantId = 'default-tenant',
  ): Promise<any[]> {
    const knowledge = await this.prisma.knowledgeObject.findUnique({
      where: { id: knowledgeId },
      include: {
        evidenceLogs: { take: 100, orderBy: { createdAt: 'desc' } },
        learningSessions: { take: 100 },
        learnerStates: true,
      },
    });

    if (!knowledge) return [];

    const candidates: InsightCandidate[] = [];
    const evidenceLogs = knowledge.evidenceLogs;
    const sessions = knowledge.learningSessions;
    const sampleSize = evidenceLogs.length;

    // Statistical safeguard: minimum sample size required
    if (sampleSize < InsightEngineService.MINIMUM_SAMPLE_SIZE) {
      return [];
    }

    // 1. Rule: KNOWLEDGE_DIFFICULTY
    const incorrectAttempts = evidenceLogs.filter((e) => e.accuracy < 0.5);
    const incorrectRate = incorrectAttempts.length / sampleSize;
    const repeatedErrors = evidenceLogs.filter((e) => e.attemptNumber > 2);
    const repeatedErrorRate = repeatedErrors.length / sampleSize;

    if (incorrectRate >= 0.5 && repeatedErrorRate >= 0.3) {
      candidates.push({
        type: 'KNOWLEDGE_DIFFICULTY',
        scope: 'KNOWLEDGE',
        entityId: knowledgeId,
        title: `High Difficulty Barrier in "${knowledge.title}"`,
        summary: `${Math.round(incorrectRate * 100)}% of recent attempts were incorrect and ${Math.round(repeatedErrorRate * 100)}% required multiple retries across ${sampleSize} evidence logs.`,
        evidenceIds: incorrectAttempts.slice(0, 10).map((e) => e.id),
        confidence: Math.min(0.95, 0.7 + (sampleSize / 100) * 0.25),
        severity: incorrectRate >= 0.7 ? 'HIGH' : 'MEDIUM',
        ruleVersion: InsightEngineService.CURRENT_RULE_VERSION,
      });
    }

    // 2. Rule: KNOWLEDGE_LOW_ENGAGEMENT
    if (sessions.length >= InsightEngineService.MINIMUM_SAMPLE_SIZE) {
      const abandonedSessions = sessions.filter((s) => s.status === 'ABANDONED');
      const abandonmentRate = abandonedSessions.length / sessions.length;

      if (abandonmentRate >= 0.4) {
        candidates.push({
          type: 'KNOWLEDGE_LOW_ENGAGEMENT',
          scope: 'KNOWLEDGE',
          entityId: knowledgeId,
          title: `Elevated Abandonment in "${knowledge.title}"`,
          summary: `${Math.round(abandonmentRate * 100)}% of learners abandon their learning session before reaching practice.`,
          evidenceIds: [],
          confidence: 0.82,
          severity: 'MEDIUM',
          ruleVersion: InsightEngineService.CURRENT_RULE_VERSION,
        });
      }
    }

    // 3. Rule: MISCONCEPTION_PATTERN
    const misconceptions = evidenceLogs.filter((e) => e.misconception);
    if (misconceptions.length >= 3) {
      const misconceptionCounts = new Map<string, number>();
      for (const m of misconceptions) {
        const text = m.misconception!;
        misconceptionCounts.set(text, (misconceptionCounts.get(text) || 0) + 1);
      }

      for (const [pattern, count] of misconceptionCounts.entries()) {
        if (count >= 3 && count / sampleSize >= 0.25) {
          candidates.push({
            type: 'MISCONCEPTION_PATTERN',
            scope: 'KNOWLEDGE',
            entityId: knowledgeId,
            title: `Systemic Misconception Detected in "${knowledge.title}"`,
            summary: `Recurring pattern observed: "${pattern}" (${count} occurrences, ${Math.round((count / sampleSize) * 100)}% of attempts).`,
            evidenceIds: misconceptions.filter((m) => m.misconception === pattern).map((m) => m.id),
            confidence: 0.88,
            severity: 'HIGH',
            ruleVersion: InsightEngineService.CURRENT_RULE_VERSION,
          });
        }
      }
    }

    // Persist and deduplicate candidates
    return this.persistDeduplicatedInsights(candidates, tenantId);
  }

  /**
   * Evaluates prerequisite relationships for gap detection.
   */
  async detectPrerequisiteGapInsights(
    sourceKnowledgeId: string,
    targetKnowledgeId: string,
    tenantId = 'default-tenant',
  ): Promise<any[]> {
    const targetStates = await this.prisma.learnerKnowledgeState.findMany({
      where: { knowledgeObjectId: targetKnowledgeId, tenantId },
    });

    if (targetStates.length < InsightEngineService.MINIMUM_SAMPLE_SIZE) {
      return [];
    }

    // Check learners who struggled on target: how did they perform on source?
    const strugglingLearners = targetStates.filter(
      (s) => s.status === 'STRUGGLING' || s.masteryLevel < 0.5,
    );

    if (strugglingLearners.length >= 3) {
      const sourceStates = await this.prisma.learnerKnowledgeState.findMany({
        where: {
          knowledgeObjectId: sourceKnowledgeId,
          learnerId: { in: strugglingLearners.map((s) => s.learnerId) },
          tenantId,
        },
      });

      const failedPrereqCount = sourceStates.filter(
        (s) => s.status === 'STRUGGLING' || s.masteryLevel < 0.6,
      ).length;

      const prereqFailureRate = failedPrereqCount / strugglingLearners.length;

      if (prereqFailureRate >= 0.35) {
        const sourceKnowledge = await this.prisma.knowledgeObject.findUnique({
          where: { id: sourceKnowledgeId },
        });
        const targetKnowledge = await this.prisma.knowledgeObject.findUnique({
          where: { id: targetKnowledgeId },
        });

        const candidate: InsightCandidate = {
          type: 'PREREQUISITE_GAP',
          scope: 'CURRICULUM',
          entityId: targetKnowledgeId,
          title: `Prerequisite Gap: "${sourceKnowledge?.title || sourceKnowledgeId}" → "${targetKnowledge?.title || targetKnowledgeId}"`,
          summary: `${Math.round(prereqFailureRate * 100)}% of learners who struggled on "${targetKnowledge?.title}" also lacked mastery in prerequisite "${sourceKnowledge?.title}".`,
          evidenceIds: [],
          confidence: 0.85,
          severity: 'HIGH',
          ruleVersion: InsightEngineService.CURRENT_RULE_VERSION,
        };

        return this.persistDeduplicatedInsights([candidate], tenantId);
      }
    }

    return [];
  }

  /**
   * Deduplicates insights by tenantId, entityId, type, and ruleVersion.
   */
  private async persistDeduplicatedInsights(
    candidates: InsightCandidate[],
    tenantId: string,
  ): Promise<any[]> {
    const saved: any[] = [];

    for (const c of candidates) {
      // Check for active existing insight for this entity and type
      const existing = await this.prisma.learningInsight.findFirst({
        where: {
          tenantId,
          entityId: c.entityId || null,
          type: c.type,
          ruleVersion: c.ruleVersion,
          status: { in: ['DETECTED', 'VALIDATING', 'CONFIRMED', 'ACTIONABLE', 'RECOMMENDED'] },
        },
      });

      if (existing) {
        // Update summary and confidence without creating a duplicate record
        const updated = await this.prisma.learningInsight.update({
          where: { id: existing.id },
          data: {
            summary: c.summary,
            confidence: c.confidence,
            severity: c.severity,
            evidenceIds: Array.from(new Set([...existing.evidenceIds, ...c.evidenceIds])),
            detectedAt: new Date(),
          },
        });
        saved.push(updated);
      } else {
        const created = await this.prisma.learningInsight.create({
          data: {
            tenantId,
            type: c.type,
            scope: c.scope,
            entityId: c.entityId || null,
            title: c.title,
            summary: c.summary,
            evidenceIds: c.evidenceIds,
            confidence: c.confidence,
            severity: c.severity,
            status: 'CONFIRMED',
            ruleVersion: c.ruleVersion,
          },
        });
        saved.push(created);
      }
    }

    return saved;
  }
}
