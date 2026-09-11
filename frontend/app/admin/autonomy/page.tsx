'use client';

import React, { useState } from 'react';

interface Capability {
  id: string;
  name: string;
  version: string;
  status: 'ACTIVE' | 'DISABLED' | 'ROLLED_BACK';
  risk: 'AUTO_LOW_RISK' | 'HUMAN_APPROVAL' | 'BLOCKED';
  maxStep: number;
}

interface DriftMetric {
  name: string;
  baseline: number;
  current: number;
  driftPercent: number;
  status: 'HEALTHY' | 'WARNING' | 'BREACHED';
}

export default function AutonomousGovernanceTerminal() {
  const [capabilities, setCapabilities] = useState<Capability[]>([
    {
      id: 'CAP-001',
      name: 'Adaptive Hint Disclosure Tiering',
      version: 'v1.2',
      status: 'ACTIVE',
      risk: 'AUTO_LOW_RISK',
      maxStep: 1.0,
    },
    {
      id: 'CAP-002',
      name: 'Adaptive Practice Difficulty Pacing',
      version: 'v1.0',
      status: 'ACTIVE',
      risk: 'AUTO_LOW_RISK',
      maxStep: 1.0,
    },
    {
      id: 'CAP-003',
      name: 'Autonomous Mastery Certification',
      version: 'v0.0',
      status: 'DISABLED',
      risk: 'BLOCKED',
      maxStep: 0.0,
    },
  ]);

  const [circuitBreakerState, setCircuitBreakerState] = useState<'CLOSED' | 'TRIPPED_ROLLBACK'>('CLOSED');
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<DriftMetric[]>([
    { name: 'Pedagogical Accuracy', baseline: 0.92, current: 0.91, driftPercent: 1.09, status: 'HEALTHY' },
    { name: 'Safety Attestation Score', baseline: 0.99, current: 0.985, driftPercent: 0.51, status: 'HEALTHY' },
    { name: 'Teacher Agreement Rate', baseline: 0.95, current: 0.94, driftPercent: 1.05, status: 'HEALTHY' },
    { name: 'Cognitive Bypass Rate', baseline: 0.003, current: 0.0032, driftPercent: 6.67, status: 'HEALTHY' },
  ]);

  const handleSimulateDriftAttack = () => {
    // Simulate a 6% safety drop breaching the 5% threshold
    setMetrics((prev) =>
      prev.map((m) =>
        m.name.includes('Safety')
          ? { ...m, current: 0.92, driftPercent: 7.07, status: 'BREACHED' }
          : m
      )
    );
    setCircuitBreakerState('TRIPPED_ROLLBACK');
    setCapabilities((prev) =>
      prev.map((c) =>
        c.id === 'CAP-001'
          ? { ...c, version: 'v1.0 (Rollback)', status: 'ROLLED_BACK' }
          : c
      )
    );
    setActionAlert(
      '[CIRCUIT BREAKER TRIPPED] 5% safety drift threshold breached! CAP-001 automatically rolled back from v1.2 to v1.0. Reverted to validated deterministic baseline.'
    );
  };

  const handleResetCircuitBreaker = () => {
    setMetrics([
      { name: 'Pedagogical Accuracy', baseline: 0.92, current: 0.91, driftPercent: 1.09, status: 'HEALTHY' },
      { name: 'Safety Attestation Score', baseline: 0.99, current: 0.985, driftPercent: 0.51, status: 'HEALTHY' },
      { name: 'Teacher Agreement Rate', baseline: 0.95, current: 0.94, driftPercent: 1.05, status: 'HEALTHY' },
      { name: 'Cognitive Bypass Rate', baseline: 0.003, current: 0.0032, driftPercent: 6.67, status: 'HEALTHY' },
    ]);
    setCircuitBreakerState('CLOSED');
    setCapabilities((prev) =>
      prev.map((c) =>
        c.id === 'CAP-001'
          ? { ...c, version: 'v1.2', status: 'ACTIVE' }
          : c
      )
    );
    setActionAlert('[CIRCUIT BREAKER RESET] Telemetry normalized. Baseline re-established.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Autonomous AI Governance Terminal
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 8 Active
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Bounded Autonomy Enforcement, 5% Drift Rollback Circuit Breakers & FinOps Multi-Tier Token Caps
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs">
            <div>
              <span className="text-slate-500 block">Circuit Breaker</span>
              <span
                className={`font-semibold font-mono ${
                  circuitBreakerState === 'CLOSED' ? 'text-emerald-400' : 'text-red-400 animate-pulse'
                }`}
              >
                {circuitBreakerState}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 block">Safety Dispatch</span>
              <span className="font-semibold text-emerald-400">100% OPERATIONAL (ISOLATED)</span>
            </div>
          </div>
        </header>

        {/* Action Flash Alert */}
        {actionAlert && (
          <div className="p-4 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-sm flex items-center justify-between">
            <span>{actionAlert}</span>
            <button
              onClick={() => setActionAlert(null)}
              className="text-xs text-indigo-400 hover:text-indigo-100 underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Cards: Autonomy Principles & FinOps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Governance Invariant Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Permanent Human-Only Invariants
            </h2>
            <div className="text-sm font-semibold text-white">4 Inviolable Boundaries</div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-mono font-bold">X</span>
                <span>Mastery Certification (Human Teachers Only)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-mono font-bold">X</span>
                <span>DPDP / Parental Consent Modifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-mono font-bold">X</span>
                <span>Child Safeguarding Incident Closure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-mono font-bold">X</span>
                <span>User Role & RBAC Elevation</span>
              </div>
            </div>
          </div>

          {/* FinOps Spending Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                FinOps Token Budget
              </h2>
              <span className="text-xs font-semibold text-emerald-400 font-mono">14.2% Used</span>
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              71,240 <span className="text-xs font-normal text-slate-400">/ 500,000 monthly</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '14.2%' }} />
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Session Cap: 4,000 tokens</span>
              <span className="text-emerald-400">Loop Killer: Active (Max 5)</span>
            </div>
          </div>

          {/* Multi-Provider Gateway Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              LLM Provider Gateway
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Primary (Gemini-Pro):</span>
                <span className="text-emerald-400 font-mono">ONLINE (ACTIVE)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Secondary (Claude/Local):</span>
                <span className="text-cyan-400 font-mono">STANDBY (HEALTHY)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Deterministic Curriculum:</span>
                <span className="text-emerald-400 font-mono">PRE-CACHED (READY)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5% Model Drift & Circuit Breaker Monitor */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Model Drift & 5% Circuit Breaker Live Monitor</span>
                <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Telemetry Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates live telemetry against certified baselines. Any degradation exceeding 5% triggers immediate automated rollback.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSimulateDriftAttack}
                className="px-3 py-1.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold transition"
              >
                Simulate 5% Drift Attack
              </button>
              <button
                onClick={handleResetCircuitBreaker}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Reset Breaker
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div
                key={m.name}
                className={`p-4 rounded-lg border text-xs space-y-2 ${
                  m.status === 'BREACHED'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300'
                }`}
              >
                <div className="text-slate-400 font-semibold">{m.name}</div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-bold font-mono text-white">
                    {(m.current * 100).toFixed(1)}%
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Base: {(m.baseline * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800/60">
                  <span>Drift: {m.driftPercent.toFixed(2)}%</span>
                  <span
                    className={`font-semibold font-mono ${
                      m.status === 'BREACHED' ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Registered Capabilities Catalog */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Autonomous Capabilities Catalog</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every active capability operates within explicit parameterized bounds.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {capabilities.filter((c) => c.status === 'ACTIVE').length} Active / {capabilities.length} Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3">Capability ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                  <th className="py-2.5 px-3">Max Step Bound</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {capabilities.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-cyan-400 font-bold">{c.id}</td>
                    <td className="py-3 px-3 text-white font-sans font-semibold">{c.name}</td>
                    <td className="py-3 px-3 text-slate-300">{c.version}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          c.risk === 'AUTO_LOW_RISK'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {c.risk}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">+/- {c.maxStep} step</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : c.status === 'ROLLED_BACK'
                            ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
