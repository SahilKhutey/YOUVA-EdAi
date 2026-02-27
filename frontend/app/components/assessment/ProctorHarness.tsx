'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertTriangle, Camera, EyeOff } from 'lucide-react';

interface ProctorHarnessProps {
    sessionId: string;
    children: React.ReactNode;
}

export function ProctorHarness({ sessionId, children }: ProctorHarnessProps) {
    const { data: session } = useSession();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [hasCamera, setHasCamera] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);

    // Log Anomaly to Backend
    const reportAnomaly = async (anomalyType: string, metadata?: any) => {
        if (!(session as any)?.accessToken) return;
        try {
            await fetch(`http://localhost:3001/api/assessment/${sessionId}/log-anomaly`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${(session as any).accessToken}`,
                },
                body: JSON.stringify({ anomalyType, metadata }),
            });
        } catch (e) {
            console.error('Failed to report anomaly', e);
        }
    };

    // 1. Tab Switch Detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setWarnings(prev => [...prev, "Tab switch detected! This incident has been logged."]);
                reportAnomaly('TAB_SWITCH');
            }
        };

        const handleBlur = () => {
            setWarnings(prev => [...prev, "Window focus lost! Please return to the exam."]);
            reportAnomaly('TAB_SWITCH', { type: 'blur' });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [sessionId, session]);

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

                // In a real advanced setup, we'd initialize MediaPipe Face Detection here.
                // For MVP, we simulate a check every 30s as a placeholder.
                const interval = setInterval(() => {
                    // Simulated check
                    if (!streamRef.current?.active) {
                        reportAnomaly('FACE_MISSING');
                        setWarnings(prev => [...prev, "Camera disconnected! Ensure your face is visible."]);
                    }
                }, 30000);

                return () => clearInterval(interval);
            } catch (err) {
                console.error("Camera error", err);
                setHasCamera(false);
                setWarnings(prev => [...prev, "Camera access denied. This will impact your integrity score."]);
                reportAnomaly('FACE_MISSING', { error: 'denied_or_missing' });
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, [sessionId, session]);

    // 3. Mouse Anomaly Detector (Basic)
    useEffect(() => {
        let lastEventTime = Date.now();
        let anomalyCount = 0;

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now();
            const timeDiff = now - lastEventTime;
            // Fast teleport detection (e.g., bot scripts move mouse instantly)
            if (timeDiff < 5 && (Math.abs(e.movementX) > 100 || Math.abs(e.movementY) > 100)) {
                anomalyCount++;
                if (anomalyCount > 5) {
                    reportAnomaly('MOUSE_IRREGULARITY');
                    anomalyCount = 0; // reset
                }
            }
            lastEventTime = now;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [sessionId, session]);

    return (
        <div className="relative w-full h-full min-h-screen bg-slate-50 flex">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto w-full">
                {warnings.length > 0 && (
                    <div className="bg-destructive/10 border-b border-destructive/20 text-destructive p-4 flex flex-col gap-2">
                        {warnings.map((w, i) => (
                            <div key={i} className="flex items-center gap-2 font-medium text-sm">
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
            <div className="w-72 border-l bg-white p-5 shadow-sm flex flex-col items-center gap-5 sticky top-0 h-screen overflow-y-auto">
                <div className="w-full text-center border-b pb-4">
                    <h3 className="font-bold flex items-center justify-center gap-2 text-primary">
                        <Camera className="w-4 h-4" /> Live Proctoring
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Your activity is recorded to maintain exam integrity.
                    </p>
                </div>

                <div className="w-full aspect-video bg-neutral-900 rounded-lg overflow-hidden relative shadow-inner">
                    {hasCamera ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover -scale-x-100" // Mirror effect
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500 flex-col gap-2 p-4 text-center">
                            <EyeOff className="w-8 h-8 opacity-50" />
                            <span className="text-xs font-medium">Camera Offline</span>
                        </div>
                    )}
                    {/* Scanning Overlay Effect */}
                    <div className="absolute inset-0 border-2 border-primary/20 rounded-lg pointer-events-none" />
                    <div className="absolute left-0 right-0 h-[2px] bg-primary/40 top-[50%] animate-[ping_3s_ease-in-out_infinite]" />
                </div>

                <div className="w-full bg-slate-50 rounded-lg p-4 text-xs space-y-3 border">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Tab Monitor</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Mouse Analysis</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-medium">Gaze Tracking</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
