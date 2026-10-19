"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import MainLayout from "@/app/components/MainLayout";
import { BookOpen, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  description: string | null;
  topics?: { id: string }[];
}

export default function SubjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/subjects");
      setSubjects(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch subjects:", err);
      setError("Failed to load subjects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Curriculum Subjects
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore mastery tracks, adaptive quizzes, and curriculum lessons.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-destructive/10 p-4 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">
              <p className="font-semibold">Unable to load subjects</p>
              <p className="mt-0.5 text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading curriculum subjects...</p>
          </div>
        ) : subjects.length === 0 && !error ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">No subjects found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Curriculum content will appear here once configured by administrators or teachers.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/40 cursor-pointer transition-all duration-200"
              >
                <div className="p-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {subject.name}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {subject.description || "Comprehensive subject study guide and adaptive practice modules."}
                  </p>
                </div>
                <div className="px-6 py-3.5 bg-muted/30 border-t border-border flex items-center justify-between text-xs font-medium text-primary">
                  <span>Explore Topics</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
