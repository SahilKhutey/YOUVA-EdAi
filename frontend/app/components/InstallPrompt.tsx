"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        // Already installed as PWA
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setInstalled(true);
            return;
        }

        // Dismissed before — don't show again for 7 days
        const dismissed = localStorage.getItem("pwa-dismiss");
        if (dismissed && Date.now() - Number(dismissed) < 7 * 86400000) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setInstalled(true);
        setVisible(false);
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        localStorage.setItem("pwa-dismiss", String(Date.now()));
        setVisible(false);
    };

    if (!visible || installed) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Smartphone className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                        Install Youva EdAi
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Add to your home screen for the best experience
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleInstall}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Install
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
