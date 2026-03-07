"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import ReactMarkdown from "react-markdown";
import {
    ArrowLeft,
    ThumbsUp,
    CheckCircle2,
    MessageSquare,
    Pin,
    Send,
    Loader2,
} from "lucide-react";

// ──────── types ────────
interface Author { id: string; name: string | null; role: string }

interface Reply {
    id: string;
    body: string;
    isAccepted: boolean;
    upvotes: number;
    createdAt: string;
    author: Author;
}

interface Post {
    id: string;
    title: string;
    body: string;
    isPinned: boolean;
    upvotes: number;
    status: string;
    createdAt: string;
    author: Author;
    topic: { id: string; title: string; subject: { name: string } };
    replies: Reply[];
}

function TimeAgo({ date }: { date: string }) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return <span>{diff}s ago</span>;
    if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>;
    if (diff < 86400) return <span>{Math.floor(diff / 3600)}h ago</span>;
    return <span>{Math.floor(diff / 86400)}d ago</span>;
}

function AuthorPill({ author }: { author: Author }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                {(author.name ?? "?")[0].toUpperCase()}
            </span>
            <span className="text-sm font-medium text-foreground">
                {author.name ?? "Anonymous"}
            </span>
            {author.role !== "STUDENT" && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full uppercase">
                    {author.role}
                </span>
            )}
        </span>
    );
}

// ──────── page ────────
export default function PostDetailPage() {
    const { user } = useAuth();
    const { postId } = useParams<{ postId: string }>();
    const router = useRouter();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyBody, setReplyBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

    const fetchPost = useCallback(async () => {
        try {
            const res = await api.get(`/forum/post/${postId}`);
            setPost(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [postId]);

    useEffect(() => { if (user && postId) fetchPost(); }, [user, postId, fetchPost]);

    const handleReply = async () => {
        if (!replyBody.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/forum/post/${postId}/reply`, { body: replyBody });
            setPost((prev) => prev ? { ...prev, replies: [...prev.replies, res.data] } : prev);
            setReplyBody("");
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccept = async (replyId: string) => {
        try {
            await api.patch(`/forum/reply/${replyId}/accept`);
            setPost((prev) =>
                prev
                    ? {
                        ...prev,
                        status: "RESOLVED",
                        replies: prev.replies.map((r) => ({
                            ...r,
                            isAccepted: r.id === replyId,
                        })),
                    }
                    : prev,
            );
        } catch (e) { console.error(e); }
    };

    const handleUpvotePost = async () => {
        try {
            await api.patch(`/forum/post/${postId}/upvote`);
            setPost((prev) => prev ? { ...prev, upvotes: prev.upvotes + 1 } : prev);
        } catch (e) { console.error(e); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    if (!post) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4 text-center text-muted-foreground">
                Post not found.
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Back nav */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to{" "}
                <span className="font-medium">{post.topic.title}</span>
            </button>

            {/* Post card */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                {/* Status badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    {post.isPinned && (
                        <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                            <Pin className="h-3 w-3" /> Pinned
                        </span>
                    )}
                    <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${post.status === "RESOLVED"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                    >
                        {post.status === "RESOLVED" ? "✓ Resolved" : "Open"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                        {post.topic.subject.name} › {post.topic.title}
                    </span>
                </div>

                <h1 className="text-xl font-bold text-foreground">{post.title}</h1>

                {/* Post body */}
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-foreground/80">
                    <ReactMarkdown>{post.body}</ReactMarkdown>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 pt-2 border-t border-border flex-wrap">
                    <AuthorPill author={post.author} />
                    <span className="text-xs text-muted-foreground">
                        <TimeAgo date={post.createdAt} />
                    </span>
                    <button
                        onClick={handleUpvotePost}
                        className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-sm font-medium text-muted-foreground"
                    >
                        <ThumbsUp className="h-4 w-4" />
                        {post.upvotes}
                    </button>
                </div>
            </div>

            {/* ── Replies ── */}
            <div className="space-y-3">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    {post.replies.length} {post.replies.length === 1 ? "Reply" : "Replies"}
                </h2>

                {post.replies.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        No replies yet — be the first to answer!
                    </p>
                )}

                {post.replies.map((reply) => (
                    <div
                        key={reply.id}
                        className={`bg-card border rounded-2xl p-5 transition-all ${reply.isAccepted
                                ? "border-emerald-400 ring-1 ring-emerald-400/30 bg-emerald-50/30"
                                : "border-border"
                            }`}
                    >
                        {reply.isAccepted && (
                            <div className="flex items-center gap-1.5 mb-3 text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wide">Accepted Answer</span>
                            </div>
                        )}

                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-foreground/80">
                            <ReactMarkdown>{reply.body}</ReactMarkdown>
                        </div>

                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border flex-wrap">
                            <AuthorPill author={reply.author} />
                            <span className="text-xs text-muted-foreground">
                                <TimeAgo date={reply.createdAt} />
                            </span>

                            {isTeacher && !reply.isAccepted && (
                                <button
                                    onClick={() => handleAccept(reply.id)}
                                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Mark as Answer
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* ── Reply composer ── */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Your Answer</h3>
                <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Share your answer or insight… (Markdown supported)"
                    rows={5}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition"
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleReply}
                        disabled={submitting || !replyBody.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {submitting ? "Sending…" : "Post Reply"}
                    </button>
                </div>
            </div>
        </div>
    );
}
