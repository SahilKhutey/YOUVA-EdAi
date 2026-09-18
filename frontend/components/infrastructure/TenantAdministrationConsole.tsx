"use client";

import React, { useState } from "react";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Pause,
  Play,
  PlusCircle,
  Users,
  Settings2,
  ChevronRight,
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  state: "REQUESTED" | "REVIEWED" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  adminEmail: string;
  plan: string;
  seats: number;
  aiTutorEnabled: boolean;
  safetyModerationLocked: boolean;
}

export function TenantAdministrationConsole() {
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: "tenant-dps-rkp",
      name: "Delhi Public School R.K. Puram",
      slug: "dps-rkp",
      state: "ACTIVE",
      adminEmail: "principal@dpsrkp.edu.in",
      plan: "INSTITUTIONAL_ENTERPRISE",
      seats: 500,
      aiTutorEnabled: true,
      safetyModerationLocked: true,
    },
    {
      id: "tenant-modern-vv",
      name: "Modern School Vasant Vihar",
      slug: "modern-vv",
      state: "ACTIVE",
      adminEmail: "admin@modernschool.edu.in",
      plan: "SCHOOL_STANDARD",
      seats: 250,
      aiTutorEnabled: true,
      safetyModerationLocked: true,
    },
    {
      id: "tenant-tagore-intl",
      name: "Tagore International School",
      slug: "tagore-intl",
      state: "REQUESTED",
      adminEmail: "director@tagoreint.ac.in",
      plan: "SCHOOL_STANDARD",
      seats: 150,
      aiTutorEnabled: false,
      safetyModerationLocked: true,
    },
  ]);

  const [selectedTenant, setSelectedTenant] = useState<Tenant>(tenants[0]);
  const [notice, setNotice] = useState<string | null>(null);

  const handleReviewTenant = (id: string, approve: boolean) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, state: approve ? "ACTIVE" : "DEACTIVATED" }
          : t
      )
    );
    setNotice(
      approve
        ? "Tenant request approved and transitioned directly to ACTIVE."
        : "Tenant request rejected and DEACTIVATED."
    );
  };

  const handleToggleSuspend = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = t.state === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          return { ...t, state: nextState };
        }
        return t;
      })
    );
    setNotice("Tenant lifecycle status mutated successfully.");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Tenant Administration Console</h2>
            <p className="text-sm font-medium text-slate-500">
              Clause N14.11 Provisioning Lifecycle • Platform vs. Tenant Policy Hierarchy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 text-xs font-bold text-indigo-900">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          Server-Derived Multi-Tenant Context
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Tenant List + Tenant Detail & Policy Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Tenant List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Managed Institutional Tenants ({tenants.length})
          </h3>
          {tenants.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTenant(t)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                selectedTenant.id === t.id
                  ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200 shadow-sm"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-sm text-slate-900 truncate">{t.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                    t.state === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : t.state === "REQUESTED"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {t.state}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">{t.slug}</p>
            </div>
          ))}
        </div>

        {/* Right 2 Cols: Tenant Detail & Policy Hierarchy */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedTenant.name}</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedTenant.id} • Admin: {selectedTenant.adminEmail}</p>
              </div>

              {/* Lifecycle Actions */}
              <div className="flex items-center gap-2">
                {selectedTenant.state === "REQUESTED" ? (
                  <>
                    <button
                      onClick={() => handleReviewTenant(selectedTenant.id, true)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                    >
                      Approve Provisioning
                    </button>
                    <button
                      onClick={() => handleReviewTenant(selectedTenant.id, false)}
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleToggleSuspend(selectedTenant.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      selectedTenant.state === "ACTIVE"
                        ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    }`}
                  >
                    {selectedTenant.state === "ACTIVE" ? (
                      <>
                        <Pause className="h-3.5 w-3.5" /> Suspend Tenant
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" /> Reactivate Tenant
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Quota & Plan Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-white p-3.5 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Plan Tier</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{selectedTenant.plan}</p>
              </div>
              <div className="rounded-xl bg-white p-3.5 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Allocated Seats</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{selectedTenant.seats} Learners</p>
              </div>
              <div className="rounded-xl bg-white p-3.5 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">AI Features</span>
                <p className="text-sm font-black text-emerald-700 mt-0.5">
                  {selectedTenant.aiTutorEnabled ? "Active (Governed)" : "Disabled"}
                </p>
              </div>
            </div>

            {/* Policy Hierarchy Locks (Clause N14.13) */}
            <div className="rounded-xl bg-indigo-50/70 border border-indigo-200 p-4">
              <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5 mb-2">
                <Lock className="h-4 w-4 text-indigo-700" />
                Platform Policy Hierarchy Enforcement (Clause N14.13)
              </h4>
              <p className="text-xs text-indigo-900 mb-3 leading-relaxed">
                Platform Safety Policy strictly overrides local tenant preferences. The following rules are server-enforced and cannot be altered by tenant administrators:
              </p>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>10-Category Child Safety Moderation (LOCKED ON)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Statutory Parental DPDP Consent Gate (LOCKED ON)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Autonomous Minor Purchases Prohibited (LOCKED OFF)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>AI Unilateral Mastery Mutation Prohibited (LOCKED OFF)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
