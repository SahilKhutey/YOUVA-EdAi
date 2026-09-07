'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/app/components/MainLayout';
import api from '@/lib/axios';
import {
  ArrowLeft,
  GraduationCap,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Flame,
  Layers,
  Sparkles,
  HelpCircle,
  FileText,
  Target,
  History,
  ShieldAlert,
  Send,
  Sliders,
  Check
} from 'lucide-react';

interface Student360Data {
  studentId: string;
  profile: {
    name: string;
    email: string;
    gradeLevel: string;
    cognitiveLevel: string;
    onboardingComplete: boolean;
    currentStreak: number;
    totalXp: number;
    learningVelocity: number;
  };
  currentMastery: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
    masteryProbability: number;
    targetDifficulty: number;
  }>;
  conceptStrengths: Array<{ topic: string; subject: string; score: number }>;
  conceptWeaknesses: Array<{ topic: string; subject: string; score: number }>;
  recentMistakes: Array<{ id: string; description: string; topicId: string; createdAt: string }>;
  recentEvidence: Array<{
    id: string;
    topicName: string;
    accuracy: number;
    attemptNumber: number;
    hintCount: number;
    misconception: string | null;
    submittedAt: string;
  }>;
  cognitiveState: {
    cognitiveLoad: number;
    errorClusterScore: number;
    inferredState: string;
    retrievalStrength: number;
    attentionSwitching: number;
    lastLoggedAt: string;
  } | null;
  activeGoals: Array<{ id: string; title: string; targetScore: number }>;
  recentAiDecisions: Array<{
    id: string;
    topicName: string;
    activityType: string;
    difficulty: number;
    status: string;
    rationale: string;
  }>;
  teacherActionHistory: Array<{
    id: string;
    action: string;
    teacherName: string;
    feedback: string;
    status: string;
    timestamp: string;
  }>;
  recommendedIntervention: string;
}

export default function Student360Page() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Student360Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Intervention Creation Modal
  const [showInterveneModal, setShowInterveneModal] = useState(false);
  const [interveneFeedback, setInterveneFeedback] = useState('');
  const [interveneAction, setInterveneAction] = useState('REMEDIATION');
  const [submittingIntervention, setSubmittingIntervention] = useState(false);

  const fetchStudent360 = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/teacher/students/${studentId}`);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed fetching Student 360:', err);
      if (err.response?.status === 403) {
        setError('403 Forbidden: You do not have pedagogical scope over this student under P2 Authorization Hardening.');
      } else {
        setError('Failed loading Student 360 data. Verify that student exists and backend is online.');
      }
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudent360();
  }, [fetchStudent360]);

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interveneFeedback.trim()) {
      alert('Intervention guidance notes are required.');
      return;
    }

    setSubmittingIntervention(true);
    try {
      await api.post('/learning-loop/teacher/intervention', {
        studentId,
        action: interveneAction,
        feedback: interveneFeedback,
      });
      setShowInterveneModal(false);
      setInterveneFeedback('');
      fetchStudent360();
    } catch (err) {
      console.error('Failed creating intervention:', err);
      alert('Error submitting intervention.');
    } finally {
      setSubmittingIntervention(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 max-w-[1400px] mx-auto flex items-center justify-center min-h-[500px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-muted-foreground font-medium">Assembling Student 360 Diagnostic Dossier...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8 max-w-[1000px] mx-auto space-y-6">
          <Link
            href="/dashboard/teacher"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teacher Command Center
          </Link>

          <div className="p-8 rounded-2xl bg-card border border-rose-200 dark:border-rose-900 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Authorization or Access Constraint</h2>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">{error}</p>
            <div className="pt-2">
              <Link
                href="/dashboard/teacher"
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition"
              >
                Return to Scoped Roster
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/teacher"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teacher Command Center
          </Link>

          <button
            onClick={() => setShowInterveneModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            Direct Teacher Intervention
          </button>
        </div>

        {/* Student Dossier Header Card */}
        <header className="bg-card border border-border/70 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {data.profile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">{data.profile.name}</h1>
                <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded-full uppercase">
                  {data.profile.cognitiveLevel} Tier
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{data.profile.email}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  {data.profile.gradeLevel}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Velocity: {data.profile.learningVelocity.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Streak
              </div>
              <div className="text-xl font-black text-amber-800 dark:text-amber-200">
                {data.profile.currentStreak} Days
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5" />
                Total XP
              </div>
              <div className="text-xl font-black text-indigo-800 dark:text-indigo-200">
                {data.profile.totalXp.toLocaleString()}
              </div>
            </div>
          </div>
        </header>

        {/* Recommended Intervention Alert Banner */}
        <section className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-5 flex items-start gap-3">
          <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
              Diagnostic Synthesis &amp; Recommended Action
            </h3>
            <p className="text-xs text-foreground/90 leading-relaxed font-medium">
              {data.recommendedIntervention}
            </p>
          </div>
        </section>

        {/* Diagnostic Grid: Strengths, Weaknesses, Cognitive State */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Concept Strengths */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Concept Strengths (Mastery &ge; 75%)
            </h3>
            {data.conceptStrengths.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No topics have achieved mastery threshold yet.</p>
            ) : (
              <div className="space-y-2">
                {data.conceptStrengths.map((s, idx) => (
                  <div key={idx} className="p-3 bg-muted/40 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{s.topic}</div>
                      <div className="text-[10px] text-muted-foreground">{s.subject}</div>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(s.score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Concept Weaknesses */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Concept Vulnerabilities (Mastery &lt; 40%)
            </h3>
            {data.conceptWeaknesses.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No concepts currently below critical threshold.</p>
            ) : (
              <div className="space-y-2">
                {data.conceptWeaknesses.map((w, idx) => (
                  <div key={idx} className="p-3 bg-muted/40 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{w.topic}</div>
                      <div className="text-[10px] text-muted-foreground">{w.subject}</div>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {Math.round(w.score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cognitive State Telemetry */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Brain className="w-4 h-4" />
              Neural Cognitive Telemetry
            </h3>
            {data.cognitiveState ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Inferred State:</span>
                  <span className="font-bold capitalize text-foreground">{data.cognitiveState.inferredState}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Cognitive Load:</span>
                    <span className="font-bold">{Math.round(data.cognitiveState.cognitiveLoad * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        data.cognitiveState.cognitiveLoad > 0.8
                          ? 'bg-rose-500'
                          : data.cognitiveState.cognitiveLoad > 0.6
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(data.cognitiveState.cognitiveLoad * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Retrieval Strength:</span>
                  <span className="font-semibold">{Math.round(data.cognitiveState.retrievalStrength * 100)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Attention Switching:</span>
                  <span className="font-semibold">{data.cognitiveState.attentionSwitching.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No real-time neural cognitive log recorded yet.</p>
            )}
          </div>
        </section>

        {/* Detailed Curriculum Topic Mastery Table */}
        <section className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Curriculum Topic Mastery (Bayesian Knowledge Tracing)
            </h2>
            <span className="text-xs text-muted-foreground">{data.currentMastery.length} Enrolled Topics</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Topic Title</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Mastery Probability</th>
                  <th className="p-3">Current Difficulty Pacing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.currentMastery.map((m) => (
                  <tr key={m.topicId} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">{m.topicName}</td>
                    <td className="p-3 text-muted-foreground">{m.subjectName}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.round(m.masteryProbability * 100)}%` }}
                          />
                        </div>
                        <span className="font-bold">{Math.round(m.masteryProbability * 100)}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-muted rounded text-[11px] font-medium">
                        Target {Math.round(m.targetDifficulty * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Learning Evidence Log */}
        <section className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Recent Learning Evidence Submissions
            </h2>
            <span className="text-xs text-muted-foreground">Idempotent Evidence Verification</span>
          </div>

          {data.recentEvidence.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No evidence logs submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 bg-muted/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">{ev.topicName}</div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Attempt #{ev.attemptNumber}</span>
                      <span>&bull;</span>
                      <span>Hints Used: {ev.hintCount}</span>
                      <span>&bull;</span>
                      <span>{new Date(ev.submittedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {ev.misconception && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-semibold rounded">
                        Misconception: {ev.misconception}
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        ev.accuracy >= 0.8
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      Accuracy: {Math.round(ev.accuracy * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Teacher Action History & Past Interventions */}
        <section className="bg-card border border-border/70 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              Teacher Action &amp; Intervention Audit History
            </h2>
            <span className="text-xs text-muted-foreground">Human-in-the-Loop Audit Trail</span>
          </div>

          {data.teacherActionHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No historical teacher actions logged for this student.</p>
          ) : (
            <div className="space-y-2">
              {data.teacherActionHistory.map((act) => (
                <div key={act.id} className="p-3 bg-muted/40 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{act.action} by {act.teacherName}</span>
                    <span className="text-[11px] text-muted-foreground">{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{act.feedback}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MODAL: Direct Intervention */}
        {showInterveneModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-500" />
                  Assign Direct Teacher Intervention
                </h3>
                <button
                  onClick={() => setShowInterveneModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateIntervention} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Intervention Strategy</label>
                  <select
                    value={interveneAction}
                    onChange={(e) => setInterveneAction(e.target.value)}
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-xl"
                  >
                    <option value="REMEDIATION">REMEDIATION (Foundational review)</option>
                    <option value="DIAGNOSTIC_INTERVIEW">DIAGNOSTIC 1-ON-1</option>
                    <option value="SCAFFOLDED_PRACTICE">SCAFFOLDED PRACTICE</option>
                    <option value="SAFETY_CHECK">WELLBEING / SAFETY CHECK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Pedagogical Notes &amp; Direct Instructions</label>
                  <textarea
                    rows={4}
                    required
                    value={interveneFeedback}
                    onChange={(e) => setInterveneFeedback(e.target.value)}
                    placeholder="Provide specific feedback or prescribe tailored exercises to guide this student..."
                    className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInterveneModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingIntervention}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
                  >
                    {submittingIntervention ? 'Dispatching...' : 'Dispatch Intervention'}
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
