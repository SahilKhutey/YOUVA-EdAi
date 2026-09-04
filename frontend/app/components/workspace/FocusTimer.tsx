'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Wind, CloudRain, Library, Coffee, Timer, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AMBIENT_SOUNDS = [
    { id: 'none', name: 'Off', icon: Music, url: null },
    { id: 'lofi', name: 'Lofi Beats', icon: Coffee, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder
    { id: 'rain', name: 'Rainfall', icon: CloudRain, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }, // Placeholder
    { id: 'wind', name: 'Soft Wind', icon: Wind, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }, // Placeholder
    { id: 'library', name: 'Library', icon: Library, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }, // Placeholder
];

export default function FocusTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const [activeSound, setActiveSound] = useState('none');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Logic for switching modes or notifying
            alert(`${mode === 'work' ? 'Work' : 'Break'} session complete!`);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
    };

    const handleSoundChange = (soundId: string) => {
        setActiveSound(soundId);
        if (audioRef.current) {
            audioRef.current.pause();
            const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
            if (sound?.url) {
                audioRef.current.src = sound.url;
                audioRef.current.loop = true;
                audioRef.current.play();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white rounded-[32px] border shadow-xl p-8 max-w-md w-full relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary/20">
                <div
                    className="h-full bg-primary transition-all duration-1000"
                    style={{ width: `${(timeLeft / (mode === 'work' ? 25 * 60 : 5 * 60)) * 100}%` }}
                />
            </div>

            <div className="flex flex-col items-center gap-8 relative z-10">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full">
                    <Timer className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {mode === 'work' ? 'Focus Mode' : 'Rest Break'}
                    </span>
                </div>

                <div className="text-8xl font-black tracking-tighter text-slate-900 tabular-nums">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex items-center gap-4 w-full">
                    <Button
                        onClick={toggleTimer}
                        size="lg"
                        className="flex-1 rounded-2xl h-16 text-lg font-black bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20"
                    >
                        {isActive ? <Pause className="mr-2 h-6 w-6" /> : <Play className="mr-2 h-6 w-6" />}
                        {isActive ? 'Pause' : 'Start Focus'}
                    </Button>

                    <Button
                        onClick={resetTimer}
                        variant="outline"
                        size="icon"
                        className="w-16 h-16 rounded-2xl border-2 hover:bg-slate-50"
                    >
                        <RotateCcw className="h-6 w-6 text-slate-500" />
                    </Button>
                </div>

                <div className="w-full space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Volume2 className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ambient Soundscapes</span>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {AMBIENT_SOUNDS.map((sound) => (
                            <button
                                key={sound.id}
                                onClick={() => handleSoundChange(sound.id)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2",
                                    activeSound === sound.id
                                        ? "bg-primary/5 border-primary shadow-sm"
                                        : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                                )}
                            >
                                <sound.icon className={cn(
                                    "w-5 h-5",
                                    activeSound === sound.id ? "text-primary" : "text-slate-400"
                                )} />
                                <span className="text-[8px] font-black uppercase tracking-tight text-center">{sound.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <audio ref={audioRef} />

            {/* Decorative patterns */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-secondary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
        </div>
    );
}
