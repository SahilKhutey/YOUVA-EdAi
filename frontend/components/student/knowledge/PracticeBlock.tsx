'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Send, RotateCcw, Sparkles } from 'lucide-react';
import { ContentBlock } from '@/types/knowledge';
import { knowledgeApi } from '@/lib/api/knowledgeApi';
import { HintPanel } from './HintPanel';
import { ExplanationPanel } from './ExplanationPanel';

interface PracticeBlockProps {
  block: ContentBlock;
  knowledgeObjectId: string;
  knowledgeVersion: number;
  onAnswerEvaluated?: (isCorrect: boolean) => void;
}

export const PracticeBlock: React.FC<PracticeBlockProps> = ({
  block,
  knowledgeObjectId,
  knowledgeVersion,
  onAnswerEvaluated,
}) => {
  if (block.type !== 'QUESTION') return null;

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<{
    isCorrect: boolean;
    feedback: string;
    explanation?: string;
  } | null>(null);
  const [attempt, setAttempt] = useState<number>(1);
  const [hintUsed, setHintUsed] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const hasOptions = block.options && block.options.length > 0;
  const currentAnswer = hasOptions ? selectedOption : textAnswer;

  useEffect(() => {
    setStartTime(Date.now());
  }, [block.id]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentAnswer.trim() || isSubmitting || evaluation?.isCorrect) return;

    setIsSubmitting(true);
    const latencyMs = Math.max(0, Date.now() - startTime);

    try {
      const res = await knowledgeApi.evaluateAnswer({
        knowledgeObjectId,
        knowledgeVersion,
        questionId: block.id,
        submittedAnswer: currentAnswer.trim(),
        attempt,
        latencyMs,
        hintUsed,
      });

      setEvaluation(res);
      if (onAnswerEvaluated) {
        onAnswerEvaluated(res.isCorrect);
      }
      if (!res.isCorrect) {
        setAttempt((prev) => prev + 1);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedOption('');
    setTextAnswer('');
    setEvaluation(null);
    setStartTime(Date.now());
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          Practice & Verify
        </span>
        {attempt > 1 && (
          <span className="text-xs text-slate-500">Attempt {attempt}</span>
        )}
      </div>

      {/* Prompt */}
      <div className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
        {block.prompt}
      </div>

      {/* Interactive Options or Text Input */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {hasOptions ? (
          <div className="space-y-2">
            {block.options!.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isEvaluated = evaluation !== null;
              let optionStyle =
                'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:text-slate-200';

              if (isSelected) {
                optionStyle =
                  'border-indigo-500 bg-indigo-50/70 text-indigo-950 font-medium dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-200';
              }

              if (isEvaluated && isSelected) {
                optionStyle = evaluation.isCorrect
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'border-rose-500 bg-rose-50 text-rose-950 font-medium dark:border-rose-600 dark:bg-rose-950/40 dark:text-rose-200';
              }

              return (
                <button
                  type="button"
                  key={idx}
                  disabled={evaluation?.isCorrect || isSubmitting}
                  onClick={() => setSelectedOption(opt)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all ${optionStyle} ${
                    evaluation?.isCorrect ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={textAnswer}
              disabled={evaluation?.isCorrect || isSubmitting}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          {!evaluation?.isCorrect ? (
            <button
              type="submit"
              disabled={!currentAnswer.trim() || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Checking...' : 'Check Answer'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Verified Correct
            </div>
          )}

          {evaluation && !evaluation.isCorrect && (
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try Again
            </button>
          )}
        </div>
      </form>

      {/* Evaluation Feedback Banner */}
      {evaluation && (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            evaluation.isCorrect
              ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200'
              : 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {evaluation.isCorrect ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <div>
              <div className="font-semibold">{evaluation.feedback}</div>
              {evaluation.explanation && (
                <div className="mt-1 text-xs opacity-90 leading-relaxed">
                  {evaluation.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hints & Deep-Dive Explanation */}
      {/* We check for hints on the block or fallback questions */}
      <HintPanel
        hints={(block as any).hints || []}
        knowledgeObjectId={knowledgeObjectId}
        knowledgeVersion={knowledgeVersion}
        questionId={block.id}
        onHintRevealed={() => setHintUsed(true)}
      />

      {(block as any).explanation && (
        <ExplanationPanel
          explanation={(block as any).explanation}
          knowledgeObjectId={knowledgeObjectId}
          knowledgeVersion={knowledgeVersion}
          questionId={block.id}
        />
      )}
    </div>
  );
};
