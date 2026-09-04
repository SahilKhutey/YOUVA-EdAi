'use client';

import MainLayout from '@/app/components/MainLayout';
import FocusTimer from '@/app/components/workspace/FocusTimer';
import { Sparkles, Brain, Zap, Target } from 'lucide-react';

export default function FocusWorkspace() {
    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12 items-start">
                {/* Left Side: Info & Tips */}
                <div className="flex-1 space-y-8">
                    <div>
                        <h1 className="text-5xl font-black tracking-tight mb-4">Deep Work Zone</h1>
                        <p className="text-xl text-muted-foreground font-medium">Eliminate distractions and enter a state of flow.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10">
                            <Brain className="w-8 h-8 text-primary mb-4" />
                            <h3 className="font-bold text-lg mb-1">Cerebral Optimization</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Ambient soundscapes are scientifically tuned to mask background noise and enhance focus.</p>
                        </div>

                        <div className="p-6 rounded-[32px] bg-secondary/5 border border-secondary/10">
                            <Target className="w-8 h-8 text-secondary mb-4" />
                            <h3 className="font-bold text-lg mb-1">Goal Alignment</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">Every focused session earns you bonus XP and brings you closer to your weekly study goals.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">Pro Tips</h4>
                        <ul className="space-y-3">
                            {[
                                "Clear your physical workspace of all non-essential items.",
                                "Put your phone in another room or use 'Do Not Disturb'.",
                                "Use the 25/5 Pomodoro technique for maximum retention.",
                                "Stay hydrated - keep a bottle of water nearby."
                            ].map((tip, i) => (
                                <li key={i} className="flex gap-3 items-start text-sm font-medium text-slate-600">
                                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Side: Focus Timer */}
                <div className="w-full lg:w-auto shrink-0 flex justify-center">
                    <FocusTimer />
                </div>
            </div>
        </MainLayout>
    );
}
