'use client';

import React, { useState } from 'react';
import { EvolutionIntelligenceConsole } from '@/components/evolution/EvolutionIntelligenceConsole';
import { ResearchPortfolioHub } from '@/components/evolution/ResearchPortfolioHub';
import { AiTutorBenchmarkView } from '@/components/evolution/AiTutorBenchmarkView';
import { ComplexityBudgetRetirementConsole } from '@/components/evolution/ComplexityBudgetRetirementConsole';

export default function AdminEvolutionPage() {
  const [activeTab, setActiveTab] = useState<'LEARNING_INTEL' | 'RESEARCH_MODELS' | 'TUTOR_BENCHMARK' | 'COMPLEXITY_GOV'>(
    'LEARNING_INTEL',
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Evolution Intelligence & Research Terminal
            </h1>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Milestone N17 Active
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-4xl">
            Operating dashboard for the permanent YOUVA Evolution System. Monitors learning intelligence clusters, 12-track research portfolio, model competition, tutor benchmarks, and complexity budgets.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('LEARNING_INTEL')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'LEARNING_INTEL'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Learning Intelligence & Misconceptions
          </button>
          <button
            onClick={() => setActiveTab('RESEARCH_MODELS')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'RESEARCH_MODELS'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Research Portfolio & Model Competition
          </button>
          <button
            onClick={() => setActiveTab('TUTOR_BENCHMARK')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'TUTOR_BENCHMARK'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            AI Tutor Benchmark & Anti-Dependency
          </button>
          <button
            onClick={() => setActiveTab('COMPLEXITY_GOV')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'COMPLEXITY_GOV'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Complexity Budget & Red Teaming
          </button>
        </div>

        {/* Active Console View */}
        <main className="transition-opacity duration-300">
          {activeTab === 'LEARNING_INTEL' && <EvolutionIntelligenceConsole />}
          {activeTab === 'RESEARCH_MODELS' && <ResearchPortfolioHub />}
          {activeTab === 'TUTOR_BENCHMARK' && <AiTutorBenchmarkView />}
          {activeTab === 'COMPLEXITY_GOV' && <ComplexityBudgetRetirementConsole />}
        </main>
      </div>
    </div>
  );
}
