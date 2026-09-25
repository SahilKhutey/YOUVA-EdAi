'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { knowledgeApi } from '@/lib/api/knowledgeApi';
import { personalizationApi, PersonalizedRecommendation } from '@/lib/api/personalizationApi';
import { KnowledgeSearchResponse, KnowledgeObjectType } from '@/types/knowledge';
import { AdaptiveRecommendationCard } from '@/components/student/knowledge/AdaptiveRecommendationCard';

export default function StudentKnowledgeDiscoveryPage() {
  const [data, setData] = useState<KnowledgeSearchResponse | null>(null);
  const [recommendation, setRecommendation] = useState<PersonalizedRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      const res = await knowledgeApi.searchStudentKnowledge({
        query: searchQuery.trim() || undefined,
        type: selectedType !== 'ALL' ? selectedType : undefined,
        limit: 50,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load published knowledge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const rec = await personalizationApi.getNextRecommendation();
        setRecommendation(rec);
      } catch (err) {
        console.error('Failed to load personalized recommendation:', err);
      }
    };
    fetchRecommendation();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchKnowledge();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedType]);

  const items = data?.items || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Compass className="h-4 w-4" />
              Student Learning Hub
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              Knowledge Exploration
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Discover verified curriculum concepts, master key objectives, and test your understanding.
            </p>
          </div>
        </div>

        {/* Adaptive Personalized Recommendation */}
        {recommendation && (
          <AdaptiveRecommendationCard
            recommendation={recommendation}
            onDismiss={() => setRecommendation(null)}
          />
        )}

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, topics, formulas, or keywords..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'CONCEPT', 'LESSON', 'TOPIC', 'ACTIVITY', 'ASSESSMENT'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition ${
                  selectedType === t
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {t === 'ALL' ? 'All Knowledge' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Knowledge Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              Loading available knowledge...
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
              No published knowledge found
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search query or type filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {item.type}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      v{item.version}
                    </span>
                  </div>

                  <Link
                    href={`/student/knowledge/${item.id}`}
                    className="block font-bold text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400 text-lg leading-snug"
                  >
                    {item.title}
                  </Link>

                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Objectives Summary */}
                  {item.learningObjectives && item.learningObjectives.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Objectives:
                      </div>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {item.learningObjectives.slice(0, 2).map((obj, i) => (
                          <li key={i} className="flex items-start gap-1.5 line-clamp-1">
                            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <Link
                    href={`/student/knowledge/${item.id}`}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Overview
                  </Link>

                  <Link
                    href={`/student/knowledge/${item.id}/learn`}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 text-center text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <span>Learn</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
