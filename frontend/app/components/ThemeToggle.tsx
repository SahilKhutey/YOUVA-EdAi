"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggle } = useTheme();

    return (
        <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
                "relative h-9 w-9 flex items-center justify-center rounded-xl",
                "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
                "transition-all duration-200",
                className,
            )}
        >
            <Sun
                className={cn(
                    "h-4 w-4 absolute transition-all duration-300",
                    theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50",
                )}
            />
            <Moon
                className={cn(
                    "h-4 w-4 absolute transition-all duration-300",
                    theme === "light" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50",
                )}
            />
        </button>
    );
}
