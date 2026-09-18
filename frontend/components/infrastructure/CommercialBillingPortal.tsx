"use client";

import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Zap,
  Clock,
  KeyRound,
} from "lucide-react";

export function CommercialBillingPortal() {
  const [selectedTenant, setSelectedTenant] = useState("tenant-dps-rkp");
  const [activeEnrollCount, setActiveEnrollCount] = useState(320);
  const maxSeats = 500;
  const seatsRemaining = maxSeats - activeEnrollCount;

  const [webhookLogs, setWebhookLogs] = useState([
    {
      id: "evt_10928374",
      type: "customer.subscription.updated",
      status: "200 OK (Verified HMAC)",
      time: "Today, 04:12 PM",
      idempotentReplayBlocked: false,
    },
    {
      id: "evt_10928374",
      type: "customer.subscription.updated",
      status: "200 OK (Idempotent Duplicate Acknowledged)",
      time: "Today, 04:13 PM",
      idempotentReplayBlocked: true,
    },
  ]);

  const handleEnrollStudent = () => {
    if (seatsRemaining > 0) {
      setActiveEnrollCount((prev) => prev + 1);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Commercial Billing &amp; Procurement</h2>
            <p className="text-sm font-medium text-slate-500">
              Clause N14.32 Stripe Webhook Security • Cryptographic Idempotency • Seat Allocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1.5 text-xs font-black text-teal-800">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          HMAC-SHA256 Signed Webhooks Active
        </div>
      </div>

      {/* Plan & Seat Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Plan Card */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">Active Plan</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
              ACTIVE
            </span>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Institutional Enterprise</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">DPS R.K. Puram (Annual Contract)</p>
          </div>

          <div className="space-y-1.5 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span>Full 3–18 Curriculum Suite (N13 Pre-School to N12 High-School)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span>Dedicated AI FinOps Spending Pool</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span>Enterprise SLA (99.95% Learning Loop Availability)</span>
            </div>
          </div>
        </div>

        {/* Seat Utilization Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-600" />
              Seat Allocation
            </span>
            <span className="text-xs font-black text-slate-900 font-mono">
              {activeEnrollCount} / {maxSeats} Seats
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(activeEnrollCount / maxSeats) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{seatsRemaining} Seats Remaining</span>
              <span>{((activeEnrollCount / maxSeats) * 100).toFixed(1)}% Capacity</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleEnrollStudent}
              disabled={seatsRemaining <= 0}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              Enroll Test Learner (+1 Seat)
            </button>
          </div>
        </div>

        {/* Webhook Security Protocol */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-amber-600" />
            Webhook Security Rules (Clause N14.32)
          </h3>
          <ul className="text-xs text-slate-600 space-y-2 font-medium">
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>HMAC-SHA256 Check:</strong> Timing-safe verification prevents spoofing.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Replay Defense:</strong> Timestamps older than 300 seconds rejected.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Idempotency:</strong> Duplicate event IDs return 200 without duplicate billing.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Webhook Audit Log */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          Recent Ingested Webhook Transactions
        </h3>
        <div className="space-y-2">
          {webhookLogs.map((log, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-500">{log.id}</span>
                <span className="font-bold text-slate-900">{log.type}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-mono">{log.time}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
