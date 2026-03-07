"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export interface Shortcut {
    keys: string[];        // e.g. ["G", "D"] or ["?"]
    description: string;
    category: string;
}

export const SHORTCUTS: Shortcut[] = [
    // Navigation (G then key)
    { keys: ["G", "D"], description: "Go to Dashboard", category: "Navigation" },
    { keys: ["G", "L"], description: "Go to Learn", category: "Navigation" },
    { keys: ["G", "P"], description: "Go to Progress / Report", category: "Navigation" },
    { keys: ["G", "A"], description: "Go to Analytics", category: "Navigation" },
    { keys: ["G", "G"], description: "Go to Goals", category: "Navigation" },
    { keys: ["G", "S"], description: "Go to Schedule", category: "Navigation" },
    { keys: ["G", "R"], description: "Go to Leaderboard", category: "Navigation" },
    // UI
    { keys: ["?"], description: "Show this shortcuts panel", category: "General" },
    { keys: ["Esc"], description: "Close any modal/panel", category: "General" },
];

const NAV_MAP: Record<string, string> = {
    D: "/dashboard",
    L: "/dashboard/learn",
    P: "/dashboard/report",
    A: "/dashboard/analytics",
    G: "/dashboard/goals",
    S: "/dashboard/schedule",
    R: "/dashboard/leaderboard",
};

export function useKeyboardShortcuts(onOpenPanel: () => void) {
    const router = useRouter();
    const [awaitingG, setAwaitingG] = useState(false);

    const handler = useCallback(
        (e: KeyboardEvent) => {
            // Ignore when typing in inputs, textareas, selects, contenteditable
            const tag = (e.target as HTMLElement)?.tagName;
            const editable = (e.target as HTMLElement)?.isContentEditable;
            if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || editable) return;

            const key = e.key.toUpperCase();

            // Show shortcuts panel
            if (key === "?" || e.key === "?") {
                e.preventDefault();
                onOpenPanel();
                setAwaitingG(false);
                return;
            }

            // Escape — handled natively by the modal, just reset state
            if (e.key === "Escape") {
                setAwaitingG(false);
                return;
            }

            // G prefix navigation
            if (awaitingG) {
                setAwaitingG(false);
                const path = NAV_MAP[key];
                if (path) {
                    e.preventDefault();
                    router.push(path);
                }
                return;
            }

            if (key === "G" && !e.metaKey && !e.ctrlKey && !e.altKey) {
                setAwaitingG(true);
                // Reset G-mode after 1.5s if second key isn't pressed
                setTimeout(() => setAwaitingG(false), 1500);
            }
        },
        [awaitingG, onOpenPanel, router],
    );

    useEffect(() => {
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handler]);

    return { awaitingG };
}
