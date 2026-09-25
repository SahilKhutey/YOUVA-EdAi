'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Check,
  Sliders,
  Cpu,
  FileText,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  governanceApi,
  GovernancePolicy,
  GovernanceIssue,
  DataQualityCheckResult,
} from '../../../lib/api/governanceApi';
import { analyticsApi, AiAnalyticsMetrics, AiEvaluationResult } from '../../../lib/api/analyticsApi';

export const GovernanceDashboard: React.FC = () => {
  // Policies state
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  // Issues state
  const [issues, setIssues] = useState<GovernanceIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);

  // AI metrics state
  const [aiMetrics, setAiMetrics] = useState<AiAnalyticsMetrics | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [evalResult, setEvalResult] = useState<AiEvaluationResult | null>(null);
  const [evalRunning, setEvalRunning] = useState(false);

  // Action states
  const [runningChecks, setRunningChecks] = useState(false);
  const [checkResult, setCheckResult] = useState<DataQualityCheckResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const data = await governanceApi.getPolicies();
      setPolicies(data);
    } catch (err: any) {
      console.error('Failed to load policies', err);
    } finally {
      setPoliciesLoading(false);
    }
  };

  const fetchIssues = async () => {
    setIssuesLoading(true);
    try {
      const data = await governanceApi.getIssues();
      setIssues(data);
    } catch (err: any) {
      console.error('Failed to load governance issues', err);
    } finally {
      setIssuesLoading(false);
    }
  };

  const fetchAiMetrics = async () => {
    setAiLoading(true);
    try {
      const data = await analyticsApi.getAiMetrics();
      setAiMetrics(data);
    } catch (err: any) {
      console.error('Failed to load AI metrics', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchIssues();
    fetchAiMetrics();
  }, []);

  const handleActivatePolicy = async (policyId: string) => {
    try {
      await governanceApi.activatePolicy(policyId);
      fetchPolicies();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to activate policy');
    }
  };

  const handleRunChecks = async () => {
    setRunningChecks(true);
    setActionError(null);
    try {
      const result = await governanceApi.runDataQualityChecks();
      setCheckResult(result);
      fetchIssues();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to run data quality checks');
    } finally {
      setRunningChecks(false);
    }
  };

  const handleAcknowledge = async (issueId: string) => {
    try {
      await governanceApi.acknowledgeIssue(issueId, 'current-teacher');
      fetchIssues();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to acknowledge issue');
    }
  };

  const handleResolve = async (issueId: string) => {
    try {
      await governanceApi.resolveIssue(issueId);
      fetchIssues();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to resolve issue');
    }
  };

  const handleRunAiEval = async () => {
    setEvalRunning(true);
    try {
      const res = await analyticsApi.runAiEvaluation('STANDARD_PEDAGOGICAL_REGRESSION');
      setEvalResult(res);
      fetchAiMetrics();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to run AI evaluation');
    } finally {
      setEvalRunning(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300';
      case 'ERROR':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-indigo-600" />
            Institutional Governance & Educational Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time policy enforcement, AI safety/grounding metrics, and automated data quality audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchPolicies();
              fetchIssues();
              fetchAiMetrics();
            }}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Refresh dashboard"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* AI Operations & Grounding Compliance */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              AI Operations & Pedagogical Alignment
            </h3>
          </div>

          <button
            onClick={handleRunAiEval}
            disabled={evalRunning}
            className="mt-2 sm:mt-0 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {evalRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span>Run Regression Suite</span>
          </button>
        </div>

        {aiLoading || !aiMetrics ? (
          <div className="p-4 text-xs text-slate-500">Loading AI compliance metrics...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-500">Total AI Requests</span>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                {aiMetrics.totalRequests}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-500">Grounding Compliance</span>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                {(aiMetrics.groundingComplianceRate * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-400">Score &ge; 0.65 threshold</span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-500">Safety Compliance</span>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                {(aiMetrics.safetyComplianceRate * 100).toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-400">Content safety filters</span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-500">Evaluation Status</span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${
                    aiMetrics.evaluationStatus === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : aiMetrics.evaluationStatus === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {aiMetrics.evaluationStatus}
                </span>
              </div>
            </div>
          </div>
        )}

        {evalResult && (
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200">
            <strong>Evaluation Suite Result:</strong> {evalResult.passed}/{evalResult.totalTests} tests passed
            (Avg Grounding: {evalResult.averageGroundingScore}) — Status: <strong>{evalResult.status}</strong>
          </div>
        )}
      </div>

      {/* Data Quality Engine & Alerts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Automated Data Quality & Consistency Engine
            </h3>
          </div>

          <button
            onClick={handleRunChecks}
            disabled={runningChecks}
            className="mt-2 sm:mt-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {runningChecks ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span>Run Quality Checks</span>
          </button>
        </div>

        {checkResult && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
            Audit complete: {checkResult.issuesDetected} issue(s) detected.
          </div>
        )}

        {issuesLoading ? (
          <div className="p-4 text-xs text-slate-500">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
            No active data quality issues detected. System integrity is healthy.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {issues.map((iss) => (
              <div key={iss.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 text-xs gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getSeverityBadge(iss.severity)}`}>
                      {iss.severity}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{iss.code}</span>
                    <span className="text-[10px] text-slate-400">({iss.category})</span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">{iss.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {iss.status === 'DETECTED' && (
                    <button
                      onClick={() => handleAcknowledge(iss.id)}
                      className="rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      Acknowledge
                    </button>
                  )}
                  {iss.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleResolve(iss.id)}
                      className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
                    >
                      Resolve
                    </button>
                  )}
                  {iss.status === 'RESOLVED' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Governance Policies Registry */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Governance Policies & Rulesets
          </h3>
        </div>

        {policiesLoading ? (
          <div className="p-4 text-xs text-slate-500">Loading policy registry...</div>
        ) : policies.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
            No governance policies registered yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {policies.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 text-xs gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{p.policyType}</span>
                    <span className="text-slate-400">({p.version})</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        p.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Created: {new Date(p.createdAt).toLocaleDateString()}
                    {p.effectiveAt && ` • Effective: ${new Date(p.effectiveAt).toLocaleDateString()}`}
                  </div>
                </div>

                {p.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleActivatePolicy(p.id)}
                    className="self-start sm:self-auto rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                  >
                    Activate
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
