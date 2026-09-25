'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  TrendingUp,
  AlertTriangle,
  Award,
  BookOpen,
  RotateCcw,
  Users,
  Loader2,
} from 'lucide-react';
import {
  personalizationApi,
  TeacherKnowledgeAnalytics,
} from '@/lib/api/personalizationApi';

interface TeacherKnowledgeAnalyticsModalProps {
  knowledgeId: string;
  knowledgeTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherKnowledgeAnalyticsModal: React.FC<TeacherKnowledgeAnalyticsModalProps> = ({
  knowledgeId,
  knowledgeTitle,
  isOpen,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<TeacherKnowledgeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !knowledgeId) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await personalizationApi.getTeacherAnalytics(knowledgeId);
        setAnalytics(res);
      } catch (err) {
        console.error('Failed to load teacher knowledge analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isOpen, knowledgeId]);

  if (!isOpen) return null;

  const total = analytics?.totalStudentsEngaged || 0;
  const dist = analytics?.statusDistribution || {
    NOT_STARTED: 0,
    LEARNING: 0,
    STRUGGLING: 0,
    DEVELOPING: 0,
    MASTERED: 0,
    NEEDS_REVIEW: 0,
  };

  const getPercent = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              Learning Mastery & Intelligence
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Curriculum Concept
            </div>
            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">
              {knowledgeTitle}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                Aggregating student learning evidence...
              </div>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <Users className="h-4 w-4" />
                    Engaged
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                    {total}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                    Avg. Mastery
                  </div>
                  <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {Math.round((analytics?.averageMastery || 0) * 100)}%
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-center dark:border-rose-950/60 dark:bg-rose-950/20">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    Need Support
                  </div>
                  <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
                    {dist.STRUGGLING}
                  </div>
                </div>
              </div>

              {/* Mastery Distribution */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Class Mastery Distribution
                </div>

                <div className="space-y-2">
                  {/* Mastered */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-emerald-500" />
                        Mastered
                      </span>
                      <span>
                        {dist.MASTERED} ({getPercent(dist.MASTERED)}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${getPercent(dist.MASTERED)}%` }}
                      />
                    </div>
                  </div>

                  {/* Developing */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                        Developing / Progressing
                      </span>
                      <span>
                        {dist.DEVELOPING} ({getPercent(dist.DEVELOPING)}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${getPercent(dist.DEVELOPING)}%` }}
                      />
                    </div>
                  </div>

                  {/* Struggling */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                        Struggling (Remediation Triggered)
                      </span>
                      <span>
                        {dist.STRUGGLING} ({getPercent(dist.STRUGGLING)}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full bg-rose-500 transition-all"
                        style={{ width: `${getPercent(dist.STRUGGLING)}%` }}
                      />
                    </div>
                  </div>

                  {/* Needs Review */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5 text-blue-500" />
                        Needs Spaced Review
                      </span>
                      <span>
                        {dist.NEEDS_REVIEW} ({getPercent(dist.NEEDS_REVIEW)}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${getPercent(dist.NEEDS_REVIEW)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Pedagogical Insight */}
              {dist.STRUGGLING > 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
                  <span className="font-bold">Pedagogical Recommendation:</span> {dist.STRUGGLING} students are experiencing difficulty. Consider scheduling a live mini-lesson on prerequisite concepts or reviewing the worked examples in class.
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-100">
                  <span className="font-bold">Pedagogical Insight:</span> No active struggles detected! The majority of learners are progressing steadily or have achieved mastery.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
