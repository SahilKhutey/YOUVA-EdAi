'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Medal, Flame, Star, Crown, ChevronRight, User as UserIcon, Loader2, Search, Filter } from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import MainLayout from '@/app/components/MainLayout';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    totalXp: number;
    currentLevel: number;
    currentStreak: number;
    isCurrentUser: boolean;
}

export default function LeaderboardPage() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const res = await api.get('/gamification/leaderboard');
                setEntries(res.data);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const topThree = entries.slice(0, 3);
    const remaining = entries.slice(3);

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-6 h-6 text-amber-500" />
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Hall of Fame</h1>
                        </div>
                        <p className="text-muted-foreground font-medium text-sm">Top scholars pushing the boundaries of adaptive mastery.</p>
                    </div>

                    <div className="flex bg-muted/60 p-1.5 rounded-2xl border border-border w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('global')}
                            className={cn(
                                "flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-bold transition-all",
                                activeTab === 'global' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={cn(
                                "flex-1 md:flex-none px-8 py-2 rounded-xl text-xs font-bold transition-all",
                                activeTab === 'friends' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Classroom
                        </button>
                    </div>
                </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground font-bold animate-pulse">Calculating Ranks...</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Podium */}
                    <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 max-w-4xl mx-auto">
                        {/* Rank 2 */}
                        {topThree[1] && (
                            <div className="order-2 md:order-1 flex flex-col items-center gap-4 group">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-muted bg-muted/40 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                                        <UserIcon className="w-12 h-12 text-muted-foreground" />
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-muted-foreground text-background w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-card">2</div>
                                </div>
                                <div className="text-center bg-card p-6 rounded-3xl border border-border w-full shadow-sm hover:shadow-md transition-shadow relative overflow-hidden h-40 flex flex-col justify-end">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-muted" />
                                    <h3 className="font-bold text-lg text-foreground truncate w-full">{topThree[1].name}</h3>
                                    <p className="text-primary font-black text-xl">{topThree[1].totalXp.toLocaleString()} <span className="text-xs">XP</span></p>
                                    {topThree[1].isCurrentUser && <span className="text-[10px] font-black uppercase text-primary tracking-widest mt-2">You</span>}
                                </div>
                            </div>
                        )}

                        {/* Rank 1 */}
                        {topThree[0] && (
                            <div className="order-1 md:order-2 flex flex-col items-center gap-4 group">
                                <div className="relative">
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                        <Crown className="w-10 h-10 text-amber-400 drop-shadow-lg animate-bounce" />
                                    </div>
                                    <div className="w-32 h-32 rounded-full border-4 border-amber-400 bg-amber-500/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform ring-4 ring-amber-400/20">
                                        <UserIcon className="w-16 h-16 text-amber-500" />
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black border-2 border-card text-lg shadow-lg">1</div>
                                </div>
                                <div className="text-center bg-card p-8 rounded-3xl border-2 border-amber-400/40 w-full shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden h-52 flex flex-col justify-end ring-4 ring-amber-400/10">
                                    <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-amber-400 to-amber-500" />
                                    <h3 className="font-black text-xl text-foreground truncate w-full">{topThree[0].name}</h3>
                                    <p className="text-amber-500 font-extrabold text-3xl">{topThree[0].totalXp.toLocaleString()} <span className="text-sm">XP</span></p>
                                    <div className="flex justify-center gap-2 mt-4">
                                        <span className="text-[10px] font-black px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">Level {topThree[0].currentLevel}</span>
                                        {topThree[0].isCurrentUser && <span className="text-[10px] font-black px-2 py-1 bg-primary text-primary-foreground rounded-lg">You</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rank 3 */}
                        {topThree[2] && (
                            <div className="order-3 flex flex-col items-center gap-4 group">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-orange-400 bg-orange-500/10 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                                        <UserIcon className="w-10 h-10 text-orange-400" />
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-card">3</div>
                                </div>
                                <div className="text-center bg-card p-6 rounded-3xl border border-border w-full shadow-sm hover:shadow-md transition-shadow relative overflow-hidden h-36 flex flex-col justify-end">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-400/60" />
                                    <h3 className="font-bold text-lg text-foreground truncate w-full">{topThree[2].name}</h3>
                                    <p className="text-orange-500 font-black text-xl">{topThree[2].totalXp.toLocaleString()} <span className="text-xs">XP</span></p>
                                    {topThree[2].isCurrentUser && <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest mt-2">You</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rest of List */}
                    <div className="max-w-4xl mx-auto bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
                            <h3 className="font-bold text-foreground">Ascending Scholars</h3>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <select className="pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-xs font-bold outline-none ring-primary/20 focus:ring-2 transition-all appearance-none cursor-pointer text-foreground">
                                        <option>Highest XP</option>
                                        <option>Daily Streak</option>
                                        <option>Current Level</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-border">
                            {remaining.map((entry) => (
                                <div
                                    key={entry.userId}
                                    className={cn(
                                        "group flex items-center gap-4 sm:gap-6 p-4 sm:p-5 hover:bg-muted/40 transition-colors",
                                        entry.isCurrentUser && "bg-primary/5"
                                    )}
                                >
                                    <div className="w-8 sm:w-12 text-center">
                                        <span className="font-bold text-muted-foreground text-base sm:text-lg group-hover:text-primary transition-colors">{entry.rank}</span>
                                    </div>

                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
                                        <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-foreground flex items-center gap-2 truncate">
                                            {entry.name}
                                            {entry.isCurrentUser && <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0">You</span>}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                                                {entry.currentStreak} day streak
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-base sm:text-lg font-black text-foreground leading-none mb-1">{entry.totalXp.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">XP</p>
                                    </div>

                                    <div className="ml-2 sm:ml-4 shrink-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted/60 border border-border flex flex-col items-center justify-center">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Lvl</span>
                                            <span className="font-bold text-primary text-base sm:text-lg leading-none mt-0.5">{entry.currentLevel}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {remaining.length === 0 && (
                            <div className="p-12 text-center">
                                <p className="text-muted-foreground text-sm font-medium">Earn XP to climb the ranks!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            </div>
        </MainLayout>
    );
}
