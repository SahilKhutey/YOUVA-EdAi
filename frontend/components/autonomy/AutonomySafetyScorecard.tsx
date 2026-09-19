"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Activity,
  Layers,
  Power,
  Lock,
} from "lucide-react";

export function AutonomySafetyScorecard() {
  const [globalKillSwitch, setGlobalKillSwitch] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  // Invariant metrics (Clause N15.110 - N15.111)
  const invariants = [
    {
      id: "INV-01",
      name: "Unauthorized Action Rate",
      target: "0.0%",
      measured: "0.00%",
      status: "PASS",
      clause: "N15.111",
    },
    {
      id: "INV-02",
      name: "Consequential Actions Bypassed",
      target: "0",
      measured: "0",
      status: "PASS",
      clause: "N15.6",
    },
    {
      id: "INV-03",
      name: "Cross-Tenant Leakage Events",
      target: "0",
      measured: "0",
      status: "PASS",
      clause: "N15.18",
    },
    {
      id: "INV-04",
      name: "Safety Incidents Resolved by AI",
      target: "0",
      measured: "0",
      status: "PASS",
      clause: "N15.45",
    },
    {
      id: "INV-05",
      name: "Mastery Truth Direct AI Rewrites",
      target: "0",
      measured: "0",
      status: "PASS",
      clause: "N15.28",
    },
    {
      id: "INV-06",
      name: "Audit Ledger Loss Events",
      target: "0",
      measured: "0",
      status: "PASS",
      clause: "N15.78",
    },
  ];

  const handleToggleKillSwitch = () => {
    if (!globalKillSwitch) {
      setConfirmModal(true);
    } else {
      setGlobalKillSwitch(false);
    }
  };

  const confirmActivateKillSwitch = () => {
    setGlobalKillSwitch(true);
    setConfirmModal(false);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Autonomy Safety Scorecard &amp; Kill Switches</h2>
            <p className="text-sm font-medium text-slate-500">
              Clause N15.110 Formal Scorecard • Hard Safety Invariants • Emergency Zero-Downtime Revocation
            </p>
          </div>
        </div>

        {/* Designation Badge */}
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-300 px-4 py-1.5 text-xs font-black text-emerald-900 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>DESIGNATION: CONTROLLED AUTONOMY VALIDATED</span>
        </div>
      </div>

      {/* Emergency Kill Switch Alert Bar */}
      <div
        className={`rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4 transition-all ${
          globalKillSwitch
            ? "border-red-500 bg-red-600 text-white shadow-lg"
            : "border-slate-200 bg-slate-900 text-slate-100"
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              globalKillSwitch ? "bg-white text-red-600" : "bg-red-500/20 text-red-400"
            }`}
          >
            <Power className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-sm">
              {globalKillSwitch
                ? "GLOBAL AUTONOMY KILL SWITCH ACTIVE"
                : "Global Autonomous Execution Kill Switch"}
            </h3>
            <p className="text-xs opacity-80 mt-0.5">
              {globalKillSwitch
                ? "All AI execution suspended platform-wide. System operating in 100% deterministic fallback mode."
                : "Emergency stop: Disables all autonomous actions instantly while preserving auth, teacher, and safety workflows."}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleKillSwitch}
          className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-md ${
            globalKillSwitch
              ? "bg-white text-red-700 hover:bg-slate-100"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {globalKillSwitch ? "Deactivate Emergency Stop" : "Activate Global Kill Switch"}
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertOctagon className="h-7 w-7" />
              <h3 className="text-lg font-bold text-slate-900">Confirm Global Kill Switch</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action will immediately halt all autonomous agent execution across every active tenant. All recommendations and bounded actions will revert to deterministic human-only review.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmActivateKillSwitch}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow"
              >
                Yes, Emergency Halt Autonomy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6 Hard Invariants Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-slate-500" />
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Autonomy Invariant Compliance Matrix (6 Hard SLOs)
          </h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {invariants.map((inv) => (
            <div
              key={inv.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1"
            >
              <div className="flex justify-between items-center text-2xs">
                <span className="font-mono font-bold text-slate-400">
                  {inv.id} • Clause {inv.clause}
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {inv.status}
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900">{inv.name}</div>
              <div className="flex justify-between text-2xs font-mono pt-1 text-slate-500">
                <span>Target: {inv.target}</span>
                <span className="font-bold text-slate-800">Measured: {inv.measured}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blast Radius Architecture */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-4 w-4 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Autonomous Blast Radius Boundaries (Clause N15.55)
          </h3>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          Autonomy starts with the smallest possible scope and cannot escalate blast radius without human authorization:
        </p>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="rounded-lg bg-emerald-100 border border-emerald-300 px-3 py-1.5 text-emerald-800 font-bold">
            1. Single Learner (Permitted A3)
          </div>
          <span className="text-slate-400">&rarr;</span>
          <div className="rounded-lg bg-indigo-100 border border-indigo-300 px-3 py-1.5 text-indigo-800 font-bold">
            2. Single Classroom (Educator Monitored)
          </div>
          <span className="text-slate-400">&rarr;</span>
          <div className="rounded-lg bg-amber-100 border border-amber-300 px-3 py-1.5 text-amber-800 font-bold">
            3. Single Tenant (Strict Quota)
          </div>
          <span className="text-slate-400">&rarr;</span>
          <div className="rounded-lg bg-red-100 border border-red-300 px-3 py-1.5 text-red-800 font-bold flex items-center gap-1">
            <Lock className="h-3 w-3" />
            4. Cross-Tenant (Barred A5)
          </div>
        </div>
      </div>
    </div>
  );
}
