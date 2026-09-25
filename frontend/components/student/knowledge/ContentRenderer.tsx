'use client';

import React from 'react';
import { ContentBlock } from '@/types/knowledge';
import { AlertCircle, HelpCircle, Lightbulb, Info } from 'lucide-react';

interface ContentRendererProps {
  block: ContentBlock;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ block }) => {
  switch (block.type) {
    case 'HEADING':
      if (block.level === 1) {
        return (
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {block.content}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {block.content}
          </h2>
        );
      }
      return (
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
          {block.content}
        </h3>
      );

    case 'TEXT':
      return (
        <div className="prose dark:prose-invert max-w-none text-base leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
          {block.content}
        </div>
      );

    case 'IMAGE':
      return (
        <div className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          {block.url ? (
            <img
              src={block.url}
              alt={block.altText || 'Educational illustration'}
              className="max-h-96 w-full object-contain"
            />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              [Image: {block.altText || 'Educational diagram'}]
            </div>
          )}
          {block.altText && (
            <div className="border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {block.altText}
            </div>
          )}
        </div>
      );

    case 'EXAMPLE':
      return (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-amber-50/20 p-5 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-transparent">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
            {block.title || 'Worked Example'}
          </div>
          <div className="mt-3 text-sm leading-relaxed text-amber-950 dark:text-amber-100 whitespace-pre-wrap">
            {block.content}
          </div>
        </div>
      );

    case 'CALLOUT': {
      const isTip = block.variant === 'TIP';
      const isWarning = block.variant === 'WARNING';
      const borderColor = isTip
        ? 'border-emerald-200 dark:border-emerald-900/50'
        : isWarning
        ? 'border-rose-200 dark:border-rose-900/50'
        : 'border-blue-200 dark:border-blue-900/50';
      const bgColor = isTip
        ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
        : isWarning
        ? 'bg-rose-50/60 dark:bg-rose-950/20'
        : 'bg-blue-50/60 dark:bg-blue-950/20';
      const textColor = isTip
        ? 'text-emerald-950 dark:text-emerald-200'
        : isWarning
        ? 'text-rose-950 dark:text-rose-200'
        : 'text-blue-950 dark:text-blue-200';
      const icon = isTip ? (
        <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      ) : isWarning ? (
        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
      ) : (
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      );

      return (
        <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 ${textColor}`}>
          <div className="flex items-center gap-2">
            {icon}
            {block.title && <span className="text-xs font-bold uppercase tracking-wider">{block.title}</span>}
          </div>
          <div className="mt-1.5 text-sm whitespace-pre-wrap">{block.content}</div>
        </div>
      );
    }

    case 'ACTIVITY':
      return (
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-900/50 dark:bg-purple-950/20">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
            <HelpCircle className="h-4 w-4" />
            {block.title || 'Interactive Activity'}
          </div>
          <div className="mt-2 text-sm leading-relaxed text-purple-950 dark:text-purple-100 whitespace-pre-wrap">
            {block.instructions}
          </div>
        </div>
      );

    default:
      return null;
  }
};
