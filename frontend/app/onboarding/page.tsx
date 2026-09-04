"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
    Sparkles,
    BookOpen,
    Target,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Zap,
    Clock,
} from "lucide-react";

interface Subject {
    id: string;
    name: string;
    description: string | null;
}

// ──────── Step indicator ────────
function StepBar({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i < current ? "bg-primary flex-1" : i === current ? "bg-primary flex-[2]" : "bg-muted flex-1"
                        }`}
                />
            ))}
        </div>
    );
}

// ──────── icon map for subjects ────────
const SUBJECT_EMOJI: Record<string, string> = {
    math: "🔢", mathematics: "🔢", physics: "⚛️", chemistry: "🧪",
    biology: "🧬", english: "📝", history: "📜", geography: "🌍",
    computer: "💻", science: "🔬", economics: "📊", default: "📚",
};
function subjectEmoji(name: string) {
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(SUBJECT_EMOJI)) {
        if (lower.includes(k)) return v;
    }
    return SUBJECT_EMOJI.default;
}

// ──────── main page ────────
export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [xp, setXp] = useState(500);
    const [mins, setMins] = useState(120);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        if (user?.onboardingComplete) router.replace("/dashboard");
    }, [user, router]);

    const fetchSubjects = useCallback(async () => {
        try {
            const res = await api.get("/subjects");
            setSubjects(res.data);
        } catch { }
    }, []);

    useEffect(() => { if (step === 1) fetchSubjects(); }, [step, fetchSubjects]);

    const toggleSubject = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const handleFinish = async () => {
        setCompleting(true);
        try {
            await api.patch("/auth/complete-onboarding", {
                weeklyXpTarget: xp,
                weeklyStudyMinutes: mins,
            });
            router.replace("/dashboard");
        } catch {
            setCompleting(false);
        }
    };

    const STEPS = 3;

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-indigo-500/5 flex items-center justify-center p-4">
            <div className="w-full max-w-xl">
                {/* Card */}
                <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
                    {/* Progress bar */}
                    <div className="px-8 pt-6">
                        <StepBar current={step} total={STEPS} />
                        <p className="text-xs text-muted-foreground mt-2">
                            Step {step + 1} of {STEPS}
                        </p>
                    </div>

                    <div className="px-8 py-8 min-h-[380px] flex flex-col">

                        {/* ── Step 0: Welcome ── */}
                        {step === 0 && (
                            <div className="flex flex-col items-center text-center flex-1 justify-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <Sparkles className="h-10 w-10 text-primary" />
                                </div>
                                <h1 className="text-3xl font-black text-foreground">
                                    Welcome to Youva EdAi
                                    {user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
                                </h1>
                                <p className="text-muted-foreground max-w-sm">
                                    Let's take 60 seconds to personalise your learning experience.
                                    We'll set up your subjects and your first weekly goal.
                                </p>
                                <div className="flex flex-col gap-2 w-full mt-4">
                                    {[
                                        { icon: BookOpen, text: "Pick the subjects you study" },
                                        { icon: Target, text: "Set a weekly learning goal" },
                                        { icon: Zap, text: "Start earning XP right away" },
                                    ].map(({ icon: Icon, text }) => (
                                        <div key={text} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                                            <Icon className="h-4 w-4 text-primary shrink-0" />
                                            <span className="text-sm text-foreground">{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Step 1: Subject selection ── */}
                        {step === 1 && (
                            <div className="flex flex-col flex-1 gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Choose your subjects</h2>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Select all subjects you're currently studying.
                                    </p>
                                </div>
                                {subjects.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 overflow-y-auto flex-1 pr-1">
                                        {subjects.map((s) => {
                                            const on = selected.has(s.id);
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => toggleSubject(s.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${on
                                                            ? "border-primary bg-primary/10 text-foreground"
                                                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                                                        }`}
                                                >
                                                    <span className="text-xl">{subjectEmoji(s.name)}</span>
                                                    <span className="text-sm font-medium truncate">{s.name}</span>
                                                    {on && <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {selected.size > 0 && (
                                    <p className="text-xs text-primary font-semibold">
                                        {selected.size} subject{selected.size !== 1 ? "s" : ""} selected
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Step 2: Goal setting ── */}
                        {step === 2 && (
                            <div className="flex flex-col flex-1 gap-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Set your weekly goal</h2>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        You can always change this later in the Goals page.
                                    </p>
                                </div>

                                <div className="flex-1 space-y-6">
                                    {/* XP target */}
                                    <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-indigo-500" />
                                            <span className="text-sm font-semibold text-foreground">Weekly XP Target</span>
                                            <span className="ml-auto text-lg font-black text-primary">{xp} XP</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={100}
                                            max={3000}
                                            step={50}
                                            value={xp}
                                            onChange={(e) => setXp(Number(e.target.value))}
                                            className="w-full accent-primary"
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>Casual (100)</span><span>Intensive (3000)</span>
                                        </div>
                                    </div>

                                    {/* Study time target */}
                                    <div className="bg-muted/40 rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm font-semibold text-foreground">Weekly Study Time</span>
                                            <span className="ml-auto text-lg font-black text-amber-600">
                                                {mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}` : `${mins}m`}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={30}
                                            max={600}
                                            step={15}
                                            value={mins}
                                            onChange={(e) => setMins(Number(e.target.value))}
                                            className="w-full accent-amber-500"
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>30 min</span><span>10 hours</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="px-8 pb-8 flex items-center justify-between gap-3">
                        {step > 0 ? (
                            <button
                                onClick={() => setStep((s) => s - 1)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" /> Back
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < STEPS - 1 ? (
                            <button
                                onClick={() => setStep((s) => s + 1)}
                                disabled={step === 1 && selected.size === 0}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors ml-auto"
                            >
                                Continue <ChevronRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                disabled={completing}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors ml-auto"
                            >
                                {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                {completing ? "Setting up…" : "Let's go!"}
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                    You can skip this and configure everything in Settings later.{" "}
                    <button
                        onClick={handleFinish}
                        className="text-primary hover:underline font-semibold"
                        disabled={completing}
                    >
                        Skip for now
                    </button>
                </p>
            </div>
        </div>
    );
}
