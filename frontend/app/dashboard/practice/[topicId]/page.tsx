"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { ThinkingIndicator } from "@/app/components/ThinkingIndicator";
import { VoiceTutor } from "@/app/components/workspace/VoiceTutor";
import { aiMentorEnabled, practiceLoadMessage, practiceSubmitMessage } from "@/lib/practice-errors.mjs";
import {
  Award,
  Zap,
  RotateCcw,
  BookOpen,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";

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

interface QuizSubmissionResult {
  score: number;
  correctCount?: number;
  total?: number;
  unanswered?: number;
  xpEarned?: number;
  results: Result[];
}

export default function PracticePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { topicId } = params;

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [results, setResults] = useState<QuizSubmissionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // The AI mentor (typed and spoken chat with an AI) is off unless NEXT_PUBLIC_ENABLE_AI_MENTOR=true.
  const aiOn = aiMentorEnabled(process.env.NEXT_PUBLIC_ENABLE_AI_MENTOR);
  const gridCols = aiOn ? "lg:grid-cols-2" : "lg:grid-cols-1";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && topicId) {
      generateQuiz();
    }
  }, [user, topicId]);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      setResults(null);
      setAnswers({});
      const response = await api.post("/practice/generate", { topicId });
      setSessionId(response.data.sessionId);
      setQuestions(response.data.questions);
    } catch (err) {
      console.error("Failed to generate quiz:", err);
      setLoadError(practiceLoadMessage((err as any)?.response?.status));
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const submitQuiz = async () => {
    if (!sessionId || submitting) return;

    // Ensure all questions answered
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
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
      setSubmitError(practiceSubmitMessage((err as any)?.response?.status));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 flex-col gap-4">
        <ThinkingIndicator />
        <p className="text-muted-foreground font-medium animate-pulse">
          Getting your questions...
        </p>
      </div>
    );
  }

  if (!user) return null;

  if (loadError && questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-foreground" role="alert">{loadError}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            &larr; Back
          </button>
        </div>
      </div>
    );
  }

  if (results) {
    const correctCount =
      results.correctCount ?? results.results.filter((r) => r.isCorrect).length;
    const totalCount = results.total ?? results.results.length;

    return (
      <div className={`grid grid-cols-1 ${gridCols} min-h-screen bg-muted/20 gap-4 p-4`}>
        <div className="flex flex-col overflow-y-auto w-full max-w-3xl mx-auto py-8 px-4">
          <div className="bg-card shadow-sm border border-border overflow-hidden rounded-2xl mb-6 p-6 sm:p-8 text-center animate-in fade-in zoom-in-95">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500 mb-3">
              <Award className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Quiz Completed!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Here is how you performed in this adaptive session
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6 max-w-md mx-auto">
              <div className="bg-muted/40 border border-border rounded-xl p-3">
                <span className="text-xs text-muted-foreground font-medium">Final Score</span>
                <p className="text-2xl font-bold text-primary mt-0.5">
                  {results.score.toFixed(0)}%
                </p>
              </div>
              <div className="bg-muted/40 border border-border rounded-xl p-3">
                <span className="text-xs text-muted-foreground font-medium">Accuracy</span>
                <p className="text-2xl font-bold text-foreground mt-0.5">
                  {correctCount} / {totalCount}
                </p>
              </div>
              <div className="bg-muted/40 border border-border rounded-xl p-3 col-span-2 sm:col-span-1 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">XP Earned</span>
                <p className="text-2xl font-bold text-amber-500 flex items-center gap-1 mt-0.5">
                  <Zap className="h-5 w-5 fill-amber-500" />
                  +{results.xpEarned ?? 10}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={generateQuiz}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Practice Again
              </button>
              <button
                onClick={() => router.push("/dashboard/subjects")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-card text-foreground hover:bg-muted transition-all"
              >
                <BookOpen className="h-4 w-4" />
                Browse Subjects
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Question Review
            </h3>
            {questions.map((q, index) => {
              const result = results.results.find((r) => r.questionId === q.id);
              const userAnswer = answers[q.id];
              const isCorrect = result?.isCorrect;
              return (
                <div
                  key={q.id}
                  className={`bg-card shadow-sm rounded-2xl p-6 border transition-all ${
                    isCorrect
                      ? "border-emerald-500/30 bg-emerald-500/[0.02]"
                      : "border-destructive/30 bg-destructive/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-medium text-foreground mb-3">
                        {index + 1}. {q.content}
                      </h4>
                      <p
                        className={`text-sm mb-1.5 font-medium ${
                          isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                        }`}
                      >
                        Your Answer: {userAnswer}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                          Correct Answer: {result?.correctAnswer}
                        </p>
                      )}
                      <div className="mt-3 bg-muted/50 p-3.5 rounded-xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Explanation:</strong>{" "}
                        {result?.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Mentor Sidebar (off by default) */}
        {aiOn && (
          <div className="flex flex-col h-[calc(100vh-2rem)] sticky top-4">
            <VoiceTutor topicId={topicId as string} topicTitle="Quiz Review" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 ${gridCols} min-h-screen bg-muted/20 gap-4 p-4`}>
      <div className="flex flex-col overflow-y-auto w-full max-w-3xl mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold text-foreground">
            Practice Session
          </h1>
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

        {submitError && (
          <p className="mt-6 text-sm text-destructive" role="alert">{submitError}</p>
        )}
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

      {/* AI Mentor Sidebar (off by default) */}
      {aiOn && (
        <div className="flex flex-col h-[calc(100vh-2rem)] sticky top-4">
          <VoiceTutor topicId={topicId as string} topicTitle="Practice Session" />
        </div>
      )}
    </div>
  );
}
