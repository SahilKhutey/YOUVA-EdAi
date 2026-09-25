'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileEdit,
  History,
  Eye,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { KnowledgeObjectItem, KnowledgeStatus } from '../../../types/knowledge';
import { TeacherKnowledgeAnalyticsModal } from './TeacherKnowledgeAnalyticsModal';

interface KnowledgeCardProps {
  item: KnowledgeObjectItem;
}

const statusBadgeStyles: Record<KnowledgeStatus, { bg: string; text: string; border: string }> = {
  DRAFT: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
  },
  IN_REVIEW: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
  },
  APPROVED: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30',
  },
  PUBLISHED: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
  },
  ARCHIVED: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-500/30',
  },
};

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ item }) => {
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const badgeStyle = statusBadgeStyles[item.status] || statusBadgeStyles.DRAFT;
  const objectivesCount = item.objectives?.length || 0;
  const tags = item.tags?.map((t) => t.tag) || [];

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
            {item.type}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            v{item.currentVersion}
          </span>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
        >
          {item.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-3">
        <Link
          href={`/teacher/knowledge/${item.id}/edit`}
          className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
        >
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
            {item.title}
          </h3>
        </Link>
        {item.description && (
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {objectivesCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
            <CheckCircle2 className="h-3 w-3" />
            {objectivesCount} {objectivesCount === 1 ? 'Objective' : 'Objectives'}
          </span>
        )}
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAnalyticsOpen(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title="View Learner Analytics & Mastery"
          >
            <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
            Analytics
          </button>
          <Link
            href={`/teacher/knowledge/${item.id}/preview`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title="Preview student view"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Link>
          <Link
            href={`/teacher/knowledge/${item.id}/versions`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title="Version history"
          >
            <History className="h-3.5 w-3.5" />
            v{item.currentVersion}
          </Link>
          <Link
            href={`/teacher/knowledge/${item.id}/edit`}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-900/60"
          >
            <FileEdit className="h-3.5 w-3.5" />
            Edit
          </Link>
        </div>
      </div>

      {isAnalyticsOpen && (
        <TeacherKnowledgeAnalyticsModal
          knowledgeId={item.id}
          knowledgeTitle={item.title}
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
        />
      )}
    </div>
  );
};
