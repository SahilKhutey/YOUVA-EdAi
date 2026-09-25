'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Award,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { PersonalizedRecommendation } from '@/lib/api/personalizationApi';

interface AdaptiveRecommendationCardProps {
  recommendation: PersonalizedRecommendation;
  onDismiss?: () => void;
}

export const AdaptiveRecommendationCard: React.FC<AdaptiveRecommendationCardProps> = ({
  recommendation,
  onDismiss,
}) => {
  const { decisionType, targetKnowledge, reason, confidence } = recommendation;

  // Visual styling configuration by decision type
  const config = {
    REMEDIATE: {
      badge: 'Foundational Support',
      title: 'Let’s strengthen this first',
      bgGradient:
        'from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 dark:border-amber-900/60 dark:from-amber-950/30',
      badgeBg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
      icon: <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    REVIEW: {
      badge: 'Spaced Retrieval',
      title: 'Time for a quick refresh',
      bgGradient:
        'from-blue-500/10 via-blue-500/5 to-transparent border-blue-300 dark:border-blue-900/60 dark:from-blue-950/30',
      badgeBg: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200',
      icon: <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    PRACTICE: {
      badge: 'Targeted Practice',
      title: 'Solidify your understanding',
      bgGradient:
        'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-300 dark:border-emerald-900/60 dark:from-emerald-950/30',
      badgeBg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    ADVANCE: {
      badge: 'Next Step Unlocked',
      title: 'Ready for the next concept!',
      bgGradient:
        'from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-300 dark:border-indigo-900/60 dark:from-indigo-950/30',
      badgeBg: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200',
      icon: <ArrowRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    EXTEND: {
      badge: 'Challenge Extension',
      title: 'Take your learning deeper',
      bgGradient:
        'from-purple-500/10 via-purple-500/5 to-transparent border-purple-300 dark:border-purple-900/60 dark:from-purple-950/30',
      badgeBg: 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200',
      icon: <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    CONTINUE: {
      badge: 'Curriculum Progress',
      title: 'Recommended Next Lesson',
      bgGradient:
        'from-slate-500/10 via-slate-500/5 to-transparent border-slate-300 dark:border-slate-800 dark:from-slate-900/30',
      badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      icon: <BookOpen className="h-5 w-5 text-slate-600 dark:text-slate-400" />,
      btnBg: 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700',
    },
  }[decisionType];

  return (
    <div
      className={`rounded-3xl border bg-gradient-to-br p-6 shadow-sm transition-all sm:p-8 ${config.bgGradient}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${config.badgeBg}`}
            >
              {config.icon}
              {config.badge}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Confidence: {Math.round(confidence * 100)}%
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {config.title}
          </h2>

          <div className="text-base font-bold text-slate-800 dark:text-slate-200">
            {targetKnowledge.title}{' '}
            <span className="text-xs font-normal text-slate-400 uppercase">
              ({targetKnowledge.type})
            </span>
          </div>

          <p className="max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {reason.message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 flex-row sm:flex-col gap-2.5 pt-2">
          <Link
            href={`/student/knowledge/${targetKnowledge.id}/learn`}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold shadow-sm transition hover:scale-[1.02] ${config.btnBg}`}
          >
            <span>Start Now</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/student/knowledge/${targetKnowledge.id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            View Concept
          </Link>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-center text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Dismiss for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
