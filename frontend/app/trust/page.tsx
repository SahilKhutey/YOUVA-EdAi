import React from 'react';
import { InstitutionalTrustCenter } from '@/components/institutional/InstitutionalTrustCenter';

export const metadata = {
  title: 'Institutional Trust Center | YOUVA-EdAI',
  description: 'Verified product claims, independent security audit ledgers, and regulatory compliance attestations.',
};

export default function TrustCenterPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Institutional Trust Center</h1>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Milestone N16 Permanent Trust
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-3xl">
            YOUVA-EdAI adheres to the core governing doctrine: No claims without empirical evidence; no infrastructure without demonstrated demand; no consequential AI decisions without human authorization.
          </p>
        </header>

        <InstitutionalTrustCenter />
      </div>
    </main>
  );
}
