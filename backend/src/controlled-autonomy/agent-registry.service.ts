import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  AgentIdentity,
  AgentLifecycleState,
  AutonomyClass,
  ConsequentialActionType,
  ModelVersionRecord,
} from './n15-types';

@Injectable()
export class AgentRegistryService {
  private readonly logger = new Logger(AgentRegistryService.name);
  private agents: Map<string, AgentIdentity> = new Map();
  private modelRegistry: Map<string, ModelVersionRecord> = new Map();

  constructor() {
    this.seedCanonicalAgents();
    this.seedCanonicalModels();
  }

  private seedCanonicalAgents() {
    const mathTutor: AgentIdentity = {
      agentId: 'agent-math-tutor-v2',
      name: 'Secondary Math Socratic Tutor',
      version: '2.1.0',
      owner: 'pedagogy-lead-01',
      purpose: 'Generate hints, explanations, and recommend practice exercises',
      autonomyLevel: 'A3_BOUNDED_EXECUTION',
      allowedActions: ['EXPLAIN_CONCEPT', 'GENERATE_HINT', 'RECOMMEND_PRACTICE', 'SCHEDULE_REVISION'],
      deniedActions: [
        'LEARNING_STATE_CHANGE',
        'MASTERY_OVERRIDE',
        'ASSESSMENT_RESULT',
        'SAFETY_RESOLUTION',
        'CONSENT_CHANGE',
        'CREDENTIAL_ISSUANCE',
      ],
      policyVersion: 'pol-math-v2.1',
      lifecycleState: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const safetyTriage: AgentIdentity = {
      agentId: 'agent-safety-triage-v1',
      name: 'Acoustic & Semantic Safety Triage Agent',
      version: '1.4.2',
      owner: 'child-safety-officer',
      purpose: 'Detect distress, classify safety keywords, and escalate to human safeguarding',
      autonomyLevel: 'A2_RECOMMENDATION',
      allowedActions: ['DETECT_SAFETY_RISK', 'CLASSIFY_SEVERITY', 'RECOMMEND_ESCALATION'],
      deniedActions: [
        'SAFETY_RESOLUTION',
        'CONSENT_CHANGE',
        'ACCOUNT_DELETION',
        'MASTERY_OVERRIDE',
      ],
      policyVersion: 'pol-safety-v1.4',
      lifecycleState: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const credentialAssistant: AgentIdentity = {
      agentId: 'agent-cred-assistant-v1',
      name: 'High School Skills Passport Assistant',
      version: '1.0.1',
      owner: 'credential-admin',
      purpose: 'Aggregate multi-source learning evidence and check eligibility for W3C VC 2.0',
      autonomyLevel: 'A2_RECOMMENDATION',
      allowedActions: ['AGGREGATE_EVIDENCE', 'CALCULATE_ELIGIBILITY', 'FLAG_MISSING_ARTIFACTS'],
      deniedActions: [
        'CREDENTIAL_ISSUANCE',
        'CREDENTIAL_REVOCATION',
        'MASTERY_OVERRIDE',
      ],
      policyVersion: 'pol-cred-v1.0',
      lifecycleState: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.agents.set(mathTutor.agentId, mathTutor);
    this.agents.set(safetyTriage.agentId, safetyTriage);
    this.agents.set(credentialAssistant.agentId, credentialAssistant);
  }

  private seedCanonicalModels() {
    const geminiPro: ModelVersionRecord = {
      modelId: 'gemini-1.5-pro',
      provider: 'GEMINI',
      version: '1.5-pro-002',
      capabilities: ['TEXT', 'VISION', 'AUDIO', 'REASONING'],
      allowedPurposes: ['HIGH_SCHOOL_EXPLANATION', 'PROJECT_EVALUATION_RECOMMENDATION'],
      policyVersion: 'pol-model-gemini-v1',
      evaluationVersion: 'eval-2026-q3',
      status: 'ACTIVE',
    };

    const geminiFlash: ModelVersionRecord = {
      modelId: 'gemini-1.5-flash',
      provider: 'GEMINI',
      version: '1.5-flash-002',
      capabilities: ['TEXT', 'VOICE_FAST', 'LOW_LATENCY'],
      allowedPurposes: ['PRACTICE_HINT', 'FORMATIVE_FEEDBACK', 'TRIAGE'],
      policyVersion: 'pol-model-flash-v1',
      evaluationVersion: 'eval-2026-q3',
      status: 'ACTIVE',
    };

    const ollamaLocal: ModelVersionRecord = {
      modelId: 'gemma-2-9b-it',
      provider: 'OLLAMA_LOCAL',
      version: '2.0.0',
      capabilities: ['TEXT', 'LOCAL_FALLBACK'],
      allowedPurposes: ['OFFLINE_HINT', 'DETERMINISTIC_EXPLANATION'],
      policyVersion: 'pol-model-gemma-v1',
      evaluationVersion: 'eval-2026-q3',
      status: 'SHADOW',
    };

    this.modelRegistry.set(geminiPro.modelId, geminiPro);
    this.modelRegistry.set(geminiFlash.modelId, geminiFlash);
    this.modelRegistry.set(ollamaLocal.modelId, ollamaLocal);
  }

  // --- 1. Agent Registration & Identity Governance (Clauses N15.10 - N15.11) ---

  public registerAgent(identity: Omit<AgentIdentity, 'createdAt' | 'updatedAt' | 'lifecycleState'>): AgentIdentity {
    // Invariant N15.10: Never run AI operations under a generic "AI_SYSTEM" identity
    if (!identity.agentId || identity.agentId.toUpperCase() === 'AI_SYSTEM' || identity.agentId === 'generic-ai') {
      throw new BadRequestException('AUT-001: Generic AI_SYSTEM identity is prohibited. Specific agentId required.');
    }

    if (this.agents.has(identity.agentId)) {
      throw new BadRequestException(`AUT-002: Agent with ID [${identity.agentId}] is already registered`);
    }

    const newAgent: AgentIdentity = {
      ...identity,
      lifecycleState: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.agents.set(newAgent.agentId, newAgent);
    this.logger.log(`Registered new agent [${newAgent.agentId}] in state DRAFT`);
    return newAgent;
  }

  public getAgent(agentId: string): AgentIdentity {
    const a = this.agents.get(agentId);
    if (!a) {
      throw new NotFoundException(`AUT-003: Agent [${agentId}] not found in registry`);
    }
    return a;
  }

  public listAgents(): AgentIdentity[] {
    return Array.from(this.agents.values());
  }

  // --- 2. 9-State Agent Lifecycle State Machine (Clause N15.131) ---

  public transitionLifecycle(
    agentId: string,
    targetState: AgentLifecycleState,
    approverId: string,
    notes?: string
  ): AgentIdentity {
    const agent = this.getAgent(agentId);
    const validTransitions: Record<AgentLifecycleState, AgentLifecycleState[]> = {
      DRAFT: ['EVALUATION', 'RETIRED'],
      EVALUATION: ['SHADOW', 'DRAFT', 'RETIRED'],
      SHADOW: ['APPROVED', 'EVALUATION', 'RETIRED'],
      APPROVED: ['ACTIVE', 'RESTRICTED', 'RETIRED'],
      ACTIVE: ['RESTRICTED', 'SUSPENDED', 'DEPRECATED'],
      RESTRICTED: ['ACTIVE', 'SUSPENDED', 'DEPRECATED'],
      SUSPENDED: ['RESTRICTED', 'DEPRECATED', 'RETIRED'],
      DEPRECATED: ['RETIRED'],
      RETIRED: [],
    };

    if (!validTransitions[agent.lifecycleState].includes(targetState)) {
      throw new BadRequestException(
        `AUT-005: Illegal agent lifecycle transition from [${agent.lifecycleState}] to [${targetState}]`
      );
    }

    agent.lifecycleState = targetState;
    agent.updatedAt = new Date().toISOString();
    this.logger.log(`Agent [${agentId}] transitioned to [${targetState}] by [${approverId}]. Notes: ${notes || 'none'}`);
    return agent;
  }

  // --- 3. Agent Least Privilege Verification (Clause N15.11) ---

  public assertAgentCanExecute(agentId: string, actionType: string): void {
    const agent = this.getAgent(agentId);

    // 1. Lifecycle verification: Must be ACTIVE or RESTRICTED
    if (agent.lifecycleState !== 'ACTIVE' && agent.lifecycleState !== 'RESTRICTED') {
      throw new ForbiddenException(
        `AUT-006: Agent [${agentId}] is in lifecycle state [${agent.lifecycleState}]. Execution barred.`
      );
    }

    // 2. Denied actions invariant check
    if (agent.deniedActions.includes(actionType as ConsequentialActionType)) {
      throw new ForbiddenException(
        `AUT-007: Least Privilege Violation. Action [${actionType}] is explicitly in deniedActions list for [${agentId}]`
      );
    }

    // 3. Allowed actions whitelist check
    if (!agent.allowedActions.includes(actionType)) {
      throw new ForbiddenException(
        `AUT-008: Action [${actionType}] is not in authorized allowedActions for agent [${agentId}]`
      );
    }
  }

  // --- 4. Model Registry & Change Gates (Clauses N15.65, N15.106) ---

  public registerModel(record: ModelVersionRecord): ModelVersionRecord {
    this.modelRegistry.set(record.modelId, { ...record });
    return record;
  }

  public getModel(modelId: string): ModelVersionRecord {
    const m = this.modelRegistry.get(modelId);
    if (!m) {
      throw new NotFoundException(`AUT-012: Model [${modelId}] not registered in model registry`);
    }
    return m;
  }

  public assertModelChangeGate(modelId: string, intendedPurpose: string): boolean {
    const m = this.getModel(modelId);
    if (m.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `AUT-013: Model [${modelId}] is in state [${m.status}]. Must pass evaluation gate before production activation.`
      );
    }
    if (!m.allowedPurposes.includes(intendedPurpose)) {
      throw new ForbiddenException(
        `AUT-014: Model [${modelId}] is not authorized for purpose [${intendedPurpose}]`
      );
    }
    return true;
  }
}
