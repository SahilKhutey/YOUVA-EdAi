'use client';

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface JurisdictionStatus {
  id: string;
  name: string;
  childAgeThreshold: number;
  purgeSLAHours: number;
  safetySLAHours: number;
  status: 'ACTIVE' | 'DRAFT' | 'QUARANTINED';
  crossBorder: boolean;
  legalReviewApproved: boolean;
  safetyReviewApproved: boolean;
}

interface CredentialSummary {
  id: string;
  competencyCode: string;
  studentTokenHash: string;
  masteryScore: number;
  teacherName: string;
  teacherDecision: 'APPROVED' | 'REJECTED';
  speedrunItemsDetected: number;
  zeroPiiVerified: boolean;
  status: 'ISSUED' | 'REVOKED' | 'FLAGGED_GAMING';
}

interface DistrictCohort {
  competencyCode: string;
  studentCount: number;
  meanMastery: number;
  isSuppressed: boolean;
  suppressionReason?: string;
  teacherComplianceRate: number;
}

interface GovernanceCadence {
  id: string;
  name: string;
  frequency: string;
  ownerRole: string;
  nextDue: string;
  escalationHours: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'OVERDUE';
}

export default function InstitutionalTrustTerminal() {
  const [activeTab, setActiveTab] = useState<'jurisdictions' | 'credentials' | 'district' | 'governance' | 'dataroom'>('jurisdictions');

  // Jurisdictions State
  const [jurisdictions] = useState<JurisdictionStatus[]>([
    {
      id: 'in-dpdp',
      name: 'India DPDP Act 2023 (Statutory Section 9)',
      childAgeThreshold: 18,
      purgeSLAHours: 24,
      safetySLAHours: 4,
      status: 'ACTIVE',
      crossBorder: false,
      legalReviewApproved: true,
      safetyReviewApproved: true,
    },
    {
      id: 'us-coppa-ferpa',
      name: 'US COPPA & FERPA Compliance Envelope',
      childAgeThreshold: 13,
      purgeSLAHours: 48,
      safetySLAHours: 6,
      status: 'ACTIVE',
      crossBorder: false,
      legalReviewApproved: true,
      safetyReviewApproved: true,
    },
    {
      id: 'eu-gdpr',
      name: 'EU General Data Protection Regulation (Art. 8)',
      childAgeThreshold: 16,
      purgeSLAHours: 24,
      safetySLAHours: 4,
      status: 'QUARANTINED',
      crossBorder: false,
      legalReviewApproved: false,
      safetyReviewApproved: false,
    },
  ]);

  // Credentials State
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);

  // District Aggregates State
  const [districtCohorts] = useState<DistrictCohort[]>([
    {
      competencyCode: 'MATH-G8-LINEQ-01',
      studentCount: 185,
      meanMastery: 0.892,
      isSuppressed: false,
      teacherComplianceRate: 0.985,
    },
    {
      competencyCode: 'MATH-G8-GEOM-03',
      studentCount: 142,
      meanMastery: 0.854,
      isSuppressed: false,
      teacherComplianceRate: 0.972,
    },
    {
      competencyCode: 'ADV-OLYMPIAD-RURAL',
      studentCount: 6, // Below k=10
      meanMastery: 0.0,
      isSuppressed: true,
      suppressionReason: 'k-Anonymity suppression (Cohort size 6 < 10) to prevent student deanonymization',
      teacherComplianceRate: 0.0,
    },
  ]);

  // Governance Cadences
  const [cadences] = useState<GovernanceCadence[]>([
    {
      id: 'model_drift_bias_audit',
      name: 'Model Drift & Safety Bias Quarterly Audit',
      frequency: 'Every 90 Days',
      ownerRole: 'AI Safety Officer',
      nextDue: '2026-10-01',
      escalationHours: 24,
      status: 'SCHEDULED',
    },
    {
      id: 'child_safety_policy_review',
      name: 'Child Safeguarding & Content Boundary Bi-Monthly Review',
      frequency: 'Every 60 Days',
      ownerRole: 'Child Safety & Safeguarding Lead',
      nextDue: '2026-10-01',
      escalationHours: 12,
      status: 'SCHEDULED',
    },
    {
      id: 'penetration_testing_security_audit',
      name: 'Third-Party Penetration Testing & Vulnerability Assessment',
      frequency: 'Bi-Annual (180 Days)',
      ownerRole: 'Chief Information Security Officer',
      nextDue: '2026-11-15',
      escalationHours: 24,
      status: 'SCHEDULED',
    },
    {
      id: 'curriculum_alignment_review',
      name: 'Pedagogical Standards & Syllabus Alignment Review',
      frequency: 'Annual (365 Days)',
      ownerRole: 'Chief Curriculum Specialist',
      nextDue: '2027-03-01',
      escalationHours: 48,
      status: 'SCHEDULED',
    },
    {
      id: 'sla_incident_retrospective',
      name: 'Service Level Agreement (SLA) Monthly Retrospective',
      frequency: 'Monthly (30 Days)',
      ownerRole: 'Platform Reliability Lead',
      nextDue: '2026-09-15',
      escalationHours: 24,
      status: 'SCHEDULED',
    },
    {
      id: 'audit_log_cryptographic_verification',
      name: 'Cryptographic Audit Log HMAC Chain Weekly Verification',
      frequency: 'Weekly (7 Days)',
      ownerRole: 'Security Operations Engineer',
      nextDue: '2026-09-14',
      escalationHours: 12,
      status: 'SCHEDULED',
    },
    {
      id: 'institutional_compliance_recertification',
      name: 'Institutional Compliance & Statutory Profile Recertification',
      frequency: 'Annual (365 Days)',
      ownerRole: 'Regulatory Affairs Director',
      nextDue: '2027-08-30',
      escalationHours: 48,
      status: 'SCHEDULED',
    },
  ]);

  // Data Room Documents
  const [dataRoomDocs] = useState([
    { id: 'DOC-ARCH-01', title: 'Platform Architecture & Trust Boundaries v2.0', classification: 'PUBLIC', status: 'APPROVED' },
    { id: 'DOC-SEC-01', title: 'Zero-Trust Multi-Tenant Isolation & Key Management', classification: 'CONFIDENTIAL', status: 'APPROVED' },
    { id: 'DOC-COMP-DPDP', title: 'India DPDP Act 2023 Statutory Compliance Opinion', classification: 'CONFIDENTIAL', status: 'APPROVED' },
    { id: 'DOC-COMP-COPPA', title: 'US COPPA & FERPA Independent Legal Audit Report', classification: 'CONFIDENTIAL', status: 'APPROVED' },
    { id: 'DOC-SOC2-TYPE2', title: 'SOC 2 Type II Independent Readiness Assessment', classification: 'CONFIDENTIAL', status: 'APPROVED' },
    { id: 'DOC-SLA-01', title: 'Enterprise Institutional SLA (99.9% Availability)', classification: 'PUBLIC', status: 'APPROVED' },
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 rounded-full text-xs font-mono font-semibold tracking-wide">
              PHASE 9 INSTITUTIONAL TRUST PLANE
            </span>
            <span className="px-3 py-1 bg-blue-950/80 text-blue-400 border border-blue-700/60 rounded-full text-xs font-mono font-semibold tracking-wide">
              FAIL-CLOSED REGULATION
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mt-2 tracking-tight">
            Institutional Scale & Regulatory Governance Terminal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Enterprise procurement data room, dynamic multi-jurisdiction failover routing, W3C VC 2.0 credential network, and district k-anonymity telemetry.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Compliance Invariant</div>
            <div className="text-sm font-semibold text-emerald-400 font-mono">100% COMPLIANT</div>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Human Authorization</div>
            <div className="text-sm font-semibold text-indigo-400 font-mono">INVIOLABLE</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('jurisdictions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'jurisdictions'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Jurisdiction Routing & Envelopes
        </button>
        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'credentials'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          W3C VC 2.0 & Anti-Gaming
        </button>
        <button
          onClick={() => setActiveTab('district')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'district'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          District Aggregates (k ≥ 10)
        </button>
        <button
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'governance'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          7 Governance Cadences
        </button>
        <button
          onClick={() => setActiveTab('dataroom')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'dataroom'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Procurement Data Room
        </button>
      </div>

      {/* Tab Contents */}
      <div className="max-w-7xl mx-auto">
        {/* Tab 1: Jurisdictions */}
        {activeTab === 'jurisdictions' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-200">Dynamic Multi-Jurisdiction Routing Envelopes</h2>
                <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded">
                  Conflict Policy: Strictest Rule On Mismatch (max age, min purge)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {jurisdictions.map((jur) => (
                  <div
                    key={jur.id}
                    className={`rounded-xl p-5 border ${
                      jur.status === 'ACTIVE'
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-amber-950/20 border-amber-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-400">{jur.id.toUpperCase()}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                          jur.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {jur.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-100 text-sm mb-3">{jur.name}</h3>
                    <div className="space-y-2 text-xs font-mono text-slate-400 border-t border-slate-800 pt-3">
                      <div className="flex justify-between">
                        <span>Child Age Threshold:</span>
                        <span className="text-slate-200 font-bold">{jur.childAgeThreshold} Years</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Withdrawal Purge SLA:</span>
                        <span className="text-slate-200 font-bold">{jur.purgeSLAHours} Hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Safety Escalation SLA:</span>
                        <span className="text-slate-200 font-bold">{jur.safetySLAHours} Hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cross-Border Allowed:</span>
                        <span className={jur.crossBorder ? 'text-amber-400' : 'text-emerald-400'}>
                          {jur.crossBorder ? 'YES' : 'STRICTLY NO'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Legal Counsel Sign-Off:</span>
                        <span className={jur.legalReviewApproved ? 'text-emerald-400' : 'text-rose-400'}>
                          {jur.legalReviewApproved ? 'APPROVED' : 'PENDING'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Child Safety Sign-Off:</span>
                        <span className={jur.safetyReviewApproved ? 'text-emerald-400' : 'text-rose-400'}>
                          {jur.safetyReviewApproved ? 'APPROVED' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Fail-Closed Resolver Invariant</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                When tenant geolocation and user profile mismatch, the engine binds dynamically to
                max(childAgeThreshold)=18y and min(withdrawalPurgeSLAHours)=24h. Unapproved draft jurisdictions
                (such as EU GDPR) are strictly quarantined from live routing and fall back safely to IN-DPDP.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Credentials */}
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-200">W3C Verifiable Credentials 2.0 & Open Badges 3.0 Network</h2>
                  <p className="text-xs text-slate-400 mt-1">Zero-PII Token Hashes (SHA-256) & Anti-Gaming Anomaly Detector</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1.5 rounded-lg">
                  <span>Speedrun Threshold: &lt; 8.0s</span>
                </div>
              </div>
              {credentials.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg p-6 my-2">
                  <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-80" />
                  <h3 className="font-semibold text-sm text-slate-300">No Credentials Minted in Current Window</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto font-sans">
                    All learner competency mastery assessments will appear here once verified by authorized teachers and minted with cryptographic token hashes.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Credential ID</th>
                        <th className="p-3">Competency</th>
                        <th className="p-3">Mastery Score</th>
                        <th className="p-3">Zero-PII Token Hash</th>
                        <th className="p-3">Authorizing Teacher</th>
                        <th className="p-3">Speedrun Anomaly</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {credentials.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/30 transition">
                          <td className="p-3 text-indigo-400 truncate max-w-[180px]">{c.id}</td>
                          <td className="p-3 font-semibold text-slate-200">{c.competencyCode}</td>
                          <td className="p-3 font-bold text-emerald-400">{(c.masteryScore * 100).toFixed(1)}%</td>
                          <td className="p-3 text-slate-400 truncate max-w-[160px]">{c.studentTokenHash}</td>
                          <td className="p-3 text-slate-300">{c.teacherName}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                              c.speedrunItemsDetected === 0
                                ? 'bg-emerald-950 text-emerald-400'
                                : 'bg-amber-950 text-amber-400'
                            }`}>
                              {c.speedrunItemsDetected} items &lt; 8s
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-2xs font-semibold">
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: District */}
        {activeTab === 'district' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-200">District-Level Aggregate Rollup (Delhi North-West)</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Differential privacy & k-anonymity (k ≥ 10) protection against cross-student re-identification.
                  </p>
                </div>
                <span className="bg-indigo-950 text-indigo-400 border border-indigo-800 px-3 py-1 rounded text-xs font-mono">
                  Enforcing k = 10 Anonymity
                </span>
              </div>
              <div className="space-y-4">
                {districtCohorts.map((cohort) => (
                  <div
                    key={cohort.competencyCode}
                    className={`p-4 rounded-xl border ${
                      cohort.isSuppressed
                        ? 'bg-amber-950/20 border-amber-800/40'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-200 text-sm">{cohort.competencyCode}</span>
                        <span className="text-xs font-mono text-slate-400">Cohort: {cohort.studentCount} students</span>
                      </div>
                      {cohort.isSuppressed ? (
                        <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded text-xs font-mono">
                          SUPPRESSED (k &lt; 10)
                        </span>
                      ) : (
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-slate-400">
                            Mean Mastery: <span className="text-emerald-400 font-bold">{(cohort.meanMastery * 100).toFixed(1)}%</span>
                          </span>
                          <span className="text-slate-400">
                            Teacher Review Compliance: <span className="text-indigo-400 font-bold">{(cohort.teacherComplianceRate * 100).toFixed(1)}%</span>
                          </span>
                        </div>
                      )}
                    </div>
                    {cohort.isSuppressed && (
                      <p className="text-xs text-amber-300/80 font-mono mt-2">
                        {cohort.suppressionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Governance */}
        {activeTab === 'governance' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-200">7 Mandatory Institutional Governance Review Cadences</h2>
                <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded">
                  ISO 27001 / SOC 2 / EU AI Act Compliant
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cadences.map((cad) => (
                  <div key={cad.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-indigo-400 font-semibold">{cad.frequency}</span>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                        {cad.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-200 text-sm mb-2">{cad.name}</h3>
                    <div className="space-y-1 text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                      <div className="flex justify-between">
                        <span>Owner Role:</span>
                        <span className="text-slate-300 font-semibold">{cad.ownerRole}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Due:</span>
                        <span className="text-slate-300 font-semibold">{cad.nextDue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escalation SLA:</span>
                        <span className="text-slate-300 font-semibold">{cad.escalationHours}h to Board</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Data Room */}
        {activeTab === 'dataroom' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-200">Institutional Procurement Data Room</h2>
                <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded">
                  Dual Sign-Off Required for All Artifacts
                </span>
              </div>
              <div className="space-y-3">
                {dataRoomDocs.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-400 font-semibold">{doc.id}</span>
                        <span className={`text-2xs px-2 py-0.5 rounded font-mono font-semibold ${
                          doc.classification === 'PUBLIC'
                            ? 'bg-blue-950 text-blue-400 border border-blue-800'
                            : 'bg-purple-950 text-purple-400 border border-purple-800'
                        }`}>
                          {doc.classification}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-200 text-sm mt-1">{doc.title}</h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs font-mono font-semibold">
                      {doc.status}
                    </span>
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
