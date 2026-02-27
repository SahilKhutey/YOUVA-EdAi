"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  description: string | null;
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

  if (authLoading || (loading && !subjects.length)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="text-xl text-muted-foreground">Loading subjects...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
              Subjects
            </h2>
          </div>
          {/* Potential 'Add Subject' button for admins here */}
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-4 border border-destructive/20">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Error</h3>
                <div className="mt-2 text-sm text-destructive/80">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}
              className="overflow-hidden rounded-lg bg-card shadow-sm border border-border hover:shadow-md cursor-pointer transition-shadow duration-200"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-foreground">
                  {subject.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subject.description || "No description available."}
                </p>
              </div>
              <div className="bg-muted/30 px-4 py-4 sm:px-6 border-t border-border">
                <div className="text-sm">
                  <span className="font-medium text-primary hover:text-primary/80 transition-colors">
                    View Topics <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && subjects.length === 0 && !error && (
          <div className="mt-8 text-center text-muted-foreground">
            No subjects found.
          </div>
        )}
      </div>
    </div>
  );
}
