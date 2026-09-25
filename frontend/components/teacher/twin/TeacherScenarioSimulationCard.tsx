'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Eye,
  FileText,
  Play,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  learningTwinApi,
  LearningScenario,
  SimulationResult,
} from '@/lib/api/learningTwinApi';

interface TeacherScenarioSimulationCardProps {
  scenario: LearningScenario;
  onSimulationComplete?: (result: SimulationResult) => void;
}

export const TeacherScenarioSimulationCard: React.FC<TeacherScenarioSimulationCardProps> = ({
  scenario,
  onSimulationComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(
    scenario.results && scenario.results.length > 0 ? scenario.results[0] : null,
  );

  const handleSimulate = async () => {
    try {
      setLoading(true);
      const res = await learningTwinApi.simulateScenario(scenario.id, 'TEACHER');
      setResult(res);
      onSimulationComplete?.(res);
    } catch (err) {
      console.error('Teacher simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">{scenario.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{scenario.objective}</p>
          </div>
        </div>

        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            scenario.status === 'COMPLETED'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : scenario.status === 'SIMULATING'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {scenario.status}
        </span>
      </div>

      {/* Changes Preview */}
      <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
        <div className="text-slate-400 font-medium">Proposed Sequence Modification:</div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-mono text-indigo-400 font-semibold">
            {scenario.changes?.[0]?.operation ?? 'MODIFY'}
          </span>
          <span>Entity: {scenario.changes?.[0]?.targetId}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-500">
            {JSON.stringify(scenario.changes?.[0]?.proposedState ?? {})}
          </span>
        </div>
      </div>

      {/* Simulation Result Preview */}
      {result ? (
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[11px]">Affected Learners</div>
              <div className="font-bold text-slate-200 mt-1">
                {result.projected.affectedLearners}
              </div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[11px]">Workload Delta</div>
              <div className="font-bold text-indigo-400 mt-1">
                +{result.projected.estimatedTeacherWorkloadDeltaPct}%
              </div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[11px]">Conflicts</div>
              <div
                className={`font-bold mt-1 ${
                  result.conflicts.length > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {result.conflicts.length}
              </div>
            </div>
          </div>

          {result.conflicts.length > 0 && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold">Prerequisite Warning:</span>{' '}
                {result.conflicts[0].explanation}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic text-center py-2">
          Simulation has not been executed for this proposal yet.
        </div>
      )}

      {/* Actions & Non-Mutation Assurance */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-mutation simulation</span>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition shadow-lg shadow-indigo-600/20"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {result ? 'Re-simulate' : 'Simulate in Twin'}
        </button>
      </div>
    </div>
  );
};
