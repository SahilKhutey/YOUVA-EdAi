"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Search } from "lucide-react";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-border h-[64px] flex items-center w-full z-50 relative">
      <div className="w-full mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo Area */}
        <div className="flex items-center gap-4 min-w-[240px]">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">Y</span>
            </div>
            <span className="text-xl font-medium text-foreground tracking-tight">
              Youva EdAi
            </span>
          </Link>
        </div>

        {/* Center Search (Google Style Pill to Clay Pill) */}
        {user && (
          <div className="hidden md:flex flex-1 max-w-[720px] px-8">
            <div className="w-full flex items-center bg-[#F0F4F8] dark:bg-[#303134] rounded-full px-4 py-2 clay-input transition-all">
              <Search className="h-5 w-5 text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder="Search EdAi or type a command (⌘K)"
                className="bg-transparent border-none outline-none w-full text-foreground placeholder-muted-foreground text-base focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <NotificationBell />
              {/* Cmd+K search trigger */}
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                title="Search (⌘K)"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
                <kbd className="ml-1 text-[10px] font-mono bg-background border border-border rounded px-1">⌘K</kbd>
              </button>
              <ThemeToggle />
              <button
                onClick={logout}
                className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
              >
                Logout
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {user.email?.[0].toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-medium bg-primary text-white px-5 py-2.5 clay-btn"
              >
                Sign up
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-background border-b border-border p-4 md:hidden shadow-lg flex flex-col gap-2 animate-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto">
          {!user && (
            <>
              <Link
                href="#features"
                className="text-base font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-muted"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-base font-medium text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-muted"
              >
                How it Works
              </Link>
              <div className="h-px bg-border my-1" />
            </>
          )}

          {user ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu
              </div>
              <Link
                href="/dashboard"
                className="text-base font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted"
              >
                Dashboard Overview
              </Link>
              <Link
                href="/dashboard/subjects"
                className="text-base font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted"
              >
                My Subjects
              </Link>
              <Link
                href="/dashboard/sessions"
                className="text-base font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted"
              >
                Recent Sessions
              </Link>
              <Link
                href="/dashboard/weak-topics"
                className="text-base font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted"
              >
                Weak Topics
              </Link>
              <Link
                href="/dashboard/mock-tests"
                className="text-base font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted"
              >
                Mock Tests
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-base font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted"
              >
                Settings
              </Link>
              <div className="h-px bg-border my-1" />
              <button
                onClick={logout}
                className="text-base font-medium text-left text-destructive px-4 py-2 rounded-lg hover:bg-muted"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-base font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="text-base font-medium bg-primary text-white px-4 py-2 text-center clay-btn"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
