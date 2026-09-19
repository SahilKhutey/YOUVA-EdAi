'use client';

import React, { useState } from 'react';

export function SkillsPassportWalletView() {
  const [shareAudience, setShareAudience] = useState<string>('Employer / University Admissions');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const passport = {
    learnerId: 'STUDENT-201',
    learnerName: 'Aarav Sharma',
    totalSkillsVerified: 4,
    totalCredentials: 2,
    evidenceCount: 6,
    skills: [
      { id: 'SKILL-MATH-CALC-DIFF', name: 'Differential Calculus & Chain Rule', level: 'ADVANCED', date: '2026-09-15' },
      { id: 'SKILL-CS-ALGO-RECUR', name: 'Recursive Algorithms & Call Stack', level: 'INTERMEDIATE', date: '2026-09-10' },
      { id: 'SKILL-PHYS-NEWTON-DYN', name: 'Newtonian Dynamics & Free Body Analysis', level: 'INTERMEDIATE', date: '2026-08-28' },
      { id: 'SKILL-CHEM-EQUIL-003', name: 'Le Chatelier Equilibrium Perturbations', level: 'ADVANCED', date: '2026-09-02' },
    ],
    credentials: [
      {
        id: 'CRED-MATH-CALC-001',
        title: 'Differential Calculus Mastery Certificate',
        issuer: 'Delhi Public School Society',
        type: 'CERTIFICATE',
        status: 'ACTIVE',
      },
      {
        id: 'CRED-CS-RECUR-002',
        title: 'Algorithmic Recursion & Verification Badge',
        issuer: 'YOUVA Open Computing Lab',
        type: 'BADGE',
        status: 'ACTIVE',
      },
    ],
  };

  const handleCreateShare = () => {
    const token = `share-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    setGeneratedToken(token);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Learner Skills Passport & Wallet</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Clauses N19.49–N19.65
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Learner-owned verifiable competencies, W3C Verifiable Credentials, Open Badges, and selective sharing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-3 py-1 rounded border border-purple-500/30">
            Learner Owned &bull; Zero Lock-In
          </span>
        </div>
      </div>

      {/* Passport Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Verified Skills</span>
          <span className="text-2xl font-black text-cyan-400 mt-1 block">{passport.totalSkillsVerified}</span>
          <span className="text-[11px] text-slate-500">All competencies validated</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Active Credentials</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{passport.totalCredentials}</span>
          <span className="text-[11px] text-slate-500">W3C VC & Open Badges</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Evidence Artifacts</span>
          <span className="text-2xl font-black text-indigo-400 mt-1 block">{passport.evidenceCount}</span>
          <span className="text-[11px] text-slate-500">Projects, tasks & trials</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">External Verifications</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">14</span>
          <span className="text-[11px] text-slate-500">Successful verifications</span>
        </div>
      </div>

      {/* Verified Skills & Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Card */}
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
          <span className="text-xs font-semibold text-slate-300 block">Demonstrated Skills</span>
          <div className="space-y-2">
            {passport.skills.map((s) => (
              <div key={s.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-200 block">{s.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Verified: {s.date}</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  {s.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Credentials Card */}
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
          <span className="text-xs font-semibold text-slate-300 block">Authorized Credentials</span>
          <div className="space-y-2">
            {passport.credentials.map((c) => (
              <div key={c.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-slate-200">{c.title}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {c.status}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Issuer: {c.issuer}</span>
                  <span className="font-mono text-slate-500">{c.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selective Disclosure Share Generator */}
      <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">Create Privacy-Preserving Selective Disclosure Share</h3>
          <span className="text-[11px] text-slate-500">Expiring 30-day token</span>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={shareAudience}
            onChange={(e) => setShareAudience(e.target.value)}
            placeholder="Intended Recipient / Purpose..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleCreateShare}
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-lg shadow-purple-600/20"
          >
            Generate Share Link
          </button>
        </div>

        {generatedToken && (
          <div className="bg-purple-950/30 border border-purple-800/40 p-3.5 rounded-lg text-xs space-y-1 text-purple-200">
            <div className="font-semibold">Selective Disclosure Token Generated:</div>
            <div className="font-mono text-cyan-300 break-all">{generatedToken}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Verifiers using this token can verify your credentials with zero access to your grades or internal student records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
