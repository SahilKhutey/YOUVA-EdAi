'use client';

import React, { useState } from 'react';
import EcosystemGraphExplorer from '@/components/ecosystem/EcosystemGraphExplorer';
import PartnerGatewayConsole from '@/components/ecosystem/PartnerGatewayConsole';
import CurriculumCrosswalkConsole from '@/components/ecosystem/CurriculumCrosswalkConsole';
import FederatedAnalyticsPortal from '@/components/ecosystem/FederatedAnalyticsPortal';

export default function AdminEcosystemPage() {
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'PARTNERS' | 'CURRICULUM' | 'ANALYTICS'>('GRAPH');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
              YOUVA Milestone N21
            </span>
            <span className="text-xs text-slate-500 font-mono">YOUVA-N21-CHARTER-2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50 mt-1">
            Global Learning & Human Capability Ecosystem Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Governed Partner Gateway &bull; 7-Layer Truth Model &bull; Federated Analytics &bull; Zero Learner Surveillance
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('GRAPH')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'GRAPH'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Ecosystem Graph
          </button>
          <button
            onClick={() => setActiveTab('PARTNERS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'PARTNERS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Partner Gateway
          </button>
          <button
            onClick={() => setActiveTab('CURRICULUM')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'CURRICULUM'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Curriculum Intelligence
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Federated Analytics & Health
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'GRAPH' && <EcosystemGraphExplorer />}
        {activeTab === 'PARTNERS' && <PartnerGatewayConsole />}
        {activeTab === 'CURRICULUM' && <CurriculumCrosswalkConsole />}
        {activeTab === 'ANALYTICS' && <FederatedAnalyticsPortal />}
      </div>
    </div>
  );
}
