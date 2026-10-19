"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface AIRecommendationsProps {
  recommendations: {
    id: string;
    type: string;
    topic: string;
    reason: string;
    url?: string;
  }[];
}

export default function AIRecommendations({
  recommendations = [],
}: AIRecommendationsProps) {
  return (
    <div className="clay-card p-6 flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg text-foreground">AI Suggestions</h3>
      </div>

      <div className="space-y-3">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => {
            const isExternal = Boolean(rec.url && rec.url.startsWith("http"));
            return (
              <a
                key={rec.id}
                href={rec.url || "/dashboard/subjects"}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="bg-muted/30 hover:bg-muted/60 p-4 rounded-xl border border-border transition-all cursor-pointer group shadow-sm block"
              >
                <p className="text-sm font-medium text-foreground mb-1">
                  {rec.type} <span className="font-bold">{rec.topic}</span>
                </p>
                <p className="text-xs text-muted-foreground mb-3">{rec.reason}</p>
                <div className="flex items-center text-xs font-semibold text-primary group-hover:underline">
                  Start {rec.type} <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground">No new recommendations right now.</p>
        )}
      </div>
    </div>
  );
}
