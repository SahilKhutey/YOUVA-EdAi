'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Award,
  Calendar,
  AlertTriangle,
  Mail,
  Shield,
  BookOpen,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  channel: 'IN_APP' | 'EMAIL' | 'PUSH';
}

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/parent/notifications');
        if (res.data && Array.isArray(res.data)) {
          setNotifications(res.data);
        }
      } catch {
        // Safe fallback
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'STUDENT_MILESTONE':
        return <Award className="w-5 h-5 text-indigo-500" />;
      case 'WEEKLY_PROGRESS':
        return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case 'ASSIGNMENT_DUE':
        return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'SAFETY_ESCALATION':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default:
        return <Shield className="w-5 h-5 text-blue-500" />;
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              <Bell className="w-5 h-5" />
              <span>Multi-Channel Notification Center</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-1">Notifications</h1>
            <p className="text-slate-500 text-sm mt-1">
              Real-time updates regarding student progress, assignments, and verified safety notices.
            </p>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <CheckCheck className="w-4 h-4 text-indigo-500" />
            Mark all as read
          </button>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <Bell className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No New Notifications</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You are all caught up! Real-time alerts regarding learning milestones, assignments, and safety updates will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition flex items-start gap-4 ${
                  n.isRead
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 shadow-xs'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-bold ${n.isRead ? 'text-slate-800 dark:text-slate-200' : 'text-indigo-950 dark:text-indigo-100'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 shrink-0">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {n.body}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Channel: {n.channel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
