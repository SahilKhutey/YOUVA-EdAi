"use client";

import MainLayout from "@/app/components/MainLayout";
import {
  RefreshCw,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

interface RevisionSuggestion {
  topicId: string;
  title: string;
  masteryScore: number;
  lastReviewed: string | null;
  reason: string;
}

export default function RevisionPage() {
  const [suggestions, setSuggestions] = useState<RevisionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingSession, setStartingSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await api.get("/revision/suggestions");
        setSuggestions(res.data);
      } catch (err) {
        console.error("Failed to fetch revision suggestions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const startRevision = async () => {
    if (startingSession) return;
    setStartingSession(true);
    try {
      const res = await api.post("/revision/start");
      const { sessionId, questions } = res.data;

      // Store questions for the session page to pick up
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `revision_session_${sessionId}`,
          JSON.stringify(questions),
        );
      }

      router.push(`/dashboard/revision/${sessionId}`);
    } catch (err) {
      console.error("Failed to start revision", err);
      setStartingSession(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary" />
            Smart Revision
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Spaced repetition ensures you never forget what you've learned.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Focus Area */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl shadow-sm border border-border p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Today's Focus
                </h2>

                {loading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-16 bg-muted rounded-xl w-full"></div>
                    <div className="h-16 bg-muted rounded-xl w-full"></div>
                    <div className="h-16 bg-muted rounded-xl w-full"></div>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-4 mb-8">
                    {suggestions.map((item, idx) => (
                      <div
                        key={item.topicId}
                        className="bg-muted/30 border border-transparent hover:border-primary/20 p-4 rounded-xl transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center font-bold text-muted-foreground text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <span
                                className={
                                  item.reason === "Low Mastery"
                                    ? "text-red-500"
                                    : "text-orange-500"
                                }
                              >
                                {item.reason}
                              </span>
                              • Last reviewed:{" "}
                              {item.lastReviewed
                                ? new Date(
                                    item.lastReviewed,
                                  ).toLocaleDateString()
                                : "Never"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground">
                            {item.masteryScore}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Mastery
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No urgent revision needed today!
                    </p>
                  </div>
                )}

                <button
                  onClick={startRevision}
                  disabled={
                    loading || suggestions.length === 0 || startingSession
                  }
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] ${
                    loading || suggestions.length === 0
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                  }`}
                >
                  {startingSession ? (
                    <span className="animate-pulse">Preparing Session...</span>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-current" />
                      Start Daily Revision Session
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Your Progress
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Weekly Goal</span>
                    <span className="font-medium text-foreground">
                      12/20 Topics
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[60%] rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground">5</div>
                    <div className="text-xs text-muted-foreground">
                      Day Streak
                    </div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-foreground">
                      85%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Retention
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg shadow-primary/20 p-6 text-primary-foreground">
              <h3 className="font-bold text-xl mb-2">Did you know?</h3>
              <p className="text-primary-foreground/90 text-sm leading-relaxed">
                Spaced repetition is most effective when you review a topic{" "}
                <i>just</i> before you're about to forget it. Our AI calculates
                this optimal moment for you!
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
