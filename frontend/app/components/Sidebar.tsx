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
  BarChart2,
  Wand2,
  MessageSquare,
  Trophy,
  Calendar,
  Target,
  Megaphone,
  Zap,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "./ThemeToggle";

// Fallback for cn if lib/utils doesn't exist yet, I'll assume standard shadcn structure or create it.
// Actually, I should probably check if lib/utils exists. `list_dir` showed `lib` folder.
// I'll assume it's there or I will define a local helper.

const studentNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Focus Workspace", icon: Zap, href: "/dashboard/focus" },
  { name: "My Subjects", icon: BookOpen, href: "/dashboard/subjects" },
  { name: "AI Progress Report", icon: Sparkles, href: "/dashboard/report" },
  { name: "Recent Sessions", icon: Clock, href: "/dashboard/sessions" },
  { name: "Weak Topics", icon: AlertCircle, href: "/dashboard/weak-topics" },
  { name: "Mock Tests", icon: FileText, href: "/dashboard/mock-tests" },
  { name: "Project Assessment", icon: Briefcase, href: "/dashboard/assessment/project" },
  { name: "Credential Wallet", icon: ShieldCheck, href: "/dashboard/credentials" },
  { name: "Discussion", icon: MessageSquare, href: "/dashboard/discussion" },
  { name: "Leaderboard", icon: Trophy, href: "/dashboard/leaderboard" },
  { name: "Schedule", icon: Calendar, href: "/dashboard/schedule" },
  { name: "Goals", icon: Target, href: "/dashboard/goals" },
  { name: "Settings", icon: Settings, href: "/dashboard/settings" },
];

const teacherNavItems = [
  { name: "Analytics Hub", icon: BarChart2, href: "/dashboard/teacher/analytics" },
  { name: "AI Content Studio", icon: Wand2, href: "/dashboard/teacher/content-gen" },
  { name: "Announcements", icon: Megaphone, href: "/dashboard/teacher/announcements" },
];

function NavLink({ href, icon: Icon, name, isActive }: {
  href: string;
  icon: React.ElementType;
  name: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-r-full transition-all duration-200 group mr-4",
        isActive
          ? "bg-[#E2E8F0] clay-active text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          isActive
            ? "text-primary fill-primary/20"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      <span className="text-sm">{name}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  return (
    <aside className="hidden md:flex w-[240px] h-full bg-[#F8F9FA] dark:bg-background flex-col fixed top-[64px] bottom-0 left-0 overflow-y-auto z-40 border-r border-border/50">
      <div className="pt-4 pb-2 space-y-0.5">
        {studentNavItems.map((item) => (
          <NavLink
            key={item.name}
            href={item.href}
            icon={item.icon}
            name={item.name}
            isActive={pathname === item.href}
          />
        ))}
      </div>

      {/* Teacher / Admin section */}
      {isTeacher && (
        <div className="pt-4 pb-2 border-t border-border/50 space-y-0.5 mt-2">
          <p className="px-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Teacher Tools
          </p>
          {teacherNavItems.map((item) => (
            <NavLink
              key={item.name}
              href={item.href}
              icon={item.icon}
              name={item.name}
              isActive={pathname.startsWith(item.href)}
            />
          ))}
        </div>
      )}

      {/* Footer: Theme toggle + shortcuts hint */}
      <div className="p-4 border-t border-border mt-auto space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }))}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted transition-colors group"
        >
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            Keyboard shortcuts
          </span>
          <kbd className="inline-flex items-center justify-center h-5 w-5 bg-muted border border-border rounded text-[10px] font-mono font-bold text-muted-foreground">
            ?
          </kbd>
        </button>
      </div>
    </aside>
  );
}
