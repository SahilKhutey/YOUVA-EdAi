'use client';

import React from 'react';

export function GovernanceDebtRiskConsole() {
  const debtScore = 24; // Below 100 threshold
  const isFreezeActive = debtScore >= 100;

  const agentLeases = [
    {
      agentId: 'agent-math-tutor-v2',
      tenantId: 'tenant-dps-rkp',
      autonomyClass: 'A3_BOUNDED_EXECUTION',
      grantedAt: '2026-08-01',
      expiresAt: '2026-10-30',
      status: 'ACTIVE',
    },
    {
      agentId: 'agent-safety-triage-v1',
      tenantId: 'global',
      autonomyClass: 'A2_RECOMMENDATION',
      grantedAt: '2026-07-15',
      expiresAt: '2026-10-15',
      status: 'ACTIVE',
    },
    {
      agentId: 'agent-credential-assistant-v1',
      tenantId: 'tenant-nord-anglia',
      autonomyClass: 'A2_RECOMMENDATION',
      grantedAt: '2026-08-10',
      expiresAt: '2026-11-10',
      status: 'ACTIVE',
    },
  ];

  const riskCategories = [
    { cat: 'EDUCATIONAL', score: '3/25', risk: 'LOW', owner: 'Head of Pedagogy', mit: 'Continuous BKT ground truth evaluation' },
    { cat: 'SAFETY', score: '2/25', risk: 'LOW', owner: 'Safeguarding Board', mit: 'Mandatory human escalation & <120s SLA' },
    { cat: 'AI_AUTONOMY', score: '4/25', risk: 'LOW', owner: 'AI Architecture Lead', mit: 'Consequential action gate & 11-step pipeline' },
    { cat: 'SECURITY', score: '3/25', risk: 'LOW', owner: 'Chief Information Security Officer', mit: 'Tool firewall & prompt injection defense' },
    { cat: 'PRIVACY', score: '2/25', risk: 'LOW', owner: 'Data Protection Officer', mit: 'Sovereign regional residency & DPDP Act 2023 compliance' },
    { cat: 'LEGAL', score: '3/25', risk: 'LOW', owner: 'General Counsel', mit: '10-step jurisdiction activation gate' },
    { cat: 'OPERATIONAL', score: '4/25', risk: 'LOW', owner: 'VP Infrastructure', mit: '15-point disaster recovery drills' },
    { cat: 'FINANCIAL', score: '3/25', risk: 'LOW', owner: 'Head of FinOps', mit: '$0.15 session spend ceilings' },
    { cat: 'MARKET', score: '5/25', risk: 'MEDIUM', owner: 'Chief Commercial Officer', mit: 'Demand-gated tiered expansion' },
    { cat: 'REPUTATIONAL', score: '2/25', risk: 'LOW', owner: 'Trust & Communications', mit: 'Zero unverified claims policy' },
    { cat: 'THIRD_PARTY', score: '4/25', risk: 'LOW', owner: 'Vendor Risk Lead', mit: 'Multi-provider fallback abstraction' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Governance Debt & Enterprise Risk Matrix</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Clauses N16.154–N16.158
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Enforces automatic feature freezes when governance debt accumulates, tracks 11 enterprise risk domains, and governs 90-day AI autonomy leases.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Governance Debt Index</span>
            <span className="text-xl font-mono font-black text-amber-400">{debtScore} / 100</span>
          </div>
        </div>
      </div>

      {/* Feature Freeze Status Banner */}
      {isFreezeActive ? (
        <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-rose-300">
            <span className="text-lg">🚫</span>
            <span>
              <strong>GOVERNANCE FEATURE FREEZE ACTIVE:</strong> Debt index exceeds safety threshold (100). New feature
              rollouts are paused until remediation passes.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <span>✓</span>
            <span>Governance Debt Normal. Platform feature expansion permitted under standard change gates.</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Safety Margin: 76 pts</span>
        </div>
      )}

      {/* 1. AI Autonomy 90-Day Leases */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            AI Autonomy Reauthorization Leases (Clause N16.43)
          </h3>
          <span className="text-xs text-slate-400">90-Day Renewal Cycle</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2.5 font-semibold">Agent ID</th>
                <th className="p-2.5 font-semibold">Tenant Scope</th>
                <th className="p-2.5 font-semibold">Autonomy Level</th>
                <th className="p-2.5 font-semibold">Granted Date</th>
                <th className="p-2.5 font-semibold">Expires At</th>
                <th className="p-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {agentLeases.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-mono text-cyan-300 font-medium">{l.agentId}</td>
                  <td className="p-2.5 text-slate-300">{l.tenantId}</td>
                  <td className="p-2.5 font-mono text-indigo-300">{l.autonomyClass}</td>
                  <td className="p-2.5 text-slate-400">{l.grantedAt}</td>
                  <td className="p-2.5 font-mono text-amber-400 font-semibold">{l.expiresAt}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 11 Enterprise Risk Categories Matrix */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          11 Enterprise Risk Categories (Clause N16.157)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {riskCategories.map((r, idx) => (
            <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-lg space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-200">{r.cat}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    r.risk === 'LOW'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {r.risk} ({r.score})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Accountable: {r.owner}</p>
              <p className="text-[11px] text-slate-500 leading-tight">Mitigation: {r.mit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
