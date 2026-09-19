'use client';

import React, { useState } from 'react';

interface EvidenceItem {
  evidenceId: string;
  learnerId: string;
  skillName: string;
  evidenceType: string;
  score: number;
  validityStatus: string;
  achievedAt: string;
  quality: {
    validityScore: number;
    recencyDays: number;
    independence: number;
    rigor: number;
  };
  aiDisclosure: {
    assisted: boolean;
    type: string;
    percentage: number;
  };
  provenanceHash: string;
}

export function EvidenceProvenanceConsole() {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('EVID-MATH-CALC-001');

  const evidenceItems: EvidenceItem[] = [
    {
      evidenceId: 'EVID-MATH-CALC-001',
      learnerId: 'STUDENT-201',
      skillName: 'Differential Calculus & Chain Rule',
      evidenceType: 'TRANSFER_TASK',
      score: 92,
      validityStatus: 'VALID',
      achievedAt: '2026-09-12T14:30:00Z',
      quality: {
        validityScore: 0.95,
        recencyDays: 7,
        independence: 0.90,
        rigor: 0.88,
      },
      aiDisclosure: {
        assisted: false,
        type: 'NONE',
        percentage: 0,
      },
      provenanceHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      evidenceId: 'EVID-CS-ALGO-002',
      learnerId: 'STUDENT-201',
      skillName: 'Recursive Algorithms & Call Stack',
      evidenceType: 'PROJECT',
      score: 88,
      validityStatus: 'VALID',
      achievedAt: '2026-09-10T11:00:00Z',
      quality: {
        validityScore: 0.92,
        recencyDays: 9,
        independence: 0.85,
        rigor: 0.84,
      },
      aiDisclosure: {
        assisted: true,
        type: 'DEBUGGING_HINTS',
        percentage: 15,
      },
      provenanceHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    },
  ];

  const current = evidenceItems.find((e) => e.evidenceId === selectedEvidenceId) || evidenceItems[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Evidence Provenance & Lineage Console</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Clauses N19.13–N19.23
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Immutable evidence lineage, AI assistance disclosures, and anti-surveillance compliance audits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded border border-cyan-500/30">
            Anti-Surveillance Active (Zero Webcam/Emotion)
          </span>
        </div>
      </div>

      {/* Evidence Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidenceItems.map((e) => (
          <div
            key={e.evidenceId}
            onClick={() => setSelectedEvidenceId(e.evidenceId)}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              selectedEvidenceId === e.evidenceId
                ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-slate-400">{e.evidenceId}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                {e.validityStatus}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mt-1">{e.skillName}</h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span>Type: <strong className="text-slate-300">{e.evidenceType}</strong></span>
              <span>Score: <strong className="text-emerald-400">{e.score}%</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Evidence Detail */}
      <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h3 className="text-base font-bold text-white">{current.skillName}</h3>
            <span className="text-xs font-mono text-slate-400">{current.evidenceId}</span>
          </div>
          <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
            {current.provenanceHash.substring(0, 24)}...
          </span>
        </div>

        {/* Quality Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Validity Score</span>
            <span className="text-lg font-bold text-emerald-400">{(current.quality.validityScore * 100).toFixed(0)}%</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Independence Rating</span>
            <span className="text-lg font-bold text-cyan-400">{(current.quality.independence * 100).toFixed(0)}%</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Assessment Rigor</span>
            <span className="text-lg font-bold text-indigo-400">{(current.quality.rigor * 100).toFixed(0)}%</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Recency</span>
            <span className="text-lg font-bold text-purple-400">{current.quality.recencyDays}d ago</span>
          </div>
        </div>

        {/* AI Assistance Disclosure Panel */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300">AI Assistance Disclosure (Clause N19.17)</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              current.aiDisclosure.assisted
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
            }`}>
              {current.aiDisclosure.assisted ? 'AI ASSISTED' : 'UNASSISTED WORK'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {current.aiDisclosure.assisted
              ? `AI contributed approximately ${current.aiDisclosure.percentage}% via ${current.aiDisclosure.type}. Disclosed per credential policy.`
              : 'Work performed independently with zero AI generation or prompt assistance.'}
          </p>
        </div>
      </div>
    </div>
  );
}
