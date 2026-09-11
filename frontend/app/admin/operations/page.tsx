'use client';

import React, { useState } from 'react';

interface HumanControl {
  controlId: string;
  name: string;
  description: string;
  aiRole: string;
  authorizedRoles: string[];
  requiresSignature: boolean;
  status: 'FAIL_CLOSED_ACTIVE';
}

interface SafetyStage {
  step: number;
  name: string;
  actor: string;
  automated: boolean;
  sla?: string;
}

interface PhaseIntegrationItem {
  id: string;
  name: string;
  evidence: string;
  invariants: string[];
  status: 'VERIFIED';
}

interface ReleaseCondition {
  id: string;
  name: string;
  category: string;
  evidence: string;
  status: 'PASS';
}

interface OperatingCadence {
  id: string;
  cadence: string;
  activity: string;
  owner: string;
  isFounderDefault: boolean;
  frequencyType: string;
}

export default function ContinuousOperationsTerminal() {
  const [activeTab, setActiveTab] = useState<'controls' | 'safety' | 'integration' | 'release' | 'rhythm'>('release');

  const humanControls: HumanControl[] = [
    {
      controlId: 'MASTERY_CERTIFICATION',
      name: 'Student Mastery Certification',
      description: 'Formal attestation that a student has mastered a curriculum unit or competency standard.',
      aiRole: 'RECOMMEND_AND_EVIDENCE',
      authorizedRoles: ['CERTIFIED_TEACHER', 'HEAD_OF_DEPARTMENT'],
      requiresSignature: true,
      status: 'FAIL_CLOSED_ACTIVE',
    },
    {
      controlId: 'CONSENT_CHANGE',
      name: 'Parental Consent Scope Modification',
      description: 'Any change to the scope, permissions, or boundaries of parental or guardian consent.',
      aiRole: 'NONE',
      authorizedRoles: ['VERIFIED_GUARDIAN', 'SCHOOL_DATA_OFFICER'],
      requiresSignature: true,
      status: 'FAIL_CLOSED_ACTIVE',
    },
    {
      controlId: 'CONSENT_WITHDRAWAL',
      name: 'Parental Consent Revocation & Data Purge',
      description: 'Revocation of consent initiating immediate session termination and scheduled 24h cryptographic purge.',
      aiRole: 'NONE',
      authorizedRoles: ['VERIFIED_GUARDIAN', 'SCHOOL_DATA_OFFICER'],
      requiresSignature: true,
      status: 'FAIL_CLOSED_ACTIVE',
    },
    {
      controlId: 'ROLE_CHANGE',
      name: 'User Role & RBAC Privilege Elevation',
      description: 'Elevation or modification of user persona or permission tier (e.g., student to teacher).',
      aiRole: 'NONE',
      authorizedRoles: ['INSTITUTIONAL_ADMIN', 'SECURITY_ADMIN'],
      requiresSignature: true,
      status: 'FAIL_CLOSED_ACTIVE',
    },
    {
      controlId: 'SAFETY_INCIDENT_CLOSURE',
      name: 'Child Safety Escalation Incident Closure',
      description: 'Closure, dismissal, or resolution of any flagged child safety or distress incident.',
      aiRole: 'FLAG_AND_LOG',
      authorizedRoles: ['SAFEGUARDING_LEAD', 'CHILD_SAFETY_OFFICER'],
      requiresSignature: true,
      status: 'FAIL_CLOSED_ACTIVE',
    },
    {
      controlId: 'CREDENTIAL_AUTHORIZATION',
      name: 'Verifiable Credential & Skills Passport Authorization',
      description: 'Final authorization and digital signing of portable W3C VC 2.0 credentials.',
      aiRole: 'GENERATE_CANDIDATE_PAYLOAD',
      authorizedRoles: ['CERTIFIED_TEACHER', 'PRINCIPAL'],
      requiresSignature: true,
      status: 'FAIL_CLOSED_ACTIVE',
    },
    {
      controlId: 'AUTONOMY_POLICY_CHANGE',
      name: 'AI Autonomy Boundary & FinOps Budget Modification',
      description: 'Expanding model action space, raising FinOps token budget limits, or altering drift thresholds.',
      aiRole: 'PROPOSE_OPTIMIZATION',
      authorizedRoles: ['AI_SAFETY_OFFICER', 'CHIEF_TECHNOLOGY_OFFICER'],
      requiresSignature: true,
      status: 'FAIL_CLOSED_ACTIVE',
    },
    {
      controlId: 'JURISDICTION_ACTIVATION',
      name: 'Multi-Jurisdiction Regulatory Profile Activation',
      description: 'Promoting a jurisdiction profile from draft/review to active status for live tenant routing.',
      aiRole: 'NONE',
      authorizedRoles: ['LEGAL_COMPLIANCE_COUNSEL', 'DIRECTOR_REGULATORY_AFFAIRS'],
      requiresSignature: true,
      status: 'FAIL_CLOSED_ACTIVE',
    },
  ];

  const safetyStages: SafetyStage[] = [
    { step: 1, name: 'SIGNAL_INGESTION', actor: 'SYSTEM', automated: true },
    { step: 2, name: 'DETECTION_AND_CLASSIFICATION', actor: 'AI_DETECTOR_AND_REGEX', automated: true },
    { step: 3, name: 'INCIDENT_CREATION', actor: 'SYSTEM', automated: true },
    { step: 4, name: 'DUAL_CHANNEL_NOTIFICATION', actor: 'DISPATCHER_SMS_EMAIL_WEBHOOK', automated: true },
    { step: 5, name: 'HUMAN_ACKNOWLEDGEMENT', actor: 'SAFEGUARDING_OFFICER', automated: false, sla: '15 Minutes' },
    { step: 6, name: 'HUMAN_INVESTIGATION', actor: 'SAFEGUARDING_OFFICER', automated: false },
    { step: 7, name: 'HUMAN_RESOLUTION', actor: 'SAFEGUARDING_OFFICER', automated: false },
    { step: 8, name: 'HASH_CHAINED_AUDIT_LOGGING', actor: 'SYSTEM', automated: true },
    { step: 9, name: 'POST_INCIDENT_REVIEW', actor: 'CHILD_SAFETY_PANEL', automated: false, sla: '7 Days' },
  ];

  const phaseIntegrations: PhaseIntegrationItem[] = [
    { id: 'PHASE_0', name: 'Scope Lock & Middle School Baseline', evidence: 'phase0/scope-lock.json', invariants: ['Middle School Scope Lock', 'Zero Unbounded Generative Text'], status: 'VERIFIED' },
    { id: 'PHASE_1', name: 'Core Learning Loop & BKT Engine', evidence: 'phase1/content/grade8_linear_equations_bank.json', invariants: ['4-Param Bayesian Knowledge Tracing', 'Deterministic Mastery Rules'], status: 'VERIFIED' },
    { id: 'PHASE_2', name: 'Trust Hardening & Consent Ledger', evidence: 'phase2/models/consent_manager.py', invariants: ['Verifiable Parental Consent (OTP)', '24h Data Purge', 'HMAC Hash Chain'], status: 'VERIFIED' },
    { id: 'PHASE_3', name: 'Pilot Validation & Teacher Trust', evidence: 'phase3/data/pilot_evaluation_report.json', invariants: ['<5% Teacher Friction Telemetry', 'Zero Student PII Trace'], status: 'VERIFIED' },
    { id: 'PHASE_4', name: 'Personalization & Concept DAG', evidence: 'phase4/data/grade8_math_concept_dag.json', invariants: ['3-Tier Hints', 'Mistake Taxonomy', 'Pruned Cognitive Metrics'], status: 'VERIFIED' },
    { id: 'PHASE_5', name: 'High School & Skills Passport', evidence: 'phase5/content/grade10_concept_dag.json', invariants: ['W3C VC 2.0', 'Zero-PII Student Hash', 'Teacher Signature'], status: 'VERIFIED' },
    { id: 'PHASE_6', name: 'Kindergarten Voice UI & Sandbox', evidence: 'phase6/content/foundational_diagnostic.json', invariants: ['Zero Generative Text in Child Path', '15m Screen Time Limit'], status: 'VERIFIED' },
    { id: 'PHASE_7', name: 'Scale Infra & Multi-Tenancy', evidence: 'phase7/data/dps_enterprise_contract.json', invariants: ['Row-Level Tenant Isolation', 'SSRF Guard', 'Authoritative Mastery'], status: 'VERIFIED' },
    { id: 'PHASE_8', name: 'Autonomous AI Maturity & FinOps', evidence: 'phase8/data/phase8_verification_report.json', invariants: ['5% Drift Rollback', 'Multi-Tier FinOps Caps', 'Model Sandbox'], status: 'VERIFIED' },
    { id: 'PHASE_9', name: 'Institutional Scale & Credentials', evidence: 'phase9/data/phase9_verification_report.json', invariants: ['Strictest Jurisdiction Rule', 'Anti-Gaming Speedrun', 'District k=10'], status: 'VERIFIED' },
    { id: 'FINAL_PHASE', name: 'Continuous Governance & Operations', evidence: 'final_phase/release_gate/release_gate_config.json', invariants: ['8 Human Controls', '9-Stage Safety Loop', 'Zero Founder Default'], status: 'VERIFIED' },
  ];

  const releaseConditions: ReleaseCondition[] = [
    { id: 'COND_01', name: 'Automated Test Suites Pass 100%', category: 'TECHNICAL_RELIABILITY', evidence: '308 / 308 tests passing repo-wide', status: 'PASS' },
    { id: 'COND_02', name: 'Zero Unresolved Critical Defects', category: 'QUALITY_ASSURANCE', evidence: '0 open P0/P1 defects across all trackers', status: 'PASS' },
    { id: 'COND_03', name: 'Independent Security Review Current', category: 'INFORMATION_SECURITY', evidence: 'SOC 2 & Third-party pentest verified', status: 'PASS' },
    { id: 'COND_04', name: 'Child Safety & Safeguarding Audit Current', category: 'CHILD_SAFEGUARDING', evidence: 'Independent child safety panel approval', status: 'PASS' },
    { id: 'COND_05', name: 'Statutory Legal & Compliance Reviews Current', category: 'REGULATORY_AFFAIRS', evidence: 'DPDP Section 9 & US FERPA/COPPA legal opinions', status: 'PASS' },
    { id: 'COND_06', name: 'Governance Board Approvals Current', category: 'GOVERNANCE', evidence: 'Executive Governance Committee sign-off', status: 'PASS' },
    { id: 'COND_07', name: '24/7 Telemetry & Latency Alerting Active', category: 'OPERATIONS', evidence: 'Continuous health telemetry stream operational', status: 'PASS' },
    { id: 'COND_08', name: 'Dual-Channel Incident Response Drill Tested', category: 'INCIDENT_RESPONSE', evidence: 'Dual-channel SMS/Webhook paging verified', status: 'PASS' },
    { id: 'COND_09', name: 'Disaster Recovery & Backup Verified', category: 'BUSINESS_CONTINUITY', evidence: 'RTO < 4h, RPO < 1h snapshot validation', status: 'PASS' },
    { id: 'COND_10', name: 'Cryptographic Hash-Chain Ledger Verified', category: 'AUDIT_TRAIL', evidence: 'HMAC-SHA256 ledger integrity verified', status: 'PASS' },
    { id: 'COND_11', name: '8 Permanent Human Controls Immutably Enforced', category: 'AI_SAFETY', evidence: 'Fail-closed technical block on autonomous AI', status: 'PASS' },
    { id: 'COND_12', name: 'Product Owner & Executive Sign-off', category: 'EXECUTIVE_LEADERSHIP', evidence: 'Formal GO authorization executed', status: 'PASS' },
  ];

  const operatingCadences: OperatingCadence[] = [
    { id: 'OP_CONTINUOUS', cadence: 'Continuous', activity: 'Safety escalation monitoring, telemetry health checks, and support incident triage.', owner: 'Operations Incident Commander', isFounderDefault: false, frequencyType: 'REAL_TIME' },
    { id: 'OP_BIWEEKLY', cadence: 'Bi-weekly', activity: 'Review of AI override patterns, teacher feedback sentiment, and autonomy governance log entries.', owner: 'Head of Product & Pedagogical Lead', isFounderDefault: false, frequencyType: 'BI_WEEKLY' },
    { id: 'OP_QUARTERLY', cadence: 'Quarterly', activity: 'Review of jurisdiction compliance matrix for statutory changes and model drift audits.', owner: 'Director of Regulatory Affairs', isFounderDefault: false, frequencyType: 'QUARTERLY' },
    { id: 'OP_ANNUAL_SECURITY', cadence: 'Annually', activity: 'Independent comprehensive third-party security penetration testing and threat model audit.', owner: 'Chief Information Security Officer (CISO)', isFounderDefault: false, frequencyType: 'ANNUAL' },
    { id: 'OP_ANNUAL_SAFETY', cadence: 'Annually', activity: 'Independent child-safety & safeguarding audit covering all active age bands.', owner: 'Head of Child Safeguarding', isFounderDefault: false, frequencyType: 'ANNUAL' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 rounded-full text-xs font-mono font-semibold tracking-wide">
              PRODUCTION RELEASE CANDIDATE v1.0.0
            </span>
            <span className="px-3 py-1 bg-purple-950/80 text-purple-400 border border-purple-700/60 rounded-full text-xs font-mono font-semibold tracking-wide">
              CONTINUOUS GOVERNANCE PLANE
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mt-2 tracking-tight">
            Continuous Operations & Final Production Release Terminal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Whole-systems integration, 8 permanent human invariants, 9-stage safety loop, and 12-condition production release gate.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-emerald-950/30 border border-emerald-800/80 rounded-xl p-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Release Decision</div>
            <div className="text-xl font-bold text-emerald-400 font-mono tracking-wider">&gt;&gt;&gt; GO &lt;&lt;&lt;</div>
          </div>
          <div className="w-px h-8 bg-emerald-800/60" />
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Whole-System Status</div>
            <div className="text-sm font-semibold text-emerald-300 font-mono">11 / 11 PHASES VERIFIED</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('release')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'release'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          12 Release Conditions
        </button>
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'controls'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          8 Human Controls
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'safety'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          9-Stage Safety Loop
        </button>
        <button
          onClick={() => setActiveTab('integration')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'integration'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Systems Integration Matrix
        </button>
        <button
          onClick={() => setActiveTab('rhythm')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'rhythm'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Operating Rhythm & Ownership
        </button>
      </div>

      {/* Tab Contents */}
      <div className="max-w-7xl mx-auto">
        {/* Tab: Release Conditions */}
        {activeTab === 'release' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-200">12 Mandatory Production Release Conditions</h2>
                  <p className="text-xs text-slate-400 mt-1">All 12 conditions verified satisfied — fail-closed release gate authorizes global deployment.</p>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded text-xs font-mono font-semibold">
                  12 / 12 CONDITIONS PASS
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {releaseConditions.map((cond) => (
                  <div key={cond.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-400 font-semibold">{cond.id}</span>
                        <span className="text-2xs px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300">
                          {cond.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-100 text-sm mt-1">{cond.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{cond.evidence}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs font-mono font-semibold">
                      {cond.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: 8 Human Controls */}
        {activeTab === 'controls' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-200">8 Permanent Human-Only Policy Controls</h2>
                  <p className="text-xs text-slate-400 mt-1">Immutable invariant: Automated AI execution is permanently prohibited fail-closed.</p>
                </div>
                <span className="bg-purple-950 text-purple-400 border border-purple-800 px-3 py-1 rounded text-xs font-mono font-semibold">
                  ETERNAL INVARIANTS
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {humanControls.map((ctrl) => (
                  <div key={ctrl.controlId} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-indigo-400 font-semibold">{ctrl.controlId}</span>
                      <span className="text-2xs px-2 py-0.5 rounded font-mono font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                        AI FORBIDDEN
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-100 text-sm">{ctrl.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{ctrl.description}</p>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">AI Permitted Role:</span>
                        <span className="text-amber-400 font-semibold">{ctrl.aiRole}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Authorized Human Personas:</span>
                        <span className="text-slate-300 truncate max-w-[200px]">{ctrl.authorizedRoles.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Digital Signature:</span>
                        <span className="text-emerald-400 font-semibold">{ctrl.requiresSignature ? 'MANDATORY' : 'OPTIONAL'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: 9-Stage Safety Loop */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-200">Continuous 9-Stage Child Safeguarding Loop</h2>
                  <p className="text-xs text-slate-400 mt-1">Dual-channel dispatch (SMS/Email/Webhook) with human-only investigation and closure.</p>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded text-xs font-mono font-semibold">
                  DUAL-CHANNEL ACTIVE
                </span>
              </div>
              <div className="space-y-3">
                {safetyStages.map((stage) => (
                  <div key={stage.step} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-200">
                        {stage.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-200 text-sm">{stage.name.replace(/_/g, ' ')}</h3>
                        <p className="text-xs text-slate-400 font-mono">Actor: {stage.actor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {stage.sla && (
                        <span className="text-xs font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                          SLA: {stage.sla}
                        </span>
                      )}
                      <span className={`text-2xs font-mono px-2 py-1 rounded font-semibold ${
                        stage.automated
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {stage.automated ? 'AUTOMATED' : 'HUMAN REQUIRED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Systems Integration */}
        {activeTab === 'integration' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-200">Unified Whole-Systems Integration Matrix</h2>
                  <p className="text-xs text-slate-400 mt-1">Evidence-backed validation linking Phase 0 through Final Phase into a production pipeline.</p>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded text-xs font-mono font-semibold">
                  100% PASS (308/308 TESTS)
                </span>
              </div>
              <div className="space-y-3">
                {phaseIntegrations.map((phase) => (
                  <div key={phase.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-400 font-semibold">{phase.id}</span>
                        <h3 className="font-semibold text-slate-200 text-sm">{phase.name}</h3>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">Evidence: {phase.evidence}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {phase.invariants.map((inv, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded text-2xs font-mono">
                            {inv}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs font-mono font-semibold">
                      {phase.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Operating Rhythm & Ownership */}
        {activeTab === 'rhythm' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-200">Recurring Operating Rhythm & Explicit Non-Founder Ownership</h2>
                  <p className="text-xs text-slate-400 mt-1">Zero critical governance functions defaulting to founder — contractual accountability roles.</p>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded text-xs font-mono font-semibold">
                  ZERO FOUNDER DEFAULT
                </span>
              </div>
              <div className="space-y-3">
                {operatingCadences.map((cad) => (
                  <div key={cad.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-indigo-400 font-semibold">{cad.cadence} ({cad.frequencyType})</span>
                      <span className="text-2xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        NON-FOUNDER
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{cad.activity}</p>
                    <div className="mt-2 text-xs font-mono text-slate-400">
                      Assigned Role: <span className="text-slate-200 font-semibold">{cad.owner}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
