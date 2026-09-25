'use client';

import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ValidationReport } from '../../../types/knowledge';

interface ValidationPanelProps {
  title: string;
  content: string;
  objectives: string[];
  subjectId?: string;
  topicId?: string;
  prerequisites: string[];
}

export function computeValidation(props: ValidationPanelProps): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!props.title || props.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!props.content || props.content.trim().length === 0) {
    errors.push('Content or lesson exposition is required');
  }

  if (!props.objectives || props.objectives.length === 0) {
    errors.push('At least one learning objective is required');
  }

  if (!props.subjectId) {
    warnings.push('No Subject assigned (recommended for curriculum discovery)');
  }

  if (!props.topicId) {
    warnings.push('No Topic assigned (recommended for unit progression)');
  }

  if (!props.prerequisites || props.prerequisites.length === 0) {
    warnings.push('No prerequisites linked (recommended for knowledge graph sequencing)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export const ValidationPanel: React.FC<ValidationPanelProps> = (props) => {
  const report = computeValidation(props);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Validation Status
        </span>
        {report.isValid ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready for Review
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            Requires Attention
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          {props.title?.trim() ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={props.title?.trim() ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 font-medium'}>
            Title defined
          </span>
        </div>

        <div className="flex items-center gap-2">
          {props.content?.trim() ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={props.content?.trim() ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 font-medium'}>
            Content blocks present
          </span>
        </div>

        <div className="flex items-center gap-2">
          {props.objectives?.length > 0 ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={props.objectives?.length > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 font-medium'}>
            Learning objectives ({props.objectives?.length || 0})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {props.prerequisites?.length > 0 ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span className="text-slate-600 dark:text-slate-400">
            Prerequisites linked ({props.prerequisites?.length || 0})
          </span>
        </div>
      </div>

      {report.errors.length > 0 && (
        <div className="rounded-md bg-red-50 p-2 text-[11px] text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <ul className="list-disc pl-4 space-y-0.5">
            {report.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {report.warnings.length > 0 && (
        <div className="rounded-md bg-amber-50 p-2 text-[11px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <ul className="list-disc pl-4 space-y-0.5">
            {report.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
