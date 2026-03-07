"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import {
    Bot,
    X,
    Send,
    Minimize2,
    Loader2,
    Maximize2,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

const WELCOME: Message = {
    id: "welcome",
    role: "assistant",
    content:
        "👋 Hi! I'm **Youva**, your AI study buddy. Ask me anything about your studies — I'm here to help!",
};

function MessageBubble({ msg }: { msg: Message }) {
    const isUser = msg.role === "user";
    return (
        <div
            className={cn(
                "flex gap-2.5 items-end",
                isUser ? "justify-end" : "justify-start",
            )}
        >
            {!isUser && (
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mb-0.5">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
            )}
            <div
                className={cn(
                    "max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                )}
                dangerouslySetInnerHTML={{
                    __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                }}
            />
        </div>
    );
}

export default function StudyBuddyWidget() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([WELCOME]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100);
    }, [open]);

    // Only show for students
    if (!user || user.role === "TEACHER" || user.role === "ADMIN") return null;

    const send = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const history = messages
                .filter((m) => m.id !== "welcome")
                .slice(-10) // last 10 messages for context
                .map((m) => ({ role: m.role, content: m.content }));

            const res = await api.post("/ai-mentor/study-buddy", {
                message: text,
                history,
            });

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: res.data.message,
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const clearChat = () => setMessages([WELCOME]);

    return (
        <div className="fixed bottom-4 right-4 z-[9990] flex flex-col items-end gap-3">
            {/* Chat panel */}
            {open && (
                <div
                    className={cn(
                        "bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
                        "animate-in slide-in-from-bottom-4 fade-in",
                        expanded
                            ? "w-[420px] h-[600px]"
                            : "w-[340px] h-[480px]",
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-indigo-500/10 shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <Bot className="h-4.5 w-4.5 text-primary-foreground h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm text-foreground">Youva Study Buddy</p>
                            <p className="text-[10px] text-primary font-medium">● Online</p>
                        </div>
                        <button
                            onClick={clearChat}
                            title="Clear chat"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            title={expanded ? "Shrink" : "Expand"}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                        </button>
                        <button
                            onClick={() => setOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} msg={msg} />
                        ))}
                        {loading && (
                            <div className="flex gap-2.5 items-end">
                                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 px-3 py-3 border-t border-border shrink-0">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            disabled={loading}
                            placeholder="Ask me anything…"
                            className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 text-foreground outline-none focus:ring-2 ring-primary/30 transition-all disabled:opacity-50"
                        />
                        <button
                            onClick={send}
                            disabled={!input.trim() || loading}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all shrink-0"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Floating bubble toggle */}
            <button
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200",
                    "hover:scale-110 active:scale-95",
                    open
                        ? "bg-muted text-muted-foreground border border-border"
                        : "bg-primary text-primary-foreground",
                )}
                aria-label={open ? "Close Study Buddy" : "Open Study Buddy"}
            >
                {open ? (
                    <X className="h-6 w-6" />
                ) : (
                    <Bot className="h-7 w-7" />
                )}
            </button>
        </div>
    );
}
