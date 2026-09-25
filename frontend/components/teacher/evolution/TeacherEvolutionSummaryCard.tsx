'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Eye,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ImprovementCandidate } from '@/lib/api/continuousLearningApi';

interface TeacherEvolutionSummaryCardProps {
  candidates: ImprovementCandidate[];
  onReviewCandidate?: (candidate: ImprovementCandidate) => void;
}

export const TeacherEvolutionSummaryCard: React.FC<TeacherEvolutionSummaryCardProps> = ({
  candidates,
  onReviewCandidate,
}) => {
  const educationalCandidates = candidates.filter(
    (c) => c.evolutionLevel === 3 || c.evolutionLevel === 2,
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Ecosystem Continuous Improvement Notices
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Actionable insights and curriculum proposals synthesized from recent cohort outcomes.
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
          {educationalCandidates.length} suggestions
        </span>
      </div>

      {educationalCandidates.length === 0 ? (
        <div className="text-xs text-slate-500 italic text-center py-4 bg-slate-950 rounded-xl border border-slate-800">
          All curriculum pathways and prerequisites are performing within optimal parameters.
        </div>
      ) : (
        <div className="space-y-2">
          {educationalCandidates.slice(0, 3).map((c) => (
            <div
              key={c.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <span>Target: {c.targetId}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {c.targetType}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  {c.expectedBenefits?.[0] ?? 'Potential improvement in learner mastery progression'}
                </p>
              </div>

              <button
                onClick={() => onReviewCandidate?.(c)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 transition shrink-0"
              >
                <span>Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
        <span>Curriculum changes require teacher approval before activation.</span>
      </div>
    </div>
  );
};
