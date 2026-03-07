"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ActivityData {
    date: string;
    count: number;
}

interface Props {
    data: ActivityData[];
}

export default function ActivityHeatmap({ data }: Props) {
    const activityMap = useMemo(() => {
        const map = new Map<string, number>();
        data.forEach((d) => map.set(d.date, d.count));
        return map;
    }, [data]);

    const today = new Date();
    const days = [];

    // Calculate the last 365 days
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        days.push({
            date: dateStr,
            count: activityMap.get(dateStr) || 0,
            dayOfWeek: d.getDay(),
        });
    }

    const getLevel = (count: number) => {
        if (count === 0) return "bg-muted text-muted-foreground/10";
        if (count <= 2) return "bg-primary/20 text-primary/40";
        if (count <= 4) return "bg-primary/40 text-primary/60";
        if (count <= 6) return "bg-primary/70 text-primary/80";
        return "bg-primary text-primary-foreground";
    };

    // Group by week for display
    const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];

    // Align the first week
    const firstDayStyle = { gridRowStart: days[0].dayOfWeek + 1 };

    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Study Consistency</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-muted" />
                        <div className="w-3 h-3 rounded-sm bg-primary/20" />
                        <div className="w-3 h-3 rounded-sm bg-primary/40" />
                        <div className="w-3 h-3 rounded-sm bg-primary/70" />
                        <div className="w-3 h-3 rounded-sm bg-primary" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="overflow-x-auto pb-2 custom-scrollbar">
                <div
                    className="grid grid-flow-col grid-rows-7 gap-1.5"
                    style={{ gridAutoColumns: "min-content" }}
                >
                    {days.map((day, i) => (
                        <div
                            key={day.date}
                            title={`${day.count} sessions on ${day.date}`}
                            className={cn(
                                "w-3.5 h-3.5 rounded-sm transition-colors",
                                getLevel(day.count)
                            )}
                            style={i === 0 ? firstDayStyle : undefined}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">{data.reduce((acc, curr) => acc + curr.count, 0)}</span>
                        <span>Sessions this year</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">{[...activityMap.values()].filter(c => c > 0).length}</span>
                        <span>Active days</span>
                    </div>
                </div>
                <p>Last 365 days of activity</p>
            </div>
        </div>
    );
}
