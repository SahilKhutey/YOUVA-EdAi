'use client';

import React from 'react';
import { CheckCircle2, Network, Eye, X, BookOpen } from 'lucide-react';
import { ContentBlock } from '../../../types/knowledge';

interface StudentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: string;
  objectives: string[];
  prerequisites: string[];
  blocks: ContentBlock[];
}

export const StudentPreviewModal: React.FC<StudentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  objectives,
  prerequisites,
  blocks,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Eye className="h-3.5 w-3.5" />
              Student Preview Mode
            </span>
            <span className="text-xs text-slate-500">
              What learners experience in the mobile & web player
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Lesson Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-3.5 w-3.5" />
              {type}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {title || 'Untitled Knowledge Object'}
            </h1>
          </div>

          {/* Objectives Card */}
          {objectives.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5 dark:border-indigo-950/50 dark:bg-indigo-950/20">
              <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                What You Will Learn
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-indigo-950 dark:text-indigo-300">
                {objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites Card */}
          {prerequisites.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
              <Network className="h-4 w-4 text-slate-500" />
              <span className="font-medium">Prior knowledge needed:</span>
              <span className="text-slate-900 font-semibold dark:text-slate-200">
                {prerequisites.join(', ')}
              </span>
            </div>
          )}

          {/* Blocks Rendered in Student Mode */}
          <div className="space-y-5 pt-2">
            {blocks.map((block) => (
              <div key={block.id}>
                {block.type === 'HEADING' && (
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {block.content}
                  </h2>
                )}

                {block.type === 'TEXT' && (
                  <div className="prose dark:prose-invert text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {block.content}
                  </div>
                )}

                {block.type === 'EXAMPLE' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      {block.title}
                    </div>
                    <div className="mt-2 text-sm text-amber-950 dark:text-amber-100 whitespace-pre-wrap">
                      {block.content}
                    </div>
                  </div>
                )}

                {block.type === 'CALLOUT' && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-100">
                    {block.title && <div className="font-bold">{block.title}</div>}
                    <div className="mt-1">{block.content}</div>
                  </div>
                )}

                {block.type === 'QUESTION' && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Check Your Understanding
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {block.prompt}
                    </div>
                    {block.options && block.options.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {block.options.map((opt, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                          >
                            <span className="font-mono text-slate-400">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'ACTIVITY' && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5 dark:border-purple-900/40 dark:bg-purple-950/10">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      Activity: {block.title}
                    </div>
                    <div className="mt-2 text-sm text-purple-950 dark:text-purple-100">
                      {block.instructions}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
