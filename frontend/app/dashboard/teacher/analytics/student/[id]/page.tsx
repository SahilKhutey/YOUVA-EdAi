"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
    ArrowLeft,
    BookOpen,
    Flame,
    Star,
    Zap,
    AlertCircle,
    CheckCircle2,
    Loader2,
    BrainCircuit,
    Printer,
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface MistakeLog {
    id: string;
    description: string;
    isResolved: boolean;
    createdAt: string;
    topic: { title: string };
}

interface PracticeSession {
    score: number | null;
    startTime: string;
    topic: { title: string };
}

interface StudentDetail {
    id: string;
    name: string;
    email: string;
    gradeLevel: string | null;
    cognitiveLevel: string;
    createdAt: string;
    stats: {
        totalXp: number;
        currentLevel: number;
        currentStreak: number;
        bestStreak: number;
    } | null;
    badges: { badge: { name: string; icon: string; description: string } }[];
    topicMastery: {
        masteryProbability: number;
        topic: { title: string; subject: { name: string } };
    }[];
    practiceSessions: PracticeSession[];
    mistakeLogs: MistakeLog[];
}

function MasteryBar({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color =
        pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
    return (
        <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-semibold text-muted-foreground w-8 text-right">
                {pct}%
            </span>
        </div>
    );
}

export default function StudentDetailPage() {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"mastery" | "sessions" | "mistakes">("mastery");

    const fetchStudent = useCallback(async () => {
        try {
            const res = await api.get(`/teacher-analytics/student/${id}`);
            setStudent(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (user && id) fetchStudent();
    }, [user, id, fetchStudent]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4 text-center">
                <p className="text-muted-foreground">Student not found or unauthorized.</p>
            </div>
        );
    }

    // Group topic mastery by subject
    const bySubject: Record<string, typeof student.topicMastery> = {};
    student.topicMastery.forEach((m) => {
        const sub = m.topic.subject.name;
        if (!bySubject[sub]) bySubject[sub] = [];
        bySubject[sub].push(m);
    });

    // Score chart data
    const chartData = [...student.practiceSessions]
        .reverse()
        .filter((s) => s.score !== null)
        .map((s, i) => ({
            session: `S${i + 1}`,
            score: Math.round((s.score ?? 0) * 100) / 100,
            topic: s.topic.title,
        }));

    const stats = student.stats;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Back navigation + Print */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Analytics Hub
                </button>
                <a
                    href={`/dashboard/teacher/analytics/student/${id}/report`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                    <Printer className="h-4 w-4 text-primary" />
                    Print Report
                </a>
            </div>

            {/* Student profile header */}
            <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    {/* Avatar */}
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
                        {(student.name ?? "?")[0].toUpperCase()}
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold text-foreground">
                                {student.name}
                            </h1>
                            <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                Level {stats?.currentLevel ?? 1}
                            </span>
                            {student.gradeLevel && (
                                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                                    Grade {student.gradeLevel}
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm">{student.email}</p>

                        {/* Stat pills */}
                        <div className="flex flex-wrap gap-3 pt-2">
                            {[
                                {
                                    icon: Zap,
                                    label: "Total XP",
                                    value: (stats?.totalXp ?? 0).toLocaleString(),
                                    color: "text-indigo-500",
                                },
                                {
                                    icon: Flame,
                                    label: "Streak",
                                    value: `${stats?.currentStreak ?? 0}d`,
                                    color: "text-orange-500",
                                },
                                {
                                    icon: Star,
                                    label: "Best Streak",
                                    value: `${stats?.bestStreak ?? 0}d`,
                                    color: "text-amber-500",
                                },
                                {
                                    icon: BrainCircuit,
                                    label: "Cognitive Level",
                                    value: student.cognitiveLevel,
                                    color: "text-purple-500",
                                },
                            ].map(({ icon: Icon, label, value, color }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg"
                                >
                                    <Icon className={`h-4 w-4 ${color}`} />
                                    <span className="text-xs text-muted-foreground">{label}:</span>
                                    <span className="text-xs font-bold text-foreground">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Badges */}
                    {student.badges.length > 0 && (
                        <div className="flex flex-wrap gap-2 sm:max-w-[180px]">
                            {student.badges.slice(0, 6).map((ub, i) => (
                                <div
                                    key={i}
                                    title={ub.badge.description}
                                    className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-lg"
                                >
                                    {ub.badge.icon}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
                {(["mastery", "sessions", "mistakes"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab
                            ? "bg-card shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab === "mastery"
                            ? "Topic Mastery"
                            : tab === "sessions"
                                ? "Recent Scores"
                                : "Mistake Log"}
                    </button>
                ))}
            </div>

            {/* Tab: Topic Mastery */}
            {activeTab === "mastery" && (
                <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                    {Object.entries(bySubject).map(([subject, topics]) => (
                        <div key={subject}>
                            <div className="px-5 py-3 bg-muted/30 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-sm text-foreground">
                                    {subject}
                                </h3>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {topics.length} topics
                                </span>
                            </div>
                            {topics.map((m) => (
                                <div
                                    key={m.topic.title}
                                    className="px-5 py-3 flex items-center gap-3"
                                >
                                    <span className="text-sm text-foreground w-52 truncate shrink-0">
                                        {m.topic.title}
                                    </span>
                                    <MasteryBar value={m.masteryProbability} />
                                </div>
                            ))}
                        </div>
                    ))}
                    {Object.keys(bySubject).length === 0 && (
                        <div className="py-10 text-center text-muted-foreground text-sm">
                            No topic mastery data yet.
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Recent Practice Scores */}
            {activeTab === "sessions" && (
                <div className="bg-card rounded-2xl border border-border p-6">
                    <h2 className="font-semibold text-foreground mb-4">
                        Last {chartData.length} Practice Sessions
                    </h2>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={chartData}>
                                <XAxis
                                    dataKey="session"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    unit="%"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(v: number | undefined) => [`${v ?? 0}%`, "Score"]}
                                    labelFormatter={(label, payload) =>
                                        payload?.[0]
                                            ? `${label}: ${(payload[0].payload as { topic: string }).topic}`
                                            : label
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6366f1"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: "#6366f1" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                            No practice sessions recorded yet.
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Mistake Log */}
            {activeTab === "mistakes" && (
                <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                    {student.mistakeLogs.length === 0 && (
                        <div className="py-10 text-center text-muted-foreground text-sm">
                            No mistakes logged yet — great student! 🎉
                        </div>
                    )}
                    {student.mistakeLogs.map((log) => (
                        <div key={log.id} className="px-5 py-4 flex items-start gap-3">
                            {log.isResolved ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                    {log.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {log.topic.title} ·{" "}
                                    {new Date(log.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <span
                                className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${log.isResolved
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                    }`}
                            >
                                {log.isResolved ? "Resolved" : "Open"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
