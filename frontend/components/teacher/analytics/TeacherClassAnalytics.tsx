'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  AlertTriangle,
  Clock,
  RotateCcw,
  Download,
  Search,
  ShieldCheck,
  ChevronRight,
  X,
  Loader2,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  analyticsApi,
  TeacherClassAnalytics as ITeacherClassAnalytics,
  LearnerDrilldown,
} from '../../../lib/api/analyticsApi';

interface TeacherClassAnalyticsProps {
  classId: string;
  className?: string;
}

export const TeacherClassAnalytics: React.FC<TeacherClassAnalyticsProps> = ({
  classId,
  className,
}) => {
  const [data, setData] = useState<ITeacherClassAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drilldown state
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<LearnerDrilldown | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownError, setDrilldownError] = useState<string | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchClassAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getClassAnalytics(classId);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load class analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassAnalytics();
  }, [classId]);

  const handleOpenDrilldown = async (learnerId: string) => {
    setSelectedLearnerId(learnerId);
    setDrilldownLoading(true);
    setDrilldownError(null);
    try {
      const res = await analyticsApi.getLearnerDrilldown(learnerId);
      setDrilldownData(res);
    } catch (err: any) {
      setDrilldownError(
        err?.response?.data?.message || err?.message || 'Failed to load learner drilldown',
      );
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleCloseDrilldown = () => {
    setSelectedLearnerId(null);
    setDrilldownData(null);
    setDrilldownError(null);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportNotice(null);
    try {
      await analyticsApi.requestExport('CLASS_PROGRESS', classId, 'CSV');
      setExportNotice('Export requested successfully. Download will be generated.');
    } catch (err: any) {
      // Handles small-cohort protection suppression (HTTP 403)
      setExportNotice(
        err?.response?.data?.message ||
          'Export failed. Cohort size may be below privacy threshold (< 5) to prevent deanonymization.',
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
        Loading class educational intelligence...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        {error || 'Unable to load class analytics.'}
      </div>
    );
  }

  const totalCohort = data.totalStudents;
  const masteredPct = totalCohort > 0 ? (data.distribution.mastered / totalCohort) * 100 : 0;
  const developingPct = totalCohort > 0 ? (data.distribution.developing / totalCohort) * 100 : 0;
  const strugglingPct = totalCohort > 0 ? (data.distribution.struggling / totalCohort) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Class Learning Intelligence: {className || classId}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated pedagogical indicators derived from learner evidence and adaptive state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Export Report</span>
          </button>

          <button
            onClick={fetchClassAnalytics}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Refresh class analytics"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Students */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500">Cohort Size</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {data.totalStudents}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Enrolled learners</span>
        </div>

        {/* Average Mastery */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-950/40 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">Mean Mastery</span>
            <Award className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {(data.averageMastery * 100).toFixed(0)}%
          </div>
          <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium">Class-wide average</span>
        </div>

        {/* Review Due */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-950/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Spaced Reviews</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {data.reviewDueCount}
          </div>
          <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Due for review</span>
        </div>

        {/* Remediation */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-950/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Need Support</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {data.remediationCount}
          </div>
          <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">Active struggle signals</span>
        </div>
      </div>

      {/* Mastery Distribution Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
          Mastery Distribution
        </h3>
        <div className="h-4 w-full flex overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${masteredPct}%` }}
            title={`Mastered: ${data.distribution.mastered} (${masteredPct.toFixed(0)}%)`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{ width: `${developingPct}%` }}
            title={`Developing: ${data.distribution.developing} (${developingPct.toFixed(0)}%)`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${strugglingPct}%` }}
            title={`Struggling: ${data.distribution.struggling} (${strugglingPct.toFixed(0)}%)`}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Mastered ({data.distribution.mastered})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>Developing ({data.distribution.developing})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Struggling ({data.distribution.struggling})</span>
          </div>
        </div>
      </div>

      {/* Top Struggle Signals */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="h-4 w-4 text-rose-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Top Pedagogical Struggle Signals (Needs Teacher Attention)
          </h3>
        </div>

        {data.struggleSignals.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">No high-struggle concepts detected in this cohort.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.struggleSignals.map((sig) => (
              <div
                key={sig.knowledgeId}
                className="flex items-center justify-between py-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{sig.title}</div>
                  <div className="text-[11px] text-slate-500">ID: {sig.knowledgeId}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                      {sig.struggleCount} {sig.struggleCount === 1 ? 'learner' : 'learners'} struggling
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Avg Mastery: {(sig.averageMastery * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learner Drilldown Modal / Drawer */}
      {selectedLearnerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Purpose-Limited Learner Drilldown
                </h3>
              </div>
              <button
                onClick={handleCloseDrilldown}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Purpose-Limited Governance Warning */}
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              <strong>Governance Notice:</strong> Individual learner drilldown access is strictly logged and
              purpose-limited to pedagogical assistance. Automated institutional exports suppress small cohorts (&lt; 5).
            </div>

            {drilldownLoading ? (
              <div className="flex items-center justify-center p-8 text-xs text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
                Loading learner profile...
              </div>
            ) : drilldownError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {drilldownError}
              </div>
            ) : drilldownData ? (
              <div className="mt-4 space-y-4">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Learner: <strong className="text-slate-900 dark:text-slate-100">{drilldownData.name}</strong> ({drilldownData.email})
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {drilldownData.concepts.map((c) => (
                    <div key={c.knowledgeId} className="p-3 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{c.title}</div>
                        <div className="text-[11px] text-slate-500">
                          Status: {c.status} • Attempts: {c.attempts} • Hints: {c.totalHints}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {(c.masteryLevel * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Conf: {(c.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
