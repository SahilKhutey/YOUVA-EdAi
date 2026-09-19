'use client';

import React, { useState } from 'react';

export function ComplexityBudgetRetirementConsole() {
  const [cbi, setCbi] = useState<number>(78.5);
  const [freezeActive, setFreezeActive] = useState<boolean>(false);
  const [retireCandidates, setRetireCandidates] = useState<string[]>([
    'LEGACY_TEXT_ONLY_NEWTON_02',
    'DEPRECATED_V1_STATIC_FLASHCARD_WIDGET',
  ]);

  const handleRetire = (featureId: string) => {
    setRetireCandidates((prev) => prev.filter((f) => f !== featureId));
    const newCbi = Math.max(0, Number((cbi - 2.5).toFixed(1)));
    setCbi(newCbi);
    if (newCbi < 100) setFreezeActive(false);
  };

  const redTeamDrills = [
    {
      id: 'DRILL-01',
      domain: 'AI_EXFILTRATION',
      scenario: 'System Prompt Extraction via Multi-Turn Injection',
      contained: true,
      latency: '42ms',
      mitigation: 'Prompt Isolation Firewall (TOOL-004)',
    },
    {
      id: 'DRILL-02',
      domain: 'CHILD_DEPENDENCY',
      scenario: 'Emotional Overattachment & Secret Keeping Solicitation',
      contained: true,
      latency: '65ms',
      mitigation: 'Child Attachment Guardrail & Parent Redirection',
    },
    {
      id: 'DRILL-03',
      domain: 'AUTONOMY_ESCALATION',
      scenario: 'Sub-agent Attempting Direct DB Mutation Tool Without Ticket',
      contained: true,
      latency: '18ms',
      mitigation: 'Consequential Action Human Authorization Barrier',
    },
  ];

  const quadrantInitiatives = [
    { name: 'Spaced Retrieval Dynamic Interval Engine', category: 'MODEL', decision: 'BUILD', edu: 88, risk: 12 },
    { name: 'Emotion-Adaptive Expressive Voice Persona', category: 'AGENT', decision: 'CONTROLLED_RESEARCH', edu: 72, risk: 68 },
    { name: 'Autonomous High-Stakes Exam Grader', category: 'AGENT', decision: 'REJECT', edu: 40, risk: 85 },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Complexity Budget & Governance Console</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Clauses N17.53–N17.57 & N17.114–N17.121
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Product Complexity Budget Index (CBI), feature retirement lifecycle, 4-Quadrant Investment decisions, and continuous adversarial red-team drills.
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-500/30">
          Stop-The-Line Authority: READY
        </span>
      </div>

      {/* TOP ROW: COMPLEXITY BUDGET GAUGE & RETIREMENT QUEUE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CBI Gauge */}
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">Complexity Budget Index (CBI)</h3>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                cbi >= 100
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {cbi} / 100 {cbi >= 100 ? '(FREEZE ACTIVE)' : '(HEALTHY)'}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cbi >= 100 ? 'bg-rose-500' : cbi >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, cbi)}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Features</span>
              <span className="font-bold text-white">42</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Agents</span>
              <span className="font-bold text-indigo-400">8</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Models</span>
              <span className="font-bold text-cyan-400">5</span>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Integrations</span>
              <span className="font-bold text-amber-400">6</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Complexity Invariant (Clause N17.120): Every capability must justify its permanent governance and cognitive overhead.
          </p>
        </div>

        {/* Feature Retirement Queue */}
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">Candidate Feature Retirement Queue</h3>
            <span className="text-xs font-mono text-amber-400">{retireCandidates.length} Candidates</span>
          </div>

          {retireCandidates.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              No features currently flagged for retirement.
            </div>
          ) : (
            <div className="space-y-2">
              {retireCandidates.map((cand) => (
                <div key={cand} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs">
                  <div>
                    <span className="font-mono font-bold text-white block">{cand}</span>
                    <span className="text-[11px] text-slate-400">Low educational efficacy &gt; 60 days</span>
                  </div>
                  <button
                    onClick={() => handleRetire(cand)}
                    className="px-3 py-1 bg-rose-600/80 hover:bg-rose-600 text-white font-semibold rounded text-xs transition-colors"
                  >
                    Retire (-2.5 CBI)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOUR-QUADRANT INVESTMENT MATRIX */}
      <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Four-Quadrant Decision Framework (Clause N17.114)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quadrantInitiatives.map((q) => (
            <div key={q.name} className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-white leading-tight">{q.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    q.decision === 'BUILD'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                      : q.decision === 'CONTROLLED_RESEARCH'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                      : 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {q.decision}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Edu Value: <strong className="text-emerald-400">{q.edu}%</strong></span>
                <span>Risk: <strong className={q.risk > 30 ? 'text-rose-400' : 'text-slate-300'}>{q.risk}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTINUOUS ADVERSARIAL RED-TEAM DRILLS */}
      <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-200">Continuous Adversarial Red Team Drills (Clauses N17.53–N17.57)</h3>
          <span className="text-xs font-mono text-emerald-400 font-semibold">100% Contained (Avg: 41ms)</span>
        </div>
        <div className="space-y-2">
          {redTeamDrills.map((d) => (
            <div key={d.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-400">{d.domain}</span>
                  <span className="text-white font-medium">• {d.scenario}</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">Mitigation: {d.mitigation}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400 text-[11px]">{d.latency}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                  CONTAINED
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
