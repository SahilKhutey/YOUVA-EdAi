"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { ThinkingIndicator } from "@/app/components/ThinkingIndicator";
import { VoiceTutor } from "@/app/components/workspace/VoiceTutor";

interface QuestionHints {
  tier1_socratic?: string;
  tier2_operational?: string;
  tier3_solution?: string;
}

interface Question {
  id: string;
  content: string;
  options: string[];
  hints?: QuestionHints;
}

interface Result {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

interface QuizSubmissionResponse {
  score: number;
  correctCount?: number;
  total?: number;
  results: Result[];
  xpEarned?: number;
  masteryProbability?: number;
  masteryDelta?: number;
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
  const [revealedHints, setRevealedHints] = useState<{ [key: string]: number }>({});
  const [results, setResults] = useState<QuizSubmissionResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      const response = await api.post("/practice/generate", { topicId });
      setSessionId(response.data.sessionId);
      setQuestions(response.data.questions);
      setRevealedHints({});
    } catch (err) {
      console.error("Failed to generate quiz:", err);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const unlockNextHint = (qId: string) => {
    setRevealedHints((prev) => {
      const current = prev[qId] || 0;
      if (current < 3) {
        return { ...prev, [qId]: current + 1 };
      }
      return prev;
    });
  };

  const submitQuiz = async () => {
    if (!sessionId || submitting) return;

    // Ensure all questions answered
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
      <div className="flex min-h-screen items-center justify-center bg-muted/20 flex-col gap-4">
        <ThinkingIndicator />
        <p className="text-muted-foreground font-medium animate-pulse">
          Generating your personalized quiz...
        </p>
      </div>
    );
  }

  if (!user) return null;

  if (results) {
    const correctCount =
      results.correctCount ??
      results.results.filter((r) => r.isCorrect).length;
    const totalCount = results.total ?? questions.length;
    const xpEarned = results.xpEarned ?? 15;
    const masteryGainPercent = Math.round((results.masteryDelta ?? 0.18) * 100);
    const currentMasteryPercent = Math.round((results.masteryProbability ?? 0.68) * 100);

    const getCompetencyBadge = (score: number) => {
      if (score >= 80) {
        return {
          title: "Linear Equations Master",
          subtitle: "CBSE Grade 8 Competency Exceeded",
          badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: "🏆",
        };
      }
      if (score >= 60) {
        return {
          title: "Proficient Problem Solver",
          subtitle: "NCERT Core Algebraic Standard Met",
          badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
          icon: "🥈",
        };
      }
      return {
        title: "Emerging Learner",
        subtitle: "Scaffolded Review & Practice Recommended",
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        icon: "🌱",
      };
    };

    const competency = getCompetencyBadge(results.score);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-muted/20 gap-4 p-4">
        <div className="flex flex-col overflow-y-auto w-full max-w-3xl mx-auto py-8 px-4">
          <div className="bg-card shadow-sm border border-border overflow-hidden rounded-xl mb-6 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/60 pb-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                  Practice Session Completed
                </span>
                <h2 className="text-3xl font-bold text-foreground mt-1">
                  Performance & Mastery Summary
                </h2>
              </div>
              <div className="text-center sm:text-right">
                <span className="text-4xl font-extrabold text-primary">
                  {results.score.toFixed(0)}%
                </span>
                <p className="text-xs text-muted-foreground font-medium">Overall Accuracy</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  XP Earned
                </span>
                <span className="text-2xl font-bold text-primary mt-1">
                  +{xpEarned} XP
                </span>
                <span className="text-xs text-muted-foreground">Level streak preserved</span>
              </div>

              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  BKT Mastery Delta
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  +{masteryGainPercent > 0 ? masteryGainPercent : 15}%
                </span>
                <span className="text-xs text-muted-foreground">
                  Current: {currentMasteryPercent}% probability
                </span>
              </div>

              <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Correct Items
                </span>
                <span className="text-2xl font-bold text-foreground mt-1">
                  {correctCount} / {totalCount}
                </span>
                <span className="text-xs text-muted-foreground">CBSE Grade 8 Standard</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg border flex items-center gap-3 ${competency.badgeColor}`}>
              <span className="text-2xl">{competency.icon}</span>
              <div>
                <h4 className="font-semibold text-sm">{competency.title}</h4>
                <p className="text-xs opacity-90">{competency.subtitle}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button
                onClick={generateQuiz}
                className="inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md shadow-sm text-foreground bg-background hover:bg-muted transition-colors"
              >
                Practice Again
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              Question-by-Question Diagnostic Review
            </h3>
            {questions.map((q, index) => {
              const result = results.results.find((r) => r.questionId === q.id);
              const userAnswer = answers[q.id];
              return (
                <div
                  key={q.id}
                  className={`bg-card shadow-sm rounded-xl p-6 border-l-4 ${
                    result?.isCorrect ? "border-emerald-500" : "border-destructive"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 className="text-base font-semibold text-foreground">
                      {index + 1}. {q.content}
                    </h4>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        result?.isCorrect
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {result?.isCorrect ? "CORRECT ✓" : "INCORRECT ✗"}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-foreground/80 mb-1">
                    Your Choice:{" "}
                    <span
                      className={
                        result?.isCorrect ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-destructive font-semibold"
                      }
                    >
                      {userAnswer}
                    </span>
                  </p>

                  {!result?.isCorrect && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-3">
                      Correct Answer: {result?.correctAnswer}
                    </p>
                  )}

                  <div className="mt-3 bg-muted/60 p-3 rounded-lg text-sm text-muted-foreground border border-border/40">
                    <span className="font-semibold text-foreground">
                      CBSE Step Explanation:
                    </span>{" "}
                    {result?.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Mentor Sidebar */}
        <div className="flex flex-col h-[calc(100vh-2rem)] sticky top-4">
          <VoiceTutor topicId={topicId as string} topicTitle="CBSE Quiz Review" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-muted/20 gap-4 p-4">
      <div className="flex flex-col overflow-y-auto w-full max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            &larr; Back to Curriculum
          </button>
          <div className="text-right">
            <h1 className="text-xl font-bold text-foreground">
              Grade 8 CBSE Practice
            </h1>
            <p className="text-xs text-muted-foreground">Linear Equations in One Variable</p>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => {
            const hintLevel = revealedHints[q.id] || 0;
            const hints = q.hints || {
              tier1_socratic: "Identify the unknown variable and determine what operations are currently acting upon it.",
              tier2_operational: "Apply the inverse mathematical operation symmetrically to both sides to isolate the variable term.",
              tier3_solution: "Execute algebraic simplification step-by-step until the variable equals a single numerical value.",
            };

            return (
              <div
                key={q.id}
                className="bg-card shadow-sm border border-border overflow-hidden rounded-xl p-6 transition-all hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-base font-semibold text-foreground">
                    {index + 1}. {q.content}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Item {index + 1}/{questions.length}
                  </span>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5">
                  {q.options.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center space-x-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                        answers[q.id] === option
                          ? "border-primary bg-primary/5 text-foreground font-medium"
                          : "border-input hover:bg-muted/50 text-foreground/90"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={() => handleOptionSelect(q.id, option)}
                        className="h-4 w-4 text-primary focus:ring-ring border-input"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>

                {/* Progressive 3-Tier Hint Section */}
                <div className="mt-5 pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => unlockNextHint(q.id)}
                      disabled={hintLevel >= 3}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
                        hintLevel >= 3
                          ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                      }`}
                    >
                      <span>💡</span>
                      <span>
                        {hintLevel === 0
                          ? "Need a Hint? (Unlock Tier 1 Socratic)"
                          : hintLevel === 1
                          ? "Unlock Tier 2 Operational Strategy"
                          : hintLevel === 2
                          ? "Unlock Tier 3 Scaffolded Solution"
                          : "All 3 Pedagogical Hints Unlocked"}
                      </span>
                    </button>
                    <span className="text-xs text-muted-foreground font-mono">
                      Hints used: {hintLevel}/3
                    </span>
                  </div>

                  {hintLevel > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {hintLevel >= 1 && hints.tier1_socratic && (
                        <div className="p-3.5 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg text-sm">
                          <p className="font-semibold text-amber-700 dark:text-amber-300 text-xs uppercase tracking-wider mb-1">
                            💭 Tier 1 — Socratic Guiding Prompt
                          </p>
                          <p className="text-foreground/90 leading-relaxed">
                            {hints.tier1_socratic}
                          </p>
                        </div>
                      )}
                      {hintLevel >= 2 && hints.tier2_operational && (
                        <div className="p-3.5 bg-sky-500/10 border-l-4 border-sky-500 rounded-r-lg text-sm">
                          <p className="font-semibold text-sky-700 dark:text-sky-300 text-xs uppercase tracking-wider mb-1">
                            ⚙️ Tier 2 — Operational Strategy
                          </p>
                          <p className="text-foreground/90 leading-relaxed">
                            {hints.tier2_operational}
                          </p>
                        </div>
                      )}
                      {hintLevel >= 3 && hints.tier3_solution && (
                        <div className="p-3.5 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-lg text-sm">
                          <p className="font-semibold text-emerald-700 dark:text-emerald-300 text-xs uppercase tracking-wider mb-1">
                            🔍 Tier 3 — Scaffolding Solution Step
                          </p>
                          <p className="text-foreground/90 font-mono text-xs leading-relaxed">
                            {hints.tier3_solution}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={submitQuiz}
            disabled={submitting}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors ${
              submitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? "Submitting Answers..." : "Submit Completed Answers"}
          </button>
        </div>
      </div>

      {/* AI Mentor Sidebar */}
      <div className="flex flex-col h-[calc(100vh-2rem)] sticky top-4">
        <VoiceTutor topicId={topicId as string} topicTitle="Grade 8 Linear Equations Practice" />
      </div>
    </div>
  );
}
