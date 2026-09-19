'use client';

import React, { useState } from 'react';
import EcosystemGraphExplorer from '@/components/ecosystem/EcosystemGraphExplorer';
import CurriculumCrosswalkConsole from '@/components/ecosystem/CurriculumCrosswalkConsole';
import FederatedAnalyticsPortal from '@/components/ecosystem/FederatedAnalyticsPortal';

export default function PublicEcosystemPage() {
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'SUPPLY_DEMAND' | 'CURRICULUM'>('GRAPH');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              YOUVA Public Ecosystem
            </span>
            <span className="text-xs text-slate-500 font-mono">Open Evidence & Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-1">
            Global Learning & Human Capability Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interoperable Skills &bull; Governed Ecosystem Graph &bull; Privacy-Preserving Aggregate Intelligence
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('GRAPH')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'GRAPH'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Ecosystem Graph
          </button>
          <button
            onClick={() => setActiveTab('SUPPLY_DEMAND')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'SUPPLY_DEMAND'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Capability Supply & Demand
          </button>
          <button
            onClick={() => setActiveTab('CURRICULUM')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'CURRICULUM'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Curriculum Crosswalks
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'GRAPH' && <EcosystemGraphExplorer />}
        {activeTab === 'SUPPLY_DEMAND' && <FederatedAnalyticsPortal />}
        {activeTab === 'CURRICULUM' && <CurriculumCrosswalkConsole />}
      </div>
    </div>
  );
}
