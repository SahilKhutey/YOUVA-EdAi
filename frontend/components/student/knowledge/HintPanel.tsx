'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { knowledgeApi } from '@/lib/api/knowledgeApi';

interface HintPanelProps {
  hints: string[];
  knowledgeObjectId: string;
  knowledgeVersion: number;
  questionId?: string;
  onHintRevealed?: (tier: number) => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  hints,
  knowledgeObjectId,
  knowledgeVersion,
  questionId,
  onHintRevealed,
}) => {
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!hints || hints.length === 0) return null;

  const revealNextHint = async () => {
    const nextCount = revealedCount + 1;
    setRevealedCount(nextCount);
    setIsExpanded(true);

    if (onHintRevealed) {
      onHintRevealed(nextCount);
    }

    // Record REQUESTED_HINT event
    try {
      await knowledgeApi.recordEvent({
        knowledgeObjectId,
        knowledgeVersion,
        eventType: 'REQUESTED_HINT',
        metadata: JSON.stringify({
          questionId,
          hintTier: nextCount,
          totalHints: hints.length,
        }),
      });
    } catch {
      // Non-blocking telemetry
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
          <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span>
            Hints Available ({revealedCount} / {hints.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {revealedCount < hints.length && (
            <button
              type="button"
              onClick={revealNextHint}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-200/80 px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-300/80 dark:bg-amber-900/60 dark:text-amber-200 dark:hover:bg-amber-800/60"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              {revealedCount === 0 ? 'Need a hint?' : 'Next hint'}
            </button>
          )}

          {revealedCount > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg p-1 text-amber-700 hover:bg-amber-200/50 dark:text-amber-300 dark:hover:bg-amber-900/40"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && revealedCount > 0 && (
        <div className="mt-3 space-y-2 border-t border-amber-200/60 pt-3 dark:border-amber-900/40">
          {hints.slice(0, revealedCount).map((hint, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-lg bg-white/80 p-2.5 text-xs text-amber-950 shadow-sm dark:bg-slate-900/80 dark:text-amber-100"
            >
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Hint {idx + 1}:
              </span>
              <span className="flex-1 leading-relaxed">{hint}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
