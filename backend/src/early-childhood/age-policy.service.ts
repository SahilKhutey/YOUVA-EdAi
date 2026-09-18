import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { AgeBand, AgeExperiencePolicy } from './early-childhood-types';

@Injectable()
export class AgePolicyService {
  private readonly logger = new Logger(AgePolicyService.name);
  private readonly policies = new Map<AgeBand, AgeExperiencePolicy>();
  private readonly learnerAgeBands = new Map<string, AgeBand>(); // Authoritative learnerId -> AgeBand

  constructor() {
    this.initializePolicies();
  }

  private initializePolicies(): void {
    const defaultPolicies: AgeExperiencePolicy[] = [
      {
        ageBand: 'PRESCHOOL',
        targetAgeRange: '3–7 years',
        navigationMode: 'VISUAL_LARGE_TARGETS',
        interactionMode: 'VOICE_FIRST',
        languageComplexity: 'CONCRETE_SIMPLE',
        autonomyLevel: 'PARENT_SUPERVISED',
        safetyPolicyVersion: 'v1.0-child-strict',
        assessmentPolicyVersion: 'v1.0-play-observation',
        maxSessionMinutes: 15,
        gamificationBanned: true, // Clause N13.20: No leaderboards/streaks
      },
      {
        ageBand: 'ELEMENTARY',
        targetAgeRange: '7–12 years',
        navigationMode: 'HYBRID_GUIDED',
        interactionMode: 'TOUCH_VOICE_MULTIMODAL',
        languageComplexity: 'ELEMENTARY_PROGRESSIVE',
        autonomyLevel: 'EDUCATOR_COACHED',
        safetyPolicyVersion: 'v1.0-elementary-safe',
        assessmentPolicyVersion: 'v1.0-adaptive-practice',
        maxSessionMinutes: 30,
        gamificationBanned: true,
      },
      {
        ageBand: 'MIDDLE',
        targetAgeRange: '12–15 years',
        navigationMode: 'STANDARD_DASHBOARD',
        interactionMode: 'TOUCH_VOICE_MULTIMODAL',
        languageComplexity: 'ANALYTICAL',
        autonomyLevel: 'SELF_DIRECTED',
        safetyPolicyVersion: 'v1.0-general',
        assessmentPolicyVersion: 'v1.0-bkt-adaptive',
        maxSessionMinutes: 45,
        gamificationBanned: false,
      },
      {
        ageBand: 'HIGH_SCHOOL',
        targetAgeRange: '15–18 years',
        navigationMode: 'STANDARD_DASHBOARD',
        interactionMode: 'DESKTOP_KEYBOARD',
        languageComplexity: 'ANALYTICAL',
        autonomyLevel: 'SELF_DIRECTED',
        safetyPolicyVersion: 'v1.0-high-school',
        assessmentPolicyVersion: 'v1.0-pbl-credential',
        maxSessionMinutes: 60,
        gamificationBanned: false,
      },
    ];

    for (const p of defaultPolicies) {
      this.policies.set(p.ageBand, p);
    }
    this.logger.log(`Initialized Age Experience Policies for all 4 learner tiers.`);
  }

  getPolicy(ageBand: AgeBand): AgeExperiencePolicy {
    const policy = this.policies.get(ageBand);
    if (!policy) {
      throw new NotFoundException(`Policy for age band '${ageBand}' not found.`);
    }
    return policy;
  }

  /**
   * Sets authoritative age band for a learner in the server database (Clause N13.7).
   */
  setLearnerAgeBand(learnerId: string, ageBand: AgeBand): void {
    this.learnerAgeBands.set(learnerId, ageBand);
    this.logger.log(`Assigned learner ${learnerId} to age band ${ageBand}`);
  }

  /**
   * Resolves server-enforced policy for a learner. Client spoofing is strictly prevented.
   */
  getPolicyForLearner(learnerId: string, fallbackBand: AgeBand = 'PRESCHOOL'): AgeExperiencePolicy {
    const assignedBand = this.learnerAgeBands.get(learnerId) || fallbackBand;
    return this.getPolicy(assignedBand);
  }

  /**
   * Validates whether a requested action complies with the learner's age band.
   */
  assertAllowedAction(learnerId: string, action: 'PURCHASE' | 'UNRESTRICTED_CHAT' | 'LEADERBOARD'): void {
    const policy = this.getPolicyForLearner(learnerId);

    if (action === 'PURCHASE') {
      // Invariant N13.73: Children cannot initiate purchases
      if (policy.ageBand === 'PRESCHOOL' || policy.ageBand === 'ELEMENTARY') {
        throw new BadRequestException('Autonomous child purchases are strictly prohibited by policy N13.73.');
      }
    }

    if (action === 'UNRESTRICTED_CHAT') {
      // Invariant N13.3: No unrestricted chat for young kids
      if (policy.ageBand === 'PRESCHOOL' || policy.ageBand === 'ELEMENTARY') {
        throw new BadRequestException('Unrestricted AI conversation is disabled for young learners by policy N13.3.');
      }
    }

    if (action === 'LEADERBOARD') {
      // Invariant N13.20: Play != Gamification
      if (policy.gamificationBanned) {
        throw new BadRequestException('Competitive leaderboards are prohibited for young learners by policy N13.20.');
      }
    }
  }
}
