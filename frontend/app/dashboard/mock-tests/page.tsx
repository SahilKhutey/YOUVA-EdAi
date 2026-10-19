"use client";

import MainLayout from "@/app/components/MainLayout";
import { FileText, Clock, CheckCircle, Loader2, BookOpen, AlertCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/lib/axios";

interface MockTest {
  id: string;
  topicId: string;
  title: string;
  subject: string;
  duration: string;
  questions: number;
  difficulty: string;
  status: "Completed" | "Available";
  score?: number | null;
}

export default function MockTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const res = await api.get("/practice/tests");
        setTests(res.data || []);
      } catch (err: any) {
        console.error("Failed to load mock tests:", err);
        setError("Unable to load mock tests at this time.");
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <MainLayout>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Mock Tests & Practice Exams
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Test your knowledge under timed, adaptive exam conditions.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-destructive/10 p-4 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">
              <p className="font-semibold">Unable to load tests</p>
              <p className="mt-0.5 text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading curriculum practice tests...</p>
          </div>
        ) : tests.length === 0 && !error ? (
          <div className="bg-card rounded-2xl shadow-sm border border-dashed border-border p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No tests available yet</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-md">
              Practice modules will appear here as curriculum subjects and topics are added.
            </p>
            <button
              onClick={() => router.push("/dashboard/subjects")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <BookOpen className="h-4 w-4" />
              Browse Subjects
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col justify-between gap-4 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        test.difficulty === "Hard"
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : test.difficulty === "Medium"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {test.difficulty}
                    </span>
                    {test.status === "Completed" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1 leading-snug">
                      {test.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      {test.subject}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{test.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{test.questions} Questions</span>
                    </div>
                    {test.score !== undefined && test.score !== null && (
                      <span className="ml-auto font-bold text-primary">
                        Score: {Math.round(test.score)}%
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/dashboard/practice/${test.topicId}`)}
                  className={`w-full py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
                    test.status === "Completed"
                      ? "bg-muted hover:bg-muted/80 text-foreground border border-border"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {test.status === "Completed" ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retake Practice Exam
                    </>
                  ) : (
                    "Start Adaptive Exam"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
