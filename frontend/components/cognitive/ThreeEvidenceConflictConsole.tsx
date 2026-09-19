'use client';

import React, { useState } from 'react';

export function ThreeEvidenceConflictConsole() {
  const [selectedCase, setSelectedCase] = useState<string>('CONF-2026-001');

  const conflicts = [
    {
      id: 'CONF-2026-001',
      studentId: 'STU-9821',
      studentName: 'Aarav Sharma',
      conceptId: 'MATH-QUAD-002',
      conceptName: 'Quadratic Discriminant & Nature of Roots',
      systemScore: 88,
      teacherScore: 55,
      learnerSelfScore: 75,
      divergence: 33, // > 25 threshold!
      status: 'RESOLVING',
      actionTaken: 'DIAGNOSTIC_MICRO_TASK_SCHEDULED',
      notes: 'System logged high multiple-choice accuracy; Teacher noted inability to explain derivation during oral assessment.',
    },
    {
      id: 'CONF-2026-002',
      studentId: 'STU-5114',
      studentName: 'Zara Khan',
      conceptId: 'SCI-BIO-003',
      conceptName: 'Cellular Respiration & Krebs Cycle',
      systemScore: 72,
      teacherScore: 78,
      learnerSelfScore: 70,
      divergence: 8, // <= 25, no conflict
      status: 'CONVERGED',
      actionTaken: 'TRIANGULATED_CONSENSUS_AFFIRMED',
      notes: 'All three evidence sources tightly aligned within 8 points.',
    },
  ];

  const simplicityBenchmarks = [
    {
      modelName: 'Deep Knowledge Tracing (DKT-v3)',
      baselineName: 'Bayesian Knowledge Tracing (BKT-Standard)',
      metric: 'AUC / Mastery Prediction',
      complexScore: 0.862,
      baselineScore: 0.810,
      delta: 0.052, // >= 0.05 -> Authorized!
      authorized: true,
      decision: 'AUTHORIZED (Delta >= 0.05 met)',
    },
    {
      modelName: 'Multi-Head Attention Pacing Network',
      baselineName: 'Linear Difficulty Progression',
      metric: 'Time-to-Mastery Calibration',
      complexScore: 0.741,
      baselineScore: 0.725,
      delta: 0.016, // < 0.05 -> Rejected!
      authorized: false,
      decision: 'REJECTED (Delta 0.016 < 0.05 threshold; Simple baseline retained)',
    },
  ];

  const safetyGuarantees = [
    { rule: 'No Personality Profiling', status: 'ENFORCED', desc: 'No Big Five or MBTI inference from interaction telemetry.' },
    { rule: 'No Emotional / Affect Diagnosis', status: 'ENFORCED', desc: 'No claims of detecting anxiety, depression, or emotional states.' },
    { rule: 'No General Intelligence / IQ Stigmatization', status: 'ENFORCED', desc: 'Only observable domain mastery modeled with Bayesian uncertainty.' },
    { rule: 'No Future Life Outcome Predictions', status: 'ENFORCED', desc: 'No predictive determinations on career limits or life trajectories.' },
    { rule: 'Right to Contest & Correct', status: 'ACTIVE', desc: 'Learners & teachers can trigger manual evidence recalculation anytime.' },
  ];

  const currentConflict = conflicts.find((c) => c.id === selectedCase) || conflicts[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Three-Evidence Governance & Simplicity Benchmark</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Clauses N18.66–N18.75 & N18.136
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            System, Teacher, and Learner triangulation, divergence conflict resolution, and the 5% simplicity benchmark gate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-500/30">
            Divergence Threshold: 25 pts
          </span>
        </div>
      </div>

      {/* Triangulation Conflict Resolution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Evidence Triangulation (Clause N18.66)</h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                currentConflict.divergence > 25
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {currentConflict.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">System (AI)</span>
              <span className="text-lg font-bold text-cyan-400">{currentConflict.systemScore}%</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Teacher</span>
              <span className="text-lg font-bold text-indigo-400">{currentConflict.teacherScore}%</span>
            </div>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Learner Self</span>
              <span className="text-lg font-bold text-amber-400">{currentConflict.learnerSelfScore}%</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Concept:</span>
              <span className="text-slate-200 font-medium">{currentConflict.conceptName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Divergence:</span>
              <span
                className={`font-mono font-bold ${
                  currentConflict.divergence > 25 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {currentConflict.divergence} points (Threshold: 25)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Resolution Action:</span>
              <span className="font-mono text-cyan-300">{currentConflict.actionTaken}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {currentConflict.notes}
          </p>
        </div>

        {/* Simplicity Benchmark Gate */}
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Simplicity Benchmark Gate (Clause N18.136)</h3>
            <span className="text-[10px] font-mono text-slate-400">Requirement: &Delta; &ge; 0.05</span>
          </div>

          <div className="space-y-3">
            {simplicityBenchmarks.map((sb) => (
              <div
                key={sb.modelName}
                className={`p-3 rounded-lg border text-xs ${
                  sb.authorized
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-rose-950/20 border-rose-800/40'
                }`}
              >
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-slate-200">{sb.modelName}</span>
                  <span
                    className={`font-mono font-bold ${sb.authorized ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    &Delta; = +{(sb.delta * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  vs. Baseline: <span className="text-slate-300">{sb.baselineName}</span> ({sb.metric})
                </div>
                <div
                  className={`mt-2 font-mono text-[10px] ${
                    sb.authorized ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  Decision: {sb.decision}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Epistemic Safety Boundaries Scorecard */}
      <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-300">
            Cognitive Personalization Safety Boundaries (Clauses N18.2, N18.71)
          </span>
          <span className="text-[11px] font-mono text-emerald-400">100% Invariant Compliant</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {safetyGuarantees.map((sg) => (
            <div key={sg.rule} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-200">{sg.rule}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {sg.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{sg.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
