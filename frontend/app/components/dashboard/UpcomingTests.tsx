"use client";

import { Calendar, ChevronRight } from "lucide-react";

interface UpcomingTestsProps {
  tests: {
    id: number;
    subject: string;
    topic: string;
    date: string;
    type: string;
  }[];
}

export default function UpcomingTests({ tests = [] }: UpcomingTestsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-foreground">Upcoming Tests</h3>
        <button className="text-sm text-primary hover:underline">
          View Calendar
        </button>
      </div>

      <div className="space-y-3">
        {tests.length > 0 ? (
          tests.map((test) => {
            const dateObj = new Date(test.date);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleString("default", { month: "short" });
            const time = dateObj.toLocaleTimeString("default", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={test.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer border border-transparent hover:border-border/50"
              >
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 text-blue-700 rounded-lg font-bold">
                  <span className="text-xs uppercase">{month}</span>
                  <span className="text-lg">{day}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {test.subject} {test.type}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {test.topic} • {time}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            );
          })
        ) : (
          <p className="text-muted-foreground text-sm">No upcoming tests.</p>
        )}
      </div>
    </div>
  );
}
