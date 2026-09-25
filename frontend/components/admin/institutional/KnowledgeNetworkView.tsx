import React, { useState, useEffect } from 'react';
import {
  institutionalIntelligenceApi,
  BoundedNetworkGraph,
  NetworkNode,
} from '../../../lib/api/institutionalIntelligenceApi';
import {
  Network,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  CheckCircle2,
  ZoomIn,
} from 'lucide-react';

interface KnowledgeNetworkViewProps {
  rootEntityId?: string;
}

export const KnowledgeNetworkView: React.FC<KnowledgeNetworkViewProps> = ({
  rootEntityId = 'root-concept',
}) => {
  const [graph, setGraph] = useState<BoundedNetworkGraph | null>(null);
  const [depth, setDepth] = useState<number>(2);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const data = await institutionalIntelligenceApi.getNetwork(rootEntityId, depth);
      setGraph(data);
      if (data.nodes.length > 0 && !selectedNode) {
        setSelectedNode(data.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load bounded network', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [rootEntityId, depth]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'CONCEPT':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PREREQUISITE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ASSESSMENT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'OUTCOME':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      {/* Header & Depth Control */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="text-blue-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900">Bounded Knowledge Network</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Cross-entity traversal: Concept → Prerequisite → Assessment → Outcome (Max Depth: 4)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <span>Traversal Depth:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value, 10))}
              className="border border-gray-300 rounded px-2 py-1 text-xs font-semibold"
            >
              <option value={1}>Depth 1 (Direct)</option>
              <option value={2}>Depth 2 (Standard)</option>
              <option value={3}>Depth 3 (Extended)</option>
              <option value={4}>Depth 4 (Max Bound)</option>
            </select>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full flex items-center">
            <Shield className="mr-1 w-3 h-3" /> Bounded
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Traversing bounded network...</div>
      ) : graph ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nodes Explorer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase">
              <span>Discovered Entities ({graph.nodes.length})</span>
              <span>Relationships ({graph.edges.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto p-1">
              {graph.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-400'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getNodeColor(
                          node.type,
                        )}`}
                      >
                        {node.type}
                      </span>
                      <span className="text-[10px] text-gray-400">ID: {node.id}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mt-2">{node.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Edge Relational Summary */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 space-y-1">
              <span className="font-bold text-gray-700 uppercase tracking-wider">Connected Paths:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {graph.edges.map((edge, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-[11px]"
                  >
                    <span className="font-semibold text-gray-800">{edge.source}</span>
                    <ArrowRight className="mx-1 w-3 h-3 text-gray-400" />
                    <span className="text-blue-600 font-medium">[{edge.relation}]</span>
                    <ArrowRight className="mx-1 w-3 h-3 text-gray-400" />
                    <span className="font-semibold text-gray-800">{edge.target}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Node Inspector Drawer */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Entity Inspector</div>
            {selectedNode ? (
              <div className="space-y-3">
                <div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getNodeColor(
                      selectedNode.type,
                    )}`}
                  >
                    {selectedNode.type}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">{selectedNode.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Entity ID: {selectedNode.id}</p>
                </div>

                {selectedNode.metadata && (
                  <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-1 text-xs">
                    <span className="font-bold text-gray-700">Metadata Attributes:</span>
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-gray-600">
                        <span className="capitalize">{k}:</span>
                        <span className="font-semibold text-gray-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-blue-900 space-y-1">
                  <span className="font-bold">Systemic Relevance:</span>
                  <p className="text-blue-800">
                    This entity participates in cross-course prerequisite paths and systemic outcome tracking.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">Select an entity to inspect</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
