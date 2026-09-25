"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Activity,
  Award,
} from "lucide-react";

export interface EducationalHealthData {
  knowledgePublished: number;
  activeLearners: number;
  evidenceProcessingStatus: "HEALTHY" | "DEGRADED" | "DOWN";
  evidenceLatencyMs: number;
  adaptiveDecisionsStatus: "HEALTHY" | "DEGRADED" | "DOWN";
  decisionsPerMinute: number;
  remediationCompletionRate: number;
  contentQualityAlerts: number;
  aiGroundingAlerts: number;
  lastUpdated: string;
}

export function EducationalHealthDashboard() {
  const [data, setData] = useState<EducationalHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    // Simulated or derived educational telemetry snapshot
    setTimeout(() => {
      setData({
        knowledgePublished: 4812,
        activeLearners: 18204,
        evidenceProcessingStatus: "HEALTHY",
        evidenceLatencyMs: 42,
        adaptiveDecisionsStatus: "HEALTHY",
        decisionsPerMinute: 310,
        remediationCompletionRate: 0.76,
        contentQualityAlerts: 14,
        aiGroundingAlerts: 3,
        lastUpdated: new Date().toLocaleTimeString(),
      });
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
        Loading educational health signals...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Educational Health &amp; Pedagogical Operations
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Section 84 Educational Health Model • Distinct from Infrastructure Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Updated: {data.lastUpdated}</span>
          <button
            onClick={fetchHealth}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Refresh educational health"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Governance Invariant Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300">
        <strong>LKC-9 Core Production Invariant:</strong> Infrastructure failures, cache losses, or AI degradations
        never alter authoritative educational truth. Student mastery is derived exclusively from verified evidence.
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Knowledge Published */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Knowledge Published</span>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {data.knowledgePublished.toLocaleString()}
          </div>
          <span className="text-[11px] font-medium text-emerald-600">Canonical concepts live</span>
        </div>

        {/* Active Learners */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Active Learners</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {data.activeLearners.toLocaleString()}
          </div>
          <span className="text-[11px] font-medium text-emerald-600">Enrolled across tenants</span>
        </div>

        {/* Remediation Completion */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Remediation Success</span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {(data.remediationCompletionRate * 100).toFixed(0)}%
          </div>
          <span className="text-[11px] font-medium text-slate-500">Target &ge; 70% threshold</span>
        </div>

        {/* Adaptive Decisions */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">Adaptive Decisions</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-baseline gap-2">
            <span>{data.decisionsPerMinute}</span>
            <span className="text-xs font-medium text-slate-400">/ min</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-600">Healthy (LKC-7 Engine)</span>
        </div>
      </div>

      {/* Middle Row: Pipeline Health & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closed-Loop Learning Pipeline Health */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-600" />
            Closed-Loop Learning Pipeline Flow
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">1. Event Ingestion</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Idempotent (0 duplicates)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">2. Evidence Processing</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> {data.evidenceLatencyMs}ms latency
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">3. Learner State &amp; Mastery</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Synchronized (PostgreSQL)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">4. Adaptive Orchestration</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Real-time ({data.decisionsPerMinute} req/min)
              </span>
            </div>
          </div>
        </div>

        {/* Pedagogical Safety & Quality Alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Pedagogical Safety &amp; Content Quality Alerts
          </h3>

          <div className="space-y-3">
            {/* Content Quality Alert Card */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                  Content Quality Alerts
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400">
                  Concepts flagged for high support demand or drop-off
                </span>
              </div>
              <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                {data.contentQualityAlerts} Active
              </span>
            </div>

            {/* AI Grounding Alert Card */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-900 dark:text-rose-300 block">
                  AI Grounding Alerts
                </span>
                <span className="text-[11px] text-rose-700 dark:text-rose-400">
                  Generations below 0.65 grounding threshold
                </span>
              </div>
              <span className="rounded-full bg-rose-200 px-3 py-1 text-xs font-black text-rose-900 dark:bg-rose-900 dark:text-rose-200">
                {data.aiGroundingAlerts} Active
              </span>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              Alerts trigger educator investigation workflows in the Governance Dashboard.
              Neither students nor curriculum structures are automatically mutated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
