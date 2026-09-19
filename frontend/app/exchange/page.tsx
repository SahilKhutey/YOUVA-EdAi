'use client';

import React, { useState } from 'react';
import OpportunityNetworkPortal from '@/components/exchange/OpportunityNetworkPortal';
import CapabilityAlignmentExplorer from '@/components/exchange/CapabilityAlignmentExplorer';
import HumanCapabilityPassportView from '@/components/exchange/HumanCapabilityPassportView';

export default function PublicExchangePage() {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ALIGNMENT' | 'MY_PASSPORT'>('DIRECTORY');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              YOUVA Capability Exchange
            </span>
            <span className="text-xs text-slate-500 font-mono">Lifelong Opportunity Network</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-1">
            Global Human Capability Exchange & Opportunity Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect demonstrated capabilities with real-world opportunities &bull; Sovereign evidence sharing &bull; Zero Pay-to-Win
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('DIRECTORY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'DIRECTORY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Explore Opportunities
          </button>
          <button
            onClick={() => setActiveTab('ALIGNMENT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'ALIGNMENT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Capability Matcher
          </button>
          <button
            onClick={() => setActiveTab('MY_PASSPORT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'MY_PASSPORT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            My Sovereign Passport
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {activeTab === 'DIRECTORY' && <OpportunityNetworkPortal />}
        {activeTab === 'ALIGNMENT' && <CapabilityAlignmentExplorer />}
        {activeTab === 'MY_PASSPORT' && <HumanCapabilityPassportView />}
      </div>
    </div>
  );
}
