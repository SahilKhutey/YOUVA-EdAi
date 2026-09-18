"use client";

import React, { useState } from 'react';
import {
  Activity,
  Mic,
  Eye,
  Sparkles,
  ShieldAlert,
  DollarSign,
  Clock,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export interface MultimodalMetricsSummary {
  voiceSuccessRatePct: number;
  visionSuccessRatePct: number;
  generationSuccessRatePct: number;
  moderationRejectionRatePct: number;
  avgSttLatencyMs: number;
  avgTtsLatencyMs: number;
  avgVisionLatencyMs: number;
  avgGenerationLatencyMs: number;
  fallbackRatePct: number;
  currentDailySpendUsd: number;
  dailySpendLimitUsd: number;
  cacheHitRatePct: number;
}

export interface MultimodalOperationsDashboardProps {
  metrics?: MultimodalMetricsSummary;
}

export const MultimodalOperationsDashboard: React.FC<MultimodalOperationsDashboardProps> = ({
  metrics = {
    voiceSuccessRatePct: 98.4,
    visionSuccessRatePct: 97.8,
    generationSuccessRatePct: 99.1,
    moderationRejectionRatePct: 1.2,
    avgSttLatencyMs: 310,
    avgTtsLatencyMs: 180,
    avgVisionLatencyMs: 420,
    avgGenerationLatencyMs: 840,
    fallbackRatePct: 2.1,
    currentDailySpendUsd: 12.45,
    dailySpendLimitUsd: 50.0,
    cacheHitRatePct: 41.5,
  },
}) => {
  const budgetUtilizationPct = Math.round((metrics.currentDailySpendUsd / metrics.dailySpendLimitUsd) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 text-slate-100 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wide">
            Operational Telemetry (N11.72)
          </span>
          <h2 className="text-2xl font-bold mt-2 text-white">Multimodal Operations & FinOps Dashboard</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time observability across speech, vision, media generation, safety moderation, and compute budgets.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span>All Modality Gateways Operational</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Voice Success */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Voice Success Rate</span>
            <Mic className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.voiceSuccessRatePct}%</div>
          <div className="text-xs text-slate-500">STT Latency: {metrics.avgSttLatencyMs}ms</div>
        </div>

        {/* Vision Success */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Vision OCR Accuracy</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.visionSuccessRatePct}%</div>
          <div className="text-xs text-slate-500">Vision Latency: {metrics.avgVisionLatencyMs}ms</div>
        </div>

        {/* Media Generation */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Generation Success</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.generationSuccessRatePct}%</div>
          <div className="text-xs text-slate-500">Cache Hits: {metrics.cacheHitRatePct}%</div>
        </div>

        {/* Moderation Rejections */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Moderation Reject Rate</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.moderationRejectionRatePct}%</div>
          <div className="text-xs text-emerald-400">Zero Critical Leaks</div>
        </div>
      </div>

      {/* FinOps Budget Bar (N11.45) */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 font-semibold text-white">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Tenant Media Spend & FinOps Ceiling</span>
          </div>
          <div className="text-xs text-slate-400">
            ${metrics.currentDailySpendUsd.toFixed(2)} / ${metrics.dailySpendLimitUsd.toFixed(2)} Daily Ceiling ({budgetUtilizationPct}%)
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetUtilizationPct > 80 ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Graceful text/cached fallback enabled at 100% spend</span>
          <span>Fallback Rate: {metrics.fallbackRatePct}%</span>
        </div>
      </div>

      {/* Latency Benchmarks Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block">Speech-to-Text</span>
          <span className="font-mono text-slate-200 font-semibold">{metrics.avgSttLatencyMs}ms</span>
        </div>
        <div>
          <span className="text-slate-500 block">Text-to-Speech</span>
          <span className="font-mono text-slate-200 font-semibold">{metrics.avgTtsLatencyMs}ms</span>
        </div>
        <div>
          <span className="text-slate-500 block">Vision OCR Analysis</span>
          <span className="font-mono text-slate-200 font-semibold">{metrics.avgVisionLatencyMs}ms</span>
        </div>
        <div>
          <span className="text-slate-500 block">Media Composition</span>
          <span className="font-mono text-slate-200 font-semibold">{metrics.avgGenerationLatencyMs}ms</span>
        </div>
      </div>
    </div>
  );
};
