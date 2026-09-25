import React, { useState, useEffect } from 'react';
import {
  learningOptimizationApi,
  KnowledgeEvolutionTree,
  KnowledgeEvolutionNode,
} from '../../../lib/api/learningOptimizationApi';
import {
  GitBranch,
  GitCommit,
  Clock,
  User,
  Cpu,
  RotateCcw,
  TrendingUp,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface KnowledgeEvolutionTimelineProps {
  knowledgeObjectId: string;
}

export const KnowledgeEvolutionTimeline: React.FC<KnowledgeEvolutionTimelineProps> = ({
  knowledgeObjectId,
}) => {
  const [tree, setTree] = useState<KnowledgeEvolutionTree | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeEvolutionNode | null>(null);
  const [provenance, setProvenance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');

  const fetchEvolution = async () => {
    setLoading(true);
    try {
      const data = await learningOptimizationApi.getKnowledgeEvolution(knowledgeObjectId);
      setTree(data);
      if (data.versions.length > 0) {
        const current = data.versions.find((v) => v.version === data.currentVersion) || data.versions[data.versions.length - 1];
        setSelectedNode(current);
        loadProvenance(current.version);
      }
    } catch (err) {
      console.error('Failed to load evolution tree', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProvenance = async (version: number) => {
    try {
      const prov = await learningOptimizationApi.getVersionProvenance(knowledgeObjectId, version);
      setProvenance(prov);
    } catch (err) {
      console.error('Failed to load provenance', err);
    }
  };

  useEffect(() => {
    if (knowledgeObjectId) {
      fetchEvolution();
    }
  }, [knowledgeObjectId]);

  const handleSelectNode = (node: KnowledgeEvolutionNode) => {
    setSelectedNode(node);
    loadProvenance(node.version);
  };

  const handleRollback = async () => {
    if (!selectedNode) return;
    try {
      await learningOptimizationApi.rollbackVersion(knowledgeObjectId, {
        executionId: `rollback-${Date.now()}`,
        strategy: 'RESTORE_VERSION',
        targetVersionId: selectedNode.versionId,
        reason: rollbackReason || 'Teacher initiated rollback to previous stable version',
      });
      setRollbackModalOpen(false);
      await fetchEvolution();
    } catch (err) {
      console.error('Rollback failed', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading knowledge evolution timeline...</div>;
  }

  if (!tree) {
    return <div className="p-8 text-center text-gray-500">No evolution history found.</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitBranch className="text-blue-600 w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900">{tree.title}</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Knowledge Evolution Chain • Current Live Version: V{tree.currentVersion}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedNode && selectedNode.version !== tree.currentVersion && (
            <button
              onClick={() => setRollbackModalOpen(true)}
              className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center"
            >
              <RotateCcw className="mr-1.5 w-3.5 h-3.5" /> Rollback to V{selectedNode.version}
            </button>
          )}
        </div>
      </div>

      {/* Evolution Timeline */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Version History</h3>
        <div className="relative pl-6 border-l-2 border-blue-200 space-y-6">
          {tree.versions.map((v) => {
            const isSelected = selectedNode?.version === v.version;
            const isCurrent = tree.currentVersion === v.version;

            return (
              <div
                key={v.versionId}
                onClick={() => handleSelectNode(v)}
                className={`relative cursor-pointer p-4 rounded-xl border transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[31px] top-5 w-4 h-4 rounded-full border-2 bg-white ${
                    isCurrent ? 'border-emerald-500 bg-emerald-50' : 'border-blue-500'
                  }`}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">Version {v.version}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                        CURRENT LIVE
                      </span>
                    )}
                    {v.aiAssisted && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-semibold rounded-full flex items-center">
                        <Cpu className="mr-1 w-3.5 h-3.5" /> AI Assisted
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : 'Draft'}
                  </span>
                </div>

                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
                  <div className="flex items-center">
                    <User className="mr-1 w-3.5 h-3.5 text-gray-400" /> {v.authorId}
                  </div>
                  <div>
                    Learners Exposed: <span className="font-semibold text-gray-800">{v.learnerCount}</span>
                  </div>
                  {v.primaryMetricDelta && (
                    <div className="text-emerald-600 font-semibold flex items-center">
                      <TrendingUp className="mr-1 w-3.5 h-3.5" /> {v.primaryMetricDelta} observed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provenance Details ("Why This Changed") */}
      {selectedNode && (
        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-bold text-gray-900">
              <Info className="text-blue-600 w-4 h-4" />
              <span>Why Version {selectedNode.version} Exists (Provenance Chain)</span>
            </div>
            <span className="text-xs text-gray-500">Immutable Audit Record</span>
          </div>

          <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
            {provenance?.reason || 'Initial canonical publication.'}
          </div>

          {provenance?.improvementPlan && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded border border-gray-200">
                <span className="font-semibold text-gray-500 uppercase">Improvement Plan</span>
                <div className="mt-1 font-bold text-gray-900">{provenance.improvementPlan.objective}</div>
                <div className="text-gray-500 mt-0.5">Status: {provenance.improvementPlan.status}</div>
              </div>
              <div className="p-3 bg-white rounded border border-gray-200">
                <span className="font-semibold text-gray-500 uppercase">Parent Lineage</span>
                <div className="mt-1 text-gray-900">
                  Derived from: <span className="font-bold">Version {provenance.parentVersion || 'None'}</span>
                </div>
                <div className="text-gray-500 mt-0.5">
                  Historical evidence and learners remain tied to V{provenance.parentVersion || '1'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-rose-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Version Rollback</span>
            </div>
            <p className="text-sm text-gray-600">
              You are rolling back to <span className="font-bold">Version {selectedNode?.version}</span>.
              The current live pointer will be updated, but Version {tree.currentVersion} and historical learner
              evidence will remain permanently in the database for audit integrity.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-700">Rollback Reason (Required)</label>
              <textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder="Describe reason for rolling back..."
                className="w-full mt-1 p-2 border border-gray-300 rounded text-sm h-20"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRollbackModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRollback}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Confirm Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
