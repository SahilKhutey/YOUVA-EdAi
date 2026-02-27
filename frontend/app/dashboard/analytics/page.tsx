"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface ActivityData {
  name: string;
  learning: number;
  practice: number;
}

interface MasteryData {
  subject: string;
  score: number;
  fullMark: number;
}

interface AnalyticsData {
  activityData: ActivityData[];
  masteryData: MasteryData[];
}

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/analytics/summary");
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading analytics...
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="mr-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back
              </button>
              <span className="text-xl font-bold text-primary">
                Analytics & Performance
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Activity Chart */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Monthly Activity
              </h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.activityData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="learning"
                      name="Learning Sessions"
                      fill="#4f46e5"
                    />{" "}
                    {/* Indigo-600 approx */}
                    <Bar
                      dataKey="practice"
                      name="Practice Quizzes"
                      fill="#10B981"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mastery Chart */}
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Subject Mastery Distribution
              </h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={data?.masteryData}
                  >
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="subject"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Radar
                      name="My Mastery"
                      dataKey="score"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
