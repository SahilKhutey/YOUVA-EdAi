"use client";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import api from "@/lib/axios";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any>([]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      fetchGamificationData();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    try {
      const [statsRes, badgesRes] = await Promise.all([
        api.get("/gamification/stats"),
        api.get("/gamification/badges"),
      ]);
      setStats(statsRes.data);
      setBadges(badgesRes.data);
    } catch (error) {
      console.error("Failed to fetch gamification data", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {};
      if (name) payload.name = name;
      if (password) payload.password = password;

      const res = await api.patch("/users/profile", payload);
      setMessage("Profile updated successfully!");

      // Optionally refresh user context (requires AuthContext update or re-login)
      // For MVP, just showing success.
    } catch (error) {
      console.error(error);
      setMessage("Failed to update profile.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Your Profile</h1>

      <div className="bg-card shadow-sm rounded-lg p-6 border border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Email (Cannot be changed)
            </label>
            <input
              type="text"
              disabled
              value={user?.email || ""}
              className="mt-1 block w-full rounded-md border-input bg-muted text-muted-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm p-2 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm p-2 border"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              New Password (Leave blank to keep current)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm p-2 border"
              placeholder="********"
            />
          </div>

          {message && (
            <div
              className={`text-sm ${message.includes("success") ? "text-secondary" : "text-destructive"}`}
            >
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Gamification Section */}
      <div className="mt-8 bg-card shadow-sm rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Your Learning Journey
        </h2>

        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-muted p-4 rounded-xl flex flex-col items-center justify-center border border-border">
              <span className="text-sm text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                Current Level
              </span>
              <span className="text-4xl font-black text-primary">
                {stats.currentLevel}
              </span>
            </div>
            <div className="bg-muted p-4 rounded-xl flex flex-col items-center justify-center border border-border">
              <span className="text-sm text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                Total XP
              </span>
              <span className="text-4xl font-black text-secondary">
                {stats.totalXp}
              </span>
            </div>
            <div className="bg-muted p-4 rounded-xl flex flex-col items-center justify-center border border-border">
              <span className="text-sm text-muted-foreground uppercase font-semibold tracking-wider mb-1">
                Current Streak
              </span>
              <span className="text-4xl font-black text-orange-500">
                {stats.currentStreak} 🔥
              </span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-center py-4">
            Loading stats...
          </div>
        )}

        {stats && (
          <div className="mb-8 p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex justify-between items-end mb-2">
              <div className="text-sm font-medium text-foreground">
                Progress to Level {stats.currentLevel + 1}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.nextLevelXp - stats.totalXp} XP needed
              </div>
            </div>
            <div className="w-full bg-border rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-1000"
                style={{ width: `${stats.progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <h3 className="text-xl font-bold text-foreground mb-4">
          Badges Earned
        </h3>
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.map((badge: any, i: number) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center p-4 bg-muted rounded-xl border border-border text-center"
              >
                <div className="text-3xl mb-2">
                  {badge.icon === "star"
                    ? "⭐"
                    : badge.icon === "award"
                      ? "🏆"
                      : badge.icon === "flame"
                        ? "🔥"
                        : badge.icon === "flame-hot"
                          ? "☄️"
                          : "🏅"}
                </div>
                <div className="font-semibold text-sm text-foreground">
                  {badge.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {badge.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground p-4 bg-muted rounded-xl border border-border text-center">
            You haven't earned any badges yet. Start practicing to earn some!
          </div>
        )}
      </div>
    </div>
  );
}
