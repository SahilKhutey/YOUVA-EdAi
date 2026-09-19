'use client';

import React, { useState, useEffect } from 'react';

export interface CapabilityDimensions {
  applicationScore: number;
  independenceScore: number;
  transferScore: number;
  recencyTimestamp: number;
  evidenceStrengthScore: number;
}

export interface Capability {
  id: string;
  slug: string;
  title: string;
  domain: string;
  description: string;
  level: 'FOUNDATION' | 'DEVELOPING' | 'INDEPENDENT' | 'ADVANCED' | 'EXPERT';
  state: 'UNVERIFIED' | 'EMERGING' | 'VALIDATED' | 'PROFICIENT' | 'MASTERY' | 'NEEDS_EVIDENCE' | 'STALE';
  dimensions: CapabilityDimensions;
  prerequisites: string[];
  relatedSkills: string[];
  evidenceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export default function HumanCapabilityGraphExplorer() {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedCap, setSelectedCap] = useState<Capability | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/v1/capability/graph')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCapabilities(data);
          if (data.length > 0) setSelectedCap(data[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const domains = ['ALL', ...Array.from(new Set(capabilities.map((c) => c.domain)))];
  const filtered = selectedDomain === 'ALL'
    ? capabilities
    : capabilities.filter((c) => c.domain === selectedDomain);

  const getLevelBadge = (level: Capability['level']) => {
    const colors: Record<Capability['level'], string> = {
      FOUNDATION: 'bg-slate-700 text-slate-200 border-slate-600',
      DEVELOPING: 'bg-blue-900/60 text-blue-300 border-blue-700',
      INDEPENDENT: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
      ADVANCED: 'bg-purple-900/60 text-purple-300 border-purple-700',
      EXPERT: 'bg-amber-900/60 text-amber-300 border-amber-700',
    };
    return colors[level] || 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const getStateBadge = (state: Capability['state']) => {
    const colors: Record<Capability['state'], string> = {
      UNVERIFIED: 'text-slate-400 border-slate-600',
      EMERGING: 'text-blue-400 border-blue-600',
      VALIDATED: 'text-emerald-400 border-emerald-600',
      PROFICIENT: 'text-cyan-400 border-cyan-600',
      MASTERY: 'text-amber-400 border-amber-500',
      NEEDS_EVIDENCE: 'text-orange-400 border-orange-500',
      STALE: 'text-rose-400 border-rose-500',
    };
    return colors[state] || 'text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Constitutional Invariant Header */}
      <div className="p-4 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-800/40 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌐</span>
          <div>
            <h2 className="text-lg font-bold text-purple-200">YOUVA Human Capability Graph</h2>
            <p className="text-xs text-purple-300/80 font-mono">
              Governed by YOUVA-N20-CHARTER-2026 | Clause N20.68: Non-Equivalence & Multi-Dimensional Independence
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300">
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="font-semibold text-emerald-400">Application & Independence</span>
            <p className="text-[11px] text-slate-400">Authentic context execution without algorithmic scaffolding.</p>
          </div>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="font-semibold text-cyan-400">Transfer & Recency</span>
            <p className="text-[11px] text-slate-400">Cross-domain generalization with continuous evidence decay checks.</p>
          </div>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <span className="font-semibold text-amber-400">Zero Scalar Potential</span>
            <p className="text-[11px] text-slate-400">Human potential is never compressed into a single scalar ranking.</p>
          </div>
        </div>
      </div>

      {/* Domain Filters */}
      <div className="flex flex-wrap gap-2">
        {domains.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDomain(d)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedDomain === d
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Main Grid: Capabilities list & Detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Capability Cards List */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading Human Capability Graph...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No capabilities found in domain.</div>
          ) : (
            filtered.map((cap) => (
              <div
                key={cap.id}
                onClick={() => setSelectedCap(cap)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedCap?.id === cap.id
                    ? 'bg-slate-800/90 border-purple-500/80 shadow-md shadow-purple-950/30'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">
                      {cap.domain}
                    </span>
                    <h3 className="font-semibold text-slate-100 text-sm">{cap.title}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${getLevelBadge(cap.level)}`}>
                      {cap.level}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${getStateBadge(cap.state)}`}>
                      {cap.state}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400 line-clamp-2">{cap.description}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Prereqs: {cap.prerequisites.length}</span>
                  <span>Skills: {cap.relatedSkills.length}</span>
                  <span>Evidence: {cap.evidenceIds.length}</span>
                  <span>Strength: {cap.dimensions.evidenceStrengthScore}%</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Capability Inspector */}
        <div className="lg:col-span-5">
          {selectedCap ? (
            <div className="sticky top-6 p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono uppercase text-purple-400">{selectedCap.domain}</span>
                <h3 className="text-base font-bold text-slate-100">{selectedCap.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{selectedCap.description}</p>
              </div>

              {/* 5-Dimensional Radar / Bars */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Multidimensional Dimensions Profile
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Application (Authentic Scenarios)</span>
                      <span className="font-mono text-emerald-400">{selectedCap.dimensions.applicationScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${selectedCap.dimensions.applicationScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Independence (Unassisted)</span>
                      <span className="font-mono text-blue-400">{selectedCap.dimensions.independenceScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${selectedCap.dimensions.independenceScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Transfer (Cross-Domain)</span>
                      <span className="font-mono text-purple-400">{selectedCap.dimensions.transferScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full" style={{ width: `${selectedCap.dimensions.transferScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Evidence Strength (Cryptographic/Peer)</span>
                      <span className="font-mono text-amber-400">{selectedCap.dimensions.evidenceStrengthScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${selectedCap.dimensions.evidenceStrengthScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Prerequisites & Graph Connections */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <h4 className="text-xs font-semibold text-slate-300">Graph Relationships</h4>
                <div className="text-xs space-y-1 text-slate-400">
                  <div>
                    <span className="text-slate-500">Prerequisites: </span>
                    {selectedCap.prerequisites.length > 0 ? selectedCap.prerequisites.join(', ') : 'None (Foundational)'}
                  </div>
                  <div>
                    <span className="text-slate-500">Related N19 Skills: </span>
                    {selectedCap.relatedSkills.length > 0 ? selectedCap.relatedSkills.join(', ') : 'None'}
                  </div>
                  <div>
                    <span className="text-slate-500">N19 Evidence Anchors: </span>
                    {selectedCap.evidenceIds.length > 0 ? selectedCap.evidenceIds.join(', ') : 'No anchored proofs'}
                  </div>
                </div>
              </div>

              {/* Non-Equivalence Declaration Footer */}
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded text-[11px] text-slate-400">
                <span className="text-purple-400 font-semibold">Invariant Check:</span> Distinct from Skills, Credentials, or Course Completion. Verified under authentic operational constraints.
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500 border border-slate-800 rounded-xl">
              Select a capability to inspect multidimensional profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
