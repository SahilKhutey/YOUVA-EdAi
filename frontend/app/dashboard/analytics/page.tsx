"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  BookOpen,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// ──────── legacy types ────────
interface ActivityData { name: string; learning: number; practice: number }
interface MasteryData { subject: string; score: number; fullMark: number }
interface AnalyticsData { activityData: ActivityData[]; masteryData: MasteryData[] }

// ──────── new types ────────
interface SubjectBreakdown {
  id: string; name: string; sessionCount: number;
  accuracy: number; avgMastery: number; lastPracticed: string | null;
}
interface RecentSession {
  id: string; topicTitle: string; subjectName: string;
  score: number; accuracy: number; durationMinutes: number; date: string;
}

// ──────── helpers ────────
function AccuracyColor(pct: number) {
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 60) return "text-amber-600";
  return "text-red-500";
}
function MasteryBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [subjects, setSubjects] = useState<SubjectBreakdown[]>([]);
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "sessions">("overview");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  const fetchAll = useCallback(async () => {
    try {
      const [summaryRes, subjectRes, sessionRes] = await Promise.all([
        api.get("/analytics/summary"),
        api.get("/analytics/subject-breakdown"),
        api.get("/analytics/recent-sessions"),
      ]);
      setData(summaryRes.data);
      setSubjects(subjectRes.data);
      setSessions(sessionRes.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  if (authLoading || loading)
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading analytics…</div>;
  if (!user) return null;

  const sortedSubjects = [...subjects].sort((a, b) => b.accuracy - a.accuracy);
  const avgAccuracy = subjects.length > 0 ? Math.round(subjects.reduce((s, x) => s + x.accuracy, 0) / subjects.length) : 0;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Old-style nav kept for continuity */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
              <span className="text-xl font-bold text-primary">Analytics & Performance</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Subjects Studied", value: subjects.length, icon: BookOpen, cls: "text-primary bg-primary/10" },
            { label: "Practice Sessions", value: subjects.reduce((s, x) => s + x.sessionCount, 0), icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-50" },
            { label: "Avg. Accuracy", value: `${avgAccuracy}%`, icon: Target, cls: "text-amber-600 bg-amber-50" },
            { label: "Recent Sessions", value: sessions.length, icon: Clock, cls: "text-indigo-600 bg-indigo-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
              <div className={`p-2.5 rounded-xl w-fit mb-3 ${stat.cls}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Recharts (existing) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Monthly Activity</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} />
                  <Legend />
                  <Bar dataKey="learning" name="Learning Sessions" fill="#4f46e5" />
                  <Bar dataKey="practice" name="Practice Quizzes" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Subject Mastery Distribution</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data?.masteryData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Radar name="My Mastery" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Subject breakdown tabs ── */}
        <div>
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit mb-5">
            {(["overview", "sessions"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "overview" ? "Subject Breakdown" : "Session History"}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <>
              {subjects.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
                  <p className="font-semibold text-foreground mb-2">No subject data yet</p>
                  <Link href="/dashboard/learn"
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Start Practicing <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedSubjects.map((s) => (
                      <div key={s.id} className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-xl"><BookOpen className="h-5 w-5 text-primary" /></div>
                            <div>
                              <p className="font-bold text-foreground">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.sessionCount} session{s.sessionCount !== 1 ? "s" : ""}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`flex items-center gap-1 font-black text-2xl ${AccuracyColor(s.accuracy)}`}>
                              {s.accuracy >= 70 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {s.accuracy}%
                            </div>
                            <p className="text-[10px] text-muted-foreground">accuracy</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">BKT Mastery</span>
                            <span className="font-bold text-foreground">{s.avgMastery}%</span>
                          </div>
                          <MasteryBar pct={s.avgMastery} />
                        </div>
                        {s.lastPracticed && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1 border-t border-border">
                            <Clock className="h-3 w-3" />
                            {(() => { const d = Math.floor((Date.now() - new Date(s.lastPracticed).getTime()) / 86400000); return d === 0 ? "Today" : `${d}d ago`; })()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {sortedSubjects.length >= 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                        <p className="text-xs font-bold text-emerald-700 uppercase mb-1">🏆 Strongest</p>
                        <p className="text-xl font-bold text-foreground">{sortedSubjects[0].name}</p>
                        <p className="text-sm text-emerald-700 mt-0.5">{sortedSubjects[0].accuracy}% accuracy · {sortedSubjects[0].avgMastery}% mastery</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                        <p className="text-xs font-bold text-red-600 uppercase mb-1">📌 Needs Work</p>
                        <p className="text-xl font-bold text-foreground">{sortedSubjects[sortedSubjects.length - 1].name}</p>
                        <p className="text-sm text-red-600 mt-0.5">{sortedSubjects[sortedSubjects.length - 1].accuracy}% accuracy · {sortedSubjects[sortedSubjects.length - 1].avgMastery}% mastery</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === "sessions" && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {sessions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">No completed sessions yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      {["Topic", "Subject", "Accuracy", "Score", "Duration", "Date"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{s.topicTitle}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.subjectName}</td>
                        <td className={`px-4 py-3 font-bold ${AccuracyColor(s.accuracy)}`}>{s.accuracy}%</td>
                        <td className="px-4 py-3 text-foreground">{s.score}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.durationMinutes > 0 ? `${s.durationMinutes}m` : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
