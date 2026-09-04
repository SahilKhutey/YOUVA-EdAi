"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import {
    Target,
    Zap,
    Clock,
    Edit3,
    CheckCircle2,
    Loader2,
    TrendingUp,
} from "lucide-react";

// ──────── types ────────
interface Goal {
    id: string;
    weeklyXpTarget: number;
    weeklyStudyMinutes: number;
    isActive: boolean;
    createdAt: string;
}

interface Progress {
    goal: Goal;
    progress: {
        weeklyXp: number;
        weeklyXpTarget: number;
        xpPct: number;
        weeklyStudyMinutes: number;
        weeklyStudyMinutesTarget: number;
        studyPct: number;
        weekStart: string;
        weekEnd: string;
    };
}

// ──────── progress ring ────────
function Ring({ pct, color, size = 120 }: { pct: number; color: string; size?: number }) {
    const r = (size - 16) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={8} fill="none" className="text-muted" />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={color}
                strokeWidth={8}
                fill="none"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
        </svg>
    );
}

// ──────── Goal editor ────────
function GoalEditor({
    initial,
    onSave,
    onCancel,
}: {
    initial: { xp: number; mins: number };
    onSave: (xp: number, mins: number) => Promise<void>;
    onCancel: () => void;
}) {
    const [xp, setXp] = useState(initial.xp);
    const [mins, setMins] = useState(initial.mins);
    const [saving, setSaving] = useState(false);

    const handle = async () => {
        setSaving(true);
        try { await onSave(xp, mins); } finally { setSaving(false); }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-primary" />
                Set Weekly Goal
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Weekly XP Target
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min={100}
                            max={3000}
                            step={50}
                            value={xp}
                            onChange={(e) => setXp(Number(e.target.value))}
                            className="flex-1 accent-primary"
                        />
                        <span className="w-16 text-right text-sm font-bold text-foreground">{xp} XP</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 px-0.5">
                        <span>100</span><span>3000</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Weekly Study Time (minutes)
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min={30}
                            max={600}
                            step={15}
                            value={mins}
                            onChange={(e) => setMins(Number(e.target.value))}
                            className="flex-1 accent-primary"
                        />
                        <span className="w-16 text-right text-sm font-bold text-foreground">
                            {mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}` : `${mins}m`}
                        </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 px-0.5">
                        <span>30m</span><span>10h</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handle}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Save Goal
                </button>
            </div>
        </div>
    );
}

// ──────── page ────────
export default function GoalsPage() {
    const { user } = useAuth();
    const [data, setData] = useState<Progress | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    const fetch = useCallback(async () => {
        try {
            const res = await api.get("/goals/progress");
            setData(res.data);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (user) fetch(); }, [user, fetch]);

    const handleSave = async (weeklyXpTarget: number, weeklyStudyMinutes: number) => {
        await api.post("/goals", { weeklyXpTarget, weeklyStudyMinutes });
        setEditing(false);
        await fetch();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const p = data?.progress;
    const noGoal = !data;
    const defaultXp = 500;
    const defaultMins = 120;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Target className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Weekly Goals</h1>
                        <p className="text-muted-foreground text-sm">
                            {p
                                ? `Week of ${new Date(p.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${new Date(p.weekEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                                : "Set targets to stay motivated"}
                        </p>
                    </div>
                </div>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                        <Edit3 className="h-4 w-4" />
                        {noGoal ? "Set Goal" : "Edit"}
                    </button>
                )}
            </div>

            {/* Editor */}
            {editing && (
                <GoalEditor
                    initial={{
                        xp: data?.goal.weeklyXpTarget ?? defaultXp,
                        mins: data?.goal.weeklyStudyMinutes ?? defaultMins,
                    }}
                    onSave={handleSave}
                    onCancel={() => setEditing(false)}
                />
            )}

            {/* No goal state */}
            {noGoal && !editing && (
                <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
                    <Target className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-semibold text-foreground">No goal set yet</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Set a weekly XP target and study time to track your progress.
                    </p>
                    <button
                        onClick={() => setEditing(true)}
                        className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Set My First Goal
                    </button>
                </div>
            )}

            {/* Progress cards */}
            {p && !editing && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* XP card */}
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5">
                            <div className="relative">
                                <Ring pct={p.xpPct} color="hsl(var(--primary))" size={100} />
                                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
                                    {p.xpPct}%
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Zap className="h-4 w-4 text-indigo-500" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">XP this week</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {p.weeklyXp.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    of {p.weeklyXpTarget.toLocaleString()} XP goal
                                </p>
                                {p.xpPct >= 100 && (
                                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-emerald-600 font-semibold">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Goal reached!
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Study time card */}
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5">
                            <div className="relative">
                                <Ring pct={p.studyPct} color="#f59e0b" size={100} />
                                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
                                    {p.studyPct}%
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Clock className="h-4 w-4 text-amber-500" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Study time</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {p.weeklyStudyMinutes >= 60
                                        ? `${Math.floor(p.weeklyStudyMinutes / 60)}h ${p.weeklyStudyMinutes % 60}m`
                                        : `${p.weeklyStudyMinutes}m`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    of{" "}
                                    {p.weeklyStudyMinutesTarget >= 60
                                        ? `${Math.floor(p.weeklyStudyMinutesTarget / 60)}h ${p.weeklyStudyMinutesTarget % 60 > 0 ? `${p.weeklyStudyMinutesTarget % 60}m` : ""}`
                                        : `${p.weeklyStudyMinutesTarget}m`}{" "}
                                    goal
                                </p>
                                {p.studyPct >= 100 && (
                                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-emerald-600 font-semibold">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Goal reached!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Motivation bar */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                Overall Weekly Progress
                            </span>
                            <span className="text-sm font-bold text-primary">
                                {Math.round((p.xpPct + p.studyPct) / 2)}%
                            </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, Math.round((p.xpPct + p.studyPct) / 2))}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {p.xpPct < 100 && p.studyPct < 100
                                ? `${p.weeklyXpTarget - p.weeklyXp > 0 ? `${(p.weeklyXpTarget - p.weeklyXp).toLocaleString()} XP` : ""} ${p.weeklyStudyMinutesTarget - p.weeklyStudyMinutes > 0 ? `and ${p.weeklyStudyMinutesTarget - p.weeklyStudyMinutes}m of study time` : ""} remaining this week.`
                                : "🎉 You've crushed your goals this week! Keep it up!"}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
