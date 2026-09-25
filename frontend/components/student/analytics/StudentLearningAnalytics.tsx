'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Clock,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  Activity,
  Loader2,
  Calendar,
} from 'lucide-react';
import { analyticsApi, LearnerAnalyticsOverview } from '../../../lib/api/analyticsApi';

export const StudentLearningAnalytics: React.FC = () => {
  const [data, setData] = useState<LearnerAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getLearnerOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load learning analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
        Loading your learning intelligence...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        {error || 'Unable to load analytics data.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Learning Progress & Evidence Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective-verified mastery derived from your active learning evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Engine: {data.calculationVersion}
          </span>
          <button
            onClick={fetchAnalytics}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Refresh analytics"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mastery KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Mastered */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-950/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Mastered</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {data.masteredKnowledgeCount}
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Concepts verified</span>
        </div>

        {/* Developing */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-950/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Developing</span>
            <BookOpen className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {data.developingKnowledgeCount}
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">In active practice</span>
        </div>

        {/* Review Due */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-950/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Review Due</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {data.reviewDueCount}
          </div>
          <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Spaced repetition</span>
        </div>

        {/* Remediation */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-950/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Needs Support</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {data.remediationCount}
          </div>
          <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">Targeted remediation</span>
        </div>
      </div>

      {/* Objective Progress Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
          <span>Overall Objective Attainment</span>
          <span>{(data.objectiveProgress * 100).toFixed(0)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, data.objectiveProgress * 100))}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Represents the mean mastery level across all {data.activeKnowledgeCount} active knowledge concepts.
        </p>
      </div>

      {/* Activity vs Mastery Separation Card */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Activity (Effort) vs. Mastery (Attainment) Separation
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-[11px] font-semibold text-slate-500">Learning Sessions</div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {data.activitySummary.totalSessions}
            </div>
            <div className="text-[10px] text-slate-400">Total sessions initiated</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-[11px] font-semibold text-slate-500">Practice Attempts</div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {data.activitySummary.totalAttempts}
            </div>
            <div className="text-[10px] text-slate-400">Evidence records logged</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-[11px] font-semibold text-slate-500">Support Requests</div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {data.activitySummary.totalHintsRequested}
            </div>
            <div className="text-[10px] text-slate-400">Hints utilized</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <p className="font-semibold text-indigo-700 dark:text-indigo-400 mb-0.5">
            Architectural Principle: Activity ≠ Mastery
          </p>
          <p className="text-[11px] text-slate-500">
            High participation and time spent reflect engagement, but mastery updates only when demonstrated
            evidence shows high accuracy and confidence without excessive scaffolding.
          </p>
        </div>
      </div>

      {/* 7-Day Evidence Accuracy Trend */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-400" />
          Recent Evidence Accuracy (Last 7 Active Days)
        </h3>

        {data.accuracyTrend.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No recent practice evidence logged yet.</p>
        ) : (
          <div className="space-y-3">
            {data.accuracyTrend.map((t) => (
              <div key={t.date} className="flex items-center gap-4 text-xs">
                <span className="w-24 text-slate-500 shrink-0">{t.date}</span>
                <div className="flex-1 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      t.accuracy >= 0.8
                        ? 'bg-emerald-500'
                        : t.accuracy >= 0.6
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.round(t.accuracy * 100)}%` }}
                  />
                </div>
                <span className="w-12 text-right font-bold text-slate-800 dark:text-slate-200">
                  {(t.accuracy * 100).toFixed(0)}%
                </span>
                <span className="w-16 text-right text-[10px] text-slate-400">
                  {t.attempts} {t.attempts === 1 ? 'attempt' : 'attempts'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
