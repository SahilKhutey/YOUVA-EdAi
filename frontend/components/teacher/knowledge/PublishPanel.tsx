'use client';

import React, { useState } from 'react';
import { Send, Check, Rocket, AlertCircle, Loader2 } from 'lucide-react';
import { KnowledgeStatus } from '../../../types/knowledge';

interface PublishPanelProps {
  status: KnowledgeStatus;
  currentVersion: number;
  isValid: boolean;
  onSubmitForReview: () => Promise<void>;
  onApprove: () => Promise<void>;
  onPublish: (notes?: string) => Promise<void>;
}

export const PublishPanel: React.FC<PublishPanelProps> = ({
  status,
  currentVersion,
  isValid,
  onSubmitForReview,
  onApprove,
  onPublish,
}) => {
  const [isBusy, setIsBusy] = useState(false);
  const [publishNotes, setPublishNotes] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handleAction = async (actionFn: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await actionFn();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Publishing Workflow
        </span>
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          v{currentVersion} • {status}
        </span>
      </div>

      {status === 'DRAFT' && (
        <div className="space-y-2">
          <p className="text-slate-600 dark:text-slate-400">
            This item is currently in draft. Once all validation checks pass, submit it for peer or lead review.
          </p>
          <button
            type="button"
            disabled={!isValid || isBusy}
            onClick={() => handleAction(onSubmitForReview)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Submit for Review
          </button>
        </div>
      )}

      {status === 'IN_REVIEW' && (
        <div className="space-y-2">
          <p className="text-slate-600 dark:text-slate-400">
            Item is awaiting review approval. Verify curriculum alignment and pedagogical clarity.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleAction(onApprove)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Approve Version
            </button>
          </div>
        </div>
      )}

      {status === 'APPROVED' && (
        <div className="space-y-2">
          <p className="text-slate-600 dark:text-slate-400">
            Approved and ready for deployment. Publishing makes this version live for students across your tenant.
          </p>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setShowPublishModal(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <Rocket className="h-3.5 w-3.5" />
            Publish Live
          </button>
        </div>
      )}

      {status === 'PUBLISHED' && (
        <div className="space-y-2 rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            Active & Student Accessible
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
            Published version is frozen for auditability. Making edits will automatically fork a new draft version.
          </p>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Confirm Publication (v{currentVersion})
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              This will atomically release version {currentVersion} to students. Historical learning records will remain bound to prior versions.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Release / Changelog Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                placeholder="e.g. Added 3 new worked examples and diagnostic questions..."
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={async () => {
                  await handleAction(() => onPublish(publishNotes));
                  setShowPublishModal(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                Confirm & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
