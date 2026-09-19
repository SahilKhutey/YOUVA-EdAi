'use client';

import React, { useState, useEffect } from 'react';

export interface SupplyDemandSignal {
  capabilityId: string;
  title: string;
  aggregateDemonstratedCount: number;
  aggregateOpportunityDemandCount: number;
  marketSignal: 'SURPLUS' | 'EQUILIBRIUM' | 'HIGH_DEMAND' | 'EMERGING';
  noIndividualScoreDeclaration: string;
}

export interface EcosystemHealthIndex {
  evidenceQuality: number;
  credentialTrust: number;
  interoperability: number;
  privacyCompliance: number;
  teacherWorkloadIndex: number;
  learnerAgencyScore: number;
  compositeScore: number;
  evaluatedAt: string;
}

export default function FederatedAnalyticsPortal() {
  const [supplyDemand, setSupplyDemand] = useState<SupplyDemandSignal[]>([]);
  const [health, setHealth] = useState<EcosystemHealthIndex | null>(null);
  const [cohortResult, setCohortResult] = useState<any | null>(null);
  const [sampleSizeInput, setSampleSizeInput] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/ecosystem/analytics/supply-demand').then((r) => r.json()),
      fetch('/api/v1/ecosystem/analytics/health').then((r) => r.json()),
    ])
      .then(([sdData, healthData]) => {
        if (Array.isArray(sdData)) setSupplyDemand(sdData);
        setHealth(healthData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleTestCohort = async (size: number) => {
    const mockScores = Array.from({ length: size }, () => Math.floor(Math.random() * 40) + 60);
    try {
      const res = await fetch('/api/v1/ecosystem/analytics/cohort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricName: 'Cohort Mastery Retention Rate',
          sampleValues: mockScores,
          applyDifferentialPrivacy: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCohortResult(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getSignalBadge = (signal: SupplyDemandSignal['marketSignal']) => {
    const colors: Record<string, string> = {
      HIGH_DEMAND: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      EMERGING: 'bg-purple-950/80 text-purple-300 border-purple-800',
      EQUILIBRIUM: 'bg-blue-950/80 text-blue-300 border-blue-800',
      SURPLUS: 'bg-slate-800 text-slate-400 border-slate-700',
    };
    return colors[signal] || 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Privacy & Small-Cohort Invariant Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Constitutional Doctrine: Small-Cohort Privacy Protection & Anti-Ranking (Clause N21.17, N21.64)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Minimum aggregation threshold enforced (n &ge; 10). Cohorts smaller than 10 are strictly suppressed to eliminate re-identification risks. Individual employability scores are prohibited.
            </p>
          </div>
        </div>
      </div>

      {/* Multidimensional Ecosystem Health Index */}
      {health && (
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Multidimensional Ecosystem Health Index</h3>
              <p className="text-xs text-slate-400">Evaluated across 6 orthogonal dimensions (Clause N21.60)</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-500 font-mono">Composite Balance</span>
              <div className="text-xl font-bold font-mono text-purple-400">{health.compositeScore}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Evidence Quality</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{health.evidenceQuality}%</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Credential Trust</span>
              <span className="text-sm font-bold font-mono text-blue-400">{health.credentialTrust}%</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Interoperability</span>
              <span className="text-sm font-bold font-mono text-cyan-400">{health.interoperability}%</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Privacy Compliance</span>
              <span className="text-sm font-bold font-mono text-purple-400">{health.privacyCompliance}%</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Teacher Workload</span>
              <span className="text-sm font-bold font-mono text-amber-400">{health.teacherWorkloadIndex}%</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Learner Agency</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{health.learnerAgencyScore}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Supply/Demand vs Small-Cohort Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Capability Supply/Demand Map */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Aggregate Capability Supply vs. Demand
          </h3>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading supply/demand map...</div>
          ) : (
            supplyDemand.map((sd) => (
              <div key={sd.capabilityId} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-purple-400">{sd.capabilityId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-semibold ${getSignalBadge(sd.marketSignal)}`}>
                    {sd.marketSignal}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">{sd.title}</h4>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Demonstrated: <strong className="text-slate-200 font-mono">{sd.aggregateDemonstratedCount}</strong></span>
                  <span>Opportunity Demand: <strong className="text-emerald-400 font-mono">{sd.aggregateOpportunityDemandCount}</strong></span>
                </div>
                <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-800">
                  {sd.noIndividualScoreDeclaration}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Small-Cohort Protection Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Small-Cohort Protection Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Test differential privacy aggregation and small-cohort suppression thresholds (n &ge; 10).
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSampleSizeInput(5);
                  handleTestCohort(5);
                }}
                className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono"
              >
                Test n = 5 (Small)
              </button>
              <button
                onClick={() => {
                  setSampleSizeInput(25);
                  handleTestCohort(25);
                }}
                className="flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-mono"
              >
                Test n = 25 (Valid)
              </button>
            </div>

            {cohortResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs space-y-2 mt-3 ${
                  cohortResult.isSuppressed
                    ? 'bg-rose-950/20 border-rose-800/60 text-rose-300'
                    : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span>Sample Size: {cohortResult.sampleSize}</span>
                  <span className="font-bold">
                    {cohortResult.isSuppressed ? 'SUPPRESSED' : `Aggregated: ${cohortResult.aggregatedValue}%`}
                  </span>
                </div>
                {cohortResult.isSuppressed ? (
                  <p className="text-[11px] text-rose-400/90">{cohortResult.suppressionReason}</p>
                ) : (
                  <p className="text-[11px] text-emerald-400/90">
                    Threshold satisfied (n &ge; 10). Differential privacy Laplace noise applied. Zero re-identification risk.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
