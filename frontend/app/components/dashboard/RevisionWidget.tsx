"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";

interface RevisionSuggestion {
  topicId: string;
  title: string;
  masteryScore: number;
  lastReviewed: string | null;
  reason: string;
}

export default function RevisionWidget() {
  const [suggestions, setSuggestions] = useState<RevisionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleStartRevision = () => {
    router.push("/dashboard/revision");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border p-6 h-full flex flex-col animate-pulse">
        <div className="h-6 w-1/3 bg-muted rounded mb-4"></div>
        <div className="space-y-3 flex-1">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-foreground">All Caught Up!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Great job keeping your knowledge fresh.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Daily Revision
          </h3>
          <p className="text-xs text-muted-foreground">
            Topics fading from memory
          </p>
        </div>
        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
          {suggestions.length} pending
        </span>
      </div>

      <div className="flex-1 space-y-3 mb-4">
        {suggestions.slice(0, 3).map((item) => (
          <div
            key={item.topicId}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors group"
          >
            <div className="flex-1 min-w-0 mr-3">
              <h4 className="font-medium text-sm text-foreground truncate">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span
                  className={
                    item.reason === "Low Mastery"
                      ? "text-red-500 font-medium"
                      : "text-orange-500 font-medium"
                  }
                >
                  {item.reason}
                </span>
                <span className="text-muted-foreground">
                  • {item.masteryScore}% Mastery
                </span>
              </div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        ))}
      </div>

      <button
        onClick={handleStartRevision}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
      >
        <Zap className="w-4 h-4" />
        Start Quick Review
      </button>
    </div>
  );
}
