'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
  User,
  Sparkles,
} from 'lucide-react';
import {
  LearningOrchestration,
  learningOrchestrationApi,
} from '@/lib/api/learningOrchestrationApi';

interface TeacherOrchestrationApprovalCardProps {
  orchestration: LearningOrchestration;
  onActionComplete?: (updated: LearningOrchestration) => void;
}

export const TeacherOrchestrationApprovalCard: React.FC<TeacherOrchestrationApprovalCardProps> = ({
  orchestration,
  onActionComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);
      const updated = await learningOrchestrationApi.approveOrchestration(orchestration.id, {
        approvedBy: 'Teacher',
        notes: 'Approved via Teacher Dashboard',
      });
      onActionComplete?.(updated);
    } catch (err) {
      setError((err as Error).message || 'Failed to approve orchestration');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setLoading(true);
      setError(null);
      const updated = await learningOrchestrationApi.cancelOrchestration(
        orchestration.id,
        'Dismissed by teacher',
      );
      onActionComplete?.(updated);
    } catch (err) {
      setError((err as Error).message || 'Failed to dismiss orchestration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Proposed Learning Adaptation
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">
              {orchestration.objective}
            </h4>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
          Approval Required
        </span>
      </div>

      {/* Target Info */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span>Learner: {orchestration.learnerId ?? 'Whole Class'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>Scope: {orchestration.scope}</span>
        </div>
        <div>
          <span>Workflow: <span className="font-mono text-slate-300">{orchestration.workflowId}</span></span>
        </div>
      </div>

      {/* Steps Preview */}
      {orchestration.steps && orchestration.steps.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-400">PROPOSED ACTIONS:</div>
          <div className="grid gap-1.5">
            {orchestration.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between text-xs bg-slate-950 p-2 rounded border border-slate-800/50"
              >
                <div className="flex items-center gap-2 text-slate-300 font-mono">
                  <span className="text-slate-500">#{step.sequence}</span>
                  <span>{step.actionType}</span>
                </div>
                <div className="text-slate-400">
                  Target: {step.targetType}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={handleDismiss}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          Dismiss
        </button>
        <button
          onClick={handleApprove}
          disabled={loading}
          className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 transition shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approve & Execute
        </button>
      </div>
    </div>
  );
};

export default TeacherOrchestrationApprovalCard;
