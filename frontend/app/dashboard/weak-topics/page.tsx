"use client";

import MainLayout from "@/app/components/MainLayout";
import { AlertCircle, ArrowRight, BarChart2, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

interface WeakTopic {
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
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Weak Topics Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Focus your efforts where it matters most.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
              <BarChart2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Great Job!
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              You don't have any significant weak areas right now. Keep
              practicing to maintain your mastery!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {topics.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-border flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow"
              >
                {/* Score Indicator */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-red-100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-red-500 transition-all duration-1000 ease-out"
                      strokeDasharray={`${item.score}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute text-sm font-bold text-red-600">
                    {item.score}%
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-foreground">
                      {item.topic}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                      {item.subject}
                    </span>
                  </div>
                  <p className="text-sm text-red-600/80 font-medium flex items-center justify-center md:justify-start gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Needs Improvement
                  </p>
                </div>

                {/* Action */}
                <button
                  onClick={() =>
                    router.push(`/dashboard/practice/${item.topic}`)
                  } // Assuming structured routing
                  className="px-5 py-2.5 rounded-lg bg-white border-2 border-primary text-primary font-medium hover:bg-primary hover:text-white transition-all flex items-center gap-2 group"
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
