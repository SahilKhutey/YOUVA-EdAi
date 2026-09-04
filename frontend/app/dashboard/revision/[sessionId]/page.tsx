"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";

interface Question {
  id: string;
  content: string;
  options: string[];
}

interface Result {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

export default function RevisionSessionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { sessionId } = params;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [results, setResults] = useState<{
    score: number;
    results: Result[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && sessionId) {
      const stored = sessionStorage.getItem(`revision_session_${sessionId}`);
      if (stored) {
        setQuestions(JSON.parse(stored));
        setLoading(false);
      } else {
        // If direct access or refresh wiped storage (unlikely for sessionStorage in same tab), redirect
        // Ideally backend would support resumption, but for MVP this is fine.
        console.warn("No session data found in storage");
        // Optionally redirect: router.push('/dashboard/revision');
        // But keeping it here might allow retry if just slow? No, logic is synchronous.
        setLoading(false);
      }
    }
  }, [user, sessionId]);

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const submitQuiz = async () => {
    if (!sessionId || submitting) return;

    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: qId,
      answer: ans,
    }));

    try {
      const response = await api.post("/practice/submit", {
        sessionId,
        answers: formattedAnswers,
      });
      setResults(response.data);
    } catch (err) {
      console.error("Failed to submit quiz:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="text-xl font-medium text-muted-foreground">
          Loading your revision session...
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (results) {
    return (
      <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card shadow-sm border border-border overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 text-center">
              <h2 className="text-3xl font-bold text-foreground">
                Revision Complete!
              </h2>
              <p className="mt-2 text-xl text-primary">
                Score: {results.score.toFixed(0)}%
              </p>
              <button
                onClick={() => router.push("/dashboard/revision")}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
              >
                Back to Revision Hub
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q, index) => {
              const result = results.results.find((r) => r.questionId === q.id);
              const userAnswer = answers[q.id];
              return (
                <div
                  key={q.id}
                  className={`bg-card shadow-sm sm:rounded-lg p-6 border-l-4 ${result?.isCorrect ? "border-secondary" : "border-destructive"}`}
                >
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    {index + 1}. {q.content}
                  </h3>
                  <p
                    className={`text-sm mb-2 font-medium ${result?.isCorrect ? "text-secondary" : "text-destructive"}`}
                  >
                    Your Answer: {userAnswer} {result?.isCorrect ? "✓" : "✗"}
                  </p>
                  {!result?.isCorrect && (
                    <p className="text-sm text-secondary font-medium mb-2">
                      Correct Answer: {result?.correctAnswer}
                    </p>
                  )}
                  <div className="mt-2 bg-muted p-3 rounded text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Explanation:
                    </span>{" "}
                    {result?.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Exit
          </button>
          <h1 className="text-2xl font-bold text-foreground">Daily Revision</h1>
          <div className="w-10"></div>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="bg-card shadow-sm border border-border overflow-hidden sm:rounded-lg p-6"
            >
              <h3 className="text-lg font-medium text-foreground mb-4">
                {index + 1}. {q.content}
              </h3>
              <div className="space-y-2">
                {q.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-3 p-3 rounded-md border border-input hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={() => handleOptionSelect(q.id, option)}
                      className="h-4 w-4 text-primary focus:ring-ring border-input"
                    />
                    <span className="text-foreground">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={submitQuiz}
            disabled={submitting}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {submitting ? "Submitting..." : "Submit Answers"}
          </button>
        </div>
      </div>
    </div>
  );
}
