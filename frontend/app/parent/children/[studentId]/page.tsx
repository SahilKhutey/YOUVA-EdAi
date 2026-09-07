'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  GraduationCap,
  Flame,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  MessageSquare,
  Shield,
  Layers,
} from 'lucide-react';

interface TopicMasteryItem {
  id: string;
  title: string;
  subject: string;
  masteryProbability: number;
  difficultyState: string;
  lastReviewed: string;
}

interface StudentDetail {
  id: string;
  name: string;
  gradeLevel: string;
  cognitiveLevel: string;
  stats: {
    totalXp: number;
    currentLevel: number;
    currentStreak: number;
  };
  masteryAverage: number;
  completedActivities: number;
  teacherMessage: string;
  topics: TopicMasteryItem[];
}

export default function ChildDetailPage() {
  const params = useParams();
  const studentId = params?.studentId as string;
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch against /api/parent/children/:studentId
    setTimeout(() => {
      setData({
        id: studentId || 'stu-alex',
        name: studentId === 'stu-emma' ? 'Emma Johnson' : 'Alex Johnson',
        gradeLevel: studentId === 'stu-emma' ? 'Grade 4' : 'Grade 7',
        cognitiveLevel: studentId === 'stu-emma' ? 'CHILD' : 'TEEN',
        stats: {
          totalXp: 3450,
          currentLevel: 8,
          currentStreak: studentId === 'stu-emma' ? 12 : 8,
        },
        masteryAverage: studentId === 'stu-emma' ? 0.86 : 0.74,
        completedActivities: 28,
        teacherMessage:
          studentId === 'stu-emma'
            ? 'Emma showed remarkable curiosity in biodiversity concepts this week!'
            : 'Alex is making solid progress in algebraic terms. Focus on fractions practice before Friday.',
        topics: [
          {
            id: 'top-1',
            title: 'Linear Equations & Variable Systems',
            subject: 'Mathematics',
            masteryProbability: 0.82,
            difficultyState: 'PRACTICING',
            lastReviewed: 'Yesterday',
          },
          {
            id: 'top-2',
            title: 'Fraction Multiplication & Division',
            subject: 'Mathematics',
            masteryProbability: 0.65,
            difficultyState: 'REINFORCING',
            lastReviewed: '2 days ago',
          },
          {
            id: 'top-3',
            title: 'Cellular Structure & Organelles',
            subject: 'Science',
            masteryProbability: 0.91,
            difficultyState: 'MASTERED',
            lastReviewed: '3 days ago',
          },
          {
            id: 'top-4',
            title: 'Critical Reading: Inference & Evidence',
            subject: 'Language Arts',
            masteryProbability: 0.78,
            difficultyState: 'PRACTICING',
            lastReviewed: '4 days ago',
          },
        ],
      });
      setLoading(false);
    }, 350);
  }, [studentId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex items-center justify-center text-slate-500">
        <div className="animate-pulse text-sm font-medium">Loading child educational portfolio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <Link
          href="/parent"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Children Overview
        </Link>

        {/* Child Header Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {data.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{data.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {data.gradeLevel}
                </span>
                <span>&bull;</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-medium">
                  {data.cognitiveLevel} Curriculum Profile
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Streak
              </div>
              <div className="text-lg font-bold text-amber-800 dark:text-amber-200">
                {data.stats.currentStreak} Days
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-indigo-700 dark:text-indigo-400 font-medium flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5" />
                XP Earned
              </div>
              <div className="text-lg font-bold text-indigo-800 dark:text-indigo-200">
                {data.stats.totalXp.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Guidance Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>Teacher Note &amp; Weekly Recommendation</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            &ldquo;{data.teacherMessage}&rdquo;
          </p>
        </div>

        {/* Subject & Topic Mastery Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Topic Mastery &amp; Practice Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Curriculum mastery derived from verified evidence logs and Bayesian Knowledge Tracing.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Overall Mastery</div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round(data.masteryAverage * 100)}%
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {data.topics.map((topic) => (
              <div
                key={topic.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800 gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                      {topic.subject}
                    </span>
                    <h3 className="font-semibold text-sm">{topic.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Reviewed: {topic.lastReviewed}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Status: {topic.difficultyState}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:w-48 justify-end">
                  <div className="w-28 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(topic.masteryProbability * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-10 text-right">
                    {Math.round(topic.masteryProbability * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safe Privacy Footer */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Parent view privacy boundary: Internal AI model tokens, raw prompt chains, and other classmates&apos; metrics are strictly filtered.
          </span>
        </div>
      </div>
    </div>
  );
}
