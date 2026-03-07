"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
    open: boolean;
    onClose: () => void;
}

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
    const pathname = usePathname();

    // Close on route change
    useEffect(() => {
        onClose();
    }, [pathname, onClose]);

    // Prevent body scroll when drawer open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={cn(
                    "fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                )}
                aria-hidden="true"
            />

            {/* Drawer panel */}
            <div
                className={cn(
                    "fixed top-0 left-0 z-[70] h-full w-[240px] bg-background border-r border-border",
                    "transform transition-transform duration-300 ease-in-out md:hidden",
                    open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
                )}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close menu"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Sidebar content (reuse the desktop Sidebar) */}
                <div className="h-full pt-[72px] overflow-y-auto">
                    <Sidebar />
                </div>
            </div>
        </>
    );
}
