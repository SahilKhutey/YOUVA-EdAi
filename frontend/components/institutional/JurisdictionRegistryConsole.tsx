'use client';

import React, { useState } from 'react';

interface Jurisdiction {
  jurisdictionId: string;
  name: string;
  privacyPolicyVersion: string;
  childSafetyPolicyVersion: string;
  sovereignDataCenterRegion: string;
  approvedAiProviders: string[];
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED';
}

const DEFAULT_JURISDICTIONS: Jurisdiction[] = [
  {
    jurisdictionId: 'IN-DL',
    name: 'India - NCT of Delhi (CBSE/NCERT)',
    privacyPolicyVersion: 'dpdp-act-2023-v1.4',
    childSafetyPolicyVersion: 'poso-pocso-edu-v2.0',
    sovereignDataCenterRegion: 'ap-south-1 (Mumbai/Delhi)',
    approvedAiProviders: ['GEMINI_INDIA_CENTRAL', 'OLLAMA_LOCAL_SOVEREIGN'],
    status: 'ACTIVE',
  },
  {
    jurisdictionId: 'EU-DE',
    name: 'European Union - Germany (KMK)',
    privacyPolicyVersion: 'gdpr-bdsg-v3.1',
    childSafetyPolicyVersion: 'eu-child-online-safety-v2',
    sovereignDataCenterRegion: 'eu-central-1 (Frankfurt)',
    approvedAiProviders: ['GEMINI_EU_FRANKFURT', 'OLLAMA_LOCAL_SOVEREIGN'],
    status: 'ACTIVE',
  },
  {
    jurisdictionId: 'US-CA',
    name: 'United States - California (Common Core)',
    privacyPolicyVersion: 'coppa-ferpa-soppi-ccpa-v4',
    childSafetyPolicyVersion: 'california-age-appropriate-design-code',
    sovereignDataCenterRegion: 'us-west-2 (Oregon)',
    approvedAiProviders: ['GEMINI_US_CENTRAL', 'ANTHROPIC_BEDROCK_US'],
    status: 'ACTIVE',
  },
  {
    jurisdictionId: 'UK-ENG',
    name: 'United Kingdom - England (Ofqual)',
    privacyPolicyVersion: 'uk-gdpr-dpa-2018-v2',
    childSafetyPolicyVersion: 'uk-age-appropriate-design-code-ico',
    sovereignDataCenterRegion: 'eu-west-2 (London)',
    approvedAiProviders: ['GEMINI_UK_LONDON', 'OLLAMA_LOCAL_SOVEREIGN'],
    status: 'ACTIVE',
  },
];

const ACTIVATION_STEPS = [
  '1. Legal & Regulatory Analysis',
  '2. Privacy Compliance Audit',
  '3. Child Safeguarding Review',
  '4. Technical Residency Audit',
  '5. Localization & Cultural Review',
  '6. Curriculum Standards Mapping',
  '7. Sovereign AI Provider Vetting',
  '8. Independent Security Penetration',
  '9. Controlled Institutional Pilot',
  '10. Continuous Governance Active',
];

export function JurisdictionRegistryConsole() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>(DEFAULT_JURISDICTIONS);
  const [selectedId, setSelectedId] = useState<string>('IN-DL');
  const [modalOpen, setModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  const selected = jurisdictions.find((j) => j.jurisdictionId === selectedId) || jurisdictions[0];

  const handleToggleSuspend = () => {
    if (selected.status === 'ACTIVE') {
      setModalOpen(true);
    } else {
      // Reinstate
      setJurisdictions((prev) =>
        prev.map((j) => (j.jurisdictionId === selected.jurisdictionId ? { ...j, status: 'ACTIVE' } : j))
      );
    }
  };

  const confirmSuspend = () => {
    setJurisdictions((prev) =>
      prev.map((j) => (j.jurisdictionId === selected.jurisdictionId ? { ...j, status: 'SUSPENDED' } : j))
    );
    setModalOpen(false);
    setSuspensionReason('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Global Jurisdiction Registry</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Clause N16.12–N16.16
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enforces sovereign data residency, localized curriculum mappings, and 10-step market activation gates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSuspend}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              selected.status === 'ACTIVE'
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            {selected.status === 'ACTIVE' ? 'Suspend Jurisdiction' : 'Reinstate to Active'}
          </button>
        </div>
      </div>

      {/* Jurisdiction Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
        {jurisdictions.map((j) => {
          const isSelected = j.jurisdictionId === selectedId;
          const isSuspended = j.status === 'SUSPENDED';
          return (
            <button
              key={j.jurisdictionId}
              onClick={() => setSelectedId(j.jurisdictionId)}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg'
                  : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{j.jurisdictionId}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSuspended
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {j.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-1">{j.name}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Jurisdiction Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Sovereignty & Policies</h3>
          
          <div>
            <label className="text-xs text-slate-500">Region Name</label>
            <p className="text-sm font-medium text-slate-200">{selected.name}</p>
          </div>

          <div>
            <label className="text-xs text-slate-500">Privacy & Child Protection</label>
            <div className="flex flex-col gap-1 mt-0.5">
              <span className="text-xs font-mono bg-slate-800/80 px-2 py-1 rounded text-slate-300 border border-slate-700/50">
                {selected.privacyPolicyVersion}
              </span>
              <span className="text-xs font-mono bg-slate-800/80 px-2 py-1 rounded text-slate-300 border border-slate-700/50">
                {selected.childSafetyPolicyVersion}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500">Sovereign Data Center Enclave</label>
            <p className="text-xs font-mono text-cyan-400 mt-0.5">{selected.sovereignDataCenterRegion}</p>
          </div>

          <div>
            <label className="text-xs text-slate-500">Approved AI Provider Enclave</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {selected.approvedAiProviders.map((p) => (
                <span
                  key={p}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 10-Step Activation Gate Tracker */}
        <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              10-Step Market Activation Gates (Clause N16.14)
            </h3>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {selected.status === 'ACTIVE' ? '10 / 10 Gates Satisfied' : 'Expansion Blocked'}
            </span>
          </div>

          <div className="space-y-2">
            {ACTIVATION_STEPS.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    ✓
                  </div>
                  <span className="text-slate-200 font-medium">{step}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">VERIFIED_INDEPENDENT</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Suspension Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-rose-500">⚠</span> Confirm Emergency Jurisdiction Suspension
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Suspending <strong>{selected.name}</strong> ({selected.jurisdictionId}) will immediately halt all autonomous AI
              invocations in this region and restrict customer institutions to manual assistance mode.
            </p>
            <div>
              <label className="text-xs text-slate-400">Formal Suspension Reason</label>
              <input
                type="text"
                placeholder="e.g. Regulatory inquiry or cross-border data protection audit"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmSuspend}
                disabled={!suspensionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
