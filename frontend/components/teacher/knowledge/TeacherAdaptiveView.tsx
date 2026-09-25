'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  AlertTriangle,
  Award,
  RotateCcw,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Check,
  Loader2,
} from 'lucide-react';
import { orchestrationApi, TeacherLearnerAdaptiveView } from '../../../lib/api/orchestrationApi';

interface TeacherAdaptiveViewProps {
  learnerId: string;
  learnerName?: string;
}

export const TeacherAdaptiveView: React.FC<TeacherAdaptiveViewProps> = ({
  learnerId,
  learnerName,
}) => {
  const [data, setData] = useState<TeacherLearnerAdaptiveView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Override form state
  const [overrideAction, setOverrideAction] = useState('FORCE_ADVANCE');
  const [overrideTargetId, setOverrideTargetId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [applying, setApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchView = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orchestrationApi.getTeacherLearnerView(learnerId);
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load adaptive status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchView();
  }, [learnerId]);

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);
    setSuccessMsg(null);
    try {
      await orchestrationApi.teacherOverride(
        learnerId,
        overrideAction,
        overrideTargetId || undefined,
        overrideReason || undefined,
      );
      setSuccessMsg('Teacher override applied successfully.');
      fetchView();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to apply override');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
        Loading learner adaptive profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        {error || 'Unable to load adaptive data.'}
      </div>
    );
  }

  const getInterventionBadge = (level: number) => {
    if (level >= 6) return { text: 'Level 6: Teacher Urgent', color: 'bg-red-100 text-red-800' };
    if (level === 5) return { text: 'Level 5: Prerequisite Remediation', color: 'bg-amber-100 text-amber-800' };
    if (level === 4) return { text: 'Level 4: Guided Practice', color: 'bg-orange-100 text-orange-800' };
    if (level === 3) return { text: 'Level 3: Explanation', color: 'bg-yellow-100 text-yellow-800' };
    if (level === 2) return { text: 'Level 2: Progressive Hint', color: 'bg-blue-100 text-blue-800' };
    if (level === 1) return { text: 'Level 1: Illustrative Example', color: 'bg-purple-100 text-purple-800' };
    return { text: 'Level 0: Normal Progression', color: 'bg-emerald-100 text-emerald-800' };
  };

  const badge = getInterventionBadge(data.interventionLevel);

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Adaptive Learning Trajectory
          </h2>
          <p className="text-xs text-slate-500">
            Learner: <strong className="text-slate-700 dark:text-slate-300">{learnerName || learnerId}</strong>
          </p>
        </div>

        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${badge.color}`}>
          {badge.text}
        </span>
      </div>

      {/* Current Recommended Action */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-950/40 dark:bg-indigo-950/20">
        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
          Current System Recommendation
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {data.currentAction}
          </span>
          <span className="rounded bg-indigo-200/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
            {data.reasonCode}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {data.reasonMessage}
        </p>

        {data.activeOverride && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            <strong>Active Teacher Override:</strong> {data.activeOverride.action}
            {data.activeOverride.reason && ` — "${data.activeOverride.reason}"`}
          </div>
        )}
      </div>

      {/* Recent Mastery Breakdown */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Recent Mastery Signals
        </h3>
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {data.recentMastery.length === 0 ? (
            <div className="p-3 text-xs text-slate-500">No recent mastery signals recorded.</div>
          ) : (
            data.recentMastery.map((m) => (
              <div key={m.knowledgeId} className="flex items-center justify-between p-3 text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{m.title}</div>
                  <div className="text-[11px] text-slate-500">{m.type} • Status: {m.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {(m.masteryLevel * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Confidence: {(m.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Teacher Override Form */}
      <form onSubmit={handleApplyOverride} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
          <Sliders className="h-4 w-4 text-indigo-500" />
          Apply Pedagogical Override
        </div>

        {successMsg && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Override Action
            </label>
            <select
              value={overrideAction}
              onChange={(e) => setOverrideAction(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="FORCE_ADVANCE">Force Advance</option>
              <option value="ASSIGN_REMEDIATION">Assign Remediation</option>
              <option value="REQUIRE_REVIEW">Require Spaced Review</option>
              <option value="LOCK_CONTENT">Lock to Practice</option>
              <option value="PAUSE_RECOMMENDATIONS">Pause Adaptive System</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Knowledge ID (Optional)
            </label>
            <input
              type="text"
              value={overrideTargetId}
              onChange={(e) => setOverrideTargetId(e.target.value)}
              placeholder="e.g. k-linear-equations"
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pedagogical Reason
            </label>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Approved acceleration after 1-on-1 discussion"
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={applying}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            <span>Apply Override</span>
          </button>
        </div>
      </form>
    </div>
  );
};
