"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Sliders,
  CheckCircle2,
  PieChart,
  Settings2,
  Sparkles,
  Save,
  Info,
} from "lucide-react";

export function TeacherAutonomyTerminal() {
  // Teacher configuration state
  const [minDifficulty, setMinDifficulty] = useState(0.2);
  const [maxDifficulty, setMaxDifficulty] = useState(0.8);
  const [maxDailyInterventions, setMaxDailyInterventions] = useState(5);
  const [autoSpacedReview, setAutoSpacedReview] = useState(true);
  const [assistanceLevel, setAssistanceLevel] = useState<"RECOMMEND_ONLY" | "BOUNDED_EXECUTION">(
    "BOUNDED_EXECUTION"
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Override analytics state (Clause N15.30)
  const stats = {
    totalRecommendations: 24,
    accepted: 17,
    modified: 5,
    rejected: 2,
    pendingReview: 3,
    autonomyLevel: "BOUNDED_EXECUTION",
    policyVersion: "pol-teacher-v3.2",
  };

  const overrideRate = Number(
    (((stats.modified + stats.rejected) / stats.totalRecommendations) * 100).toFixed(1)
  );

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Teacher Autonomy &amp; Override Analytics</h2>
            <p className="text-sm font-medium text-slate-500">
              Clause N15.29 Teacher-Governed Autonomy • Override Analytics • Pedagogical Safety Bounds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1.5 text-xs font-black text-teal-800">
          <Sparkles className="h-4 w-4 text-teal-600" />
          <span>Active Policy: {stats.policyVersion}</span>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Teacher autonomy parameters saved successfully. All agent bounds updated.
        </div>
      )}

      {/* Two Columns: Config on Left, Analytics on Right */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Teacher Controls (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 p-5 space-y-5 bg-slate-50/50">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Settings2 className="h-5 w-5 text-teal-700" />
            <h3 className="font-bold text-slate-900 text-sm">Classroom AI Assistance Boundaries</h3>
          </div>

          {/* Assistance Level Mode */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Autonomy Operating Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAssistanceLevel("RECOMMEND_ONLY")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  assistanceLevel === "RECOMMEND_ONLY"
                    ? "border-teal-600 bg-teal-50/50 text-teal-900 ring-2 ring-teal-500"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <div className="font-bold text-xs">Recommend Only (A2)</div>
                <div className="text-2xs text-slate-500 mt-1">
                  AI generates suggestions; every action requires human teacher click.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAssistanceLevel("BOUNDED_EXECUTION")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  assistanceLevel === "BOUNDED_EXECUTION"
                    ? "border-teal-600 bg-teal-50/50 text-teal-900 ring-2 ring-teal-500"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <div className="font-bold text-xs">Bounded Execution (A3)</div>
                <div className="text-2xs text-slate-500 mt-1">
                  Pre-authorized low-risk actions (e.g. revision queues) execute automatically.
                </div>
              </button>
            </div>
          </div>

          {/* Difficulty Range Sliders */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Allowed Difficulty Adaptation Range
              </label>
              <span className="font-mono text-xs font-bold text-teal-700">
                {minDifficulty.toFixed(2)} - {maxDifficulty.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <span className="text-2xs text-slate-500">Min Difficulty Bound: {minDifficulty}</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={minDifficulty}
                  onChange={(e) => setMinDifficulty(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
              <div>
                <span className="text-2xs text-slate-500">Max Difficulty Bound: {maxDifficulty}</span>
                <input
                  type="range"
                  min="0.6"
                  max="1.0"
                  step="0.05"
                  value={maxDifficulty}
                  onChange={(e) => setMaxDifficulty(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Max Interventions & Spaced Review Toggle */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Max Auto-Interventions / Day
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxDailyInterventions}
                onChange={(e) => setMaxDailyInterventions(parseInt(e.target.value) || 5)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={autoSpacedReview}
                  onChange={(e) => setAutoSpacedReview(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">Auto-Queue Spaced Reviews</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white shadow hover:bg-teal-800 transition-all"
            >
              <Save className="h-4 w-4" />
              Save Classroom AI Bounds
            </button>
          </div>
        </div>

        {/* Right Column: Override Analytics (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 p-5 space-y-4 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieChart className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Teacher Override Analytics (Clause N15.30)</h3>
          </div>

          {/* Breakdown Box */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 font-mono text-xs space-y-2.5">
            <div className="flex justify-between border-b border-slate-200 pb-1.5 font-bold text-slate-700">
              <span>METRIC</span>
              <span>COUNT</span>
            </div>
            <div className="flex justify-between text-slate-800">
              <span>Total Recommendations:</span>
              <span className="font-bold">{stats.totalRecommendations}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Accepted by Educator:</span>
              <span className="font-bold">{stats.accepted}</span>
            </div>
            <div className="flex justify-between text-amber-700 font-semibold">
              <span>Modified by Educator:</span>
              <span className="font-bold">{stats.modified}</span>
            </div>
            <div className="flex justify-between text-red-700 font-semibold">
              <span>Rejected by Educator:</span>
              <span className="font-bold">{stats.rejected}</span>
            </div>
            <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
              <span>Pending Review:</span>
              <span>{stats.pendingReview}</span>
            </div>
          </div>

          {/* Override Rate Gauge */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center">
            <div className="text-2xs uppercase font-bold text-indigo-600 tracking-wider">
              Educator Override Rate
            </div>
            <div className="text-3xl font-black text-indigo-900 my-1 font-mono">
              {overrideRate}%
            </div>
            <p className="text-2xs text-slate-600 flex items-center justify-center gap-1 mt-1">
              <Info className="h-3.5 w-3.5 text-indigo-500" />
              Healthy oversight legitimately involves frequent educator correction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
