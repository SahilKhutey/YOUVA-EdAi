'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  ArrowLeft,
  Award,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  StudentKnowledgeDetail,
  KnowledgeLearningSessionItem,
  ContentBlock,
  LessonSection,
} from '@/types/knowledge';
import { knowledgeApi } from '@/lib/api/knowledgeApi';
import { ContentRenderer } from './ContentRenderer';
import { PracticeBlock } from './PracticeBlock';
import { CompletionModal } from './CompletionModal';
import { StudentAIAssistant } from './StudentAIAssistant';

interface KnowledgePlayerProps {
  knowledge: StudentKnowledgeDetail;
  initialSession?: KnowledgeLearningSessionItem;
}

export const KnowledgePlayer: React.FC<KnowledgePlayerProps> = ({
  knowledge,
  initialSession,
}) => {
  const [session, setSession] = useState<KnowledgeLearningSessionItem | undefined>(initialSession);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(
    initialSession?.lastPosition ?? 0,
  );
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [understoodSteps, setUnderstoodSteps] = useState<Record<number, boolean>>({});

  // Parse structured lesson content
  const steps = useMemo(() => {
    try {
      const parsed = JSON.parse(knowledge.content);
      if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
        return parsed.sections as LessonSection[];
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Wrap blocks into a single section
        return [
          {
            id: 'sec-all',
            title: knowledge.title,
            sectionType: 'EXPOSITION',
            blocks: parsed as ContentBlock[],
          },
        ] as LessonSection[];
      }
    } catch {
      // Content is raw text
    }

    return [
      {
        id: 'sec-default',
        title: knowledge.title,
        sectionType: 'EXPOSITION',
        blocks: [
          {
            type: 'TEXT',
            id: 'blk-text-default',
            content: knowledge.content || knowledge.description || 'No content provided.',
          },
        ],
      },
    ] as LessonSection[];
  }, [knowledge]);

  // Ensure current step index is within bounds
  const activeIndex = Math.min(Math.max(0, currentStepIndex), Math.max(0, steps.length - 1));
  const activeStep = steps[activeIndex];
  const progressPercent = Math.round(((activeIndex + 1) / steps.length) * 100);

  // Initialize or resume session on mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (!session) {
        try {
          const s = await knowledgeApi.startSession(knowledge.id, {
            knowledgeVersionId: knowledge.knowledgeVersionId,
          });
          if (isMounted) {
            setSession(s);
            if (s.lastPosition && s.lastPosition < steps.length) {
              setCurrentStepIndex(s.lastPosition);
            }
          }
        } catch {
          // Fallback gracefully
        }
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [knowledge.id, knowledge.knowledgeVersionId]);

  // Update position on server when step changes
  const updatePosition = async (newPos: number) => {
    setCurrentStepIndex(newPos);
    if (session?.id) {
      try {
        await knowledgeApi.updateSessionPosition(session.id, newPos);
      } catch {
        // Non-blocking
      }
    }
  };

  const handleNext = () => {
    if (activeIndex < steps.length - 1) {
      updatePosition(activeIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      updatePosition(activeIndex - 1);
    }
  };

  const handleComplete = async () => {
    if (session?.id) {
      try {
        await knowledgeApi.completeSession(session.id);
      } catch {
        // Non-blocking
      }
    }
    setShowCompletionModal(true);
  };

  const handleUnderstood = async () => {
    setUnderstoodSteps((prev) => ({ ...prev, [activeIndex]: true }));
    try {
      await knowledgeApi.recordEvent({
        knowledgeObjectId: knowledge.id,
        knowledgeVersion: knowledge.version,
        eventType: 'MASTERED',
        metadata: JSON.stringify({ sectionId: activeStep.id, stepIndex: activeIndex }),
      });
    } catch {
      // Non-blocking
    }
    if (activeIndex < steps.length - 1) {
      handleNext();
    }
  };

  const handleNeedHelp = async () => {
    try {
      await knowledgeApi.recordEvent({
        knowledgeObjectId: knowledge.id,
        knowledgeVersion: knowledge.version,
        eventType: 'STRUGGLED',
        metadata: JSON.stringify({ sectionId: activeStep.id, stepIndex: activeIndex }),
      });
    } catch {
      // Non-blocking
    }
  };

  const handleAnswerEvaluated = (isCorrect: boolean) => {
    setQuestionsAnswered((prev) => prev + 1);
    if (isCorrect) {
      setQuestionsCorrect((prev) => prev + 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <Link
            href={`/student/knowledge/${knowledge.id}`}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Exit Lesson</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {knowledge.type}
            </span>
            <span className="text-sm font-bold text-slate-900 line-clamp-1 dark:text-slate-100">
              {knowledge.title}
            </span>
          </div>
        </div>

        {/* Progress Display */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Layers className="h-3.5 w-3.5" />
            <span>
              Part {activeIndex + 1} of {steps.length}
            </span>
          </div>

          <div className="w-28 sm:w-40">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Learning Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Section Banner */}
          <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {activeStep.sectionType}
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {activeStep.title || knowledge.title}
            </h1>
          </div>

          {/* Section Blocks */}
          <div className="space-y-6">
            {activeStep.blocks.map((block) => {
              if (block.type === 'QUESTION') {
                return (
                  <PracticeBlock
                    key={block.id}
                    block={block}
                    knowledgeObjectId={knowledge.id}
                    knowledgeVersion={knowledge.version}
                    onAnswerEvaluated={handleAnswerEvaluated}
                  />
                );
              }
              return <ContentRenderer key={block.id} block={block} />;
            })}
          </div>

          {/* Quick Understanding Feedback */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              How are you feeling about this part?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNeedHelp}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                Need Help
              </button>

              <button
                type="button"
                onClick={handleUnderstood}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                I Understand
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Sticky Player Control Bar */}
      <footer className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={handlePrev}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-xs font-semibold text-slate-400">
            {activeIndex + 1} / {steps.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {activeIndex === steps.length - 1 ? (
              <>
                <Award className="h-4 w-4 text-amber-300" />
                Complete Lesson
              </>
            ) : (
              <>
                Next Part
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Completion Celebration Modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        knowledge={knowledge}
        questionsAnswered={questionsAnswered}
        questionsCorrect={questionsCorrect}
        onRestart={() => {
          setShowCompletionModal(false);
          updatePosition(0);
        }}
        onClose={() => setShowCompletionModal(false)}
      />

      {/* AI Learning Assistant (Grounded in Verified Curriculum) */}
      <StudentAIAssistant
        knowledgeId={knowledge.id}
        knowledgeTitle={knowledge.title}
      />
    </div>
  );
};
