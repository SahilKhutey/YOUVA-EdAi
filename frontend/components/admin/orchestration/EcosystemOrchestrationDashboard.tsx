'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sliders,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Eye,
  RefreshCw,
  Cpu,
  Layers,
  FileCheck,
  Power,
} from 'lucide-react';
import {
  learningOrchestrationApi,
  LearningOrchestration,
  LearningEscalation,
  KillSwitchStatus,
  OrchestrationScope,
} from '@/lib/api/learningOrchestrationApi';

export const EcosystemOrchestrationDashboard: React.FC = () => {
  const [orchestrations, setOrchestrations] = useState<LearningOrchestration[]>([]);
  const [escalations, setEscalations] = useState<LearningEscalation[]>([]);
  const [killSwitch, setKillSwitch] = useState<KillSwitchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrch, setSelectedOrch] = useState<LearningOrchestration | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [scopeFilter, setScopeFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'workflows' | 'escalations'>('workflows');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orchs, escs, ks] = await Promise.all([
        learningOrchestrationApi.listOrchestrations(),
        learningOrchestrationApi.listEscalations(),
        learningOrchestrationApi.getKillSwitchStatus(),
      ]);
      setOrchestrations(orchs);
      setEscalations(escs);
      setKillSwitch(ks);
    } catch (err) {
      console.error('Failed to load orchestration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKillSwitch = async () => {
    if (!killSwitch) return;
    const nextState = !killSwitch.enabled;
    const confirmMessage = nextState
      ? 'Are you sure you want to RE-ENABLE automated ecosystem orchestration?'
      : 'EMERGENCY: Are you sure you want to ACTIVATE the kill switch? All autonomous executions will be paused or downgraded to manual approval.';
    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      const updated = await learningOrchestrationApi.setKillSwitch(nextState, 'Admin UI');
      setKillSwitch(updated);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle kill switch:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await learningOrchestrationApi.approveOrchestration(id, {
        approvedBy: 'Admin (UI)',
        notes: 'Approved via Ecosystem Orchestration Dashboard',
      });
      await loadData();
      if (selectedOrch?.id === id) {
        const refreshed = await learningOrchestrationApi.getOrchestration(id);
        setSelectedOrch(refreshed);
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      setActionLoading(true);
      await learningOrchestrationApi.pauseOrchestration(id);
      await loadData();
      if (selectedOrch?.id === id) {
        const refreshed = await learningOrchestrationApi.getOrchestration(id);
        setSelectedOrch(refreshed);
      }
    } catch (err) {
      console.error('Pause failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async (id: string) => {
    try {
      setActionLoading(true);
      await learningOrchestrationApi.resumeOrchestration(id);
      await loadData();
      if (selectedOrch?.id === id) {
        const refreshed = await learningOrchestrationApi.getOrchestration(id);
        setSelectedOrch(refreshed);
      }
    } catch (err) {
      console.error('Resume failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this orchestration?')) return;
    try {
      setActionLoading(true);
      await learningOrchestrationApi.cancelOrchestration(id, 'Cancelled via Admin Dashboard');
      await loadData();
      if (selectedOrch?.id === id) {
        const refreshed = await learningOrchestrationApi.getOrchestration(id);
        setSelectedOrch(refreshed);
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspect = async (id: string) => {
    try {
      const detailed = await learningOrchestrationApi.getOrchestration(id);
      setSelectedOrch(detailed);
    } catch (err) {
      console.error('Failed to load orchestration details:', err);
    }
  };

  const handleResolveEscalation = async (id: string) => {
    try {
      setActionLoading(true);
      await learningOrchestrationApi.resolveEscalation(id, 'Admin (UI)', 'Resolved from dashboard');
      await loadData();
    } catch (err) {
      console.error('Failed to resolve escalation:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrchestrations = orchestrations.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (scopeFilter !== 'ALL' && o.scope !== scopeFilter) return false;
    return true;
  });

  const activeCount = orchestrations.filter((o) => o.status === 'EXECUTING').length;
  const awaitingCount = orchestrations.filter((o) => o.status === 'AWAITING_APPROVAL').length;
  const pausedCount = orchestrations.filter((o) => o.status === 'PAUSED').length;
  const openEscalationsCount = escalations.filter((e) => e.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-3">
            <Cpu className="w-8 h-8 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Learning Ecosystem Orchestrator (LEO)
              </h1>
              <p className="text-sm text-slate-400">
                Autonomous coordination, fail-closed safety, and continuous educational evolution.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Kill Switch Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading || actionLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleToggleKillSwitch}
            disabled={actionLoading}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition border ${
              killSwitch?.enabled
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Power className="w-4 h-4" />
            {killSwitch?.enabled ? 'Emergency Kill Switch (Active)' : 'Re-enable Automation'}
          </button>
        </div>
      </div>

      {/* Kill Switch Alert Banner if halted */}
      {killSwitch && !killSwitch.enabled && (
        <div className="bg-rose-950/40 border border-rose-700/60 p-4 rounded-xl flex items-center gap-3 text-rose-200">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-rose-300">KILL SWITCH ACTIVATED: </span>
            All automated ecosystem orchestration is currently HALTED. Workflows are paused or require manual educator approval before executing.
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Workflows</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{activeCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Awaiting Approval</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{awaitingCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paused Workflows</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{pausedCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Escalations</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{openEscalationsCount}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'workflows'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Orchestrations ({orchestrations.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('escalations')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'escalations'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Escalations ({openEscalationsCount})
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-sm">
            <span className="text-slate-400 text-xs font-semibold">STATUS:</span>
            {['ALL', 'AWAITING_APPROVAL', 'EXECUTING', 'PAUSED', 'COMPLETED', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  statusFilter === st
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}

            <span className="text-slate-600 mx-1">|</span>

            <span className="text-slate-400 text-xs font-semibold">SCOPE:</span>
            {['ALL', 'LEARNER', 'CLASS', 'COURSE', 'CURRICULUM', 'TENANT'].map((sc) => (
              <button
                key={sc}
                onClick={() => setScopeFilter(sc)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  scopeFilter === sc
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>

          {/* Orchestrations Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">Objective & Workflow</th>
                    <th className="px-4 py-3">Scope</th>
                    <th className="px-4 py-3">Autonomy Level</th>
                    <th className="px-4 py-3">Trigger</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredOrchestrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No orchestrations found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrchestrations.map((orch) => (
                      <tr key={orch.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{orch.objective}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {orch.workflowId}@{orch.workflowVersion}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">
                            {orch.scope}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-indigo-300">
                            {orch.autonomyLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-400">{orch.triggerType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              orch.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : orch.status === 'EXECUTING'
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : orch.status === 'AWAITING_APPROVAL'
                                ? 'bg-amber-500/20 text-amber-400'
                                : orch.status === 'PAUSED'
                                ? 'bg-sky-500/20 text-sky-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {orch.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleInspect(orch.id)}
                            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                            title="Inspect Details & DAG"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {orch.status === 'AWAITING_APPROVAL' && (
                            <button
                              onClick={() => handleApprove(orch.id)}
                              className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded"
                              title="Approve & Execute"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {orch.status === 'EXECUTING' && (
                            <button
                              onClick={() => handlePause(orch.id)}
                              className="p-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded"
                              title="Pause"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}

                          {orch.status === 'PAUSED' && (
                            <button
                              onClick={() => handleResume(orch.id)}
                              className="p-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded"
                              title="Resume"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {['EXECUTING', 'PAUSED', 'AWAITING_APPROVAL'].includes(orch.status) && (
                            <button
                              onClick={() => handleCancel(orch.id)}
                              className="p-1.5 hover:bg-rose-900/30 text-rose-400 rounded"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Escalations Tab */}
      {activeTab === 'escalations' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {escalations.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 text-center text-slate-500 rounded-xl">
                No learning escalations currently open.
              </div>
            ) : (
              escalations.map((esc) => (
                <div
                  key={esc.id}
                  className={`bg-slate-900 border p-5 rounded-xl space-y-3 ${
                    esc.severity === 'CRITICAL'
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : esc.severity === 'HIGH'
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                          esc.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400'
                            : esc.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {esc.severity}
                      </span>
                      <span className="text-xs text-slate-400">Status: {esc.status}</span>
                    </div>
                    {esc.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveEscalation(esc.id)}
                        className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium rounded border border-emerald-500/30 transition"
                      >
                        Resolve Escalation
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="text-white font-medium text-sm">{esc.reason}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      <span className="text-slate-300 font-semibold">Recommended Action:</span>{' '}
                      {esc.recommendedAction}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Inspector Modal / Drawer */}
      {selectedOrch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Orchestration Details & Explainability</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedOrch.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrch(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Explainability Contract */}
            {selectedOrch.explainability && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase">
                  <FileCheck className="w-4 h-4" />
                  Explainability Contract
                </div>
                <div className="text-sm text-slate-300">
                  <span className="text-slate-500">Trigger Reason:</span>{' '}
                  {selectedOrch.explainability.triggerReason}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500">Autonomy:</span>{' '}
                    {selectedOrch.explainability.policyEvaluated.autonomyLevel}
                  </div>
                  <div>
                    <span className="text-slate-500">Approval Required:</span>{' '}
                    {selectedOrch.explainability.policyEvaluated.requiresHumanApproval ? 'YES' : 'NO'}
                  </div>
                  <div>
                    <span className="text-slate-500">Scope Checked:</span>{' '}
                    {selectedOrch.explainability.policyEvaluated.scopeChecked ? 'PASS' : 'FAIL'}
                  </div>
                  <div>
                    <span className="text-slate-500">Loop Repetition:</span>{' '}
                    {selectedOrch.explainability.policyEvaluated.loopDetected ? 'DETECTED' : 'CLEAR'}
                  </div>
                </div>
                {selectedOrch.explainability.approvedBy && (
                  <div className="text-xs text-emerald-400">
                    Approved by {selectedOrch.explainability.approvedBy} at{' '}
                    {selectedOrch.explainability.approvedAt}
                  </div>
                )}
              </div>
            )}

            {/* Step DAG Visualizer */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Execution Steps (DAG)
              </h4>
              <div className="space-y-2">
                {selectedOrch.steps?.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                        {step.sequence}
                      </div>
                      <div>
                        <div className="font-mono text-white text-xs">{step.actionType}</div>
                        <div className="text-xs text-slate-500">
                          Target: {step.targetType} ({step.targetId})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {step.compensationAction && (
                        <span className="text-xs text-slate-500 font-mono">
                          Rollback: {step.compensationAction}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          step.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : step.status === 'RUNNING'
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : step.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : step.status === 'COMPENSATED'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedOrch(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcosystemOrchestrationDashboard;
