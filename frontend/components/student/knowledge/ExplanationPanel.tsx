'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { knowledgeApi } from '@/lib/api/knowledgeApi';

interface ExplanationPanelProps {
  explanation: string;
  knowledgeObjectId: string;
  knowledgeVersion: number;
  questionId?: string;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  explanation,
  knowledgeObjectId,
  knowledgeVersion,
  questionId,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);

  if (!explanation) return null;

  const toggleOpen = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && !hasRecorded) {
      setHasRecorded(true);
      try {
        await knowledgeApi.recordEvent({
          knowledgeObjectId,
          knowledgeVersion,
          eventType: 'REQUESTED_EXPLANATION',
          metadata: JSON.stringify({ questionId }),
        });
      } catch {
        // Non-blocking telemetry
      }
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between text-left text-xs font-semibold text-indigo-900 dark:text-indigo-300"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Deep-Dive Explanation & Insights</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="mt-3 border-t border-indigo-200/60 pt-3 text-xs leading-relaxed text-indigo-950 dark:border-indigo-900/40 dark:text-indigo-100 whitespace-pre-wrap">
          {explanation}
        </div>
      )}
    </div>
  );
};
