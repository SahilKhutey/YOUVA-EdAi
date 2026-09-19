'use client';

import React, { useState, useEffect } from 'react';

export interface LongitudinalOutcome {
  id: string;
  learnerId: string;
  category: 'EMPLOYMENT' | 'WAGE_GROWTH' | 'RESEARCH_PUBLICATION' | 'VENTURE_FOUNDED' | 'CAREER_PIVOT';
  title: string;
  metricValue: string;
  recordedAt: string;
  associatedCapabilityIds: string[];
  correlationStrength: number;
  causalityDisclaimer: string;
}

export interface ResearchExperiment {
  experimentId: string;
  experimentName: string;
  hypothesis: string;
  primaryOutcomeMetric: string;
  counterfactualMethodology: string;
  targetSampleSize: number;
  registeredAt: string;
  preregistrationHash: string;
  status: string;
}

export default function OutcomeLongitudinalView({ learnerId }: { learnerId?: string }) {
  const [outcomes, setOutcomes] = useState<LongitudinalOutcome[]>([]);
  const [experiments, setExperiments] = useState<ResearchExperiment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const url = learnerId ? `/api/v1/capability/outcomes?learnerId=${learnerId}` : '/api/v1/capability/outcomes';
    Promise.all([
      fetch(url).then((r) => r.json()),
      fetch('/api/v1/capability/research-registry').then((r) => r.json()),
    ])
      .then(([outcomesData, expData]) => {
        if (Array.isArray(outcomesData)) setOutcomes(outcomesData);
        if (Array.isArray(expData)) setExperiments(expData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [learnerId]);

  return (
    <div className="space-y-6">
      {/* Mandatory Invariant 6 Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl">📊</span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Constitutional Doctrine: Longitudinal Correlation &ne; Causality (Clause N20.46)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              YOUVA records empirical real-world outcomes associated with verified capabilities. It is strictly forbidden to market or report these associations as unilateral causal proof without pre-registered counterfactual randomized trials.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Longitudinal Outcomes Stream */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Validated Longitudinal Outcomes
          </h3>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading outcomes...</div>
          ) : outcomes.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No longitudinal outcomes recorded yet.</div>
          ) : (
            outcomes.map((out) => (
              <div key={out.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">
                    {out.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Learner: {out.learnerId}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{out.title}</h4>
                  <div className="text-base font-mono font-semibold text-emerald-400 mt-1">{out.metricValue}</div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Associated Capabilities: {out.associatedCapabilityIds.join(', ')}</span>
                  <span>Correlation: <strong className="text-purple-400 font-mono">r = {out.correlationStrength}</strong></span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800/70 text-[10px] text-slate-400 italic">
                  {out.causalityDisclaimer}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pre-Registered Research Experiment Registry */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pre-Registered Research Registry (N20.207)
          </h3>
          {experiments.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/50">
              No active research experiments registered. Pre-register hypothesis to unlock empirical trials.
            </div>
          ) : (
            experiments.map((exp) => (
              <div key={exp.experimentId} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{exp.experimentName}</span>
                  <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 bg-emerald-950 border border-emerald-800 rounded">
                    {exp.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 italic">"{exp.hypothesis}"</p>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Primary Metric: <span className="text-slate-300 font-mono">{exp.primaryOutcomeMetric}</span></div>
                  <div>Methodology: <span className="text-slate-300">{exp.counterfactualMethodology}</span></div>
                  <div>Sample Size: <span className="text-slate-300 font-mono">n = {exp.targetSampleSize}</span></div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate pt-1 border-t border-slate-800">
                  Hash: {exp.preregistrationHash}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
