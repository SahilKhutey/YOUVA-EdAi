'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ShieldCheck, 
  Bell, 
  Flame, 
  Award, 
  ChevronRight, 
  AlertTriangle,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface ChildSummary {
  id: string;
  student: {
    id: string;
    name: string;
    gradeLevel: string;
    cognitiveLevel: string;
    avatarUrl?: string;
  };
  masteryPercentage: number;
  streakDays: number;
  needsAttentionCount: number;
  recentTopic: string;
}

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch or integration with /api/parent/children
    setTimeout(() => {
      setChildren([
        {
          id: 'rel-1',
          student: {
            id: 'stu-alex',
            name: 'Alex Johnson',
            gradeLevel: 'Grade 7',
            cognitiveLevel: 'TEEN',
          },
          masteryPercentage: 74,
          streakDays: 8,
          needsAttentionCount: 2,
          recentTopic: 'Linear Equations & Fractions',
        },
        {
          id: 'rel-2',
          student: {
            id: 'stu-emma',
            name: 'Emma Johnson',
            gradeLevel: 'Grade 4',
            cognitiveLevel: 'CHILD',
          },
          masteryPercentage: 86,
          streakDays: 12,
          needsAttentionCount: 0,
          recentTopic: 'Ecosystems & Food Webs',
        },
      ]);
      setLoading(false);
    }, 400);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>YOUVA SafeGuard Parent Portal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-1">Good morning</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Review your children&apos;s verified learning progress, policy controls, and safety reports.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-3">
            <Link
              href="/parent/consent"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Consent Center
            </Link>
            <Link
              href="/parent/notifications"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </Link>
          </div>
        </header>

        {/* Children Progress Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Your Children
            </h2>
            <span className="text-xs text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">
              {children.length} Enrolled {children.length === 1 ? 'Child' : 'Children'}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                          {child.student.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                            {child.student.name}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {child.student.gradeLevel} &bull; {child.student.cognitiveLevel} Tier
                          </p>
                        </div>
                      </div>

                      {child.needsAttentionCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Needs Attention ({child.needsAttentionCount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                          <Sparkles className="w-3.5 h-3.5" />
                          On Track
                        </span>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                        <div className="text-xs text-slate-500">Curriculum Mastery</div>
                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                          <Award className="w-4 h-4 text-indigo-500" />
                          {child.masteryPercentage}%
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${child.masteryPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                        <div className="text-xs text-slate-500">Learning Streak</div>
                        <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                          {child.streakDays} Days
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 truncate">
                          Active study pattern
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Recent topic:</span>{' '}
                      {child.recentTopic}
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      href={`/parent/children/${child.student.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 text-sm font-semibold transition"
                    >
                      View Student 360 &amp; Mastery
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Privacy Invariant Banner */}
        <section className="bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-emerald-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-xs text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                P3 Privacy &amp; Data Governance Guarantee
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                YOUVA-EdAI guarantees strict parental data isolation. You only see verified educational progress and curated teacher reports. Internal AI reasoning logs, raw safety classifier probabilities, and other students&apos; data are strictly isolated behind cryptographic boundaries.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
