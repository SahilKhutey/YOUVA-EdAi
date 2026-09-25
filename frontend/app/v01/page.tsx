"use client";

import React, { useState, useEffect } from "react";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface LearningItem {
  id: string;
  conceptId: string;
  question: string;
  explanation: string;
  difficulty: Difficulty;
}

interface AttemptResult {
  correct: boolean;
  explanation: string;
  previousDifficulty: Difficulty;
  newDifficulty: Difficulty;
  overrideApplied?: string;
  nextItem: LearningItem;
}

export default function V01StudentPage() {
  // Real student enrollment state
  const [studentId, setStudentId] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [guardianName, setGuardianName] = useState<string>("");
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(false);

  // Session state
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<LearningItem | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>("EASY");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [score, setScore] = useState<number>(0);

  // Feedback state
  const [feedback, setFeedback] = useState<{
    submitted: boolean;
    correct: boolean;
    explanation: string;
    overrideApplied?: string;
    nextItem?: LearningItem;
    newDifficulty?: Difficulty;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const handleEnrollAndStart = async () => {
    if (!studentName.trim() || !guardianName.trim()) {
      setErrorMsg("Student full name and guardian full name are both required.");
      return;
    }
    if (!consentConfirmed) {
      setErrorMsg("Guardian consent confirmation is strictly required by the Pilot Protocol.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Authentically enroll the learner with documented guardian consent
      const enrollRes = await fetch(`${API_BASE}/v01/student/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: studentName.trim(),
          guardianName: guardianName.trim(),
          consentConfirmed: true,
        }),
      });

      if (!enrollRes.ok) {
        throw new Error(`Enrollment failed: ${enrollRes.statusText}`);
      }

      const enrolledStudent = await enrollRes.json();
      setStudentId(enrolledStudent.id);

      // 2. Start practice session for this enrolled student
      const sessionRes = await fetch(`${API_BASE}/v01/student/${enrolledStudent.id}/session/start`);
      if (!sessionRes.ok) {
        throw new Error(`Failed to start session: ${sessionRes.statusText}`);
      }
      const data = await sessionRes.json();
      setCurrentItem(data.firstItem);
      setCurrentDifficulty(data.currentDifficulty);
      setSessionStarted(true);
      setSessionFinished(false);
      setQuestionCount(1);
      setScore(0);
      setFeedback(null);
      setUserAnswer("");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not connect to the pilot server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || !currentItem) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/v01/student/${studentId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: currentItem.id,
          answer: userAnswer.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Submission failed: ${res.statusText}`);
      }

      const result: AttemptResult = await res.json();
      if (result.correct) {
        setScore((prev) => prev + 1);
      }

      setFeedback({
        submitted: true,
        correct: result.correct,
        explanation: result.explanation,
        overrideApplied: result.overrideApplied,
        nextItem: result.nextItem,
        newDifficulty: result.newDifficulty,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!feedback?.nextItem) return;

    // Check if session reaches target pilot count (e.g. 6 questions)
    if (questionCount >= 6) {
      setSessionFinished(true);
      return;
    }

    setCurrentItem(feedback.nextItem);
    if (feedback.newDifficulty) {
      setCurrentDifficulty(feedback.newDifficulty);
    }
    setQuestionCount((prev) => prev + 1);
    setFeedback(null);
    setUserAnswer("");
  };

  return (
    <div style={{ maxWidth: "680px", margin: "40px auto", padding: "24px", fontFamily: "sans-serif", color: "#1f2937" }}>
      {/* Pilot Header */}
      <header style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "700", color: "#111827" }}>
              YOUVA EdAI v0.1 — Middle School Math
            </h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              Concept: <strong>One-Step Linear Equations</strong>
            </p>
          </div>
          <a
            href="/v01/teacher"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 12px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              borderRadius: "6px",
              fontSize: "13px",
              textDecoration: "none",
              border: "1px solid #d1d5db",
            }}
          >
            Open Teacher View ↗
          </a>
        </div>
      </header>

      {errorMsg && (
        <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
          {errorMsg}
        </div>
      )}

      {/* Screen 1: Start & Consent Confirmation */}
      {!sessionStarted && !sessionFinished && (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "18px", marginTop: 0, marginBottom: "12px" }}>Welcome to Today&apos;s Math Practice</h2>
          <p style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.5", marginBottom: "20px" }}>
            You will solve a few short one-step equations. The questions will adjust based on how you do, and your teacher is reviewing your progress live.
          </p>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
              Student Full Name:
            </label>
            <input
              type="text"
              placeholder="e.g. Student Full Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "15px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontWeight: "600", fontSize: "14px", marginBottom: "6px" }}>
              Parent / Guardian Full Name:
            </label>
            <input
              type="text"
              placeholder="e.g. Guardian Full Name"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "15px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ backgroundColor: "#f9fafb", padding: "14px", borderRadius: "6px", border: "1px solid #e5e7eb", marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", color: "#4b5563", marginBottom: "8px" }}>
              <strong>Guardian Consent Confirmation (DPDP Pilot Protocol):</strong>
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#374151", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                style={{ marginTop: "3px" }}
              />
              <span>
                I confirm that documented guardian consent has been recorded for <strong>{studentName || "this learner"}</strong> (Guardian: {guardianName || "Guardian"}). Minimal session data recorded solely for pilot learning.
              </span>
            </label>
          </div>

          <button
            onClick={handleEnrollAndStart}
            disabled={loading || !studentName.trim() || !guardianName.trim() || !consentConfirmed}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: (!loading && studentName.trim() && guardianName.trim() && consentConfirmed) ? "#2563eb" : "#9ca3af",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: (!loading && studentName.trim() && guardianName.trim() && consentConfirmed) ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Enrolling & Starting..." : "Enroll & Start Math Practice"}
          </button>
        </div>
      )}

      {/* Screen 2: Active Question & Answer */}
      {sessionStarted && !sessionFinished && currentItem && (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          {/* Progress Banner */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", fontSize: "14px", color: "#6b7280" }}>
            <span>Question {questionCount} of 6</span>
            <span style={{
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: "600",
              fontSize: "12px",
              backgroundColor: currentDifficulty === "EASY" ? "#dcfce7" : currentDifficulty === "MEDIUM" ? "#fef3c7" : "#fee2e2",
              color: currentDifficulty === "EASY" ? "#166534" : currentDifficulty === "MEDIUM" ? "#92400e" : "#991b1b",
            }}>
              Level: {currentDifficulty}
            </span>
          </div>

          {/* Teacher Override Active Notice */}
          {feedback?.overrideApplied === "TEACHER_NEEDS_HELP" && (
            <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "10px", borderRadius: "6px", fontSize: "14px", marginBottom: "16px" }}>
              💡 <strong>Teacher Note:</strong> Practicing a foundational question recommended by your teacher.
            </div>
          )}

          {/* Question Display */}
          <div style={{ backgroundColor: "#f9fafb", padding: "24px", borderRadius: "8px", textAlign: "center", margin: "16px 0 24px 0", border: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: "24px", margin: 0, fontWeight: "700", color: "#111827", letterSpacing: "0.5px" }}>
              {currentItem.question}
            </h2>
          </div>

          {/* Answer Form */}
          {!feedback?.submitted ? (
            <form onSubmit={submitAnswer}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>
                  Your Answer:
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter number (e.g. 6 or x=6)"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "2px solid #d1d5db",
                    fontSize: "18px",
                    fontWeight: "600",
                    outline: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !userAnswer.trim()}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: userAnswer.trim() ? "#2563eb" : "#9ca3af",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: userAnswer.trim() ? "pointer" : "not-allowed",
                }}
              >
                {loading ? "Checking..." : "Submit Answer"}
              </button>
            </form>
          ) : (
            <div>
              {/* Feedback State */}
              <div style={{
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "20px",
                backgroundColor: feedback.correct ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${feedback.correct ? "#bbf7d0" : "#fecaca"}`,
                color: feedback.correct ? "#15803d" : "#b91c1c",
              }}>
                <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>
                  {feedback.correct ? "✓ Correct!" : "✗ Not quite."}
                </div>
                <div style={{ fontSize: "15px", color: "#374151", marginTop: "8px", lineHeight: "1.4" }}>
                  <strong>Explanation:</strong> {feedback.explanation}
                </div>
              </div>

              <button
                onClick={handleNextQuestion}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                {questionCount >= 6 ? "Finish Session" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Screen 3: Session Complete */}
      {sessionFinished && (
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "28px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
          <h2 style={{ fontSize: "22px", margin: "0 0 8px 0", color: "#111827" }}>Session Completed!</h2>
          <p style={{ color: "#4b5563", fontSize: "16px", marginBottom: "20px" }}>
            Great effort today, {studentName}.
          </p>

          <div style={{ backgroundColor: "#f3f4f6", padding: "16px", borderRadius: "8px", display: "inline-block", minWidth: "200px", marginBottom: "24px" }}>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Questions Correct</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#111827" }}>
              {score} / {questionCount}
            </div>
          </div>

          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
            Your teacher has received your session summary and can review your responses.
          </p>

          <button
            onClick={() => {
              setSessionStarted(false);
              setSessionFinished(false);
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Practice Again
          </button>
        </div>
      )}
    </div>
  );
}
