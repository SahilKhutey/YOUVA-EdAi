"use client";

import { useRouter } from "next/navigation";

interface HeatmapProps {
  topics: { topicId?: string; topic: string; subject: string; score: number }[];
}

export default function Heatmap({ topics = [] }: HeatmapProps) {
  const router = useRouter();

  return (
    <div className="clay-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-lg text-foreground">
            Weak Topics Heatmap
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any topic to practice adaptive questions immediately
          </p>
        </div>
        <select className="text-xs border border-border bg-card rounded-lg px-2.5 py-1 text-muted-foreground focus:ring-0 cursor-pointer">
          <option>Last 30 Days</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {topics.length > 0 ? (
          topics.map((t, idx) => (
            <div
              key={idx}
              onClick={() =>
                router.push(
                  t.topicId
                    ? `/dashboard/practice/${t.topicId}`
                    : "/dashboard/subjects"
                )
              }
              className="flex items-center justify-between p-4 bg-destructive/10 rounded-xl border border-destructive/20 hover:border-primary/50 cursor-pointer transition-all group shadow-sm"
            >
              <div className="min-w-0 flex-1 pr-2">
                <h4
                  className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors"
                  title={t.topic}
                >
                  {t.topic}
                </h4>
                <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
              </div>
              <div className="text-xl font-bold text-destructive shrink-0">
                {Math.round(t.score)}%
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center text-muted-foreground py-6 text-sm border border-dashed border-border rounded-xl">
            No weak topics found. Keep up the great work!
          </div>
        )}
      </div>

      {/* Heatmap Grid Visual (Decorative) */}
      <div className="mt-6 flex flex-wrap gap-1">
        {Array.from({ length: 84 }).map((_, i) => {
          const opacity = Math.random();
          const color =
            opacity > 0.7
              ? "bg-primary"
              : opacity > 0.4
                ? "bg-primary/40"
                : "bg-muted";
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${color} transition-all hover:scale-125 cursor-pointer`}
              title={`Day ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
