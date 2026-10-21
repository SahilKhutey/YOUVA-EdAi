"use client";

import { useState, useCallback } from "react";
import { Menu } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileDrawer from "./MobileDrawer";
import StudyBuddyWidget from "./StudyBuddyWidget";
import { aiMentorEnabled } from "@/lib/practice-errors.mjs";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  className?: string;
}

export default function MainLayout({
  children,
  showSidebar = true,
  className,
}: MainLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar – fixed 64px */}
      <div className="h-[64px] fixed top-0 w-full z-50">
        <Navbar />
      </div>

      {/* Mobile toolbar: hamburger (only shown when sidebar enabled, on small screens) */}
      {showSidebar && (
        <div className="md:hidden fixed top-0 left-0 z-[51] h-[64px] flex items-center pl-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Mobile slide-out drawer */}
      {showSidebar && (
        <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
      )}

      {/* Content area */}
      <div className="pt-[64px] min-h-screen">
        {/* Desktop sidebar – already self-hides on mobile via hidden md:flex */}
        {showSidebar && <Sidebar />}

        {/* Page content - Floating Material 3 Container */}
        <main
          className={cn(
            "flex-1 transition-all duration-300 min-h-[calc(100vh-64px)] p-6",
            showSidebar ? "md:ml-[240px]" : "",
            className,
          )}
        >
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Study Buddy floating widget */}
      {/* Off unless NEXT_PUBLIC_ENABLE_AI_MENTOR=true: it sends what a student types to an AI. */}
      {aiMentorEnabled(process.env.NEXT_PUBLIC_ENABLE_AI_MENTOR) && <StudyBuddyWidget />}
    </div>
  );
}
