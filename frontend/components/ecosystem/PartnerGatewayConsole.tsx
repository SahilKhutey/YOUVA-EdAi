'use client';

import React, { useState, useEffect } from 'react';

export interface EcosystemPartner {
  partnerId: string;
  organizationId: string;
  name: string;
  partnerType: string;
  status: string;
  scopes: string[];
  registeredAt: string;
  updatedAt: string;
}

export default function PartnerGatewayConsole() {
  const [partners, setPartners] = useState<EcosystemPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<EcosystemPartner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/ecosystem/partners')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPartners(data);
          if (data.length > 0) setSelectedPartner(data[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleOffboard = async (partnerId: string) => {
    try {
      const res = await fetch(`/api/v1/ecosystem/partners/${partnerId}/offboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Governance review offboarding' }),
      });
      if (res.ok) {
        const data = await res.json();
        setPartners((prev) =>
          prev.map((p) => (p.partnerId === partnerId ? { ...p, status: 'OFFBOARDED' } : p))
        );
        if (selectedPartner?.partnerId === partnerId) {
          setSelectedPartner({ ...selectedPartner, status: 'OFFBOARDED' });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Ecosystem Partner Gateway & Scoped Authorization</h2>
          <p className="text-xs text-slate-400">
            Least Privilege (N21.24) | Offboarding Decoupling (N21.129): Learner credentials survive partner departures.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-purple-950/70 text-purple-300 border border-purple-800 rounded-full">
          Total Partners: {partners.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Partners List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered Partners</h3>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading partners...</div>
          ) : (
            partners.map((p) => (
              <div
                key={p.partnerId}
                onClick={() => setSelectedPartner(p)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedPartner?.partnerId === p.partnerId
                    ? 'bg-purple-950/20 border-purple-500/80 shadow-md'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-purple-400">{p.partnerType}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">{p.name}</h4>
                <div className="mt-2 text-[11px] text-slate-400 font-mono">Org: {p.organizationId}</div>
              </div>
            ))
          )}
        </div>

        {/* Selected Partner Inspector */}
        <div className="lg:col-span-7">
          {selectedPartner ? (
            <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>{selectedPartner.partnerId}</span>
                  <span>{selectedPartner.partnerType}</span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">{selectedPartner.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Org: {selectedPartner.organizationId}</p>
              </div>

              {/* Scopes */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Authorized Scopes (Zero Wildcards):</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPartner.scopes.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-purple-800/40 text-[11px] font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Offboarding & Independence Assurance */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
                <span className="font-semibold text-slate-200 block">Clause N21.129 Decoupling Guarantee</span>
                <p className="text-slate-400 text-[11px]">
                  If this partner is offboarded, their API keys are revoked instantly. All credentials and verified evidence issued to learners remain immutable and valid in the learner's Skills Passport.
                </p>
                {selectedPartner.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleOffboard(selectedPartner.partnerId)}
                    className="mt-2 px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700 text-rose-300 rounded text-xs font-medium transition-all"
                  >
                    Offboard Partner & Revoke API Access
                  </button>
                )}
                {selectedPartner.status === 'OFFBOARDED' && (
                  <div className="text-rose-400 font-mono text-[11px]">Status: Access Revoked. Credentials Preserved.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500 border border-slate-800 rounded-xl">
              Select a partner to inspect scopes and lifecycle controls.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
