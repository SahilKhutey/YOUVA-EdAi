"use client";

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface ConsequentialButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onConsequentialClick: (idempotencyKey: string) => Promise<void>;
  loadingText?: string;
}

export const ConsequentialButton: React.FC<ConsequentialButtonProps> = ({
  onConsequentialClick,
  loadingText = 'Processing...',
  disabled,
  children,
  className = '',
  ...rest
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isSubmitting || disabled) return;

    setIsSubmitting(true);
    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      await onConsequentialClick(idempotencyKey);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      {...rest}
      disabled={disabled || isSubmitting}
      onClick={handleClick}
      aria-busy={isSubmitting}
      className={`relative inline-flex items-center justify-center transition-all ${
        isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
      } ${className}`}
    >
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
