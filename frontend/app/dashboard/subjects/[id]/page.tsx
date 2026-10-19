"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import MainLayout from "@/app/components/MainLayout";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  PlayCircle,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  order: number;
}

interface SubjectDetail {
  id: string;
  name: string;
  description: string | null;
  topics: Topic[];
}

export default function SubjectDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && id) {
      fetchSubjectDetails();
    }
  }, [user, id]);

  const fetchSubjectDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/subjects/${id}`);
      setSubject(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch subject details:", err);
      setError("Failed to load subject details. It may not exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/dashboard/subjects")}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Curriculum Subjects
        </button>

        {error && (
          <div className="mb-6 rounded-2xl bg-destructive/10 p-4 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">
              <p className="font-semibold">Error Loading Subject</p>
              <p className="mt-0.5 text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading subject curriculum...</p>
          </div>
        ) : !subject ? null : (
          <div>
            {/* Subject Hero Header */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                    <BookOpen className="h-3.5 w-3.5" /> Subject Overview
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {subject.name}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    {subject.description || "Master core concepts through interactive sessions and adaptive quizzes."}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 bg-muted/40 px-3.5 py-2 rounded-xl border border-border">
                  <span className="font-bold text-foreground">{subject.topics?.length || 0}</span>
                  <span>Topic Modules</span>
                </div>
              </div>
            </div>

            {/* Topics Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold text-foreground">Learning Modules</h2>
                <span className="text-xs text-muted-foreground">Select an action to begin</span>
              </div>

              {subject.topics.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground">No topics yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Lessons and practice quizzes for this subject are currently being authored.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {subject.topics
                    .sort((a, b) => a.order - b.order)
                    .map((topic, index) => (
                      <div
                        key={topic.id}
                        className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-semibold text-foreground">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-foreground truncate">
                              {topic.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {topic.description || "Interactive AI-guided study session and knowledge checks."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                          <button
                            onClick={() => router.push(`/dashboard/learn/${topic.id}`)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                          >
                            <GraduationCap className="h-4 w-4 text-primary" />
                            Lesson Tutor
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/practice/${topic.id}`)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                          >
                            <PlayCircle className="h-4 w-4" />
                            Take Quiz
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
