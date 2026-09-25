'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Award,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { knowledgeApi } from '@/lib/api/knowledgeApi';
import {
  StudentKnowledgeDetail,
  ContentBlock,
  LessonSection,
} from '@/types/knowledge';
import { PracticeBlock } from '@/components/student/knowledge/PracticeBlock';

export default function StudentPracticeModePage() {
  const params = useParams();
  const id = params?.id as string;

  const [knowledge, setKnowledge] = useState<StudentKnowledgeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [correctQuestions, setCorrectQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    const fetchKnowledge = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await knowledgeApi.getStudentKnowledge(id);
        setKnowledge(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load practice questions.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchKnowledge();
  }, [id]);

  // Extract all QUESTION blocks from content
  const questionBlocks = useMemo(() => {
    if (!knowledge?.content) return [];
    try {
      const parsed = JSON.parse(knowledge.content);
      const questions: ContentBlock[] = [];

      if (parsed.sections && Array.isArray(parsed.sections)) {
        for (const sec of parsed.sections) {
          if (Array.isArray(sec.blocks)) {
            for (const b of sec.blocks) {
              if (b.type === 'QUESTION') questions.push(b);
            }
          }
        }
      } else if (Array.isArray(parsed)) {
        for (const b of parsed) {
          if (b.type === 'QUESTION') questions.push(b);
        }
      }

      return questions;
    } catch {
      return [];
    }
  }, [knowledge]);

  const handleQuestionEvaluated = (questionId: string, isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectQuestions((prev) => ({ ...prev, [questionId]: true }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading practice questions...
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
            {error || 'Unable to load practice questions'}
          </h2>
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

  const correctCount = Object.keys(correctQuestions).length;
  const totalCount = questionBlocks.length;
  const progressPercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          href={`/student/knowledge/${knowledge.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {knowledge.title}
        </Link>

        {/* Practice Header Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Dedicated Practice Mode
            </span>

            <span className="text-xs font-bold text-slate-500">
              {correctCount} / {totalCount} Solved
            </span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Practice: {knowledge.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Answer questions verified by server logic. Use hints if you get stuck and check explanations to solidify your understanding.
          </p>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>Mastery Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Questions List */}
        {questionBlocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <HelpCircle className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
              No practice questions in this concept
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              This concept focuses on exposition or reading.
            </p>
            <Link
              href={`/student/knowledge/${knowledge.id}/learn`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Go to Full Lesson
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {questionBlocks.map((block, idx) => (
              <div key={block.id} className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Question {idx + 1}
                </div>
                <PracticeBlock
                  block={block}
                  knowledgeObjectId={knowledge.id}
                  knowledgeVersion={knowledge.version}
                  onAnswerEvaluated={(isCorrect: boolean) =>
                    handleQuestionEvaluated(block.id, isCorrect)
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
