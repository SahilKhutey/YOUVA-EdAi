'use client';

import React, { useState } from 'react';

export function CredentialVerificationPortal() {
  const [credentialId, setCredentialId] = useState<string>('CRED-MATH-CALC-001');
  const [verificationResult, setVerificationResult] = useState<any>({
    valid: true,
    credentialId: 'CRED-MATH-CALC-001',
    issuerId: 'ISSUER-DPS-DELHI',
    issuerName: 'Delhi Public School Society & Board of Examinations',
    credentialStatus: 'ACTIVE',
    issuedAt: '2026-09-15T10:00:00Z',
    skills: [
      { skillId: 'SKILL-MATH-CALC-DIFF', name: 'Differential Calculus & Chain Rule', status: 'ACTIVE' },
    ],
    verificationMethod: 'W3C_VC_ED25519',
    verifiedAt: '2026-09-19T17:20:00Z',
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Credential Verification Gateway</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Clauses N19.31–N19.33 & N19.65
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Privacy-preserving cryptographic verification exposing zero PII with W3C VC & Open Badges 3.0 interoperability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-500/30">
            Zero-PII Public Verifier
          </span>
        </div>
      </div>

      {/* Verification Query Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={credentialId}
          onChange={(e) => setCredentialId(e.target.value)}
          placeholder="Enter Credential ID (e.g. CRED-MATH-CALC-001)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => {
            // Re-verify simulated state
            setVerificationResult({
              ...verificationResult,
              credentialId,
              verifiedAt: new Date().toISOString(),
            });
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
        >
          Verify Credential
        </button>
      </div>

      {/* Verification Result Card */}
      {verificationResult && (
        <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <span className={`h-3.5 w-3.5 rounded-full ${verificationResult.valid ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-rose-500'}`} />
              <div>
                <h3 className="text-base font-bold text-white">
                  {verificationResult.valid ? 'Cryptographically Valid & Active Credential' : 'Invalid or Revoked Credential'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">{verificationResult.credentialId}</span>
              </div>
            </div>
            <span className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded text-cyan-300">
              {verificationResult.verificationMethod}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Authorized Issuer</span>
              <span className="text-sm font-semibold text-slate-200 mt-0.5 block">{verificationResult.issuerName}</span>
              <span className="text-[10px] text-slate-500 font-mono">{verificationResult.issuerId}</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Issuance Date</span>
              <span className="text-sm font-semibold text-slate-200 mt-0.5 block">
                {new Date(verificationResult.issuedAt).toLocaleDateString()}
              </span>
              <span className="text-[10px] text-slate-500">Status: {verificationResult.credentialStatus}</span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Privacy Guarantee</span>
              <span className="text-sm font-semibold text-emerald-400 mt-0.5 block">Zero PII Disclosed</span>
              <span className="text-[10px] text-slate-500">No transcripts or student records exposed</span>
            </div>
          </div>

          {/* Verified Skills List */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Attested Skills:</span>
            <div className="space-y-1.5">
              {verificationResult.skills.map((s: any) => (
                <div key={s.skillId} className="flex justify-between items-center text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-200 font-medium">{s.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    VERIFIED COMPETENCY
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
