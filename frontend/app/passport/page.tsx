'use client';

import React from 'react';
import { SkillsPassportWalletView } from '@/components/skills-credential/SkillsPassportWalletView';
import { CredentialVerificationPortal } from '@/components/skills-credential/CredentialVerificationPortal';
import { EvidenceProvenanceConsole } from '@/components/skills-credential/EvidenceProvenanceConsole';

export default function PassportPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              My Skills Passport & Credential Wallet
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Learner Owned
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-2 max-w-3xl">
            Your portable, verifiable credentials and demonstrated skills. Share your achievements with universities,
            employers, and platforms with zero PII exposure and complete privacy control.
          </p>
        </div>

        <SkillsPassportWalletView />
        <CredentialVerificationPortal />
        <EvidenceProvenanceConsole />
      </div>
    </div>
  );
}
