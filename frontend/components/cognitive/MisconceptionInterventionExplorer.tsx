'use client';

import React, { useState } from 'react';

interface MisconceptionHypothesis {
  id: string;
  conceptId: string;
  name: string;
  description: string;
  errorCategory: string;
  confirmationCount: number;
  status: 'CANDIDATE' | 'VALIDATED' | 'RETIRED';
  firstObserved: string;
  lastConfirmed: string;
  interventionType: string;
}

interface HintStep {
  tier: number;
  type: string;
  content: string;
  costPoints: number;
}

export function MisconceptionInterventionExplorer() {
  const [selectedHypothesis, setSelectedHypothesis] = useState<string>('MIS-FRAC-001');
  const [activeHintTier, setActiveHintTier] = useState<number>(1);

  const hypotheses: MisconceptionHypothesis[] = [
    {
      id: 'MIS-FRAC-001',
      conceptId: 'MATH-FRAC-001',
      name: 'Independent Numerator/Denominator Addition',
      description: 'Learner adds numerators together and denominators together directly: a/b + c/d = (a+c)/(b+d).',
      errorCategory: 'SYSTEMATIC_MISCONCEPTION',
      confirmationCount: 4,
      status: 'VALIDATED', // >= 3 confirmations
      firstObserved: '2026-09-15',
      lastConfirmed: '2026-09-18',
      interventionType: 'REFUTATION_TEXT',
    },
    {
      id: 'MIS-PHYS-002',
      conceptId: 'PHYS-FORC-002',
      name: 'Impetus / Continuous Force Requirement',
      description: 'Learner believes an object in motion must be continuously pushed to sustain constant velocity.',
      errorCategory: 'INTUITIVE_HEURISTIC_OVERREACH',
      confirmationCount: 2,
      status: 'CANDIDATE', // < 3 confirmations (requires 3 before validated!)
      firstObserved: '2026-09-17',
      lastConfirmed: '2026-09-19',
      interventionType: 'BRIDGING_ANALOGY',
    },
    {
      id: 'MIS-CHEM-003',
      conceptId: 'CHEM-BOND-003',
      name: 'Bond Energy Sign Inversion',
      description: 'Learner assumes forming a bond absorbs energy rather than releasing energy.',
      errorCategory: 'RULE_OVERSPECIFICATION',
      confirmationCount: 5,
      status: 'RETIRED', // Successfully remediated
      firstObserved: '2026-09-02',
      lastConfirmed: '2026-09-10',
      interventionType: 'CONTRASTIVE_EXAMPLES',
    },
  ];

  const hints: HintStep[] = [
    {
      tier: 1,
      type: 'CONCEPTUAL',
      content: 'Consider what a fraction represents: parts of a whole of the same size. Can you combine slices if the cakes were sliced differently?',
      costPoints: 0,
    },
    {
      tier: 2,
      type: 'STRATEGIC',
      content: 'Find a common denominator first to ensure all parts represent identical partition sizes before adding.',
      costPoints: 1,
    },
    {
      tier: 3,
      type: 'PARTIAL_SCAFFOLD',
      content: 'For 1/3 + 1/4, the common denominator is 12. Convert 1/3 into ?/12 and 1/4 into ?/12.',
      costPoints: 2,
    },
    {
      tier: 4,
      type: 'WORKED_EXAMPLE',
      content: 'Similar problem: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. Notice how the denominators are converted before addition.',
      costPoints: 3,
    },
    {
      tier: 5,
      type: 'ANSWER_EXPLANATION',
      content: '1/3 = 4/12 and 1/4 = 3/12. Therefore, 4/12 + 3/12 = 7/12. Adding denominators directly yields 2/7, which is smaller than 1/3!',
      costPoints: 5,
    },
  ];

  const currentHypothesis = hypotheses.find((h) => h.id === selectedHypothesis) || hypotheses[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Misconception & Intervention Explorer</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Clauses N18.15–N18.25
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            8-fold error taxonomy, anti-labeling candidate hypothesis tracking, and 5-tier progressive scaffolding.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-3 py-1 rounded border border-purple-500/30">
            Multi-Constraint Intervention
          </span>
        </div>
      </div>

      {/* Hypothesis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hypotheses.map((h) => (
          <div
            key={h.id}
            onClick={() => setSelectedHypothesis(h.id)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              selectedHypothesis === h.id
                ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-slate-400">{h.id}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  h.status === 'VALIDATED'
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                    : h.status === 'CANDIDATE'
                    ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {h.status}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mt-2 line-clamp-1">{h.name}</h4>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{h.description}</p>
            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
              <span>Confirmations:</span>
              <span className="font-mono text-slate-200">{h.confirmationCount} / 3 needed</span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Misconception Details */}
      <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-white">{currentHypothesis.name}</h3>
            <span className="text-xs text-slate-400">
              Taxonomy Classification: <span className="text-cyan-400 font-mono">{currentHypothesis.errorCategory}</span>
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Recommended Remedy: <span className="font-semibold text-emerald-400">{currentHypothesis.interventionType}</span>
          </div>
        </div>

        <p className="text-sm text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
          {currentHypothesis.description}
        </p>

        {/* 5-Tier Progressive Hint State Machine */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-300">5-Tier Progressive Scaffolding (Clause N18.20)</span>
            <span className="text-[11px] text-slate-400">Anti-Dependency Costing</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {hints.map((h) => (
              <button
                key={h.tier}
                onClick={() => setActiveHintTier(h.tier)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  activeHintTier === h.tier
                    ? 'bg-indigo-950/60 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-500">Tier {h.tier}</div>
                <div className="text-xs font-semibold mt-0.5 truncate">{h.type}</div>
                <div className="text-[10px] text-slate-400 mt-1">Cost: {h.costPoints} pts</div>
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-indigo-300">
                Tier {activeHintTier}: {hints[activeHintTier - 1].type}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Agency Penalty: {hints[activeHintTier - 1].costPoints} pts
              </span>
            </div>
            <p className="text-sm text-slate-200">{hints[activeHintTier - 1].content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
