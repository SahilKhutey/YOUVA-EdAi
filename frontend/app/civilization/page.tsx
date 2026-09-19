'use client';

import React, { useState } from 'react';
import MasterLoopVisualizer from '@/components/civilization/MasterLoopVisualizer';
import OperatingScorecardView from '@/components/civilization/OperatingScorecardView';
import EvidenceLedgerConsole from '@/components/civilization/EvidenceLedgerConsole';

export default function PublicCivilizationPage() {
  const [activeTab, setActiveTab] = useState<'MASTER_LOOP' | 'SCORECARD' | 'EVIDENCE'>('MASTER_LOOP');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              YOUVA Permanent Civilization
            </span>
            <span className="text-xs text-slate-500 font-mono">Governed Lifelong Learning</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-1">
            Continuous Human Learning &amp; Capability Infrastructure
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Continuous 18-Stage Learning Loop &bull; Transparent Operating Scorecard &bull; Multi-Level Evidence Hierarchy &bull; Human Agency First
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('MASTER_LOOP')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'MASTER_LOOP'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            18-Stage Master Loop
          </button>
          <button
            onClick={() => setActiveTab('SCORECARD')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'SCORECARD'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Operating Scorecard
          </button>
          <button
            onClick={() => setActiveTab('EVIDENCE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'EVIDENCE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Evidence &amp; Failure Registry
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {activeTab === 'MASTER_LOOP' && <MasterLoopVisualizer />}
        {activeTab === 'SCORECARD' && <OperatingScorecardView />}
        {activeTab === 'EVIDENCE' && <EvidenceLedgerConsole />}
      </div>
    </div>
  );
}
