'use client';

import React, { useState, useEffect } from 'react';

export interface EcosystemNode {
  id: string;
  type: string;
  label: string;
  organizationId: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface EcosystemEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
  authority: string;
  confidence: number;
  scope: string;
  status: 'SUPPORTED' | 'PROBABLE' | 'CANDIDATE' | 'DISPUTED' | 'UNCERTAIN' | 'STALE';
  version: number;
  timestamp: string;
}

export default function EcosystemGraphExplorer() {
  const [nodes, setNodes] = useState<EcosystemNode[]>([]);
  const [edges, setEdges] = useState<EcosystemEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<EcosystemNode | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/ecosystem/nodes').then((r) => r.json()),
      fetch('/api/v1/ecosystem/edges').then((r) => r.json()),
    ])
      .then(([nodesData, edgesData]) => {
        if (Array.isArray(nodesData)) {
          setNodes(nodesData);
          if (nodesData.length > 0) setSelectedNode(nodesData[0]);
        }
        if (Array.isArray(edgesData)) setEdges(edgesData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const nodeTypes = ['ALL', ...Array.from(new Set(nodes.map((n) => n.type)))];
  const filteredNodes = selectedType === 'ALL' ? nodes : nodes.filter((n) => n.type === selectedType);

  const getStatusBadge = (status: EcosystemEdge['status']) => {
    const colors: Record<string, string> = {
      SUPPORTED: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      PROBABLE: 'bg-blue-950/80 text-blue-300 border-blue-800',
      CANDIDATE: 'bg-purple-950/80 text-purple-300 border-purple-800',
      DISPUTED: 'bg-rose-950/80 text-rose-300 border-rose-800',
      UNCERTAIN: 'bg-amber-950/80 text-amber-300 border-amber-800',
      STALE: 'bg-slate-800 text-slate-400 border-slate-700',
    };
    return colors[status] || 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const inboundEdges = selectedNode ? edges.filter((e) => e.targetId === selectedNode.id) : [];
  const outboundEdges = selectedNode ? edges.filter((e) => e.sourceId === selectedNode.id) : [];

  return (
    <div className="space-y-6">
      {/* Constitutional Invariant Header */}
      <div className="p-4 bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900 border border-blue-800/40 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌐</span>
          <div>
            <h2 className="text-lg font-bold text-blue-200">Global Learning Ecosystem Graph</h2>
            <p className="text-xs text-blue-300/80 font-mono">
              Governed by YOUVA-N21-CHARTER-2026 | Clause N21.3: 7-Layer Non-Equivalence & Explicit Uncertainty
            </p>
          </div>
        </div>
        <div className="mt-3 p-2 bg-slate-900/90 rounded border border-slate-800 text-xs text-slate-300">
          <span className="text-blue-400 font-semibold">Invariant Check:</span> Learner Truth &ne; Institution Truth &ne; Evidence Truth &ne; Credential Truth &ne; Capability Truth &ne; Opportunity Truth &ne; Employment Truth.
        </div>
      </div>

      {/* Node Type Filters */}
      <div className="flex flex-wrap gap-2">
        {nodeTypes.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedType === t
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nodes List */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ecosystem Entities</h3>
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading ecosystem graph...</div>
          ) : (
            filteredNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedNode?.id === node.id
                    ? 'bg-blue-950/20 border-blue-500/80 shadow-md'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-blue-400">{node.type}</span>
                  <span className="text-slate-500 font-mono">{node.organizationId}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">{node.label}</h4>
                <div className="mt-2 text-[11px] text-slate-400">ID: {node.id}</div>
              </div>
            ))
          )}
        </div>

        {/* Selected Node Lineage & Governed Edges */}
        <div className="lg:col-span-6">
          {selectedNode ? (
            <div className="sticky top-6 p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono uppercase text-blue-400">{selectedNode.type}</span>
                <h3 className="text-base font-bold text-slate-100">{selectedNode.label}</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">Org: {selectedNode.organizationId}</p>
              </div>

              {/* Outbound Edges */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300">Outbound Relationships ({outboundEdges.length})</h4>
                {outboundEdges.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No outbound relationships recorded.</div>
                ) : (
                  outboundEdges.map((e) => (
                    <div key={e.id} className="p-2.5 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-purple-300">{e.relationshipType} &rarr; {e.targetId}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${getStatusBadge(e.status)}`}>
                          {e.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Authority: {e.authority}</span>
                        <span>Confidence: <strong className="text-emerald-400 font-mono">{Math.round(e.confidence * 100)}%</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Inbound Edges */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <h4 className="text-xs font-semibold text-slate-300">Inbound Relationships ({inboundEdges.length})</h4>
                {inboundEdges.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No inbound relationships recorded.</div>
                ) : (
                  inboundEdges.map((e) => (
                    <div key={e.id} className="p-2.5 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-cyan-300">{e.sourceId} &rarr; {e.relationshipType}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${getStatusBadge(e.status)}`}>
                          {e.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Authority: {e.authority}</span>
                        <span>Confidence: <strong className="text-emerald-400 font-mono">{Math.round(e.confidence * 100)}%</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500 border border-slate-800 rounded-xl">
              Select an entity to inspect governed relationships and provenance lineage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
