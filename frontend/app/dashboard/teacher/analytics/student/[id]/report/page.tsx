"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { Printer, GraduationCap } from "lucide-react";

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
    badges: { badge: { name: string; icon: string } }[];
    topicMastery: {
        masteryProbability: number;
        topic: { title: string; subject: { name: string } };
    }[];
    practiceSessions: PracticeSession[];
}

function MasteryBar({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{ flex: 1, height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, width: 36, textAlign: "right", color: "#6b7280" }}>
                {pct}%
            </span>
        </div>
    );
}

export default function StudentReportPage() {
    const { id } = useParams<{ id: string }>();
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        try {
            const res = await api.get(`/teacher-analytics/student/${id}`);
            setStudent(res.data);
        } catch { }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetch(); }, [fetch]);

    if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading report…</div>;
    if (!student) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Student not found.</div>;

    // Group mastery by subject
    const bySubject: Record<string, typeof student.topicMastery> = {};
    student.topicMastery.forEach((m) => {
        const sub = m.topic.subject.name;
        if (!bySubject[sub]) bySubject[sub] = [];
        bySubject[sub].push(m);
    });

    // Average mastery per subject
    const subjectSummary = Object.entries(bySubject).map(([name, topics]) => ({
        name,
        avg: Math.round(topics.reduce((s, t) => s + t.masteryProbability, 0) / topics.length * 100),
        topics,
    }));

    const stats = student.stats;
    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const sessions = student.practiceSessions.filter(s => s.score !== null).slice(0, 10);

    return (
        <>
            {/* Print trigger button — hidden in print */}
            <div className="print:hidden fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                    <Printer className="h-5 w-5" />
                    Print / Save as PDF
                </button>
            </div>

            {/* ─── Printable report ─── */}
            <div
                id="report"
                className="print:m-0 print:p-0"
                style={{ maxWidth: 800, margin: "40px auto", padding: "0 24px", fontFamily: "Inter, system-ui, sans-serif", color: "#111827" }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #2563eb", paddingBottom: 16, marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <GraduationCap style={{ width: 26, height: 26, color: "#fff" }} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 900, fontSize: 22, margin: 0, color: "#1e40af" }}>Youva EdAi</p>
                            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Student Progress Report</p>
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, margin: 0 }}>Generated: {today}</p>
                    </div>
                </div>

                {/* Student info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24, background: "#f9fafb", borderRadius: 12, padding: 16 }}>
                    <div>
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 1 }}>Student</p>
                        <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{student.name}</p>
                        <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>{student.email}</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                            { label: "Level", value: `Level ${stats?.currentLevel ?? 1}` },
                            { label: "Total XP", value: (stats?.totalXp ?? 0).toLocaleString() },
                            { label: "Current Streak", value: `${stats?.currentStreak ?? 0} days` },
                            { label: "Best Streak", value: `${stats?.bestStreak ?? 0} days` },
                            { label: "Grade", value: student.gradeLevel ?? "—" },
                            { label: "Cognitive Level", value: student.cognitiveLevel },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                                <p style={{ fontSize: 10, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>{label}</p>
                                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#111827" }}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subject mastery summary */}
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1e40af", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>
                    Subject Mastery Overview
                </h2>
                <div style={{ marginBottom: 28 }}>
                    {subjectSummary.length === 0 && (
                        <p style={{ color: "#9ca3af", fontSize: 13 }}>No mastery data available.</p>
                    )}
                    {subjectSummary.map(({ name, avg, topics }) => (
                        <div key={name} style={{ marginBottom: 16, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ background: "#f3f4f6", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{name}</p>
                                <span style={{ fontSize: 12, fontWeight: 700, color: avg >= 70 ? "#16a34a" : avg >= 40 ? "#d97706" : "#dc2626" }}>
                                    Avg {avg}%
                                </span>
                            </div>
                            {topics.map((t) => (
                                <div key={t.topic.title} style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid #f3f4f6" }}>
                                    <span style={{ fontSize: 12, color: "#374151", width: 200, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {t.topic.title}
                                    </span>
                                    <MasteryBar value={t.masteryProbability} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Recent sessions table */}
                {sessions.length > 0 && (
                    <>
                        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1e40af", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>
                            Recent Practice Sessions
                        </h2>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 28 }}>
                            <thead>
                                <tr style={{ background: "#eff6ff" }}>
                                    {["#", "Date", "Topic", "Score"].map((h) => (
                                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: 11, color: "#1e40af", borderBottom: "2px solid #bfdbfe" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                                        <td style={{ padding: "7px 12px", color: "#9ca3af" }}>{i + 1}</td>
                                        <td style={{ padding: "7px 12px" }}>{new Date(s.startTime).toLocaleDateString("en-GB")}</td>
                                        <td style={{ padding: "7px 12px", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.topic.title}</td>
                                        <td style={{ padding: "7px 12px", fontWeight: 700, color: (s.score ?? 0) >= 70 ? "#16a34a" : (s.score ?? 0) >= 40 ? "#d97706" : "#dc2626" }}>
                                            {Math.round((s.score ?? 0) * 100) / 100}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* Badges */}
                {student.badges.length > 0 && (
                    <>
                        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1e40af", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>
                            Earned Badges
                        </h2>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                            {student.badges.map((ub, i) => (
                                <div key={i} style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 10, padding: "6px 12px", fontSize: 13, fontWeight: 600 }}>
                                    {ub.badge.icon} {ub.badge.name}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Footer */}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
                    <span>Youva EdAi — Confidential Student Report</span>
                    <span>Joined {new Date(student.createdAt).toLocaleDateString("en-GB")}</span>
                </div>
            </div>

            <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>
        </>
    );
}
