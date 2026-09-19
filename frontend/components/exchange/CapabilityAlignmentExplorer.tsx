'use client';

import React, { useState } from 'react';

interface Requirement {
  name: string;
  minimumProficiency: string;
  isMandatory: boolean;
}

interface AlignmentState {
  opportunityTitle: string;
  alignmentPercentage: number;
  demonstrated: string[];
  gaps: string[];
  recommendedPreparation: string[];
  explanation: string;
}

export default function CapabilityAlignmentExplorer() {
  const [selectedLearner, setSelectedLearner] = useState('learner_asha_402');
  const [selectedOpportunity, setSelectedOpportunity] = useState('opp_ml_fellowship_001');
  const [alignment, setAlignment] = useState<AlignmentState>({
    opportunityTitle: 'Open Learning Research Fellowship in AI Safety',
    alignmentPercentage: 67,
    demonstrated: [
      'Capability: Python for Scientific Computing (Requires ADVANCED, Demonstrated: ADVANCED)',
      'Skill: NumPy & PyTorch (Requires Level 4, Demonstrated: Level 4)',
    ],
    gaps: [
      'Capability: Scholarly Research Synthesis (No validated evidence found for required INTERMEDIATE)',
      'Skill: Git Version Control (Requires Level 3, not demonstrated)',
    ],
    recommendedPreparation: [
      'Complete curriculum modules or peer-reviewed projects addressing Scholarly Research Synthesis.',
      'Acquire foundational proficiency in Git Version Control via recommended learning pathways.',
    ],
    explanation:
      'Empirical capability alignment: 2 of 3 requirements demonstrated. Consequential employment suitability or success prediction is constitutionally barred under YOUVA-N22-CHARTER-2026.',
  });

  const handleRecalculate = () => {
    // In real app calls /api/v1/capability-exchange/align
    if (selectedOpportunity === 'opp_frontend_apprenticeship_002') {
      setAlignment({
        opportunityTitle: 'Junior Web Accessibility & UI Apprenticeship',
        alignmentPercentage: 100,
        demonstrated: [
          'Capability: Frontend Web Development (Requires INTERMEDIATE, Demonstrated: ADVANCED)',
          'Skill: React / Next.js (Requires Level 3, Demonstrated: Level 4)',
        ],
        gaps: [],
        recommendedPreparation: [],
        explanation:
          'Empirical capability alignment: 2 of 2 requirements demonstrated. Consequential employment suitability or success prediction is constitutionally barred under YOUVA-N22-CHARTER-2026.',
      });
    } else {
      setAlignment({
        opportunityTitle: 'Open Learning Research Fellowship in AI Safety',
        alignmentPercentage: 67,
        demonstrated: [
          'Capability: Python for Scientific Computing (Requires ADVANCED, Demonstrated: ADVANCED)',
          'Skill: NumPy & PyTorch (Requires Level 4, Demonstrated: Level 4)',
        ],
        gaps: [
          'Capability: Scholarly Research Synthesis (No validated evidence found for required INTERMEDIATE)',
        ],
        recommendedPreparation: [
          'Complete curriculum modules or peer-reviewed projects addressing Scholarly Research Synthesis.',
        ],
        explanation:
          'Empirical capability alignment: 2 of 3 requirements demonstrated. Consequential employment suitability or success prediction is constitutionally barred under YOUVA-N22-CHARTER-2026.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Doctrine Banner */}
      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-start justify-between">
        <div>
          <span className="font-semibold text-blue-100 uppercase tracking-wider block mb-1">
            Constitutional Invariant N22.4 & N22.5: Evidence Over Prediction
          </span>
          YOUVA connects demonstrated capability with opportunities. The system computes explainable requirement overlap. It strictly prohibits scalar employability scores, success probabilities, or algorithmic life-outcome predictions.
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono text-[10px] ml-4 shrink-0">
          PROHIBITED: PREDICTIONS
        </span>
      </div>

      {/* Control Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Learner Profile</label>
          <select
            value={selectedLearner}
            onChange={(e) => setSelectedLearner(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
          >
            <option value="learner_asha_402">Asha Sharma (Passport #402)</option>
            <option value="learner_rohit_811">Rohit Verma (Passport #811)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Target Opportunity</label>
          <select
            value={selectedOpportunity}
            onChange={(e) => setSelectedOpportunity(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-100"
          >
            <option value="opp_ml_fellowship_001">Research Fellowship in AI Safety</option>
            <option value="opp_frontend_apprenticeship_002">Junior Web Accessibility Apprenticeship</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleRecalculate}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium p-2 rounded-lg text-xs transition-colors"
          >
            Evaluate Capability Alignment
          </button>
        </div>
      </div>

      {/* Alignment Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score & Explanation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Empirical Requirement Alignment</span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{alignment.alignmentPercentage}%</span>
              <span className="text-xs text-slate-500">of requirements demonstrated</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${alignment.alignmentPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-300 block mb-1">Audit Explanation</span>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">{alignment.explanation}</p>
          </div>
        </div>

        {/* Demonstrated vs Gaps */}
        <div className="lg:col-span-2 space-y-4">
          {/* Demonstrated */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Demonstrated Capabilities & Skills ({alignment.demonstrated.length})
            </h3>
            <div className="space-y-2">
              {alignment.demonstrated.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-200"
                >
                  {item}
                </div>
              ))}
              {alignment.demonstrated.length === 0 && (
                <p className="text-xs text-slate-500 italic">No matching demonstrated capabilities yet.</p>
              )}
            </div>
          </div>

          {/* Evidence Gaps & Preparation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Evidence Gaps & Recommended Preparation ({alignment.gaps.length})
            </h3>
            <div className="space-y-2">
              {alignment.gaps.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/50 text-xs text-amber-200"
                >
                  <div className="font-medium text-amber-100">{item}</div>
                  {alignment.recommendedPreparation[idx] && (
                    <div className="mt-1 text-[11px] text-amber-300/80">
                      Recommendation: {alignment.recommendedPreparation[idx]}
                    </div>
                  )}
                </div>
              ))}
              {alignment.gaps.length === 0 && (
                <p className="text-xs text-emerald-400">All opportunity requirements are fully demonstrated.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
