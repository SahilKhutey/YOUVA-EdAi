"use client";

import { useEffect, useCallback, useState } from "react";
import { X, Keyboard } from "lucide-react";
import { useKeyboardShortcuts, SHORTCUTS } from "@/hooks/useKeyboardShortcuts";

function KbdKey({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="inline-flex items-center justify-center min-w-[1.6rem] h-6 px-1.5 bg-muted border border-border rounded text-[11px] font-mono font-bold text-foreground leading-none">
            {children}
        </kbd>
    );
}

function ShortcutRow({ shortcut }: { shortcut: (typeof SHORTCUTS)[0] }) {
    return (
        <div className="flex items-center justify-between py-2 px-1">
            <span className="text-sm text-muted-foreground">{shortcut.description}</span>
            <div className="flex items-center gap-1">
                {shortcut.keys.map((k, i) => (
                    <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-muted-foreground text-xs">then</span>}
                        <KbdKey>{k}</KbdKey>
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function ShortcutsModal() {
    const [open, setOpen] = useState(false);
    const { awaitingG } = useKeyboardShortcuts(() => setOpen(true));

    const close = useCallback(() => setOpen(false), []);

    // Esc closes modal
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [close]);

    // Group by category
    const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

    return (
        <>
            {/* G-mode indicator toast */}
            {awaitingG && (
                <div className="fixed bottom-4 right-4 z-[9998] bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    Waiting for navigation key…
                </div>
            )}

            {/* Modal overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={(e) => e.target === e.currentTarget && close()}
                >
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Keyboard className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">Keyboard Shortcuts</p>
                                    <p className="text-xs text-muted-foreground">Press <KbdKey>?</KbdKey> anytime to reopen</p>
                                </div>
                            </div>
                            <button
                                onClick={close}
                                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Shortcut list */}
                        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            {categories.map((cat) => (
                                <div key={cat}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
                                        {cat}
                                    </p>
                                    <div className="divide-y divide-border">
                                        {SHORTCUTS.filter((s) => s.category === cat).map((s) => (
                                            <ShortcutRow key={s.keys.join("+")} shortcut={s} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-3 border-t border-border bg-muted/30">
                            <p className="text-xs text-muted-foreground text-center">
                                Shortcuts are disabled when typing in input fields
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
