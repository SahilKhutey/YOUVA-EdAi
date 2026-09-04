"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { Flame, TrendingUp, Zap } from "lucide-react";

interface Stats {
    currentStreak: number;
    longestStreak: number;
    totalXp: number;
    currentLevel: number;
    xpToNextLevel: number;
    currentLevelXp: number;
}

export default function StreakBanner() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);

    const fetch = useCallback(async () => {
        try {
            const res = await api.get("/gamification/stats");
            setStats(res.data);
        } catch { }
    }, []);

    useEffect(() => { if (user) fetch(); }, [user, fetch]);

    if (!stats) return null;

    const xpRange = stats.xpToNextLevel - stats.currentLevelXp;
    const xpProgress = stats.totalXp - stats.currentLevelXp;
    const pct = xpRange > 0 ? Math.min(100, Math.round((xpProgress / xpRange) * 100)) : 100;

    return (
        <div className="bg-gradient-to-r from-primary/10 via-indigo-500/5 to-orange-500/10 border border-border rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                {/* Streak */}
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Flame className={`h-6 w-6 ${stats.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-foreground leading-none">{stats.currentStreak}
                            <span className="text-sm font-semibold text-muted-foreground ml-1">day streak</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Best: {stats.longestStreak} days</p>
                    </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-10 w-px bg-border" />

                {/* Level & XP */}
                <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-foreground">Level {stats.currentLevel}</p>
                            <p className="text-xs text-muted-foreground">{stats.totalXp.toLocaleString()} XP</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% to Level {stats.currentLevel + 1}</p>
                    </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-10 w-px bg-border" />

                {/* Total XP pill */}
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-foreground">{stats.totalXp.toLocaleString()} total XP</span>
                </div>
            </div>
        </div>
    );
}
