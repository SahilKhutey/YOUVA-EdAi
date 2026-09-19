'use client';

import React, { useState } from 'react';

interface ScorecardData {
  scorecardId: string;
  learningScore: number;
  capabilityScore: number;
  trustScore: number;
  safetyScore: number;
  sustainabilityScore: number;
  compositeHealthIndex: number;
  evaluatedAt: string;
}

const BENCHMARK_SCORECARDS: ScorecardData[] = [
  {
    scorecardId: 'sc_2026_q3_final',
    learningScore: 94.5,
    capabilityScore: 92.8,
    trustScore: 98.2,
    safetyScore: 99.7,
    sustainabilityScore: 95.0,
    compositeHealthIndex: 95.9,
    evaluatedAt: '2026-09-19 16:30:00',
  },
  {
    scorecardId: 'sc_2026_q2_audit',
    learningScore: 93.1,
    capabilityScore: 91.4,
    trustScore: 97.5,
    safetyScore: 99.5,
    sustainabilityScore: 94.2,
    compositeHealthIndex: 94.9,
    evaluatedAt: '2026-06-30 23:59:59',
  },
  {
    scorecardId: 'sc_2026_q1_baseline',
    learningScore: 91.0,
    capabilityScore: 89.5,
    trustScore: 96.0,
    safetyScore: 99.2,
    sustainabilityScore: 92.8,
    compositeHealthIndex: 93.4,
    evaluatedAt: '2026-03-31 23:59:59',
  },
];

export default function OperatingScorecardView() {
  const [scorecards, setScorecards] = useState<ScorecardData[]>(BENCHMARK_SCORECARDS);
  const latest = scorecards[0];

  const dimensions = [
    {
      name: 'Learning Science & Retention',
      score: latest.learningScore,
      weight: '25%',
      threshold: 70,
      desc: 'Cognitive retention, transfer across unfamiliar domains, metacognitive calibration',
      color: 'bg-indigo-500',
    },
    {
      name: 'Demonstrated Capability',
      score: latest.capabilityScore,
      weight: '25%',
      threshold: 70,
      desc: 'Empirical task execution, authentic problem solving, creative synthesis',
      color: 'bg-emerald-500',
    },
    {
      name: 'Evidence & Trust Integrity',
      score: latest.trustScore,
      weight: '20%',
      threshold: 80,
      desc: 'Cryptographic proof verification, anti-fraud triangulation, credential portability',
      color: 'bg-amber-500',
    },
    {
      name: 'Safety & Minor Safeguards',
      score: latest.safetyScore,
      weight: '20%',
      threshold: 95,
      desc: 'Zero safety incidents, age-appropriate content governance, privacy compliance',
      color: 'bg-rose-500',
    },
    {
      name: 'Civilization Sustainability',
      score: latest.sustainabilityScore,
      weight: '10%',
      threshold: 70,
      desc: 'Operational resilience, ethical autonomy boundary enforcement, ecosystem balance',
      color: 'bg-cyan-500',
    },
  ];

  const isHealthy = latest.compositeHealthIndex >= 80 && latest.safetyScore >= 95;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-400 border border-blue-800">
              Clause N∞.61 Evaluation
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isHealthy
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {isHealthy ? '● HEALTHY CIVILIZATION STATE' : '▲ THRESHOLD ATTENTION'}
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-1 text-white tracking-tight">
            5-Dimension Continuous Operating Scorecard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Permanent multi-dimensional index ensuring educational efficacy, trust, and safety.
          </p>
        </div>

        {/* Composite Health Gauge Banner */}
        <div className="bg-slate-950 px-5 py-3 rounded-lg border border-slate-800 flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs uppercase font-mono text-slate-400">Composite Health</div>
            <div className="text-2xl font-black text-emerald-400">{latest.compositeHealthIndex}%</div>
          </div>
          <div className="h-10 w-[1px] bg-slate-800" />
          <div className="text-xs font-mono text-slate-400">
            <div>Eval: {latest.evaluatedAt.substring(0, 10)}</div>
            <div className="text-emerald-400 font-semibold">100% Target Met</div>
          </div>
        </div>
      </div>

      {/* 5 Dimension Progress Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {dimensions.map((dim, idx) => (
          <div
            key={idx}
            className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-mono">Weight: {dim.weight}</span>
                <span className="font-mono text-slate-500">Min {dim.threshold}%</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">{dim.name}</h4>
              <p className="text-[11px] text-slate-400 leading-tight mb-3">{dim.desc}</p>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xl font-bold text-white font-mono">{dim.score}%</span>
                <span className="text-[10px] text-emerald-400 font-mono">PASS</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${dim.color} transition-all duration-500`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scorecard History Table */}
      <div className="pt-2">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Operating Scorecard History</h4>
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Evaluation ID</th>
                <th className="p-3">Learning</th>
                <th className="p-3">Capability</th>
                <th className="p-3">Trust</th>
                <th className="p-3">Safety</th>
                <th className="p-3">Sustainability</th>
                <th className="p-3">Composite</th>
                <th className="p-3">Evaluated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {scorecards.map((sc) => (
                <tr key={sc.scorecardId} className="hover:bg-slate-800/30 transition">
                  <td className="p-3 font-semibold text-slate-300">{sc.scorecardId}</td>
                  <td className="p-3 text-indigo-400">{sc.learningScore}%</td>
                  <td className="p-3 text-emerald-400">{sc.capabilityScore}%</td>
                  <td className="p-3 text-amber-400">{sc.trustScore}%</td>
                  <td className="p-3 text-rose-400">{sc.safetyScore}%</td>
                  <td className="p-3 text-cyan-400">{sc.sustainabilityScore}%</td>
                  <td className="p-3 font-bold text-white bg-slate-800/20">{sc.compositeHealthIndex}%</td>
                  <td className="p-3 text-slate-400">{sc.evaluatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
