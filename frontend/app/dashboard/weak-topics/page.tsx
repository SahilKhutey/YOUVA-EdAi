"use client";

import MainLayout from "@/app/components/MainLayout";
import { AlertCircle, ArrowRight, BarChart2, BookOpen, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

interface WeakTopic {
  topicId?: string;
  topic: string;
  subject: string;
  score: number;
}

export default function WeakTopicsPage() {
  const [topics, setTopics] = useState<WeakTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchWeakTopics = async () => {
      try {
        const response = await api.get("/analytics/weak-topics");
        setTopics(response.data);
      } catch (error) {
        console.error("Failed to fetch weak topics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeakTopics();
  }, []);

  return (
    <MainLayout>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Weak Topics Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Focus your practice where adaptive mastery indicates you need improvement.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Great Job!
            </h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-md">
              You do not have any critical weak areas right now. All active topics are above the 60% mastery threshold!
            </p>
            <button
              onClick={() => router.push("/dashboard/subjects")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <BookOpen className="h-4 w-4" />
              Explore More Topics
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {topics.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow"
              >
                {/* Score Indicator */}
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted/60"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-amber-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${item.score}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute text-sm font-bold text-foreground">
                    {item.score}%
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-foreground">
                      {item.topic}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                      {item.subject}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center md:justify-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Mastery below 60% — Practice recommended
                  </p>
                </div>

                {/* Action */}
                <button
                  onClick={() =>
                    router.push(
                      item.topicId
                        ? `/dashboard/practice/${item.topicId}`
                        : "/dashboard/subjects"
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center gap-2 group text-sm shadow-sm shrink-0"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Practice Now</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
