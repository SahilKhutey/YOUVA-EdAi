'use client';

import React, { useState } from 'react';

interface MobilityContractResult {
  mobilityId: string;
  sourceOrg: string;
  destOrg: string;
  purpose: string;
  accepted: string[];
  pending: string[];
  rejected: string[];
  auditId: string;
  evaluatedAt: string;
}

interface WalletItem {
  id: string;
  type: 'CAPABILITY' | 'EVIDENCE' | 'CREDENTIAL' | 'PROJECT' | 'CONTRIBUTION';
  title: string;
  issuer: string;
  date: string;
}

export default function LearningMobilityPortal() {
  const [sourceOrg, setSourceOrg] = useState('Delhi_University');
  const [destOrg, setDestOrg] = useState('MIT_OpenLearning');
  const [purpose, setPurpose] = useState('Credit Transfer & Research Residency');
  const [consentId, setConsentId] = useState('cst_learner_sovereign_99');
  const [selectedCaps, setSelectedCaps] = useState<string[]>([
    'DU_CS_201_DATA_STRUCTURES',
    'DU_CS_301_DISTRIBUTED_SYS',
  ]);

  const [contractResult, setContractResult] = useState<MobilityContractResult | null>({
    mobilityId: 'mob_7a9f201bc',
    sourceOrg: 'Delhi_University',
    destOrg: 'MIT_OpenLearning',
    purpose: 'Credit Transfer & Research Residency',
    accepted: ['evidence_DU_CS_201_DATA_STRUCTURES_verified'],
    pending: ['evidence_DU_CS_301_DISTRIBUTED_SYS_requires_destination_review'],
    rejected: [],
    auditId: 'audit_mob_984ba10',
    evaluatedAt: '2026-09-19 12:45',
  });

  const [wallet] = useState<WalletItem[]>([
    {
      id: 'cap_ref_01',
      type: 'CAPABILITY',
      title: 'Data Structures & Algorithms (ADVANCED)',
      issuer: 'Delhi University',
      date: '2026-08-15',
    },
    {
      id: 'ev_ref_02',
      type: 'EVIDENCE',
      title: 'Peer-Reviewed BKT Benchmark Paper',
      issuer: 'YOUVA Research Lab',
      date: '2026-09-01',
    },
    {
      id: 'cred_ref_03',
      type: 'CREDENTIAL',
      title: 'W3C Verifiable Credential: AI Systems Engineer',
      issuer: 'Universal Accreditation Council',
      date: '2026-09-10',
    },
    {
      id: 'proj_ref_04',
      type: 'PROJECT',
      title: 'Mechanistic Interpretability Dashboard',
      issuer: 'YOUVA Open Source',
      date: '2026-09-15',
    },
    {
      id: 'contrib_ref_05',
      type: 'CONTRIBUTION',
      title: 'Visual Matrix Tutorial (OER)',
      issuer: 'Global Learning Commons',
      date: '2026-09-18',
    },
  ]);

  const handleSubmitMobility = () => {
    setContractResult({
      mobilityId: `mob_${Math.random().toString(36).substring(2, 10)}`,
      sourceOrg,
      destOrg,
      purpose,
      accepted: selectedCaps.map((c) => `evidence_${c}_verified`),
      pending: [],
      rejected: [],
      auditId: `audit_mob_${Math.random().toString(36).substring(2, 10)}`,
      evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });
  };

  return (
    <div className="space-y-6">
      {/* Wallet Sovereignty Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Invariant N23.11 & N23.65: Sovereign Learning Wallet & Governed Evidence Mobility
          </span>
          Evidence belongs to the learner. The wallet stores decentralized references, not a centralized surveillance dossier. Cross-institution mobility contracts require explicit purpose, scope, and revocable consent.
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
            W3C VC ALIGNED
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
            NO DATA LOCK-IN
          </span>
        </div>
      </div>

      {/* Grid: Learning Wallet & Mobility Contract Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Learning Wallet */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sovereign Learning Wallet ({wallet.length})
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">0x91F...A4</span>
          </div>

          <div className="space-y-2">
            {wallet.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-white">{item.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-950 text-blue-300 border border-blue-900">
                    {item.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{item.issuer}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.date}</div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors">
              Export Portable Credentials (JSON-LD)
            </button>
          </div>
        </div>

        {/* Mobility Contract Execution */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Execute Cross-Institution Capability Mobility Contract</h3>
            <p className="text-xs text-slate-400">
              Initiate a governed capability transfer between two accredited institutions. Receiving institutions review and accept evidence under sovereign institutional policy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Source Institution</label>
                <input
                  type="text"
                  value={sourceOrg}
                  onChange={(e) => setSourceOrg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Destination Institution</label>
                <input
                  type="text"
                  value={destOrg}
                  onChange={(e) => setDestOrg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Purpose Limitation</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Verified Consent ID</label>
                <input
                  type="text"
                  value={consentId}
                  onChange={(e) => setConsentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmitMobility}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Submit Mobility Request
              </button>
            </div>
          </div>

          {/* Contract Evaluation Result */}
          {contractResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Contract ID: {contractResult.mobilityId} &bull; Audit: {contractResult.auditId}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">
                    Mobility Evaluation: {contractResult.sourceOrg} &rarr; {contractResult.destOrg}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">{contractResult.evaluatedAt}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Accepted Evidence */}
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 space-y-1.5">
                  <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Accepted Evidence ({contractResult.accepted.length})
                  </span>
                  {contractResult.accepted.map((ev, i) => (
                    <div key={i} className="text-emerald-200/90 font-mono text-[11px] pl-3">
                      {ev}
                    </div>
                  ))}
                  {contractResult.accepted.length === 0 && (
                    <span className="text-slate-500 italic pl-3">None</span>
                  )}
                </div>

                {/* Pending Review */}
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 space-y-1.5">
                  <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Pending Destination Review ({contractResult.pending.length})
                  </span>
                  {contractResult.pending.map((ev, i) => (
                    <div key={i} className="text-amber-200/90 font-mono text-[11px] pl-3">
                      {ev}
                    </div>
                  ))}
                  {contractResult.pending.length === 0 && (
                    <span className="text-slate-500 italic pl-3">None</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
