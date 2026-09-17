"use client";

import React, { useState } from 'react';
import { CheckCircle, Sliders, XCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';

export interface DecisionFactorItem {
  factor: string;
  direction: 'positive' | 'negative';
  weight: number;
}

export interface RecommendationItem {
  id: string;
  learnerId: string;
  learnerName: string;
  conceptTitle: string;
  activityType: 'INSTRUCTION' | 'PRACTICE' | 'REMEDIATION' | 'EXTENSION' | 'SPACED_RETRIEVAL';
  difficulty: number; // 0.1 to 0.9
  explanationReasons: DecisionFactorItem[];
  policyVersion: string;
}

export interface TeacherFeedbackDrawerProps {
  recommendation: RecommendationItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback?: (feedback: {
    action: 'ACCEPT' | 'MODIFY' | 'REJECT';
    reasonCode: string;
    modifiedDifficulty?: number;
    notes?: string;
  }) => void;
}

export const TeacherFeedbackDrawer: React.FC<TeacherFeedbackDrawerProps> = ({
  recommendation,
  isOpen,
  onClose,
  onSubmitFeedback,
}) => {
  const [selectedAction, setSelectedAction] = useState<'ACCEPT' | 'MODIFY' | 'REJECT'>('ACCEPT');
  const [reasonCode, setReasonCode] = useState<string>('INCORRECT_DIAGNOSIS');
  const [modifiedDifficulty, setModifiedDifficulty] = useState<number>(recommendation.difficulty);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (onSubmitFeedback) {
      onSubmitFeedback({
        action: selectedAction,
        reasonCode,
        modifiedDifficulty: selectedAction === 'MODIFY' ? modifiedDifficulty : undefined,
        notes,
      });
    }
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1200);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-drawer-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Teacher Cockpit Review
              </span>
              <h2 id="feedback-drawer-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                Evaluate AI Recommendation
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>

          {/* Student & Activity Context */}
          <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl space-y-2 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Learner:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{recommendation.learnerName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Target Concept:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{recommendation.conceptTitle}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Prescribed Activity:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {recommendation.activityType}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Base Difficulty:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">D = {recommendation.difficulty.toFixed(2)}</span>
            </div>
          </div>

          {/* Explainable Decision Factors (N10.9) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Info className="w-3.5 h-3.5" />
              <span>Algorithmic Explanation Factors</span>
            </div>
            <div className="space-y-1.5">
              {recommendation.explanationReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs border border-gray-200/60 dark:border-gray-700/60"
                >
                  <ChevronRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    reason.direction === 'positive' ? 'text-green-500' : 'text-amber-500'
                  }`} />
                  <div className="flex-1">
                    <span className="text-gray-700 dark:text-gray-300">{reason.factor}</span>
                    <span className="ml-2 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                      (weight: {(reason.weight * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Selector */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Teacher Decision (Human Gate)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAction('ACCEPT')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    selectedAction === 'ACCEPT'
                      ? 'border-green-600 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200 ring-2 ring-green-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mb-1 text-green-600 dark:text-green-400" />
                  Authorize
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAction('MODIFY')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    selectedAction === 'MODIFY'
                      ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 ring-2 ring-blue-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Sliders className="w-4 h-4 mb-1 text-blue-600 dark:text-blue-400" />
                  Modify
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAction('REJECT')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    selectedAction === 'REJECT'
                      ? 'border-red-600 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200 ring-2 ring-red-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <XCircle className="w-4 h-4 mb-1 text-red-600 dark:text-red-400" />
                  Override
                </button>
              </div>
            </div>

            {/* Modify Difficulty Controls */}
            {selectedAction === 'MODIFY' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex justify-between text-xs font-medium text-blue-900 dark:text-blue-200">
                  <span>Adjust Difficulty</span>
                  <span className="font-mono">D = {modifiedDifficulty.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={modifiedDifficulty}
                  onChange={(e) => setModifiedDifficulty(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                  aria-label="Adjust difficulty slider"
                />
              </div>
            )}

            {/* Structured Reason Taxonomy (N10.10) */}
            {selectedAction !== 'ACCEPT' && (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label htmlFor="reason-select" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Structured Pedagogical Reason
                </label>
                <select
                  id="reason-select"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INCORRECT_DIAGNOSIS">Incorrect Skill Diagnosis</option>
                  <option value="WRONG_DIFFICULTY">Wrong Difficulty Calibration</option>
                  <option value="WRONG_CONTENT">Content / Syllabus Misalignment</option>
                  <option value="LEARNER_CONTEXT">Unobserved Learner Context (Absence / Fatigue)</option>
                  <option value="TIMING_ISSUE">Session Pacing / Time Remaining</option>
                  <option value="ALREADY_MASTERED">Verified Prior Physical Mastery</option>
                  <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence (Premature Jump)</option>
                  <option value="OTHER">Other Custom Pedagogical Note</option>
                </select>
              </div>
            )}

            {/* Teacher Qualitative Notes */}
            <div className="space-y-1.5">
              <label htmlFor="teacher-notes" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Pedagogical Notes (Optional)
              </label>
              <textarea
                id="teacher-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add observational notes to guide model calibration..."
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all ${
                isSubmitted
                  ? 'bg-green-600'
                  : selectedAction === 'ACCEPT'
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitted ? 'Decision Recorded' : isSubmitting ? 'Recording...' : 'Commit Pedagogical Decision'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
