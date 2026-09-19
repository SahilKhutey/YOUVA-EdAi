'use client';

import React, { useState } from 'react';
import HumanCapabilityGraphExplorer from '@/components/capability/HumanCapabilityGraphExplorer';
import LearnerGoalPathwayConsole from '@/components/capability/LearnerGoalPathwayConsole';
import OpportunityIntelligencePortal from '@/components/capability/OpportunityIntelligencePortal';
import OutcomeLongitudinalView from '@/components/capability/OutcomeLongitudinalView';

export default function LearnerCapabilityPortalPage() {
  const [activeTab, setActiveTab] = useState<'GOALS' | 'GRAPH' | 'OPPORTUNITIES' | 'OUTCOMES'>('GOALS');
  const learnerId = 'learner-alex-001';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              Lifelong Capability OS
            </span>
            <span className="text-xs text-slate-500 font-mono">Learner Console: {learnerId}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-1">
            My Human Capability & Lifelong Pathways
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous Skill Mastery | Adaptive Pathways | Verified Authentic Evidence
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('GOALS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'GOALS'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Goals & Pathways
          </button>
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
            Opportunities
          </button>
          <button
            onClick={() => setActiveTab('OUTCOMES')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'OUTCOMES'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Outcomes & History
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'GOALS' && <LearnerGoalPathwayConsole learnerId={learnerId} />}
        {activeTab === 'GRAPH' && <HumanCapabilityGraphExplorer />}
        {activeTab === 'OPPORTUNITIES' && <OpportunityIntelligencePortal learnerId={learnerId} />}
        {activeTab === 'OUTCOMES' && <OutcomeLongitudinalView learnerId={learnerId} />}
      </div>
    </div>
  );
}
