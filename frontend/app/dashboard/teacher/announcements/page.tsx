"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import {
    Megaphone,
    Pin,
    PinOff,
    Trash2,
    PlusCircle,
    Loader2,
    X,
} from "lucide-react";

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

export default function TeacherAnnouncementsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [isPinned, setIsPinned] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

    const fetch = useCallback(async () => {
        try {
            const res = await api.get("/announcements");
            setItems(res.data);
        } catch { } finally { setLoading(false); }
    }, []);

    useEffect(() => { if (user) fetch(); }, [user, fetch]);

    const handleCreate = async () => {
        if (!title.trim() || !body.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post("/announcements", { title, body, isPinned });
            setItems((prev) => [res.data, ...prev]);
            setTitle(""); setBody(""); setIsPinned(false); setShowForm(false);
        } catch { } finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/announcements/${id}`);
            setItems((prev) => prev.filter((a) => a.id !== id));
        } catch { }
    };

    if (!isTeacher) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4 text-center text-muted-foreground">
                Access restricted to teachers.
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Megaphone className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
                        <p className="text-muted-foreground text-sm">
                            Broadcast messages to all students
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                    {showForm ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                    {showForm ? "Cancel" : "New Announcement"}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <h2 className="font-semibold text-foreground">New Announcement</h2>

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Announcement title"
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Message</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your announcement here..."
                            rows={4}
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                className="w-4 h-4 accent-primary rounded"
                            />
                            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                <Pin className="h-4 w-4 text-primary" />
                                Pin to top
                            </span>
                        </label>
                        <button
                            onClick={handleCreate}
                            disabled={submitting || !title.trim() || !body.trim()}
                            className="ml-auto flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                            Publish
                        </button>
                    </div>
                </div>
            )}

            {/* Announcement list */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : items.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
                    <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-semibold text-foreground">No announcements yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Create your first one!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((a) => (
                        <div
                            key={a.id}
                            className={`bg-card border rounded-2xl p-5 ${a.isPinned ? "border-primary/30 bg-primary/5" : "border-border"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-xl shrink-0 ${a.isPinned ? "bg-primary/10" : "bg-muted"}`}>
                                    {a.isPinned ? (
                                        <Pin className="h-4 w-4 text-primary" />
                                    ) : (
                                        <PinOff className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-foreground">{a.title}</p>
                                        {a.isPinned && (
                                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                                                Pinned
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            <TimeAgo date={a.createdAt} />
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.body}</p>
                                </div>

                                <button
                                    onClick={() => handleDelete(a.id)}
                                    title="Delete announcement"
                                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
