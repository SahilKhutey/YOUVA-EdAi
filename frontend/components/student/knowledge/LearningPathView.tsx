'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Loader2,
  Lock,
} from 'lucide-react';
import { knowledgeApi } from '@/lib/api/knowledgeApi';
import { LearningPath, LearningPathNode, LearningPathReadiness } from '@/types/knowledge';

interface LearningPathViewProps {
  knowledgeId: string;
}

const readinessConfig: Record<
  LearningPathReadiness,
  { badge: string; bg: string; text: string; border: string; icon: React.ReactNode; message: string }
> = {
  READY: {
    badge: 'Ready to Learn',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    message: 'All prerequisite concepts are mastered. You have the full foundation for this lesson!',
  },
  PARTIALLY_READY: {
    badge: 'Refresh Recommended',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <RotateCcw className="h-4 w-4 text-amber-600" />,
    message: 'You have some familiarity with prerequisites, but a quick review will help you succeed.',
  },
  NOT_READY: {
    badge: 'Prerequisites Required',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
    message: 'Important prerequisite gaps detected. Strengthening foundational concepts is strongly advised.',
  },
};

export const LearningPathView: React.FC<LearningPathViewProps> = ({ knowledgeId }) => {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!knowledgeId) return;
    const fetchPath = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await knowledgeApi.getLearningPath(knowledgeId);
        setPath(data);
      } catch (err: any) {
        setError('Unable to calculate learning path.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPath();
  }, [knowledgeId]);

  if (isLoading) {
    return (
      <div className="flex h-36 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          Calculating curriculum learning path & readiness...
        </div>
      </div>
    );
  }

  if (error || !path || path.nodes.length === 0) {
    return null;
  }

  const readiness = readinessConfig[path.readiness];

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Curriculum Learning Path
          </h3>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${readiness.bg} ${readiness.text} ${readiness.border}`}
        >
          {readiness.icon}
          <span>{readiness.badge}</span>
        </div>
      </div>

      {/* Readiness Message */}
      <div className={`rounded-xl border p-3 text-xs leading-relaxed ${readiness.bg} ${readiness.text} ${readiness.border}`}>
        {readiness.message}
      </div>

      {/* Step Sequence */}
      <div className="space-y-3 pt-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Concept Navigation Sequence
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {path.nodes.map((node) => {
            const isCurrent = node.role === 'CURRENT';
            const isRemediation = node.role === 'REMEDIATION';
            const isNext = node.role === 'NEXT' || node.role === 'EXTENSION';
            const masteryPct = Math.round((node.mastery ?? 0) * 100);

            return (
              <div key={node.knowledgeId} className="relative group">
                {/* Node Bullet Icon */}
                <div
                  className={`absolute -left-6 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-white dark:bg-slate-900 transition ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                      : isRemediation
                        ? 'border-rose-500 bg-rose-50 text-rose-600'
                        : isNext
                          ? 'border-slate-300 text-slate-400'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {isCurrent ? (
                    <Play className="h-2.5 w-2.5 fill-white" />
                  ) : isRemediation ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : isNext ? (
                    <ArrowRight className="h-2.5 w-2.5" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                </div>

                {/* Node Card */}
                <div
                  className={`rounded-2xl border p-4 transition ${
                    isCurrent
                      ? 'border-indigo-200 bg-indigo-50/50 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/20'
                      : isRemediation
                        ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/10'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800/80 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isCurrent
                              ? 'bg-indigo-600 text-white'
                              : isRemediation
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : isNext
                                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isCurrent
                            ? 'Current Target'
                            : isRemediation
                              ? 'Foundational Review'
                              : isNext
                                ? 'Unlocks Next'
                                : 'Prerequisite'}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                          {node.type}
                        </span>
                      </div>

                      <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                        {node.title}
                      </h4>

                      {node.reason && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {node.reason}
                        </p>
                      )}
                    </div>

                    {/* Mastery & Action */}
                    <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
                      {node.mastery !== undefined && (
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {masteryPct}%
                          </div>
                          <div className="text-[10px] text-slate-400">Mastery</div>
                        </div>
                      )}

                      {isCurrent ? (
                        <Link
                          href={`/student/knowledge/${node.knowledgeId}/learn`}
                          className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                        >
                          <span>Learn</span>
                          <Play className="h-3 w-3 fill-white" />
                        </Link>
                      ) : isRemediation ? (
                        <Link
                          href={`/student/knowledge/${node.knowledgeId}/learn`}
                          className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                        >
                          <span>Review</span>
                          <RotateCcw className="h-3 w-3" />
                        </Link>
                      ) : (
                        <Link
                          href={`/student/knowledge/${node.knowledgeId}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <span>View</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
