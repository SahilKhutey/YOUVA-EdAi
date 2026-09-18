"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileCode,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  X,
  Sparkles,
  CheckSquare,
  Square,
} from "lucide-react";

export interface ProjectSubmissionData {
  title: string;
  domain: string;
  problemStatement: string;
  artifactUrl: string;
  repositoryUrl?: string;
  aiDisclosure: {
    brainstormingPct: number;
    codeGenerationPct: number;
    editingPct: number;
    researchPct: number;
    humanContributions: {
      problemDefinition: boolean;
      architecturalDecisions: boolean;
      testingAndVerification: boolean;
      personalReflection: boolean;
    };
    toolsUsed: string[];
    studentStatement: string;
  };
}

export interface ProjectSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectSubmissionData) => void;
}

export const ProjectSubmissionModal: React.FC<ProjectSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("COMPUTATIONAL_THINKING");
  const [problemStatement, setProblemStatement] = useState("");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [brainstormingPct, setBrainstormingPct] = useState(30);
  const [codeGenerationPct, setCodeGenerationPct] = useState(25);
  const [editingPct, setEditingPct] = useState(15);
  const [researchPct, setResearchPct] = useState(20);
  const [toolsInput, setToolsInput] = useState("Gemini 1.5 Pro, GitHub Copilot");
  const [studentStatement, setStudentStatement] = useState("");

  const [humanContributions, setHumanContributions] = useState({
    problemDefinition: true,
    architecturalDecisions: true,
    testingAndVerification: true,
    personalReflection: true,
  });

  if (!isOpen) return null;

  // Live authenticity heuristic calculation
  const calculateLiveAuthenticity = (): number => {
    let score = 1.0;
    if (!humanContributions.problemDefinition) score -= 0.30;
    if (!humanContributions.architecturalDecisions) score -= 0.20;
    if (!humanContributions.testingAndVerification) score -= 0.25;
    if (!humanContributions.personalReflection) score -= 0.15;
    if (codeGenerationPct > 90 && !humanContributions.testingAndVerification) score -= 0.25;
    return Math.max(0.05, Math.min(1.0, Math.round(score * 100) / 100));
  };

  const authenticity = calculateLiveAuthenticity();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tools = toolsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title,
      domain,
      problemStatement,
      artifactUrl,
      repositoryUrl,
      aiDisclosure: {
        brainstormingPct,
        codeGenerationPct,
        editingPct,
        researchPct,
        humanContributions,
        toolsUsed: tools,
        studentStatement,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-indigo-900 text-white p-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              High-School Project Submission (Clause N12.44)
            </div>
            <h3 className="text-xl font-bold mt-1">
              Submit Project with AI Assistance Disclosure
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Basic Metadata */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              1. Project Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed State Machine Validator"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Domain *
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="COMPUTATIONAL_THINKING">
                    Computational Thinking
                  </option>
                  <option value="AI_LITERACY">AI Literacy</option>
                  <option value="DATA_SCIENCE">Data Science & Stats</option>
                  <option value="SOFTWARE_ENGINEERING">
                    Software Engineering
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Problem Statement & Architecture Summary *
              </label>
              <textarea
                required
                rows={3}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="Explain the technical problem you solved, architectural tradeoffs, and system boundaries..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Live Artifact / Demonstration URL *
                </label>
                <input
                  type="url"
                  required
                  value={artifactUrl}
                  onChange={(e) => setArtifactUrl(e.target.value)}
                  placeholder="https://youva-student-demo.app"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Code Repository (Optional)
                </label>
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  placeholder="https://github.com/learner/repo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: AI Assistance Disclosure Form (Clause N12.44) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  2. Academic Integrity & AI Assistance Disclosure
                </h4>
                <p className="text-xs text-slate-500">
                  Transparency in AI usage is valued. Disclose how AI tools
                  assisted your engineering process.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Authenticity Score</span>
                <div
                  className={`text-lg font-bold ${
                    authenticity >= 0.8
                      ? "text-emerald-600"
                      : authenticity >= 0.6
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {Math.round(authenticity * 100)}%
                </div>
              </div>
            </div>

            {/* Usage Percentages */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ideation / Brainstorm: {brainstormingPct}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brainstormingPct}
                  onChange={(e) => setBrainstormingPct(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Code Scaffolding: {codeGenerationPct}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={codeGenerationPct}
                  onChange={(e) => setCodeGenerationPct(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Text Editing: {editingPct}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingPct}
                  onChange={(e) => setEditingPct(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Research: {researchPct}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={researchPct}
                  onChange={(e) => setResearchPct(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* Human Contribution Declarations */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Declared Human Contributions (Required for Tier 3+ Credential Eligibility):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={humanContributions.problemDefinition}
                    onChange={(e) =>
                      setHumanContributions({
                        ...humanContributions,
                        problemDefinition: e.target.checked,
                      })
                    }
                    className="accent-indigo-600"
                  />
                  <span>Human authored problem definition & scope</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={humanContributions.architecturalDecisions}
                    onChange={(e) =>
                      setHumanContributions({
                        ...humanContributions,
                        architecturalDecisions: e.target.checked,
                      })
                    }
                    className="accent-indigo-600"
                  />
                  <span>Human made system architectural decisions</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={humanContributions.testingAndVerification}
                    onChange={(e) =>
                      setHumanContributions({
                        ...humanContributions,
                        testingAndVerification: e.target.checked,
                      })
                    }
                    className="accent-indigo-600"
                  />
                  <span>Human verified all tests & error boundaries</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={humanContributions.personalReflection}
                    onChange={(e) =>
                      setHumanContributions({
                        ...humanContributions,
                        personalReflection: e.target.checked,
                      })
                    }
                    className="accent-indigo-600"
                  />
                  <span>Human wrote personal learning reflection</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                AI Tools Used (comma-separated)
              </label>
              <input
                type="text"
                value={toolsInput}
                onChange={(e) => setToolsInput(e.target.value)}
                placeholder="e.g. Gemini, ChatGPT, GitHub Copilot, Cursor"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" /> Submit for Teacher Evaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
