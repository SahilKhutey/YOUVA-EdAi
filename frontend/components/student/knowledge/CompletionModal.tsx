'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react';
import { StudentKnowledgeDetail } from '@/types/knowledge';
import { personalizationApi, PersonalizedRecommendation } from '@/lib/api/personalizationApi';

interface CompletionModalProps {
  isOpen: boolean;
  knowledge: StudentKnowledgeDetail;
  questionsAnswered: number;
  questionsCorrect: number;
  onRestart: () => void;
  onClose: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  knowledge,
  questionsAnswered,
  questionsCorrect,
  onRestart,
  onClose,
}) => {
  const [recommendation, setRecommendation] = useState<PersonalizedRecommendation | null>(null);

  useEffect(() => {
    if (!isOpen || !knowledge?.id) return;
    const fetchNext = async () => {
      try {
        const rec = await personalizationApi.getNextRecommendation(knowledge.id);
        setRecommendation(rec);
      } catch (err) {
        console.error('Failed to load next recommendation in completion modal:', err);
      }
    };
    fetchNext();
  }, [isOpen, knowledge?.id]);

  if (!isOpen) return null;

  const accuracy =
    questionsAnswered > 0 ? Math.round((questionsCorrect / questionsAnswered) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Celebration Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-8 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <Award className="h-9 w-9 text-amber-300" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
            Concept Mastered!
          </h2>
          <p className="mt-1 text-sm text-indigo-100 opacity-90">
            You completed <span className="font-semibold text-white">{knowledge.title}</span>
          </p>
        </div>

        {/* Learning Stats */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {knowledge.learningObjectives.length}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                Objectives Achieved
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {accuracy}%
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                Practice Accuracy
              </div>
            </div>
          </div>

          {/* Objectives Completed Checklist */}
          {knowledge.learningObjectives.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                What you learned:
              </div>
              <ul className="mt-2.5 space-y-2">
                {knowledge.learningObjectives.slice(0, 3).map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Next Steps / Adaptive Recommendation */}
          {recommendation ? (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Personalized Next Step:
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {recommendation.decisionType}
                </span>
              </div>
              <Link
                href={`/student/knowledge/${recommendation.targetKnowledge.id}/learn`}
                className="mt-2 block rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs font-medium text-indigo-900 transition hover:bg-indigo-100/60 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>{recommendation.targetKnowledge.title}</span>
                  <ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                  {recommendation.reason.message}
                </p>
              </Link>
            </div>
          ) : knowledge.relatedKnowledge && knowledge.relatedKnowledge.length > 0 ? (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500">Next Recommended Concept:</div>
              <Link
                href={`/student/knowledge/${knowledge.relatedKnowledge[0].id}/learn`}
                className="mt-2 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-xs font-medium text-indigo-900 transition hover:bg-indigo-100/60 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200"
              >
                <span>{knowledge.relatedKnowledge[0].title}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
              Review Again
            </button>

            <Link
              href="/student/knowledge"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Home className="h-4 w-4" />
              Knowledge Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
