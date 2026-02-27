"use client";

import { TrendingUp, Clock, Award } from "lucide-react";

interface ProgressCardProps {
  stats: {
    completionPercentage: number;
    weeklyStudyHours: number;
    aiConfidenceScore: number;
  } | null;
  gamificationStats?: {
    currentLevel: number;
    totalXp: number;
    currentStreak: number;
  } | null;
}

export default function ProgressCard({
  stats,
  gamificationStats,
}: ProgressCardProps) {
  if (!stats) return null; // Or skeleton

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col md:flex-row items-center justify-between relative overflow-hidden gap-6 md:gap-8">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />

      <div className="flex flex-col md:flex-row gap-8 z-10 w-full">
        {/* Completion % */}
        <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Completion
            </span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-foreground">
            {stats.completionPercentage}%
          </div>
          <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="hidden md:block w-px bg-border/60" />
        <div className="md:hidden h-px w-full bg-border/60" />

        {/* Weekly Hours */}
        <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4 text-secondary" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Weekly Hours
            </span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-foreground">
            {stats.weeklyStudyHours}
            <span className="text-xl text-muted-foreground font-medium">h</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            +2.4h vs last week
          </p>
        </div>

        <div className="hidden md:block w-px bg-border/60" />
        <div className="md:hidden h-px w-full bg-border/60" />

        {/* AI Confidence -> Replaced with Gamification */}
        <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Award className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Level {gamificationStats?.currentLevel || 1}
            </span>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-foreground">
            {gamificationStats?.totalXp || 0}{" "}
            <span className="text-xl text-muted-foreground font-medium">
              XP
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs font-medium px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full w-fit">
              {gamificationStats?.currentStreak || 0} Day Streak 🔥
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
