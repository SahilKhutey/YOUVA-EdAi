"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Sparkles,
  Award,
  FileCode,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from "lucide-react";

export interface PendingAuthorizationItem {
  credentialId: string;
  learnerId: string;
  learnerName: string;
  policyId: string;
  policyTitle: string;
  submittedAt: string;
  projectTitle: string;
  authenticityScore: number;
  aiDisclosureSummary: string;
  evidenceCount: number;
}

export interface TeacherCredentialAuthorizationProps {
  pendingItems: PendingAuthorizationItem[];
  onAuthorize: (
    credentialId: string,
    decision: "APPROVE" | "REJECT",
    notes: string
  ) => void;
  onRequestAiSuggestion?: (credentialId: string) => void;
}

export const TeacherCredentialAuthorization: React.FC<
  TeacherCredentialAuthorizationProps
> = ({ pendingItems = [], onAuthorize, onRequestAiSuggestion }) => {
  const [selectedItem, setSelectedItem] =
    useState<PendingAuthorizationItem | null>(
      pendingItems.length > 0 ? pendingItems[0] : null
    );
  const [notes, setNotes] = useState("");
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({
    ARCH_DECOMP: 3,
    CODE_QUALITY: 3,
    TEST_RIGOR: 3,
    REFLECTION: 3,
  });

  const rubricCriteria = [
    {
      id: "ARCH_DECOMP",
      name: "Decomposition & Architecture",
      desc: "Modular design and boundary encapsulation",
    },
    {
      id: "CODE_QUALITY",
      name: "Implementation Quality",
      desc: "Code clarity, edge case handling, and defensive guards",
    },
    {
      id: "TEST_RIGOR",
      name: "Verification & Testing Rigor",
      desc: "Automated unit tests, integration assertions, and evidence logs",
    },
    {
      id: "REFLECTION",
      name: "Intellectual Ownership & Reflection",
      desc: "Understanding of tradeoffs, error correction, and independent defense",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wide">
            <UserCheck className="w-4 h-4" /> Educator Credential Authorization Gate
            (Clause N12.14)
          </div>
          <h3 className="text-xl font-bold mt-1">
            Teacher Credential Verification Drawer
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Consequential credentials require authoritative educator approval
            prior to cryptographic issuance.
          </p>
        </div>
        <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold">
          {pendingItems.length} Awaiting Educator Review
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 min-h-[500px]">
        {/* Left Column: Queue List */}
        <div className="p-4 space-y-2 overflow-y-auto max-h-[600px] bg-slate-50/50">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-3">
            Pending Queue ({pendingItems.length})
          </h4>

          {pendingItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No pending credential requests.
            </div>
          ) : (
            pendingItems.map((item) => (
              <button
                key={item.credentialId}
                onClick={() => {
                  setSelectedItem(item);
                  setNotes("");
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedItem?.credentialId === item.credentialId
                    ? "bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-slate-900">
                    {item.learnerName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.authenticityScore >= 0.8
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {Math.round(item.authenticityScore * 100)}% Auth
                  </span>
                </div>
                <p className="text-xs text-indigo-600 font-medium mt-1 truncate">
                  {item.policyTitle}
                </p>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>{item.evidenceCount} Evidences</span>
                  <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right Column: Review & Rubric Evaluation */}
        <div className="p-6 lg:col-span-2 space-y-6">
          {selectedItem ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {selectedItem.policyTitle}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidate:{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedItem.learnerName}
                    </span>{" "}
                    ({selectedItem.learnerId})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Authenticity</span>
                  <div className="text-base font-bold text-emerald-600">
                    {Math.round(selectedItem.authenticityScore * 100)}% Verified
                  </div>
                </div>
              </div>

              {/* Project & AI Disclosure Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Cap-Stone Artifact: {selectedItem.projectTitle}
                  </span>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Artifact
                  </a>
                </div>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">AI Usage Summary:</span>{" "}
                  {selectedItem.aiDisclosureSummary}
                </p>
              </div>

              {/* 4-Tier Rubric Evaluation Form */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Authoritative 4-Tier Rubric Evaluation
                  </h5>
                  {onRequestAiSuggestion && (
                    <button
                      type="button"
                      onClick={() =>
                        onRequestAiSuggestion(selectedItem.credentialId)
                      }
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Suggest AI Rubric Draft
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {rubricCriteria.map((crit) => (
                    <div
                      key={crit.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            {crit.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {crit.desc}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-indigo-600">
                          Tier {rubricScores[crit.id] || 3}/4
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {[
                          { tier: 1, label: "Beginning" },
                          { tier: 2, label: "Developing" },
                          { tier: 3, label: "Proficient" },
                          { tier: 4, label: "Advanced" },
                        ].map((t) => (
                          <button
                            key={t.tier}
                            type="button"
                            onClick={() =>
                              setRubricScores({
                                ...rubricScores,
                                [crit.id]: t.tier,
                              })
                            }
                            className={`py-1 px-2 rounded font-medium border text-center transition-all ${
                              rubricScores[crit.id] === t.tier
                                ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Educator Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Educator Audit Notes & Justification *
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide pedagogical rationale for approval or required remediation for rejection..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Authorization Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() =>
                    onAuthorize(selectedItem.credentialId, "REJECT", notes)
                  }
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject with Remediation
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onAuthorize(
                      selectedItem.credentialId,
                      "APPROVE",
                      notes || "Approved based on validated project evidence"
                    )
                  }
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Sign Credential
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-slate-400">
              Select a candidate from the queue to review evidence and evaluate
              rubrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
