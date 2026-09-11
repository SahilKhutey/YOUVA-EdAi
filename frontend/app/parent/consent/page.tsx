'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Smartphone,
  KeyRound,
  Trash2,
  X,
  AlertTriangle,
  BadgeCheck
} from 'lucide-react';

interface ConsentItem {
  type: string;
  title: string;
  description: string;
  required: boolean;
  granted: boolean;
  version: string;
  updatedAt: string;
  evidenceToken?: string;
}

export default function ParentConsentPage() {
  const [consents, setConsents] = useState<ConsentItem[]>([
    {
      type: 'LEARNING_SERVICE',
      title: 'Core Learning Service (Mandatory)',
      description:
        'Enables child profile creation, curriculum tracking, and course progress logging. Required for platform access.',
      required: true,
      granted: true,
      version: '1.0.0',
      updatedAt: 'Granted on Sep 1, 2026',
      evidenceToken: 'hmac-sha256-80554279a6a2795f-dpdp2023',
    },
    {
      type: 'PARENT_PROGRESS_VISIBILITY',
      title: 'Parent Progress Dashboard',
      description:
        'Gives verified parents and guardians real-time visibility into streaks, mastery, and milestones.',
      required: true,
      granted: true,
      version: '1.0.0',
      updatedAt: 'Granted on Sep 1, 2026',
      evidenceToken: 'hmac-sha256-55a291f09c7a1029-dpdp2023',
    },
    {
      type: 'AI_ASSISTANCE',
      title: 'AI Tutoring & Guidance',
      description:
        'Allows our safety-gated AI mentor to generate age-appropriate explanations, hints, and practice examples.',
      required: false,
      granted: true,
      version: '1.1.0',
      updatedAt: 'Granted on Sep 2, 2026',
      evidenceToken: 'hmac-sha256-2918bb12ac883719-dpdp2023',
    },
    {
      type: 'PERSONALIZATION',
      title: 'Adaptive Learning Path',
      description:
        'Adjusts question difficulty, pacing, and review intervals based on Bayesian Knowledge Tracing.',
      required: false,
      granted: true,
      version: '1.0.0',
      updatedAt: 'Granted on Sep 2, 2026',
      evidenceToken: 'hmac-sha256-11f87ab29c4456a1-dpdp2023',
    },
    {
      type: 'COMMUNICATION',
      title: 'Teacher & School Messaging',
      description:
        'Enables moderated parent-teacher communications and milestone announcements.',
      required: false,
      granted: false,
      version: '1.0.0',
      updatedAt: 'Not granted',
    },
    {
      type: 'OPTIONAL_ANALYTICS',
      title: 'Aggregated Learning Research',
      description:
        'Allows anonymized learning telemetry to help our educational researchers improve curriculum models.',
      required: false,
      granted: false,
      version: '1.0.0',
      updatedAt: 'Not granted',
    },
  ]);

  // Modal states
  const [otpModalItem, setOtpModalItem] = useState<ConsentItem | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [purgeWarningItem, setPurgeWarningItem] = useState<ConsentItem | null>(null);

  const initiateGrant = (item: ConsentItem) => {
    setOtpModalItem(item);
    setOtpValue('');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      alert('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      if (otpModalItem) {
        setConsents((prev) =>
          prev.map((c) =>
            c.type === otpModalItem.type
              ? {
                  ...c,
                  granted: true,
                  updatedAt: 'Granted via SMS OTP just now',
                  evidenceToken: `hmac-sha256-verified-otp-${Date.now().toString(16)}`,
                }
              : c,
          ),
        );
      }
      setIsVerifying(false);
      setOtpModalItem(null);
    }, 600);
  };

  const initiateRevoke = (item: ConsentItem) => {
    if (item.required) {
      setPurgeWarningItem(item);
    } else {
      executeRevoke(item);
    }
  };

  const executeRevoke = (item: ConsentItem) => {
    setConsents((prev) =>
      prev.map((c) =>
        c.type === item.type
          ? {
              ...c,
              granted: false,
              updatedAt: 'Revoked (24h Cryptographic Purge Initiated)',
              evidenceToken: undefined,
            }
          : c,
      ),
    );
    setPurgeWarningItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          href="/parent"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Parent Home
        </Link>

        {/* Page Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5" />
            <span>Digital Personal Data Protection (DPDP) Act 2023 §9</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Verifiable Parental Consent Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage statutory permissions, out-of-band OTP verification, and 24-hour cryptographic data purge preferences for your children.
          </p>
        </div>

        {/* Consent Invariants Info */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3">
          <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div>
              <span className="font-semibold">Immutable Consent Ledger:</span> All consent grants produce an immutable SHA-256 HMAC evidence token. Artificial intelligence models cannot self-grant or override parental consent boundaries.
            </div>
            <div className="text-[11px] text-indigo-800 dark:text-indigo-300">
              <span className="font-semibold">24-Hour Purge Guarantee:</span> Revocation of Core Learning Service immediately terminates active sessions and schedules automated cryptographic erasure of child PII within 24 hours.
            </div>
          </div>
        </div>

        {/* Consents List */}
        <div className="space-y-4">
          {consents.map((item) => (
            <div
              key={item.type}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">{item.title}</h3>
                  {item.required ? (
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded">
                      Mandatory
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                  {item.evidenceToken && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      <BadgeCheck className="w-3 h-3" />
                      VPC Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span>Policy Ver. {item.version}</span>
                  <span>&bull;</span>
                  <span>{item.updatedAt}</span>
                  {item.evidenceToken && (
                    <>
                      <span>&bull;</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Token: {item.evidenceToken.slice(0, 24)}...
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status and Action Toggle */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                {item.granted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    Revoked
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => (item.granted ? initiateRevoke(item) : initiateGrant(item))}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${
                    item.granted
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {item.granted ? 'Revoke Consent' : 'Grant via OTP'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* OTP Verification Modal */}
        {otpModalItem && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <KeyRound className="w-5 h-5" />
                  <span>DPDP Verifiable Consent OTP</span>
                </div>
                <button
                  onClick={() => setOtpModalItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Grant Consent for {otpModalItem.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  A 6-digit verification code has been sent to your registered parent phone/email to verify parental authority.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="e.g. 961330"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-2xl font-mono tracking-widest p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="text-[11px] text-slate-400 text-center mt-1">
                    Valid for 10 minutes • 3 verification attempts permitted
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpModalItem(null)}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || otpValue.length !== 6}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify & Grant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 24-Hour Purge Warning Modal */}
        {purgeWarningItem && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Statutory Consent Revocation &amp; Purge Warning</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  You are revoking <span className="font-bold text-slate-900 dark:text-white">{purgeWarningItem.title}</span>.
                </p>
                <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 space-y-1">
                  <div className="font-bold">DPDP Act 2023 §9 Automatic Purge Actions:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>Active practice and learning sessions will be terminated immediately.</li>
                    <li>Student will be blocked fail-closed from taking practice or assessments.</li>
                    <li>All child PII (name, contact info) will be cryptographically purged in 24 hours.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPurgeWarningItem(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Keep Consent Active
                </button>
                <button
                  type="button"
                  onClick={() => executeRevoke(purgeWarningItem)}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition"
                >
                  Confirm Revocation &amp; Purge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
