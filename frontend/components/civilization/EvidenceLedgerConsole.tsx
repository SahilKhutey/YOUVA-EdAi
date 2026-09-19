'use client';

import React, { useState } from 'react';

interface EvidenceClaim {
  claimId: string;
  claim: string;
  source: string;
  level: string;
  methodology: string;
  populationSize: number;
  confidence: number;
  limitations: string;
  owner: string;
  verified: boolean;
  revalidationDueDays: number;
}

interface NegativeEvidenceItem {
  recordId: string;
  incidentType: string;
  description: string;
  rootCause: string;
  mitigationPreventativeAction: string;
  recordedAt: string;
}

const SAMPLE_CLAIMS: EvidenceClaim[] = [
  {
    claimId: 'claim_retention_001',
    claim: 'Spaced retrieval practice increases 180-day concept retention by 34% over massed practice',
    source: 'YOUVA Longitudinal Cognitive Trial 2024-2026',
    level: 'LONGITUDINALLY_VALIDATED',
    methodology: 'Multi-site randomized controlled trial across 12,000 learners',
    populationSize: 12000,
    confidence: 0.98,
    limitations: 'Limited to STEM secondary curriculum domains',
    owner: 'YOUVA Learning Science Institute',
    verified: true,
    revalidationDueDays: 320,
  },
  {
    claimId: 'claim_multimodal_002',
    claim: 'Dual-coding visual+auditory synthesis reduces cognitive load during kinematics problem solving by 22%',
    source: 'Cognitive Architecture Lab Study',
    level: 'INDEPENDENTLY_VERIFIED',
    methodology: 'Triangulated eye-tracking & task latency measurement',
    populationSize: 850,
    confidence: 0.94,
    limitations: 'Laboratory conditions; requires real-world replication',
    owner: 'External Cognitive Consortium',
    verified: true,
    revalidationDueDays: 140,
  },
  {
    claimId: 'claim_peer_teach_003',
    claim: 'Peer explanation stage reinforces self-efficacy and decreases concept reversal by 41%',
    source: 'Collaborative Pilot Network',
    level: 'PILOT_VALIDATED',
    methodology: 'Pre/post conceptual inventory across 40 classrooms',
    populationSize: 1400,
    confidence: 0.89,
    limitations: 'Voluntary student participation bias',
    owner: 'Institutional Pedagogical Review',
    verified: true,
    revalidationDueDays: 45,
  },
];

const SAMPLE_NEGATIVE_LEDGER: NegativeEvidenceItem[] = [
  {
    recordId: 'neg_001',
    incidentType: 'FALSE_POSITIVE',
    description: 'Initial automated mastery heuristic misclassified guess streak as conceptual mastery in physics mechanics',
    rootCause: 'Lack of multi-format question triangulation in v1.0 mastery detector',
    mitigationPreventativeAction: 'Mandated 3-way triangulation (concept, transfer, explanation) before mastery confirmation',
    recordedAt: '2026-08-14 11:20:00',
  },
  {
    recordId: 'neg_002',
    incidentType: 'POOR_RECOMMENDATION',
    description: 'Recommendation model suggested advanced calculus module prematurely without prerequisite algebra verification',
    rootCause: 'Heuristic weight over-emphasized recent high speed on basic arithmetic',
    mitigationPreventativeAction: 'Prerequisite graph dependency checks made strictly non-bypassable by recommendation heuristics',
    recordedAt: '2026-09-02 09:15:00',
  },
  {
    recordId: 'neg_003',
    incidentType: 'EQUITY_PROBLEM',
    description: 'Voice recognition interface showed lower accuracy for regional dialect accents in English pronunciation tasks',
    rootCause: 'Insufficient regional acoustic training data diversity in early speech model checkpoint',
    mitigationPreventativeAction: 'Integrated diverse regional phoneme datasets and enabled multimodal visual fallback',
    recordedAt: '2026-09-10 15:45:00',
  },
];

export default function EvidenceLedgerConsole() {
  const [activeTab, setActiveTab] = useState<'CLAIMS' | 'NEGATIVE'>('CLAIMS');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  const filteredClaims =
    levelFilter === 'ALL'
      ? SAMPLE_CLAIMS
      : SAMPLE_CLAIMS.filter((c) => c.level === levelFilter);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              Clauses N∞.8, N∞.26–27 &amp; N∞.30
            </span>
            <span className="text-xs text-slate-400 font-mono">Immutable Evidence Ledger</span>
          </div>
          <h2 className="text-2xl font-bold mt-1 text-white tracking-tight">
            Evidence Hierarchy &amp; Transparent Negative Ledger
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Learning Truth ≠ Evidence Truth ≠ Credential Truth. Honest reporting of scientific evidence and failures.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('CLAIMS')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
              activeTab === 'CLAIMS'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Evidence Hierarchy Claims ({SAMPLE_CLAIMS.length})
          </button>
          <button
            onClick={() => setActiveTab('NEGATIVE')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
              activeTab === 'NEGATIVE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Negative Evidence &amp; Failures ({SAMPLE_NEGATIVE_LEDGER.length})
          </button>
        </div>
      </div>

      {activeTab === 'CLAIMS' ? (
        <div className="space-y-4">
          {/* Level Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-mono">Filter Level:</span>
            {['ALL', 'LONGITUDINALLY_VALIDATED', 'INDEPENDENTLY_VERIFIED', 'PILOT_VALIDATED', 'TESTED'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded border font-mono transition ${
                  levelFilter === lvl
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Claims Cards */}
          <div className="space-y-3">
            {filteredClaims.map((claim) => (
              <div
                key={claim.claimId}
                className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {claim.level}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">ID: {claim.claimId}</span>
                      <span className="text-xs text-slate-400 font-mono">N={claim.populationSize.toLocaleString()}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white leading-snug">{claim.claim}</h4>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {(claim.confidence * 100).toFixed(0)}% Confidence
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Revalidation: {claim.revalidationDueDays}d left
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-900">
                  <div>
                    <span className="font-semibold text-slate-300">Methodology:</span> {claim.methodology}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300">Limitations:</span> {claim.limitations}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300">Owner:</span> {claim.owner}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/50 text-xs text-rose-300">
            <strong>Mandatory Transparency:</strong> Under YOUVA Constitution Clause N∞.27, negative findings,
            model failures, and false positives must be recorded transparently and cannot be deleted or concealed.
          </div>

          <div className="space-y-3">
            {SAMPLE_NEGATIVE_LEDGER.map((item) => (
              <div
                key={item.recordId}
                className="bg-slate-950/60 p-4 rounded-lg border border-rose-900/30 hover:border-rose-800/60 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-semibold">
                      {item.incidentType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Record: {item.recordId}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{item.recordedAt}</span>
                </div>

                <div className="text-sm font-medium text-slate-200">{item.description}</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-900">
                  <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800">
                    <span className="font-semibold text-amber-400 block mb-1">Root Cause Analysis:</span>
                    <span className="text-slate-300">{item.rootCause}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800">
                    <span className="font-semibold text-emerald-400 block mb-1">Preventative Action Implemented:</span>
                    <span className="text-slate-300">{item.mitigationPreventativeAction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
