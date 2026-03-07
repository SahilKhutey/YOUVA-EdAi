'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import { Loader2, MonitorPlay, Sparkles, ChevronRight, CheckCircle2, FileText, Layers, LogOut } from 'lucide-react';
import VideoCall from '@/components/classroom/VideoCall';
import FeedbackModal from '@/components/shared/FeedbackModal';

const SharedWhiteboard = dynamic(() => import('@/components/classroom/SharedWhiteboard'), { ssr: false });

export default function ClassroomWorkspace() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [socket, setSocket] = useState<Socket | null>(null);
    const [sessionData, setSessionData] = useState<any>(null);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/api`}/classroom/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) setSessionData(await res.json());
        };
        fetchSession();

        const newSocket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}`);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join-room', { sessionId });
        });

        return () => {
            newSocket.disconnect();
        };
    }, [sessionId]);

    if (!user || !sessionData) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;

    const isTeacher = user.id === sessionData.teacherId;
    const steps = sessionData.lessonPlan?.steps || [];
    const currentStepIndex = sessionData.currentStep - 1;
    const currentStepData = steps[currentStepIndex];

    const handleNextStep = () => {
        if (!socket) return;
        const nextIdx = currentStepIndex + 2; // +1 since it's 1-based index in DB
        if (nextIdx <= steps.length) {
            socket.emit('change-step', { sessionId, stepIndex: nextIdx });
            setSessionData({ ...sessionData, currentStep: nextIdx });
        }
    };

    // Listen for step changes from teacher
    useEffect(() => {
        if (!socket) return;
        const handler = (stepIndex: number) => {
            setSessionData((prev: any) => ({ ...prev, currentStep: stepIndex }));
        };
        socket.on('change-step', handler);
        return () => { socket.off('change-step', handler); }
    }, [socket]);


    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
            {/* Left Sidebar - Learning Flow */}
            <div className="w-[340px] bg-white border-r border-slate-200 flex flex-col z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                <div className="p-6 border-b border-slate-100 bg-indigo-50/50 shrink-0">
                    <h2 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
                        <MonitorPlay className="w-6 h-6 text-indigo-600" />
                        Live Classroom
                    </h2>
                    <p className="text-sm font-semibold text-slate-500 mt-2 line-clamp-2">{sessionData.lessonPlan?.subject}: {sessionData.lessonPlan?.topicName}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {steps.map((step: any, idx: number) => {
                        const isActive = idx === currentStepIndex;
                        const isPast = idx < currentStepIndex;
                        return (
                            <div key={step.id} className={`relative flex gap-4 ${isActive ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-40 hover:opacity-100 transition-opacity'}`}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${isActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md' : isPast ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        {isPast ? <CheckCircle2 className="w-5 h-5 hidden" /> : step.order}
                                        {isPast && <CheckCircle2 className="w-5 h-5 absolute" />}
                                    </div>
                                    {idx !== steps.length - 1 && <div className={`w-0.5 h-full absolute top-8 left-4 -z-0 ${isPast ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
                                </div>
                                <div className={`flex-1 pb-6 ${isActive ? 'pt-1' : 'pt-2'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">{step.type}</span>
                                    <h4 className={`font-bold leading-tight ${isActive ? 'text-indigo-900 text-[17px]' : 'text-slate-700 text-[15px]'}`}>{step.title}</h4>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {isTeacher && (
                    <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                        <button onClick={handleNextStep} disabled={currentStepIndex >= steps.length - 1} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none">
                            Next Stage <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                {/* Top Info Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-5 px-6 flex justify-between items-center shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase border border-indigo-200">{currentStepData?.type || 'Waiting'}</span>
                            <span className="text-sm font-semibold text-slate-400">Step {currentStepData?.order || 0} of {steps.length}</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{currentStepData?.title || 'Waiting for Teacher to Start...'}</h2>
                    </div>
                    {/* Dispay AI companion hint for student, or quick tools for teacher */}
                    <div className="flex items-center gap-4">
                        {!isTeacher ? (
                            <div className="flex items-center gap-3 bg-amber-50 px-5 py-3 rounded-xl border border-amber-200 shadow-sm hidden md:flex">
                                <div className="bg-amber-100 p-2 rounded-lg"><Sparkles className="w-4 h-4 text-amber-600" /></div>
                                <span className="text-sm font-bold text-amber-900">AI Assistant is active if you need help</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 hidden md:flex">
                                <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border">You are leading this session</span>
                            </div>
                        )}
                        <button
                            onClick={() => setIsFeedbackOpen(true)}
                            className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors ${isTeacher ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                                }`}
                        >
                            <LogOut className="w-4 h-4" /> {isTeacher ? 'End Session' : 'Leave Class'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex min-h-0 gap-6">
                    {/* Whiteboard */}
                    <div className="flex-[2_2_0%] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden relative group">
                        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-2xl z-20"></div>
                        <SharedWhiteboard socket={socket} sessionId={sessionId} />
                    </div>

                    {/* Video and Content */}
                    <div className="flex-1 flex flex-col gap-6 min-w-[340px]">
                        <div className="h-72 shrink-0 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-700 bg-slate-900 relative">
                            <VideoCall socket={socket} sessionId={sessionId} isTeacher={isTeacher} />
                        </div>

                        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-y-auto relative">
                            <div className="sticky top-0 bg-white/80 backdrop-blur-md pb-4 border-b border-slate-100 mb-4 z-10 flex items-center justify-between">
                                <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" /> Context & Materials
                                </h3>
                            </div>
                            <div className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed">
                                {currentStepData?.content ? (
                                    <p className="whitespace-pre-wrap">{currentStepData.content}</p>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-12">
                                        <Layers className="w-12 h-12 mb-4 opacity-40 text-indigo-300" />
                                        <p className="font-semibold text-slate-500">No supplementary content for this stage.</p>
                                        <p className="text-xs text-slate-400 mt-1">Focus on the whiteboard and live discussion.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => router.push(isTeacher ? '/dashboard/teacher' : '/dashboard/student')}
                sessionId={sessionId}
                context={isTeacher ? 'POST_SESSION_TEACHER' : 'POST_SESSION_STUDENT'}
                title={isTeacher ? "Session Complete" : "How was class?"}
                subtitle={isTeacher ? "How did the AI-generated material perform?" : "Rate your learning experience."}
            />
        </div>
    );
}
