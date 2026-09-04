"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import Link from "next/link";
import {
    MessageSquare,
    BookOpen,
    ChevronRight,
    Loader2,
    Search,
} from "lucide-react";

// ──────── types ────────
interface TopicWithCount {
    id: string;
    title: string;
    description: string | null;
    _count: { discussionPosts: number };
}

interface SubjectWithTopics {
    id: string;
    name: string;
    topics: TopicWithCount[];
}

// ──────── helpers ────────
function getTopicActivity(count: number) {
    if (count === 0) return { label: "No posts yet", color: "text-muted-foreground" };
    if (count < 3) return { label: `${count} post${count > 1 ? "s" : ""}`, color: "text-blue-600" };
    if (count < 10) return { label: `${count} posts`, color: "text-emerald-600" };
    return { label: `${count} posts`, color: "text-primary" };
}

// ──────── page ────────
export default function DiscussionHomePage() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchHome = useCallback(async () => {
        try {
            const res = await api.get("/forum/home");
            setSubjects(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (user) fetchHome(); }, [user, fetchHome]);

    const filtered = subjects
        .map((s) => ({
            ...s,
            topics: s.topics.filter((t) =>
                t.title.toLowerCase().includes(search.toLowerCase())
            ),
        }))
        .filter((s) => s.topics.length > 0 || s.name.toLowerCase().includes(search.toLowerCase()));

    const totalPosts = subjects.reduce(
        (sum, s) => sum + s.topics.reduce((ts, t) => ts + t._count.discussionPosts, 0),
        0,
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Discussion Forum</h1>
                        <p className="text-muted-foreground text-sm">
                            {totalPosts} posts across {subjects.length} subjects
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search topics…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                </div>
            </div>

            {/* Subject → Topics grid */}
            {filtered.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No topics match your search.</p>
                </div>
            )}

            {filtered.map((subject) => (
                <div key={subject.id} className="space-y-3">
                    {/* Subject header */}
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h2 className="font-bold text-foreground text-lg">{subject.name}</h2>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Topics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {subject.topics.map((topic) => {
                            const { label, color } = getTopicActivity(topic._count.discussionPosts);
                            return (
                                <Link
                                    key={topic.id}
                                    href={`/dashboard/discussion/${topic.id}`}
                                    className="group bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-sm transition-all flex items-center justify-between"
                                >
                                    <div className="space-y-1 min-w-0">
                                        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                                            {topic.title}
                                        </p>
                                        {topic.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {topic.description}
                                            </p>
                                        )}
                                        <span className={`text-xs font-medium ${color}`}>{label}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2 transition-colors" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
