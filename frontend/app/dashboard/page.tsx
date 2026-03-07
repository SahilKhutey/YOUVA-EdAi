"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/app/components/MainLayout";
import ProgressCard from "@/app/components/dashboard/ProgressCard";
import Heatmap from "@/app/components/dashboard/Heatmap";
import UpcomingTests from "@/app/components/dashboard/UpcomingTests";
import AIRecommendations from "@/app/components/dashboard/AIRecommendations";
import RevisionWidget from "@/app/components/dashboard/RevisionWidget";
import StreakBanner from "@/app/components/dashboard/StreakBanner";
import AchievementShowcase from "@/app/components/dashboard/AchievementShowcase";
import GoalProgressWidget from "@/app/components/dashboard/GoalProgressWidget";
import AnnouncementBanner from "@/app/components/dashboard/AnnouncementBanner";
import SmartSchedule from "@/app/components/dashboard/SmartSchedule";

import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [gamificationStats, setGamificationStats] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!isMounted) return null;

  const fetchDashboardData = async () => {
    try {
      const [statsRes, gamificationRes, weakRes, testsRes, recsRes] =
        await Promise.all([
          api.get("/analytics/dashboard-stats"),
          api.get("/gamification/stats"),
          api.get("/analytics/weak-topics"),
          api.get("/analytics/upcoming-tests"),
          api.get("/analytics/recommendations"),
        ]);

      setStats(statsRes.data);
      setGamificationStats(gamificationRes.data);
      setWeakTopics(weakRes.data);
      setUpcomingTests(testsRes.data);
      setRecommendations(recsRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover w-fit">
            Welcome back, {user?.name || "Alex"}!
          </h1>
          <p className="text-muted-foreground">
            Here is your daily learning overview.
          </p>
        </div>

        {/* ── Streak + Level Banner (loads independently) ── */}
        <StreakBanner />

        {/* ── Teacher Announcements ── */}
        <AnnouncementBanner />

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading dashboard...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── Left Column — span 8 ── */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <ProgressCard stats={stats} gamificationStats={gamificationStats} />
              <Heatmap topics={weakTopics} />
            </div>

            {/* ── Right Column — span 4 ── */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <SmartSchedule />
              <AchievementShowcase />
              <GoalProgressWidget />
              <RevisionWidget />
              <UpcomingTests tests={upcomingTests} />
              <AIRecommendations recommendations={recommendations} />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
