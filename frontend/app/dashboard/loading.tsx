import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="w-full h-full min-h-[60vh] flex items-center justify-center p-8">
            <div className="clay-card p-10 flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
                <div className="p-4 bg-primary/10 rounded-full">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <div className="space-y-1 text-center">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Loading Context</h2>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Gathering insights from your Cognitive Twin...</p>
                </div>
            </div>
        </div>
    );
}
