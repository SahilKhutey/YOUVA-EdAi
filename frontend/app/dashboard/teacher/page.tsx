'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/app/components/MainLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import {
  Users,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Brain,
  Sliders,
  Check,
  Search,
  RefreshCw,
  FileText
} from 'lucide-react';

interface Metrics {
  totalStudents: number;
  activeClasses: number;
  pendingInterventions: number;
  urgentEscalations: number;
  avgCohortMastery: number;
  aiAgreementRate: number;
  overrideRate: number;
}

interface AttentionStudent {
  id: string;
  name: string;
  email: string;
  gradeLevel: string;
  topicMastery: Array<{ masteryProbability: number; topic: { title: string } }>;
  cognitiveStateLogs: Array<{ cognitiveLoad: number; inferredState: string }>;
  escalationEvents: Array<{ severity: string; reason: string }>;
}

interface InterventionItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  gradeLevel: string;
  action: string;
  feedback: string;
  status: string;
  createdAt: string;
  priority: 'URGENT' | 'REVIEW';
  activeEscalations?: Array<{ id: string; severity: string; reason: string }>;
  latestCognitiveState?: { cognitiveLoad: number; inferredState: string } | null;
}

interface RecommendationItem {
  id: string;
  studentId: string;
  studentName: string;
  topicName: string;
  activityType: string;
  difficulty: number;
  modality: string;
  pacing: string;
  rationale: string;
  createdAt: string;
}

interface ScopedStudent {
  id: string;
  name: string;
  email: string;
  gradeLevel: string;
  cognitiveLevel: string;
  totalXp: number;
  currentStreak: number;
  averageMastery: number;
  pendingInterventionCount: number;
  latestCognitiveState: string;
}

export default function TeacherWorkspacePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'interventions' | 'recommendations' | 'students'>('overview');

  const [metrics, setMetrics] = useState<Metrics>({
    totalStudents: 0,
    activeClasses: 0,
    pendingInterventions: 0,
    urgentEscalations: 0,
    avgCohortMastery: 0,
    aiAgreementRate: 100,
    overrideRate: 0,
  });

  const [attentionQueue, setAttentionQueue] = useState<AttentionStudent[]>([]);
  const [interventions, setInterventions] = useState<{ urgent: InterventionItem[]; review: InterventionItem[] }>({ urgent: [], review: [] });
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [students, setStudents] = useState<ScopedStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Modal State for Intervention Resolution
  const [resolvingIntervention, setResolvingIntervention] = useState<InterventionItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  // Modal State for Authoritative Override
  const [overridingRec, setOverridingRec] = useState<RecommendationItem | null>(null);
  const [overrideForm, setOverrideForm] = useState({
    forcedActivityType: 'REMEDIATION',
    forcedDifficulty: 0.35,
    forcedModality: 'VISUAL',
    forcedPacing: 'SLOW',
    teacherNotes: '',
  });
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const fetchWorkspaceData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, intervRes, recRes, studRes] = await Promise.allSettled([
        api.get('/teacher/dashboard'),
        api.get('/teacher/interventions'),
        api.get('/teacher/recommendations'),
        api.get('/teacher/students'),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.data) {
        const data = dashRes.value.data;
        if (data.metrics) setMetrics(data.metrics);
        if (data.attentionQueue) setAttentionQueue(data.attentionQueue);
      }

      if (intervRes.status === 'fulfilled' && intervRes.value.data) {
        setInterventions(intervRes.value.data);
      }

      if (recRes.status === 'fulfilled' && recRes.value.data) {
        setRecommendations(recRes.value.data);
      }

      if (studRes.status === 'fulfilled' && studRes.value.data) {
        setStudents(studRes.value.data);
      }
    } catch (err) {
      console.error('Failed fetching workspace data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // Handle Approving AI Recommendation
  const handleApproveRecommendation = async (recId: string) => {
    try {
      await api.post(`/teacher/recommendations/${recId}/approve`);
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
      fetchWorkspaceData();
    } catch (err) {
      console.error('Failed to approve recommendation:', err);
      alert('Error approving recommendation.');
    }
  };

  // Handle Submitting Authoritative Override
  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overridingRec) return;
    if (!overrideForm.teacherNotes.trim()) {
      alert('Teacher rationale is required for authoritative override.');
      return;
    }

    setIsSubmittingOverride(true);
    try {
      await api.post(`/teacher/recommendations/${overridingRec.id}/override`, overrideForm);
      setRecommendations((prev) => prev.filter((r) => r.id !== overridingRec.id));
      setOverridingRec(null);
      setOverrideForm({
        forcedActivityType: 'REMEDIATION',
        forcedDifficulty: 0.35,
        forcedModality: 'VISUAL',
        forcedPacing: 'SLOW',
        teacherNotes: '',
      });
      fetchWorkspaceData();
    } catch (err) {
      console.error('Failed to execute override:', err);
      alert('Error executing override.');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Handle Submitting Intervention Resolution
  const handleExecuteResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIntervention) return;
    if (!resolutionNotes.trim()) {
      alert('Resolution notes are required.');
      return;
    }

    setIsSubmittingResolve(true);
    try {
      await api.post(`/teacher/interventions/${resolvingIntervention.id}/resolve`, {
        resolutionNotes,
      });
      setResolvingIntervention(null);
      setResolutionNotes('');
      fetchWorkspaceData();
    } catch (err) {
      console.error('Failed resolving intervention:', err);
      alert('Error resolving intervention.');
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.gradeLevel && s.gradeLevel.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <MainLayout>
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
        {/* Workspace Top Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Phase P2 &bull; Teacher &amp; Learning Operations System</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
              Teacher Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Supervise AI recommendations, resolve student risk interventions, and inspect real-time Student 360 diagnostics.
            </p>
          </div>

          {/* Quick Production Action Links */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={fetchWorkspaceData}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-muted/70 hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition border border-border/60"
              title="Refresh Workspace"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <Link
              href="/dashboard/teacher/lesson-builder"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-lg transition shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Lesson Builder
            </Link>
            <Link
              href="/dashboard/teacher/worksheet-builder"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-lg transition shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              Worksheet Builder
            </Link>
            <Link
              href="/dashboard/teacher/analytics"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold rounded-lg transition shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Analytics Hub
            </Link>
          </div>
        </header>

        {/* Executive KPI Banner */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Scoped Students</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-foreground">{metrics.totalStudents}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{metrics.activeClasses} active classes</div>
          </div>

          <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Interventions</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
              {metrics.pendingInterventions}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Pending educator review</div>
          </div>

          <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Urgent Alerts</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {metrics.urgentEscalations}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Distress / safety gates</div>
          </div>

          <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Cohort Mastery</span>
              <GraduationCap className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-foreground">
              {Math.round((metrics.avgCohortMastery || 0) * 100)}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">BKT mastery average</div>
          </div>

          <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>AI Agreement</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {metrics.aiAgreementRate}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Educator endorsement</div>
          </div>

          <div className="bg-card border border-border/70 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Override Rate</span>
              <Sliders className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
              {metrics.overrideRate}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Teacher authority applied</div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Risk &amp; Attention Queue ({attentionQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('interventions')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition relative ${
              activeTab === 'interventions'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Intervention Queue
            {(interventions.urgent.length + interventions.review.length) > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                {interventions.urgent.length + interventions.review.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'recommendations'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            AI Recommendations ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Student Roster ({students.length})
          </button>
        </div>

        {/* Tab 1: Overview & Attention Queue */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Student Risk &amp; Attention Queue
                </h2>
                <p className="text-xs text-muted-foreground">
                  Learners flagged by policy gates for mastery deterioration, high cognitive stress, or unresolved escalations.
                </p>
              </div>
            </div>

            {attentionQueue.length === 0 ? (
              <div className="bg-card border border-border/70 p-8 rounded-2xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-sm">All Students Within Nominal Parameters</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  No critical cognitive distress signals or severe mastery drops currently detected in your cohort.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {attentionQueue.map((student) => {
                  const cognitiveLog = student.cognitiveStateLogs?.[0];
                  const hasEscalation = (student.escalationEvents || []).length > 0;

                  return (
                    <div
                      key={student.id}
                      className="bg-card border border-border/70 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-2xl p-5 shadow-xs transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm text-foreground">{student.name}</h3>
                            <p className="text-xs text-muted-foreground">{student.gradeLevel || 'Secondary'}</p>
                          </div>
                          {hasEscalation ? (
                            <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded-md">
                              CRITICAL ALERT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-md">
                              ATTENTION
                            </span>
                          )}
                        </div>

                        {cognitiveLog && (
                          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Brain className="w-3.5 h-3.5 text-purple-500" />
                                Cognitive Load
                              </span>
                              <span className="font-semibold text-foreground">
                                {Math.round(cognitiveLog.cognitiveLoad * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-border/70 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  cognitiveLog.cognitiveLoad > 0.8
                                    ? 'bg-rose-500'
                                    : cognitiveLog.cognitiveLoad > 0.6
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(cognitiveLog.cognitiveLoad * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {student.topicMastery && student.topicMastery.length > 0 && (
                          <div className="space-y-1 text-xs">
                            <span className="text-[11px] text-muted-foreground font-medium">Flagged Concepts:</span>
                            <div className="flex flex-wrap gap-1">
                              {student.topicMastery.map((tm, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-muted rounded text-[11px] text-foreground font-medium"
                                >
                                  {tm.topic.title} ({Math.round(tm.masteryProbability * 100)}%)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-border/50">
                        <Link
                          href={`/dashboard/teacher/students/${student.id}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg transition"
                        >
                          <span>Open Student 360 Profile</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Intervention Queue */}
        {activeTab === 'interventions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-indigo-500" />
                Educator Intervention Queue
              </h2>
              <p className="text-xs text-muted-foreground">
                In accordance with P2 Policy Invariants, AI cannot resolve interventions. Only authorized educators can review and resolve.
              </p>
            </div>

            {/* URGENT Tier */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                Urgent Interventions ({interventions.urgent.length})
              </h3>
              {interventions.urgent.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-2">No urgent escalations pending.</p>
              ) : (
                <div className="space-y-3">
                  {interventions.urgent.map((item) => (
                    <div
                      key={item.id}
                      className="bg-card border-l-4 border-l-rose-500 border border-border/70 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{item.studentName}</span>
                          <span className="text-xs text-muted-foreground">&bull; {item.gradeLevel}</span>
                          <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold rounded">
                            {item.action}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90">{item.feedback}</p>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Submitted: {new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/dashboard/teacher/students/${item.studentId}`}
                          className="px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-lg transition"
                        >
                          Student 360
                        </Link>
                        <button
                          onClick={() => setResolvingIntervention(item)}
                          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs"
                        >
                          Resolve Intervention
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* REVIEW Tier */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Pedagogical Review ({interventions.review.length})
              </h3>
              {interventions.review.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-2">No review items pending.</p>
              ) : (
                <div className="space-y-3">
                  {interventions.review.map((item) => (
                    <div
                      key={item.id}
                      className="bg-card border border-border/70 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{item.studentName}</span>
                          <span className="text-xs text-muted-foreground">&bull; {item.gradeLevel}</span>
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded">
                            {item.action}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90">{item.feedback}</p>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Triggered: {new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/dashboard/teacher/students/${item.studentId}`}
                          className="px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-lg transition"
                        >
                          Student 360
                        </Link>
                        <button
                          onClick={() => setResolvingIntervention(item)}
                          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: AI Recommendations */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Personalization Decision Queue
              </h2>
              <p className="text-xs text-muted-foreground">
                Invariants Enforced: AI recommendations are never certified without human review. Teacher override authority is definitive.
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className="bg-card border border-border/70 p-8 rounded-2xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-sm">All AI Recommendations Processed</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  There are no pending AI learning pathway suggestions waiting for teacher sign-off.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-card border border-border/70 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{rec.studentName}</span>
                        <span className="text-xs text-muted-foreground">&bull;</span>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                          {rec.topicName}
                        </span>
                        <span className="text-[11px] bg-muted px-2 py-0.5 rounded font-medium">
                          Modality: {rec.modality}
                        </span>
                        <span className="text-[11px] bg-muted px-2 py-0.5 rounded font-medium">
                          Difficulty: {Math.round(rec.difficulty * 100)}%
                        </span>
                        <span className="text-[11px] bg-muted px-2 py-0.5 rounded font-medium">
                          Pacing: {rec.pacing}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/90 leading-relaxed">
                        <span className="font-semibold text-muted-foreground">AI Rationale:</span> {rec.rationale}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveRecommendation(rec.id)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve AI Path
                      </button>
                      <button
                        onClick={() => setOverridingRec(rec)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Authoritative Override
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Student Roster */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Authorized Student Roster
                </h2>
                <p className="text-xs text-muted-foreground">
                  Scoped strictly to your assigned classrooms and worksheet cohorts under P2 Authorization Hardening.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter student name, email, grade..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Grade &amp; Tier</th>
                      <th className="p-4">Average Mastery</th>
                      <th className="p-4">Streak &amp; XP</th>
                      <th className="p-4">Cognitive State</th>
                      <th className="p-4 text-right">Diagnostic Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground italic">
                          No students found matching current search.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/30 transition">
                          <td className="p-4">
                            <div className="font-bold text-foreground">{s.name}</div>
                            <div className="text-[11px] text-muted-foreground">{s.email}</div>
                          </td>
                          <td className="p-4">
                            <div>{s.gradeLevel || 'Secondary'}</div>
                            <div className="text-[10px] text-muted-foreground uppercase">{s.cognitiveLevel}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full"
                                  style={{ width: `${Math.round(s.averageMastery * 100)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-foreground">
                                {Math.round(s.averageMastery * 100)}%
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>{s.currentStreak} day streak</div>
                            <div className="text-[11px] text-muted-foreground">{s.totalXp.toLocaleString()} XP</div>
                          </td>
                          <td className="p-4">
                            <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-muted">
                              {s.latestCognitiveState}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Link
                              href={`/dashboard/teacher/students/${s.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg transition"
                            >
                              <span>Student 360</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
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

        {/* MODAL: Resolve Intervention */}
        {resolvingIntervention && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-500" />
                  Resolve Teacher Intervention
                </h3>
                <button
                  onClick={() => setResolvingIntervention(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  &times;
                </button>
              </div>

              <div className="text-xs space-y-1 bg-muted/40 p-3 rounded-xl">
                <div><span className="font-semibold">Student:</span> {resolvingIntervention.studentName}</div>
                <div><span className="font-semibold">Action:</span> {resolvingIntervention.action}</div>
                <div><span className="font-semibold">Diagnostic Feedback:</span> {resolvingIntervention.feedback}</div>
              </div>

              <form onSubmit={handleExecuteResolve} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Mandatory Resolution Notes (Audit Logged)
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Document educator actions taken: e.g. 1-on-1 explanation conducted, prerequisite review assigned, stress check resolved..."
                    className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResolvingIntervention(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResolve}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
                  >
                    {isSubmittingResolve ? 'Recording Resolution...' : 'Confirm Resolution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Authoritative Override */}
        {overridingRec && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-500" />
                  Execute Authoritative Teacher Override
                </h3>
                <button
                  onClick={() => setOverridingRec(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  &times;
                </button>
              </div>

              <div className="text-xs space-y-1 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 p-3 rounded-xl">
                <div><span className="font-semibold">Learner:</span> {overridingRec.studentName}</div>
                <div><span className="font-semibold">Topic:</span> {overridingRec.topicName}</div>
                <div><span className="font-semibold">AI Recommendation:</span> {overridingRec.rationale}</div>
              </div>

              <form onSubmit={handleExecuteOverride} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Forced Activity Type</label>
                    <select
                      value={overrideForm.forcedActivityType}
                      onChange={(e) => setOverrideForm({ ...overrideForm, forcedActivityType: e.target.value })}
                      className="w-full text-xs p-2.5 bg-background border border-border rounded-xl"
                    >
                      <option value="REMEDIATION">REMEDIATION (Fundamental review)</option>
                      <option value="DRILL">DRILL (Repetitive practice)</option>
                      <option value="APPLICATION">APPLICATION (Real-world scenario)</option>
                      <option value="CONCEPT_REINFORCEMENT">CONCEPT REINFORCEMENT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Forced Modality</label>
                    <select
                      value={overrideForm.forcedModality}
                      onChange={(e) => setOverrideForm({ ...overrideForm, forcedModality: e.target.value })}
                      className="w-full text-xs p-2.5 bg-background border border-border rounded-xl"
                    >
                      <option value="VISUAL">VISUAL (Diagrams &amp; charts)</option>
                      <option value="TEXTUAL">TEXTUAL (Step-by-step reading)</option>
                      <option value="INTERACTIVE">INTERACTIVE (Simulations)</option>
                      <option value="KINESTHETIC">KINESTHETIC (Hands-on exercise)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Forced Difficulty: {Math.round(overrideForm.forcedDifficulty * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={overrideForm.forcedDifficulty}
                      onChange={(e) => setOverrideForm({ ...overrideForm, forcedDifficulty: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Forced Pacing</label>
                    <select
                      value={overrideForm.forcedPacing}
                      onChange={(e) => setOverrideForm({ ...overrideForm, forcedPacing: e.target.value })}
                      className="w-full text-xs p-2.5 bg-background border border-border rounded-xl"
                    >
                      <option value="SLOW">SLOW (Deliberate pacing)</option>
                      <option value="NORMAL">NORMAL</option>
                      <option value="ACCELERATED">ACCELERATED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Mandatory Override Rationale (Audit Logged)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={overrideForm.teacherNotes}
                    onChange={(e) => setOverrideForm({ ...overrideForm, teacherNotes: e.target.value })}
                    placeholder="Document pedagogical justification for overriding AI recommendation..."
                    className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOverridingRec(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOverride}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition disabled:opacity-50"
                  >
                    {isSubmittingOverride ? 'Recording Override...' : 'Apply Authoritative Override'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
