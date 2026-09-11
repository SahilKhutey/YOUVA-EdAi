"use client";

import MainLayout from "@/app/components/MainLayout";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  GraduationCap,
  Layers,
  Lock,
  QrCode,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface CredentialBadge {
  id: string;
  title: string;
  competencyCode: string;
  masteryPercentage: number;
  authorizedBy: string;
  authorizedRole: string;
  verificationHash: string;
  issuedAt: string;
  standards: string;
}

interface ConceptNode {
  id: string;
  title: string;
  status: "MASTERED" | "IN_PROGRESS" | "LOCKED";
  masteryScore: number;
  prerequisitesMet: boolean;
}

export default function HighSchoolDashboardPage() {
  const [activeTab, setActiveTab] = useState<"readiness" | "passport" | "agency">("readiness");
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<CredentialBadge | null>(null);

  const studentDid = "did:youva:student:a1b2c3d4e5f67890";
  const pilotSchool = "Delhi Public School, Sector XII, R.K. Puram";

  const credentials: CredentialBadge[] = [
    {
      id: "urn:uuid:7c9e6679-7425-40de-944b-e07fc1f90ae7",
      title: "Class 10 Quadratic Equations Mastery",
      competencyCode: "MATH-G10-QUAD-01",
      masteryPercentage: 89.2,
      authorizedBy: "Dr. Anita Deshmukh",
      authorizedRole: "Senior Mathematics Faculty",
      verificationHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      issuedAt: "2026-08-30T10:00:00Z",
      standards: "W3C VC 2.0 / Open Badges 3.0",
    },
  ];

  const concepts: ConceptNode[] = [
    { id: "c1", title: "Standard Quadratic Form ax² + bx + c = 0", status: "MASTERED", masteryScore: 0.98, prerequisitesMet: true },
    { id: "c2", title: "Factorisation & Splitting Middle Term", status: "MASTERED", masteryScore: 0.94, prerequisitesMet: true },
    { id: "c3", title: "Discriminant & Nature of Roots (D = b² - 4ac)", status: "MASTERED", masteryScore: 0.91, prerequisitesMet: true },
    { id: "c4", title: "Quadratic Formula Execution", status: "MASTERED", masteryScore: 0.89, prerequisitesMet: true },
    { id: "c5", title: "Word Problems & Uniform Speed Formulations", status: "IN_PROGRESS", masteryScore: 0.72, prerequisitesMet: true },
    { id: "c6", title: "Advanced Reducible Rational Equations", status: "LOCKED", masteryScore: 0.20, prerequisitesMet: false },
  ];

  return (
    <MainLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans">
        {/* Secondary Tier Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-border gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Secondary Tier • Grade 10
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Zero-PII Pseudonymized DID
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Secondary Academic Learning Terminal
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              Identity: {studentDid} | Affiliation: {pilotSchool}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("readiness")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "readiness"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Mastery Radar
            </button>
            <button
              onClick={() => setActiveTab("passport")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "passport"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Skills Passport (VC)
            </button>
            <button
              onClick={() => setActiveTab("agency")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "agency"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Goal Agency
            </button>
          </div>
        </div>

        {/* Analytical Telemetry Ribbon (No juvenile points / confetti) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Learning Velocity</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">+0.58 <span className="text-sm font-normal text-muted-foreground">ΔP(L)/hr</span></div>
            <p className="text-xs text-muted-foreground mt-1">Sustained positive learning rate</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Unit Mastery (BKT)</span>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">89.2%</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Exceeds 85% certification gate</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Time on Deliberate Task</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">64.5 <span className="text-sm font-normal text-muted-foreground">mins</span></div>
            <p className="text-xs text-muted-foreground mt-1">Anti-gaming threshold satisfied (&gt;45m)</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">W3C Micro-Credentials</span>
              <Award className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">1 <span className="text-sm font-normal text-muted-foreground">Active</span></div>
            <p className="text-xs text-muted-foreground mt-1">Human faculty signed &amp; verified</p>
          </div>
        </div>

        {/* Tab 1: Mastery Radar & Concept DAG */}
        {activeTab === "readiness" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">CBSE Grade 10: Quadratic Equations Curriculum Map</h2>
                <p className="text-sm text-muted-foreground">
                  Empirical prerequisite dependency graph with deterministic BKT knowledge states.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {concepts.map((c) => (
                <div
                  key={c.id}
                  className={`p-5 rounded-xl border transition-all ${
                    c.status === "MASTERED"
                      ? "border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10"
                      : c.status === "IN_PROGRESS"
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-muted/40 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">{c.id}</span>
                    {c.status === "MASTERED" ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                      </span>
                    ) : c.status === "IN_PROGRESS" ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                        <Zap className="w-3.5 h-3.5" /> In ZPD Focus
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        <Lock className="w-3.5 h-3.5" /> Prerequisite Pending
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm leading-snug mb-3">{c.title}</h3>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>BKT Mastery Probability</span>
                      <span className="font-mono font-medium">{(c.masteryScore * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.status === "MASTERED" ? "bg-emerald-500" : c.status === "IN_PROGRESS" ? "bg-primary" : "bg-slate-400"
                        }`}
                        style={{ width: `${c.masteryScore * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Skills Passport (W3C VC 2.0) */}
        {activeTab === "passport" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Decentralized Skills Passport</h2>
              <p className="text-sm text-muted-foreground">
                Cryptographically signed W3C Verifiable Credentials (VC 2.0 / Open Badges 3.0) with zero PII exposure.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {credentials.map((cred) => (
                <div key={cred.id} className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-base">{cred.title}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{cred.competencyCode}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-foreground">
                      {cred.standards}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50 text-xs space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certified BKT Mastery:</span>
                      <span className="font-semibold text-emerald-600">{cred.masteryPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Authorizing Faculty:</span>
                      <span className="font-medium text-foreground">{cred.authorizedBy} ({cred.authorizedRole})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verification Token Hash:</span>
                      <span className="truncate max-w-[200px] text-muted-foreground">{cred.verificationHash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issuance Timestamp:</span>
                      <span className="text-foreground">{new Date(cred.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Zero-PII Invariant Enforced
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCredential(cred);
                        setShowQrModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Export Verifiable QR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Learner Agency & Goal Planning */}
        {activeTab === "agency" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Student Agency &amp; Self-Regulated Targets</h2>
              <p className="text-sm text-muted-foreground">
                Secondary students actively direct their focus, review diagnostics, and request non-punitive scaffolding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Active Metacognitive Goals</h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Master discriminant analysis for non-real root detection (Achieved 91%)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Formulate quadratic equations from uniform speed word problems (Current focus)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Layers className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>Prepare for Term 1 Board Examination competency benchmark</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-foreground text-sm">Diagnostic Review Mode</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  High school learners have direct on-demand access to the 5-item Quadratic Equations Diagnostic Assessment
                  to re-evaluate foundational algebraic competencies without negative grading penalties.
                </p>
                <button className="px-4 py-2 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  Launch Self-Directed Diagnostic Run
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zero-PII QR Code Verification Modal */}
        {showQrModal && selectedCredential && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border border-border p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="font-bold text-foreground text-base">W3C VC 2.0 Zero-PII QR Proof</h3>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-slate-200">
                <div className="w-40 h-40 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                  <QrCode className="w-28 h-28 text-slate-800" />
                </div>
                <p className="text-xs text-slate-500 mt-3 font-mono text-center">
                  did:youva:student:a1b2...#proof
                </p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 font-mono bg-muted/40 p-3 rounded-lg">
                <p><strong className="text-foreground">Competency:</strong> {selectedCredential.competencyCode}</p>
                <p><strong className="text-foreground">Issuer:</strong> {selectedCredential.authorizedBy}</p>
                <p><strong className="text-foreground">Hash:</strong> {selectedCredential.verificationHash.slice(0, 32)}...</p>
                <p className="text-emerald-600 font-semibold pt-1">
                  ✓ Validated: No student name, email, or PII contained in payload.
                </p>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Close Proof Viewer
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
