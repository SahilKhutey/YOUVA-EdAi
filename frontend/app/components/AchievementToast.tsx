"use client";

import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface ToastData {
    id: string;
    title: string;
    message: string;
    icon?: string;
}

export default function AchievementToast() {
    const { notifications } = useNotifications();
    const [queue, setQueue] = useState<ToastData[]>([]);
    const [seen, setSeen] = useState<Set<string>>(new Set());

    // Watch for new badge notifications
    useEffect(() => {
        const latest = notifications[0];
        if (!latest) return;
        if (latest.type !== "badge" && latest.type !== "streak" && latest.type !== "goal") return;
        if (seen.has(latest.id)) return;

        setSeen((prev) => new Set(prev).add(latest.id));
        setQueue((prev) => [
            ...prev,
            { id: latest.id, title: latest.title, message: latest.message },
        ]);
    }, [notifications, seen]);

    const dismiss = (id: string) =>
        setQueue((prev) => prev.filter((t) => t.id !== id));

    // Auto-dismiss after 5s
    useEffect(() => {
        if (queue.length === 0) return;
        const timer = setTimeout(() => dismiss(queue[0].id), 5000);
        return () => clearTimeout(timer);
    }, [queue]);

    if (queue.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[9997] flex flex-col gap-2 pointer-events-none">
            {queue.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        "flex items-center gap-3 bg-card border border-amber-300 rounded-2xl shadow-2xl px-4 py-3 w-80 pointer-events-auto",
                        "animate-in slide-in-from-right-4 fade-in duration-300",
                    )}
                >
                    {/* Icon */}
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                        <Trophy className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-0.5">
                            Achievement Unlocked!
                        </p>
                        <p className="text-sm font-bold text-foreground truncate">{toast.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{toast.message}</p>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={() => dismiss(toast.id)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>

                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-200 rounded-b-2xl overflow-hidden">
                        <div className="h-full bg-amber-400 animate-[shrink_5s_linear_forwards] rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
