"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="clay-card p-10 flex flex-col items-center text-center gap-6 max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Oops! Let's try that again.</h1>
          <p className="text-sm font-medium text-slate-500">
            An unexpected error has occurred in the application.
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="w-full px-8 py-4 clay-btn bg-primary text-white font-bold"
        >
          Recover Session
        </button>
      </div>
    </div>
  );
}
