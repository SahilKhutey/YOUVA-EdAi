"use client";

import MainLayout from "@/app/components/MainLayout";
import { FileText, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/lib/axios";

interface MockTestItem {
  id: string | number;
  topicId: string;
  title: string;
  subject: string;
  duration: string;
  questions: number;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  status: "Available" | "Completed" | string;
}

export default function MockTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get("/assessment/mock-tests");
        if (res.data && Array.isArray(res.data)) {
          setTests(res.data);
        }
      } catch {
        // Safe fallback
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mock Tests</h1>
            <p className="text-muted-foreground mt-1">
              Practice under exam conditions.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading available practice tests...
          </div>
        ) : tests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-border p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-primary rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">No Practice Exams Available</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                Practice tests and exam simulations assigned to your curriculum or generated from diagnostic weak areas will appear here.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition shadow-sm"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-border flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      test.difficulty === "Hard"
                        ? "bg-red-100 text-red-700"
                        : test.difficulty === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {test.difficulty}
                  </div>
                  {test.status === "Completed" && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {test.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{test.subject}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{test.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>{test.questions} Qs</span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    router.push(`/dashboard/practice/${test.topicId}`)
                  }
                  className={`w-full py-2.5 rounded-lg font-medium transition-colors mt-2 ${
                    test.status === "Completed"
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20"
                  }`}
                  disabled={test.status === "Completed"}
                >
                  {test.status === "Completed" ? "View Results" : "Start Test"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
