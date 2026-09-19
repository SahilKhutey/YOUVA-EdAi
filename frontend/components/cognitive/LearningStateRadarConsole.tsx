'use client';

import React, { useState } from 'react';

interface LearningStateDisplay {
  conceptId: string;
  conceptName: string;
  subject: string;
  meanMastery: number; // 0 to 1
  standardDeviation: number; // uncertainty sigma
  credibilityLower: number;
  credibilityUpper: number;
  evidenceCount: number;
  levelDistribution: {
    interaction: number;
    practice: number;
    assessment: number;
    transfer: number;
    retention: number;
    teacherValidated: number;
  };
  remediationTrapFlag: boolean;
  challengeTrapFlag: boolean;
  lastUpdated: string;
}

export function LearningStateRadarConsole() {
  const [selectedConcept, setSelectedConcept] = useState<string>('MATH-CALC-001');

  const states: LearningStateDisplay[] = [
    {
      conceptId: 'MATH-CALC-001',
      conceptName: 'Derivative Chain Rule & Composite Functions',
      subject: 'Mathematics',
      meanMastery: 0.82,
      standardDeviation: 0.06,
      credibilityLower: 0.76,
      credibilityUpper: 0.88,
      evidenceCount: 18,
      levelDistribution: {
        interaction: 4,
        practice: 6,
        assessment: 3,
        transfer: 2,
        retention: 2,
        teacherValidated: 1,
      },
      remediationTrapFlag: false,
      challengeTrapFlag: false,
      lastUpdated: '2026-09-19T10:15:00Z',
    },
    {
      conceptId: 'PHYS-OPT-002',
      conceptName: 'Snell\'s Law & Total Internal Reflection',
      subject: 'Physics',
      meanMastery: 0.44,
      standardDeviation: 0.18,
      credibilityLower: 0.26,
      credibilityUpper: 0.62,
      evidenceCount: 9,
      levelDistribution: {
        interaction: 5,
        practice: 3,
        assessment: 1,
        transfer: 0,
        retention: 0,
        teacherValidated: 0,
      },
      remediationTrapFlag: true, // 5 sessions with no gain
      challengeTrapFlag: true, // High uncertainty (sigma > 0.15)
      lastUpdated: '2026-09-19T09:45:00Z',
    },
    {
      conceptId: 'CHEM-EQUIL-003',
      conceptName: 'Le Chatelier Principle & Pressure Perturbations',
      subject: 'Chemistry',
      meanMastery: 0.91,
      standardDeviation: 0.04,
      credibilityLower: 0.87,
      credibilityUpper: 0.95,
      evidenceCount: 24,
      levelDistribution: {
        interaction: 6,
        practice: 8,
        assessment: 4,
        transfer: 3,
        retention: 2,
        teacherValidated: 1,
      },
      remediationTrapFlag: false,
      challengeTrapFlag: false,
      lastUpdated: '2026-09-18T16:30:00Z',
    },
  ];

  const current = states.find((s) => s.conceptId === selectedConcept) || states[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Learning State 2.0 & Credibility Radar</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Clauses N18.3–N18.15
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Epistemic Bayesian mastery with explicit uncertainty bounds \([ \mu - \sigma, \mu + \sigma ]\) and 6-level evidence hierarchy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded border border-cyan-500/30">
            Anti-Labeling Invariant Active
          </span>
        </div>
      </div>

      {/* Concept Selector */}
      <div className="flex flex-wrap gap-2">
        {states.map((s) => (
          <button
            key={s.conceptId}
            onClick={() => setSelectedConcept(s.conceptId)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedConcept === s.conceptId
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {s.conceptName} ({s.subject})
          </button>
        ))}
      </div>

      {/* Mastery & Uncertainty Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Mean Mastery (\(\mu\))</span>
            <span className="text-xs font-mono text-emerald-400">{(current.meanMastery * 100).toFixed(1)}%</span>
          </div>
          <div className="relative pt-2">
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${current.meanMastery * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
              <span>Novice (0.0)</span>
              <span>Proficient (0.7)</span>
              <span>Mastery (1.0)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Uncertainty (\(\sigma\)):</span>
              <span className={`font-mono ${current.standardDeviation > 0.15 ? 'text-amber-400' : 'text-slate-300'}`}>
                &plusmn;{(current.standardDeviation * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">68% Credibility Interval:</span>
              <span className="font-mono text-cyan-300">
                [{(current.credibilityLower * 100).toFixed(1)}%, {(current.credibilityUpper * 100).toFixed(1)}%]
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Total Validated Evidences:</span>
              <span className="font-mono text-slate-200">{current.evidenceCount}</span>
            </div>
          </div>
        </div>

        {/* 6-Level Evidence Hierarchy Breakdown */}
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3 md:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-300">Evidence Hierarchy Distribution (Clause N18.11)</span>
            <span className="text-[11px] text-slate-400 font-mono">Total: {current.evidenceCount} non-duplicate items</span>
          </div>

          <div className="space-y-2">
            {[
              { level: 'L1: Interaction', weight: '0.10', count: current.levelDistribution.interaction, bar: 'bg-slate-500' },
              { level: 'L2: Practice', weight: '0.25', count: current.levelDistribution.practice, bar: 'bg-blue-500' },
              { level: 'L3: Assessment', weight: '0.50', count: current.levelDistribution.assessment, bar: 'bg-indigo-500' },
              { level: 'L4: Transfer (Near & Far)', weight: '0.75', count: current.levelDistribution.transfer, bar: 'bg-purple-500' },
              { level: 'L5: Longitudinal Retention', weight: '0.85', count: current.levelDistribution.retention, bar: 'bg-amber-500' },
              { level: 'L6: Teacher-Validated', weight: '1.00', count: current.levelDistribution.teacherValidated, bar: 'bg-emerald-500' },
            ].map((item) => (
              <div key={item.level} className="flex items-center gap-3 text-xs">
                <span className="w-40 text-slate-400 truncate">{item.level}</span>
                <span className="text-[10px] text-slate-500 font-mono w-12">(w={item.weight})</span>
                <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.bar}`}
                    style={{
                      width: `${current.evidenceCount > 0 ? (item.count / current.evidenceCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-slate-300">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Traps Prevention Guardrails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            current.remediationTrapFlag
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-xs">
            <span className={`h-2 w-2 rounded-full ${current.remediationTrapFlag ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            Remediation Trap Monitor (Clause N18.27)
          </div>
          <p className="text-[11px] mt-1 text-slate-400">
            {current.remediationTrapFlag
              ? 'ALERT: Student has completed >4 remedial sessions without measurable gain. Autonomous remedial escalation paused; teacher diagnostic intervention recommended.'
              : 'NORMAL: No remediation looping detected. Progression pacing within healthy cognitive boundaries.'}
          </p>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            current.challengeTrapFlag
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-xs">
            <span className={`h-2 w-2 rounded-full ${current.challengeTrapFlag ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            Challenge Trap Monitor (Clause N18.28)
          </div>
          <p className="text-[11px] mt-1 text-slate-400">
            {current.challengeTrapFlag
              ? 'WARNING: Difficulty escalation blocked because mastery uncertainty (\(\sigma = ' +
                current.standardDeviation.toFixed(2) +
                '\)) exceeds stability threshold (0.15). Additional diagnostic evidence required.'
              : 'STABLE: Epistemic uncertainty is within acceptable bounds (\(\sigma \le 0.15\)). Adaptive difficulty progression permitted.'}
          </p>
        </div>
      </div>
    </div>
  );
}
