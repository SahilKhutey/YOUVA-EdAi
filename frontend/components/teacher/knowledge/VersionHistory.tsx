'use client';

import React, { useState } from 'react';
import { History, Eye, Check, Calendar, Hash, ArrowLeftRight } from 'lucide-react';
import { KnowledgeVersionItem } from '../../../types/knowledge';

interface VersionHistoryProps {
  versions: KnowledgeVersionItem[];
  currentVersion: number;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersion,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<KnowledgeVersionItem | null>(null);
  const [diffTarget, setDiffTarget] = useState<KnowledgeVersionItem | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-500" />
          Version History ({versions.length})
        </h3>
        <span className="text-xs text-slate-500">
          Current Live Version: <strong className="text-indigo-600">v{currentVersion}</strong>
        </span>
      </div>

      <div className="space-y-3">
        {versions.map((ver) => {
          const isCurrent = ver.version === currentVersion;
          return (
            <div
              key={ver.id}
              className={`rounded-xl border p-4 text-xs transition-all ${
                isCurrent
                  ? 'border-indigo-500/40 bg-indigo-50/20 dark:border-indigo-500/40 dark:bg-indigo-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    v{ver.version}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      ver.reviewStatus === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : ver.reviewStatus === 'PENDING_REVIEW'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                    }`}
                  >
                    {ver.reviewStatus}
                  </span>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded bg-indigo-600 px-1.5 py-0.2 text-[10px] font-medium text-white">
                      <Check className="h-2.5 w-2.5" /> Live
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVersion(ver)}
                    className="inline-flex items-center gap-1 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffTarget(ver)}
                    className="inline-flex items-center gap-1 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Compare
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(ver.createdAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] truncate" title={ver.contentHash}>
                  <Hash className="h-3 w-3 shrink-0" />
                  {ver.contentHash.substring(0, 16)}...
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Content Modal */}
      {selectedVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Content Snapshot: Version {selectedVersion.version}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedVersion(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <pre className="mt-4 flex-1 overflow-y-auto rounded-lg bg-slate-50 p-4 font-mono text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-200">
              {selectedVersion.content}
            </pre>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {diffTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[80vh] flex flex-col rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Comparison: v{diffTarget.version} vs Live v{currentVersion}
              </h4>
              <button
                type="button"
                onClick={() => setDiffTarget(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Selected: v{diffTarget.version}</div>
                <pre className="rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-800 dark:bg-slate-950 dark:text-slate-200 overflow-x-auto">
                  {diffTarget.content}
                </pre>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-indigo-600">Live: v{currentVersion}</div>
                <pre className="rounded-lg bg-indigo-50/40 p-3 font-mono text-[11px] text-slate-800 dark:bg-indigo-950/20 dark:text-slate-200 overflow-x-auto">
                  {versions.find((v) => v.version === currentVersion)?.content || 'Current content'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
