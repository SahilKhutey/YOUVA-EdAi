"use client";

import MainLayout from "@/app/components/MainLayout";
import {
  AlertOctagon,
  Clock,
  Ear,
  Eye,
  HeartHandshake,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useState } from "react";

interface TranscriptEntry {
  time: string;
  speaker: "AI_VOICE" | "CHILD_TAP";
  text: string;
}

export default function ParentCopilotPage() {
  const [sessionStatus, setSessionStatus] = useState<"ACTIVE" | "PAUSED" | "STOPPED">("ACTIVE");
  const [elapsedMinutes, setElapsedMinutes] = useState(4.2);
  const maxMinutes = 15.0;

  const childToken = "anon_10a2b3c4d5e6";

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const handlePause = () => {
    setSessionStatus(sessionStatus === "ACTIVE" ? "PAUSED" : "ACTIVE");
  };

  const handleTerminate = () => {
    setSessionStatus("STOPPED");
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 font-sans">
        {/* Parent Co-Pilot Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-border gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Live Co-Pilot Bridge • Ages 4–6
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                DPDP §9 Guardian Co-Presence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Parent Co-Pilot Supervisory Terminal
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              Paired Junior Learner: {childToken} (Delhi Public School Early Years)
            </p>
          </div>

          {/* Parental Control Kill Switch & Pause */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePause}
              disabled={sessionStatus === "STOPPED"}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                sessionStatus === "PAUSED"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
              }`}
            >
              {sessionStatus === "PAUSED" ? (
                <>
                  <Play className="w-4 h-4" /> Resume Session
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" /> Pause Session
                </>
              )}
            </button>

            <button
              onClick={handleTerminate}
              disabled={sessionStatus === "STOPPED"}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
            >
              <AlertOctagon className="w-4 h-4" /> Terminate Session
            </button>
          </div>
        </div>

        {/* Screen-Time Hard Guard Bar */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-foreground text-sm">Mandatory 15-Minute Screen Time Guard</span>
            </div>
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {elapsedMinutes.toFixed(1)}m elapsed / {(maxMinutes - elapsedMinutes).toFixed(1)}m remaining
            </span>
          </div>

          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all rounded-full ${
                elapsedMinutes > 12 ? "bg-red-500" : "bg-amber-500"
              }`}
              style={{ width: `${(elapsedMinutes / maxMinutes) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            In accordance with early childhood health directives, sessions automatically lock after 15 minutes for a compulsory 10-minute non-digital rest break.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mirrored Audio Transcript */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ear className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-foreground text-base">Live Spoken Audio Transcript</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> &lt; 65 dB SPL
              </span>
            </div>

            {transcripts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl p-6 text-muted-foreground">
                <Ear className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-foreground">Waiting for Child Voice or Interaction Event</p>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                  Live spoken audio prompts and tactile interaction responses will stream here in real-time as your child engages with the session.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {transcripts.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs font-mono ${
                      entry.speaker === "AI_VOICE"
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-950 dark:text-amber-200"
                        : "bg-muted border border-border text-foreground"
                    }`}
                  >
                    <div className="flex justify-between text-muted-foreground text-[10px] mb-1">
                      <span>{entry.speaker === "AI_VOICE" ? "YOUVA Voice Prompt" : "Child Interaction"}</span>
                      <span>{entry.time}</span>
                    </div>
                    <p className="text-sm font-sans font-semibold">{entry.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Co-Play Interaction Guidance for Parents */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-foreground text-base">Parental Co-Play Suggestions</h2>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4" /> Active Activity Co-Play Prompt:
              </div>
              <p className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
                &ldquo;Encourage your child to count the apples using their fingers! Ask: &lsquo;Can you show me three fingers like the apples?&rsquo;&rdquo;
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">Why Co-Play Matters at Ages 4–6:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Grounds digital concepts in tactile, real-world physical objects.</li>
                <li>Prevents passive screen absorption through active conversational reinforcement.</li>
                <li>Validates DPDP Act 2023 §9 guardian supervision requirements.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
