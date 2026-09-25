'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  RefreshCw,
  Eye,
  XCircle,
  FileText,
  BookOpen,
  Cpu,
  Database,
  Lock,
  Layers,
  Activity,
  Sliders,
} from 'lucide-react';
import {
  learningAssuranceApi,
  AssuranceOverview,
  AssuranceFinding,
  AssuranceRule,
  AssuranceDomain,
  FindingSeverity,
  FindingStatus,
  ReconciliationReport,
  RepairResult,
} from '@/lib/api/learningAssuranceApi';

export const AssuranceDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AssuranceOverview | null>(null);
  const [findings, setFindings] = useState<AssuranceFinding[]>([]);
  const [rules, setRules] = useState<AssuranceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'findings' | 'reconciliation' | 'rules'>('findings');
  const [selectedFinding, setSelectedFinding] = useState<AssuranceFinding | null>(null);

  // Filters
  const [domainFilter, setDomainFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');

  // Reconciliation & Repair
  const [reconciliationReport, setReconciliationReport] = useState<ReconciliationReport | null>(null);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal actions
  const [actionModal, setActionModal] = useState<'acknowledge' | 'resolve' | 'waive' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [waiverReason, setWaiverReason] = useState('');
  const [waiverPolicy, setWaiverPolicy] = useState('STANDARD_EXCEPTION_V1');
  const [waiverDays, setWaiverDays] = useState(30);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, fList, rList] = await Promise.all([
        learningAssuranceApi.getOverview(),
        learningAssuranceApi.listFindings(),
        learningAssuranceApi.listRules(),
      ]);
      setOverview(ov);
      setFindings(fList);
      setRules(rList);
    } catch (err) {
      console.error('Failed to load assurance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedFinding) return;
    try {
      setActionLoading(true);
      await learningAssuranceApi.acknowledgeFinding(selectedFinding.id, {
        acknowledgedBy: 'Admin (UI)',
        notes: actionNotes,
      });
      setActionModal(null);
      setActionNotes('');
      await loadData();
      const updated = await learningAssuranceApi.getFinding(selectedFinding.id);
      setSelectedFinding(updated);
    } catch (err) {
      console.error('Failed to acknowledge finding:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedFinding) return;
    try {
      setActionLoading(true);
      await learningAssuranceApi.resolveFinding(selectedFinding.id, {
        resolvedBy: 'Admin (UI)',
        resolutionNotes: actionNotes || 'Resolved from dashboard',
      });
      setActionModal(null);
      setActionNotes('');
      await loadData();
      const updated = await learningAssuranceApi.getFinding(selectedFinding.id);
      setSelectedFinding(updated);
    } catch (err) {
      console.error('Failed to resolve finding:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWaive = async () => {
    if (!selectedFinding) return;
    try {
      setActionLoading(true);
      const expiry = new Date(Date.now() + waiverDays * 24 * 60 * 60 * 1000).toISOString();
      await learningAssuranceApi.waiveFinding(selectedFinding.id, {
        waivedBy: 'Admin (UI)',
        reason: waiverReason,
        policy: waiverPolicy,
        expiry,
        scope: selectedFinding.domain === 'SECURITY' ? 'SECURITY_GOVERNANCE_OVERRIDE' : 'STANDARD',
      });
      setActionModal(null);
      setWaiverReason('');
      await loadData();
      const updated = await learningAssuranceApi.getFinding(selectedFinding.id);
      setSelectedFinding(updated);
    } catch (err) {
      alert((err as Error).message || 'Failed to waive finding');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunReconciliation = async (target: 'KNOWLEDGE' | 'EVENTS' | 'ANALYTICS') => {
    try {
      setActionLoading(true);
      const report = await learningAssuranceApi.reconcile(target);
      setReconciliationReport(report);
    } catch (err) {
      console.error('Reconciliation failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerRepair = async (action: string, targetType: string, targetId: string) => {
    try {
      setActionLoading(true);
      const result = await learningAssuranceApi.executeRepair({
        repairAction: action,
        targetType,
        targetId,
        reason: 'Triggered from Assurance Dashboard',
        actor: 'Admin (UI)',
      });
      setRepairResult(result);
      await loadData();
    } catch (err) {
      console.error('Repair execution failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredFindings = findings.filter((f) => {
    if (domainFilter !== 'ALL' && f.domain !== domainFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Learning Trust & Assurance Platform (LTAP)
            </h1>
            <p className="text-sm text-slate-400">
              Cross-functional assurance verifying correctness, safety, compliance, and reliability across 9 domains.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading || actionLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* System Status Banner */}
      {overview && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
            overview.systemStatus === 'HEALTHY'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : overview.systemStatus === 'DEGRADED'
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {overview.systemStatus === 'HEALTHY' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : overview.systemStatus === 'DEGRADED' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div className="text-sm">
              <span className="font-bold">SYSTEM STATUS: {overview.systemStatus}</span>
              <span className="text-slate-400 ml-2">
                ({overview.openFindingsCount} open findings, {overview.blockedActionsCount} blocked actions)
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Last Evaluated: {new Date(overview.lastEvaluatedAt).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Metric Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Findings</div>
            <div className="text-2xl font-bold text-white mt-1">{overview.openFindingsCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Critical Risk</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{overview.criticalCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">High Severity</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{overview.highCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Medium / Low</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">
              {overview.mediumCount + overview.lowCount}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Blocked Actions</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{overview.blockedActionsCount}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'findings'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Findings ({findings.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'reconciliation'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Reconciliation & Repair
          </div>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'rules'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Rule Registry ({rules.length})
          </div>
        </button>
      </div>

      {/* Tab 1: Findings */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-sm">
            <span className="text-slate-400 text-xs font-semibold">STATUS:</span>
            {['ALL', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'WAIVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  statusFilter === st
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}

            <span className="text-slate-600 mx-1">|</span>

            <span className="text-slate-400 text-xs font-semibold">SEVERITY:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  severityFilter === sev
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}

            <span className="text-slate-600 mx-1">|</span>

            <span className="text-slate-400 text-xs font-semibold">DOMAIN:</span>
            {[
              'ALL',
              'KNOWLEDGE',
              'LEARNING',
              'ASSESSMENT',
              'AI',
              'PERSONALIZATION',
              'ORCHESTRATION',
              'DATA',
              'SECURITY',
              'OPERATIONS',
            ].map((dom) => (
              <button
                key={dom}
                onClick={() => setDomainFilter(dom)}
                className={`px-2 py-0.5 rounded text-xs transition ${
                  domainFilter === dom
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>

          {/* Findings Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">Finding & Rule</th>
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredFindings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No assurance findings found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredFindings.map((finding) => (
                      <tr key={finding.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{finding.message}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            Rule: {finding.ruleId}@{finding.ruleVersion}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">
                            {finding.domain}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              finding.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : finding.severity === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {finding.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-slate-400">
                            {finding.targetType} ({finding.targetId})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              finding.status === 'RESOLVED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : finding.status === 'ACKNOWLEDGED'
                                ? 'bg-sky-500/20 text-sky-400'
                                : finding.status === 'WAIVED'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {finding.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedFinding(finding)}
                            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

      {/* Tab 2: Reconciliation & Repair */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              Canonical vs. Derived System Reconciliation
            </h3>
            <p className="text-sm text-slate-400">
              Verifies that derived indexes, caches, and analytics match canonical PostgreSQL records.
              In any desynchronization, <span className="text-emerald-400 font-semibold">PostgreSQL is authoritative</span> and derived systems are rebuilt.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleRunReconciliation('KNOWLEDGE')}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center gap-2 border border-slate-700"
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                Scan Knowledge & Search Index
              </button>

              <button
                onClick={() => handleRunReconciliation('EVENTS')}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center gap-2 border border-slate-700"
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                Scan Event Delivery & Outbox
              </button>

              <button
                onClick={() => handleRunReconciliation('ANALYTICS')}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center gap-2 border border-slate-700"
              >
                <Cpu className="w-4 h-4 text-purple-400" />
                Scan Derived Analytics
              </button>
            </div>
          </div>

          {/* Reconciliation Report */}
          {reconciliationReport && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      reconciliationReport.status === 'CONSISTENT'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {reconciliationReport.status}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    Target: {reconciliationReport.target}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {reconciliationReport.timestamp}
                </span>
              </div>

              {reconciliationReport.mismatchesFound > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-slate-300">
                    Found {reconciliationReport.mismatchesFound} mismatch(es) between canonical database and derived index.
                  </div>
                  {reconciliationReport.details.map((d, i) => (
                    <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 text-xs space-y-1">
                      <div className="text-amber-300 font-mono">Gap: {d.gapType} ({d.targetId})</div>
                      <div className="text-slate-400">Canonical Expected: {d.expected}</div>
                      <div className="text-slate-400">Derived Actual: {d.actual}</div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <button
                      onClick={() =>
                        handleTriggerRepair(
                          reconciliationReport.suggestedRepair,
                          'SEARCH_INDEX',
                          'know_search_index',
                        )
                      }
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Wrench className="w-4 h-4" />
                      Execute Safe Auto-Repair ({reconciliationReport.suggestedRepair})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Canonical database and derived systems are 100% consistent.
                </div>
              )}
            </div>
          )}

          {/* Repair Result */}
          {repairResult && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm space-y-2">
              <div className="font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Repair Executed: {repairResult.action}
              </div>
              <div className="text-xs text-slate-400">Status: {repairResult.status}</div>
              <div className="text-xs text-slate-300">{repairResult.message}</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Rule Registry */}
      {activeTab === 'rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Rule ID & Version</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Check Description</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rules.map((rule) => (
                  <tr key={`${rule.id}-${rule.version}`} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-white text-xs">
                      {rule.id}@{rule.version}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                        {rule.domain}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          rule.severity === 'CRITICAL'
                            ? 'text-rose-400'
                            : rule.severity === 'HIGH'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                          rule.action === 'BLOCK'
                            ? 'bg-rose-500/20 text-rose-400'
                            : rule.action === 'WARN'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {rule.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {rule.definition?.description || rule.definition?.check}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-emerald-400 font-semibold">ENABLED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finding Detail Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Assurance Finding Details</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedFinding.id}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedFinding(null);
                  setActionModal(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 font-semibold uppercase">Message</div>
                <div className="text-white font-medium mt-1">{selectedFinding.message}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Domain:</span> {selectedFinding.domain}
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Severity:</span> {selectedFinding.severity}
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Target:</span> {selectedFinding.targetType} ({selectedFinding.targetId})
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500">Rule:</span> {selectedFinding.ruleId}@{selectedFinding.ruleVersion}
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 col-span-2">
                  <span className="text-slate-500">Fingerprint:</span>{' '}
                  <span className="font-mono text-slate-400">{selectedFinding.fingerprint}</span>
                </div>
              </div>

              {selectedFinding.evidenceIds && selectedFinding.evidenceIds.length > 0 && (
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs">
                  <span className="text-slate-500">Evidence References:</span>{' '}
                  <span className="font-mono text-slate-300">
                    {selectedFinding.evidenceIds.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Action Form in Modal */}
            {actionModal === 'acknowledge' && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-sky-400 uppercase">Acknowledge Finding</h4>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcknowledge}
                    disabled={actionLoading}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold"
                  >
                    Confirm Acknowledge
                  </button>
                </div>
              </div>
            )}

            {actionModal === 'resolve' && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase">Resolve Finding</h4>
                <input
                  type="text"
                  placeholder="Resolution notes..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={actionLoading}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                  >
                    Confirm Resolve
                  </button>
                </div>
              </div>
            )}

            {actionModal === 'waive' && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-purple-400 uppercase">Waive Finding (Temporary Exception)</h4>
                <input
                  type="text"
                  placeholder="Reason for waiver..."
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white"
                />
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Duration (days, max 90):</span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={waiverDays}
                    onChange={(e) => setWaiverDays(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white text-center"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setActionModal(null)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWaive}
                    disabled={actionLoading || !waiverReason}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold disabled:opacity-50"
                  >
                    Grant Waiver
                  </button>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            {!actionModal && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="space-x-2">
                  {selectedFinding.status === 'OPEN' && (
                    <button
                      onClick={() => setActionModal('acknowledge')}
                      className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 rounded text-xs font-medium border border-sky-500/30"
                    >
                      Acknowledge
                    </button>
                  )}
                  {selectedFinding.status !== 'RESOLVED' && (
                    <button
                      onClick={() => setActionModal('resolve')}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded text-xs font-medium border border-emerald-500/30"
                    >
                      Resolve
                    </button>
                  )}
                  {selectedFinding.status !== 'WAIVED' && (
                    <button
                      onClick={() => setActionModal('waive')}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded text-xs font-medium border border-purple-500/30"
                    >
                      Waive
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setSelectedFinding(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssuranceDashboard;
