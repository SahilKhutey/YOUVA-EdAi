'use client';

import React, { useState, useEffect } from 'react';

export interface PathwayStep {
  stepIndex: number;
  title: string;
  description: string;
  targetCapabilityId: string;
  actionType: 'BUILD' | 'SOLVE' | 'COLLABORATE' | 'REFLECT';
  estimatedHours: number;
  completed: boolean;
}

export interface LearningPathway {
  id: string;
  type: 'PROJECT_BASED' | 'PRACTICE_DRIVEN' | 'MENTOR_ASSISTED' | 'ACCELERATED_SYNTHESIS';
  title: string;
  description: string;
  steps: PathwayStep[];
  estimatedTotalHours: number;
  isAiScaffolded: boolean;
}

export interface LearnerGoal {
  id: string;
  learnerId: string;
  targetCapabilityId: string;
  title: string;
  rationale: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
  targetDate: string;
  activePathwayId?: string;
  pathways: LearningPathway[];
  currentProgressPct: number;
}

export default function LearnerGoalPathwayConsole({ learnerId = 'learner-alex-001' }: { learnerId?: string }) {
  const [goals, setGoals] = useState<LearnerGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<LearnerGoal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`/api/v1/capability/goals/learner/${learnerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGoals(data);
          if (data.length > 0) setSelectedGoal(data[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [learnerId]);

  const activePathway = selectedGoal?.pathways.find((p) => p.id === selectedGoal.activePathwayId) || selectedGoal?.pathways[0];

  const handleStepComplete = async (goalId: string, pathwayId: string, stepIndex: number) => {
    try {
      const res = await fetch(`/api/v1/capability/goals/${goalId}/complete-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathwayId, stepIndex }),
      });
      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        setSelectedGoal(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchPathway = async (goalId: string, pathwayId: string) => {
    try {
      const res = await fetch(`/api/v1/capability/goals/${goalId}/pathway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathwayId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        setSelectedGoal(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Lifelong Capability Goals & Adaptive Pathways</h2>
          <p className="text-xs text-slate-400">
            Learner Agency First | Clause N20.22: Multi-Pathway Progression without Algorithmic Coercion
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs rounded-full font-mono">
          Learner ID: {learnerId}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Goal Selector */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Goals</h3>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading goals...</div>
          ) : goals.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No active goals found for this learner.</div>
          ) : (
            goals.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedGoal(g)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedGoal?.id === g.id
                    ? 'bg-purple-950/20 border-purple-500/80 shadow-md'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-purple-400">{g.targetCapabilityId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                    {g.status}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">{g.title}</h4>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Progress</span>
                    <span className="font-mono text-purple-300">{g.currentProgressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all" style={{ width: `${g.currentProgressPct}%` }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Goal Pathway Breakdown */}
        <div className="lg:col-span-8">
          {selectedGoal ? (
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-purple-400">{selectedGoal.targetCapabilityId}</span>
                  <span className="text-xs text-slate-400">Target Date: {new Date(selectedGoal.targetDate).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-100">{selectedGoal.title}</h3>
                <p className="text-xs text-slate-400 mt-1 italic">{selectedGoal.rationale}</p>
              </div>

              {/* Pathway Type Switcher */}
              <div className="border-t border-slate-800 pt-3">
                <span className="text-xs font-semibold text-slate-300 block mb-2">Available Pathway Strategies:</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {selectedGoal.pathways.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSwitchPathway(selectedGoal.id, p.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        activePathway?.id === p.id
                          ? 'bg-purple-900/40 border-purple-500 text-slate-100'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-[10px] font-mono text-purple-400">{p.type}</div>
                      <div className="text-xs font-semibold mt-0.5">{p.title.split(':')[0]}</div>
                      <div className="text-[11px] text-slate-400 mt-1">~{p.estimatedTotalHours} hours</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pathway Steps List */}
              {activePathway && (
                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{activePathway.title}</h4>
                      <p className="text-[11px] text-slate-400">{activePathway.description}</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {activePathway.isAiScaffolded ? 'AI Scaffolded' : 'Unassisted Autonomous'}
                    </span>
                  </div>

                  <div className="space-y-2 mt-2">
                    {activePathway.steps.map((s) => (
                      <div
                        key={s.stepIndex}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                          s.completed ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-slate-800/40 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                              s.completed ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {s.stepIndex}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-200">{s.title}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-purple-300">
                                {s.actionType}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{s.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">{s.estimatedHours}h</span>
                          <button
                            disabled={s.completed}
                            onClick={() => handleStepComplete(selectedGoal.id, activePathway.id, s.stepIndex)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                              s.completed
                                ? 'bg-emerald-900/40 text-emerald-400 cursor-default'
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {s.completed ? 'Completed' : 'Verify Step'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500 border border-slate-800 rounded-xl">
              Select a goal to view pathways and verify step progression.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
