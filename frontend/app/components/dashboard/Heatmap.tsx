"use client";

interface HeatmapProps {
  topics: { topic: string; subject: string; score: number }[];
}

export default function Heatmap({ topics = [] }: HeatmapProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-foreground">
          Weak Topics Heatmap
        </h3>
        <select className="text-sm border-none bg-transparent text-muted-foreground focus:ring-0 cursor-pointer">
          <option>Last 30 Days</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {topics.length > 0 ? (
          topics.map((t, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100"
            >
              <div>
                <h4
                  className="font-semibold text-red-900 truncate max-w-[120px]"
                  title={t.topic}
                >
                  {t.topic}
                </h4>
                <p className="text-xs text-red-700">{t.subject}</p>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {Math.round(t.score)}%
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center text-muted-foreground py-4">
            No weak topics found. Keep it up!
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
