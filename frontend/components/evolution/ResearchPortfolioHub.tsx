'use client';

import React, { useState } from 'react';

interface ResearchTrack {
  id: string;
  name: string;
  focus: string;
  activeStudies: number;
  primaryMetric: string;
  status: 'ACTIVE' | 'PEER_REVIEW' | 'COMPLETED';
}

interface ModelRecord {
  id: string;
  name: string;
  family: string;
  version: string;
  stage: string;
  status: string;
  aucRoc: number;
  accuracy: number;
  latencyMs: number;
}

export function ResearchPortfolioHub() {
  const [activeTab, setActiveTab] = useState<'TRACKS' | 'MODELS' | 'GAPS'>('MODELS');

  const tracks: ResearchTrack[] = [
    { id: 'R1', name: 'Adaptive Algorithms', focus: 'BKT vs DKT sequence modeling', activeStudies: 2, primaryMetric: 'AUC-ROC 0.83', status: 'ACTIVE' },
    { id: 'R2', name: 'Spaced Repetition', focus: 'Exponential decay half-life scheduling', activeStudies: 1, primaryMetric: '60d Retention +28%', status: 'PEER_REVIEW' },
    { id: 'R3', name: 'Retrieval Practice', focus: 'Active recall vs passive text reviews', activeStudies: 2, primaryMetric: 'Transfer Gain +34%', status: 'ACTIVE' },
    { id: 'R4', name: 'Feedback Dynamics', focus: 'Timing of scaffolding interventions', activeStudies: 1, primaryMetric: 'Error Drop 42%', status: 'ACTIVE' },
    { id: 'R5', name: 'Difficulty Calibration', focus: 'Dynamic ZPD adaptation', activeStudies: 2, primaryMetric: 'Frustration Drop 31%', status: 'ACTIVE' },
    { id: 'R6', name: 'Multimodal Instruction', focus: 'Cross-modal cognitive parity', activeStudies: 1, primaryMetric: 'Parity 94.2%', status: 'ACTIVE' },
    { id: 'R7', name: 'Metacognitive Calibration', focus: 'Confidence vs objective performance', activeStudies: 3, primaryMetric: 'Calibration Delta 0.08', status: 'ACTIVE' },
    { id: 'R8', name: 'Far Transfer', focus: 'Unfamiliar schema generalization', activeStudies: 2, primaryMetric: 'Far Transfer 68.4%', status: 'ACTIVE' },
    { id: 'R9', name: 'Anti-Dependency', focus: 'Scaffolding against AI overreliance', activeStudies: 2, primaryMetric: 'Independent Solve +35%', status: 'ACTIVE' },
    { id: 'R10', name: 'Teacher Collaboration', focus: 'Teacher workload & agency retention', activeStudies: 1, primaryMetric: 'Time Saved 145 hrs', status: 'ACTIVE' },
    { id: 'R11', name: 'Longitudinal Trajectories', focus: 'Multi-year conceptual stability', activeStudies: 1, primaryMetric: 'Decay Factor 0.04', status: 'ACTIVE' },
    { id: 'R12', name: 'Universal Accessibility', focus: 'Assistive cross-modal completion', activeStudies: 2, primaryMetric: 'Completion 91.5%', status: 'ACTIVE' },
  ];

  const models: ModelRecord[] = [
    {
      id: 'MODEL-BKT-PROD-V2',
      name: 'Bayesian Knowledge Tracing Prod',
      family: 'BKT',
      version: '2.4.1',
      stage: 'GA (General Availability)',
      status: 'APPROVED',
      aucRoc: 0.76,
      accuracy: 0.74,
      latencyMs: 12,
    },
    {
      id: 'MODEL-DKT-SHADOW-V1',
      name: 'Deep Knowledge Tracing Sequence Model',
      family: 'DKT (LSTM Attention)',
      version: '1.2.0',
      stage: 'SHADOW MODE',
      status: 'SHADOW',
      aucRoc: 0.83,
      accuracy: 0.81,
      latencyMs: 45,
    },
    {
      id: 'MODEL-IRT-PILOT-V1',
      name: 'Multidimensional Item Response Engine',
      family: 'IRT (3-PL)',
      version: '1.0.4',
      stage: 'CONTROLLED PILOT',
      status: 'EXPERIMENTAL',
      aucRoc: 0.79,
      accuracy: 0.77,
      latencyMs: 18,
    },
  ];

  const gaps = [
    {
      id: 'GAP-EARLY-VOICE-001',
      domain: 'Early Childhood Phonics (Ages 3-7)',
      severity: 'HIGH',
      description: 'Longitudinal retention of synthetic speech vs real human voice prompts in phonemic awareness.',
      status: 'IDENTIFIED',
    },
    {
      id: 'GAP-TRANSFER-GEOM-002',
      domain: 'Secondary Geometry Proofs (Ages 13-18)',
      severity: 'MEDIUM',
      description: 'Step-wise proof generation transfer to novel non-Euclidean spatial tasks.',
      status: 'STUDY_ASSIGNED',
    },
  ];

  const promotionStages = [
    'Research',
    'Offline Eval',
    'Shadow Mode',
    'Controlled Pilot',
    'Independent Review',
    'Approved',
    'Limited Prod',
    'GA',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Research Portfolio & Model Registry</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Clauses N17.11–N17.17
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            12-Track Learning Science Research Portfolio, head-to-head model competition, and 8-stage promotion pipeline.
          </p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('MODELS')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'MODELS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Model Competition
          </button>
          <button
            onClick={() => setActiveTab('TRACKS')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'TRACKS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            12 Research Tracks
          </button>
          <button
            onClick={() => setActiveTab('GAPS')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'GAPS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Evidence Gaps
          </button>
        </div>
      </div>

      {/* TAB 1: MODEL COMPETITION & 8-STAGE PROMOTION PIPELINE */}
      {activeTab === 'MODELS' && (
        <div className="space-y-6">
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">8-Stage Model Promotion Pipeline (Clause N17.14)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {promotionStages.map((st, idx) => (
                <div
                  key={st}
                  className={`p-2.5 rounded-lg border text-center ${
                    idx === 7
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : idx === 2
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                      : idx === 3
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] block font-mono text-slate-500">Step {idx + 1}</span>
                  <span className="text-xs font-bold block mt-0.5">{st}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Gate Invariant: Advancing past Controlled Pilot requires explicit independent Safety Review ID & AUC-ROC &gt; 0.75.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Active Personalization Models in Competition</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {models.map((m) => (
                <div key={m.id} className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-indigo-400 block">{m.family}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{m.name}</h4>
                      <span className="text-[10px] text-slate-500">v{m.version} • {m.id}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        m.stage.startsWith('GA')
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                          : m.stage.includes('SHADOW')
                          ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30'
                          : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {m.stage}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block">AUC-ROC</span>
                      <span className="text-sm font-black text-emerald-400">{m.aucRoc}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Accuracy</span>
                      <span className="text-sm font-black text-cyan-400">{(m.accuracy * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Latency</span>
                      <span className="text-sm font-black text-indigo-400">{m.latencyMs}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 12 RESEARCH TRACKS */}
      {activeTab === 'TRACKS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tracks.map((t) => (
            <div key={t.id} className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/30">
                  Track {t.id}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">{t.status}</span>
              </div>
              <h4 className="text-sm font-bold text-white">{t.name}</h4>
              <p className="text-xs text-slate-400">{t.focus}</p>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs">
                <span className="text-slate-500">Active Studies: <strong className="text-slate-300">{t.activeStudies}</strong></span>
                <span className="text-cyan-400 font-mono text-[11px]">{t.primaryMetric}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: EVIDENCE GAPS */}
      {activeTab === 'GAPS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Identified Empirical Evidence Gaps</span>
            <span className="text-xs text-amber-400 font-mono">2 Active Open Gaps</span>
          </div>
          <div className="space-y-3">
            {gaps.map((g) => (
              <div key={g.id} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300">{g.id}</span>
                    <span className="text-xs font-semibold text-white">• {g.domain}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/50 text-rose-400 border border-rose-500/30">
                    Severity: {g.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{g.description}</p>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                  <span>Status: <strong className="text-indigo-400">{g.status}</strong></span>
                  <span>Independent Research Study Required</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
