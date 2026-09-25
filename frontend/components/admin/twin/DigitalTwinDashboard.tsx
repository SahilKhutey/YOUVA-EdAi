'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileText,
  GitBranch,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  learningTwinApi,
  TwinSnapshot,
  LearningScenario,
  SimulationResult,
  ScenarioComparison,
  ScenarioStatus,
  ScenarioChange,
} from '@/lib/api/learningTwinApi';

export const DigitalTwinDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'snapshots' | 'comparison'>('scenarios');
  const [snapshots, setSnapshots] = useState<TwinSnapshot[]>([]);
  const [scenarios, setScenarios] = useState<LearningScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<LearningScenario | null>(null);
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // New Snapshot Form
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotForm, setSnapshotForm] = useState({
    knowledgeVersionSet: 'KV_2026_09',
    curriculumVersionSet: 'CV_2026_09',
    policyVersionSet: 'PV_2026_09',
    learnerStateSnapshot: 'LS_ACTIVE_COHORT_2026',
    assessmentVersionSet: 'AV_2026_09',
  });

  // New Scenario Form
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [scenarioForm, setScenarioForm] = useState({
    name: '',
    objective: '',
    snapshotId: '',
    targetType: 'CURRICULUM_MODULE',
    targetId: 'MOD_ALGEBRA_02',
    operation: 'MOVE' as const,
  });

  // Comparison selection
  const [baselineId, setBaselineId] = useState('');
  const [targetId, setTargetId] = useState('');

  // Snapshot validation state
  const [validationResult, setValidationResult] = useState<{
    snapshotId: string;
    valid: boolean;
    checksumValid: boolean;
    isStale: boolean;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [snaps, scens] = await Promise.all([
        learningTwinApi.listSnapshots(),
        learningTwinApi.listScenarios(),
      ]);
      setSnapshots(snaps);
      setScenarios(scens);
      if (snaps.length > 0 && !scenarioForm.snapshotId) {
        setScenarioForm((prev) => ({ ...prev, snapshotId: snaps[0].id }));
      }
      if (scens.length > 0 && !selectedScenario) {
        setSelectedScenario(scens[0]);
      }
    } catch (err) {
      console.error('Failed to load digital twin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await learningTwinApi.createSnapshot(snapshotForm);
      setIsSnapshotModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create snapshot:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const changes: ScenarioChange[] = [
        {
          targetType: scenarioForm.targetType,
          targetId: scenarioForm.targetId,
          operation: scenarioForm.operation,
          proposedState: { sequence: 4 },
        },
      ];

      const newScenario = await learningTwinApi.createScenario({
        name: scenarioForm.name,
        objective: scenarioForm.objective,
        snapshotId: scenarioForm.snapshotId,
        changes,
      });

      setIsScenarioModalOpen(false);
      await loadData();
      setSelectedScenario(newScenario);
    } catch (err) {
      console.error('Failed to create scenario:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulate = async (scenarioId: string) => {
    try {
      setActionLoading(true);
      await learningTwinApi.simulateScenario(scenarioId, 'ADMIN');
      await loadData();
      const updated = await learningTwinApi.getScenario(scenarioId);
      setSelectedScenario(updated);
    } catch (err) {
      console.error('Failed to simulate scenario:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (scenarioId: string) => {
    try {
      setActionLoading(true);
      const updated = await learningTwinApi.approveScenario(scenarioId, 'ADMIN');
      await loadData();
      setSelectedScenario(updated);
    } catch (err) {
      console.error('Failed to approve scenario:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (scenarioId: string) => {
    try {
      setActionLoading(true);
      const updated = await learningTwinApi.rejectScenario(scenarioId, 'Rejected during governance review');
      await loadData();
      setSelectedScenario(updated);
    } catch (err) {
      console.error('Failed to reject scenario:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateSnapshot = async (snapshotId: string) => {
    try {
      setActionLoading(true);
      const res = await learningTwinApi.validateSnapshot(snapshotId);
      setValidationResult({ snapshotId, ...res });
    } catch (err) {
      console.error('Failed to validate snapshot:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunComparison = async () => {
    if (!baselineId || !targetId) return;
    try {
      setActionLoading(true);
      const res = await learningTwinApi.compareScenarios(baselineId, targetId);
      setComparison(res);
    } catch (err) {
      console.error('Failed to compare scenarios:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Learning Ecosystem Digital Twin</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                LEDT Active (LKC-15)
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Versioned non-authoritative simulation & predictive intelligence layer. Evaluates educational changes before production deployment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSnapshotModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition"
          >
            <Database className="w-4 h-4 text-indigo-400" />
            New Snapshot
          </button>
          <button
            onClick={() => setIsScenarioModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            New Scenario
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Invariant Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-amber-200 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Invariant Notice:</span> Digital twin simulations are strictly non-authoritative and operate under a zero-mutation guarantee. Simulated metrics and counterfactual projections do not alter canonical student records, live mastery, or production curriculum state.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'scenarios'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Scenarios ({scenarios.length})
        </button>
        <button
          onClick={() => setActiveTab('snapshots')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'snapshots'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Snapshots ({snapshots.length})
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'comparison'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          Scenario Comparison
        </button>
      </div>

      {/* Tab 1: Scenarios */}
      {activeTab === 'scenarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Configured Scenarios</h2>
            {scenarios.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                No scenarios created yet. Click "New Scenario" to model a change.
              </div>
            ) : (
              scenarios.map((scen) => (
                <div
                  key={scen.id}
                  onClick={() => setSelectedScenario(scen)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedScenario?.id === scen.id
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-200 truncate">{scen.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        scen.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : scen.status === 'APPROVED'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : scen.status === 'SIMULATING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          : scen.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {scen.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{scen.objective}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{scen.changes?.length ?? 0} proposed changes</span>
                    <span>{new Date(scen.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Scenario Details & Simulation Result */}
          <div className="lg:col-span-2 space-y-6">
            {selectedScenario ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">{selectedScenario.name}</h2>
                    <p className="text-sm text-slate-400 mt-1">{selectedScenario.objective}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedScenario.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSimulate(selectedScenario.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white transition shadow-lg shadow-indigo-600/20"
                      >
                        <Play className="w-4 h-4" />
                        Run Simulation
                      </button>
                    )}
                    {selectedScenario.status === 'COMPLETED' && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedScenario.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium text-white transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(selectedScenario.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-medium text-white transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleSimulate(selectedScenario.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Re-simulate
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Changes List */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Proposed Mutations
                  </h3>
                  <div className="space-y-2">
                    {selectedScenario.changes?.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono font-semibold">
                            {c.operation}
                          </span>
                          <span className="text-slate-300 font-medium">{c.targetType}</span>
                          <span className="text-slate-500 font-mono">({c.targetId})</span>
                        </div>
                        <span className="text-slate-400">Target State: {JSON.stringify(c.proposedState)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulation Results (if available) */}
                {selectedScenario.results && selectedScenario.results.length > 0 ? (
                  <div className="space-y-6 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        Projected Impact & Metrics
                      </h3>
                      <span className="text-xs text-slate-500">
                        Methodology: {selectedScenario.results[0].methodologyVersion}
                      </span>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-500">Affected Learners</div>
                        <div className="text-2xl font-bold text-slate-100 mt-1">
                          {selectedScenario.results[0].projected.affectedLearners}
                        </div>
                        <div className="text-xs text-indigo-400 mt-1">Cohort scale</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-500">Prerequisite Conflicts</div>
                        <div className="text-2xl font-bold text-amber-400 mt-1">
                          {selectedScenario.results[0].projected.prerequisiteConflicts}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Dependency blocks</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-500">Assessment Conflicts</div>
                        <div className="text-2xl font-bold text-rose-400 mt-1">
                          {selectedScenario.results[0].projected.assessmentConflicts}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Orphaned items</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-500">Teacher Workload Delta</div>
                        <div className="text-2xl font-bold text-slate-100 mt-1">
                          +{selectedScenario.results[0].projected.estimatedTeacherWorkloadDeltaPct}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Grading & reviews</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-500">Remediation Demand Delta</div>
                        <div className="text-2xl font-bold text-slate-100 mt-1">
                          +{selectedScenario.results[0].projected.estimatedRemediationDemandDeltaPct}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Expected attempts</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                        <div className="text-xs text-slate-500">Affected Courses</div>
                        <div className="text-2xl font-bold text-slate-100 mt-1">
                          {selectedScenario.results[0].projected.affectedCourses}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Catalog impact</div>
                      </div>
                    </div>

                    {/* Detected Conflicts */}
                    {selectedScenario.results[0].conflicts.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4" />
                          Detected Structural Conflicts ({selectedScenario.results[0].conflicts.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedScenario.results[0].conflicts.map((conf, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-semibold text-rose-300">
                                <span>{conf.type}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-200">
                                  {conf.severity}
                                </span>
                              </div>
                              <p className="text-rose-200/80">{conf.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scenario Risks */}
                    {selectedScenario.results[0].risks.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          Risk Assessment & Probability Bands
                        </h4>
                        <div className="space-y-2">
                          {selectedScenario.results[0].risks.map((risk, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-medium">
                                <span className="text-slate-200">{risk.category}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                    Prob: {risk.probabilityBand}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                    {risk.severity}
                                  </span>
                                </div>
                              </div>
                              <p className="text-slate-400">{risk.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-950 border border-dashed border-slate-800 rounded-xl">
                    <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Scenario has not been simulated yet.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Execute simulation against the digital twin to calculate impacts and conflicts.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                Select a scenario from the left to view details and simulation results.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Snapshots */}
      {activeTab === 'snapshots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Ecosystem Digital Twin Snapshots
            </h2>
          </div>

          <div className="space-y-3">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-200">{snap.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      Tenant: {snap.tenantId}
                    </span>
                    <span className="text-xs text-slate-500">
                      Captured: {new Date(snap.snapshotTime).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      Knowledge: <strong className="text-slate-200">{snap.knowledgeVersionSet}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      Curriculum: <strong className="text-slate-200">{snap.curriculumVersionSet}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      Policy: <strong className="text-slate-200">{snap.policyVersionSet}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      Cohort: <strong className="text-slate-200">{snap.learnerStateSnapshot}</strong>
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-500">
                    Checksum SHA-256: {snap.checksum}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleValidateSnapshot(snap.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Validate Integrity
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Validation Result Modal / Banner */}
          {validationResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1 ${
                validationResult.valid
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span>Snapshot Validation: {validationResult.snapshotId}</span>
                <span>{validationResult.valid ? 'INTEGRITY VERIFIED' : 'INTEGRITY WARNING'}</span>
              </div>
              <p>Checksum Valid: {validationResult.checksumValid ? 'YES' : 'NO'}</p>
              <p>Freshness: {validationResult.isStale ? 'STALE SNAPSHOT' : 'CURRENT'}</p>
              {validationResult.reason && <p className="text-slate-400">{validationResult.reason}</p>}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Comparison */}
      {activeTab === 'comparison' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Differential Scenario Comparison</h2>
            <p className="text-sm text-slate-400 mt-1">
              Evaluate differences between baseline and alternative learning scenario projections.
            </p>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Baseline Scenario</label>
              <select
                value={baselineId}
                onChange={(e) => setBaselineId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Baseline Scenario...</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Proposed Scenario</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Target Scenario...</option>
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunComparison}
              disabled={!baselineId || !targetId || actionLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition shadow-lg shadow-indigo-600/20"
            >
              <Scale className="w-4 h-4" />
              Compare Scenarios
            </button>
          </div>

          {/* Comparison Output */}
          {comparison && (
            <div className="space-y-6 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Differential Metrics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400">
                      <th className="py-2.5 px-3">Metric</th>
                      <th className="py-2.5 px-3">Baseline</th>
                      <th className="py-2.5 px-3">Proposed</th>
                      <th className="py-2.5 px-3">Differential</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {comparison.metrics.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/40">
                        <td className="py-2.5 px-3 font-medium text-slate-200">{m.metric}</td>
                        <td className="py-2.5 px-3 text-slate-400">{m.baseline} {m.unit}</td>
                        <td className="py-2.5 px-3 text-indigo-400 font-semibold">{m.scenario} {m.unit}</td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              String(m.delta).startsWith('-')
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : String(m.delta) === '0' || String(m.delta) === '0.0%'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {m.delta}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Conflict notice in comparison */}
              {comparison.conflicts.length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-xs">
                  <span className="font-semibold text-rose-400">Target Scenario Introduced Conflicts:</span>
                  <ul className="list-disc list-inside space-y-1 text-rose-200/90">
                    {comparison.conflicts.map((c, i) => (
                      <li key={i}>
                        [{c.type}] {c.explanation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* New Snapshot Modal */}
      {isSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Capture Digital Twin Snapshot</h3>
            <p className="text-xs text-slate-400">
              Captures a point-in-time state of knowledge, curriculum, policies, and cohort models with SHA-256 integrity checksum.
            </p>
            <form onSubmit={handleCreateSnapshot} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Knowledge Version Set</label>
                <input
                  type="text"
                  value={snapshotForm.knowledgeVersionSet}
                  onChange={(e) => setSnapshotForm({ ...snapshotForm, knowledgeVersionSet: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Curriculum Version Set</label>
                <input
                  type="text"
                  value={snapshotForm.curriculumVersionSet}
                  onChange={(e) => setSnapshotForm({ ...snapshotForm, curriculumVersionSet: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Policy Version Set</label>
                <input
                  type="text"
                  value={snapshotForm.policyVersionSet}
                  onChange={(e) => setSnapshotForm({ ...snapshotForm, policyVersionSet: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSnapshotModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium"
                >
                  Capture Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Scenario Modal */}
      {isScenarioModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Create Simulation Scenario</h3>
            <form onSubmit={handleCreateScenario} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Scenario Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reorder Algebra Module Sequence"
                  value={scenarioForm.name}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Objective</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain the hypothesis or pedagogical intent..."
                  value={scenarioForm.objective}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, objective: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Base Snapshot</label>
                <select
                  value={scenarioForm.snapshotId}
                  onChange={(e) => setScenarioForm({ ...scenarioForm, snapshotId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  {snapshots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} ({s.knowledgeVersionSet})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Operation</label>
                  <select
                    value={scenarioForm.operation}
                    onChange={(e) => setScenarioForm({ ...scenarioForm, operation: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="MOVE">MOVE</option>
                    <option value="REPLACE">REPLACE</option>
                    <option value="ADD">ADD</option>
                    <option value="REMOVE">REMOVE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Target Entity ID</label>
                  <input
                    type="text"
                    value={scenarioForm.targetId}
                    onChange={(e) => setScenarioForm({ ...scenarioForm, targetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScenarioModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium"
                >
                  Create Scenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
