import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EvolutionLevel, EvolutionPolicyDto } from '../domain/evolution.types';

@Injectable()
export class EvolutionPolicyService {
  private readonly logger = new Logger(EvolutionPolicyService.name);

  getPolicy(evolutionLevel: EvolutionLevel, changeType: string): EvolutionPolicyDto {
    switch (evolutionLevel) {
      case 0:
        return {
          changeType,
          riskLevel: 'LOW',
          evolutionLevel: 0,
          simulationRequired: false,
          assuranceRequired: false,
          approvalRequired: false,
          minimumEvidence: 0,
          rollbackRequired: false,
          canAutoExecute: true,
        };
      case 1:
        return {
          changeType,
          riskLevel: 'LOW',
          evolutionLevel: 1,
          simulationRequired: false,
          assuranceRequired: false,
          approvalRequired: false,
          minimumEvidence: 1,
          rollbackRequired: true,
          canAutoExecute: true,
        };
      case 2:
        return {
          changeType,
          riskLevel: 'MEDIUM',
          evolutionLevel: 2,
          simulationRequired: true,
          assuranceRequired: true,
          approvalRequired: true,
          minimumEvidence: 5,
          rollbackRequired: true,
          canAutoExecute: false,
        };
      case 3:
        return {
          changeType,
          riskLevel: 'HIGH',
          evolutionLevel: 3,
          simulationRequired: true,
          assuranceRequired: true,
          approvalRequired: true,
          minimumEvidence: 10,
          rollbackRequired: true,
          canAutoExecute: false,
        };
      case 4:
      default:
        return {
          changeType,
          riskLevel: 'CRITICAL',
          evolutionLevel: 4,
          simulationRequired: true,
          assuranceRequired: true,
          approvalRequired: true,
          minimumEvidence: 25,
          rollbackRequired: true,
          canAutoExecute: false,
        };
    }
  }

  validateNoAuthorityEscalation(
    action: string,
    evolutionLevel: EvolutionLevel,
    hasApproval: boolean,
    actorRole?: string,
  ): void {
    if (actorRole === 'STUDENT') {
      throw new ForbiddenException(
        'Authority Violation: Students cannot configure, approve, or execute continuous ecosystem evolutions.',
      );
    }

    if (evolutionLevel >= 2 && !hasApproval) {
      const reason = `Self-Learning ≠ Self-Authorization Invariant Violation: Action '${action}' at Evolution Level ${evolutionLevel} requires human governance approval before execution.`;
      this.logger.error(reason);
      throw new ForbiddenException(reason);
    }

    if (evolutionLevel === 4 && actorRole !== 'ADMIN') {
      throw new ForbiddenException(
        `Authority Violation: Level 4 High-impact ecosystem changes require Administrator authorization. Role '${actorRole ?? 'UNKNOWN'}' is not authorized.`,
      );
    }
  }
}
