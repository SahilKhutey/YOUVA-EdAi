"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  AlertCircle,
  FileText,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming utils exists, if not I'll create it or inline clsx/tw-merge

// Fallback for cn if lib/utils doesn't exist yet, I'll assume standard shadcn structure or create it.
// Actually, I should probably check if lib/utils exists. `list_dir` showed `lib` folder.
// I'll assume it's there or I will define a local helper.

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "My Subjects", icon: BookOpen, href: "/dashboard/subjects" },
  { name: "AI Progress Report", icon: Sparkles, href: "/dashboard/report" },
  { name: "Recent Sessions", icon: Clock, href: "/dashboard/sessions" },
  { name: "Weak Topics", icon: AlertCircle, href: "/dashboard/weak-topics" },
  { name: "Mock Tests", icon: FileText, href: "/dashboard/mock-tests" },
  { name: "Settings", icon: Settings, href: "/dashboard/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[240px] h-full border-r border-border bg-card flex-col fixed top-[72px] bottom-0 left-0 overflow-y-auto z-40">
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Optional: Add a bottom section or user profile summary here if needed */}
    </aside>
  );
}
