'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Loader2, RefreshCw, Network } from 'lucide-react';
import { knowledgeApi } from '../../../lib/api/knowledgeApi';
import {
  KnowledgeObjectItem,
  KnowledgeStatus,
  TeacherDashboardStats,
} from '../../../types/knowledge';
import { KnowledgeCard } from '../../../components/teacher/knowledge/KnowledgeCard';
import { KnowledgeFilters } from '../../../components/teacher/knowledge/KnowledgeFilters';
import { GraphHealthModal } from '../../../components/teacher/knowledge/GraphHealthModal';

export default function KnowledgeLibraryPage() {
  const [items, setItems] = useState<KnowledgeObjectItem[]>([]);
  const [stats, setStats] = useState<TeacherDashboardStats | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<KnowledgeStatus | 'ALL'>('ALL');
  const [isGraphHealthOpen, setIsGraphHealthOpen] = useState(false);

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const data = await knowledgeApi.getTeacherKnowledge();
      setItems(data.items || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load teacher knowledge library:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-indigo-600" />
              Teacher Knowledge Studio
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create, structure, version, and govern curriculum knowledge for your students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsGraphHealthOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              title="Inspect knowledge graph health & governance"
            >
              <Network className="h-3.5 w-3.5 text-indigo-600" />
              Graph Health
            </button>
            <button
              type="button"
              onClick={fetchKnowledge}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              title="Refresh library"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/teacher/knowledge/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Create Knowledge
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <KnowledgeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          stats={stats}
        />

        {/* Loading / Content Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              Loading your knowledge library...
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              No knowledge objects found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              {searchQuery
                ? `No items match "${searchQuery}". Try adjusting your search query or filter.`
                : 'Get started by creating your first curriculum concept, lesson, or activity.'}
            </p>
            <Link
              href="/teacher/knowledge/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Create First Object
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <KnowledgeCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <GraphHealthModal
        isOpen={isGraphHealthOpen}
        onClose={() => setIsGraphHealthOpen(false)}
      />
    </div>
  );
}
