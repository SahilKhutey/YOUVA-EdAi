'use client';

import React, { useState } from 'react';

interface PassportCapability {
  capabilityId: string;
  name: string;
  proficiency: string;
  issuer: string;
  validatedAt: string;
}

interface PassportExperience {
  experienceId: string;
  title: string;
  organization: string;
  type: string;
  verified: boolean;
}

interface DisclosureToken {
  token: string;
  recipientId: string;
  purpose: string;
  capabilities: string[];
  expiresAt: string;
  revoked: boolean;
}

export default function HumanCapabilityPassportView() {
  const [capabilities] = useState<PassportCapability[]>([
    {
      capabilityId: 'cap_python_science',
      name: 'Python for Scientific Computing',
      proficiency: 'ADVANCED',
      issuer: 'YOUVA Research OS',
      validatedAt: '2026-09-10',
    },
    {
      capabilityId: 'cap_frontend_dev',
      name: 'Frontend Web Development',
      proficiency: 'ADVANCED',
      issuer: 'Delhi Public School RKP',
      validatedAt: '2026-09-12',
    },
    {
      capabilityId: 'cap_ml_eval',
      name: 'Machine Learning Evaluation & Calibration',
      proficiency: 'INTERMEDIATE',
      issuer: 'Universal AI Council',
      validatedAt: '2026-09-15',
    },
  ]);

  const [experiences] = useState<PassportExperience[]>([
    {
      experienceId: 'exp_001',
      title: 'Open Source Accessibility Contributor',
      organization: 'YOUVA Foundation',
      type: 'PROJECT',
      verified: true,
    },
    {
      experienceId: 'exp_002',
      title: 'Cognitive Science Peer Review Assistant',
      organization: 'EduResearch Labs',
      type: 'RESEARCH',
      verified: true,
    },
  ]);

  const [disclosures, setDisclosures] = useState<DisclosureToken[]>([
    {
      token: 'sdt_88af9201c801e912',
      recipientId: 'prov_deepmind_edu',
      purpose: 'Application to AI Safety Research Fellowship',
      capabilities: ['Python for Scientific Computing', 'Machine Learning Evaluation & Calibration'],
      expiresAt: '2026-09-26T18:00:00Z',
      revoked: false,
    },
  ]);

  const [newRecipient, setNewRecipient] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [selectedCapIds, setSelectedCapIds] = useState<string[]>([]);
  const [showCreateDisclosure, setShowCreateDisclosure] = useState(false);

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [artifactUri, setArtifactUri] = useState('');
  const [aiAssistanceDisclosed, setAiAssistanceDisclosed] = useState(false);
  const [aiDetails, setAiDetails] = useState('');

  const handleCreateToken = () => {
    if (!newRecipient || !newPurpose) return;
    const token: DisclosureToken = {
      token: `sdt_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
      recipientId: newRecipient,
      purpose: newPurpose,
      capabilities: capabilities
        .filter((c) => selectedCapIds.includes(c.capabilityId))
        .map((c) => c.name),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      revoked: false,
    };
    setDisclosures([...disclosures, token]);
    setNewRecipient('');
    setNewPurpose('');
    setSelectedCapIds([]);
    setShowCreateDisclosure(false);
  };

  const handleRevokeToken = (tokenStr: string) => {
    setDisclosures(
      disclosures.map((d) => (d.token === tokenStr ? { ...d, revoked: true } : d)),
    );
  };

  return (
    <div className="space-y-6">
      {/* Passport Sovereign Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              SOVEREIGN PASSPORT
            </span>
            <span className="text-xs text-slate-500 font-mono">0x4F92...B31A</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Asha Sharma — Human Capability Passport</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Learner-owned cryptographic passport &bull; Granular selective disclosure &bull; Zero external telemetry leakage
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowEvidenceModal(true)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            Submit Experience Evidence
          </button>
          <button
            onClick={() => setShowCreateDisclosure(true)}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            Create Selective Disclosure
          </button>
        </div>
      </div>

      {/* Selective Disclosure Modal */}
      {showCreateDisclosure && (
        <div className="bg-slate-900 border border-blue-600/50 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Create Purpose-Bound Selective Disclosure</h3>
          <p className="text-xs text-slate-400">
            Share only the specific capabilities required by an opportunity provider. Unselected records, private dialogues, and teacher notes will remain strictly unreachable.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Organization ID</label>
              <input
                type="text"
                placeholder="e.g. prov_deepmind_edu"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Purpose / Opportunity Context</label>
              <input
                type="text"
                placeholder="e.g. Review for Research Residency"
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Disclosed Capabilities</label>
            <div className="space-y-1.5">
              {capabilities.map((c) => (
                <label key={c.capabilityId} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCapIds.includes(c.capabilityId)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCapIds([...selectedCapIds, c.capabilityId]);
                      else setSelectedCapIds(selectedCapIds.filter((id) => id !== c.capabilityId));
                    }}
                    className="rounded bg-slate-950 border-slate-700"
                  />
                  <span>{c.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({c.proficiency})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCreateDisclosure(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateToken}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg"
            >
              Generate Disclosure Token
            </button>
          </div>
        </div>
      )}

      {/* Evidence Submission Modal */}
      {showEvidenceModal && (
        <div className="bg-slate-900 border border-amber-600/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Submit Experience Evidence</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              INVARIANT N22.26
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Submit portfolio evidence. Under Clause N22.26, any material AI assistance used to produce artifacts must be declared.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Artifact URI / Repository Link</label>
            <input
              type="text"
              placeholder="https://github.com/ashasharma/safetypy-interpretability"
              value={artifactUri}
              onChange={(e) => setArtifactUri(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={aiAssistanceDisclosed}
                onChange={(e) => setAiAssistanceDisclosed(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700"
              />
              <span className="font-semibold text-amber-300">Material AI Assistance was used in creating this artifact</span>
            </label>

            {aiAssistanceDisclosed && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">AI Contribution Details (Required)</label>
                <textarea
                  placeholder="Describe what parts were generated by AI (e.g., initial test scaffolding generated via LLM; model architecture and analysis authored manually)."
                  value={aiDetails}
                  onChange={(e) => setAiDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 h-20"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowEvidenceModal(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowEvidenceModal(false)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg"
            >
              Submit for Verification
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Capabilities, Experiences, Active Disclosures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capabilities */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Validated Capabilities ({capabilities.length})
          </h3>
          <div className="space-y-2">
            {capabilities.map((c) => (
              <div key={c.capabilityId} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-white">{c.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-900">
                    {c.proficiency}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Validated by {c.issuer} &bull; {c.validatedAt}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experiences */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Demonstrated Experiences ({experiences.length})
          </h3>
          <div className="space-y-2">
            {experiences.map((exp) => (
              <div key={exp.experienceId} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-white">{exp.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-900">
                    VERIFIED
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{exp.organization}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Type: {exp.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Selective Disclosures */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Selective Disclosures ({disclosures.length})
          </h3>
          <div className="space-y-2">
            {disclosures.map((d) => (
              <div
                key={d.token}
                className={`p-3 rounded-lg border text-xs ${
                  d.revoked
                    ? 'bg-slate-950/50 border-slate-800 text-slate-500'
                    : 'bg-slate-950 border-slate-700 text-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-[11px] font-semibold text-blue-300">{d.recipientId}</span>
                  {d.revoked ? (
                    <span className="text-[10px] text-rose-400 font-mono">REVOKED</span>
                  ) : (
                    <button
                      onClick={() => handleRevokeToken(d.token)}
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{d.purpose}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Disclosed: {d.capabilities.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
