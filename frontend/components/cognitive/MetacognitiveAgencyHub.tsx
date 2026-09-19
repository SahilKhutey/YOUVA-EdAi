'use client';

import React, { useState } from 'react';

export function MetacognitiveAgencyHub() {
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(2); // COMPARE

  const stages = [
    { name: 'PREDICT', label: '1. Predict', desc: 'Forecast performance and confidence before attempting task.' },
    { name: 'PERFORM', label: '2. Perform', desc: 'Execute the learning task independently.' },
    { name: 'COMPARE', label: '3. Compare', desc: 'Compare actual outcome with predicted performance.' },
    { name: 'EXPLAIN', label: '4. Explain', desc: 'Articulate why the outcome matched or differed from prediction.' },
    { name: 'CHOOSE_STRATEGY', label: '5. Strategy', desc: 'Select or adjust problem-solving heuristic for next attempt.' },
    { name: 'RETRY', label: '6. Retry', desc: 'Apply updated strategy on an isomorphic transfer problem.' },
  ];

  const calibrationData = {
    predictedScore: 85,
    actualScore: 60,
    divergence: 25, // Overconfident (> +20)
    calibrationClassification: 'OVERCONFIDENT',
    advice: 'Your forecast was 25% higher than your verified performance. Reviewing intermediate steps helps bridge optimistic estimation gaps.',
  };

  const aiRemovalTest = {
    testId: 'AIRT-2026-004',
    conceptId: 'MATH-CALC-001',
    assistedScore: 92,
    unassistedScore: 54,
    dropPercentage: 41.3, // > 35% -> Dependency flag!
    dependencyFlag: true,
    scaffoldingAction: 'ENGAGE_PROGRESSIVE_SCAFFOLDING_REMOVAL',
  };

  const strategies = [
    { name: 'Diagrammatic Decomposition', domain: 'Physics / Mechanics', gain: '+28%', fixedStyleMyth: false },
    { name: 'Self-Explanation Prompting', domain: 'Mathematics / Proofs', gain: '+22%', fixedStyleMyth: false },
    { name: 'Interleaved Practice Retrieval', domain: 'Chemistry / Reactions', gain: '+31%', fixedStyleMyth: false },
    { name: 'Auditory-Only Instruction', domain: 'Universal', gain: '+1%', fixedStyleMyth: true, warning: 'Fixed-style myth: Empirical gain indistinguishable from baseline.' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Metacognitive Agency & Anti-Dependency Hub</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Clauses N18.33–N18.48
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            6-stage metacognitive loop, confidence calibration, AI removal transfer tests, and task-specific strategy profiling.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-500/30">
            Agency &gt; Dependency
          </span>
        </div>
      </div>

      {/* 6-Stage Metacognitive Loop Progression */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-300">Active Metacognitive Cycle (Clauses N18.33–N18.36)</span>
          <span className="text-[11px] font-mono text-cyan-400">Step {currentStageIndex + 1} of 6</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {stages.map((st, idx) => (
            <button
              key={st.name}
              onClick={() => setCurrentStageIndex(idx)}
              className={`p-3 rounded-lg border text-left transition-all ${
                currentStageIndex === idx
                  ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                  : idx < currentStageIndex
                  ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600'
              }`}
            >
              <div className="text-xs font-bold truncate">{st.label}</div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{st.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Calibration & AI Removal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confidence Calibration Card */}
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Confidence Calibration Engine (Clause N18.38)</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
              {calibrationData.calibrationClassification}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Predicted Score</span>
              <span className="text-xl font-bold text-cyan-400">{calibrationData.predictedScore}%</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Verified Score</span>
              <span className="text-xl font-bold text-emerald-400">{calibrationData.actualScore}%</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {calibrationData.advice}
          </p>
        </div>

        {/* AI Removal Test (Anti-Dependency) */}
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">AI Removal Test (Clauses N18.44–N18.45)</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
              DEPENDENCY FLAGGED
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Assisted Score (with AI Mentor):</span>
              <span className="font-mono text-cyan-400">{aiRemovalTest.assistedScore}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Unassisted Score (AI Removed):</span>
              <span className="font-mono text-amber-400">{aiRemovalTest.unassistedScore}%</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-rose-400">Performance Drop:</span>
              <span className="font-mono text-rose-400">-{aiRemovalTest.dropPercentage}% (Threshold: 35%)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 text-[11px] text-rose-300">
            ALERT: Unassisted score dropped by {aiRemovalTest.dropPercentage}%. Progressive scaffolding removal engaged to ensure genuine internalization.
          </div>
        </div>
      </div>

      {/* Task-Specific Strategy Repertoire (Anti-Learning-Style Myths) */}
      <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-300">Task-Specific Strategy Effectiveness (Clause N18.41)</span>
          <span className="text-[11px] font-mono text-slate-400">Rejects Fixed "Learning Style" Categorization</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strategies.map((st) => (
            <div
              key={st.name}
              className={`p-3 rounded-lg border text-xs ${
                st.fixedStyleMyth
                  ? 'bg-rose-950/10 border-rose-900/40 text-slate-400'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{st.name}</span>
                <span className={`font-mono font-bold ${st.fixedStyleMyth ? 'text-slate-500' : 'text-emerald-400'}`}>
                  {st.gain}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Domain: {st.domain}</div>
              {st.warning && (
                <div className="mt-1 text-[10px] text-rose-400 font-mono">{st.warning}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
