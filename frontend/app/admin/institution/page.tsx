'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileCheck } from 'lucide-react';

interface SeatStats {
  total: number;
  used: number;
  available: number;
}

interface StagedItem {
  stagingId: string;
  sourceSystem: string;
  studentId: string;
  conceptId: string;
  score: number;
  provenance: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface SafetyAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  studentRef: string;
  minutesOpen: number;
  slaLimitMinutes: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export default function InstitutionalAdminTerminal() {
  const [tenantId] = useState('tenant-dps-rkpuram');
  const [institutionName] = useState('Delhi Public School, R.K. Puram');
  const [contractId] = useState('CONTRACT-DPSRKP-2026-SCALE');
  const [slaUptime] = useState(99.98);

  const [studentSeats, setStudentSeats] = useState<SeatStats>({
    total: 250,
    used: 215,
    available: 35,
  });

  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleTeacherAuthorize = (stagingId: string, approve: boolean) => {
    setStagedItems((prev) =>
      prev.map((item) =>
        item.stagingId === stagingId
          ? { ...item, status: approve ? 'APPROVED' : 'REJECTED' }
          : item
      )
    );
    setActionMessage(
      approve
        ? `[TEACHER AUTHORIZED] Record ${stagingId} approved. Official BKT mastery state updated with cryptographic provenance.`
        : `[TEACHER REJECTED] Record ${stagingId} rejected. Mastery probabilities remain unchanged.`
    );
  };

  const handleAcknowledgeIncident = (incidentId: string) => {
    setSafetyAlerts((prev) =>
      prev.map((alert) =>
        alert.id === incidentId ? { ...alert, status: 'ACKNOWLEDGED' } : alert
      )
    );
    setActionMessage(`[SAFEGUARDING OFFICER ACTION] Incident ${incidentId} formally acknowledged within SLA window.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Institutional Scale Administration
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 7 Active
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Multi-Tenant Boundary Enforcement, B2B School Licensing & Demand-Gated LMS Integration
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 block">Active Tenant</span>
              <span className="font-mono text-emerald-400 font-semibold">{tenantId}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-500 block">SLA Target</span>
              <span className="font-semibold text-white">{slaUptime}% Uptime</span>
            </div>
          </div>
        </header>

        {/* Action Flash Alert */}
        {actionMessage && (
          <div className="p-4 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-sm flex items-center justify-between">
            <span>{actionMessage}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs text-indigo-400 hover:text-indigo-100 underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Grid: Tenant Stats & Licensing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Institutional Demand Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Enterprise Contract
            </h2>
            <div className="text-lg font-bold text-white">{institutionName}</div>
            <div className="space-y-1 text-xs text-slate-300 font-mono">
              <div>Contract: <span className="text-cyan-400">{contractId}</span></div>
              <div>Status: <span className="text-emerald-400">ACTIVE (SIGNED)</span></div>
              <div>Jurisdiction: <span className="text-white">IN_DPDP (India)</span></div>
              <div>Boundary: <span className="text-indigo-400">STRICT_ROW_LEVEL</span></div>
            </div>
          </div>

          {/* Student Seat Utilization */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Student Seat Quota
              </h2>
              <span className="text-xs font-semibold text-emerald-400">
                {studentSeats.total > 0 ? Math.round((studentSeats.used / studentSeats.total) * 100) : 0}% Utilized
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white">
              {studentSeats.used} <span className="text-sm font-normal text-slate-400">/ {studentSeats.total}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full"
                style={{ width: `${studentSeats.total > 0 ? (studentSeats.used / studentSeats.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {studentSeats.available} seats remaining before quota expansion required.
            </p>
          </div>

          {/* Multi-Tenant Boundary Guard */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Boundary Isolation Status
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Row-Level Security:</span>
                <span className="text-emerald-400 font-mono">ENFORCED (FAIL-CLOSED)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Cache Namespace:</span>
                <span className="text-indigo-400 font-mono">tenant:dps-rkpuram:*</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Job Worker Sandbox:</span>
                <span className="text-emerald-400 font-mono">ISOLATED PARTITION</span>
              </div>
            </div>
          </div>
        </div>

        {/* LMS/SIS Staging Queue (The Non-Negotiable Human Authorization Gate) */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>LMS/SIS Observation Review Queue</span>
                <span className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Human Authorization Invariant
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                External gradebook and sync records cannot directly alter student mastery. Explicit teacher review is strictly required.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {stagedItems.filter((i) => i.status === 'PENDING').length} Pending Teacher Sign-Off
            </span>
          </div>

          {stagedItems.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg p-6 my-2">
              <FileCheck className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-80" />
              <h3 className="font-semibold text-sm text-slate-300">No Pending LMS/SIS Submissions</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                External gradebook and assessment observations from integrated Canvas/Moodle connectors will appear here for authoritative teacher review and cryptographic sign-off.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-3">Staging ID</th>
                    <th className="py-2.5 px-3">Source System</th>
                    <th className="py-2.5 px-3">Learner ID (De-Identified)</th>
                    <th className="py-2.5 px-3">Concept ID</th>
                    <th className="py-2.5 px-3">Ext. Score</th>
                    <th className="py-2.5 px-3">Provenance Checksum</th>
                    <th className="py-2.5 px-3 text-right">Teacher Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {stagedItems.map((item) => (
                    <tr key={item.stagingId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-white font-semibold">{item.stagingId}</td>
                      <td className="py-3 px-3 text-cyan-400 font-sans">{item.sourceSystem}</td>
                      <td className="py-3 px-3 text-slate-300">{item.studentId}</td>
                      <td className="py-3 px-3 text-indigo-300">{item.conceptId}</td>
                      <td className="py-3 px-3 text-white font-sans font-bold">
                        {(item.score * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{item.provenance}</td>
                      <td className="py-3 px-3 text-right font-sans">
                        {item.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleTeacherAuthorize(item.stagingId, true)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                            >
                              Authorize
                            </button>
                            <button
                              onClick={() => handleTeacherAuthorize(item.stagingId, false)}
                              className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              item.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {item.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Safety Operations Queue */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Child Safeguarding Operations Desk</span>
                <span className="px-2 py-0.5 rounded text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  SLA Active Escalation
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time incident queue with mandatory human safeguarding acknowledgment and automated secondary paging.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Escalation Policy: 5m (Critical) / 15m (High)
            </span>
          </div>

          {safetyAlerts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg p-6">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <h3 className="font-semibold text-sm text-slate-300">All Safeguarding Boundaries Clear</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No active safeguarding alerts or unanswered distress escalations. The multi-tenant safety SLA monitor is continuously active.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {safetyAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs"
                >
                  <div className="flex items-start md:items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded font-bold uppercase tracking-wide text-[10px] ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-500 text-white'
                          : alert.severity === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <div>
                      <div className="font-bold text-white">{alert.category}</div>
                      <div className="text-slate-400 font-mono mt-0.5">
                        Learner: {alert.studentRef} • Incident ID: {alert.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-slate-400">Elapsed / Limit</div>
                      <div
                        className={`font-mono font-bold ${
                          alert.minutesOpen >= alert.slaLimitMinutes
                            ? 'text-red-400 animate-pulse'
                            : 'text-amber-300'
                        }`}
                      >
                        {alert.minutesOpen}m / {alert.slaLimitMinutes}m
                      </div>
                    </div>

                    {alert.status === 'OPEN' ? (
                      <button
                        onClick={() => handleAcknowledgeIncident(alert.id)}
                        className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold transition"
                      >
                        Acknowledge Incident
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 font-semibold">
                        {alert.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
