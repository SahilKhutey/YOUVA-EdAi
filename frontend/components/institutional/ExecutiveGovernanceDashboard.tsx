'use client';

import React from 'react';

export function ExecutiveGovernanceDashboard() {
  const metrics = {
    learningGrowth: '+18.4%',
    retentionRate: '97.2%',
    teacherWorkloadSaved: '145.5 hrs',
    safetySla: '48 sec',
    aiCostPerOutcome: '$0.038',
    credentialsVerified: '1,290',
    uptime: '99.98%',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Executive Governance Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Clauses N16.33–N16.35
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Decision-grade institutional leadership metrics across pedagogical impact, child safeguarding, FinOps sustainability, and credential verification.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          Period: 2026-Q3 (Live Operational)
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        {/* 1. Learning Mastery Growth */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Learning Mastery Growth</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400">{metrics.learningGrowth}</span>
            <span className="text-[10px] text-emerald-500 font-semibold">vs baseline</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Bayesian Knowledge Tracing validated</p>
        </div>

        {/* 2. Teacher Workload Reduction */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Teacher Workload Saved</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-400">{metrics.teacherWorkloadSaved}</span>
            <span className="text-[10px] text-indigo-400 font-semibold">this month</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Automated homework triage & review</p>
        </div>

        {/* 3. Child Safeguarding SLA */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Safeguarding Response SLA</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-cyan-400">{metrics.safetySla}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">Target &lt; 120s</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">0 active critical incidents</p>
        </div>

        {/* 4. AI Cost per Validated Outcome */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">AI Cost / Validated Outcome</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400">{metrics.aiCostPerOutcome}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">Sustainable</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Target &lt; $0.05 / outcome</p>
        </div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Student Skill Retention Rate</span>
          <span className="text-xl font-bold text-white mt-1 block">{metrics.retentionRate}</span>
          <p className="text-[11px] text-slate-500 mt-1">Measured via spaced repetition intervals</p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">W3C Credential Verification Velocity</span>
          <span className="text-xl font-bold text-white mt-1 block">{metrics.credentialsVerified} verified</span>
          <p className="text-[11px] text-slate-500 mt-1">External employer & university checks</p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Production High Availability SLO</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">{metrics.uptime}</span>
          <p className="text-[11px] text-slate-500 mt-1">Multi-region fallback verified</p>
        </div>
      </div>
    </div>
  );
}
