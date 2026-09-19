'use client';

import React, { useState } from 'react';

interface OpportunityCard {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  description: string;
  type: string;
  location: string;
  compensation: string;
  isMinorEligible: boolean;
  requiresParentalConsent: boolean;
  isSponsored: boolean;
  freshnessScore: number;
  capabilities: string[];
}

const SAMPLE_OPPORTUNITIES: OpportunityCard[] = [
  {
    id: 'opp_ml_fellowship_001',
    providerId: 'prov_deepmind_edu',
    providerName: 'DeepMind Educational Initiative',
    title: 'Open Learning Research Fellowship in AI Safety',
    description: 'Guided research residency focusing on mechanistic interpretability and learning science.',
    type: 'FELLOWSHIP',
    location: 'Remote',
    compensation: 'Grant: $5,000 - $8,000',
    isMinorEligible: true,
    requiresParentalConsent: false,
    isSponsored: false,
    freshnessScore: 1.0,
    capabilities: ['Python for Scientific Computing', 'Scholarly Research Synthesis'],
  },
  {
    id: 'opp_frontend_apprenticeship_002',
    providerId: 'prov_youva_foundation',
    providerName: 'YOUVA Open Source Foundation',
    title: 'Junior Web Accessibility & UI Apprenticeship',
    description: 'Hands-on guided apprenticeship building WCAG AAA accessible user interfaces.',
    type: 'APPRENTICESHIP',
    location: 'Hybrid (Bangalore, India)',
    compensation: 'Stipend: ₹25,000 - ₹35,000/mo',
    isMinorEligible: true,
    requiresParentalConsent: true,
    isSponsored: false,
    freshnessScore: 0.95,
    capabilities: ['Frontend Web Development', 'Web Accessibility (ARIA)'],
  },
  {
    id: 'opp_data_reskilling_003',
    providerId: 'prov_global_skills_alliance',
    providerName: 'Global Skills Alliance',
    title: 'Cloud Data Engineering Reskilling Program',
    description: 'Structured intensive cohort for mid-career professionals transitioning into data engineering.',
    type: 'RESKILLING',
    location: 'Remote',
    compensation: 'Bounty: Per Completed Milestone',
    isMinorEligible: false,
    requiresParentalConsent: false,
    isSponsored: true, // Sponsored placement
    freshnessScore: 0.88,
    capabilities: ['SQL & Data Modeling', 'PostgreSQL'],
  },
  {
    id: 'opp_mentorship_004',
    providerId: 'prov_peer_academy',
    providerName: 'Peer Academy Network',
    title: 'Cognitive Modeling Peer Mentorship',
    description: '1-on-1 weekly mentorship matching advanced researchers with emerging cognitive science students.',
    type: 'MENTORSHIP',
    location: 'Remote',
    compensation: 'Volunteer / Knowledge Exchange',
    isMinorEligible: true,
    requiresParentalConsent: false,
    isSponsored: false,
    freshnessScore: 0.92,
    capabilities: ['Cognitive Learning Theory', 'Empathetic Peer Review'],
  },
];

const ARCHETYPES = [
  'ALL',
  'LEARNING',
  'PROJECT',
  'MENTORSHIP',
  'INTERNSHIP',
  'APPRENTICESHIP',
  'RESEARCH',
  'VOLUNTEER',
  'FREELANCE',
  'EMPLOYMENT',
  'ENTREPRENEURSHIP',
  'RESKILLING',
  'FELLOWSHIP',
];

export default function OpportunityNetworkPortal() {
  const [selectedType, setSelectedType] = useState('ALL');
  const [minorOnly, setMinorOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = SAMPLE_OPPORTUNITIES.filter((opp) => {
    if (selectedType !== 'ALL' && opp.type !== selectedType) return false;
    if (minorOnly && !opp.isMinorEligible) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        opp.title.toLowerCase().includes(q) ||
        opp.providerName.toLowerCase().includes(q) ||
        opp.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Zero Pay-to-Win Invariant Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-white block mb-0.5">
            Invariant N22.114: Zero Pay-to-Win Matching & Transparent Opportunity Directory
          </span>
          All 12 opportunity archetypes are evaluated strictly on demonstrated capability alignment. Sponsored opportunities are labeled and cannot purchase ranking priority.
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
            12 ARCHETYPES
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
            MINOR SAFEGUARDS
          </span>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by title, organization, or capability requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={minorOnly}
                onChange={(e) => setMinorOnly(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700"
              />
              <span>Minor Eligible Only (Enhanced Safeguards)</span>
            </label>
          </div>
        </div>

        {/* Archetype Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {ARCHETYPES.map((arch) => (
            <button
              key={arch}
              onClick={() => setSelectedType(arch)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                selectedType === arch
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {arch}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((opp) => (
          <div
            key={opp.id}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-900">
                      {opp.type}
                    </span>
                    {opp.isSponsored && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                        SPONSORED
                      </span>
                    )}
                    {opp.isMinorEligible && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                        MINOR SAFE
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5">{opp.title}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{opp.providerName}</div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono block">Freshness</span>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {Math.round(opp.freshnessScore * 100)}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">{opp.description}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>
                  <span className="text-slate-500">Location:</span> {opp.location}
                </div>
                <div>
                  <span className="text-slate-500">Compensation:</span> {opp.compensation}
                </div>
              </div>

              {opp.requiresParentalConsent && (
                <div className="mt-2 text-[10px] text-amber-400/90 font-mono">
                  Requires verified parental/institutional consent
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Required Capabilities
                </span>
                <div className="flex flex-wrap gap-1">
                  {opp.capabilities.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
                Apply with Passport
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-xs">
            No opportunities match the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
}
