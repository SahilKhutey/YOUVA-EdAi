import React, { useState, useEffect } from 'react';
import {
  institutionalIntelligenceApi,
  InstitutionalOverview,
  SystemicInsight,
  LearningMemory,
  SystemOptimizationPlan,
} from '../../../lib/api/institutionalIntelligenceApi';
import { KnowledgeNetworkView } from './KnowledgeNetworkView';
import {
  Brain,
  Shield,
  RotateCw,
  Layers,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  Activity,
  Play,
  Check,
  Info,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export const InstitutionalIntelligenceDashboard: React.FC = () => {
  const [overview, setOverview] = useState<InstitutionalOverview | null>(null);
  const [insights, setInsights] = useState<SystemicInsight[]>([]);
  const [memories, setMemories] = useState<LearningMemory[]>([]);
  const [plans, setPlans] = useState<SystemOptimizationPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'INSIGHTS' | 'MEMORY' | 'OPTIMIZATION' | 'NETWORK'>('INSIGHTS');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewData, insightsData, memoriesData, plansData] = await Promise.all([
        institutionalIntelligenceApi.getOverview(),
        institutionalIntelligenceApi.listInsights(),
        institutionalIntelligenceApi.listMemories(),
        institutionalIntelligenceApi.listOptimizationPlans(),
      ]);
      setOverview(overviewData);
      setInsights(insightsData);
      setMemories(memoriesData);
      setPlans(plansData);
    } catch (err) {
      console.error('Failed to load institutional intelligence data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprovePlan = async (id: string) => {
    try {
      await institutionalIntelligenceApi.approveOptimizationPlan(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to approve plan', err);
    }
  };

  const handleExecutePlan = async (id: string) => {
    try {
      await institutionalIntelligenceApi.executeOptimizationPlan(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to execute plan', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <Brain className="text-purple-600 w-6 h-6" />
            <h1 className="text-2xl font-bold text-gray-900">Institutional Learning Intelligence</h1>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Cross-entity learning patterns, institutional memory & systemic optimization (LKC-12)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full flex items-center">
            <Shield className="mr-1 w-3.5 h-3.5" /> Tenant Isolated
          </span>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <RotateCw className="mr-1.5 w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Freshness & Window Notification */}
      {overview && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>
              <strong>Last updated:</strong> {new Date(overview.lastUpdated).toLocaleTimeString()} •{' '}
              <strong>Data Window:</strong> {new Date(overview.dataWindow.start).toLocaleDateString()} →{' '}
              {new Date(overview.dataWindow.end).toLocaleDateString()}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700">All Pipeline Workers Healthy</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Systemic Insights</span>
            <AlertTriangle className="text-amber-500 w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{overview?.insightsCount ?? 0}</div>
          <div className="mt-1 text-xs text-gray-400">Cross-course bottlenecks & gaps</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Validated Patterns</span>
            <Layers className="text-blue-500 w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{overview?.patternsCount ?? 0}</div>
          <div className="mt-1 text-xs text-gray-400">Recurring cross-entity behaviors</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Active Memories</span>
            <Brain className="text-purple-500 w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600">
            {overview?.activeMemoriesCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-gray-400">Evidence-linked institutional truths</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Optimization Plans</span>
            <CheckCircle className="text-emerald-500 w-4 h-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {overview?.optimizationPlansCount ?? 0}
          </div>
          <div className="mt-1 text-xs text-gray-400">Multi-action systemic plans</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'INSIGHTS', label: 'Systemic Insights' },
            { id: 'MEMORY', label: 'Learning Memory' },
            { id: 'OPTIMIZATION', label: 'Systemic Optimization' },
            { id: 'NETWORK', label: 'Knowledge Network' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 text-sm font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Systemic Insights */}
      {activeTab === 'INSIGHTS' && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
              No systemic insights detected in the current observation window.
            </div>
          ) : (
            insights.map((ins) => (
              <div
                key={ins.id}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                        {ins.type}
                      </span>
                      <span className="text-xs text-gray-400">Confidence: {(ins.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mt-1">{ins.title}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                    {ins.status}
                  </span>
                </div>

                <p className="text-sm text-gray-700">{ins.summary}</p>

                {/* Explainability Breakdown Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-500 font-semibold uppercase">Where?</span>
                    <div className="font-bold text-gray-900 mt-0.5">
                      {ins.affectedCourses.length} Courses
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold uppercase">Who?</span>
                    <div className="font-bold text-gray-900 mt-0.5">
                      {ins.affectedLearnerCount} Learners
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold uppercase">When?</span>
                    <div className="font-bold text-gray-900 mt-0.5">
                      {new Date(ins.detectedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold uppercase">Evidence?</span>
                    <div className="font-bold text-blue-600 mt-0.5">
                      {ins.evidenceReferences.length} Logged Sources
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Learning Memory */}
      {activeTab === 'MEMORY' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-800">Institutional Learning Memory</h2>
            <span className="text-xs text-gray-500">
              Evidence-linked institutional truths subject to continuous revalidation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map((mem) => (
              <div
                key={mem.id}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 uppercase">
                    {mem.memoryType}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {(mem.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{mem.statement}</p>
                <div className="text-xs text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
                  <span>Status: <strong className="text-gray-800">{mem.status}</strong></span>
                  <span>{mem.evidenceReferences.length} Evidence References</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Systemic Optimization */}
      {activeTab === 'OPTIMIZATION' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-800">System Optimization Plans</h2>
            <span className="text-xs text-gray-500">Multi-course coordinated improvement programs</span>
          </div>

          {plans.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                      ID: {p.id}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {p.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mt-1">{p.objective}</h3>
                </div>

                <div className="flex items-center space-x-2">
                  {p.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleApprovePlan(p.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 flex items-center"
                    >
                      <Check className="mr-1 w-3.5 h-3.5" /> Approve Plan
                    </button>
                  )}
                  {p.status === 'APPROVED' && (
                    <button
                      onClick={() => handleExecutePlan(p.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 flex items-center"
                    >
                      <Play className="mr-1 w-3.5 h-3.5" /> Execute Plan
                    </button>
                  )}
                </div>
              </div>

              {/* Actions Checklist */}
              <div className="space-y-2 mt-2">
                {p.actions.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-gray-800">{act.type}</span>: {act.description}
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Target Courses: {act.targetCourseIds.join(', ')}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        act.status === 'EXECUTED'
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
          ))}
        </div>
      )}

      {/* Tab 4: Knowledge Network */}
      {activeTab === 'NETWORK' && <KnowledgeNetworkView />}
    </div>
  );
};
