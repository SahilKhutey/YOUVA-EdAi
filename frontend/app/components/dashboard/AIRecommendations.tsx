"use client";

import { Sparkles, ArrowRight } from "lucide-react";

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
    <div className="clay-card bg-gradient-to-br from-[#E2E8F0] to-blue-50/50 p-6 flex flex-col gap-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

      <div className="flex items-center gap-2 z-10">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h3 className="font-bold text-lg text-indigo-900">AI Suggestions</h3>
      </div>

      <div className="space-y-3 z-10">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <a
              key={rec.id}
              href={rec.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50 hover:bg-white transition-colors cursor-pointer group shadow-sm hover:shadow-md block"
            >
              <p className="text-sm font-medium text-indigo-900 mb-1">
                {rec.type} <span className="font-bold">{rec.topic}</span>
              </p>
              <p className="text-xs text-indigo-700/80 mb-3">{rec.reason}</p>
              <div className="flex items-center text-xs font-bold text-primary group-hover:underline">
                Start {rec.type} <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </a>
          ))
        ) : (
          <p className="text-xs text-indigo-900">No new recommendations.</p>
        )}
      </div>
    </div>
  );
}
