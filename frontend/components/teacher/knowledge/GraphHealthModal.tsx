'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Network,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  Layers,
  HelpCircle,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { knowledgeApi } from '@/lib/api/knowledgeApi';
import { GraphHealthMetrics } from '@/types/knowledge';

interface GraphHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GraphHealthModal: React.FC<GraphHealthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<GraphHealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadHealth = async () => {
    setIsLoading(true);
    try {
      const data = await knowledgeApi.getGraphHealth();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load graph health metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasCriticalIssues =
    (metrics?.potentialCycles ?? 0) > 0 || (metrics?.brokenRelationships ?? 0) > 0;
  const hasWarnings = (metrics?.orphanNodes ?? 0) > 0 || (metrics?.warnings?.length ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">
              Knowledge Graph Health & Governance
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadHealth}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Refresh health metrics"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                Scanning knowledge graph integrity...
              </div>
            </div>
          ) : (
            <>
              {/* Overall Status Banner */}
              <div
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  hasCriticalIssues
                    ? 'border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200'
                    : hasWarnings
                      ? 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200'
                      : 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200'
                }`}
              >
                {hasCriticalIssues ? (
                  <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
                ) : hasWarnings ? (
                  <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                )}

                <div>
                  <div className="font-bold text-sm">
                    {hasCriticalIssues
                      ? 'Integrity Attention Required'
                      : hasWarnings
                        ? 'Graph Connected with Non-Critical Notices'
                        : 'Graph Integrity Verified & Optimal'}
                  </div>
                  <p className="mt-0.5 text-xs opacity-90">
                    {hasCriticalIssues
                      ? 'Cycle or broken reference detected. Review relationships to prevent learning loop deadlocks.'
                      : hasWarnings
                        ? 'Some concepts are standalone or unpublished. Consider linking them into curriculum paths.'
                        : 'All curriculum relationships are strictly acyclic, fully referenced, and validated.'}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <BookOpen className="h-3.5 w-3.5" />
                    Total Nodes
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                    {metrics?.totalNodes ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <Network className="h-3.5 w-3.5 text-indigo-500" />
                    Relationships
                  </div>
                  <div className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {metrics?.totalRelationships ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    Prerequisites
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                    {metrics?.prerequisiteRelationships ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <AlertTriangle
                      className={`h-3.5 w-3.5 ${
                        (metrics?.potentialCycles ?? 0) > 0 ? 'text-rose-500' : 'text-slate-400'
                      }`}
                    />
                    Cycles
                  </div>
                  <div
                    className={`mt-1 text-2xl font-black ${
                      (metrics?.potentialCycles ?? 0) > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {metrics?.potentialCycles ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <XCircle
                      className={`h-3.5 w-3.5 ${
                        (metrics?.brokenRelationships ?? 0) > 0 ? 'text-rose-500' : 'text-slate-400'
                      }`}
                    />
                    Broken Edges
                  </div>
                  <div
                    className={`mt-1 text-2xl font-black ${
                      (metrics?.brokenRelationships ?? 0) > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {metrics?.brokenRelationships ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                    Orphan Nodes
                  </div>
                  <div className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                    {metrics?.orphanNodes ?? 0}
                  </div>
                </div>
              </div>

              {/* Actionable Governance Notices */}
              {metrics?.warnings && metrics.warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Graph Governance & Quality Notices
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {metrics.warnings.map((warn, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span>{warn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Pedagogical Guidance */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs text-indigo-950 dark:border-indigo-950/60 dark:bg-indigo-950/20 dark:text-indigo-200">
                <span className="font-bold">Pedagogical Recommendation:</span> An interconnected
                knowledge graph ensures the AI and Learning Path engines can accurately diagnose
                prerequisite gaps and recommend remedial or advanced lessons. Ensure key lessons
                have at least 1 prerequisite and 1 follow-up concept.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
