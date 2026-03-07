"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import api from "@/lib/axios";
import MainLayout from "@/app/components/MainLayout";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Moon,
  Sun,
  Monitor,
  Shield,
  Lock,
  LogOut,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "profile" | "appearance" | "notifications" | "security";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    gradeLevel: user?.gradeLevel || "",
    cognitiveLevel: user?.cognitiveLevel || "TEEN",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        gradeLevel: user.gradeLevel || "",
        cognitiveLevel: user.cognitiveLevel || "TEEN",
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.patch("/users/profile", profileForm);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api.patch("/users/profile", { password: passwordForm.newPassword });
      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your account preferences and security.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "appearance", label: "Appearance", icon: Moon },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "security", label: "Security", icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-border">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all text-left"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm h-fit">
          {message && (
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-2xl mb-6 text-sm",
              message.type === "success" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
            )}>
              {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="flex h-11 w-full rounded-xl border border-input bg-muted px-4 py-2 text-sm cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Grade Level</label>
                    <select
                      value={profileForm.gradeLevel}
                      onChange={(e) => setProfileForm({ ...profileForm, gradeLevel: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select Grade</option>
                      {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={g.toString()}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Cognitive Level</label>
                    <select
                      value={profileForm.cognitiveLevel}
                      onChange={(e) => setProfileForm({ ...profileForm, cognitiveLevel: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="CHILD">Child (Simplified)</option>
                      <option value="TEEN">Teen (Standard)</option>
                      <option value="ADULT">Adult (Advanced)</option>
                    </select>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </form>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all",
                      theme === "light" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
                    )}
                  >
                    <Sun className={cn("h-6 w-6", theme === "light" ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all",
                      theme === "dark" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
                    )}
                  >
                    <Moon className={cn("h-6 w-6", theme === "dark" ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all",
                      theme === "system" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted"
                    )}
                  >
                    <Monitor className={cn("h-6 w-6", theme === "system" ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-medium">System</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Interface</h3>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                  <div>
                    <p className="text-sm font-medium">Dynamic Animations</p>
                    <p className="text-xs text-muted-foreground">Show smooth transitions and micro-animations.</p>
                  </div>
                  <div className="h-6 w-11 bg-primary rounded-full relative">
                    <div className="h-5 w-5 bg-white rounded-full absolute top-0.5 right-0.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Preferences</h3>
                {[
                  { id: "score", title: "Achievement Alerts", desc: "Get notified when you unlock a badge or hit a streak." },
                  { id: "announce", title: "Class Announcements", desc: "Stay updated with messages from your teachers." },
                  { id: "goals", title: "Study Goal Reminders", desc: "Get nudge notifications for your weekly targets." },
                  { id: "system", title: "System Updates", desc: "Occasional news about New features and upgrades." },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-2xl">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="h-6 w-11 bg-muted rounded-full relative cursor-pointer">
                      <div className="h-5 w-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm border border-border" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !passwordForm.newPassword}
                  className="w-full flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  Update Password
                </button>
              </form>

              <div className="pt-6 border-t border-border">
                <p className="text-sm font-semibold mb-2">Account Status</p>
                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 w-fit px-3 py-1 rounded-full text-xs font-bold">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active - Verified
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
