"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, LayoutDashboard, BookOpen, BarChart2, Target, Calendar, Trophy, Users, Megaphone, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchItem {
    id: string;
    label: string;
    description?: string;
    href: string;
    icon: React.ElementType;
    category: string;
}

const SEARCH_ITEMS: SearchItem[] = [
    // Dashboard pages
    { id: "dashboard", label: "Dashboard", description: "Your learning overview", href: "/dashboard", icon: LayoutDashboard, category: "Pages" },
    { id: "learn", label: "Learn", description: "Browse subjects and topics", href: "/dashboard/learn", icon: BookOpen, category: "Pages" },
    { id: "analytics", label: "Analytics", description: "Your progress and charts", href: "/dashboard/analytics", icon: BarChart2, category: "Pages" },
    { id: "goals", label: "Goals", description: "Weekly XP and study targets", href: "/dashboard/goals", icon: Target, category: "Pages" },
    { id: "schedule", label: "Schedule", description: "Plan your study sessions", href: "/dashboard/schedule", icon: Calendar, category: "Pages" },
    { id: "leaderboard", label: "Leaderboard", description: "Rank against other students", href: "/dashboard/leaderboard", icon: Trophy, category: "Pages" },
    { id: "report", label: "Progress Report", description: "Detailed progress report", href: "/dashboard/report", icon: FileText, category: "Pages" },
    { id: "onboarding", label: "Onboarding Setup", description: "Redo your initial setup", href: "/onboarding", icon: Settings, category: "Pages" },
    // Teacher pages
    { id: "t-analytics", label: "Class Analytics", description: "Teacher analytics hub", href: "/dashboard/teacher/analytics", icon: BarChart2, category: "Teacher" },
    { id: "t-announce", label: "Announcements", description: "Manage class announcements", href: "/dashboard/teacher/announcements", icon: Megaphone, category: "Teacher" },
    { id: "t-content", label: "Content Generator", description: "AI-generated content & quizzes", href: "/dashboard/teacher/content-gen", icon: BookOpen, category: "Teacher" },
];

function highlight(text: string, query: string) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-primary/20 text-primary rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export default function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIdx, setSelectedIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const close = useCallback(() => { setOpen(false); setQuery(""); }, []);

    // Cmd+K / Ctrl+K to open
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [close]);

    // Focus input when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    const results = query.trim()
        ? SEARCH_ITEMS.filter(
            (item) =>
                item.label.toLowerCase().includes(query.toLowerCase()) ||
                item.description?.toLowerCase().includes(query.toLowerCase()),
        )
        : SEARCH_ITEMS;

    // Group by category
    const grouped = results.reduce<Record<string, SearchItem[]>>((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    const flat = results; // for keyboard navigation

    const navigate = (href: string) => { router.push(href); close(); };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, flat.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
        if (e.key === "Enter") { e.preventDefault(); if (flat[selectedIdx]) navigate(flat[selectedIdx].href); }
    };

    useEffect(() => { setSelectedIdx(0); }, [query]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => e.target === e.currentTarget && close()}
        >
            <div className="w-full max-w-xl mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Search pages, features…"
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 text-sm outline-none"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <kbd className="hidden sm:inline-flex items-center px-1.5 h-5 bg-muted border border-border rounded text-[10px] font-mono text-muted-foreground">Esc</kbd>
                </div>

                {/* Results */}
                <div className="max-h-[360px] overflow-y-auto py-2">
                    {Object.keys(grouped).length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">No results for &ldquo;{query}&rdquo;</p>
                    )}
                    {Object.entries(grouped).map(([cat, items]) => (
                        <div key={cat} className="mb-1">
                            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{cat}</p>
                            {items.map((item) => {
                                const globalIdx = flat.indexOf(item);
                                const isSelected = globalIdx === selectedIdx;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => navigate(item.href)}
                                        onMouseEnter={() => setSelectedIdx(globalIdx)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                            isSelected ? "bg-primary/10" : "hover:bg-muted/50",
                                        )}
                                    >
                                        <div className={cn("p-1.5 rounded-lg shrink-0", isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">{highlight(item.label, query)}</p>
                                            {item.description && (
                                                <p className="text-xs text-muted-foreground truncate">{highlight(item.description, query)}</p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <kbd className="shrink-0 text-[10px] px-1.5 py-0.5 bg-muted border border-border rounded font-mono text-muted-foreground">↵</kbd>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Footer hint */}
                <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[10px] text-muted-foreground/60">
                    <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                    <span><kbd className="font-mono">↵</kbd> open</span>
                    <span><kbd className="font-mono">Esc</kbd> close</span>
                    <span className="ml-auto"><kbd className="font-mono">⌘K</kbd> toggle</span>
                </div>
            </div>
        </div>
    );
}
