'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight, Sparkles, BookOpen, CheckCircle2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import { format, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Session {
    id: string;
    title: string;
    scheduledAt: string;
    durationMinutes: number;
    isCompleted: boolean;
    topic?: {
        id: string;
        title: string;
        subject: { name: string };
    };
}

export default function SmartSchedule() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/schedule/suggested');
            setSessions(res.data);
        } catch (e) {
            console.error('Failed to fetch suggested sessions:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const generatePlan = async () => {
        setLoading(true);
        try {
            await api.post('/schedule/generate-plan');
            await fetchSessions();
        } catch (e) {
            console.error('Failed to generate plan:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading && sessions.length === 0) return (
        <div className="clay-card p-8 flex flex-col items-center justify-center min-h-[400px]">
            <Sparkles className="w-12 h-12 text-primary animate-pulse mb-4" />
            <p className="text-muted-foreground font-bold">Consulting your AI Tutor...</p>
        </div>
    );

    return (
        <div className="clay-card overflow-hidden flex flex-col h-full ring-transparent border-none">
            <div className="p-6 border-b border-border/10 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-slate-800 tracking-tight">Today's Smart Path</h3>
                </div>
                <Button
                    onClick={generatePlan}
                    variant="outline"
                    size="sm"
                    className="text-[10px] font-black uppercase h-8 rounded-xl border-primary/20 text-primary hover:bg-primary/5"
                >
                    Refine Plan
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {sessions.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-slate-300" />
                        </div>
                        <div>
                            <p className="font-black text-slate-600">No sessions scheduled.</p>
                            <p className="text-xs text-slate-400 mt-1">Let the AI curate your weekly path.</p>
                        </div>
                        <Button onClick={generatePlan} className="rounded-xl font-bold bg-primary px-8">Generate Plan</Button>
                    </div>
                ) : (
                    <div className="relative space-y-4">
                        {/* Timeline line */}
                        <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-slate-100" />

                        {sessions.slice(0, 4).map((session, idx) => {
                            const sessionDate = new Date(session.scheduledAt);
                            const label = isToday(sessionDate) ? 'Today' : isTomorrow(sessionDate) ? 'Tomorrow' : format(sessionDate, 'MMM d');

                            return (
                                <div key={session.id} className="relative flex gap-4 group">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl shrink-0 z-10 flex items-center justify-center border-4 border-white shadow-sm transition-all group-hover:scale-110",
                                        session.isCompleted ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary"
                                    )}>
                                        {session.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                    </div>

                                    <div className="flex-1 bg-slate-50/50 rounded-2xl p-4 border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label} • {format(sessionDate, 'h:mm a')}</span>
                                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{session.durationMinutes}m</span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{session.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1 truncate">{session.topic?.subject.name} • {session.topic?.title}</p>

                                        <div className="flex items-center justify-between mt-4">
                                            <Link href={`/dashboard/learn/${session.topic?.id}`} passHref>
                                                <Button size="sm" className="h-8 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs ring-offset-4 ring-primary/0 hover:ring-2 transition-all">
                                                    <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                                                    Start Now
                                                </Button>
                                            </Link>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-slate-50/20">
                <Link href="/dashboard/schedule" className="block">
                    <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest text-slate-500 hover:text-primary">
                        View Full Calendar
                    </Button>
                </Link>
            </div>
        </div>
    );
}
