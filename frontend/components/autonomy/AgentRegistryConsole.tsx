"use client";

import React, { useState } from "react";
import {
  Bot,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  UserCheck,
  RefreshCw,
  Search,
} from "lucide-react";

interface AgentItem {
  agentId: string;
  name: string;
  version: string;
  owner: string;
  purpose: string;
  autonomyLevel: string;
  allowedActions: string[];
  deniedActions: string[];
  lifecycleState: "ACTIVE" | "RESTRICTED" | "SHADOW" | "DRAFT" | "SUSPENDED";
}

export function AgentRegistryConsole() {
  const [filterState, setFilterState] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [agents, setAgents] = useState<AgentItem[]>([
    {
      agentId: "agent-math-tutor-v2",
      name: "Secondary Math Socratic Tutor",
      version: "2.1.0",
      owner: "pedagogy-lead-01",
      purpose: "Generate hints, explanations, and recommend practice exercises",
      autonomyLevel: "A3_BOUNDED_EXECUTION",
      allowedActions: ["EXPLAIN_CONCEPT", "GENERATE_HINT", "RECOMMEND_PRACTICE", "SCHEDULE_REVISION"],
      deniedActions: ["MASTERY_OVERRIDE", "LEARNING_STATE_CHANGE", "CREDENTIAL_ISSUANCE", "SAFETY_RESOLUTION"],
      lifecycleState: "ACTIVE",
    },
    {
      agentId: "agent-safety-triage-v1",
      name: "Acoustic & Semantic Safety Triage Agent",
      version: "1.4.2",
      owner: "child-safety-officer",
      purpose: "Detect distress, classify safety keywords, and escalate to human safeguarding",
      autonomyLevel: "A2_RECOMMENDATION",
      allowedActions: ["DETECT_SAFETY_RISK", "CLASSIFY_SEVERITY", "RECOMMEND_ESCALATION"],
      deniedActions: ["SAFETY_RESOLUTION", "CONSENT_CHANGE", "ACCOUNT_DELETION"],
      lifecycleState: "ACTIVE",
    },
    {
      agentId: "agent-cred-assistant-v1",
      name: "High School Skills Passport Assistant",
      version: "1.0.1",
      owner: "credential-admin",
      purpose: "Aggregate multi-source learning evidence and check eligibility for W3C VC 2.0",
      autonomyLevel: "A2_RECOMMENDATION",
      allowedActions: ["AGGREGATE_EVIDENCE", "CALCULATE_ELIGIBILITY", "FLAG_MISSING_ARTIFACTS"],
      deniedActions: ["CREDENTIAL_ISSUANCE", "CREDENTIAL_REVOCATION", "MASTERY_OVERRIDE"],
      lifecycleState: "ACTIVE",
    },
    {
      agentId: "agent-content-gen-draft",
      name: "Elementary Story Variant Generator",
      version: "0.9.0",
      owner: "curriculum-team",
      purpose: "Generate candidate story text and visual prompts for human teacher review",
      autonomyLevel: "A2_RECOMMENDATION",
      allowedActions: ["GENERATE_DRAFT_TEXT", "GENERATE_PROMPT"],
      deniedActions: ["PUBLISH_UNREVIEWED_CONTENT", "DIRECT_STUDENT_DISPATCH"],
      lifecycleState: "SHADOW",
    },
  ]);

  const handleToggleSuspend = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.agentId === agentId) {
          return {
            ...a,
            lifecycleState: a.lifecycleState === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
          };
        }
        return a;
      })
    );
  };

  const filteredAgents = agents.filter((a) => {
    const matchesFilter = filterState === "ALL" || a.lifecycleState === filterState;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.agentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Agent Identity &amp; Registry</h2>
            <p className="text-sm font-medium text-slate-500">
              Clause N15.10 Explicit Identity • Least Privilege • Consequential Action Denials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-black text-emerald-800">
          <Shield className="h-4 w-4 text-emerald-600" />
          <span>Generic AI_SYSTEM Blocked</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {["ALL", "ACTIVE", "SHADOW", "SUSPENDED"].map((state) => (
            <button
              key={state}
              onClick={() => setFilterState(state)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filterState === state
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {state}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents by name or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Agents List */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredAgents.map((agent) => {
          const isActive = agent.lifecycleState === "ACTIVE";
          const isSuspended = agent.lifecycleState === "SUSPENDED";
          const isShadow = agent.lifecycleState === "SHADOW";

          return (
            <div
              key={agent.agentId}
              className={`rounded-2xl border p-5 transition-all ${
                isSuspended
                  ? "border-red-200 bg-red-50/20"
                  : isShadow
                  ? "border-amber-200 bg-amber-50/20"
                  : "border-slate-200 bg-white hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900">{agent.name}</h3>
                    <span className="text-2xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      v{agent.version}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{agent.agentId}</p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-2xs font-black uppercase ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : isSuspended
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {agent.lifecycleState}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-4">{agent.purpose}</p>

              {/* Autonomy Level */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Autonomy Tier:</span>
                  <span className="font-bold text-indigo-700 font-mono">{agent.autonomyLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Owner Role:</span>
                  <span className="font-semibold text-slate-700">{agent.owner}</span>
                </div>
              </div>

              {/* Least Privilege & Denied Actions */}
              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                    Authorized Scope ({agent.allowedActions.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.allowedActions.map((act) => (
                      <span
                        key={act}
                        className="rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-2xs font-mono font-semibold text-indigo-700"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-2xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Inviolable Denials ({agent.deniedActions.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {agent.deniedActions.map((act) => (
                      <span
                        key={act}
                        className="rounded bg-red-50 border border-red-100 px-2 py-0.5 text-2xs font-mono font-semibold text-red-700"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-2xs font-medium text-slate-400">
                  Last verified: Today, 08:30 AM
                </span>
                <button
                  onClick={() => handleToggleSuspend(agent.agentId)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    isSuspended
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  }`}
                >
                  {isSuspended ? "Reactivate Agent" : "Revoke / Suspend"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
