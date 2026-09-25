'use client';

import React from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import Link from 'next/link';
import { KnowledgeStatus, TeacherDashboardStats } from '../../../types/knowledge';

interface KnowledgeFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: KnowledgeStatus | 'ALL';
  onStatusChange: (status: KnowledgeStatus | 'ALL') => void;
  stats?: TeacherDashboardStats;
}

export const KnowledgeFilters: React.FC<KnowledgeFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  stats,
}) => {
  const tabs: Array<{ id: KnowledgeStatus | 'ALL'; label: string; count?: number }> = [
    { id: 'ALL', label: 'All', count: stats?.total },
    { id: 'DRAFT', label: 'Drafts', count: stats?.drafts },
    { id: 'IN_REVIEW', label: 'In Review', count: stats?.inReview },
    { id: 'APPROVED', label: 'Approved', count: stats?.approved },
    { id: 'PUBLISHED', label: 'Published', count: stats?.published },
    { id: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search knowledge by title, topic, or tag..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <Link
          href="/teacher/knowledge/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Create Knowledge
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
