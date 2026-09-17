"use client";

import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  TrendingUp,
  Clock,
  Shuffle,
  ShieldCheck,
  Award,
  Layers,
} from 'lucide-react';

export interface PersonalizationAnalyticsDashboardProps {
  tenantId?: string;
  initialPolicyVersion?: string;
}

export const PersonalizationAnalyticsDashboard: React.FC<PersonalizationAnalyticsDashboardProps> = ({
  tenantId = 'tenant-modern-school',
  initialPolicyVersion = 'POLICY_V2_ENHANCED',
}) => {
  const [activePolicy, setActivePolicy] = useState<string>(initialPolicyVersion);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  const handleRollback = (targetVersion: string) => {
    setIsRollingBack(true);
    setTimeout(() => {
      setActivePolicy(targetVersion);
      setIsRollingBack(false);
      setRollbackSuccess(`Policy successfully rolled back to ${targetVersion} at ${new Date().toLocaleTimeString()}`);
      setTimeout(() => setRollbackSuccess(null), 4000);
    }, 500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 text-gray-900 dark:text-gray-100">
      {/* Header & Policy Version */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Personalization & Adaptation Engine</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
              N10 Deep Personalization
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Governed Learning Loop • Active Policy: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{activePolicy}</code>
          </p>
        </div>

        {/* Reversible Policy Rollback Controls (N10.34, N10.47) */}
        <div className="flex items-center gap-2">
          {activePolicy === 'POLICY_V2_ENHANCED' ? (
            <button
              type="button"
              disabled={isRollingBack}
              onClick={() => handleRollback('POLICY_V1_BASELINE')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isRollingBack ? 'Reverting...' : 'Rollback to Policy V1'}
            </button>
          ) : (
            <button
              type="button"
              disabled={isRollingBack}
              onClick={() => handleRollback('POLICY_V2_ENHANCED')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" />
              {isRollingBack ? 'Deploying...' : 'Deploy Policy V2 (Enhanced)'}
            </button>
          )}
        </div>
      </div>

      {/* Rollback Alert Banner */}
      {rollbackSuccess && (
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-4 rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5 text-sm text-green-900 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>{rollbackSuccess}</span>
          </div>
          <span className="text-xs font-mono bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
            Zero Data Loss
          </span>
        </div>
      )}

      {/* 10 Personalization Signals Grid (N10.48) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Adaptive Learners */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Adaptive Learners</span>
            <Brain className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold">24 / 24</div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">100% On Personalization</p>
        </div>

        {/* 2. Recommendation Acceptance */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Rec. Acceptance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">85.9%</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">67 Accepted / 78 Reviews</p>
        </div>

        {/* 3. Teacher Override Rate */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Teacher Overrides</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">14.1%</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Normal Range (10–20%)</p>
        </div>

        {/* 4. Mastery Gain (Delta M) */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mastery Gain (ΔM)</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">+0.37 ΔM</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pre: 0.42 &rarr; Post: 0.79</p>
        </div>

        {/* 5. Retention Gain (Day 7 / 14 Recall) */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Retention (D+7)</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">76.4%</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Target: &ge; 70.0% Delayed</p>
        </div>

        {/* 6. Transfer Gain (Word Problems) */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Transfer Accuracy</span>
            <Shuffle className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">74.2%</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Target: &ge; 65.0%</p>
        </div>

        {/* 7. Time to Mastery */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pacing / Velocity</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold">4.2 Sess.</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Per Topic Graduation</p>
        </div>

        {/* 8. Remediation Success */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Remediation Exit</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">87.5%</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">14 of 16 Recovered M &ge; 0.80</p>
        </div>

        {/* 9. Safety & Guardrails */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Personalization Safety</span>
            <ShieldCheck className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">0 Crisis</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Zero Inappropriate Items</p>
        </div>

        {/* 10. Decision Latency & Cost */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Decision Speed & Cost</span>
            <Brain className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold">12ms • $0</div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Deterministic Engine</p>
        </div>
      </div>
    </div>
  );
};
