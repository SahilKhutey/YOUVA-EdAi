'use client';

import { useState, useEffect } from 'react';
import { Award, Lock, CheckCircle2, Star, Zap, Trophy, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirementType: string;
    requirementValue: number;
    earned?: boolean;
}

export default function AchievementShowcase() {
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const [badgesRes, userBadgesRes] = await Promise.all([
                    api.get('/gamification/badges/list'), // Need to add this endpoint or similar
                    api.get('/gamification/badges')
                ]);

                const earnedIds = new Set(userBadgesRes.data.map((b: any) => b.id));
                const merged = badgesRes.data.map((b: any) => ({
                    ...b,
                    earned: earnedIds.has(b.id)
                }));
                setAllBadges(merged);
            } catch (error) {
                console.error('Failed to fetch badges:', error);
                // Fallback for now if list is not implemented
                try {
                    const res = await api.get('/gamification/badges');
                    setAllBadges(res.data.map((b: any) => ({ ...b, earned: true })));
                } catch (e) { }
            } finally {
                setLoading(false);
            }
        };

        fetchBadges();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="clay-card overflow-hidden">
            <div className="p-6 border-b border-border/10 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-slate-800 tracking-tight">Achievements</h3>
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 px-2 py-1 rounded-lg">
                    {allBadges.filter(b => b.earned).length} / {allBadges.length} Unlocked
                </span>
            </div>

            <div className="p-6">
                <TooltipProvider>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                        {allBadges.map((badge) => (
                            <Tooltip key={badge.id}>
                                <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center gap-2 group cursor-help">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center relative transition-all duration-300",
                                            badge.earned
                                                ? "bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 shadow-sm group-hover:scale-110 group-hover:rotate-3"
                                                : "bg-slate-50 border-2 border-slate-100 opacity-60 grayscale"
                                        )}>
                                            {badge.earned ? (
                                                <div className="absolute -top-2 -right-2 bg-primary text-white p-0.5 rounded-full shadow-lg z-10">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </div>
                                            ) : (
                                                <div className="absolute -top-1 -right-1 bg-slate-200 text-slate-400 p-0.5 rounded-full z-10">
                                                    <Lock className="w-2.5 h-2.5" />
                                                </div>
                                            )}

                                            {/* Icon mapping */}
                                            <div className={cn(
                                                "transition-colors",
                                                badge.earned ? "text-primary" : "text-slate-400"
                                            )}>
                                                {badge.icon === 'star' && <Star className="w-7 h-7" />}
                                                {badge.icon === 'award' && <Award className="w-7 h-7" />}
                                                {badge.icon === 'flame' && <Zap className="w-7 h-7" />}
                                                {badge.icon === 'flame-hot' && <Trophy className="w-7 h-7" />}
                                            </div>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="p-3 max-w-[200px] rounded-xl border-2">
                                    <p className="font-black text-sm mb-1">{badge.name}</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
                                    {!badge.earned && (
                                        <div className="mt-3 pt-2 border-t text-[10px] font-black text-primary uppercase tracking-wider">
                                            Progress: {badge.requirementType === 'XP' ? '??? / ' : '0 / '}{badge.requirementValue} {badge.requirementType}
                                        </div>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </TooltipProvider>

                {allBadges.length === 0 && (
                    <div className="text-center py-6">
                        <p className="text-xs text-slate-400 font-bold">Start learning to unlock badges!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
