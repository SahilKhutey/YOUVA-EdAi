'use client';

import React, { useState } from 'react';
import CapabilityAlignmentExplorer from '@/components/exchange/CapabilityAlignmentExplorer';
import HumanCapabilityPassportView from '@/components/exchange/HumanCapabilityPassportView';
import OpportunityNetworkPortal from '@/components/exchange/OpportunityNetworkPortal';
import OpportunityTrustConsole from '@/components/exchange/OpportunityTrustConsole';

export default function AdminExchangePage() {
  const [activeTab, setActiveTab] = useState<'NETWORK' | 'ALIGNMENT' | 'PASSPORT' | 'TRUST'>('NETWORK');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
              YOUVA Milestone N22
            </span>
            <span className="text-xs text-slate-500 font-mono">YOUVA-N22-CHARTER-2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-1">
            Global Human Capability Exchange & Lifelong Opportunity Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evidence-Grounded Capability Matching &bull; Sovereign Capability Passport &bull; Zero Pay-to-Win &bull; Non-Consequential AI
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('NETWORK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'NETWORK'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Opportunity Network
          </button>
          <button
            onClick={() => setActiveTab('ALIGNMENT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'ALIGNMENT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Capability Alignment
          </button>
          <button
            onClick={() => setActiveTab('PASSPORT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'PASSPORT'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Capability Passport
          </button>
          <button
            onClick={() => setActiveTab('TRUST')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'TRUST'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Trust & Governance
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {activeTab === 'NETWORK' && <OpportunityNetworkPortal />}
        {activeTab === 'ALIGNMENT' && <CapabilityAlignmentExplorer />}
        {activeTab === 'PASSPORT' && <HumanCapabilityPassportView />}
        {activeTab === 'TRUST' && <OpportunityTrustConsole />}
      </div>
    </div>
  );
}
