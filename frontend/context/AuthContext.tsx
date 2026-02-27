"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = () => {
            const token = localStorage.getItem('token');
            // In a real app, you would validate the token here
            // For now, if there is a token, we assume user is logged in (persisted via localStorage)
            if (!token) {
                // No token, ensure user is null
                setUser(null);
            }
            setIsLoading(false);
        };
        initializeAuth();
    }, []);

    const login = async (email: string, pass: string) => {
        const res = await api.post('/auth/login', { email, password: pass });
        localStorage.setItem('token', res.data.access_token);
        setUser(res.data.user);
        router.push('/dashboard');
    };

    const register = async (email: string, pass: string) => {
        const res = await api.post('/auth/register', { email, password: pass });
        localStorage.setItem('token', res.data.access_token);
        setUser(res.data.user);
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
