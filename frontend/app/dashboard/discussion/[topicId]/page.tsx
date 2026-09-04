"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import Link from "next/link";
import {
    ArrowLeft,
    MessageSquare,
    CheckCircle2,
    Pin,
    ThumbsUp,
    Loader2,
    PlusCircle,
    X,
} from "lucide-react";

// ──────── types ────────
interface Post {
    id: string;
    title: string;
    body: string;
    isPinned: boolean;
    upvotes: number;
    status: string;
    createdAt: string;
    author: { id: string; name: string | null; role: string };
    _count: { replies: number };
}

function TimeAgo({ date }: { date: string }) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return <span>{diff}s ago</span>;
    if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>;
    if (diff < 86400) return <span>{Math.floor(diff / 3600)}h ago</span>;
    return <span>{Math.floor(diff / 86400)}d ago</span>;
}

// ──────── compose drawer ────────
function ComposeDrawer({
    topicId,
    onClose,
    onCreated,
}: {
    topicId: string;
    onClose: () => void;
    onCreated: (post: Post) => void;
}) {
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !body.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post("/forum/post", { topicId, title, body });
            onCreated(res.data);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Ask a Question</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's your question?"
                            maxLength={120}
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                            Details
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Describe your question in detail…"
                            rows={5}
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !title.trim() || !body.trim()}
                        className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? "Posting…" : "Post Question"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────── page ────────
export default function TopicDiscussionPage() {
    const { user } = useAuth();
    const { topicId } = useParams<{ topicId: string }>();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [topicTitle, setTopicTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [showCompose, setShowCompose] = useState(false);

    const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

    const fetchPosts = useCallback(async () => {
        try {
            const res = await api.get(`/forum/topic/${topicId}`);
            const data: Post[] = res.data;
            setPosts(data);
            // Get topic title from first post's context or refetch — use subject route
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [topicId]);

    useEffect(() => { if (user && topicId) fetchPosts(); }, [user, topicId, fetchPosts]);

    const handlePin = async (postId: string) => {
        try {
            await api.patch(`/forum/post/${postId}/pin`);
            setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p))
                    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
            );
        } catch (e) { console.error(e); }
    };

    const handleUpvote = async (postId: string) => {
        try {
            await api.patch(`/forum/post/${postId}/upvote`);
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p
                )
            );
        } catch (e) { console.error(e); }
    };

    const handlePostCreated = (post: Post) => {
        setPosts((prev) => [post, ...prev]);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            {showCompose && (
                <ComposeDrawer
                    topicId={topicId}
                    onClose={() => setShowCompose(false)}
                    onCreated={handlePostCreated}
                />
            )}

            <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Nav */}
                <div className="flex items-center gap-3 justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        All Topics
                    </button>
                    <button
                        onClick={() => setShowCompose(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Ask Question
                    </button>
                </div>

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Topic Discussions</h1>
                        <p className="text-muted-foreground text-sm">{posts.length} questions</p>
                    </div>
                </div>

                {/* Posts list */}
                {posts.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No questions yet.</p>
                        <p className="text-sm">Be the first to ask one!</p>
                    </div>
                )}

                <div className="space-y-3">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className={`bg-card border border-border rounded-2xl p-5 transition-all hover:border-primary/30 ${post.isPinned ? "ring-1 ring-primary/20 bg-primary/[0.01]" : ""
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Vote */}
                                <button
                                    onClick={() => handleUpvote(post.id)}
                                    className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0 pt-0.5"
                                >
                                    <ThumbsUp className="h-4 w-4" />
                                    <span className="text-xs font-semibold">{post.upvotes}</span>
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {post.isPinned && (
                                            <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                                <Pin className="h-2.5 w-2.5" /> Pinned
                                            </span>
                                        )}
                                        {post.status === "RESOLVED" && (
                                            <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                                <CheckCircle2 className="h-2.5 w-2.5" /> Resolved
                                            </span>
                                        )}
                                    </div>

                                    <Link
                                        href={`/dashboard/discussion/post/${post.id}`}
                                        className="font-semibold text-foreground hover:text-primary transition-colors"
                                    >
                                        {post.title}
                                    </Link>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {post.body}
                                    </p>

                                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                                        <span className="text-xs text-muted-foreground">
                                            by <span className="font-medium">{post.author.name ?? "Anonymous"}</span>
                                            {post.author.role !== "STUDENT" && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full uppercase">
                                                    {post.author.role}
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            <TimeAgo date={post.createdAt} />
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MessageSquare className="h-3 w-3" />
                                            {post._count.replies} repl{post._count.replies === 1 ? "y" : "ies"}
                                        </span>
                                        {isTeacher && (
                                            <button
                                                onClick={() => handlePin(post.id)}
                                                className={`ml-auto text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors ${post.isPinned
                                                        ? "bg-primary/10 text-primary"
                                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                    }`}
                                            >
                                                <Pin className="h-3 w-3" />
                                                {post.isPinned ? "Unpin" : "Pin"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
