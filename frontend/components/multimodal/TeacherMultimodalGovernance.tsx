"use client";

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ShieldCheck,
  FileCheck,
  Image as ImageIcon,
  Headphones,
  Video,
} from 'lucide-react';

export interface PendingMediaAssetItem {
  id: string;
  title: string;
  conceptId: string;
  modality: 'IMAGE' | 'AUDIO' | 'VIDEO';
  description: string;
  modelProvider: string;
  modelVersion: string;
  promptVersion: string;
  policyVersion: string;
  safetyStatus: 'SAFE' | 'FLAGGED';
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'VALIDATING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  previewText?: string;
}

export interface TeacherMultimodalGovernanceProps {
  initialAssets?: PendingMediaAssetItem[];
  onReviewSubmit?: (assetId: string, action: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED', notes?: string) => void;
}

export const TeacherMultimodalGovernance: React.FC<TeacherMultimodalGovernanceProps> = ({
  initialAssets = [
    {
      id: 'asset-sci-01',
      title: 'Plant Cell Wall Osmosis Demonstration',
      conceptId: 'cell-membrane-and-wall',
      modality: 'VIDEO',
      description: '35-second concept demonstration sequence showing turgor pressure in plant cell walls.',
      modelProvider: 'youva-video-composer',
      modelVersion: 'v2.1',
      promptVersion: 'template-v2.0',
      policyVersion: 'POLICY_V2_ENHANCED',
      safetyStatus: 'SAFE',
      riskTier: 'MEDIUM',
      status: 'VALIDATING',
      previewText: 'Animated clip showing water entering vacuole and pushing against rigid cellulose cell wall.',
    },
    {
      id: 'asset-math-02',
      title: 'Area Model of Rational Multiplication',
      conceptId: 'rational-multiplication',
      modality: 'IMAGE',
      description: '2D grid visualization displaying overlap of 3/5 by 2/3.',
      modelProvider: 'stable-diffusion-xl',
      modelVersion: 'v1.0.0',
      promptVersion: 'template-math-v1.4',
      policyVersion: 'POLICY_V2_ENHANCED',
      safetyStatus: 'SAFE',
      riskTier: 'LOW',
      status: 'VALIDATING',
      previewText: 'SVG schema with 15 partitions (6 highlighted in green).',
    },
  ],
  onReviewSubmit,
}) => {
  const [assets, setAssets] = useState<PendingMediaAssetItem[]>(initialAssets);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [modalitySettings, setModalitySettings] = useState({
    VOICE_ENABLED: true,
    VISION_ENABLED: true,
    VIDEO_ENABLED: true,
  });

  const handleAction = (assetId: string, action: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED') => {
    const notes = reviewNotes[assetId] || '';
    setAssets((prev) =>
      prev.map((item) => (item.id === assetId ? { ...item, status: action } : item)),
    );
    if (onReviewSubmit) {
      onReviewSubmit(assetId, action, notes);
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5 text-indigo-400" />;
      case 'AUDIO':
        return <Headphones className="w-5 h-5 text-emerald-400" />;
      case 'VIDEO':
        return <Video className="w-5 h-5 text-rose-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 text-slate-100 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
            Human Educator Governance
          </span>
          <h2 className="text-2xl font-bold mt-2 text-white">Teacher Multimodal Content Authorization</h2>
          <p className="text-sm text-slate-400 mt-1">
            Review, authorize, or request revisions on AI-generated educational diagrams, narrations, and clips.
          </p>
        </div>

        {/* Classroom Modality Controls (Clause N11.56) */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-4 text-xs">
          <span className="font-semibold text-slate-300">Classroom Modality Switches:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={modalitySettings.VOICE_ENABLED}
              onChange={(e) => setModalitySettings({ ...modalitySettings, VOICE_ENABLED: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Voice</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={modalitySettings.VISION_ENABLED}
              onChange={(e) => setModalitySettings({ ...modalitySettings, VISION_ENABLED: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Vision</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={modalitySettings.VIDEO_ENABLED}
              onChange={(e) => setModalitySettings({ ...modalitySettings, VIDEO_ENABLED: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Video</span>
          </label>
        </div>
      </div>

      {/* Review Queue */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Pending Educational Media Review ({assets.filter((a) => a.status === 'VALIDATING').length})
        </h3>

        {assets.map((asset) => (
          <div
            key={asset.id}
            className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 transition-all hover:border-slate-700"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 mt-1">
                  {getModalityIcon(asset.modality)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{asset.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {asset.conceptId}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        asset.riskTier === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {asset.riskTier} RISK
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{asset.description}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {asset.status === 'APPROVED' && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Approved for Learners
                  </span>
                )}
                {asset.status === 'REJECTED' && (
                  <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full font-semibold">
                    <XCircle className="w-3.5 h-3.5" /> Rejected
                  </span>
                )}
                {asset.status === 'REVISION_REQUESTED' && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-semibold">
                    <RotateCcw className="w-3.5 h-3.5" /> Revision Requested
                  </span>
                )}
                {asset.status === 'VALIDATING' && (
                  <span className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Ready for Teacher Review
                  </span>
                )}
              </div>
            </div>

            {/* Asset Provenance & Metadata Card (Clause N11.57) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Model & Provider</span>
                <span className="font-mono text-slate-200">{asset.modelProvider} ({asset.modelVersion})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Prompt Template</span>
                <span className="font-mono text-slate-200">{asset.promptVersion}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Safety Moderation</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> {asset.safetyStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Policy Boundary</span>
                <span className="font-mono text-slate-200">{asset.policyVersion}</span>
              </div>
            </div>

            {/* Action Bar */}
            {asset.status === 'VALIDATING' && (
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <input
                  type="text"
                  placeholder="Optional educator notes or revision guidance..."
                  value={reviewNotes[asset.id] || ''}
                  onChange={(e) => setReviewNotes({ ...reviewNotes, [asset.id]: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => handleAction(asset.id, 'REJECTED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Asset
                  </button>
                  <button
                    onClick={() => handleAction(asset.id, 'REVISION_REQUESTED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Request Revision
                  </button>
                  <button
                    onClick={() => handleAction(asset.id, 'APPROVED')}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Authorize for Classroom
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
