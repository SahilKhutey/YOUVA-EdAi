'use client';

import React, { useState } from 'react';

export const MASTER_LOOP_STAGES = [
  { id: 'OBSERVE', name: 'Observe', desc: 'Active awareness of cognitive state, context, and curiosity', type: 'COGNITIVE' },
  { id: 'UNDERSTAND', name: 'Understand', desc: 'Conceptual framing and schema assimilation', type: 'COGNITIVE' },
  { id: 'LEARN', name: 'Learn', desc: 'Multi-modal instruction and structured inquiry', type: 'LEARNING' },
  { id: 'PRACTICE', name: 'Practice', desc: 'Deliberate practice with immediate formative feedback', type: 'LEARNING' },
  { id: 'DEMONSTRATE', name: 'Demonstrate', desc: 'Observable application of skill in targeted scenario', type: 'DEMONSTRATION' },
  { id: 'ASSESS', name: 'Assess', desc: 'Multi-method authentic capability assessment', type: 'EVIDENCE' },
  { id: 'VALIDATE', name: 'Validate', desc: 'Independent triangulation of demonstrated evidence', type: 'EVIDENCE' },
  { id: 'BUILD_CAPABILITY', name: 'Build Capability', desc: 'Synthesizing validated skills into durable capability', type: 'CAPABILITY' },
  { id: 'TRANSFER', name: 'Transfer', desc: 'Cross-domain problem solving and unfamiliar application', type: 'CAPABILITY' },
  { id: 'APPLY', name: 'Apply', desc: 'Real-world deployment in authentic context or project', type: 'APPLICATION' },
  { id: 'CREATE', name: 'Create', desc: 'Novel synthesis, original artifact, or problem formulation', type: 'CREATION' },
  { id: 'CONTRIBUTE', name: 'Contribute', desc: 'Sharing artifact or solution with community ecosystem', type: 'COMMUNITY' },
  { id: 'TEACH', name: 'Teach', desc: 'Explaining, mentoring, or pedagogical articulation', type: 'PEER' },
  { id: 'REFLECT', name: 'Reflect', desc: 'Metacognitive self-evaluation and strategy calibration', type: 'METACOGNITION' },
  { id: 'MEASURE', name: 'Measure', desc: 'Longitudinal impact and capability retention analysis', type: 'MEASUREMENT' },
  { id: 'VERIFY', name: 'Verify', desc: 'External verification against global standard ontology', type: 'VERIFICATION' },
  { id: 'IMPROVE', name: 'Improve', desc: 'Targeted refinement of identified capability frontiers', type: 'EVOLUTION' },
  { id: 'REVALIDATE', name: 'Revalidate', desc: 'Periodic freshness revalidation and lifelong renewal', type: 'LIFELONG' },
] as const;

export default function MasterLoopVisualizer() {
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(3); // Default 'PRACTICE'
  const [iteration, setIteration] = useState<number>(1);
  const [artifacts, setArtifacts] = useState<Array<{ stage: string; uri: string; time: string }>>([
    { stage: 'OBSERVE', uri: 'youva://artifacts/obs_0921', time: '2026-09-19 14:10' },
    { stage: 'UNDERSTAND', uri: 'youva://artifacts/concept_map_0922', time: '2026-09-19 14:45' },
    { stage: 'LEARN', uri: 'youva://artifacts/interactive_notebook_0923', time: '2026-09-19 15:30' },
  ]);
  const [newArtifactUri, setNewArtifactUri] = useState<string>('');

  const currentStage = MASTER_LOOP_STAGES[currentStageIndex];

  const handleNextStage = () => {
    if (currentStageIndex === MASTER_LOOP_STAGES.length - 1) {
      // Loop re-entry
      setCurrentStageIndex(0);
      setIteration((prev) => prev + 1);
    } else {
      setCurrentStageIndex((prev) => prev + 1);
    }
  };

  const handleAddArtifact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtifactUri.trim()) return;
    setArtifacts([
      ...artifacts,
      {
        stage: currentStage.id,
        uri: newArtifactUri.trim(),
        time: new Date().toISOString().substring(0, 16).replace('T', ' '),
      },
    ]);
    setNewArtifactUri('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              N∞ Operating Infrastructure
            </span>
            <span className="text-xs text-slate-400 font-mono">Loop Iteration #{iteration}</span>
          </div>
          <h2 className="text-2xl font-bold mt-1 text-white tracking-tight">
            18-Stage Continuous Human Learning Master Loop
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Governed by YOUVA-N-INFINITY-CONSTITUTION-2026 Clause N∞.4 &amp; N∞.64.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleNextStage}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-900/30 flex items-center gap-2"
          >
            <span>Advance Stage</span>
            <span className="text-xs opacity-75">→</span>
          </button>
        </div>
      </div>

      {/* 18-Stage Interactive Stepper */}
      <div className="py-6 overflow-x-auto scrollbar-thin">
        <div className="flex items-center min-w-[1200px] gap-2 pb-2">
          {MASTER_LOOP_STAGES.map((stage, idx) => {
            const isCurrent = idx === currentStageIndex;
            const isCompleted = idx < currentStageIndex;
            return (
              <div
                key={stage.id}
                onClick={() => setCurrentStageIndex(idx)}
                className={`flex-1 cursor-pointer p-2.5 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : isCompleted
                    ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider mb-1">
                  {idx + 1}. {stage.type}
                </div>
                <div
                  className={`text-xs font-semibold truncate ${
                    isCurrent ? 'text-emerald-400' : isCompleted ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {stage.name}
                </div>
                <div className="mt-2 flex justify-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCurrent
                        ? 'bg-emerald-400 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-600'
                        : 'bg-slate-700'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Stage Details & Artifact Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
        {/* Left 2 Cols: Active Stage Inspector */}
        <div className="lg:col-span-2 bg-slate-950/50 p-5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Stage #{currentStageIndex + 1} of 18 — {currentStage.type}
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              Status: {currentStageIndex <= 2 ? 'VERIFIED' : 'ACTIVE IN PROGRESS'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{currentStage.name}</h3>
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">{currentStage.desc}</p>

          {/* Form to attach artifact */}
          <form onSubmit={handleAddArtifact} className="mt-4 pt-4 border-t border-slate-800/60 flex gap-2">
            <input
              type="text"
              placeholder="Attach demonstrated evidence URI (e.g., youva://evidence/p92...)"
              value={newArtifactUri}
              onChange={(e) => setNewArtifactUri(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition border border-slate-700"
            >
              Attach Artifact
            </button>
          </form>
        </div>

        {/* Right Col: Evidence Artifacts Ledger */}
        <div className="bg-slate-950/50 p-5 rounded-lg border border-slate-800/80 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-200">Stage Artifacts Ledger</h4>
            <span className="text-xs font-mono text-slate-400">{artifacts.length} items</span>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[180px] pr-1">
            {artifacts.map((art, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-400 font-mono">{art.stage}</span>
                  <span className="text-[10px] text-slate-500">{art.time}</span>
                </div>
                <span className="text-slate-300 font-mono truncate">{art.uri}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
