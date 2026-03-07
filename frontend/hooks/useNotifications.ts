"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { io, Socket } from "socket.io-client";

export interface AppNotification {
    id: string;
    type: "badge" | "xp" | "announcement" | "streak" | "goal" | "info";
    title: string;
    message: string;
    createdAt: string;
}

const BACKEND_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}`;

export function useNotifications() {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const markAllRead = useCallback(() => setUnreadCount(0), []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        const token =
            typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!user || !token) return;

        const socket = io(`${BACKEND_URL}/notifications`, {
            auth: { token },
            transports: ["websocket"],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on("notification", (n: AppNotification) => {
            setNotifications((prev) => [n, ...prev].slice(0, 50)); // keep last 50
            setUnreadCount((c) => c + 1);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user]);

    return { notifications, unreadCount, markAllRead, clearAll };
}
