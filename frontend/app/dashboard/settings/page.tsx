"use client";

import MainLayout from "@/app/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Moon, Sun, Bell, Shield, Trash2, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    // Init theme from document
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">
          Manage your preferences and account settings.
        </p>

        <div className="space-y-6">
          {/* Appearance Section */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
              <Sun className="h-5 w-5" /> Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Dark Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes.
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${theme === "dark" ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5" /> Notifications
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">
                  Email Notifications
                </h3>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your learning progress.
                </p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${notifications ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          </section>

          {/* Account Section */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" /> Account
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <h3 className="font-medium text-foreground">Email Address</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                  Managed
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="font-medium text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Irreversible actions.
                  </p>
                </div>
                <button className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors text-sm font-medium flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </section>

          <div className="flex justify-end mt-8">
            <button
              onClick={logout}
              className="px-6 py-2.5 bg-muted text-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
