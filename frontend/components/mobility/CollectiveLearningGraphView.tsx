'use client';

import React, { useState } from 'react';

interface LearningGroup {
  groupId: string;
  title: string;
  domain: string;
  membersCount: number;
  complementaryCapabilities: string[];
  activeProject?: string;
}

interface ContributionCard {
  id: string;
  author: string;
  title: string;
  type: string;
  aiDisclosed: boolean;
  aiDetails?: string;
  validationStatus: string;
  roles: Array<{ contributor: string; role: string }>;
}

const SAMPLE_GROUPS: LearningGroup[] = [
  {
    groupId: 'grp_nlp_interpretability_01',
    title: 'Mechanistic Interpretability Study Circle',
    domain: 'Artificial Intelligence',
    membersCount: 4,
    complementaryCapabilities: ['Python', 'Linear Algebra', 'Transformer Mechanics'],
    activeProject: 'Attention Head Attribution in Open Science',
  },
  {
    groupId: 'grp_quantum_compute_02',
    title: 'Quantum Algorithms & Qubits Workshop',
    domain: 'Quantum Computing',
    membersCount: 3,
    complementaryCapabilities: ['Quantum Circuits', 'Complex Analysis', 'Qiskit'],
    activeProject: 'Shor Algorithm Circuit Simulation',
  },
];

const SAMPLE_CONTRIBUTIONS: ContributionCard[] = [
  {
    id: 'contrib_01',
    author: 'Asha Sharma',
    title: 'Visualizing Matrix Transformations for Beginners',
    type: 'OER_TUTORIAL',
    aiDisclosed: true,
    aiDetails: 'Interactive SVG scaffold assisted by AI, narrative and animations authored manually.',
    validationStatus: 'VALIDATED',
    roles: [
      { contributor: 'Asha Sharma', role: 'Primary Author & Animator' },
      { contributor: 'Rohit Verma', role: 'Peer Code Reviewer' },
    ],
  },
  {
    id: 'contrib_02',
    author: 'Rohit Verma',
    title: 'WCAG AAA Color Contrast Automation Script',
    type: 'PROJECT_CODE',
    aiDisclosed: false,
    validationStatus: 'PEER_REVIEWED',
    roles: [{ contributor: 'Rohit Verma', role: 'Sole Author' }],
  },
];

export default function CollectiveLearningGraphView() {
  const [groups] = useState<LearningGroup[]>(SAMPLE_GROUPS);
  const [contributions] = useState<ContributionCard[]>(SAMPLE_CONTRIBUTIONS);
  const [selectedGroup, setSelectedGroup] = useState<LearningGroup>(SAMPLE_GROUPS[0]);

  return (
    <div className="space-y-6">
      {/* Doctrine Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Invariant N23.26 & N23.93: Collective Learning & Non-Equalized Attributable Contribution
          </span>
          Peer groups match on capability complementarity, never on popularity or social rank. Team projects preserve distinct individual contributor roles rather than assigning false equal credit or AI percentage guesses.
        </div>
        <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
          ZERO SOCIAL RANKING
        </span>
      </div>

      {/* Grid: Groups & Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peer Learning Groups */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Peer Learning Groups ({groups.length})
            </h3>
            <span className="text-[10px] text-blue-400 font-mono">Complementarity Matched</span>
          </div>

          <div className="space-y-3">
            {groups.map((g) => (
              <div
                key={g.groupId}
                onClick={() => setSelectedGroup(g)}
                className={`p-4 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedGroup.groupId === g.groupId
                    ? 'bg-blue-950/40 border-blue-600/80 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-white">{g.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                    {g.membersCount} Members
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Domain: {g.domain}</div>

                {g.activeProject && (
                  <div className="mt-2 text-[11px] text-emerald-300 font-mono">
                    Active Project: {g.activeProject}
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Complementary Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {g.complementaryCapabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-blue-300 border border-slate-800"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Contribution Network */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Attributable Knowledge Contributions ({contributions.length})
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Evidence Attested</span>
          </div>

          <div className="space-y-3">
            {contributions.map((c) => (
              <div key={c.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-xs">{c.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">By {c.author}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-blue-950 text-blue-300 border border-blue-900">
                      {c.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-900">
                      {c.validationStatus}
                    </span>
                  </div>
                </div>

                {c.aiDisclosed && (
                  <div className="p-2 rounded bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-200">
                    <span className="font-semibold text-amber-300">AI Contribution Disclosed:</span>{' '}
                    {c.aiDetails}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                    Individual Role Attribution (No Equalization)
                  </span>
                  {c.roles.map((r, i) => (
                    <div key={i} className="flex justify-between text-slate-300 pl-2">
                      <span className="font-medium text-white">{r.contributor}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{r.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
