"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { Medal, Lock, ChevronRight } from "lucide-react";
import Link from "next/link";

const ICONS: Record<string, string> = {
    "star": "⭐",
    "book": "📚",
    "flame": "🔥",
    "flame-hot": "🔥",
    "trophy": "🏆",
    "zap": "⚡",
    "target": "🎯",
    "brain": "🧠",
    "check": "✅",
    "lightning": "⚡",
};

interface Badge {
    id: string;
    badge: {
        name: string;
        description: string;
        icon: string;
    };
    earnedAt: string;
}

export default function BadgeShowcase() {
    const { user } = useAuth();
    const [badges, setBadges] = useState<Badge[]>([]);

    const fetch = useCallback(async () => {
        try {
            const res = await api.get("/gamification/badges");
            // Only earned badges are returned; take first 6
            setBadges((res.data as Badge[]).filter((b) => b.earnedAt).slice(0, 6));
        } catch { }
    }, []);

    useEffect(() => { if (user) fetch(); }, [user, fetch]);

    const placeholders = Math.max(0, 6 - badges.length);

    return (
        <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-foreground">Badges Earned</h3>
                </div>
                <Link
                    href="/dashboard/progress"
                    className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                >
                    View all <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="grid grid-cols-6 gap-2">
                {badges.map((b) => (
                    <div
                        key={b.id}
                        title={`${b.badge.name}: ${b.badge.description}`}
                        className="aspect-square flex flex-col items-center justify-center bg-amber-50 border border-amber-200 rounded-xl text-xl cursor-default hover:scale-110 transition-transform"
                    >
                        {ICONS[b.badge.icon] ?? "🏅"}
                    </div>
                ))}
                {Array.from({ length: placeholders }).map((_, i) => (
                    <div
                        key={`lock-${i}`}
                        className="aspect-square flex items-center justify-center bg-muted/50 border border-dashed border-border rounded-xl text-muted-foreground/40"
                    >
                        <Lock className="h-4 w-4" />
                    </div>
                ))}
            </div>

            {badges.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-1">
                    Complete sessions to earn your first badge!
                </p>
            )}
        </div>
    );
}
