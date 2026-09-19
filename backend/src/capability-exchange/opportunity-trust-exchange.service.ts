import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  OpportunityTrustSignal,
  OpportunityFraudReport,
  OpportunityAgentAction,
  CapabilityExchangeRequest,
  CapabilityExchangeResult,
  AgentActionType,
} from './n22-types';
import * as crypto from 'crypto';

const PROHIBITED_AGENT_ACTIONS: string[] = [
  'BIND_CONTRACT',
  'NEGOTIATE_SALARY',
  'AUTO_SUBMIT',
  'REJECT_APPLICANT',
  'MAKE_ADMISSION_DECISION',
];

@Injectable()
export class OpportunityTrustExchangeService {
  private readonly trustSignals = new Map<string, OpportunityTrustSignal>();
  private readonly fraudReports = new Map<string, OpportunityFraudReport>();
  private readonly agentActions = new Map<string, OpportunityAgentAction>();
  private readonly exchangeResults = new Map<string, CapabilityExchangeResult>();

  constructor() {
    this.seedTrustSignals();
  }

  /**
   * Retrieves trust signals for a given provider.
   */
  getTrustSignal(providerId: string): OpportunityTrustSignal {
    const existing = this.trustSignals.get(providerId);
    if (existing) {
      return existing;
    }

    const defaultSignal: OpportunityTrustSignal = {
      providerId,
      verificationLevel: 'COMMUNITY_VERIFIED',
      complaintRate: 0.0,
      payTransparencyScore: 0.9,
      freshnessAvgDays: 12,
      isSuspended: false,
    };
    this.trustSignals.set(providerId, defaultSignal);
    return defaultSignal;
  }

  /**
   * Invariant N22.155: Transparent, non-accusatory anomaly & fraud reporting.
   */
  reportFraud(report: Partial<OpportunityFraudReport>): OpportunityFraudReport {
    if (!report.opportunityId || !report.reporterId || !report.anomalyType) {
      throw new BadRequestException('opportunityId, reporterId, and anomalyType are required');
    }

    const reportId = report.reportId || `fraud_${crypto.randomBytes(8).toString('hex')}`;
    const record: OpportunityFraudReport = {
      reportId,
      opportunityId: report.opportunityId,
      reporterId: report.reporterId,
      anomalyType: report.anomalyType,
      description: report.description || '',
      status: 'PENDING_REVIEW',
      reportedAt: new Date().toISOString(),
    };

    this.fraudReports.set(reportId, record);
    return record;
  }

  reviewFraudReport(
    reportId: string,
    status: OpportunityFraudReport['status'],
    resolutionNotes?: string,
  ): OpportunityFraudReport {
    const report = this.fraudReports.get(reportId);
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    report.status = status;
    if (resolutionNotes) {
      report.resolutionNotes = resolutionNotes;
    }

    return report;
  }

  listFraudReports(opportunityId?: string): OpportunityFraudReport[] {
    let reports = Array.from(this.fraudReports.values());
    if (opportunityId) {
      reports = reports.filter((r) => r.opportunityId === opportunityId);
    }
    return reports;
  }

  /**
   * Invariant N22.19, N22.46–N22.47, N22.170–N22.174:
   * Strict Non-Consequential AI Determination.
   * AI cannot independently accept contracts, negotiate salary, submit without consent, or reject applicants.
   */
  authorizeAgentAction(action: Partial<OpportunityAgentAction>): OpportunityAgentAction {
    if (!action.agentId || !action.learnerId || !action.actionType) {
      throw new BadRequestException('agentId, learnerId, and actionType are required');
    }

    // Constitutional Invariant Check
    if (PROHIBITED_AGENT_ACTIONS.includes(action.actionType)) {
      throw new ForbiddenException(
        `Prohibited consequential AI action: '${action.actionType}'. Autonomous AI agents cannot make legally binding commitments, negotiate salary, auto-submit applications, or render consequential admissions/employment decisions under YOUVA-N22-CHARTER-2026.`,
      );
    }

    if (!action.authorizedByLearner || !action.authorizationToken) {
      throw new BadRequestException(
        'Agent action must be explicitly authorized by the learner with an authorization token',
      );
    }

    const actionId = action.actionId || `act_${crypto.randomBytes(8).toString('hex')}`;
    const record: OpportunityAgentAction = {
      actionId,
      agentId: action.agentId,
      learnerId: action.learnerId,
      actionType: action.actionType as AgentActionType,
      authorizedByLearner: true,
      authorizationToken: action.authorizationToken,
      payload: action.payload || {},
      status: 'PENDING_CONFIRMATION',
      timestamp: new Date().toISOString(),
    };

    this.agentActions.set(actionId, record);
    return record;
  }

  executeAgentAction(actionId: string): OpportunityAgentAction {
    const action = this.agentActions.get(actionId);
    if (!action) {
      throw new NotFoundException(`Agent action ${actionId} not found`);
    }

    action.status = 'EXECUTED';
    action.timestamp = new Date().toISOString();
    return action;
  }

  /**
   * Submits a formal capability exchange request between learner and opportunity.
   */
  submitExchangeRequest(req: Partial<CapabilityExchangeRequest>): CapabilityExchangeResult {
    if (!req.learnerId || !req.opportunityId || !req.disclosureToken) {
      throw new BadRequestException('learnerId, opportunityId, and disclosureToken are required');
    }

    if (!req.consentAcknowledged) {
      throw new BadRequestException('Learner consent must be explicitly acknowledged');
    }

    const exchangeId = `exch_${crypto.randomBytes(8).toString('hex')}`;
    const requestId = req.requestId || `req_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    const result: CapabilityExchangeResult = {
      exchangeId,
      requestId,
      learnerId: req.learnerId,
      opportunityId: req.opportunityId,
      status: 'SUBMITTED',
      auditTrail: [
        {
          event: 'EXCHANGE_REQUEST_SUBMITTED',
          timestamp: now,
          actor: `LEARNER:${req.learnerId}`,
        },
      ],
      updatedAt: now,
    };

    this.exchangeResults.set(exchangeId, result);
    return result;
  }

  updateExchangeStatus(
    exchangeId: string,
    newStatus: CapabilityExchangeResult['status'],
    actor: string,
  ): CapabilityExchangeResult {
    const result = this.exchangeResults.get(exchangeId);
    if (!result) {
      throw new NotFoundException(`Exchange record ${exchangeId} not found`);
    }

    result.status = newStatus;
    result.updatedAt = new Date().toISOString();
    result.auditTrail.push({
      event: `STATUS_UPDATED_TO_${newStatus}`,
      timestamp: result.updatedAt,
      actor,
    });

    return result;
  }

  listExchangeRequests(learnerId?: string, opportunityId?: string): CapabilityExchangeResult[] {
    let list = Array.from(this.exchangeResults.values());
    if (learnerId) {
      list = list.filter((e) => e.learnerId === learnerId);
    }
    if (opportunityId) {
      list = list.filter((e) => e.opportunityId === opportunityId);
    }
    return list;
  }

  private seedTrustSignals(): void {
    this.trustSignals.set('prov_deepmind_edu', {
      providerId: 'prov_deepmind_edu',
      verificationLevel: 'ENTERPRISE_AUDITED',
      complaintRate: 0.0,
      payTransparencyScore: 1.0,
      freshnessAvgDays: 5,
      isSuspended: false,
    });

    this.trustSignals.set('prov_youva_foundation', {
      providerId: 'prov_youva_foundation',
      verificationLevel: 'INSTITUTION_ATTESTED',
      complaintRate: 0.01,
      payTransparencyScore: 0.95,
      freshnessAvgDays: 8,
      isSuspended: false,
    });

    this.trustSignals.set('prov_global_skills_alliance', {
      providerId: 'prov_global_skills_alliance',
      verificationLevel: 'COMMUNITY_VERIFIED',
      complaintRate: 0.03,
      payTransparencyScore: 0.88,
      freshnessAvgDays: 14,
      isSuspended: false,
    });
  }
}
