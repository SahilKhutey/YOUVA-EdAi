'use client';

import React from 'react';
import { MetacognitiveAgencyHub } from '@/components/cognitive/MetacognitiveAgencyHub';
import { MisconceptionInterventionExplorer } from '@/components/cognitive/MisconceptionInterventionExplorer';
import { LearningStateRadarConsole } from '@/components/cognitive/LearningStateRadarConsole';

export default function LearnCognitivePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Metacognitive Agency & Learning Exploration
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Agency &gt; Dependency
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-3xl">
            Empower your learning through active prediction, calibrated self-assessment, progressive scaffolding,
            and task-specific problem-solving strategies.
          </p>
        </div>

        <MetacognitiveAgencyHub />
        <MisconceptionInterventionExplorer />
        <LearningStateRadarConsole />
      </div>
    </div>
  );
}
