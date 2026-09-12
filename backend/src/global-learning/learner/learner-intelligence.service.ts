import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface EvidenceSignal {
  correctness: number;
  independence: number;
  consistency: number;
  recency: number;
  difficulty: number;
}

export function evidenceStrength(signal: EvidenceSignal): number {
  return (
    signal.correctness * 0.35 +
    signal.independence * 0.25 +
    signal.consistency * 0.20 +
    signal.recency * 0.10 +
    signal.difficulty * 0.10
  );
}

export function confidenceFromEvidence(
  evidenceCount: number,
  consistency: number,
): number {
  const quantity = Math.min(evidenceCount, 20) / 20;
  return Math.min(1, quantity * 0.6 + consistency * 0.4);
}

export interface RecommendationScoreInput {
  masteryGap: number;
  goalAlignment: number;
  prerequisiteFit: number;
  difficultyFit: number;
  engagementFit: number;
  teacherPriority: number;
  modalityFit: number;
  evidenceConfidence: number;
}

export function scoreRecommendation(input: RecommendationScoreInput): number {
  return (
    input.masteryGap * 0.25 +
    input.goalAlignment * 0.15 +
    input.prerequisiteFit * 0.15 +
    input.difficultyFit * 0.15 +
    input.engagementFit * 0.10 +
    input.teacherPriority * 0.10 +
    input.modalityFit * 0.05 +
    input.evidenceConfidence * 0.05
  );
}

@Injectable()
export class LearnerIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve the upgraded Global Learner State with explicit evidence confidence.
   */
  async getGlobalLearnerState(learnerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: learnerId },
      include: {
        topicMastery: true,
        cognitiveProfile: true,
        stats: true,
        studyGoals: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Learner [${learnerId}] not found.`);
    }

    const evidenceLogs = await this.prisma.learningEvidenceLog.findMany({
      where: { userId: learnerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Compute evidence confidence
    const evidenceCount = evidenceLogs.length;
    let correctCount = 0;
    for (const log of evidenceLogs) {
      if (log.accuracy >= 0.7) correctCount++;
    }
    const consistency = evidenceCount > 0 ? correctCount / evidenceCount : 0.5;
    const confidence = confidenceFromEvidence(evidenceCount, consistency);

    // Active teacher overrides
    const teacherOverrides = await this.prisma.teacherIntervention.findMany({
      where: { studentId: learnerId, action: 'OVERRIDE' },
      take: 5,
    });

    return {
      learnerId: user.id,
      ageTier: user.cognitiveLevel,
      gradeLevel: user.gradeLevel,
      mastery: user.topicMastery.map((tm: any) => ({
        topicId: tm.topicId,
        mastery: tm.masteryProbability,
        certifiedMastery: tm.masteryProbability >= 0.85,
      })),
      confidence: Math.round(confidence * 100) / 100,
      evidenceCount,
      teacherOverridesCount: teacherOverrides.length,
      cognitiveLoad: (user.cognitiveProfile as any)?.fatigueIndex ?? 0.1,
      goals: user.studyGoals.map((g: any) => ({
        id: g.id,
        title: `Weekly Target: ${g.weeklyXpTarget}`,
        targetScore: g.weeklyXpTarget,
      })),
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}
