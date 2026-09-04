"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, X, CheckCheck, Megaphone, Zap, Trophy, Flame, Target, Info } from "lucide-react";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

// ──────── notification icon map ────────
function NotifIcon({ type }: { type: AppNotification["type"] }) {
    const map: Record<AppNotification["type"], { Icon: React.ElementType; cls: string }> = {
        badge: { Icon: Trophy, cls: "text-amber-500 bg-amber-50" },
        xp: { Icon: Zap, cls: "text-indigo-500 bg-indigo-50" },
        announcement: { Icon: Megaphone, cls: "text-primary bg-primary/10" },
        streak: { Icon: Flame, cls: "text-orange-500 bg-orange-50" },
        goal: { Icon: Target, cls: "text-emerald-600 bg-emerald-50" },
        info: { Icon: Info, cls: "text-blue-500 bg-blue-50" },
    };
    const { Icon, cls } = map[type] ?? map.info;
    return (
        <div className={cn("p-2 rounded-xl shrink-0", cls)}>
            <Icon className="h-4 w-4" />
        </div>
    );
}

function TimeAgo({ date }: { date: string }) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return <>just now</>;
    if (diff < 3600) return <>{Math.floor(diff / 60)}m ago</>;
    if (diff < 86400) return <>{Math.floor(diff / 3600)}h ago</>;
    return <>{Math.floor(diff / 86400)}d ago</>;
}

export default function NotificationBell() {
    const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Mark all read when panel opens
    useEffect(() => {
        if (open) markAllRead();
    }, [open, markAllRead]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200"
                aria-label="Notifications"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-11 z-[200] w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <p className="font-semibold text-sm text-foreground">Notifications</p>
                        <div className="flex items-center gap-1">
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Clear all"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                                    <NotifIcon type={n.type} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                                            <TimeAgo date={n.createdAt} />
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
