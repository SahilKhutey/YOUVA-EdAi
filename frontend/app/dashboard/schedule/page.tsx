"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import {
    Calendar,
    PlusCircle,
    CheckCircle2,
    Trash2,
    Clock,
    BookOpen,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    ArrowRight
} from "lucide-react";
import ActivityHeatmap from "@/app/components/ActivityHeatmap";
import { cn } from "@/lib/utils";

// ──────── types ────────
interface StudySession {
    id: string;
    title: string;
    scheduledAt: string;
    durationMinutes: number;
    notes: string | null;
    isCompleted: boolean;
    topicId: string | null;
    topic: { title: string; subject: { name: string } } | null;
}

interface Subject {
    id: string;
    name: string;
    topics: { id: string; title: string }[];
}

interface RevisionSuggestion {
    topicId: string;
    topicTitle: string;
    subjectName: string;
    scheduledDate: string;
    masteryLevel: number;
}

interface HeatmapData {
    date: string;
    count: number;
}

// ──────── helpers ────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

// ──────── Add-session modal ────────
function AddSessionModal({
    subjects,
    selectedDate,
    initialData,
    onClose,
    onAdded,
}: {
    subjects: Subject[];
    selectedDate: Date;
    initialData?: { title: string; topicId: string };
    onClose: () => void;
    onAdded: (s: StudySession) => void;
}) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [topicId, setTopicId] = useState(initialData?.topicId || "");
    const [time, setTime] = useState("09:00");
    const [duration, setDuration] = useState(30);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const allTopics = subjects.flatMap((s) =>
        s.topics.map((t) => ({ ...t, subjectName: s.name }))
    );

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setSubmitting(true);
        const [h, m] = time.split(":").map(Number);
        const scheduledAt = new Date(selectedDate);
        scheduledAt.setHours(h, m, 0, 0);
        try {
            const res = await api.post("/schedule", {
                title,
                topicId: topicId || undefined,
                scheduledAt: scheduledAt.toISOString(),
                durationMinutes: duration,
                notes: notes || undefined,
            });
            onAdded(res.data);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/50">
                    <h2 className="font-semibold text-foreground">Schedule Study Session</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                            Session Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Quadratic Equations Practice"
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                                Time
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                                Duration (min)
                            </label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                min={5}
                                max={240}
                                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    {allTopics.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                                Linked Topic (optional)
                            </label>
                            <select
                                value={topicId}
                                onChange={(e) => setTopicId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">— None —</option>
                                {subjects.map((s) => (
                                    <optgroup key={s.id} label={s.name}>
                                        {s.topics.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.title}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="What will you focus on?"
                            rows={2}
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !title.trim()}
                        className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? "Saving…" : "Schedule Session"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────── main page ────────
export default function SchedulePage() {
    const { user } = useAuth();
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState(today);
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [suggestions, setSuggestions] = useState<RevisionSuggestion[]>([]);
    const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState<{ title: string; topicId: string } | undefined>();

    const fetchData = useCallback(async () => {
        try {
            const [sessionsRes, subjectsRes, suggestionsRes, heatmapRes] = await Promise.all([
                api.get("/schedule"),
                api.get("/subjects"),
                api.get("/revision/schedule"),
                api.get("/analytics/heatmap"),
            ]);
            setSessions(sessionsRes.data);
            setSubjects(subjectsRes.data);
            setSuggestions(suggestionsRes.data || []);
            setHeatmapData(heatmapRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    const sessionsOnDate = (date: Date) =>
        sessions.filter((s) => isSameDay(new Date(s.scheduledAt), date));

    const suggestionsOnDate = (date: Date) =>
        suggestions.filter((s) => isSameDay(new Date(s.scheduledDate), date));

    const selectedDaySessions = sessionsOnDate(selectedDate);
    const selectedDaySuggestions = suggestionsOnDate(selectedDate);

    const handlePrevMonth = () => {
        if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
        else setViewMonth((m) => m - 1);
    };
    const handleNextMonth = () => {
        if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
        else setViewMonth((m) => m + 1);
    };

    const handleComplete = async (id: string) => {
        try {
            await api.patch(`/schedule/${id}/complete`);
            setSessions((prev) => prev.map((s) => s.id === id ? { ...s, isCompleted: true } : s));
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/schedule/${id}`);
            setSessions((prev) => prev.filter((s) => s.id !== id));
        } catch (e) { console.error(e); }
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
            {showModal && (
                <AddSessionModal
                    subjects={subjects}
                    selectedDate={selectedDate}
                    initialData={modalData}
                    onClose={() => { setShowModal(false); setModalData(undefined); }}
                    onAdded={(s) => setSessions((prev) => [...prev, s])}
                />
            )}

            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Calendar className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Study Schedule</h1>
                            <p className="text-muted-foreground text-sm">
                                {sessions.filter((s) => !s.isCompleted).length} upcoming sessions
                            </p>
                        </div>
                    </div>
                </div>

                {/* Heatmap Section */}
                <ActivityHeatmap data={heatmapData} />

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                    {/* ── Calendar ── */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                        {/* Month navigation */}
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={handlePrevMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h2 className="font-bold text-foreground text-lg">
                                {MONTHS[viewMonth]} {viewYear}
                            </h2>
                            <button onClick={handleNextMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Day labels */}
                        <div className="grid grid-cols-7 mb-4">
                            {DAYS.map((d) => (
                                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-1">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Day grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const dayDate = new Date(viewYear, viewMonth, i + 1);
                                const daySessions = sessionsOnDate(dayDate);
                                const daySuggestions = suggestionsOnDate(dayDate);
                                const isToday = isSameDay(dayDate, today);
                                const isSelected = isSameDay(dayDate, selectedDate);

                                const intensity = daySessions.length;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(dayDate)}
                                        className={cn(
                                            "relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all border-2",
                                            isSelected
                                                ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105 z-10"
                                                : "border-transparent text-foreground hover:bg-muted",
                                            !isSelected && isToday && "text-primary ring-2 ring-primary/20",
                                            !isSelected && intensity > 0 && (
                                                intensity >= 4 ? "bg-primary/40" :
                                                    intensity >= 2 ? "bg-primary/20" :
                                                        "bg-primary/10"
                                            )
                                        )}
                                    >
                                        {i + 1}
                                        <div className="absolute bottom-1.5 flex gap-0.5">
                                            {daySessions.some(s => !s.isCompleted) && (
                                                <div className={cn("h-1 w-1 rounded-full", isSelected ? "bg-white" : "bg-primary")} />
                                            )}
                                            {daySuggestions.length > 0 && (
                                                <div className={cn("h-1 w-1 rounded-full", isSelected ? "bg-amber-100" : "bg-amber-500")} />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Day detail ── */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                                <div>
                                    <p className="font-bold text-foreground capitalize">
                                        {selectedDate.toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                        Your Schedule
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Schedule
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-border min-h-[200px] max-h-[400px] custom-scrollbar">
                                {selectedDaySessions.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
                                        <Calendar className="h-8 w-8 opacity-20" />
                                        <p className="text-xs font-medium italic">No sessions scheduled</p>
                                    </div>
                                )}

                                {selectedDaySessions.map((s) => (
                                    <div
                                        key={s.id}
                                        className={cn(
                                            "px-5 py-4 transition-colors hover:bg-muted/30 group",
                                            s.isCompleted && "bg-muted/20 opacity-60"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={cn(
                                                        "font-bold text-sm",
                                                        s.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                                                    )}
                                                >
                                                    {s.title}
                                                </p>
                                                <div className="flex flex-col gap-1 mt-1.5">
                                                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                                        {new Date(s.scheduledAt).toLocaleTimeString("en-US", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                        <span className="opacity-40">·</span>
                                                        {s.durationMinutes}m
                                                    </span>
                                                    {s.topic && (
                                                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                                                            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                                            {s.topic.title}
                                                            <span className="opacity-40 ml-1">({s.topic.subject.name})</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!s.isCompleted && (
                                                    <button
                                                        onClick={() => handleComplete(s.id)}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Suggested Revisions */}
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200 rounded-2xl overflow-hidden p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <h3 className="font-bold text-sm text-foreground">AI Review Suggestions</h3>
                            </div>

                            {selectedDaySuggestions.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                    No revisions predicted for this date.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDaySuggestions.map((rev: RevisionSuggestion) => (
                                        <div key={rev.topicId} className="bg-white/50 dark:bg-black/20 border border-amber-100 rounded-xl p-3">
                                            <p className="text-xs font-bold text-foreground">{rev.topicTitle}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{rev.subjectName}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="text-[10px] font-bold text-amber-600 uppercase">
                                                    Mastery: {rev.masteryLevel}%
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setModalData({
                                                            title: `Revision: ${rev.topicTitle}`,
                                                            topicId: rev.topicId
                                                        });
                                                        setShowModal(true);
                                                    }}
                                                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                                                >
                                                    Schedule Now
                                                    <ArrowRight className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
