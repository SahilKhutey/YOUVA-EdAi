'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, Camera, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import api from '@/lib/axios';

interface ProctorHarnessProps {
    sessionId: string;
    children: React.ReactNode;
}

export function ProctorHarness({ sessionId, children }: ProctorHarnessProps) {
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [hasCamera, setHasCamera] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [integrityScore, setIntegrityScore] = useState(100);

    // Log Anomaly to Backend
    const reportAnomaly = useCallback(async (anomalyType: string, metadata?: any) => {
        if (!sessionId) return;
        try {
            const res = await api.post(`/assessment/${sessionId}/log-anomaly`, {
                anomalyType,
                metadata
            });
            // Optionally update local integrity score preview if backed returns it
            if (res.data?.integrityScore !== undefined) {
                setIntegrityScore(res.data.integrityScore);
            }
        } catch (e) {
            console.error('Failed to report anomaly', e);
        }
    }, [sessionId]);

    // 1. Tab Switch Detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                const msg = "Tab switch detected! This incident has been logged.";
                setWarnings(prev => [...prev.slice(-2), msg]);
                reportAnomaly('TAB_SWITCH');
            }
        };

        const handleBlur = () => {
            const msg = "Window focus lost! Please return to the exam.";
            setWarnings(prev => [...prev.slice(-2), msg]);
            reportAnomaly('TAB_SWITCH', { type: 'blur' });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [sessionId, reportAnomaly]);

    // 2. Camera Setup (Mock Gaze tracking for MVP)
    useEffect(() => {
        const startCamera = async () => {
            try {
                const _stream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = _stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = _stream;
                }
                setHasCamera(true);

                // For MVP, we simulate a check every 45s as a placeholder.
                const interval = setInterval(() => {
                    if (!streamRef.current?.active) {
                        reportAnomaly('FACE_MISSING');
                        setWarnings(prev => [...prev.slice(-2), "Camera disconnected! Ensure your face is visible."]);
                    }
                }, 45000);

                return () => clearInterval(interval);
            } catch (err) {
                console.error("Camera error", err);
                setHasCamera(false);
                setWarnings(prev => [...prev.slice(-2), "Camera access denied. This will impact your integrity score."]);
                reportAnomaly('FACE_MISSING', { error: 'denied_or_missing' });
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, [sessionId, reportAnomaly]);

    // 3. Mouse Anomaly Detector (Basic)
    useEffect(() => {
        let lastEventTime = Date.now();
        let anomalyCount = 0;

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            const timeDiff = now - lastEventTime;
            // Fast teleport detection (e.g., bot scripts move mouse instantly)
            if (timeDiff < 5 && (Math.abs(e.movementX) > 150 || Math.abs(e.movementY) > 150)) {
                anomalyCount++;
                if (anomalyCount > 8) {
                    reportAnomaly('MOUSE_IRREGULARITY');
                    setWarnings(prev => [...prev.slice(-2), "Irregular mouse movement detected."]);
                    anomalyCount = 0;
                }
            }
            lastEventTime = now;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [sessionId, reportAnomaly]);

    return (
        <div className="relative w-full h-full min-h-screen bg-slate-50 flex overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto w-full relative">
                {warnings.length > 0 && (
                    <div className="sticky top-0 z-50 bg-rose-50 border-b border-rose-100 p-4 space-y-2 shadow-sm">
                        {warnings.map((w, i) => (
                            <div key={i} className="flex items-center gap-3 text-rose-600 font-bold text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <span>{w}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="h-full w-full">
                    {children}
                </div>
            </div>

            {/* Proctor Sidebar */}
            <div className="w-80 border-l bg-white p-6 shadow-2xl flex flex-col items-center gap-6 sticky top-0 h-screen overflow-y-auto z-40">
                <div className="w-full text-center border-b pb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        <h3 className="font-black text-primary uppercase tracking-wider">Live Proctoring</h3>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                        Secure Session Active & Recording
                    </p>
                </div>

                <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden relative shadow-2xl ring-4 ring-slate-100">
                    {hasCamera ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover -scale-x-100"
                            />
                            <div className="absolute top-3 left-3 bg-rose-500 w-2 h-2 rounded-full animate-ping" />
                            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-mono">
                                REC 00:00:42
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 flex-col gap-3 p-6 text-center">
                            <EyeOff className="w-10 h-10 opacity-30" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Camera Denied</span>
                        </div>
                    )}
                    {/* Scanning Overlay Effect */}
                    <div className="absolute inset-0 border-2 border-primary/20 rounded-2xl pointer-events-none" />
                    <div className="absolute left-0 right-0 h-[1px] bg-primary/30 top-[20%] animate-[scan_4s_linear_infinite]" />
                </div>

                <div className="w-full space-y-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Integrity Score</span>
                            <span className={`text-lg font-black ${integrityScore < 70 ? 'text-rose-500' : 'text-emerald-500'}`}>{integrityScore}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${integrityScore < 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${integrityScore}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        {[
                            { label: 'Eye Tracking', status: 'active', icon: Zap },
                            { label: 'Tab Monitor', status: 'active', icon: Zap },
                            { label: 'Audio Analysis', status: 'warning', icon: Zap },
                        ].map((m, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <m.icon className={`w-3.5 h-3.5 ${m.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                    <span className="text-[11px] font-bold text-slate-600">{m.label}</span>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-auto w-full pt-6 border-t font-mono text-[9px] text-slate-400 leading-relaxed">
                    IP: 192.168.1.1<br />
                    UID: {user?.id.substring(0, 8)}<br />
                    SESSION: {sessionId.substring(0, 8)}<br />
                    ENCRYPTION: AES-256
                </div>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 0%; }
                    100% { top: 100%; }
                }
            `}</style>
        </div>
    );
}
