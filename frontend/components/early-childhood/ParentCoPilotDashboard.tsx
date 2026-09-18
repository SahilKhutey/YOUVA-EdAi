"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Clock,
  HeartHandshake,
  Lock,
  Unlock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Users,
  Smartphone,
} from "lucide-react";

export function ParentCoPilotDashboard() {
  const [selectedChild, setSelectedChild] = useState("Aarav (Age 5 - Pre-School)");
  const [deviceMode, setDeviceMode] = useState<"CHILD" | "PARENT">("CHILD");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const mockChildData = {
    Aarav: {
      name: "Aarav",
      ageBand: "PRESCHOOL (3–7)",
      sessionMinutes: 12,
      maxMinutes: 15,
      screenStatus: "HEALTHY" as const,
      progressSummary:
        "Aarav has shown wonderful enthusiasm matching beginning letter sounds in the Phonics Safari! He loves exploring animal characters and sharing ideas through voice.",
      homeSuggestions: [
        "Play a fun 3-minute rhyming game during dinner: 'What rhymes with Cat?'",
        "Celebrate his curiosity when he asks why things work!",
        "Encourage tactile play: have him count 3 favorite toys before bedtime.",
      ],
    },
  };

  const currentChild = mockChildData.Aarav;

  const handleUnlockParentMode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "1234") {
      setDeviceMode("PARENT");
      setIsPinModalOpen(false);
      setPinInput("");
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleReturnToChildMode = () => {
    setDeviceMode("CHILD");
  };

  return (
    <div className="rounded-3xl border border-teal-200 bg-gradient-to-b from-teal-50/40 via-white to-sky-50/30 p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Parent Co-Pilot</h2>
            <p className="text-sm font-medium text-slate-600">Jargon-Free Child Progress • Co-Learning • Healthy Boundaries</p>
          </div>
        </div>

        {/* Device Mode Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600">Active Device Mode:</span>
          {deviceMode === "CHILD" ? (
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-1.5 text-xs font-black text-amber-900 shadow-sm transition-all"
            >
              <Lock className="h-3.5 w-3.5 text-amber-700" />
              Child Protected (Tap to Unlock Adult Mode)
            </button>
          ) : (
            <button
              onClick={handleReturnToChildMode}
              className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 text-xs font-black text-white shadow-sm transition-all"
            >
              <Unlock className="h-3.5 w-3.5" />
              Parent Mode Active (Return to Child)
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Progress Translation & Home Support */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Narrative */}
          <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-600" />
                {currentChild.name}'s Learning Journey Today
              </h3>
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                {currentChild.ageBand}
              </span>
            </div>
            <p className="text-slate-700 font-medium leading-relaxed text-sm bg-teal-50/50 rounded-xl p-4 border border-teal-100">
              {currentChild.progressSummary}
            </p>
          </div>

          {/* Offline Home Learning Invitations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              Fun Together Away From the Screen
            </h3>
            <div className="space-y-2.5">
              {currentChild.homeSuggestions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl bg-amber-50/60 p-3 border border-amber-100">
                  <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-semibold text-amber-950 leading-normal">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Screen-time & Shared Device Isolation */}
        <div className="space-y-6">
          {/* Healthy Screen-Time Gauge */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-600" />
                Screen-Time Balance
              </h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                HEALTHY
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Today's Playtime</span>
                <span>{currentChild.sessionMinutes}m / {currentChild.maxMinutes}m max</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-teal-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(currentChild.sessionMinutes / currentChild.maxMinutes) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Session automatically pauses at 15 minutes for a gentle physical stretch break.
              </p>
            </div>
          </div>

          {/* Sibling Isolation Badge */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5 mb-1.5">
              <Smartphone className="h-4 w-4 text-indigo-600" />
              Shared Device Sibling Isolation
            </h4>
            <p className="text-[11px] font-medium text-indigo-900 leading-normal">
              When another child logs in, Aarav's temporary audio snippets and session memory are automatically wiped.
            </p>
          </div>
        </div>
      </div>

      {/* Adult PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Enter Adult PIN</h3>
                <p className="text-xs text-slate-600">Protecting child settings and controls</p>
              </div>
            </div>

            <form onSubmit={handleUnlockParentMode} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 4-digit PIN (default 1234)"
                  className="w-full rounded-xl border border-slate-300 p-3 text-center text-xl tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                />
                {pinError && (
                  <p className="mt-1.5 text-xs font-bold text-rose-600">Incorrect PIN. Please try again.</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPinModalOpen(false);
                    setPinInput("");
                    setPinError(false);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700"
                >
                  Unlock Mode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
