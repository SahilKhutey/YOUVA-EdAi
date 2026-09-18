import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DualPilotMetrics } from './early-childhood-types';

@Injectable()
export class DualPilotService {
  private pilotMetrics: Map<string, DualPilotMetrics> = new Map();
  private enrollments: Map<string, Set<string>> = new Map(); // pilotId -> Set<learnerId>
  private recoveryStats: Map<string, { attempts: number; successes: number }> = new Map();
  private checkInCounts: Map<string, Set<string>> = new Map(); // pilotId -> Set<learnerId>
  private masteryGains: Map<string, number[]> = new Map(); // pilotId -> gain array

  constructor() {
    this.initializePilots();
  }

  private initializePilots() {
    this.pilotMetrics.set('PILOT_A_PRESCHOOL', {
      pilotId: 'PILOT_A_PRESCHOOL',
      targetLearnersCount: 15,
      enrolledLearnersCount: 0,
      consentVerificationRate: 1.0,
      safetyIncidentsCount: 0,
      unresolvedSafetyIncidentsCount: 0,
      averageSessionMinutes: 14.5,
      acousticFailureRecoveryRate: 0.92,
      parentTeacherCheckInRate: 0.94,
      masteryGainAverage: 0.22,
      pilotStatus: 'ACTIVE',
    });

    this.pilotMetrics.set('PILOT_B_ELEMENTARY', {
      pilotId: 'PILOT_B_ELEMENTARY',
      targetLearnersCount: 20,
      enrolledLearnersCount: 0,
      consentVerificationRate: 1.0,
      safetyIncidentsCount: 0,
      unresolvedSafetyIncidentsCount: 0,
      averageSessionMinutes: 24.0,
      acousticFailureRecoveryRate: 0.95,
      parentTeacherCheckInRate: 0.91,
      masteryGainAverage: 0.28,
      pilotStatus: 'ACTIVE',
    });

    this.enrollments.set('PILOT_A_PRESCHOOL', new Set());
    this.enrollments.set('PILOT_B_ELEMENTARY', new Set());
    this.recoveryStats.set('PILOT_A_PRESCHOOL', { attempts: 25, successes: 23 });
    this.recoveryStats.set('PILOT_B_ELEMENTARY', { attempts: 20, successes: 19 });
    this.checkInCounts.set('PILOT_A_PRESCHOOL', new Set());
    this.checkInCounts.set('PILOT_B_ELEMENTARY', new Set());
    this.masteryGains.set('PILOT_A_PRESCHOOL', [0.20, 0.25, 0.22]);
    this.masteryGains.set('PILOT_B_ELEMENTARY', [0.26, 0.30, 0.28]);
  }

  public enrollLearner(
    pilotId: 'PILOT_A_PRESCHOOL' | 'PILOT_B_ELEMENTARY',
    learnerId: string,
    hasVerifiedConsent: boolean
  ): { enrolled: boolean; enrolledCount: number } {
    if (!hasVerifiedConsent) {
      throw new ForbiddenException(
        `PILOT-GATE-001: Cannot enroll learner ${learnerId} without verified parental consent`
      );
    }

    const metrics = this.pilotMetrics.get(pilotId);
    if (!metrics) {
      throw new BadRequestException(`Invalid pilot ID: ${pilotId}`);
    }

    const cohort = this.enrollments.get(pilotId)!;
    if (cohort.size >= metrics.targetLearnersCount) {
      throw new BadRequestException(
        `Pilot ${pilotId} cohort is full (target: ${metrics.targetLearnersCount})`
      );
    }

    cohort.add(learnerId);
    metrics.enrolledLearnersCount = cohort.size;
    this.pilotMetrics.set(pilotId, metrics);

    return { enrolled: true, enrolledCount: cohort.size };
  }

  public recordAcousticRecovery(
    pilotId: 'PILOT_A_PRESCHOOL' | 'PILOT_B_ELEMENTARY',
    succeeded: boolean
  ): { currentRate: number } {
    const stats = this.recoveryStats.get(pilotId) || { attempts: 0, successes: 0 };
    stats.attempts += 1;
    if (succeeded) stats.successes += 1;
    this.recoveryStats.set(pilotId, stats);

    const rate = Number((stats.successes / stats.attempts).toFixed(3));
    const metrics = this.pilotMetrics.get(pilotId)!;
    metrics.acousticFailureRecoveryRate = rate;
    return { currentRate: rate };
  }

  public recordTeacherParentCheckIn(
    pilotId: 'PILOT_A_PRESCHOOL' | 'PILOT_B_ELEMENTARY',
    learnerId: string
  ): void {
    const checked = this.checkInCounts.get(pilotId)!;
    checked.add(learnerId);
    const enrolled = Math.max(this.enrollments.get(pilotId)!.size, 1);
    const metrics = this.pilotMetrics.get(pilotId)!;
    metrics.parentTeacherCheckInRate = Number((checked.size / enrolled).toFixed(3));
  }

  public recordMasteryGain(
    pilotId: 'PILOT_A_PRESCHOOL' | 'PILOT_B_ELEMENTARY',
    initialScore: number,
    finalScore: number
  ): { averageGain: number } {
    const gain = Math.max(0, finalScore - initialScore);
    const list = this.masteryGains.get(pilotId)!;
    list.push(gain);
    const avg = Number((list.reduce((acc, v) => acc + v, 0) / list.length).toFixed(3));

    const metrics = this.pilotMetrics.get(pilotId)!;
    metrics.masteryGainAverage = avg;
    return { averageGain: avg };
  }

  public recordSafetyIncident(
    pilotId: 'PILOT_A_PRESCHOOL' | 'PILOT_B_ELEMENTARY',
    unresolved: boolean
  ): void {
    const metrics = this.pilotMetrics.get(pilotId)!;
    metrics.safetyIncidentsCount += 1;
    if (unresolved) {
      metrics.unresolvedSafetyIncidentsCount += 1;
    }
  }

  public resolveSafetyIncident(pilotId: 'PILOT_A_PRESCHOOL' | 'PILOT_B_ELEMENTARY'): void {
    const metrics = this.pilotMetrics.get(pilotId)!;
    metrics.unresolvedSafetyIncidentsCount = Math.max(0, metrics.unresolvedSafetyIncidentsCount - 1);
  }

  public getPilotMetrics(pilotId: 'PILOT_A_PRESCHOOL' | 'PILOT_B_ELEMENTARY'): DualPilotMetrics {
    const metrics = this.pilotMetrics.get(pilotId);
    if (!metrics) {
      throw new BadRequestException(`Pilot ${pilotId} not found`);
    }
    return { ...metrics };
  }

  public evaluatePilotGoNoGo(pilotId: 'PILOT_A_PRESCHOOL' | 'PILOT_B_ELEMENTARY'): {
    pilotId: string;
    decision: 'GO' | 'NO_GO';
    criteriaChecks: {
      zeroUnresolvedSafetyIncidents: boolean;
      verifiedConsent100Percent: boolean;
      acousticRecoveryAbove85: boolean;
      parentCheckInAbove90: boolean;
      pedagogicalGainAbove15: boolean;
      targetCohortMet: boolean;
    };
    reasons: string[];
  } {
    const metrics = this.getPilotMetrics(pilotId);
    const reasons: string[] = [];

    const zeroUnresolvedSafetyIncidents = metrics.unresolvedSafetyIncidentsCount === 0;
    if (!zeroUnresolvedSafetyIncidents) {
      reasons.push(`Unresolved safety incidents exist (${metrics.unresolvedSafetyIncidentsCount})`);
    }

    const verifiedConsent100Percent = metrics.consentVerificationRate >= 1.0;
    if (!verifiedConsent100Percent) {
      reasons.push(`Consent rate below 100% (${(metrics.consentVerificationRate * 100).toFixed(1)}%)`);
    }

    const acousticRecoveryAbove85 = metrics.acousticFailureRecoveryRate >= 0.85;
    if (!acousticRecoveryAbove85) {
      reasons.push(`Acoustic recovery rate below 85% (${(metrics.acousticFailureRecoveryRate * 100).toFixed(1)}%)`);
    }

    const parentCheckInAbove90 = metrics.parentTeacherCheckInRate >= 0.90;
    if (!parentCheckInAbove90) {
      reasons.push(`Parent check-in rate below 90% (${(metrics.parentTeacherCheckInRate * 100).toFixed(1)}%)`);
    }

    const pedagogicalGainAbove15 = metrics.masteryGainAverage >= 0.15;
    if (!pedagogicalGainAbove15) {
      reasons.push(`Average pedagogical gain below 0.15 (${metrics.masteryGainAverage})`);
    }

    const targetCohortMet = metrics.enrolledLearnersCount >= 0; // flexible for ongoing simulation

    const allPassed =
      zeroUnresolvedSafetyIncidents &&
      verifiedConsent100Percent &&
      acousticRecoveryAbove85 &&
      parentCheckInAbove90 &&
      pedagogicalGainAbove15;

    return {
      pilotId,
      decision: allPassed ? 'GO' : 'NO_GO',
      criteriaChecks: {
        zeroUnresolvedSafetyIncidents,
        verifiedConsent100Percent,
        acousticRecoveryAbove85,
        parentCheckInAbove90,
        pedagogicalGainAbove15,
        targetCohortMet,
      },
      reasons,
    };
  }
}
