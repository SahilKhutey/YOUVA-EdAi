'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Network,
  Play,
  Award,
  Sparkles,
  Layers,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { knowledgeApi } from '@/lib/api/knowledgeApi';
import { StudentKnowledgeDetail } from '@/types/knowledge';
import { LearningPathView } from '@/components/student/knowledge/LearningPathView';

export default function StudentKnowledgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [knowledge, setKnowledge] = useState<StudentKnowledgeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await knowledgeApi.getStudentKnowledge(id);
        setKnowledge(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Knowledge object not found or not published.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Loading concept details...
        </div>
      </div>
    );
  }

  if (error || !knowledge) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 max-w-md w-full">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">
            {error || 'Concept not found'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            This knowledge object might not be published yet or you may not have access.
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          href="/student/knowledge"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Exploration
        </Link>

        {/* Hero Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {knowledge.type}
            </span>
            <span className="text-xs text-slate-400">Version {knowledge.version}</span>
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {knowledge.title}
          </h1>

          {knowledge.description && (
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {knowledge.description}
            </p>
          )}

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6 dark:border-slate-800">
            <Link
              href={`/student/knowledge/${knowledge.id}/learn`}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 hover:scale-[1.01]"
            >
              <Play className="h-4 w-4 fill-white" />
              Start Learning
            </Link>

            <Link
              href={`/student/knowledge/${knowledge.id}/practice`}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Practice & Verify Questions
            </Link>
          </div>
        </div>

        {/* Structural Learning Path & Readiness */}
        <LearningPathView knowledgeId={knowledge.id} />

        {/* Learning Objectives Card */}
        {knowledge.learningObjectives && knowledge.learningObjectives.length > 0 && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 dark:border-indigo-950/50 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">
              <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Learning Objectives
            </div>
            <ul className="mt-4 space-y-2.5">
              {knowledge.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-indigo-950 dark:text-indigo-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Prerequisites Section */}
        {knowledge.prerequisites && knowledge.prerequisites.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Network className="h-4 w-4 text-slate-500" />
              Prerequisites & Foundation
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Make sure you are familiar with these topics before starting this lesson:
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {knowledge.prerequisites.map((prereq) => (
                <Link
                  key={prereq.id}
                  href={`/student/knowledge/${prereq.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 transition hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="font-semibold">{prereq.title}</span>
                  <span className="text-[10px] text-slate-400 uppercase">{prereq.type}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Knowledge Section */}
        {knowledge.relatedKnowledge && knowledge.relatedKnowledge.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Layers className="h-4 w-4 text-indigo-500" />
              Related Concepts & Follow-Ups
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {knowledge.relatedKnowledge.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/student/knowledge/${rel.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 transition hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="font-semibold">{rel.title}</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    {rel.relation}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
