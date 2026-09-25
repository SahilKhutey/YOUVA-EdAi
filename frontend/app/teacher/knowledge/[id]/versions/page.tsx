'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, History, Loader2, BookOpen } from 'lucide-react';
import { knowledgeApi } from '../../../../../lib/api/knowledgeApi';
import { KnowledgeObjectItem, KnowledgeVersionItem } from '../../../../../types/knowledge';
import { VersionHistory } from '../../../../../components/teacher/knowledge/VersionHistory';

export default function DedicatedVersionsPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<KnowledgeObjectItem | null>(null);
  const [versions, setVersions] = useState<KnowledgeVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [obj, vers] = await Promise.all([
          knowledgeApi.getTeacherKnowledgeDetail(id),
          knowledgeApi.getVersions(id),
        ]);
        setItem(obj);
        setVersions(vers);
      } catch (err) {
        console.error('Failed to load version history:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      load();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Loading Version Audit Trail...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold">Knowledge object not found</h2>
        <Link href="/teacher/knowledge" className="mt-4 inline-block text-indigo-600">
          Return to Knowledge Library
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <Link
            href={`/teacher/knowledge/${id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <History className="h-3.5 w-3.5" />
            Version Immutability & Audit Log
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-3.5 w-3.5" />
              {item.type}
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {item.title} — Revision Timeline
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Published versions are frozen to preserve the historical integrity of student completion records.
            </p>
          </div>

          <VersionHistory versions={versions} currentVersion={item.currentVersion} />
        </div>
      </div>
    </div>
  );
}
