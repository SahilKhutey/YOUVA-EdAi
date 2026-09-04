"use client";

import MainLayout from "@/app/components/MainLayout";
import { Clock, PlayCircle, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/axios";

export default function RecentSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/learning/history");
        setSessions(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Recent Sessions
            </h1>
            <p className="text-muted-foreground mt-1">
              Pick up where you left off.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading history...
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No learning sessions found. Start learning a topic!
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-border flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow group"
              >
                {/* Icon/Image Placeholder */}
                <div className="md:w-16 md:h-16 w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8" />
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-semibold text-lg text-foreground">
                    {session.topic}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {session.subject} •{" "}
                    {new Date(session.date).toLocaleDateString()}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{session.duration}</span>
                  </div>
                  <div className="w-24 hidden md:block">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span className="font-medium text-foreground">
                        {session.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${session.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action */}
                <button className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20">
                  <PlayCircle className="h-4 w-4" />
                  <span>Resume</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
