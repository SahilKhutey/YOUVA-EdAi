"use client";

import React, { useState } from "react";
import {
  Activity,
  ShieldAlert,
  Server,
  Database,
  Cpu,
  Zap,
  Power,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
} from "lucide-react";

export function ProductionOperationsDashboard() {
  const [globalAiKillSwitch, setGlobalAiKillSwitch] = useState(false);
  const [childVoiceKillSwitch, setChildVoiceKillSwitch] = useState(false);
  const [generativeMediaKillSwitch, setGenerativeMediaKillSwitch] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const slos = [
    { name: "Critical Learning Loop", target: "≥ 99.95%", current: "99.98%", status: "HEALTHY" },
    { name: "Learning State Persistence", target: "≥ 99.99%", current: "100.0%", status: "HEALTHY" },
    { name: "Normal API p95 Latency", target: "< 500 ms", current: "128 ms", status: "HEALTHY" },
    { name: "Mastery Integrity", target: "100%", current: "100%", status: "HEALTHY" },
  ];

  const handleToggleKillSwitch = (target: "GLOBAL" | "CHILD_VOICE" | "MEDIA") => {
    if (target === "GLOBAL") {
      const next = !globalAiKillSwitch;
      setGlobalAiKillSwitch(next);
      setActionNotice(
        next
          ? "GLOBAL AI KILL SWITCH ENGAGED: All AI endpoints operating in deterministic fallback mode."
          : "Global AI services resumed normal operation."
      );
    } else if (target === "CHILD_VOICE") {
      const next = !childVoiceKillSwitch;
      setChildVoiceKillSwitch(next);
      setActionNotice(
        next
          ? "CHILD VOICE KILL SWITCH ENGAGED: Early childhood tutors switched to tactile controls."
          : "Child voice tutor speech synthesis resumed."
      );
    } else if (target === "MEDIA") {
      const next = !generativeMediaKillSwitch;
      setGenerativeMediaKillSwitch(next);
      setActionNotice(
        next
          ? "GENERATIVE MEDIA KILL SWITCH ENGAGED: Serving only static vetted curriculum assets."
          : "Generative media generation pipeline resumed."
      );
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Production Operations &amp; SLO Center</h2>
            <p className="text-sm font-medium text-slate-500">
              Clause N14.43 Measurable SLOs • 3-Level Health Model • Production AI Kill Switches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-100/80 border border-emerald-300 px-3.5 py-1.5 text-xs font-black text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Platform Health: ALL SYSTEMS OPERATIONAL
        </div>
      </div>

      {actionNotice && (
        <div className="rounded-2xl bg-amber-100 border border-amber-300 p-4 text-xs font-bold text-amber-950 flex items-center justify-between animate-fade-in">
          <span>⚠️ {actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-amber-800 hover:text-amber-950">
            Dismiss
          </button>
        </div>
      )}

      {/* 4-SLO Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {slos.map((slo, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">{slo.name}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                {slo.status}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{slo.current}</span>
              <span className="text-xs font-medium text-slate-400">target {slo.target}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid: 3-Level Health & AI FinOps Budgeting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3-Level Health Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-600" />
            3-Level Production Health Matrix (Clause N14.46)
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800">Level 1: Liveness</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold">Process UP (0 restarts)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800">Level 2: Readiness</span>
              </div>
              <span className="font-mono text-emerald-700 font-bold">Serving Traffic Safely</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Level 3: Core Dependencies</span>
                </div>
                <span className="text-emerald-700">Healthy</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <span className="text-slate-600">• PostgreSQL: 3.2ms (Pool: 15)</span>
                <span className="text-slate-600">• Redis Cache: 0.8ms (Ephemeral)</span>
                <span className="text-slate-600">• AI Gateway: Gemini + Fallback</span>
                <span className="text-slate-600">• Outbox Queue: 0 backlog</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI FinOps Spend & Budgets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-600" />
              AI FinOps Spend &amp; Budget Caps (Clause N14.21 - N14.22)
            </h3>
            <span className="text-xs font-bold text-slate-500 font-mono">$460.75 / $2,250.00</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Platform AI Budget Consumption</span>
              <span>20.5% Used</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="bg-indigo-600 h-3 rounded-full" style={{ width: "20.5%" }} />
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Soft alert triggered at 80%. When hard cap is reached, AI calls gracefully degrade to cached/deterministic responses.
            </p>
          </div>

          {/* Unit Economics Box */}
          <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                Cost Per Validated Learning Outcome (N14.74)
              </span>
              <p className="text-base font-black text-amber-950 mt-0.5">$0.042 / outcome</p>
            </div>
            <span className="rounded-full bg-amber-200/80 px-2.5 py-1 text-xs font-black text-amber-900">
              EXCELLENT
            </span>
          </div>
        </div>
      </div>

      {/* Production AI Kill Switches (Clause N14.79 - N14.80) */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
            <Power className="h-4 w-4 text-rose-600" />
            Production AI Kill Switches (Controlled Circuit Breakers)
          </h3>
          <span className="text-xs font-bold text-rose-700">Immediate Non-Destructive Fallback</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Global AI Switch */}
          <div className="rounded-xl bg-white p-3.5 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Global AI Gateway</span>
              <span className="text-[11px] text-slate-500">
                {globalAiKillSwitch ? "KILL SWITCH ACTIVE" : "Normal Operation"}
              </span>
            </div>
            <button
              onClick={() => handleToggleKillSwitch("GLOBAL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                globalAiKillSwitch
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {globalAiKillSwitch ? "Active" : "Normal"}
            </button>
          </div>

          {/* Child Voice Switch */}
          <div className="rounded-xl bg-white p-3.5 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Child Voice Tutor</span>
              <span className="text-[11px] text-slate-500">
                {childVoiceKillSwitch ? "KILL SWITCH ACTIVE" : "Normal Operation"}
              </span>
            </div>
            <button
              onClick={() => handleToggleKillSwitch("CHILD_VOICE")}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                childVoiceKillSwitch
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {childVoiceKillSwitch ? "Active" : "Normal"}
            </button>
          </div>

          {/* Generative Media Switch */}
          <div className="rounded-xl bg-white p-3.5 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Generative Multimodal</span>
              <span className="text-[11px] text-slate-500">
                {generativeMediaKillSwitch ? "KILL SWITCH ACTIVE" : "Normal Operation"}
              </span>
            </div>
            <button
              onClick={() => handleToggleKillSwitch("MEDIA")}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                generativeMediaKillSwitch
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {generativeMediaKillSwitch ? "Active" : "Normal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
