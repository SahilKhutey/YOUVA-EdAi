'use client';

import React, { useState } from 'react';

export function AiTutorBenchmarkView() {
  const [selectedLearner, setSelectedLearner] = useState<string>('STUDENT-001');

  const benchmarkMetrics = [
    { name: 'Pedagogical Socratic Scaffolding', score: 88, threshold: 80, pass: true },
    { name: 'Age-Appropriateness (3-7, 7-12, 13-18)', score: 92, threshold: 85, pass: true },
    { name: 'Explanation Clarity & Precision', score: 90, threshold: 80, pass: true },
    { name: 'Hallucination Defense (0.3% rate)', score: 97, threshold: 95, pass: true },
    { name: 'Child Safeguarding Compliance', score: 98, threshold: 95, pass: true },
    { name: 'Instruction & Policy Adherence', score: 94, threshold: 90, pass: true },
  ];

  const antiDependencyMetrics = {
    learnerId: selectedLearner,
    answerSeekingIndex: 0.28,
    independentReasoningRatio: 0.72,
    scaffoldingMode: 'PROGRESSIVE_HINT',
    dependencyRisk: 'LOW',
    consecutiveDirectRequests: 1,
    transferScoreWithoutAi: 82,
  };

  const calibrationSamples = [
    { concept: 'Fractions', confidence: 90, actualScore: 65, bias: 'OVERCONFIDENT', delta: '+25' },
    { concept: 'Inertia', confidence: 50, actualScore: 78, bias: 'UNDERCONFIDENT', delta: '-28' },
    { concept: 'Recursion', confidence: 75, actualScore: 72, bias: 'ACCURATE', delta: '+3' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">AI Tutor Benchmark & Anti-Dependency View</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Clauses N17.26–N17.34
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Permanent pedagogical benchmark, anti-dependency scaffolding state machine, and metacognitive calibration engine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded border border-cyan-500/30">
            Model: GEMMA-9B-TUTOR (Certified)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Pedagogical Benchmark Card */}
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">Pedagogical Evaluation Radar</h3>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
              Composite: 89.8 / 100 (PASS)
            </span>
          </div>

          <div className="space-y-3">
            {benchmarkMetrics.map((bm) => (
              <div key={bm.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{bm.name}</span>
                  <span className="font-mono text-emerald-400 font-semibold">{bm.score}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${bm.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
            <span>Hallucination Rate: <strong className="text-emerald-400 font-mono">0.3%</strong> (&lt; 1% ceiling)</span>
            <span>Safety Audit: <strong className="text-emerald-400">100% Passed</strong></span>
          </div>
        </div>

        {/* Right Column: Anti-Dependency & Overreliance Engine */}
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">Anti-Dependency Scaffolding Monitor</h3>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
              Risk: {antiDependencyMetrics.dependencyRisk}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">Answer-Seeking Index</span>
              <span className="text-xl font-bold text-amber-400 font-mono">
                {(antiDependencyMetrics.answerSeekingIndex * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500 block">Threshold &lt; 55%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Independent Reasoning</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {(antiDependencyMetrics.independentReasoningRatio * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500 block">Self-attempted first</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Active Scaffolding Mode:</span>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
              <span className="text-xs font-mono font-bold text-indigo-300">{antiDependencyMetrics.scaffoldingMode}</span>
              <span className="text-[11px] text-slate-400">— Socratic progressive clues; direct answer blocked.</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
            <span>Transfer Without AI Score:</span>
            <span className="font-mono font-bold text-emerald-400">{antiDependencyMetrics.transferScoreWithoutAi}%</span>
          </div>
        </div>
      </div>

      {/* Metacognitive Calibration Engine Section */}
      <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Metacognitive Calibration Engine (Clause N17.31)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Invariant: <span className="font-mono text-amber-400">Mastery ≠ Confidence</span>. Identifying overconfidence (careless errors) and underconfidence (hesitation).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Sample Concept Verifications</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {calibrationSamples.map((s) => (
            <div key={s.concept} className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">{s.concept}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    s.bias === 'ACCURATE'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                      : s.bias === 'OVERCONFIDENT'
                      ? 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                      : 'bg-indigo-950/60 text-indigo-400 border-indigo-500/30'
                  }`}
                >
                  {s.bias} ({s.delta})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Self Confidence:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{s.confidence}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Objective Score:</span>
                  <span className="font-mono text-white font-semibold">{s.actualScore}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
