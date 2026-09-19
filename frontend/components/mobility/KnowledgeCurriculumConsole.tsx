'use client';

import React, { useState } from 'react';

interface CurriculumItem {
  id: string;
  version: string;
  title: string;
  status: string;
  rationale: string;
  authority: string;
}

interface TrendItem {
  id: string;
  name: string;
  sampleSize: number;
  direction: string;
  confidence: number;
  scope: string;
}

interface NegativeEvidenceItem {
  id: string;
  intervention: string;
  outcome: string;
  failureMode: string;
  mitigation: string;
}

export default function KnowledgeCurriculumConsole() {
  const [curricula] = useState<CurriculumItem[]>([
    {
      id: 'curr_ai_foundations_v1',
      version: '1.2',
      title: 'High School AI Foundations & Ethics',
      status: 'ACTIVE',
      rationale: 'Updated transformer interpretability section based on N18 research',
      authority: 'ACADEMIC_COUNCIL_DELHI',
    },
    {
      id: 'curr_data_structures_v2',
      version: '2.0',
      title: 'Applied Data Structures & Algorithmic Thinking',
      status: 'APPROVED',
      rationale: 'Integrated cross-institution transfer tasks for graph search',
      authority: 'CURRICULUM_SENATE_MEMBER',
    },
  ]);

  const [trends] = useState<TrendItem[]>([
    {
      id: 'trend_01',
      name: 'Quantum Information & Qubits',
      sampleSize: 1240,
      direction: 'INCREASING',
      confidence: 0.88,
      scope: 'GLOBAL',
    },
    {
      id: 'trend_02',
      name: 'WCAG AAA Accessibility Engineering',
      sampleSize: 3100,
      direction: 'INCREASING',
      confidence: 0.94,
      scope: 'REGIONAL (INDIA & EU)',
    },
    {
      id: 'trend_03',
      name: 'Legacy PHP Monolithic Scripting',
      sampleSize: 850,
      direction: 'DECREASING',
      confidence: 0.82,
      scope: 'GLOBAL',
    },
  ]);

  const [negativeEvidence] = useState<NegativeEvidenceItem[]>([
    {
      id: 'neg_01',
      intervention: 'Unconstrained LLM code synthesis in introductory lab',
      outcome: '42% decrease in independent transfer capability on AI removal test',
      failureMode: 'UNEXPECTED_COGNITIVE_OVERLOAD',
      mitigation: 'Enforce 5-tier progressive hints and require manual syntax entry before AI autocomplete',
    },
  ]);

  const [killSwitches, setKillSwitches] = useState<Record<string, boolean>>({
    OPPORTUNITY_NETWORK: true,
    COMMUNITY_FEATURES: true,
    EVIDENCE_EXCHANGE: true,
    EXTERNAL_INTEGRATIONS: true,
    AI_RECOMMENDATIONS: true,
    GLOBAL_EMERGENCY: true,
  });

  const toggleKillSwitch = (key: string) => {
    setKillSwitches({
      ...killSwitches,
      [key]: !killSwitches[key],
    });
  };

  return (
    <div className="space-y-6">
      {/* Governance Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Invariant N23.48 & N23.183: Living Curriculum Governance & Negative Evidence Retention
          </span>
          AI may recommend curriculum adaptations, but human educational authorities approve consequential changes. Negative evidence (failed interventions, cognitive overload) is actively preserved to prevent repeated pedagogical errors.
        </div>
        <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
          EVIDENCE RESPONSIVE
        </span>
      </div>

      {/* Grid: Living Curriculum & Capability Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Living Curricula */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Evidence-Responsive Curricula ({curricula.length})
            </h3>
            <span className="text-[10px] text-blue-400 font-mono">Human Approved</span>
          </div>

          <div className="space-y-3">
            {curricula.map((c) => (
              <div key={c.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-xs">{c.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Version {c.version} &bull; Authority: {c.authority}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-900">
                    {c.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{c.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Global Capability Trends */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Global Capability Trend Intelligence ({trends.length})
            </h3>
            <span className="text-[10px] text-amber-400 font-mono">Uncertainty Quantified</span>
          </div>

          <div className="space-y-3">
            {trends.map((t) => (
              <div key={t.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-xs">{t.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Scope: {t.scope}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                      t.direction === 'INCREASING'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-900'
                        : 'bg-rose-950 text-rose-300 border-rose-900'
                    }`}
                  >
                    {t.direction}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                  <div>
                    <span className="text-slate-500">Sample Size:</span> {t.sampleSize.toLocaleString()}
                  </div>
                  <div>
                    <span className="text-slate-500">Statistical Confidence:</span>{' '}
                    {Math.round(t.confidence * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Negative Evidence Registry & Scoped Safety Kill Switches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Negative Evidence Registry */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Negative Evidence Registry ({negativeEvidence.length})
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Prevents Repeated Failures</span>
          </div>

          <div className="space-y-3">
            {negativeEvidence.map((neg) => (
              <div key={neg.id} className="p-4 rounded-lg bg-slate-950 border border-rose-900/40 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-white">{neg.intervention}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-900">
                    {neg.failureMode}
                  </span>
                </div>
                <div className="text-[11px] text-rose-300/90">Outcome: {neg.outcome}</div>
                <div className="text-[11px] text-slate-400 border-t border-slate-900 pt-1.5">
                  <span className="text-slate-300 font-medium">Mitigation:</span> {neg.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scoped Safety Kill Switches */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Scoped Safety Kill Switches (Clauses N23.188–N23.189)
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Independent Containment</span>
          </div>

          <div className="space-y-2">
            {Object.entries(killSwitches).map(([sub, active]) => (
              <div
                key={sub}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-mono text-white text-[11px] font-semibold">{sub}</span>
                  <span className="block text-[10px] text-slate-500">
                    {active ? 'Subsystem Active & Operational' : 'SUBYSTEM TRIPPED / CONTAINED'}
                  </span>
                </div>
                <button
                  onClick={() => toggleKillSwitch(sub)}
                  className={`px-3 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                    active
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-800'
                  }`}
                >
                  {active ? 'TRIP' : 'RESTORE'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
