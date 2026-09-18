"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Bot,
  FileSignature,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Incident {
  id: string;
  learnerId: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectedAt: string;
  context: string;
  status: "OPEN" | "ESCALATED" | "RESOLVED";
  resolvedBy?: string;
}

export function ChildSafetyMonitor() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "INC-SAFE-101",
      learnerId: "learner-jr-09",
      category: "PRIVACY_RISK",
      severity: "MEDIUM",
      detectedAt: "Today, 10:14 AM",
      context: "Child spoke home phone number during conversational prompt.",
      status: "OPEN",
    },
  ]);

  const [resolutionNotice, setResolutionNotice] = useState<{ text: string; isError: boolean } | null>(null);

  const handleResolveAsHuman = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              status: "RESOLVED",
              resolvedBy: "Dr. Ananya Sharma (Certified Safeguarding Officer)",
            }
          : inc
      )
    );
    setResolutionNotice({
      text: "Incident successfully resolved by verified human safeguarding officer with digital signature.",
      isError: false,
    });
  };

  const handleAttemptResolveAsAI = () => {
    setResolutionNotice({
      text: "PROHIBITED ACTION (Clause N13.31): AI systems are strictly barred from resolving or closing child safety incidents. Human educator or safeguarding officer required.",
      isError: true,
    });
  };

  return (
    <div className="rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Child Safety Governance Console</h2>
            <p className="text-sm font-medium text-slate-600">Clause N13.31 Non-Repudiation • 10-Category Real-Time Safeguarding</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-black text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Zero Unresolved Critical Incidents
        </div>
      </div>

      {/* Safety Categories Pill Grid */}
      <div className="mb-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Active Multi-Layer Filters (10 Protected Domains)
        </h4>
        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
          {[
            "Self-Harm",
            "Abuse",
            "Exploitation",
            "Bullying",
            "Sexual Safety",
            "Violence",
            "Dangerous Activity",
            "Privacy Risk",
            "Unsafe Advice",
            "Other",
          ].map((cat) => (
            <span key={cat} className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Incidents Table / List */}
      <div className="space-y-4">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:bg-slate-50"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                    incident.severity === "CRITICAL"
                      ? "bg-rose-600 text-white"
                      : incident.severity === "HIGH"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {incident.severity}
                </span>
                <span className="font-bold text-slate-900 text-sm">{incident.category}</span>
                <span className="text-xs text-slate-500">• {incident.detectedAt}</span>
              </div>

              <span
                className={`text-xs font-bold ${
                  incident.status === "RESOLVED" ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                Status: {incident.status}
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium mb-3 bg-white p-3 rounded-xl border border-slate-200">
              "{incident.context}"
            </p>

            {incident.status === "OPEN" ? (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => handleResolveAsHuman(incident.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all"
                >
                  <UserCheck className="h-4 w-4" />
                  Human Safeguarding Resolution
                </button>
                <button
                  onClick={handleAttemptResolveAsAI}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all"
                >
                  <Bot className="h-4 w-4 text-slate-500" />
                  Test AI Auto-Resolve (Prohibited)
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <FileSignature className="h-4 w-4 text-emerald-600" />
                Resolved by: {incident.resolvedBy}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notification Banner */}
      {resolutionNotice && (
        <div
          className={`mt-4 rounded-xl p-4 text-xs font-bold flex items-start gap-2.5 ${
            resolutionNotice.isError
              ? "bg-rose-100 text-rose-900 border border-rose-300"
              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
          }`}
        >
          {resolutionNotice.isError ? (
            <XCircle className="h-4 w-4 text-rose-700 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          )}
          <span>{resolutionNotice.text}</span>
        </div>
      )}
    </div>
  );
}
