"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { Megaphone, Pin, X, ChevronDown, ChevronUp } from "lucide-react";

interface Announcement {
    id: string;
    title: string;
    body: string;
    isPinned: boolean;
    createdAt: string;
    author: { name: string | null };
}

function TimeAgo({ date }: { date: string }) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 3600) return <>{Math.floor(diff / 60)}m ago</>;
    if (diff < 86400) return <>{Math.floor(diff / 3600)}h ago</>;
    return <>{Math.floor(diff / 86400)}d ago</>;
}

export default function AnnouncementBanner() {
    const { user } = useAuth();
    const [items, setItems] = useState<Announcement[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const fetch = useCallback(async () => {
        try {
            const res = await api.get("/announcements");
            setItems(res.data);
        } catch { }
    }, []);

    useEffect(() => { if (user) fetch(); }, [user, fetch]);

    const visible = items.filter((a) => !dismissed.has(a.id));
    if (visible.length === 0) return null;

    const toggleExpand = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    return (
        <div className="space-y-2">
            {visible.map((a) => {
                const isExpanded = expanded.has(a.id);
                return (
                    <div
                        key={a.id}
                        className={`relative rounded-2xl border px-5 py-4 ${a.isPinned
                                ? "bg-primary/5 border-primary/30"
                                : "bg-card border-border"
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${a.isPinned ? "bg-primary/10" : "bg-muted"}`}>
                                {a.isPinned ? (
                                    <Pin className="h-4 w-4 text-primary" />
                                ) : (
                                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-sm text-foreground">{a.title}</p>
                                    {a.isPinned && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                                            Pinned
                                        </span>
                                    )}
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {a.author.name} · <TimeAgo date={a.createdAt} />
                                    </span>
                                </div>

                                <p
                                    className={`text-sm text-muted-foreground mt-1 whitespace-pre-wrap ${!isExpanded ? "line-clamp-2" : ""
                                        }`}
                                >
                                    {a.body}
                                </p>

                                {a.body.length > 120 && (
                                    <button
                                        onClick={() => toggleExpand(a.id)}
                                        className="flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                                    >
                                        {isExpanded ? (
                                            <><ChevronUp className="h-3 w-3" /> Show less</>
                                        ) : (
                                            <><ChevronDown className="h-3 w-3" /> Read more</>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Dismiss button */}
                            <button
                                onClick={() => setDismissed((prev) => new Set([...prev, a.id]))}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
