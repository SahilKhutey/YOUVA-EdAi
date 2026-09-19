'use client';

import React, { useState, useEffect } from 'react';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  description: string;
  opportunityType: 'INTERNSHIP' | 'APPRENTICESHIP' | 'RESEARCH' | 'FELLOWSHIP' | 'FULL_TIME' | 'PROJECT_GIG';
  requiredCapabilities: string[];
  preferredCapabilities: string[];
  location: string;
  isRemote: boolean;
  compensationRange: string;
  sanitized: boolean;
  injectionRiskScore: number;
}

export interface OpportunityCompatibility {
  opportunityId: string;
  learnerId: string;
  matchScore: number;
  demonstratedCapabilities: string[];
  gapCapabilities: string[];
  recommendationSummary: string;
  nonSelectionDisclaimer: string;
}

export default function OpportunityIntelligencePortal({ learnerId = 'learner-alex-001' }: { learnerId?: string }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [compatibility, setCompatibility] = useState<OpportunityCompatibility | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/v1/capability/opportunities')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOpportunities(data);
          if (data.length > 0) setSelectedOpp(data[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleEvaluate = async (oppId: string) => {
    setEvaluating(true);
    try {
      const res = await fetch(`/api/v1/capability/opportunities/${oppId}/compatibility?learnerId=${learnerId}`);
      if (res.ok) {
        const data = await res.json();
        setCompatibility(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mandatory Invariant 5 Banner */}
      <div className="p-4 bg-amber-950/20 border border-amber-800/50 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚖️</span>
          <div>
            <h3 className="text-sm font-bold text-amber-200">
              Constitutional Principle: Opportunity Matching &ne; Autonomous Selection (Clause N20.27)
            </h3>
            <p className="text-xs text-amber-300/80 mt-1">
              YOUVA algorithms evaluate compatibility for exploratory capability navigation only. The system is strictly forbidden from making autonomous hiring, admissions, or rejection determinations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Opportunity List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Opportunities</h3>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading opportunities...</div>
          ) : (
            opportunities.map((opp) => (
              <div
                key={opp.id}
                onClick={() => {
                  setSelectedOpp(opp);
                  setCompatibility(null);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedOpp?.id === opp.id
                    ? 'bg-purple-950/20 border-purple-500/80 shadow-md'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-purple-400 font-medium">{opp.organization}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                    {opp.opportunityType}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">{opp.title}</h4>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{opp.location}</span>
                  <span className="font-mono text-emerald-400">{opp.compensationRange}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Shielded (Risk: {opp.injectionRiskScore})
                  </span>
                  {opp.isRemote && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">
                      Remote
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Opportunity Inspector & Compatibility Evaluation */}
        <div className="lg:col-span-7">
          {selectedOpp ? (
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-purple-400">{selectedOpp.organization}</span>
                  <span>{selectedOpp.location}</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">{selectedOpp.title}</h3>
                <p className="text-xs text-slate-300 mt-2">{selectedOpp.description}</p>
              </div>

              {/* Requirements & Shield Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">Required Capabilities</span>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    {selectedOpp.requiredCapabilities.map((req) => (
                      <li key={req} className="font-mono text-[11px]">{req}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">Adversarial Content Guard (N20.186)</span>
                  <p className="text-[11px] text-slate-400">
                    Sanitized: <span className="text-emerald-400 font-mono">Yes</span> | Risk Score: <span className="font-mono text-cyan-400">{selectedOpp.injectionRiskScore}/100</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Defends against prompt injection and unauthorized directive hijacking in opportunity descriptions.
                  </p>
                </div>
              </div>

              {/* Action: Evaluate Compatibility */}
              <div className="border-t border-slate-800 pt-3">
                <button
                  onClick={() => handleEvaluate(selectedOpp.id)}
                  disabled={evaluating}
                  className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-purple-600/50"
                >
                  {evaluating ? 'Evaluating Compatibility...' : `Evaluate Compatibility for ${learnerId}`}
                </button>
              </div>

              {/* Compatibility Result */}
              {compatibility && (
                <div className="p-4 bg-slate-950/90 border border-purple-800/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-300">Capability Compatibility Score</span>
                    <span className="text-base font-bold font-mono text-purple-400">{compatibility.matchScore}%</span>
                  </div>
                  <p className="text-xs text-slate-300">{compatibility.recommendationSummary}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                      <span className="font-bold block mb-1">Demonstrated:</span>
                      {compatibility.demonstratedCapabilities.length > 0
                        ? compatibility.demonstratedCapabilities.join(', ')
                        : 'None yet'}
                    </div>
                    <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-amber-300">
                      <span className="font-bold block mb-1">Gaps to Target:</span>
                      {compatibility.gapCapabilities.length > 0
                        ? compatibility.gapCapabilities.join(', ')
                        : 'No critical gaps'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 italic">
                    {compatibility.nonSelectionDisclaimer}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500 border border-slate-800 rounded-xl">
              Select an opportunity to inspect requirements and evaluate compatibility.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
