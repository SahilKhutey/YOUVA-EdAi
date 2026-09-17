"use client";

import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

export interface ConnectivityBannerProps {
  isDegraded?: boolean;
  isStale?: boolean;
  staleSince?: string | Date;
  onRetry?: () => void;
}

export const ConnectivityBanner: React.FC<ConnectivityBannerProps> = ({
  isDegraded = false,
  isStale = false,
  staleSince,
  onRetry,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [justReconnected, setJustReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualRetry = () => {
    setIsReconnecting(true);
    if (onRetry) {
      onRetry();
    }
    setTimeout(() => {
      setIsReconnecting(false);
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
      }
    }, 1200);
  };

  // If online, not degraded, and not stale, show temporary reconnected alert or nothing
  if (isOnline && !isDegraded && !isStale) {
    if (justReconnected) {
      return (
        <div
          role="status"
          aria-live="polite"
          className="w-full bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-sm transition-all duration-300"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Connection restored. All learning systems are synchronized.</span>
          </div>
        </div>
      );
    }
    return null;
  }

  // Offline banner takes highest priority
  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="w-full bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium shadow-md animate-pulse"
      >
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Offline Mode:</strong> Internet connection lost. Learner progress is safely buffered locally and will sync once reconnected.
          </span>
        </div>
        <button
          onClick={handleManualRetry}
          disabled={isReconnecting}
          className="ml-4 px-2.5 py-1 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
          {isReconnecting ? 'Connecting...' : 'Reconnect'}
        </button>
      </div>
    );
  }

  // Degraded backend service banner
  if (isDegraded) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="w-full bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-xs font-medium shadow-sm"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Service Degraded:</strong> Real-time AI recommendations are currently running in fallback mode. Learning progression remains fully active.
          </span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Stale data indicator
  if (isStale) {
    const timeDisplay = staleSince ? ` (cached ${new Date(staleSince).toLocaleTimeString()})` : '';
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full bg-slate-700 text-slate-100 px-4 py-1.5 flex items-center justify-between text-xs font-medium"
      >
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Viewing cached learner data{timeDisplay}. Refreshing in background...
          </span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 underline hover:text-white cursor-pointer"
          >
            Refresh Now
          </button>
        )}
      </div>
    );
  }

  return null;
};
