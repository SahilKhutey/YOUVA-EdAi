"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/app/components/MainLayout";
import ProgressCard from "@/app/components/dashboard/ProgressCard";
import Heatmap from "@/app/components/dashboard/Heatmap";
import UpcomingTests from "@/app/components/dashboard/UpcomingTests";
import AIRecommendations from "@/app/components/dashboard/AIRecommendations";
import RevisionWidget from "@/app/components/dashboard/RevisionWidget";
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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover w-fit">
            Welcome back, {user?.name || "Alex"}!
          </h1>
          <p className="text-muted-foreground">
            Here is your daily learning overview.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading dashboard...
          </div>
        ) : (
          /* Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (Main Stats) - Span 8 */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* 1. Learning Progress Card */}
              <ProgressCard
                stats={stats}
                gamificationStats={gamificationStats}
              />

              {/* 2. Weak Topics Heatmap (Full width of left col) */}
              <Heatmap topics={weakTopics} />
            </div>

            {/* Right Column (Side Panels) - Span 4 */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* 3. Daily Revision */}
              <RevisionWidget />

              {/* 4. Upcoming Tests */}
              <UpcomingTests tests={upcomingTests} />

              {/* 4. AI Recommendations */}
              <AIRecommendations recommendations={recommendations} />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
