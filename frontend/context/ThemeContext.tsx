"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
    theme: Theme;
    toggle: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "light",
    toggle: () => { },
    setTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    const applyTheme = (t: Theme) => {
        const root = document.documentElement;
        let actualTheme: "light" | "dark" = t === "system"
            ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
            : t;

        if (actualTheme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    // On mount: read from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("theme") as Theme | null;
        const preferred = saved ?? "system";
        setTheme(preferred);
        applyTheme(preferred);
        setMounted(true);
    }, []);

    // Listen for system theme changes if in system mode
    useEffect(() => {
        if (theme !== "system") return;

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const listener = () => applyTheme("system");
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [theme]);

    const toggle = () => {
        const next: Theme = theme === "light" ? "dark" : "light";
        updateTheme(next);
    };

    const updateTheme = (t: Theme) => {
        setTheme(t);
        localStorage.setItem("theme", t);
        applyTheme(t);
    };

    // Prevent flash — render children only after mount
    if (!mounted) return <>{children}</>;

    return (
        <ThemeContext.Provider value={{ theme, toggle, setTheme: updateTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
