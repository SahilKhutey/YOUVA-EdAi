'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Award,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { orchestrationApi, AdaptiveLearningAction, AdaptiveActionType } from '../../../lib/api/orchestrationApi';

interface AdaptiveNextBannerProps {
  currentKnowledgeId?: string;
  onActionSelect?: (action: AdaptiveLearningAction) => void;
}

export const AdaptiveNextBanner: React.FC<AdaptiveNextBannerProps> = ({
  currentKnowledgeId,
  onActionSelect,
}) => {
  const [action, setAction] = useState<AdaptiveLearningAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNext = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orchestrationApi.getNext(currentKnowledgeId);
      setAction(res);
      if (onActionSelect) {
        onActionSelect(res);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Could not load recommendation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNext();
  }, [currentKnowledgeId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 p-4 shadow-sm dark:border-indigo-950/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/20 animate-pulse">
        <div className="h-10 w-10 rounded-xl bg-indigo-200 dark:bg-indigo-900" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded bg-indigo-200 dark:bg-indigo-900" />
          <div className="h-3 w-72 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !action) {
    return null; // Gracefully degrade if no active recommendation
  }

  const getBadgeStyle = (actType: AdaptiveActionType) => {
    switch (actType) {
      case 'ADVANCE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';
      case 'REMEDIATE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200';
      case 'REVIEW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200';
      case 'TEACHER_INTERVENTION':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200';
      default:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200';
    }
  };

  const getActionIcon = (actType: AdaptiveActionType) => {
    switch (actType) {
      case 'ADVANCE':
        return <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'REMEDIATE':
        return <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'REVIEW':
        return <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'TEACHER_INTERVENTION':
        return <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Compass className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-5 shadow-sm dark:border-indigo-950/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left icon & text */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10">
            {getActionIcon(action.action)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${getBadgeStyle(
                  action.action,
                )}`}
              >
                {action.action.replace('_', ' ')}
              </span>
              {action.required && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  Required
                </span>
              )}
            </div>

            <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
              {action.targetTitle || 'Recommended Learning Step'}
            </h3>

            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              <strong className="font-semibold text-slate-800 dark:text-slate-200">Why?</strong>{' '}
              {action.reasonMessage}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 sm:shrink-0">
          <Link
            href={`/student/knowledge/${action.targetKnowledgeId}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500 hover:shadow"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
