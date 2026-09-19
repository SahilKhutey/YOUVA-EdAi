'use client';

import React, { useState } from 'react';
import CapabilityTranslationConsole from '@/components/mobility/CapabilityTranslationConsole';
import LearningMobilityPortal from '@/components/mobility/LearningMobilityPortal';
import CollectiveLearningGraphView from '@/components/mobility/CollectiveLearningGraphView';
import KnowledgeCurriculumConsole from '@/components/mobility/KnowledgeCurriculumConsole';

export default function AdminMobilityPage() {
  const [activeTab, setActiveTab] = useState<'TRANSLATION' | 'MOBILITY' | 'COLLECTIVE' | 'KNOWLEDGE'>('TRANSLATION');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
              YOUVA Milestone N23
            </span>
            <span className="text-xs text-slate-500 font-mono">YOUVA-N23-CHARTER-2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-1">
            Global Human Capability Intelligence & Learning Mobility
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capability Translation &bull; Evidence Mobility Contracts &bull; Collective Learning Graph &bull; Living Curriculum &bull; Zero Potential Prediction
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('TRANSLATION')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'TRANSLATION'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Capability Translation
          </button>
          <button
            onClick={() => setActiveTab('MOBILITY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'MOBILITY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Mobility Contracts
          </button>
          <button
            onClick={() => setActiveTab('COLLECTIVE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'COLLECTIVE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Collective Learning
          </button>
          <button
            onClick={() => setActiveTab('KNOWLEDGE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'KNOWLEDGE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Knowledge & Curriculum
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div>
        {activeTab === 'TRANSLATION' && <CapabilityTranslationConsole />}
        {activeTab === 'MOBILITY' && <LearningMobilityPortal />}
        {activeTab === 'COLLECTIVE' && <CollectiveLearningGraphView />}
        {activeTab === 'KNOWLEDGE' && <KnowledgeCurriculumConsole />}
      </div>
    </div>
  );
}
