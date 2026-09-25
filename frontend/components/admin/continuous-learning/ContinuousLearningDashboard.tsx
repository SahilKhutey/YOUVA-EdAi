'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileText,
  GitBranch,
  Layers,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  continuousLearningApi,
  EvolutionEvaluation,
  ImprovementCandidate,
  LearningExperiment,
  MethodologyVersion,
  LearningDriftSignal,
  EvolutionRollout,
  EvolutionMemory,
  EvolutionLevel,
} from '@/lib/api/continuousLearningApi';

export const ContinuousLearningDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'candidates' | 'experiments' | 'rollouts' | 'methodologies' | 'drift' | 'memory'
  >('candidates');

  const [candidates, setCandidates] = useState<ImprovementCandidate[]>([]);
  const [experiments, setExperiments] = useState<LearningExperiment[]>([]);
  const [rollouts, setRollouts] = useState<EvolutionRollout[]>([]);
  const [methodologies, setMethodologies] = useState<MethodologyVersion[]>([]);
  const [driftSignals, setDriftSignals] = useState<LearningDriftSignal[]>([]);
  const [memories, setMemories] = useState<EvolutionMemory[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected candidate for detail view
  const [selectedCandidate, setSelectedCandidate] = useState<ImprovementCandidate | null>(null);

  // Shadow compare modal
  const [shadowResult, setShadowResult] = useState<{
    activeDecision: any;
    shadowDecision: any;
    difference: boolean;
    explanation: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cands, exps, rols, meths, drifts, mems] = await Promise.all([
        continuousLearningApi.listCandidates(),
        continuousLearningApi.listExperiments(),
        continuousLearningApi.listRollouts(),
        continuousLearningApi.listMethodologies(),
        continuousLearningApi.listDriftSignals(),
        continuousLearningApi.listMemories(),
      ]);
      setCandidates(cands);
      setExperiments(exps);
      setRollouts(rols);
      setMethodologies(meths);
      setDriftSignals(drifts);
      setMemories(mems);

      if (cands.length > 0 && !selectedCandidate) {
        setSelectedCandidate(cands[0]);
      }
    } catch (err) {
      console.error('Failed to load continuous learning data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCandidate = async (id: string) => {
    try {
      setActionLoading(true);
      await continuousLearningApi.validateCandidate(id);
      await loadData();
      const updated = await continuousLearningApi.getCandidate(id);
      setSelectedCandidate(updated);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulateCandidate = async (id: string) => {
    try {
      setActionLoading(true);
      await continuousLearningApi.simulateCandidate(id);
      await loadData();
      const updated = await continuousLearningApi.getCandidate(id);
      setSelectedCandidate(updated);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCandidate = async (id: string) => {
    try {
      setActionLoading(true);
      const updated = await continuousLearningApi.approveCandidate(id, 'ADMIN');
      await loadData();
      setSelectedCandidate(updated);
    } catch (err) {
      console.error('Approval error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCandidate = async (id: string) => {
    try {
      setActionLoading(true);
      const updated = await continuousLearningApi.rejectCandidate(id, 'Governance review rejection');
      await loadData();
      setSelectedCandidate(updated);
    } catch (err) {
      console.error('Rejection error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceRollout = async (id: string) => {
    try {
      setActionLoading(true);
      await continuousLearningApi.advanceRollout(id, true);
      await loadData();
    } catch (err) {
      console.error('Advance rollout error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async (id: string) => {
    try {
      setActionLoading(true);
      await continuousLearningApi.rollback(id, 'Guardrail or metric regression rollback');
      await loadData();
    } catch (err) {
      console.error('Rollback error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShadowCompare = async (activeId: string, candidateId: string) => {
    try {
      setActionLoading(true);
      const res = await continuousLearningApi.runShadowComparison({
        activeMethodologyId: activeId,
        candidateMethodologyId: candidateId,
        input: { context: 'Production Evaluation Batch' },
      });
      setShadowResult(res);
    } catch (err) {
      console.error('Shadow comparison error:', err);
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
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Continuous Learning & Governed Evolution</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                CLEE Active (LKC-16)
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Autonomous continuous improvement with strict human-in-the-loop governance. Proposes, simulates, and monitors evolution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
          <span className="font-semibold text-amber-300">Core Principle: SELF-LEARNING ≠ SELF-AUTHORIZATION.</span> The platform autonomously discovers improvements, detects drift, and simulates changes. Consequential production changes to knowledge, curriculum, or mastery require explicit authorized human approval.
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Improvement Candidates</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{candidates.length}</div>
          <div className="text-xs text-indigo-400 mt-1">
            {candidates.filter((c) => c.status === 'REVIEW').length} awaiting review
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Experiments</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{experiments.length}</div>
          <div className="text-xs text-emerald-400 mt-1">
            {experiments.filter((e) => e.status === 'RUNNING').length} running
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Active Rollouts</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {rollouts.filter((r) => r.status === 'ACTIVE').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Canary controlled</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Drift Signals</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{driftSignals.length}</div>
          <div className="text-xs text-slate-500 mt-1">Monitored metrics</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400">Methodologies</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{methodologies.length}</div>
          <div className="text-xs text-cyan-400 mt-1">
            {methodologies.filter((m) => m.status === 'ACTIVE').length} active
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
            activeTab === 'candidates'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Candidates ({candidates.length})
        </button>
        <button
          onClick={() => setActiveTab('experiments')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
            activeTab === 'experiments'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Experiments ({experiments.length})
        </button>
        <button
          onClick={() => setActiveTab('rollouts')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
            activeTab === 'rollouts'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Canary Rollouts ({rollouts.length})
        </button>
        <button
          onClick={() => setActiveTab('methodologies')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
            activeTab === 'methodologies'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Methodologies ({methodologies.length})
        </button>
        <button
          onClick={() => setActiveTab('drift')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
            activeTab === 'drift'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          Drift Monitor ({driftSignals.length})
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition shrink-0 ${
            activeTab === 'memory'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Evolution Memory ({memories.length})
        </button>
      </div>

      {/* Tab 1: Candidates */}
      {activeTab === 'candidates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Discovered Improvement Candidates
            </h2>
            {candidates.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                No improvement candidates currently discovered.
              </div>
            ) : (
              candidates.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedCandidate(cand)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedCandidate?.id === cand.id
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200 truncate">{cand.targetId}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        cand.evolutionLevel === 4
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : cand.evolutionLevel === 3
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Level {cand.evolutionLevel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>Source: {cand.sourceType}</span>
                    <span>•</span>
                    <span className="text-indigo-400">{cand.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedCandidate ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-100">{selectedCandidate.targetId}</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {selectedCandidate.targetType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Discovered via {selectedCandidate.sourceType} • {selectedCandidate.sourceIds?.length ?? 0} evidence records
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedCandidate.status === 'DISCOVERED' && (
                      <button
                        onClick={() => handleValidateCandidate(selectedCandidate.id)}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition"
                      >
                        Validate Policy
                      </button>
                    )}
                    {selectedCandidate.status === 'SIMULATION_REQUIRED' && (
                      <button
                        onClick={() => handleSimulateCandidate(selectedCandidate.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Simulate in Twin
                      </button>
                    )}
                    {selectedCandidate.status === 'REVIEW' && (
                      <>
                        <button
                          onClick={() => handleApproveCandidate(selectedCandidate.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium text-white transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Evolution
                        </button>
                        <button
                          onClick={() => handleRejectCandidate(selectedCandidate.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-medium text-white transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Proposal Body */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Candidate Proposal
                  </h3>
                  <pre className="text-xs text-indigo-300 font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedCandidate.proposal, null, 2)}
                  </pre>
                </div>

                {/* Expected Benefits & Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="font-semibold text-emerald-400">Expected Educational Benefits</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {selectedCandidate.expectedBenefits?.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="font-semibold text-amber-400">Risks & Considerations</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {selectedCandidate.risks?.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                Select an improvement candidate to inspect details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Experiments */}
      {activeTab === 'experiments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiments.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-indigo-400 font-semibold">{exp.id}</span>
                    <h3 className="font-bold text-slate-200 text-sm mt-0.5">{exp.hypothesis}</h3>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      exp.status === 'RUNNING'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                        : exp.status === 'PAUSED'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {exp.status}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div>Success Metrics: <strong className="text-slate-200">{exp.successMetrics?.join(', ')}</strong></div>
                  <div>Guardrails: <strong className="text-amber-300">{exp.guardrails?.join(', ')}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Canary Rollouts */}
      {activeTab === 'rollouts' && (
        <div className="space-y-4">
          {rollouts.map((rol) => (
            <div
              key={rol.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-200 text-base">{rol.targetId}</h3>
                  <p className="text-xs text-slate-400">Target Type: {rol.targetType} • Candidate: {rol.candidateId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                    Stage: {rol.currentStage} ({rol.percentage}%)
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      rol.status === 'ROLLED_BACK'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : rol.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rol.status}
                  </span>
                </div>
              </div>

              {/* Canary Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    rol.status === 'ROLLED_BACK'
                      ? 'bg-rose-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.max(rol.percentage, 5)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-500">
                  {rol.guardrailBreached ? (
                    <strong className="text-rose-400">Guardrail Breached</strong>
                  ) : (
                    'Guardrails Verified'
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {rol.status === 'ACTIVE' && rol.percentage < 100 && (
                    <button
                      onClick={() => handleAdvanceRollout(rol.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition"
                    >
                      Advance Canary
                    </button>
                  )}
                  {rol.status !== 'ROLLED_BACK' && (
                    <button
                      onClick={() => handleRollback(rol.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-medium transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Execute Rollback
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Methodologies */}
      {activeTab === 'methodologies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methodologies.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">
                      {m.name} <span className="font-mono text-xs text-indigo-400">v{m.version}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{m.purpose}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      m.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : m.status === 'SHADOW'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : m.status === 'DEPRECATED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span>Metrics: {m.evaluationMetrics?.join(', ')}</span>
                  {m.status === 'SHADOW' && (
                    <button
                      onClick={() => handleShadowCompare('meth-active', m.id)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Test Shadow Run
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Shadow Run Result Modal */}
          {shadowResult && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span>Shadow Comparison Execution Result</span>
                <span className={shadowResult.difference ? 'text-amber-400' : 'text-emerald-400'}>
                  {shadowResult.difference ? 'DISAGREEMENT DETECTED' : 'METHODOLOGY AGREEMENT'}
                </span>
              </div>
              <p className="text-slate-400">{shadowResult.explanation}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  Active Decision: {JSON.stringify(shadowResult.activeDecision)}
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-indigo-300">
                  Shadow Decision: {JSON.stringify(shadowResult.shadowDecision)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Drift */}
      {activeTab === 'drift' && (
        <div className="space-y-3">
          {driftSignals.map((d) => (
            <div
              key={d.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-semibold text-slate-200">
                  <span>{d.targetId}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {d.driftType} DRIFT
                  </span>
                </div>
                <div className="text-slate-400">
                  Evidence IDs: {d.evidenceIds?.join(', ')} • Detected: {new Date(d.createdAt).toLocaleString()}
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold ${
                  d.severity === 'HIGH'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {d.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Evolution Memory */}
      {activeTab === 'memory' && (
        <div className="space-y-4">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">{mem.changeType}</h3>
                  <span className="text-xs text-slate-500">Methodology: {mem.methodologyVersion}</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {mem.status}
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-indigo-300">Learnings & Synthesis:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  {mem.learning?.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
