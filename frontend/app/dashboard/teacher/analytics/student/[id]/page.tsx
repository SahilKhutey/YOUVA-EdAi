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
    Download,
    Sliders,
    ShieldCheck,
    ShieldAlert,
    X,
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

interface ConsentRecord {
    id: string;
    guardianName: string;
    guardianRelation: string;
    formVersion: string;
    signedAt: string;
    revokedAt: string | null;
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
        targetDifficulty?: number;
        masteryProbability: number;
        topic: { id: string; title: string; subject: { name: string } };
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
    const [exporting, setExporting] = useState(false);
    const [consentList, setConsentList] = useState<ConsentRecord[]>([]);

    const [overrideModal, setOverrideModal] = useState<{
        isOpen: boolean;
        topicId: string;
        topicTitle: string;
        value: number;
        reason: string;
        isSubmitting: boolean;
        error: string | null;
    }>({
        isOpen: false,
        topicId: "",
        topicTitle: "",
        value: 0.5,
        reason: "",
        isSubmitting: false,
        error: null,
    });

    const [consentModal, setConsentModal] = useState<{
        isOpen: boolean;
        guardianName: string;
        guardianRelation: "mother" | "father" | "legal guardian";
        formVersion: string;
        signedAt: string;
        notes: string;
        isSubmitting: boolean;
        error: string | null;
    }>({
        isOpen: false,
        guardianName: "",
        guardianRelation: "legal guardian",
        formVersion: "v1.0",
        signedAt: new Date().toISOString().slice(0, 10),
        notes: "",
        isSubmitting: false,
        error: null,
    });

    const fetchStudent = useCallback(async () => {
        try {
            const [studentRes, consentRes] = await Promise.allSettled([
                api.get(`/teacher-analytics/student/${id}`),
                api.get(`/consent/student/${id}`),
            ]);
            if (studentRes.status === "fulfilled") setStudent(studentRes.value.data);
            if (consentRes.status === "fulfilled") setConsentList(consentRes.value.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (user && id) fetchStudent();
    }, [user, id, fetchStudent]);

    const handleExportData = async () => {
        if (!student) return;
        setExporting(true);
        try {
            const res = await api.get(`/consent/student/${id}/export`);
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `student-${(student.name || "export").replace(/[^a-zA-Z0-9]/g, "_")}-data.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to export student data.");
        } finally {
            setExporting(false);
        }
    };

    const handleSaveDifficulty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!overrideModal.topicId || !overrideModal.reason.trim()) return;
        setOverrideModal((prev) => ({ ...prev, isSubmitting: true, error: null }));
        try {
            await api.post(`/teacher/students/${id}/topics/${overrideModal.topicId}/difficulty`, {
                value: Number(overrideModal.value),
                reason: overrideModal.reason.trim(),
            });
            setOverrideModal((prev) => ({ ...prev, isOpen: false, isSubmitting: false }));
            await fetchStudent();
        } catch (err: any) {
            setOverrideModal((prev) => ({
                ...prev,
                isSubmitting: false,
                error: err?.response?.data?.message || "Failed to set target difficulty",
            }));
        }
    };

    const handleRecordConsent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!consentModal.guardianName.trim()) return;
        setConsentModal((prev) => ({ ...prev, isSubmitting: true, error: null }));
        try {
            await api.post("/consent", {
                studentId: id,
                guardianName: consentModal.guardianName.trim(),
                guardianRelation: consentModal.guardianRelation,
                formVersion: consentModal.formVersion.trim(),
                signedAt: new Date(consentModal.signedAt).toISOString(),
                notes: consentModal.notes.trim() || undefined,
            });
            setConsentModal((prev) => ({ ...prev, isOpen: false, isSubmitting: false }));
            await fetchStudent();
        } catch (err: any) {
            setConsentModal((prev) => ({
                ...prev,
                isSubmitting: false,
                error: err?.response?.data?.message || "Failed to record consent",
            }));
        }
    };

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

    // Active consent check
    const activeConsent = consentList.find((c) => !c.revokedAt);

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
            {/* Back navigation + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Analytics Hub
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportData}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-4 py-2 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        title="Download complete student export (JSON)"
                    >
                        <Download className="h-4 w-4 text-emerald-500" />
                        {exporting ? "Exporting..." : "Export Data"}
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
            </div>

            {/* Guardian Consent Status Card */}
            <div className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    {activeConsent ? (
                        <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                    ) : (
                        <div className="h-11 w-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-foreground">Parent / Guardian Consent</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${activeConsent ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                                {activeConsent ? 'Active & On File' : 'Consent Missing / Revoked'}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {activeConsent
                                ? `Authorized by ${activeConsent.guardianName} (${activeConsent.guardianRelation}) on ${new Date(activeConsent.signedAt).toLocaleDateString()}`
                                : 'A parent or guardian consent record is required before a student can start adaptive practice sessions.'}
                        </p>
                    </div>
                </div>
                {!activeConsent && (
                    <button
                        onClick={() => setConsentModal((prev) => ({ ...prev, isOpen: true, error: null }))}
                        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0 shadow-sm"
                    >
                        Record Guardian Consent
                    </button>
                )}
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
                                    className="px-5 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap"
                                >
                                    <div className="w-52 shrink-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {m.topic.title}
                                        </p>
                                        {m.targetDifficulty !== undefined && (
                                            <p className="text-[11px] text-primary font-medium">
                                                Target: {Math.round(m.targetDifficulty * 100)}%
                                            </p>
                                        )}
                                    </div>
                                    <MasteryBar value={m.masteryProbability} />
                                    <button
                                        onClick={() =>
                                            setOverrideModal({
                                                isOpen: true,
                                                topicId: m.topic.id,
                                                topicTitle: m.topic.title,
                                                value: m.targetDifficulty ?? 0.5,
                                                reason: "",
                                                isSubmitting: false,
                                                error: null,
                                            })
                                        }
                                        className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-muted/60 hover:bg-primary/10 hover:text-primary text-muted-foreground rounded-lg text-xs font-medium transition-colors shrink-0"
                                        title="Adjust target difficulty for adaptive practice"
                                    >
                                        <Sliders className="h-3.5 w-3.5" />
                                        Override Target
                                    </button>
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

            {/* Modal: Target Difficulty Override */}
            {overrideModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sliders className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-foreground text-base">
                                    Set Target Difficulty
                                </h3>
                            </div>
                            <button
                                onClick={() =>
                                    setOverrideModal((p) => ({ ...p, isOpen: false, error: null }))
                                }
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground mb-4">
                            Topic: <strong className="text-foreground">{overrideModal.topicTitle}</strong>.
                            Adjust the difficulty baseline for future adaptive quizzes.
                        </p>

                        <form onSubmit={handleSaveDifficulty} className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1.5">
                                    <span className="text-muted-foreground">Difficulty Target</span>
                                    <span className="text-primary font-bold">
                                        {Math.round(overrideModal.value * 100)}% (
                                        {overrideModal.value < 0.35
                                            ? "Easy"
                                            : overrideModal.value < 0.7
                                                ? "Moderate"
                                                : "Challenging"}
                                        )
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={overrideModal.value}
                                    onChange={(e) =>
                                        setOverrideModal((p) => ({
                                            ...p,
                                            value: parseFloat(e.target.value),
                                        }))
                                    }
                                    className="w-full accent-primary cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                    <span>10% (Foundational)</span>
                                    <span>50% (Standard)</span>
                                    <span>100% (Advanced)</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1">
                                    Pedagogical Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={overrideModal.reason}
                                    onChange={(e) =>
                                        setOverrideModal((p) => ({
                                            ...p,
                                            reason: e.target.value,
                                        }))
                                    }
                                    placeholder="Explain why this student needs a custom difficulty level..."
                                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {overrideModal.error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                                    {overrideModal.error}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOverrideModal((p) => ({ ...p, isOpen: false, error: null }))
                                    }
                                    className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        overrideModal.isSubmitting ||
                                        !overrideModal.reason.trim()
                                    }
                                    className="px-4 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {overrideModal.isSubmitting && (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    Save Override
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Record Guardian Consent */}
            {consentModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl w-full max-w-md animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                <h3 className="font-semibold text-foreground text-base">
                                    Record Guardian Consent
                                </h3>
                            </div>
                            <button
                                onClick={() =>
                                    setConsentModal((p) => ({ ...p, isOpen: false, error: null }))
                                }
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground mb-4">
                            Record verified parental/guardian permission for FERPA/COPPA compliance and personalized AI tracking for <strong className="text-foreground">{student.name}</strong>.
                        </p>

                        <form onSubmit={handleRecordConsent} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1">
                                    Guardian Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={consentModal.guardianName}
                                    onChange={(e) =>
                                        setConsentModal((p) => ({
                                            ...p,
                                            guardianName: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Jane Doe"
                                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">
                                        Relationship <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={consentModal.guardianRelation}
                                        onChange={(e) =>
                                            setConsentModal((p) => ({
                                                ...p,
                                                guardianRelation: e.target.value as any,
                                            }))
                                        }
                                        className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="legal guardian">Legal Guardian</option>
                                        <option value="mother">Mother</option>
                                        <option value="father">Father</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">
                                        Form Version <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={consentModal.formVersion}
                                        onChange={(e) =>
                                            setConsentModal((p) => ({
                                                ...p,
                                                formVersion: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1">
                                    Signed Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={consentModal.signedAt}
                                    onChange={(e) =>
                                        setConsentModal((p) => ({
                                            ...p,
                                            signedAt: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1">
                                    Verification Notes (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={consentModal.notes}
                                    onChange={(e) =>
                                        setConsentModal((p) => ({
                                            ...p,
                                            notes: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Physical signed slip received at front office."
                                    className="w-full px-3 py-2 text-xs bg-muted/40 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {consentModal.error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                                    {consentModal.error}
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setConsentModal((p) => ({ ...p, isOpen: false, error: null }))
                                    }
                                    className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        consentModal.isSubmitting ||
                                        !consentModal.guardianName.trim()
                                    }
                                    className="px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {consentModal.isSubmitting && (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    Record Consent
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
