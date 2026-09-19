'use client';

import React, { useState, useEffect } from 'react';

export interface CurriculumObjectiveMapping {
  curriculumId: string;
  objectiveText: string;
  mappedSkillId: string;
  mappedCapabilityId: string;
  confidence: number;
  qualitativeGapNote: string;
  evaluatedAt: string;
}

export default function CurriculumCrosswalkConsole() {
  const [crosswalk, setCrosswalk] = useState<CurriculumObjectiveMapping[]>([]);
  const [gaps, setGaps] = useState<any | null>(null);
  const [teacherInsights, setTeacherInsights] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const curriculumId = 'cur-cbse-cs-xii';

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/ecosystem/curriculum/${curriculumId}/crosswalk`).then((r) => r.json()),
      fetch(`/api/v1/ecosystem/curriculum/${curriculumId}/gaps`).then((r) => r.json()),
      fetch(`/api/v1/ecosystem/curriculum/${curriculumId}/teacher-insights`).then((r) => r.json()),
    ])
      .then(([crosswalkData, gapsData, insightsData]) => {
        if (Array.isArray(crosswalkData)) setCrosswalk(crosswalkData);
        setGaps(gapsData);
        setTeacherInsights(insightsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Curriculum Intelligence & Qualitative Gap Analysis</h2>
            <p className="text-xs text-slate-400">
              Clause N21.50: Qualitative Capability Analysis &bull; Clause N21.53: Non-Punitive Teacher Intelligence
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-cyan-950/70 text-cyan-300 border border-cyan-800 rounded-full">
            Curriculum: {curriculumId}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Objectives Crosswalk */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Learning Objective Crosswalk
          </h3>
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading crosswalk...</div>
          ) : (
            crosswalk.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-purple-400">{item.mappedCapabilityId}</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    Confidence: {Math.round(item.confidence * 100)}%
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">"{item.objectiveText}"</h4>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs text-slate-300">
                  <span className="text-amber-400 font-semibold block mb-0.5">Qualitative Gap Observation:</span>
                  {item.qualitativeGapNote}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Qualitative Gaps & Non-Punitive Teacher Development */}
        <div className="lg:col-span-5 space-y-4">
          {gaps && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Curriculum Qualitative Synthesis
              </h3>
              <div className="text-xs text-slate-400 space-y-1">
                <div>Total Objectives Mapped: <strong className="text-slate-200">{gaps.totalObjectives}</strong></div>
                <div>Avg Mapping Confidence: <strong className="text-emerald-400 font-mono">{gaps.averageMappingConfidence}</strong></div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 italic">
                {gaps.constitutionalDeclaration}
              </div>
            </div>
          )}

          {teacherInsights && (
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Pedagogical Misconception Insights
              </h3>
              {teacherInsights.insights.map((ins: any, i: number) => (
                <div key={i} className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-1.5">
                  <span className="font-semibold text-cyan-300 block">{ins.topic}</span>
                  <p className="text-slate-300 text-[11px]">{ins.misconceptionCluster}</p>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800/80 text-[11px] text-emerald-400">
                    <strong>Intervention:</strong> {ins.recommendedIntervention}
                  </div>
                </div>
              ))}
              <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 italic">
                {teacherInsights.nonPunitiveGuarantee}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
