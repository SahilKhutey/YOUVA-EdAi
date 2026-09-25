"use client";

import React, { useState, useEffect } from "react";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface TeacherOverride {
  id: string;
  teacherId: string;
  studentId: string;
  type: "NEEDS_HELP" | "NEXT_ITEM";
  targetDifficulty?: Difficulty;
  notes?: string;
  status: "ACTIVE" | "APPLIED" | "DISMISSED";
  createdAt: string;
}

interface StudentRow {
  studentId: string;
  displayName: string;
  conceptId: string;
  conceptName: string;
  attemptsCount: number;
  correctCount: number;
  accuracyRate: number;
  currentDifficulty: Difficulty;
  status: "ON_TRACK" | "NEEDS_HELP";
  activeOverride?: TeacherOverride;
  lastAttemptAt?: string;
}

export default function V01TeacherPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const fetchOverview = async () => {
    try {
      const res = await fetch(`${API_BASE}/v01/teacher/overview`, {
        headers: { "x-teacher-id": "teacher-pilot" },
      });
      if (!res.ok) {
        throw new Error(`Failed to load teacher overview: ${res.statusText}`);
      }
      const data: StudentRow[] = await res.json();
      setStudents(data);
      setLastRefreshed(new Date().toLocaleTimeString());
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to pilot server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // Auto-refresh every 3 seconds during active classroom pilot
    const interval = setInterval(fetchOverview, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerNeedsHelp = async (studentId: string) => {
    setActionLoading(studentId);
    try {
      const res = await fetch(`${API_BASE}/v01/teacher/override`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-teacher-id": "teacher-pilot",
          "x-role": "TEACHER",
        },
        body: JSON.stringify({
          teacherId: "teacher-pilot",
          studentId,
          type: "NEEDS_HELP",
          notes: "Teacher observed conceptual difficulty. Forcing foundational remediation.",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to set override");
      }

      await fetchOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "Could not apply override.");
    } finally {
      setActionLoading(null);
    }
  };

  const clearOverride = async (studentId: string) => {
    setActionLoading(studentId);
    try {
      const res = await fetch(`${API_BASE}/v01/teacher/override/${studentId}`, {
        method: "DELETE",
        headers: {
          "x-teacher-id": "teacher-pilot",
          "x-role": "TEACHER",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to clear override");
      }

      await fetchOverview();
    } catch (err: any) {
      setErrorMsg(err.message || "Could not clear override.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: "920px", margin: "40px auto", padding: "24px", fontFamily: "sans-serif", color: "#1f2937" }}>
      {/* Header */}
      <header style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: "700", color: "#111827" }}>
              Teacher Oversight View — YOUVA EdAI v0.1
            </h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              Live Concept Oversight: <strong>One-Step Linear Equations (Grade 6–8)</strong>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              Live syncing • Refreshed: {lastRefreshed || "loading..."}
            </span>
          </div>
        </div>
      </header>

      {errorMsg && (
        <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
          {errorMsg}
        </div>
      )}

      {/* Critical Experiment Note */}
      <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "14px 18px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", color: "#1e40af", lineHeight: "1.5" }}>
        <strong>v0.1 Teacher Experiment:</strong> When you click <code>[ NEEDS HELP ]</code>, an immutable override is dispatched. The student&apos;s adaptive engine immediately halts difficulty advancement and forces a foundational remediation item.
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
              <th style={{ padding: "12px 16px", fontWeight: "600" }}>Student</th>
              <th style={{ padding: "12px 16px", fontWeight: "600" }}>Concept</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "center" }}>Attempts</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "center" }}>Correct</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "center" }}>Current Level</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "center" }}>Status</th>
              <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "center" }}>Teacher Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
                  Loading student roster...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>
                  No students currently practicing. Open the student view to begin.
                </td>
              </tr>
            ) : (
              students.map((row) => {
                const isOverridden = row.activeOverride && row.activeOverride.status === "ACTIVE";
                return (
                  <tr key={row.studentId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "14px 16px", fontWeight: "600", color: "#111827" }}>
                      {row.displayName}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#4b5563" }}>
                      {row.conceptName}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600" }}>
                      {row.attemptsCount}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600" }}>
                      {row.correctCount}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: row.currentDifficulty === "EASY" ? "#dcfce7" : row.currentDifficulty === "MEDIUM" ? "#fef3c7" : "#fee2e2",
                        color: row.currentDifficulty === "EASY" ? "#166534" : row.currentDifficulty === "MEDIUM" ? "#92400e" : "#991b1b",
                      }}>
                        {row.currentDifficulty}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: row.status === "ON_TRACK" ? "#dcfce7" : "#fee2e2",
                        color: row.status === "ON_TRACK" ? "#166534" : "#991b1b",
                      }}>
                        {row.status === "ON_TRACK" ? "On track" : "Needs help"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      {isOverridden ? (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <span style={{ padding: "4px 8px", backgroundColor: "#fef3c7", color: "#92400e", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                            Override Active
                          </span>
                          <button
                            onClick={() => clearOverride(row.studentId)}
                            disabled={actionLoading === row.studentId}
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#f3f4f6",
                              color: "#374151",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => triggerNeedsHelp(row.studentId)}
                          disabled={actionLoading === row.studentId}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#f97316",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          {actionLoading === row.studentId ? "Setting..." : "NEEDS HELP"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <a
          href="/v01"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          ← Open Student Practice View in New Tab
        </a>
      </div>
    </div>
  );
}
