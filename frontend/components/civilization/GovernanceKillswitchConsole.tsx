'use client';

import React, { useState } from 'react';

interface KillSwitchState {
  id: string;
  name: string;
  desc: string;
  isTripped: boolean;
  trippedBy?: string;
  reason?: string;
}

const INITIAL_SWITCHES: KillSwitchState[] = [
  { id: 'AI_AUTONOMY', name: 'AI Autonomy Runtime', desc: 'Autonomous prompt orchestration, proactive interventions', isTripped: false },
  { id: 'SAFETY_SENSITIVE', name: 'Safety-Sensitive Operations', desc: 'Child safety filters, crisis detection and escalation', isTripped: false },
  { id: 'CREDENTIAL_ISSUANCE', name: 'Credential & Badge Issuance', desc: 'Cryptographic badge signing, portable credential minting', isTripped: false },
  { id: 'OPPORTUNITY_EXCHANGE', name: 'Opportunity Matching & Routing', desc: 'Internship, project, and scholarship discovery matching', isTripped: false },
  { id: 'MENTOR_NETWORK', name: 'Human Mentor Matching', desc: 'Peer-to-peer and mentor-learner routing mesh', isTripped: false },
  { id: 'EXTERNAL_INTEGRATIONS', name: 'External LTI / API Connectors', desc: 'Third-party LMS, canvas, and school system connectors', isTripped: false },
  { id: 'COMMUNITY_FEATURES', name: 'Community Knowledge Exchange', desc: 'Public forums, collective artifact repositories', isTripped: false },
  { id: 'RESEARCH_ACCESS', name: 'Academic Research Sandbox', desc: 'De-identified aggregate research analytics pipelines', isTripped: false },
  { id: 'ECOSYSTEM_ANALYTICS', name: 'Macro Ecosystem Telemetry', desc: 'Global learning flow metrics and capacity monitors', isTripped: false },
];

const PROHIBITED_AI_DECISIONS = [
  { name: 'Human Potential Ranking', rule: 'Ranking or scoring human innate potential, talent ceiling, or intelligence limits is permanently barred.' },
  { name: 'Human Worth / Value Metric', rule: 'Calculating societal value, economic worth, or human utility scores is unconstitutional.' },
  { name: 'Consequential Employment Hiring/Firing', rule: 'Direct employment, promotion, hiring or termination decisions cannot be automated by AI.' },
  { name: 'Mastery Override', rule: 'AI cannot unilaterally override human teacher judgment or demonstrated mastery evidence.' },
  { name: 'Unconsented Surveillance Profiling', rule: 'Continuous emotion, attention, or biometric profiling without explicit affirmative consent is prohibited.' },
  { name: 'Autonomous Credential Revocation', rule: 'Credentials cannot be revoked without independent human panel due-process review.' },
  { name: 'Irreversible Life Decisions', rule: 'Any recommendation dictating career, educational path, or destiny must remain human-advised.' },
];

export default function GovernanceKillswitchConsole() {
  const [switches, setSwitches] = useState<KillSwitchState[]>(INITIAL_SWITCHES);
  const [globalLocked, setGlobalLocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'KILLSWITCH' | 'AUTHORITY_MATRIX' | 'INCIDENTS'>('KILLSWITCH');

  const handleToggleSwitch = (id: string) => {
    setSwitches((prev) =>
      prev.map((sw) => {
        if (sw.id === id) {
          const nextTripped = !sw.isTripped;
          return {
            ...sw,
            isTripped: nextTripped,
            trippedBy: nextTripped ? 'GovCouncil-OpSec' : undefined,
            reason: nextTripped ? 'Precautionary containment drill' : undefined,
          };
        }
        return sw;
      }),
    );
  };

  const handleGlobalEmergency = () => {
    const nextState = !globalLocked;
    setGlobalLocked(nextState);
    setSwitches((prev) =>
      prev.map((sw) => ({
        ...sw,
        isTripped: nextState,
        trippedBy: nextState ? 'EMERGENCY_COUNCIL' : undefined,
        reason: nextState ? 'GLOBAL EMERGENCY LOCKDOWN TRIGGERED' : undefined,
      })),
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800">
              Clauses N∞.10 &amp; N∞.39
            </span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded ${
                globalLocked
                  ? 'bg-rose-900 text-white animate-pulse font-bold'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {globalLocked ? 'GLOBAL LOCKDOWN ACTIVE' : 'SYSTEM OPERATIONAL'}
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-1 text-white tracking-tight">
            Governance, Kill Switches &amp; AI Authority Matrix
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Permanent civilizational bounds: AI Capability ≠ AI Authority. 9 Subsystem Kill Switches.
          </p>
        </div>

        {/* Global Emergency Button & Tab Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGlobalEmergency}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg ${
              globalLocked
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-950/50'
            }`}
          >
            {globalLocked ? 'RESET GLOBAL EMERGENCY' : 'TRIP GLOBAL EMERGENCY'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('KILLSWITCH')}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
            activeTab === 'KILLSWITCH' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          9 Subsystem Kill Switches
        </button>
        <button
          onClick={() => setActiveTab('AUTHORITY_MATRIX')}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
            activeTab === 'AUTHORITY_MATRIX' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Authority Matrix (Barred Decisions)
        </button>
        <button
          onClick={() => setActiveTab('INCIDENTS')}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
            activeTab === 'INCIDENTS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          8-Stage Incident Lifecycle
        </button>
      </div>

      {activeTab === 'KILLSWITCH' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {switches.map((sw) => (
            <div
              key={sw.id}
              className={`p-4 rounded-lg border transition ${
                sw.isTripped
                  ? 'bg-rose-950/30 border-rose-700/60'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    sw.isTripped
                      ? 'bg-rose-900 text-rose-200'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {sw.isTripped ? 'TRIPPED (DISABLED)' : 'ACTIVE (ONLINE)'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{sw.id}</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">{sw.name}</h4>
              <p className="text-xs text-slate-400 mb-4 h-10">{sw.desc}</p>

              <button
                onClick={() => handleToggleSwitch(sw.id)}
                className={`w-full py-2 rounded text-xs font-semibold transition border ${
                  sw.isTripped
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                    : 'bg-rose-950/60 hover:bg-rose-900/80 border-rose-800 text-rose-300'
                }`}
              >
                {sw.isTripped ? 'Reset Kill Switch' : 'Trip Kill Switch'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'AUTHORITY_MATRIX' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
            <strong>Constitutional Invariant:</strong> Under Clause N∞.10, the following decision categories are
            strictly barred from automated AI execution. Every attempt triggers immediate rejection and governance escalation.
          </div>
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
            {PROHIBITED_AI_DECISIONS.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-950/40 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-rose-400 font-mono">PROHIBITED</span>
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                  </div>
                  <p className="text-xs text-slate-300">{item.rule}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 whitespace-nowrap">
                  ZERO AI AUTHORITY
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'INCIDENTS' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">
              8-Stage Incident Response Sequence (Clause N∞.40)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-9 gap-2 text-center text-xs">
              {[
                'DECLARED',
                'TRIAGED',
                'CONTAINED',
                'MITIGATED',
                'RECOVERED',
                'VERIFIED',
                'CLOSED',
                'POSTMORTEM',
                'IMPROVED',
              ].map((stage, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-mono">Stage {idx + 1}</div>
                  <div className="font-semibold text-slate-300 truncate">{stage}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200">Active Incident Queue:</span>
              <span className="text-emerald-400 font-mono">0 Active Incidents (All Systems Nominal)</span>
            </div>
            <p>
              When an incident is declared, it traverses the 8-stage sequence with mandatory actor audit logs,
              postmortem URI publication, and systemic action item tracking.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
