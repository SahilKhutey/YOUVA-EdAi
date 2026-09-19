'use client';

import React, { useState } from 'react';
import LearningMobilityPortal from '@/components/mobility/LearningMobilityPortal';
import CapabilityTranslationConsole from '@/components/mobility/CapabilityTranslationConsole';
import CollectiveLearningGraphView from '@/components/mobility/CollectiveLearningGraphView';

export default function PublicMobilityPage() {
  const [activeTab, setActiveTab] = useState<'WALLET' | 'TRANSLATION' | 'PEER_COMMUNITY'>('WALLET');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              YOUVA Learning Mobility
            </span>
            <span className="text-xs text-slate-500 font-mono">Global Capability Network</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-1">
            Global Learning Mobility & Peer Capability Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Carry your validated capability evidence across institutions &bull; Explore peer study circles &bull; Contribute open knowledge
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('WALLET')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'WALLET'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            My Learning Wallet & Mobility
          </button>
          <button
            onClick={() => setActiveTab('TRANSLATION')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'TRANSLATION'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Capability Translation
          </button>
          <button
            onClick={() => setActiveTab('PEER_COMMUNITY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'PEER_COMMUNITY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Peer Learning & Contributions
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div>
        {activeTab === 'WALLET' && <LearningMobilityPortal />}
        {activeTab === 'TRANSLATION' && <CapabilityTranslationConsole />}
        {activeTab === 'PEER_COMMUNITY' && <CollectiveLearningGraphView />}
      </div>
    </div>
  );
}
