import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50/50 backdrop-blur-sm z-50">
            <div className="clay-card p-10 flex flex-col items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <div className="space-y-1 text-center">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Loading</h2>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Please wait a moment...</p>
                </div>
            </div>
        </div>
    );
}
