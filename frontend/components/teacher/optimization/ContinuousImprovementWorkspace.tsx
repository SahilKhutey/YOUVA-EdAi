import React, { useState, useEffect } from 'react';
import {
  learningOptimizationApi,
  ImprovementPlan,
  OptimizationOverview,
} from '../../../lib/api/learningOptimizationApi';
import {
  CheckCircle,
  AlertCircle,
  Play,
  RotateCw,
  Shield,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Check,
  X,
  Eye,
} from 'lucide-react';

export const ContinuousImprovementWorkspace: React.FC = () => {
  const [overview, setOverview] = useState<OptimizationOverview | null>(null);
  const [plans, setPlans] = useState<ImprovementPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ImprovementPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [evaluatingValue, setEvaluatingValue] = useState<string>('0.78');
  const [evaluatingSample, setEvaluatingSample] = useState<string>('35');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewData, plansData] = await Promise.all([
        learningOptimizationApi.getOverview(),
        learningOptimizationApi.listPlans(),
      ]);
      setOverview(overviewData);
      setPlans(plansData);
      if (plansData.length > 0 && !selectedPlan) {
        setSelectedPlan(plansData[0]);
      }
    } catch (err) {
      console.error('Failed to load continuous improvement data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (planId: string) => {
    try {
      await learningOptimizationApi.approvePlan(planId);
      await fetchData();
    } catch (err) {
      console.error('Approval failed', err);
    }
  };

  const handleExecute = async (planId: string) => {
    try {
      await learningOptimizationApi.executePlan(planId);
      await fetchData();
    } catch (err) {
      console.error('Execution failed', err);
    }
  };

  const handleEvaluate = async (planId: string) => {
    try {
      await learningOptimizationApi.evaluatePlan(planId, {
        observedPrimaryValue: parseFloat(evaluatingValue),
        sampleSize: parseInt(evaluatingSample, 10),
      });
      await fetchData();
    } catch (err) {
      console.error('Evaluation failed', err);
    }
  };

  const handleReopen = async (planId: string) => {
    try {
      await learningOptimizationApi.reopenPlan(
        planId,
        'Learner outcome did not meet criteria; exploring differentiated scaffold',
      );
      await fetchData();
    } catch (err) {
      console.error('Reopening failed', err);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (activeFilter === 'ALL') return true;
    return p.status === activeFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Continuous Improvement Workspace</h1>
          <p className="text-sm text-gray-500">
            Closed-loop learning intelligence: Observe → Analyze → Decide → Execute → Measure → Learn
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full flex items-center">
            <Shield className="mr-1 w-3.5 h-3.5" /> Human Governed
          </span>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <RotateCw className="mr-1.5 w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Active Plans</span>
            <Layers className="text-blue-500 w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {overview?.activePlansCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-gray-400">In drafting, execution, or review</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Evaluations Running</span>
            <Activity className="text-amber-500 w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {overview?.evaluationsRunningCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-gray-400">Measuring cohort outcomes</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Completed & Standardized</span>
            <CheckCircle className="text-emerald-500 w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {overview?.completedImprovementsCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-gray-400">Positive signal & guardrails verified</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Reopened Loops</span>
            <RotateCw className="text-purple-500 w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600">
            {overview?.reopenedImprovementsCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-gray-400">Iterative improvement cycles</div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Plans List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Improvement Plans</h2>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="EXECUTING">Executing</option>
              <option value="EVALUATING">Evaluating</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto">
            {filteredPlans.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">No improvement plans found.</div>
            ) : (
              filteredPlans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedPlan?.id === p.id
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">{p.targetType}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : p.status === 'APPROVED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mt-1 line-clamp-1">
                    {p.objective}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{p.hypothesis}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Selected Plan Detail */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          {selectedPlan ? (
            <>
              {/* Header & Status */}
              <div className="border-b border-gray-100 pb-4 flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                      ID: {selectedPlan.id}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {selectedPlan.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-2">{selectedPlan.objective}</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedPlan.hypothesis}</p>
                </div>
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {selectedPlan.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleApprove(selectedPlan.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <Check className="mr-1 w-3.5 h-3.5" /> Approve Plan
                    </button>
                  )}
                  {selectedPlan.status === 'APPROVED' && (
                    <button
                      onClick={() => handleExecute(selectedPlan.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center"
                    >
                      <Play className="mr-1 w-3.5 h-3.5" /> Execute Actions
                    </button>
                  )}
                  {selectedPlan.status === 'FAILED' && (
                    <button
                      onClick={() => handleReopen(selectedPlan.id)}
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 flex items-center"
                    >
                      <RotateCw className="mr-1 w-3.5 h-3.5" /> Reopen Plan
                    </button>
                  )}
                </div>
              </div>

              {/* Baseline & Success Criteria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-bold text-gray-500 uppercase">Pre-Change Baseline</div>
                  <div className="mt-2 text-sm text-gray-800 space-y-1">
                    <div>
                      Metric:{' '}
                      <span className="font-semibold text-gray-900">
                        {selectedPlan.baseline.metric}
                      </span>
                    </div>
                    <div>
                      Aggregation: <span className="font-semibold">{selectedPlan.baseline.aggregation}</span>
                    </div>
                    <div>
                      Min Sample: <span className="font-semibold">{selectedPlan.baseline.minimumSampleSize} learners</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                  <div className="text-xs font-bold text-blue-700 uppercase">Success Criteria & Guardrails</div>
                  <div className="mt-2 text-sm text-gray-800 space-y-1">
                    <div>
                      Target:{' '}
                      <span className="font-semibold text-blue-900">
                        {selectedPlan.successCriteria.primaryMetric} →{' '}
                        {selectedPlan.successCriteria.targetDirection} to{' '}
                        {(selectedPlan.successCriteria.targetValue * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      Guardrails:{' '}
                      <span className="font-semibold text-gray-700">
                        {selectedPlan.successCriteria.guardrailMetrics.map((g) => g.metric).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Checklist */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Action Checklist
                </h3>
                <div className="space-y-2">
                  {selectedPlan.actions.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            act.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {act.actionOrder}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{act.type}</div>
                          <div className="text-xs text-gray-500">
                            Mode: {act.executionMode} • Approval Required: {act.requiresApproval ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          act.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluation Trigger (For active or evaluating plans) */}
              {(selectedPlan.status === 'EXECUTING' || selectedPlan.status === 'EVALUATING') && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-amber-900 flex items-center">
                      <Activity className="mr-1.5 w-4 h-4" /> Measure Cohort Outcome
                    </div>
                    <span className="text-xs text-amber-700">Multi-metric evaluation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Observed Primary Rate (0.0 - 1.0)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={evaluatingValue}
                        onChange={(e) => setEvaluatingValue(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">Cohort Sample Size</label>
                      <input
                        type="number"
                        value={evaluatingSample}
                        onChange={(e) => setEvaluatingSample(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleEvaluate(selectedPlan.id)}
                    className="w-full py-2 bg-amber-600 text-white text-xs font-bold rounded hover:bg-amber-700"
                  >
                    Evaluate Plan & Close/Advance Loop
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">Select a plan to view details</div>
          )}
        </div>
      </div>
    </div>
  );
};
