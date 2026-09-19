'use client';

import React from 'react';
import { LearningStateRadarConsole } from '@/components/cognitive/LearningStateRadarConsole';
import { ThreeEvidenceConflictConsole } from '@/components/cognitive/ThreeEvidenceConflictConsole';
import { MisconceptionInterventionExplorer } from '@/components/cognitive/MisconceptionInterventionExplorer';

export default function AdminCognitivePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Cognitive Personalization & Learning Intelligence
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Milestone N18
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-3xl">
            Governed learning intelligence infrastructure implementing Bayesian mastery with explicit credibility intervals,
            epistemic boundaries, three-evidence triangulation, and the 5% simplicity benchmark gate.
          </p>
        </div>

        <LearningStateRadarConsole />
        <ThreeEvidenceConflictConsole />
        <MisconceptionInterventionExplorer />
      </div>
    </div>
  );
}
