"use client";

import React, { useState } from "react";
import {
  Award,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  Download,
  Share2,
  Layers,
  Sparkles,
  BookOpen,
} from "lucide-react";

export interface PassportSkillItem {
  skillId: string;
  name: string;
  domain: string;
  level: string;
  masteryScore: number;
  evidenceCount: number;
  qualityLevelMax: number;
  demonstratedAt: string;
  credentialIds: string[];
}

export interface PassportCredentialItem {
  credentialId: string;
  title: string;
  issuedAt: string;
  status: string;
  policyId: string;
}

export interface SkillsPassportProps {
  learnerId?: string;
  learnerName?: string;
  skills: PassportSkillItem[];
  credentials: PassportCredentialItem[];
  onExportBadge?: (credentialId: string) => void;
  onExportVC?: (credentialId: string) => void;
}

export const SkillsPassport: React.FC<SkillsPassportProps> = ({
  learnerId = "hs-learner-042",
  learnerName = "Aanya Sharma",
  skills = [],
  credentials = [],
  onExportBadge,
  onExportVC,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"skills" | "credentials">("skills");

  const domains = ["ALL", ...Array.from(new Set(skills.map((s) => s.domain)))];
  const filteredSkills =
    selectedDomain === "ALL"
      ? skills
      : skills.filter((s) => s.domain === selectedDomain);

  const getQualityBadgeColor = (level: number) => {
    switch (level) {
      case 5:
        return "bg-purple-100 text-purple-800 border-purple-300";
      case 4:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case 3:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case 2:
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-xs font-semibold tracking-wide uppercase text-indigo-200">
                W3C Verifiable & Open Badges
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Cryptographically Sealed
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Skills Passport
            </h2>
            <p className="text-indigo-200 text-sm mt-1">
              Verified Learning & Demonstration Record for{" "}
              <span className="text-white font-semibold">{learnerName}</span> (
              {learnerId})
            </p>
          </div>

          <div className="flex gap-3">
            <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold text-white">
                {skills.length}
              </div>
              <div className="text-xs text-indigo-200">Skills Verified</div>
            </div>
            <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="text-2xl font-bold text-emerald-400">
                {credentials.filter((c) => c.status === "ACTIVE").length}
              </div>
              <div className="text-xs text-indigo-200">Credentials Issued</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mt-6 border-b border-indigo-700/50">
          <button
            onClick={() => setActiveTab("skills")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "skills"
                ? "border-indigo-400 text-white"
                : "border-transparent text-indigo-300 hover:text-white"
            }`}
          >
            Demonstrated Skills ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "credentials"
                ? "border-indigo-400 text-white"
                : "border-transparent text-indigo-300 hover:text-white"
            }`}
          >
            Issued Credentials ({credentials.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === "skills" ? (
          <div>
            {/* Domain Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {domains.map((dom) => (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDomain === dom
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {dom.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.skillId}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/50 hover:bg-white hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {skill.skillId}
                      </span>
                      <h4 className="text-base font-semibold text-slate-900 mt-1">
                        {skill.name}
                      </h4>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getQualityBadgeColor(
                        skill.qualityLevelMax
                      )}`}
                    >
                      Tier {skill.qualityLevelMax} Evidence
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Demonstrated Mastery</span>
                      <span className="font-semibold text-slate-700">
                        {Math.round(skill.masteryScore * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(skill.masteryScore * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200/70 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                      {skill.evidenceCount} verified evidence items
                    </span>
                    <span>
                      {new Date(skill.demonstratedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {credentials.map((cred) => (
              <div
                key={cred.credentialId}
                className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {cred.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {cred.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      ID: {cred.credentialId} • Policy: {cred.policyId}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Issued: {new Date(cred.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onExportBadge && onExportBadge(cred.credentialId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Open Badge
                  </button>
                  <button
                    onClick={() => onExportVC && onExportVC(cred.credentialId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> W3C VC
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
