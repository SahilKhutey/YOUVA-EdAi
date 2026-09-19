'use client';

import React, { useState } from 'react';
import { JurisdictionRegistryConsole } from '@/components/institutional/JurisdictionRegistryConsole';
import { InstitutionalTrustCenter } from '@/components/institutional/InstitutionalTrustCenter';
import { ExecutiveGovernanceDashboard } from '@/components/institutional/ExecutiveGovernanceDashboard';
import { GovernanceDebtRiskConsole } from '@/components/institutional/GovernanceDebtRiskConsole';

export default function AdminGovernancePage() {
  const [activeTab, setActiveTab] = useState<'JURISDICTIONS' | 'EXECUTIVE' | 'TRUST' | 'DEBT_RISK'>('JURISDICTIONS');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Institutional & Global Governance Terminal
            </h1>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Milestone N16 Established
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-4xl">
            Administers global jurisdiction profiles, sovereign AI routing, 10-step market activation gates, decision-grade executive analytics, and governance debt controls.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('JURISDICTIONS')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'JURISDICTIONS'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Jurisdiction Registry & Activation
          </button>
          <button
            onClick={() => setActiveTab('EXECUTIVE')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'EXECUTIVE'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Executive Leadership Dashboard
          </button>
          <button
            onClick={() => setActiveTab('TRUST')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'TRUST'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Trust Center & Product Claims
          </button>
          <button
            onClick={() => setActiveTab('DEBT_RISK')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'DEBT_RISK'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Governance Debt & Risk Matrix
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'JURISDICTIONS' && <JurisdictionRegistryConsole />}
        {activeTab === 'EXECUTIVE' && <ExecutiveGovernanceDashboard />}
        {activeTab === 'TRUST' && <InstitutionalTrustCenter />}
        {activeTab === 'DEBT_RISK' && <GovernanceDebtRiskConsole />}
      </div>
    </div>
  );
}
