"use client";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  className?: string; // Allow extending className
}

export default function MainLayout({
  children,
  showSidebar = true,
  className,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Fixed Height 72px */}
      <div className="h-[72px] fixed top-0 w-full z-50">
        <Navbar />
      </div>

      {/* Main Content Area */}
      <div className="pt-[72px] min-h-screen">
        {/* Sidebar - Fixed Position */}
        {showSidebar && <Sidebar />}

        {/* Workspace / Page Content - Pushed by Sidebar width */}
        <main
          className={cn(
            "flex-1 transition-all duration-300 min-h-[calc(100vh-72px)]",
            showSidebar ? "md:ml-[240px]" : "",
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
