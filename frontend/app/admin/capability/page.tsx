'use client';

import React, { useState } from 'react';
import HumanCapabilityGraphExplorer from '@/components/capability/HumanCapabilityGraphExplorer';
import OpportunityIntelligencePortal from '@/components/capability/OpportunityIntelligencePortal';
import OutcomeLongitudinalView from '@/components/capability/OutcomeLongitudinalView';

export default function AdminCapabilityPage() {
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'OPPORTUNITIES' | 'OUTCOMES' | 'SIGNALS'>('GRAPH');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
              YOUVA Milestone N20
            </span>
            <span className="text-xs text-slate-500 font-mono">YOUVA-N20-CHARTER-2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-1">
            Lifelong Learning OS & Human Capability Graph
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global Learning Intelligence | High-Assurance Capability Navigation | Non-Equivalence Governance
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
            Capability Graph
          </button>
          <button
            onClick={() => setActiveTab('OPPORTUNITIES')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'OPPORTUNITIES'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Opportunity Intelligence
          </button>
          <button
            onClick={() => setActiveTab('OUTCOMES')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'OUTCOMES'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Longitudinal Outcomes
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'GRAPH' && <HumanCapabilityGraphExplorer />}
        {activeTab === 'OPPORTUNITIES' && <OpportunityIntelligencePortal />}
        {activeTab === 'OUTCOMES' && <OutcomeLongitudinalView />}
      </div>
    </div>
  );
}
