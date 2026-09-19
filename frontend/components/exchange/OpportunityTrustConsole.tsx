'use client';

import React, { useState } from 'react';

interface TrustSignal {
  providerId: string;
  providerName: string;
  verificationLevel: string;
  complaintRate: number;
  payTransparency: number;
  freshnessDays: number;
  isSuspended: boolean;
}

interface FraudReport {
  id: string;
  opportunityId: string;
  anomalyType: string;
  status: string;
  reportedAt: string;
}

interface AgentAction {
  actionId: string;
  agentId: string;
  actionType: string;
  status: string;
  authorized: boolean;
}

interface ExchangeRequest {
  id: string;
  learnerId: string;
  opportunityTitle: string;
  status: string;
  updatedAt: string;
}

export default function OpportunityTrustConsole() {
  const [trustSignals] = useState<TrustSignal[]>([
    {
      providerId: 'prov_deepmind_edu',
      providerName: 'DeepMind Educational Initiative',
      verificationLevel: 'ENTERPRISE_AUDITED',
      complaintRate: 0.0,
      payTransparency: 1.0,
      freshnessDays: 5,
      isSuspended: false,
    },
    {
      providerId: 'prov_youva_foundation',
      providerName: 'YOUVA Open Source Foundation',
      verificationLevel: 'INSTITUTION_ATTESTED',
      complaintRate: 0.01,
      payTransparency: 0.95,
      freshnessDays: 8,
      isSuspended: false,
    },
    {
      providerId: 'prov_global_skills_alliance',
      providerName: 'Global Skills Alliance',
      verificationLevel: 'COMMUNITY_VERIFIED',
      complaintRate: 0.03,
      payTransparency: 0.88,
      freshnessDays: 14,
      isSuspended: false,
    },
  ]);

  const [fraudReports, setFraudReports] = useState<FraudReport[]>([
    {
      id: 'fraud_981a2f',
      opportunityId: 'opp_unverified_intern_88',
      anomalyType: 'BAIT_AND_SWITCH',
      status: 'INVESTIGATING',
      reportedAt: '2026-09-18',
    },
  ]);

  const [agentActions] = useState<AgentAction[]>([
    {
      actionId: 'act_001',
      agentId: 'agent_learning_path_v2',
      actionType: 'RECOMMEND_OPPORTUNITY',
      status: 'EXECUTED',
      authorized: true,
    },
    {
      actionId: 'act_002',
      agentId: 'agent_application_scaffold',
      actionType: 'DRAFT_APPLICATION',
      status: 'PENDING_CONFIRMATION',
      authorized: true,
    },
  ]);

  const [exchangeRequests] = useState<ExchangeRequest[]>([
    {
      id: 'exch_4401',
      learnerId: 'learner_asha_402',
      opportunityTitle: 'Open Learning Research Fellowship in AI Safety',
      status: 'UNDER_REVIEW',
      updatedAt: '2026-09-19 11:30',
    },
    {
      id: 'exch_4402',
      learnerId: 'learner_rohit_811',
      opportunityTitle: 'Junior Web Accessibility & UI Apprenticeship',
      status: 'INTERVIEW_OFFERED',
      updatedAt: '2026-09-19 14:15',
    },
  ]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportOppId, setReportOppId] = useState('');
  const [reportType, setReportType] = useState('BAIT_AND_SWITCH');
  const [reportDesc, setReportDesc] = useState('');

  const handleCreateReport = () => {
    if (!reportOppId) return;
    const newReport: FraudReport = {
      id: `fraud_${Math.random().toString(36).substring(2, 8)}`,
      opportunityId: reportOppId,
      anomalyType: reportType,
      status: 'PENDING_REVIEW',
      reportedAt: new Date().toISOString().split('T')[0],
    };
    setFraudReports([newReport, ...fraudReports]);
    setReportOppId('');
    setReportDesc('');
    setShowReportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Governance Notice */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Invariant N22.19, N22.46 & N22.170: Non-Consequential AI Determination & Governed Trust
          </span>
          AI agents cannot execute binding legal contracts, negotiate salaries, auto-submit applications, or render consequential admissions/employment decisions. All transactions and reports are cryptographically audited.
        </div>
        <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-blue-950 text-blue-300 border border-blue-800 shrink-0">
          AUDIT ENFORCED
        </span>
      </div>

      {/* Fraud Report Modal */}
      {showReportModal && (
        <div className="bg-slate-900 border border-rose-600/50 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">File Transparent Anomaly / Fraud Report</h3>
          <p className="text-xs text-slate-400">
            Submit a non-accusatory anomaly report for review. Invariant N22.155 guarantees prompt, impartial investigation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Opportunity ID</label>
              <input
                type="text"
                placeholder="e.g. opp_data_reskilling_003"
                value={reportOppId}
                onChange={(e) => setReportOppId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Anomaly Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              >
                <option value="BAIT_AND_SWITCH">Bait and Switch Requirements</option>
                <option value="UNPAID_DECEPTIVE">Deceptive / Unpaid Exploitation</option>
                <option value="UNAUTHORIZED_DATA_COLLECTION">Unauthorized Data Harvesting</option>
                <option value="AI_FABRICATION">AI Artifact Fabrication Claim</option>
                <option value="EXPLOITATIVE_CONDITIONS">Exploitative Working Conditions</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Observed Anomaly Details</label>
            <textarea
              placeholder="Provide objective facts regarding the observed discrepancy..."
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 h-20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowReportModal(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateReport}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg"
            >
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* Grid: Trust Signals & Agent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Trust Signals */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Provider Trust Signals & Verification
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">3 Active</span>
          </div>

          <div className="space-y-2.5">
            {trustSignals.map((ts) => (
              <div key={ts.providerId} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-white">{ts.providerName}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">{ts.providerId}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-900">
                    {ts.verificationLevel}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Complaint Rate</span>
                    <span className="text-white font-mono">{ts.complaintRate * 100}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Pay Transparency</span>
                    <span className="text-emerald-400 font-mono">{ts.payTransparency * 100}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Avg Freshness</span>
                    <span className="text-white font-mono">{ts.freshnessDays} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governed Agent Actions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Governed Agent Actions (Non-Consequential)
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Sovereignty Protected</span>
          </div>

          <div className="space-y-2.5">
            {agentActions.map((act) => (
              <div key={act.actionId} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-blue-300 font-semibold">{act.actionType}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">{act.agentId}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-900">
                    {act.status}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Learner Consent Token Verified</span>
                  <span className="text-emerald-400 font-mono text-[10px]">AUTH_OK</span>
                </div>
              </div>
            ))}

            {/* Prohibited Actions Alert */}
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300">
              <span className="font-semibold block mb-0.5">Strictly Barred Agent Actions</span>
              <p className="text-[11px] text-rose-400 leading-relaxed font-mono">
                BIND_CONTRACT &bull; NEGOTIATE_SALARY &bull; AUTO_SUBMIT &bull; REJECT_APPLICANT
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fraud Reports & Exchange Requests Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud Reports */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Anomaly & Fraud Reports ({fraudReports.length})
            </h3>
            <button
              onClick={() => setShowReportModal(true)}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              + File Report
            </button>
          </div>

          <div className="space-y-2">
            {fraudReports.map((r) => (
              <div key={r.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-rose-400">{r.anomalyType}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">{r.opportunityId}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-900">
                    {r.status}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">Reported on {r.reportedAt}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exchange Requests */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Capability Exchange Requests ({exchangeRequests.length})
          </h3>

          <div className="space-y-2">
            {exchangeRequests.map((req) => (
              <div key={req.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-white">{req.opportunityTitle}</span>
                    <span className="block text-[10px] text-slate-500 font-mono">
                      Learner: {req.learnerId} &bull; ID: {req.id}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-900">
                    {req.status}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">Last updated: {req.updatedAt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
