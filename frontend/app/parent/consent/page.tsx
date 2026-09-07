'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';

interface ConsentItem {
  type: string;
  title: string;
  description: string;
  required: boolean;
  granted: boolean;
  version: string;
  updatedAt: string;
}

export default function ParentConsentPage() {
  const [consents, setConsents] = useState<ConsentItem[]>([
    {
      type: 'LEARNING_SERVICE',
      title: 'Core Learning Service',
      description:
        'Enables child profile creation, curriculum tracking, and course progress logging.',
      required: true,
      granted: true,
      version: '1.0.0',
      updatedAt: 'Granted on Sep 1, 2026',
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

  const toggleConsent = (type: string) => {
    setConsents((prev) =>
      prev.map((item) => {
        if (item.type === type) {
          if (item.required && item.granted) {
            alert('Core educational consent is mandatory to retain learning platform access.');
            return item;
          }
          const nextState = !item.granted;
          return {
            ...item,
            granted: nextState,
            updatedAt: nextState ? `Granted just now` : `Revoked just now`,
          };
        }
        return item;
      }),
    );
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
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>COPPA &amp; Digital Safety Trust Layer</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Parental Consent Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage granular permissions for AI assistance, adaptive personalization, and communications for your children.
          </p>
        </div>

        {/* Consent Invariants Info */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3">
          <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Immutable Consent Ledger:</span> All grant and revocation operations are recorded in an auditable compliance log. Artificial intelligence models cannot self-grant or override parental consent boundaries.
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
                      Required
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span>Policy Ver. {item.version}</span>
                  <span>&bull;</span>
                  <span>{item.updatedAt}</span>
                </div>
              </div>

              {/* Status and Action Toggle */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                {item.granted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Granted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    Revoked
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => toggleConsent(item.type)}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${
                    item.granted
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {item.granted ? 'Revoke Consent' : 'Grant Consent'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
