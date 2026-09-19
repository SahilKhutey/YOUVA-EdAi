'use client';

import React, { useState } from 'react';

interface ConceptDifficultyCluster {
  conceptId: string;
  conceptName: string;
  subject: string;
  difficultyIndex: number;
  totalLearnersEvaluated: number;
  averageAttemptsToMaster: number;
  topMisconception: string;
  recurrenceRate: number;
  prerequisiteBottleneckScore: number;
}

export function EvolutionIntelligenceConsole() {
  const [selectedConcept, setSelectedConcept] = useState<string>('MATH-FRAC-001');

  const clusters: ConceptDifficultyCluster[] = [
    {
      conceptId: 'MATH-FRAC-001',
      conceptName: 'Equivalent Fractions & Simplification',
      subject: 'Mathematics',
      difficultyIndex: 0.68,
      totalLearnersEvaluated: 1420,
      averageAttemptsToMaster: 3.8,
      topMisconception: 'Direct addition of numerators and denominators (a/b + c/d)',
      recurrenceRate: 0.42,
      prerequisiteBottleneckScore: 0.85,
    },
    {
      conceptId: 'SCI-PHYS-002',
      conceptName: 'Newtonian Force & Inertia',
      subject: 'Physics',
      difficultyIndex: 0.74,
      totalLearnersEvaluated: 1150,
      averageAttemptsToMaster: 4.2,
      topMisconception: 'Believing sustained velocity requires continuous forward force',
      recurrenceRate: 0.58,
      prerequisiteBottleneckScore: 0.92,
    },
    {
      conceptId: 'CS-ALGO-003',
      conceptName: 'Recursive Base Cases & Call Stack',
      subject: 'Computer Science',
      difficultyIndex: 0.79,
      totalLearnersEvaluated: 890,
      averageAttemptsToMaster: 4.6,
      topMisconception: 'Omitting base condition check or mutating global parameter',
      recurrenceRate: 0.49,
      prerequisiteBottleneckScore: 0.88,
    },
  ];

  const currentCluster = clusters.find((c) => c.conceptId === selectedConcept) || clusters[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Learning Intelligence Console</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Clauses N17.5–N17.10
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Empirical concept difficulty clustering, misconception recurrence tracking, and longitudinal transfer vs retention intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-500/30">
            Privacy-Preserving Evidence Lake Active
          </span>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Evaluated Cohort Size</span>
          <span className="text-2xl font-black text-cyan-400 mt-1 block">3,460</span>
          <span className="text-[11px] text-slate-500">De-identified & aggregated</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Active Concept Clusters</span>
          <span className="text-2xl font-black text-indigo-400 mt-1 block">142</span>
          <span className="text-[11px] text-slate-500">Cross-disciplinary graph</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Identified Misconceptions</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">89</span>
          <span className="text-[11px] text-slate-500">Cataloged with Socratic remedies</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Far Transfer Rate</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">68.4%</span>
          <span className="text-[11px] text-slate-500">Novel schema validation</span>
        </div>
      </div>

      {/* Concept Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {clusters.map((c) => (
          <button
            key={c.conceptId}
            onClick={() => setSelectedConcept(c.conceptId)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedConcept === c.conceptId
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {c.conceptName} ({c.conceptId})
          </button>
        ))}
      </div>

      {/* Detail Cluster Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/40 border border-slate-800/80 p-5 rounded-xl">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Difficulty & Bottleneck Metrics</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Empirical Difficulty Index</span>
                <span className="font-mono text-cyan-400">{(currentCluster.difficultyIndex * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${currentCluster.difficultyIndex * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Prerequisite Bottleneck Score</span>
                <span className="font-mono text-rose-400">{(currentCluster.prerequisiteBottleneckScore * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{ width: `${currentCluster.prerequisiteBottleneckScore * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 flex justify-between border-t border-slate-800">
              <span>Avg. Attempts to Master:</span>
              <span className="font-semibold text-white">{currentCluster.averageAttemptsToMaster} tries</span>
            </div>
            <div className="text-xs text-slate-400 flex justify-between">
              <span>Evaluated Learners:</span>
              <span className="font-semibold text-white">{currentCluster.totalLearnersEvaluated} students</span>
            </div>
          </div>
        </div>

        {/* Misconception Tracking */}
        <div className="space-y-3 md:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200">Top Recurring Misconception</h3>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                Recurrence Rate: {(currentCluster.recurrenceRate * 100).toFixed(0)}%
              </span>
              <span className="text-[11px] text-slate-400">Targeted Socratic Intervention</span>
            </div>
            <p className="text-sm text-slate-200">{currentCluster.topMisconception}</p>
            <div className="text-xs text-emerald-400 bg-emerald-950/30 p-2.5 rounded border border-emerald-500/20">
              <span className="font-semibold block mb-0.5">Automated Scaffolding Remedy:</span>
              Adaptive visual fraction strips & tactile area bars introduced before numerical equations.
            </div>
          </div>

          {/* Explainable Personalization Example */}
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
            <span className="text-[11px] font-semibold text-cyan-400 block mb-1">
              Learner Agency / Explainable Rationale (Clause N17.37):
            </span>
            <p className="text-xs text-slate-300 italic">
              "You practiced {currentCluster.conceptName} recently and had difficulty with {currentCluster.topMisconception}. This activity introduces novel representations so you can master the underlying principle before testing."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
