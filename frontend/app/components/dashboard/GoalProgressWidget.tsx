"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { Target, Zap, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface GoalProgress {
    goal: {
        weeklyXpTarget: number;
        weeklyStudyMinutes: number;
    };
    progress: {
        weeklyXp: number;
        weeklyXpTarget: number;
        xpPct: number;
        weeklyStudyMinutes: number;
        weeklyStudyMinutesTarget: number;
        studyPct: number;
    };
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
    return (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, pct)}%`, background: color }}
            />
        </div>
    );
}

export default function GoalProgressWidget() {
    const { user } = useAuth();
    const [data, setData] = useState<GoalProgress | null>(null);
    const [noGoal, setNoGoal] = useState(false);

    const fetch = useCallback(async () => {
        try {
            const res = await api.get("/goals/progress");
            if (res.data) setData(res.data);
            else setNoGoal(true);
        } catch {
            setNoGoal(true);
        }
    }, []);

    useEffect(() => { if (user) fetch(); }, [user, fetch]);

    return (
        <div className="clay-card p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-foreground">Weekly Goal</h3>
                </div>
                <Link
                    href="/dashboard/goals"
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                >
                    {noGoal ? "Set goal" : "Edit"} <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            {noGoal ? (
                <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">No goal set yet.</p>
                    <Link
                        href="/dashboard/goals"
                        className="text-xs font-semibold text-primary hover:underline"
                    >
                        Set your first weekly goal →
                    </Link>
                </div>
            ) : data ? (
                <div className="space-y-3">
                    {/* XP row */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Zap className="h-3.5 w-3.5 text-indigo-500" />
                                XP this week
                            </span>
                            <span className="text-xs font-bold text-foreground">
                                {data.progress.weeklyXp.toLocaleString()} / {data.progress.weeklyXpTarget.toLocaleString()}
                                {data.progress.xpPct >= 100 && <CheckCircle2 className="inline h-3 w-3 text-emerald-500 ml-1" />}
                            </span>
                        </div>
                        <MiniBar pct={data.progress.xpPct} color="hsl(var(--primary))" />
                    </div>

                    {/* Study time row */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                Study time
                            </span>
                            <span className="text-xs font-bold text-foreground">
                                {data.progress.weeklyStudyMinutes}m / {data.progress.weeklyStudyMinutesTarget}m
                                {data.progress.studyPct >= 100 && <CheckCircle2 className="inline h-3 w-3 text-emerald-500 ml-1" />}
                            </span>
                        </div>
                        <MiniBar pct={data.progress.studyPct} color="#f59e0b" />
                    </div>

                    <p className="text-[10px] text-muted-foreground pt-1">
                        {data.progress.xpPct < 100 || data.progress.studyPct < 100
                            ? `${Math.round((data.progress.xpPct + data.progress.studyPct) / 2)}% of weekly goal complete`
                            : "🎉 Weekly goal complete!"}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
