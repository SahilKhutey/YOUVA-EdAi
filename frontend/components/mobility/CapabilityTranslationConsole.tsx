'use client';

import React, { useState } from 'react';

interface MappingItem {
  mappingId: string;
  sourceInstitution: string;
  sourceCapabilityCode: string;
  sourceCapabilityName: string;
  targetInstitution: string;
  targetCapabilityCode: string;
  targetCapabilityName: string;
  commonOntologyCode: string;
  confidence: number;
  reviewStatus: string;
  version: string;
  transferTaskRequired: boolean;
}

const SAMPLE_MAPPINGS: MappingItem[] = [
  {
    mappingId: 'map_du_mit_01',
    sourceInstitution: 'Delhi University',
    sourceCapabilityCode: 'DU_CS_201_DATA_STRUCTURES',
    sourceCapabilityName: 'Data Structures & Algorithms in C++',
    targetInstitution: 'MIT Open Learning',
    targetCapabilityCode: 'MIT_6_006_ALG',
    targetCapabilityName: 'Introduction to Algorithms',
    commonOntologyCode: 'ONT_CS_ALGORITHMS_CORE',
    confidence: 0.92,
    reviewStatus: 'VERIFIED',
    version: '2026.1',
    transferTaskRequired: false,
  },
  {
    mappingId: 'map_cbse_cie_02',
    sourceInstitution: 'CBSE India',
    sourceCapabilityCode: 'CBSE_XII_PHYSICS_EM',
    sourceCapabilityName: 'Electromagnetism & Wave Optics',
    targetInstitution: 'Cambridge Assessment',
    targetCapabilityCode: 'CIE_A_LEVEL_PHYS_9702',
    targetCapabilityName: 'A-Level Physics Electromagnetics',
    commonOntologyCode: 'ONT_PHYS_ELECTROMAGNETISM',
    confidence: 0.88,
    reviewStatus: 'VERIFIED',
    version: '2026.1',
    transferTaskRequired: false,
  },
  {
    mappingId: 'map_voc_iitm_03',
    sourceInstitution: 'Vocational IT Council',
    sourceCapabilityCode: 'VOC_CLOUD_SYSADMIN',
    sourceCapabilityName: 'Practical Cloud Linux Administration',
    targetInstitution: 'IIT Madras BSc',
    targetCapabilityCode: 'IITM_CS_SYS_ARCH',
    targetCapabilityName: 'Operating Systems & Cloud Architecture',
    commonOntologyCode: 'ONT_CS_CLOUD_SYSTEMS',
    confidence: 0.74,
    reviewStatus: 'VERIFIED',
    version: '2026.1',
    transferTaskRequired: true,
  },
];

export default function CapabilityTranslationConsole() {
  const [mappings] = useState<MappingItem[]>(SAMPLE_MAPPINGS);
  const [selectedMapping, setSelectedMapping] = useState<MappingItem>(SAMPLE_MAPPINGS[0]);
  const [transferScore, setTransferScore] = useState<number>(75);
  const [evalResult, setEvalResult] = useState<{ validated: boolean; text: string } | null>(null);

  const handleEvaluateTransfer = () => {
    const validated = transferScore >= 70;
    setEvalResult({
      validated,
      text: validated
        ? `Transfer Task Validated (${transferScore}/100). Empirical cross-domain transfer confirmed by independent assessor.`
        : `Transfer Task Insufficient (${transferScore}/100). Minimum threshold is 70. Additional applied practice required.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Doctrine Notice */}
      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-start justify-between">
        <div>
          <span className="font-semibold text-blue-100 uppercase tracking-wider block mb-1">
            Constitutional Invariant N23.16 & N23.19: No False Equivalence & Empirical Transfer
          </span>
          Two capabilities with similar titles are never automatically equivalent. Mappings require verified scope, evidence, and confidence. Cross-domain capability transfer must be demonstrated through empirical tasks, not assumed.
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono text-[10px] ml-4 shrink-0">
          ONTOLOGY GOVERNED
        </span>
      </div>

      {/* Main Grid: Mappings Directory & Translation Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mappings List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Crosswalk Mappings ({mappings.length})
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Common Ontology Active</span>
          </div>

          <div className="space-y-2">
            {mappings.map((m) => (
              <div
                key={m.mappingId}
                onClick={() => {
                  setSelectedMapping(m);
                  setEvalResult(null);
                }}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedMapping.mappingId === m.mappingId
                    ? 'bg-blue-950/50 border-blue-600/80 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium">{m.sourceCapabilityName}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-blue-300 border border-slate-800">
                    {Math.round(m.confidence * 100)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {m.sourceInstitution} &rarr; {m.targetInstitution}
                </div>
                {m.transferTaskRequired && (
                  <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-900">
                    TRANSFER TASK REQUIRED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Mapping Detail & Transfer Task Simulator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detail Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                  Mapping ID: {selectedMapping.mappingId} &bull; Version {selectedMapping.version}
                </span>
                <h2 className="text-base font-bold text-white mt-1">
                  {selectedMapping.sourceCapabilityName} &harr; {selectedMapping.targetCapabilityName}
                </h2>
              </div>
              <span className="px-2 py-1 rounded text-xs font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {selectedMapping.reviewStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Source Spec</span>
                <div className="text-white font-semibold">{selectedMapping.sourceInstitution}</div>
                <div className="text-slate-400 font-mono text-[11px]">{selectedMapping.sourceCapabilityCode}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-medium">Target Spec</span>
                <div className="text-white font-semibold">{selectedMapping.targetInstitution}</div>
                <div className="text-slate-400 font-mono text-[11px]">{selectedMapping.targetCapabilityCode}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500 block text-[10px]">Common Capability Ontology</span>
                <span className="font-mono text-blue-300 font-medium">{selectedMapping.commonOntologyCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Confidence</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {Math.round(selectedMapping.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Transfer Task Evaluator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Empirical Transfer Task Evaluator (Invariant N23.20)
            </h3>
            <p className="text-xs text-slate-400">
              When cross-institutional mapping confidence is below 0.85 or requires cross-context demonstration, the learner submits a transfer task evaluated by an authorized assessor.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Demonstrated Transfer Task Score (0–100): <span className="font-mono text-white">{transferScore}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={transferScore}
                  onChange={(e) => setTransferScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleEvaluateTransfer}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                Evaluate Transfer Task
              </button>

              {evalResult && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    evalResult.validated
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-800 text-rose-200'
                  }`}
                >
                  {evalResult.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
