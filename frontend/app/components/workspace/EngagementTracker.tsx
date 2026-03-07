'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Sparkles, Coffee } from 'lucide-react';
// We assume there's a toast hook available, or we build a small custom modal.
// Using a simple state-based overlay for this MVP

interface EngagementTrackerProps {
    topicId: string;
}

export function EngagementTracker({ topicId }: EngagementTrackerProps) {
    const { data: session } = useSession();

    // Telemetry state Ref (using ref to avoid re-renders on every keystroke)
    const telemetry = useRef({
        metrics: {
            keystrokes: 0,
            backspaces: 0,
            lastActionTime: Date.now(),
            totalHesitationMs: 0,
            startTime: Date.now()
        }
    });

    const [intervention, setIntervention] = useState<{
        type: 'BREAK_SUGGESTED' | 'DIFFICULTY_DROPPED' | 'GAMIFIED_CHALLENGE' | null;
    }>({ type: null });

    // 1. Monitor Keystrokes & Errors
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();
            const state = telemetry.current.metrics;

            // Calculate Hesitation Gap
            const gap = now - state.lastActionTime;
            if (gap > 5000) { // If inactive for more than 5s, count as hesitation
                state.totalHesitationMs += gap;
            }

            state.lastActionTime = now;

            if (e.key === 'Backspace' || e.key === 'Delete') {
                state.backspaces++;
            } else if (e.key.length === 1) { // Normal character
                state.keystrokes++;
            }
        };

        // Listen globally for practice session activity
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 2. Poll Backend every 60s
    useEffect(() => {
        if (!session || !((session as any).accessToken)) return;

        const interval = setInterval(async () => {
            const state = telemetry.current.metrics;
            const now = Date.now();
            const durationMs = now - state.startTime;
            const minsPassed = durationMs / 60000;

            const payload = {
                cpm: state.keystrokes / Math.max(minsPassed, 1),
                errorSpike: state.backspaces, // Raw backspaces in this window
                hesitationGapMs: state.totalHesitationMs,
                sessionDurationMs: durationMs
            };

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/engagement/telemetry`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${(session as any).accessToken}`
                    },
                    body: JSON.stringify({ topicId, telemetry: payload })
                });

                const data = await res.json();

                if (data.interventionTriggered) {
                    setIntervention({ type: data.interventionTriggered });

                    // Auto-dismiss interventions after 7s (except breaks which might be modal)
                    if (data.interventionTriggered !== 'BREAK_SUGGESTED') {
                        setTimeout(() => setIntervention({ type: null }), 7000);
                    }
                }

                // Reset window metrics (keep absolute duration)
                telemetry.current.metrics.keystrokes = 0;
                telemetry.current.metrics.backspaces = 0;
                telemetry.current.metrics.totalHesitationMs = 0;

            } catch (e) {
                console.error('Failed to sync engagement telemetry', e);
            }
        }, 60000); // Poll every minute

        return () => clearInterval(interval);
    }, [session, topicId]);

    if (!intervention.type) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 animate-in slide-in-from-bottom-5 fade-in">
            {intervention.type === 'BREAK_SUGGESTED' && (
                <div className="bg-amber-100 border border-amber-300 text-amber-900 shadow-lg rounded-2xl p-4 w-72 flex gap-4">
                    <div className="bg-amber-200 shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm mb-1">Take a breather</h4>
                        <p className="text-xs opacity-90 leading-relaxed mb-3">
                            You've been working hard. A 5-minute break will restore your focus!
                        </p>
                        <button
                            onClick={() => setIntervention({ type: null })}
                            className="text-xs font-semibold bg-white/50 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {intervention.type === 'DIFFICULTY_DROPPED' && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 shadow-md rounded-2xl p-3 px-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-xs font-medium">Adjusting concepts to match your current pace...</p>
                </div>
            )}

            {intervention.type === 'GAMIFIED_CHALLENGE' && (
                <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg rounded-2xl p-4 w-72 flex gap-4">
                    <div className="bg-white/20 shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm mb-1">Bonus Challenge!</h4>
                        <p className="text-xs opacity-90 leading-relaxed">
                            Answer the next 2 questions correctly in a row for a 2x XP Multiplier!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
