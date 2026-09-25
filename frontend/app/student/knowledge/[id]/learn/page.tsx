'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { knowledgeApi } from '@/lib/api/knowledgeApi';
import {
  StudentKnowledgeDetail,
  KnowledgeLearningSessionItem,
} from '@/types/knowledge';
import { KnowledgePlayer } from '@/components/student/knowledge/KnowledgePlayer';

export default function StudentLearnPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [knowledge, setKnowledge] = useState<StudentKnowledgeDetail | null>(null);
  const [session, setSession] = useState<KnowledgeLearningSessionItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const k = await knowledgeApi.getStudentKnowledge(id);
        if (!isMounted) return;
        setKnowledge(k);

        // Start or resume session
        const s = await knowledgeApi.startSession(id, {
          knowledgeVersionId: k.knowledgeVersionId,
        });
        if (!isMounted) return;
        setSession(s);
      } catch (err: any) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message || 'Failed to initialize learning session for this concept.',
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Preparing your interactive learning session...
        </div>
      </div>
    );
  }

  if (error || !knowledge) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">
            {error || 'Unable to load lesson'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            This lesson may not be published yet or your session could not be established.
          </p>
          <Link
            href="/student/knowledge"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Knowledge Hub
          </Link>
        </div>
      </div>
    );
  }

  return <KnowledgePlayer knowledge={knowledge} initialSession={session || undefined} />;
}
