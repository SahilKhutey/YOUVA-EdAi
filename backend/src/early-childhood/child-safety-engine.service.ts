import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ChildSafetyIncident,
  ChildSafetyCategory,
  ChildSafetySeverity,
} from './early-childhood-types';

@Injectable()
export class ChildSafetyEngineService {
  private readonly logger = new Logger(ChildSafetyEngineService.name);
  private readonly incidents = new Map<string, ChildSafetyIncident>();

  // Regex patterns for risk classification across 10 categories
  private readonly riskPatterns: Array<{
    category: ChildSafetyCategory;
    severity: ChildSafetySeverity;
    pattern: RegExp;
  }> = [
    { category: 'SELF_HARM', severity: 'CRITICAL', pattern: /hurt\s+myself|kill\s+myself|want\s+to\s+die|cut\s+myself/i },
    { category: 'ABUSE', severity: 'CRITICAL', pattern: /touching\s+me|hurting\s+me\s+at\s+home|scared\s+of\s+(uncle|dad|stepdad|teacher)|beats\s+me/i },
    { category: 'SEXUAL_SAFETY', severity: 'CRITICAL', pattern: /take\s+off\s+clothes|show\s+your\s+body|private\s+parts|send\s+photo\s+naked/i },
    { category: 'EXPLOITATION', severity: 'HIGH', pattern: /give\s+me\s+money|send\s+address|where\s+do\s+you\s+live|keep\s+it\s+secret/i },
    { category: 'BULLYING', severity: 'MEDIUM', pattern: /they\s+call\s+me\s+ugly|nobody\s+likes\s+me|hate\s+me\s+at\s+school|hitting\s+me\s+at\s+recess/i },
    { category: 'DANGEROUS_ACTIVITY', severity: 'HIGH', pattern: /drink\s+bleach|climb\s+out\s+window|play\s+with\s+fire|eat\s+pills/i },
    { category: 'VIOLENCE', severity: 'HIGH', pattern: /bring\s+a\s+knife|shoot\s+them|punch\s+their\s+face|choke/i },
    { category: 'PRIVACY_RISK', severity: 'MEDIUM', pattern: /my\s+phone\s+number\s+is|my\s+credit\s+card|my\s+house\s+address\s+is/i },
    { category: 'UNSAFE_ADVICE', severity: 'MEDIUM', pattern: /don'?t\s+tell\s+a\s+doctor|stop\s+taking\s+medicine/i },
  ];

  /**
   * Scans child text or transcript for safety risks (Clauses N13.28 - N13.30).
   */
  evaluateChildInput(params: {
    learnerId: string;
    tenantId: string;
    inputContent: string;
  }): { hasRisk: boolean; incident?: ChildSafetyIncident; protectiveMessage?: string } {
    const { learnerId, tenantId, inputContent } = params;

    for (const rule of this.riskPatterns) {
      if (rule.pattern.test(inputContent)) {
        const incidentId = `safe-inc-${crypto.randomUUID()}`;
        const incident: ChildSafetyIncident = {
          incidentId,
          learnerId,
          tenantId,
          category: rule.category,
          severity: rule.severity,
          triggerContext: inputContent,
          detectedAt: new Date().toISOString(),
          resolutionStatus: 'ESCALATED',
          escalationRecipients: rule.severity === 'CRITICAL'
            ? ['PARENT', 'TEACHER', 'SAFEGUARDING_OFFICER']
            : ['TEACHER', 'PARENT'],
        };

        this.incidents.set(incidentId, incident);
        this.logger.warn(`CHILD SAFETY RISK DETECTED: [${rule.category}] - Severity: ${rule.severity} for learner ${learnerId}`);

        return {
          hasRisk: true,
          incident,
          protectiveMessage: 'You are safe here. I have let your teacher and family know so we can help support you right away.',
        };
      }
    }

    return { hasRisk: false };
  }

  getIncident(incidentId: string): ChildSafetyIncident {
    const inc = this.incidents.get(incidentId);
    if (!inc) {
      throw new NotFoundException(`Safety incident '${incidentId}' not found.`);
    }
    return inc;
  }

  listIncidents(tenantId?: string): ChildSafetyIncident[] {
    let list = Array.from(this.incidents.values());
    if (tenantId) {
      list = list.filter(i => i.tenantId === tenantId);
    }
    return list;
  }

  /**
   * Resolves a child safety incident.
   * Enforces Clause N13.31 Invariant: AI actors are strictly prohibited from resolving safety events.
   */
  resolveIncident(params: {
    incidentId: string;
    actorId: string;
    actorType: 'HUMAN' | 'AI';
    rationale: string;
    signature: string;
  }): ChildSafetyIncident {
    // Clause N13.31 Hard Non-Repudiation Invariant
    if (params.actorType === 'AI') {
      this.logger.error(`PROHIBITED ACTION: AI actor '${params.actorId}' attempted to resolve safety incident '${params.incidentId}'`);
      throw new ForbiddenException(
        'SafetyGovernanceViolation: AI systems are strictly prohibited from closing or resolving child safety events (Clause N13.31).'
      );
    }

    if (!params.rationale || params.rationale.length < 10) {
      throw new BadRequestException('Human resolver must provide detailed protective rationale (minimum 10 characters).');
    }
    if (!params.signature || params.signature.length < 8) {
      throw new BadRequestException('Digital signature required for human incident resolution.');
    }

    const inc = this.getIncident(params.incidentId);
    inc.resolutionStatus = 'RESOLVED';
    inc.resolvedAt = new Date().toISOString();
    inc.resolvedBy = params.actorId;
    inc.resolutionRationale = params.rationale;

    this.logger.log(`Child safety incident ${params.incidentId} formally resolved by human actor ${params.actorId}`);
    return inc;
  }
}
