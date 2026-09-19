'use client';

import React, { useState } from 'react';

interface SkillNode {
  skillId: string;
  canonicalName: string;
  domain: string;
  level: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  description: string;
  evidenceRequirements: string[];
  prerequisites?: string[];
  changeHistoryCount: number;
}

interface CrosswalkResult {
  sourceSkillId: string;
  targetSkillId: string;
  sourceTaxonomy: string;
  targetTaxonomy: string;
  equivalenceLevel: 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'RELATED' | 'NO_MATCH';
  confidenceScore: number;
  mappingRationale: string;
}

export function SkillsGraphExplorer() {
  const [selectedSkillId, setSelectedSkillId] = useState<string>('SKILL-MATH-CALC-DIFF');

  const skills: SkillNode[] = [
    {
      skillId: 'SKILL-MATH-CALC-DIFF',
      canonicalName: 'Differential Calculus & Chain Rule',
      domain: 'Mathematics',
      level: 'ADVANCED',
      version: '1.2.0',
      status: 'ACTIVE',
      description: 'Demonstrated mastery of finding derivatives of composite functions using the chain rule.',
      evidenceRequirements: [
        'min_3_transfer_problems_correct',
        'explain_inner_outer_derivatives',
      ],
      changeHistoryCount: 2,
    },
    {
      skillId: 'SKILL-CS-ALGO-RECUR',
      canonicalName: 'Recursive Algorithms & Call Stack Reasoning',
      domain: 'Computer Science',
      level: 'INTERMEDIATE',
      version: '1.0.0',
      status: 'ACTIVE',
      description: 'Formulating recursive solutions, verifying base cases, and tracing stack frame allocations.',
      evidenceRequirements: [
        'pass_recursive_unit_tests',
        'stack_overflow_prevention_audit',
      ],
      changeHistoryCount: 1,
    },
    {
      skillId: 'SKILL-PHYS-NEWTON-DYN',
      canonicalName: 'Newtonian Dynamics & Free Body Analysis',
      domain: 'Physics',
      level: 'INTERMEDIATE',
      version: '1.1.0',
      status: 'ACTIVE',
      description: 'Constructing free-body diagrams, applying Newton’s laws to coupled systems, and resolving force vectors.',
      evidenceRequirements: [
        'vector_decomposition_accuracy_ge_85',
        'friction_normal_force_transfer',
      ],
      changeHistoryCount: 2,
    },
  ];

  const crosswalks: CrosswalkResult[] = [
    {
      sourceSkillId: 'EXT-CBSE-MATH-XII-DIFF',
      targetSkillId: 'SKILL-MATH-CALC-DIFF',
      sourceTaxonomy: 'CBSE-XII-2026',
      targetTaxonomy: 'YOUVA-CANONICAL',
      equivalenceLevel: 'STRONG_MATCH',
      confidenceScore: 0.94,
      mappingRationale: 'Identical syllabus coverage on composite function derivatives and chain rule.',
    },
    {
      sourceSkillId: 'EXT-AP-CS-A-RECURSION',
      targetSkillId: 'SKILL-CS-ALGO-RECUR',
      sourceTaxonomy: 'COLLEGE-BOARD-AP-CSA',
      targetTaxonomy: 'YOUVA-CANONICAL',
      equivalenceLevel: 'STRONG_MATCH',
      confidenceScore: 0.96,
      mappingRationale: 'Direct match for AP CS A Unit 10 Recursion learning objectives.',
    },
    {
      sourceSkillId: 'EXT-IB-HL-PHYSICS-FORCES',
      targetSkillId: 'SKILL-PHYS-NEWTON-DYN',
      sourceTaxonomy: 'IB-DP-HL-PHYSICS',
      targetTaxonomy: 'YOUVA-CANONICAL',
      equivalenceLevel: 'PARTIAL_MATCH',
      confidenceScore: 0.78,
      mappingRationale: 'Covers Newton dynamics but IB HL requires rotational inertia which is in subskill.',
    },
  ];

  const currentSkill = skills.find((s) => s.skillId === selectedSkillId) || skills[0];
  const matchingCrosswalks = crosswalks.filter((c) => c.targetSkillId === currentSkill.skillId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">Global Skills Graph & Crosswalk Explorer</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Clauses N19.4–N19.12
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Canonical competency ontology, historical version preservation, and cross-institutional taxonomy crosswalks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded border border-emerald-500/30">
            Skill &ne; Course &ne; Credential
          </span>
        </div>
      </div>

      {/* Skill Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <button
            key={s.skillId}
            onClick={() => setSelectedSkillId(s.skillId)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedSkillId === s.skillId
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            {s.canonicalName} ({s.domain})
          </button>
        ))}
      </div>

      {/* Skill Detail Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-4 md:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono text-cyan-400">{currentSkill.skillId}</span>
              <h3 className="text-lg font-bold text-white mt-0.5">{currentSkill.canonicalName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                v{currentSkill.version}
              </span>
              <span className="text-[11px] font-bold bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                {currentSkill.status}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-300">{currentSkill.description}</p>

          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">Evidence Requirements:</span>
            <ul className="space-y-1">
              {currentSkill.evidenceRequirements.map((req) => (
                <li key={req} className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span className="font-mono text-slate-300">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Crosswalk Mappings Card */}
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
          <span className="text-xs font-semibold text-slate-300 block">
            Institutional Crosswalks (Clause N19.9)
          </span>

          {matchingCrosswalks.length === 0 ? (
            <p className="text-xs text-slate-500">No external mappings registered for this skill.</p>
          ) : (
            <div className="space-y-3">
              {matchingCrosswalks.map((cw) => (
                <div key={cw.sourceSkillId} className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-slate-400 truncate max-w-[140px]">{cw.sourceTaxonomy}</span>
                    <span className="font-bold text-emerald-400 font-mono text-[11px]">
                      {(cw.confidenceScore * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-200">{cw.equivalenceLevel}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{cw.mappingRationale}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
