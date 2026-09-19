"use client";

import React, { useState } from "react";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Sliders,
  ShieldAlert,
} from "lucide-react";

interface TicketItem {
  ticketId: string;
  actionType: string;
  agentId: string;
  targetId: string;
  purpose: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidenceSummary: string;
  expectedImpact: string;
  policy: string;
  expiresInMinutes: number;
  status: "PENDING" | "APPROVED" | "MODIFIED" | "REJECTED";
}

export function HumanAuthorizationDrawer() {
  const [tickets, setTickets] = useState<TicketItem[]>([
    {
      ticketId: "ticket-8821a",
      actionType: "SCHEDULE_REVISION",
      agentId: "agent-math-tutor-v2",
      targetId: "std-aarav-sharma",
      purpose: "Schedule spaced review on Quadratic Formula based on 3 consecutive slip errors",
      risk: "LOW",
      evidenceSummary: "BKT pMastery dropped from 0.78 to 0.54 across 3 formative attempts in Unit 4",
      expectedImpact: "Inserts a 10-minute micro-practice into student schedule for tomorrow at 4:30 PM",
      policy: "pol-personalization-v4",
      expiresInMinutes: 45,
      status: "PENDING",
    },
    {
      ticketId: "ticket-9943b",
      actionType: "LEARNING_STATE_CHANGE",
      agentId: "agent-math-tutor-v2",
      targetId: "std-priya-patel",
      purpose: "Advance learner unit path to Polynomial Division after rapid streak",
      risk: "HIGH",
      evidenceSummary: "5 consecutive correct responses with fast response times (< 8s)",
      expectedImpact: "Unlocks Grade 10 advanced topics early; alters syllabus sequence",
      policy: "pol-mastery-v2.1",
      expiresInMinutes: 28,
      status: "PENDING",
    },
  ]);

  const [activeTab, setActiveTab] = useState<"PENDING" | "RESOLVED">("PENDING");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleDecision = (
    ticketId: string,
    decision: "APPROVED" | "MODIFIED" | "REJECTED"
  ) => {
    setTickets((prev) =>
      prev.map((t) => (t.ticketId === ticketId ? { ...t, status: decision } : t))
    );
    setFeedbackMessage(`Ticket ${ticketId} ${decision.toLowerCase()} successfully.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const pendingTickets = tickets.filter((t) => t.status === "PENDING");
  const resolvedTickets = tickets.filter((t) => t.status !== "PENDING");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Human Authorization &amp; Action Previews</h2>
            <p className="text-sm font-medium text-slate-500">
              Clause N15.32 Meaningful Human Oversight • Explainability Evidence • TTL Expiration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-black text-amber-800">
          <Clock className="h-4 w-4 text-amber-600" />
          <span>{pendingTickets.length} Pending Review</span>
        </div>
      </div>

      {feedbackMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {feedbackMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "PENDING"
              ? "bg-amber-500 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Pending Authorization ({pendingTickets.length})
        </button>
        <button
          onClick={() => setActiveTab("RESOLVED")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "RESOLVED"
              ? "bg-amber-500 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Resolved Archive ({resolvedTickets.length})
        </button>
      </div>

      {/* Ticket Cards */}
      <div className="space-y-4">
        {activeTab === "PENDING" && pendingTickets.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">
            Zero pending actions awaiting authorization. All agents within bounded parameters.
          </div>
        )}

        {(activeTab === "PENDING" ? pendingTickets : resolvedTickets).map((ticket) => {
          const isHighRisk = ticket.risk === "HIGH" || ticket.risk === "CRITICAL";

          return (
            <div
              key={ticket.ticketId}
              className={`rounded-2xl border p-5 transition-all ${
                isHighRisk
                  ? "border-amber-200 bg-amber-50/15"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              {/* Top Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-2xs font-mono font-bold text-indigo-700">
                    {ticket.actionType}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {ticket.ticketId}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-2xs font-black uppercase ${
                      isHighRisk
                        ? "bg-red-100 text-red-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Risk: {ticket.risk}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Clock className="h-3 w-3" />
                    Expires in {ticket.expiresInMinutes}m
                  </span>
                </div>
              </div>

              {/* Action Details Grid */}
              <div className="grid gap-4 md:grid-cols-2 text-xs mb-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-2xs tracking-wider">
                      Target &amp; Agent
                    </span>
                    <p className="font-mono text-slate-900 mt-0.5">
                      Target: <span className="font-bold">{ticket.targetId}</span> | Agent: {ticket.agentId}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 uppercase text-2xs tracking-wider">
                      Proposed Purpose
                    </span>
                    <p className="text-slate-800 mt-0.5">{ticket.purpose}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-2xs tracking-wider">
                      Decision Evidence Summary (Why?)
                    </span>
                    <p className="text-slate-700 mt-0.5 bg-slate-50 p-2 rounded border border-slate-100 font-mono text-2xs">
                      {ticket.evidenceSummary}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 uppercase text-2xs tracking-wider">
                      Expected Impact &amp; Policy
                    </span>
                    <p className="text-slate-800 mt-0.5">
                      {ticket.expectedImpact}{" "}
                      <span className="text-indigo-600 font-mono font-semibold">
                        ({ticket.policy})
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Review Controls (If Pending) */}
              {ticket.status === "PENDING" ? (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleDecision(ticket.ticketId, "REJECTED")}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-all"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Action
                  </button>
                  <button
                    onClick={() => handleDecision(ticket.ticketId, "MODIFIED")}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <Sliders className="h-4 w-4 text-slate-500" />
                    Modify Parameters
                  </button>
                  <button
                    onClick={() => handleDecision(ticket.ticketId, "APPROVED")}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Authorize Execution
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 font-mono">Resolved Status:</span>
                  <span
                    className={`font-bold font-mono px-3 py-1 rounded-full text-xs ${
                      ticket.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : ticket.status === "MODIFIED"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
