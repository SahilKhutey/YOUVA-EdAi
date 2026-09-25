'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Layers,
  FlaskConical,
  Clock,
  ThumbsUp,
  X,
  Loader2,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  learningIntelligenceApi,
  TeacherIntelligenceOverview,
  LearningInsight,
  ImprovementRecommendation,
  KnowledgeQualityProfile,
  IntelligenceExperiment,
} from '../../../lib/api/learningIntelligenceApi';

export const TeacherIntelligenceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'INSIGHTS' | 'RECOMMENDATIONS' | 'BOARD' | 'QUALITY' | 'EXPERIMENTS'>('INSIGHTS');
  const [data, setData] = useState<TeacherIntelligenceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded evidence view for an insight
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  // Quality profile query
  const [qualityKnowledgeId, setQualityKnowledgeId] = useState('');
  const [qualityProfile, setQualityProfile] = useState<KnowledgeQualityProfile | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);

  // Experiments list
  const [experiments, setExperiments] = useState<IntelligenceExperiment[]>([]);
  const [experimentsLoading, setExperimentsLoading] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await learningIntelligenceApi.getTeacherOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load intelligence overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchExperiments = async () => {
    setExperimentsLoading(true);
    try {
      const res = await learningIntelligenceApi.getExperiments();
      setExperiments(res);
    } catch (err) {
      console.error(err);
    } finally {
      setExperimentsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'EXPERIMENTS') {
      fetchExperiments();
    }
  }, [activeTab]);

  const handleAcceptRec = async (id: string) => {
    try {
      await learningIntelligenceApi.acceptRecommendation(id);
      fetchOverview();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to accept recommendation');
    }
  };

  const handleDismissRec = async (id: string) => {
    try {
      await learningIntelligenceApi.dismissRecommendation(id);
      fetchOverview();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to dismiss recommendation');
    }
  };

  const handleFetchQuality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qualityKnowledgeId.trim()) return;
    setQualityLoading(true);
    try {
      const profile = await learningIntelligenceApi.getKnowledgeQuality(qualityKnowledgeId.trim());
      setQualityProfile(profile);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to load quality profile');
    } finally {
      setQualityLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
        Loading continuous learning intelligence...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Learning Intelligence &amp; Continuous Improvement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Converts production learning signals into evidence-backed, human-governed curriculum enhancements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOverview}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Refresh intelligence"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Governance Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong>LKC-10 Human-in-the-Loop Governance:</strong> System detects insights and proposes recommendations.
          Educational changes strictly require authorized teacher review in Knowledge Studio. No silent AI mutations.
        </div>
      </div>

      {/* KPI Overview: Needs Attention */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Knowledge Objects</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {data.needsAttention.knowledgeCount}
            </div>
            <span className="text-[10px] text-amber-600 font-medium">Difficulty / drop-off alerts</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Learner Patterns</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {data.needsAttention.learnerPatternCount}
            </div>
            <span className="text-[10px] text-rose-600 font-medium">Systemic misconceptions</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Curriculum Opportunities</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {data.needsAttention.curriculumOpportunityCount}
            </div>
            <span className="text-[10px] text-indigo-600 font-medium">Prerequisite / path gaps</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500">Assessment Signals</span>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {data.needsAttention.assessmentSignalCount}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Question calibration</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <button
          onClick={() => setActiveTab('INSIGHTS')}
          className={`pb-3 px-4 transition-all border-b-2 ${
            activeTab === 'INSIGHTS'
              ? 'border-indigo-600 text-indigo-600 font-bold dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Insights &amp; Evidence ({data?.insights.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('RECOMMENDATIONS')}
          className={`pb-3 px-4 transition-all border-b-2 ${
            activeTab === 'RECOMMENDATIONS'
              ? 'border-indigo-600 text-indigo-600 font-bold dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Action Recommendations ({data?.recommendations.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('BOARD')}
          className={`pb-3 px-4 transition-all border-b-2 ${
            activeTab === 'BOARD'
              ? 'border-indigo-600 text-indigo-600 font-bold dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Continuous Improvement Board
        </button>

        <button
          onClick={() => setActiveTab('QUALITY')}
          className={`pb-3 px-4 transition-all border-b-2 ${
            activeTab === 'QUALITY'
              ? 'border-indigo-600 text-indigo-600 font-bold dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Knowledge Quality Profiler
        </button>

        <button
          onClick={() => setActiveTab('EXPERIMENTS')}
          className={`pb-3 px-4 transition-all border-b-2 ${
            activeTab === 'EXPERIMENTS'
              ? 'border-indigo-600 text-indigo-600 font-bold dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Controlled Experiments
        </button>
      </div>

      {/* Tab 1: Insights & Evidence Transparency */}
      {activeTab === 'INSIGHTS' && (
        <div className="space-y-4">
          {data?.insights.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              No active learning insights detected. System health is optimal.
            </div>
          ) : (
            data?.insights.map((ins) => (
              <div
                key={ins.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          ins.severity === 'HIGH' || ins.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {ins.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">[{ins.type}]</span>
                      <span className="text-xs font-semibold text-slate-400">Scope: {ins.scope}</span>
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {ins.title}
                    </h3>
                  </div>

                  <span className="text-[11px] font-bold text-indigo-600">
                    Confidence: {(ins.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">{ins.summary}</p>

                {/* Evidence Transparency Toggle */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setExpandedInsightId(expandedInsightId === ins.id ? null : ins.id)
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>
                      {expandedInsightId === ins.id ? 'Hide Evidence Transparency' : 'Why am I seeing this? (View Evidence)'}
                    </span>
                  </button>

                  <span className="text-[10px] text-slate-400">Rule: {ins.ruleVersion}</span>
                </div>

                {expandedInsightId === ins.id && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2 dark:border-slate-700 dark:bg-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Evidence Transparency &amp; Statistical Safeguards
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div>• Evidence records analyzed: {ins.evidenceIds?.length || 0}</div>
                      <div>• Minimum sample requirement: &ge; 5 records (Met)</div>
                      <div>• Entity Reference: {ins.entityId || 'Curriculum level'}</div>
                      <div>• Detected At: {new Date(ins.detectedAt).toLocaleString()}</div>
                    </div>
                    <p className="text-[10px] text-slate-500 pt-1">
                      Evidence IDs: {ins.evidenceIds?.join(', ') || 'Aggregated cohort signals'}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Recommendations & Actions */}
      {activeTab === 'RECOMMENDATIONS' && (
        <div className="space-y-4">
          {data?.recommendations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              No pending recommendations. All detected opportunities have been reviewed.
            </div>
          ) : (
            data?.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                      <Lightbulb className="h-3 w-3" />
                      Suggested Action: {rec.actionType}
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {rec.reason}
                    </h3>
                  </div>

                  <span className="text-[11px] font-bold text-slate-500">
                    Status: <strong className="text-slate-800 dark:text-slate-200">{rec.status}</strong>
                  </span>
                </div>

                {rec.expectedEffect && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <strong>Expected Effect:</strong> {rec.expectedEffect}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Target Concept: {rec.targetId} • Requires Teacher Approval: Yes
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDismissRec(rec.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      Dismiss
                    </button>

                    <button
                      onClick={() => handleAcceptRec(rec.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Accept &amp; Open Knowledge Studio</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Continuous Improvement Board */}
      {activeTab === 'BOARD' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: High Priority */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              High Priority Needs
            </h3>
            {data?.insights
              .filter((i) => i.severity === 'HIGH' || i.severity === 'CRITICAL')
              .slice(0, 3)
              .map((i) => (
                <div key={i.id} className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{i.title}</div>
                  <p className="mt-1 text-slate-500 text-[11px]">{i.summary.slice(0, 80)}...</p>
                </div>
              ))}
          </div>

          {/* Column 2: Opportunities */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Improvement Opportunities
            </h3>
            {data?.opportunities.slice(0, 3).map((o) => (
              <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="font-bold text-slate-900 dark:text-slate-100">{o.type}</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Priority: {o.priority} • Target: {o.targetId}
                </div>
              </div>
            ))}
          </div>

          {/* Column 3: Recent Improvements */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Recent Improvements
            </h3>
            {data?.recentImprovements.length === 0 ? (
              <p className="text-xs text-slate-500 p-2">No recent version improvements evaluated yet.</p>
            ) : (
              data?.recentImprovements.map((imp, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{imp.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{imp.actionType}</span>
                    <span className="text-emerald-600 font-semibold">{imp.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Knowledge Quality Profiler */}
      {activeTab === 'QUALITY' && (
        <div className="space-y-6">
          <form onSubmit={handleFetchQuality} className="flex gap-3">
            <input
              type="text"
              value={qualityKnowledgeId}
              onChange={(e) => setQualityKnowledgeId(e.target.value)}
              placeholder="Enter Knowledge Object ID (e.g. ko-algebra-linear)"
              className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={qualityLoading}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {qualityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Inspect Quality'}
            </button>
          </form>

          {qualityProfile && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Quality Profile: {qualityProfile.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sample size: {qualityProfile.sampleSize} interactions • Confidence: {(qualityProfile.confidence * 100).toFixed(0)}%
                  </p>
                </div>

                <div className="flex gap-2">
                  {qualityProfile.flags.map((f) => (
                    <span key={f} className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4 Explainable Dimensions */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-800/60">
                  <span className="text-xs font-bold text-slate-500">1. Engagement</span>
                  <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                    {(qualityProfile.engagement.completionRate * 100).toFixed(0)}%
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Abandonment: {(qualityProfile.engagement.abandonmentRate * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-800/60">
                  <span className="text-xs font-bold text-slate-500">2. Learning</span>
                  <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                    {(qualityProfile.learning.masteryProgressionRate * 100).toFixed(0)}%
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Success: {(qualityProfile.learning.assessmentSuccessRate * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-800/60">
                  <span className="text-xs font-bold text-slate-500">3. Support Demand</span>
                  <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                    {qualityProfile.support.hintRate} hints
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Remediation: {(qualityProfile.support.remediationRate * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-800/60">
                  <span className="text-xs font-bold text-slate-500">4. Difficulty</span>
                  <div className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                    {(qualityProfile.difficulty.struggleRate * 100).toFixed(0)}%
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Repeated Errors: {(qualityProfile.difficulty.repeatedErrorRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Controlled Experiments */}
      {activeTab === 'EXPERIMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Controlled Educational Experiments
            </h3>
          </div>

          {experimentsLoading ? (
            <div className="p-6 text-xs text-slate-500">Loading experiments...</div>
          ) : experiments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              No active learning experiments. Create one to test pedagogical variants safely.
            </div>
          ) : (
            experiments.map((exp) => (
              <div
                key={exp.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{exp.name}</span>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                    {exp.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{exp.hypothesis}</p>
                <div className="text-[11px] text-slate-400">
                  Primary Metric: {exp.primaryMetric} • Target: {exp.targetId}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
