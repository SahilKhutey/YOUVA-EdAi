"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import Link from "next/link";
import {
    Users,
    TrendingUp,
    BookOpen,
    Award,
    ChevronRight,
    ArrowUpDown,
    Activity,
    Loader2,
    BarChart2,
    Download,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

// ─────────────────────────── types ───────────────────────────
interface Student {
    id: string;
    name: string;
    email: string;
    totalXp: number;
    currentLevel: number;
    currentStreak: number;
    avgMastery: number;
}

interface SubjectMastery {
    subject: string;
    avgMastery: number;
}

interface SubjectEngagement {
    subject: string;
    avgEngagement: number;
}

interface CohortData {
    subjectMastery: SubjectMastery[];
    subjectEngagement: SubjectEngagement[];
    activeStudentCount: number;
    totalStudentCount: number;
}

interface WorksheetItem {
    id: string;
    title: string;
    topicTitle: string;
    difficulty: string;
    publishedAt: string;
    submissionCount: number;
    avgScore: number;
}

interface ContentItem {
    id: string;
    type: string;
    difficulty: string;
    learningObjective: string;
    bloomsTaxonomyLevel: string;
    topicTitle: string;
    publishedAt: string;
    practiceCount: number;
    avgScore: number;
}

type SortKey = "name" | "totalXp" | "currentLevel" | "avgMastery";

const ENGAGEMENT_COLORS = ["#ef4444", "#f59e0b", "#22c55e"];
const MASTERY_COLOR = "#6366f1";

function EngagementPie({ students }: { students: Student[] }) {
    const low = students.filter((s) => s.avgMastery < 40).length;
    const mid = students.filter(
        (s) => s.avgMastery >= 40 && s.avgMastery < 70
    ).length;
    const high = students.filter((s) => s.avgMastery >= 70).length;

    const data = [
        { name: "Struggling (<40%)", value: low },
        { name: "Progressing (40-70%)", value: mid },
        { name: "Excelling (>70%)", value: high },
    ].filter((d) => d.value > 0);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No student data yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                >
                    {data.map((_, i) => (
                        <Cell
                            key={i}
                            fill={ENGAGEMENT_COLORS[i % ENGAGEMENT_COLORS.length]}
                        />
                    ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
            </PieChart>
        </ResponsiveContainer>
    );
}

function ContentTypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        LESSON_PLAN: "bg-blue-100 text-blue-800",
        WORKSHEET: "bg-purple-100 text-purple-800",
        QUIZ: "bg-amber-100 text-amber-800",
        HOMEWORK: "bg-green-100 text-green-800",
    };
    return (
        <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[type] ?? "bg-slate-100 text-slate-600"}`}
        >
            {type.replace("_", " ")}
        </span>
    );
}

// ──────────────────────────── page ───────────────────────────
export default function TeacherAnalyticsPage() {
    const { user } = useAuth();
    const [cohort, setCohort] = useState<CohortData | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [content, setContent] = useState<ContentItem[]>([]);
    const [worksheets, setWorksheets] = useState<WorksheetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState<SortKey>("avgMastery");
    const [sortAsc, setSortAsc] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            const [cohortRes, studentsRes, contentRes, worksheetRes] = await Promise.all([
                api.get("/teacher-analytics/cohort"),
                api.get("/teacher-analytics/students"),
                api.get("/teacher-analytics/content-performance"),
                api.get("/teacher-analytics/worksheet-performance")
            ]);
            setCohort(cohortRes.data);
            setStudents(studentsRes.data);
            setContent(contentRes.data);
            setWorksheets(worksheetRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) fetchAll();
    }, [user, fetchAll]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc((a) => !a);
        else {
            setSortKey(key);
            setSortAsc(false);
        }
    };

    const handleExportCsv = async () => {
        try {
            const res = await api.get("/teacher-analytics/export-csv", {
                responseType: "blob",
            });
            const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("CSV export failed", e);
        }
    };

    const sorted = [...students].sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        if (typeof va === "string" && typeof vb === "string") {
            return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        }
        return sortAsc
            ? (va as number) - (vb as number)
            : (vb as number) - (va as number);
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">
                    Loading class analytics…
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <BarChart2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Analytics Hub
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Class performance, engagement, and content effectiveness
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
                >
                    <Download className="h-4 w-4 text-primary" />
                    Export CSV
                </button>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Students",
                        value: cohort?.totalStudentCount ?? 0,
                        icon: Users,
                        color: "text-indigo-500",
                        bg: "bg-indigo-50",
                    },
                    {
                        label: "Active Students",
                        value: cohort?.activeStudentCount ?? 0,
                        icon: Activity,
                        color: "text-emerald-500",
                        bg: "bg-emerald-50",
                    },
                    {
                        label: "Subjects Tracked",
                        value: cohort?.subjectMastery.length ?? 0,
                        icon: BookOpen,
                        color: "text-blue-500",
                        bg: "bg-blue-50",
                    },
                    {
                        label: "Published Content",
                        value: content.length,
                        icon: Award,
                        color: "text-amber-500",
                        bg: "bg-amber-50",
                    },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div
                        key={label}
                        className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-xl ${bg}`}>
                            <Icon className={`h-6 w-6 ${color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{value}</p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject Mastery Bar Chart */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold text-foreground">
                            Class Mastery by Subject
                        </h2>
                    </div>
                    {cohort && cohort.subjectMastery.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={cohort.subjectMastery} barSize={28}>
                                <XAxis
                                    dataKey="subject"
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
                                    formatter={(v: number | undefined) => [`${v ?? 0}%`, "Avg Mastery"]}
                                />
                                <Bar
                                    dataKey="avgMastery"
                                    fill={MASTERY_COLOR}
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                            No mastery data yet
                        </div>
                    )}
                </div>

                {/* Student Mastery Distribution Pie */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold text-foreground">
                            Student Mastery Distribution
                        </h2>
                    </div>
                    <EngagementPie students={students} />
                </div>
            </div>

            {/* Student Roster Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Student Roster
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        {students.length} students
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                {[
                                    { key: "name" as SortKey, label: "Student" },
                                    { key: "avgMastery" as SortKey, label: "Avg Mastery" },
                                    { key: "currentLevel" as SortKey, label: "Level" },
                                    { key: "totalXp" as SortKey, label: "XP" },
                                    { key: "currentStreak" as SortKey, label: "Streak" },
                                ].map(({ key, label }) => (
                                    <th
                                        key={key}
                                        className="px-5 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                                        onClick={() => toggleSort(key)}
                                    >
                                        <span className="flex items-center gap-1">
                                            {label}
                                            <ArrowUpDown className="h-3 w-3" />
                                        </span>
                                    </th>
                                ))}
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sorted.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-10 text-center text-muted-foreground"
                                    >
                                        No students registered yet.
                                    </td>
                                </tr>
                            )}
                            {sorted.map((s) => (
                                <tr
                                    key={s.id}
                                    className="hover:bg-muted/30 transition-colors group"
                                >
                                    <td className="px-5 py-3">
                                        <div>
                                            <p className="font-medium text-foreground">{s.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.email}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${s.avgMastery >= 70
                                                        ? "bg-emerald-500"
                                                        : s.avgMastery >= 40
                                                            ? "bg-amber-400"
                                                            : "bg-red-400"
                                                        }`}
                                                    style={{ width: `${s.avgMastery}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold">
                                                {s.avgMastery}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                                            Lv {s.currentLevel}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 font-mono text-foreground">
                                        {s.totalXp.toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="text-sm">🔥 {s.currentStreak}d</span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <Link
                                            href={`/dashboard/teacher/analytics/student/${s.id}`}
                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            View profile <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Published Content Performance */}
            {content.length > 0 && (
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold text-foreground">
                            Published Content Performance
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        {content.map((c) => (
                            <div
                                key={c.id}
                                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <ContentTypeBadge type={c.type} />
                                        <span className="text-xs text-muted-foreground">
                                            {c.bloomsTaxonomyLevel}
                                        </span>
                                    </div>
                                    <p className="font-medium text-foreground text-sm">
                                        {c.topicTitle}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {c.learningObjective}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-foreground">
                                            {c.practiceCount}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Attempts</p>
                                    </div>
                                    <div className="text-center">
                                        <p
                                            className={`text-xl font-bold ${c.avgScore >= 70
                                                ? "text-emerald-600"
                                                : c.avgScore >= 40
                                                    ? "text-amber-600"
                                                    : "text-red-500"
                                                }`}
                                        >
                                            {c.avgScore > 0 ? `${c.avgScore}%` : "—"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Avg Score</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Worksheet Performance */}
            {worksheets.length > 0 && (
                <div className="bg-card rounded-2xl border border-border overflow-hidden mt-8">
                    <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-indigo-500" />
                        <h2 className="font-semibold text-foreground">
                            Worksheet Performance
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        {worksheets.map((w) => (
                            <div
                                key={w.id}
                                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors group"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-semibold">{w.topicTitle}</span>
                                        <span className="text-xs text-muted-foreground">{w.difficulty}</span>
                                    </div>
                                    <p className="font-bold text-foreground text-[15px]">
                                        {w.title}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-foreground">
                                            {w.submissionCount}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Submissions</p>
                                    </div>
                                    <div className="text-center min-w-[64px]">
                                        <p
                                            className={`text-xl font-extrabold ${w.avgScore >= 70
                                                ? "text-emerald-600"
                                                : w.avgScore >= 40
                                                    ? "text-amber-500"
                                                    : "text-red-500"
                                                }`}
                                        >
                                            {w.submissionCount > 0 ? `${w.avgScore}%` : "—"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Avg</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
