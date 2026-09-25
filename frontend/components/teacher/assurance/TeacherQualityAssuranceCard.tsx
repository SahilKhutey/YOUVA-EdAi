'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  AssuranceFinding,
  learningAssuranceApi,
} from '@/lib/api/learningAssuranceApi';

interface TeacherQualityAssuranceCardProps {
  finding: AssuranceFinding;
  onActionComplete?: (updated: AssuranceFinding) => void;
}

export const TeacherQualityAssuranceCard: React.FC<TeacherQualityAssuranceCardProps> = ({
  finding,
  onActionComplete,
}) => {
  const [loading, setLoading] = useState(false);

  const handleAcknowledge = async () => {
    try {
      setLoading(true);
      const updated = await learningAssuranceApi.acknowledgeFinding(finding.id, {
        acknowledgedBy: 'Teacher',
        notes: 'Reviewed and acknowledged in Teacher Studio',
      });
      onActionComplete?.(updated);
    } catch (err) {
      console.error('Failed to acknowledge quality notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    try {
      setLoading(true);
      const updated = await learningAssuranceApi.resolveFinding(finding.id, {
        resolvedBy: 'Teacher',
        resolutionNotes: 'Updated content and objectives in Teacher Studio',
      });
      onActionComplete?.(updated);
    } catch (err) {
      console.error('Failed to resolve quality notice:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Content Quality Advisory
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">
              {finding.message}
            </h4>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded text-xs font-bold ${
            finding.severity === 'HIGH' || finding.severity === 'CRITICAL'
              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
          }`}
        >
          {finding.severity}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span>Target: {finding.targetType} ({finding.targetId})</span>
        </div>
        <div>
          <span>Rule: <span className="font-mono text-slate-300">{finding.ruleId}</span></span>
        </div>
      </div>

      {finding.evidenceIds && finding.evidenceIds.length > 0 && (
        <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800/50">
          <span className="text-slate-300 font-semibold">Evidence: </span>
          {finding.evidenceIds.join(', ')}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={handleAcknowledge}
          disabled={loading || finding.status !== 'OPEN'}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
        >
          Dismiss / Acknowledge
        </button>

        <button
          onClick={handleResolve}
          disabled={loading || finding.status === 'RESOLVED'}
          className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Mark as Resolved
        </button>
      </div>
    </div>
  );
};

export default TeacherQualityAssuranceCard;
