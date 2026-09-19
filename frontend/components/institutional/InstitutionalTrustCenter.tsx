'use client';

import React, { useState } from 'react';

interface ProductClaimItem {
  claimId: string;
  statement: string;
  category: string;
  evidenceLevel: string;
  owner: string;
  nextReviewAt: string;
  status: 'CURRENT' | 'STALE' | 'DOWNGRADED';
}

const DEFAULT_CLAIMS: ProductClaimItem[] = [
  {
    claimId: 'claim-bkt-efficacy',
    statement: 'Bayesian Knowledge Tracing improves conceptual mastery retention by 22% over baseline instruction.',
    category: 'PEDAGOGICAL',
    evidenceLevel: 'PILOT_VALIDATED',
    owner: 'Dr. Ananya Roy (Pedagogy Lead)',
    nextReviewAt: '2026-11-20',
    status: 'CURRENT',
  },
  {
    claimId: 'claim-child-safety-response',
    statement: 'Automated safeguarding sentinel escalates flagged minor harm signals to human reviewers within 120 seconds.',
    category: 'SAFETY',
    evidenceLevel: 'INDEPENDENTLY_VERIFIED',
    owner: 'Safeguarding Officer Verma',
    nextReviewAt: '2026-12-15',
    status: 'CURRENT',
  },
  {
    claimId: 'claim-sovereign-residency',
    statement: '100% of Indian learner data, audit logs, and media remain strictly localized within ap-south-1 enclaves.',
    category: 'PRIVACY',
    evidenceLevel: 'INDEPENDENTLY_VERIFIED',
    owner: 'Compliance Advisory Board',
    nextReviewAt: '2026-10-30',
    status: 'CURRENT',
  },
  {
    claimId: 'claim-zero-autonomous-credential',
    statement: 'Autonomous AI models are programmatically barred from directly issuing or revoking credentials without human ticket.',
    category: 'AI_GOVERNANCE',
    evidenceLevel: 'TESTED',
    owner: 'Architecture Governance Board',
    nextReviewAt: '2026-11-05',
    status: 'CURRENT',
  },
];

const SUBPROCESSORS = [
  {
    name: 'Google Cloud Platform (ap-south-1)',
    purpose: 'Sovereign Database & Cloud Compute for Indian Institutions',
    jurisdictions: 'IN-DL',
    cert: 'ISO 27001, SOC 2 Type II',
  },
  {
    name: 'Amazon Web Services (eu-central-1)',
    purpose: 'EU Sovereign Learner Enclave & EBSI Credential Nodes',
    jurisdictions: 'EU-DE',
    cert: 'C5, BSI IT-Grundschutz, ISO 27018',
  },
  {
    name: 'Amazon Web Services (us-west-2)',
    purpose: 'US Common Core Educational Workloads & SOC 2 Vault',
    jurisdictions: 'US-CA',
    cert: 'FERPA Certified, SOC 2 Type II, FedRAMP',
  },
];

export function InstitutionalTrustCenter() {
  const [activeTab, setActiveTab] = useState<'CLAIMS' | 'SUBPROCESSORS' | 'CERTIFICATIONS'>('CLAIMS');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Institutional Trust Center</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Clauses N16.37–N16.39
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Verified product claims, independent security audit ledgers, subprocessor governance, and regulatory attestations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Audit Status: Validated
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 my-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('CLAIMS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'CLAIMS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Product Claims Registry (Clause N16.38)
        </button>
        <button
          onClick={() => setActiveTab('SUBPROCESSORS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'SUBPROCESSORS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Subprocessor Directory (Clause N16.98)
        </button>
        <button
          onClick={() => setActiveTab('CERTIFICATIONS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'CERTIFICATIONS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Independent Certifications
        </button>
      </div>

      {/* Tab 1: Claims Registry */}
      {activeTab === 'CLAIMS' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-lg text-xs text-indigo-200">
            <strong>Claim Expiration Policy:</strong> No marketing or pedagogical claim is permanent. Stale claims are
            automatically downgraded to <code>TESTED</code> when the review window expires.
          </div>

          <div className="grid grid-cols-1 gap-3">
            {DEFAULT_CLAIMS.map((claim) => (
              <div
                key={claim.claimId}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {claim.category}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {claim.evidenceLevel}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-100">{claim.statement}</p>
                  <p className="text-xs text-slate-400">Accountable Owner: {claim.owner}</p>
                </div>

                <div className="text-right whitespace-nowrap">
                  <span className="text-[11px] text-slate-400 block">Next Review Date</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{claim.nextReviewAt}</span>
                  <span className="text-[10px] block text-emerald-400 font-semibold mt-1">STATUS: {claim.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Subprocessors */}
      {activeTab === 'SUBPROCESSORS' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-semibold">Subprocessor</th>
                <th className="p-3 font-semibold">Purpose & Scope</th>
                <th className="p-3 font-semibold">Jurisdiction</th>
                <th className="p-3 font-semibold">Certifications</th>
                <th className="p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {SUBPROCESSORS.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-white">{s.name}</td>
                  <td className="p-3 text-slate-300">{s.purpose}</td>
                  <td className="p-3 font-mono text-cyan-400">{s.jurisdictions}</td>
                  <td className="p-3 text-slate-300">{s.cert}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE_SOVEREIGN
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Certifications */}
      {activeTab === 'CERTIFICATIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-white">SOC 2 Type II Certification</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">PASSED</span>
            </div>
            <p className="text-xs text-slate-400">
              Independent examination of Security, Availability, and Confidentiality controls.
            </p>
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-slate-500">Auditor: Ernst & Young</span>
              <span className="text-cyan-400 font-mono">Valid: 2026-2027</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-white">DPDP Act 2023 Legal Verification</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">PASSED</span>
            </div>
            <p className="text-xs text-slate-400">
              Formal verification of verifiable parental consent, child data protections, and zero cross-border PII exfiltration.
            </p>
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-slate-500">Auditor: Shardul Amarchand Mangaldas</span>
              <span className="text-cyan-400 font-mono">Valid: 2026-2027</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
