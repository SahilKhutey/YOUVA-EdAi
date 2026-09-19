import React from 'react';
import { ResearchPortfolioHub } from '@/components/evolution/ResearchPortfolioHub';

export const metadata = {
  title: 'Learning Science Research & Evidence Portal | YOUVA-EdAI',
  description: 'Public research publications, reproducible empirical studies, model competition leaderboards, and evidence gap registers.',
};

export default function ResearchPortalPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Learning Science Research & Evidence Portal
            </h1>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Open Evidence Network (N17.52)
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-3xl">
            In accordance with Clause N17.2 (Evidence &gt; Assumption), YOUVA-EdAI publishes evaluation protocols, model competition benchmarks, and empirical study methodologies to advance transparent learning science.
          </p>
        </header>

        <ResearchPortfolioHub />
      </div>
    </main>
  );
}
